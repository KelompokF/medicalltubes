# app/websocket/manager.py
import json
import asyncio
from fastapi import WebSocket
from typing import Dict, List


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self._initialized = True

    async def initialize(self):
        """No-op initialize: Redis removed, use in-memory dispatch only."""
        self._initialized = True

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()

        if user_id not in self.active_connections:
            self.active_connections[user_id] = []

        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)

            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_message(self, user_id: str, message: dict):
        # In-memory dispatch only
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