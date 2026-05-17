# app/Websocket/tracking_manager.py

from fastapi import WebSocket
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)


class TrackingConnectionManager:
    """
    Manages WebSocket connections for ambulance live tracking.
    Organizes connections into tracking rooms by emergency_request_id.
    """

    def __init__(self):
        """
        Initialize the tracking manager.
        tracking_rooms: Dict[str, List[WebSocket]] - Maps emergency_request_id to list of connected clients
        """
        self.tracking_rooms: Dict[str, List[WebSocket]] = {}

    async def connect_to_tracking(self, emergency_request_id: str, websocket: WebSocket):
        """
        Add a client to a tracking room.
        
        Args:
            emergency_request_id: The emergency request ID to track
            websocket: The WebSocket connection to add
        """
        await websocket.accept()
        
        if emergency_request_id not in self.tracking_rooms:
            self.tracking_rooms[emergency_request_id] = []
            logger.info(f"Created new tracking room for emergency request {emergency_request_id}")
        
        self.tracking_rooms[emergency_request_id].append(websocket)
        logger.info(
            f"Client connected to tracking room {emergency_request_id}. "
            f"Total clients in room: {len(self.tracking_rooms[emergency_request_id])}"
        )
        
        # Send initial connection confirmation
        try:
            await websocket.send_json({
                "type": "connection_established",
                "emergency_request_id": emergency_request_id,
                "message": "Connected to tracking room"
            })
        except Exception as e:
            logger.error(f"Failed to send connection confirmation: {e}")

    async def disconnect_from_tracking(self, emergency_request_id: str, websocket: WebSocket):
        """
        Remove a client from a tracking room.
        
        Args:
            emergency_request_id: The emergency request ID
            websocket: The WebSocket connection to remove
        """
        if emergency_request_id in self.tracking_rooms:
            if websocket in self.tracking_rooms[emergency_request_id]:
                self.tracking_rooms[emergency_request_id].remove(websocket)
                logger.info(
                    f"Client disconnected from tracking room {emergency_request_id}. "
                    f"Remaining clients: {len(self.tracking_rooms[emergency_request_id])}"
                )
            
            # Clean up empty rooms
            if not self.tracking_rooms[emergency_request_id]:
                del self.tracking_rooms[emergency_request_id]
                logger.info(f"Tracking room {emergency_request_id} cleaned up (no clients remaining)")

    async def broadcast_location_update(self, emergency_request_id: str, location_data: dict):
        """
        Broadcast ambulance location update to all clients in a tracking room.
        
        Args:
            emergency_request_id: The emergency request ID
            location_data: Dictionary containing location information (latitude, longitude, timestamp, etc.)
        """
        if emergency_request_id not in self.tracking_rooms:
            logger.warning(f"No tracking room found for emergency request {emergency_request_id}")
            return
        
        message = {
            "type": "location_update",
            "emergency_request_id": emergency_request_id,
            "data": location_data
        }
        
        disconnected_clients = []
        
        for websocket in self.tracking_rooms[emergency_request_id]:
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(
                    f"Failed to send location update to client in room {emergency_request_id}: {e}"
                )
                disconnected_clients.append(websocket)
        
        # Clean up disconnected clients
        for websocket in disconnected_clients:
            await self.disconnect_from_tracking(emergency_request_id, websocket)
        
        if disconnected_clients:
            logger.info(
                f"Removed {len(disconnected_clients)} disconnected clients from room {emergency_request_id}"
            )

    async def broadcast_status_change(self, emergency_request_id: str, status_data: dict):
        """
        Broadcast ambulance status change to all clients in a tracking room.
        
        Args:
            emergency_request_id: The emergency request ID
            status_data: Dictionary containing status information (status, timestamp, etc.)
        """
        if emergency_request_id not in self.tracking_rooms:
            logger.warning(f"No tracking room found for emergency request {emergency_request_id}")
            return
        
        message = {
            "type": "status_change",
            "emergency_request_id": emergency_request_id,
            "data": status_data
        }
        
        disconnected_clients = []
        
        for websocket in self.tracking_rooms[emergency_request_id]:
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(
                    f"Failed to send status change to client in room {emergency_request_id}: {e}"
                )
                disconnected_clients.append(websocket)
        
        # Clean up disconnected clients
        for websocket in disconnected_clients:
            await self.disconnect_from_tracking(emergency_request_id, websocket)
        
        if disconnected_clients:
            logger.info(
                f"Removed {len(disconnected_clients)} disconnected clients from room {emergency_request_id}"
            )

    async def send_tracking_stopped(self, emergency_request_id: str, reason: str):
        """
        Send tracking stopped message to all clients in a tracking room and close connections.
        
        Args:
            emergency_request_id: The emergency request ID
            reason: Reason why tracking was stopped
        """
        if emergency_request_id not in self.tracking_rooms:
            logger.warning(f"No tracking room found for emergency request {emergency_request_id}")
            return
        
        message = {
            "type": "tracking_stopped",
            "emergency_request_id": emergency_request_id,
            "reason": reason
        }
        
        # Send message to all clients
        for websocket in self.tracking_rooms[emergency_request_id][:]:  # Create a copy of the list
            try:
                await websocket.send_json(message)
                logger.info(f"Sent tracking stopped message to client in room {emergency_request_id}")
            except Exception as e:
                logger.error(
                    f"Failed to send tracking stopped message to client in room {emergency_request_id}: {e}"
                )
        
        # Clean up the entire room
        del self.tracking_rooms[emergency_request_id]
        logger.info(f"Tracking room {emergency_request_id} closed. Reason: {reason}")

    def get_room_client_count(self, emergency_request_id: str) -> int:
        """
        Get the number of clients connected to a tracking room.
        
        Args:
            emergency_request_id: The emergency request ID
            
        Returns:
            Number of connected clients (0 if room doesn't exist)
        """
        if emergency_request_id in self.tracking_rooms:
            return len(self.tracking_rooms[emergency_request_id])
        return 0

    def get_active_rooms(self) -> List[str]:
        """
        Get list of all active tracking room IDs.
        
        Returns:
            List of emergency_request_ids with active tracking rooms
        """
        return list(self.tracking_rooms.keys())


# Global instance
tracking_manager = TrackingConnectionManager()
