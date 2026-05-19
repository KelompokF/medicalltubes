# app/websocket/manager.py
import json
import asyncio
import os
from fastapi import WebSocket
from typing import Dict, List

import redis.asyncio as redis

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        
        # Redis setup
        self.redis_client = None
        self.pubsub = None
        self.use_redis = False
        self._listener_task = None
        self._initialized = False

    async def initialize(self):
        """Initialize Redis connection if possible"""
        if self._initialized:
            return
            
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        try:
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            await self.redis_client.ping()
            self.pubsub = self.redis_client.pubsub()
            self.use_redis = True
            print(f"Connected to Redis at {redis_url} for WebSockets")
            
            # Subscribe to a dummy channel to start the listener loop safely
            await self.pubsub.subscribe("system:ping")
            
            # Start background listener task
            self._listener_task = asyncio.create_task(self._listen_to_redis())
        except Exception as e:
            print(f"Failed to connect to Redis: {e}. Falling back to in-memory WebSocket manager.")
            self.use_redis = False
            
        self._initialized = True

    async def _listen_to_redis(self):
        """Listen to subscribed channels and broadcast to local websockets"""
        if not self.use_redis or not self.pubsub:
            return
            
        try:
            async for message in self.pubsub.listen():
                if message["type"] == "message":
                    channel = message["channel"]
                    data = message["data"]
                    
                    if channel.startswith("user:"):
                        user_id = channel.split("user:")[1]
                        
                        # Send to local connections
                        if user_id in self.active_connections:
                            msg_dict = json.loads(data)
                            dead_conns = []
                            for connection in self.active_connections[user_id]:
                                try:
                                    await connection.send_json(msg_dict)
                                except Exception:
                                    dead_conns.append(connection)
                            
                            for c in dead_conns:
                                self.disconnect(user_id, c)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"Redis listener error: {e}")
            await asyncio.sleep(5)
            if self.use_redis:
                self._listener_task = asyncio.create_task(self._listen_to_redis())

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        
        # Initialize redis on first connection if not done yet
        if not self._initialized:
            await self.initialize()

        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
            # Subscribe to the user's channel if using Redis
            if self.use_redis and self.pubsub:
                await self.pubsub.subscribe(f"user:{user_id}")
                
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            
            # If no more connections for this user on this instance, unsubscribe
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                if self.use_redis and self.pubsub:
                    # Fire and forget unsubscribe
                    asyncio.create_task(self.pubsub.unsubscribe(f"user:{user_id}"))

    async def send_message(self, user_id: str, message: dict):
        # Ensure initialization happened (e.g. if send_message is called before any connects)
        if not self._initialized:
            await self.initialize()

        if self.use_redis and self.redis_client:
            # Publish to Redis, so all instances receive it
            await self.redis_client.publish(f"user:{user_id}", json.dumps(message))
        else:
            # Fallback to local in-memory dispatch
            if user_id in self.active_connections:
                dead_conns = []
                for connection in self.active_connections[user_id]:
                    try:
                        await connection.send_json(message)
                    except Exception:
                        dead_conns.append(connection)
                
                for c in dead_conns:
                    self.disconnect(user_id, c)

manager = ConnectionManager()