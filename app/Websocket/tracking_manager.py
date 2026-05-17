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

    def _validate_emergency_request_id(self, emergency_request_id: str) -> None:
        """Validate emergency_request_id is not None or empty."""
        if not emergency_request_id or not isinstance(emergency_request_id, str):
            raise ValueError("emergency_request_id must be a non-empty string")

    async def connect_to_tracking(self, emergency_request_id: str, websocket: WebSocket):
        """
        Add a client to a tracking room.
        
        Args:
            emergency_request_id: The emergency request ID to track
            websocket: The WebSocket connection to add
        """
        self._validate_emergency_request_id(emergency_request_id)
        await websocket.accept()
        
        if emergency_request_id not in self.tracking_rooms:
            self.tracking_rooms[emergency_request_id] = []
            logger.info(f"Created new tracking room for emergency request {emergency_request_id}")
        
        # Send initial connection confirmation before adding to room
        try:
            await websocket.send_json({
                "type": "connection_established",
                "emergency_request_id": emergency_request_id,
                "message": "Connected to tracking room"
            })
            # Only add to room if confirmation was successful
            self.tracking_rooms[emergency_request_id].append(websocket)
            logger.info(
                f"Client connected to tracking room {emergency_request_id}. "
                f"Total clients in room: {len(self.tracking_rooms[emergency_request_id])}"
            )
        except Exception as e:
            logger.error(f"Failed to send connection confirmation: {e}")
            # Don't add the connection to the room if confirmation failed

    async def disconnect_from_tracking(self, emergency_request_id: str, websocket: WebSocket):
        """
        Remove a client from a tracking room.
        
        Args:
            emergency_request_id: The emergency request ID
            websocket: The WebSocket connection to remove
        """
        self._validate_emergency_request_id(emergency_request_id)
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

    async def _broadcast_to_room(self, emergency_request_id: str, message_type: str, data: dict):
        """
        Private method to broadcast a message to all clients in a tracking room.
        
        Args:
            emergency_request_id: The emergency request ID
            message_type: Type of message (e.g., 'location_update', 'status_change')
            data: Data to broadcast
        """
        if emergency_request_id not in self.tracking_rooms:
            logger.warning(f"No tracking room found for emergency request {emergency_request_id}")
            return
        
        message = {
            "type": message_type,
            "emergency_request_id": emergency_request_id,
            "data": data
        }
        
        disconnected_clients = []
        
        for websocket in self.tracking_rooms[emergency_request_id]:
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(
                    f"Failed to send {message_type} to client in room {emergency_request_id}: {e}"
                )
                disconnected_clients.append(websocket)
        
        # Clean up disconnected clients
        for websocket in disconnected_clients:
            await self.disconnect_from_tracking(emergency_request_id, websocket)
        
        if disconnected_clients:
            logger.info(
                f"Removed {len(disconnected_clients)} disconnected clients from room {emergency_request_id}"
            )

    async def broadcast_location_update(self, emergency_request_id: str, location_data: dict):
        """
        Broadcast ambulance location update to all clients in a tracking room.
        
        Args:
            emergency_request_id: The emergency request ID
            location_data: Dictionary containing location information (latitude, longitude, timestamp, etc.)
        """
        self._validate_emergency_request_id(emergency_request_id)
        await self._broadcast_to_room(emergency_request_id, "location_update", location_data)

    async def broadcast_status_change(self, emergency_request_id: str, status_data: dict):
        """
        Broadcast ambulance status change to all clients in a tracking room.
        
        Args:
            emergency_request_id: The emergency request ID
            status_data: Dictionary containing status information (status, timestamp, etc.)
        """
        self._validate_emergency_request_id(emergency_request_id)
        await self._broadcast_to_room(emergency_request_id, "status_change", status_data)

    async def send_tracking_stopped(self, emergency_request_id: str, reason: str):
        """
        Send tracking stopped message to all clients in a tracking room and close connections.
        
        Args:
            emergency_request_id: The emergency request ID
            reason: Reason why tracking was stopped
        """
        self._validate_emergency_request_id(emergency_request_id)
        if emergency_request_id not in self.tracking_rooms:
            logger.warning(f"No tracking room found for emergency request {emergency_request_id}")
            return
        
        message = {
            "type": "tracking_stopped",
            "emergency_request_id": emergency_request_id,
            "reason": reason
        }
        
        # Send message to all clients and close connections
        for websocket in self.tracking_rooms[emergency_request_id][:]:  # Create a copy of the list
            try:
                await websocket.send_json(message)
                logger.info(f"Sent tracking stopped message to client in room {emergency_request_id}")
            except Exception as e:
                logger.error(
                    f"Failed to send tracking stopped message to client in room {emergency_request_id}: {e}"
                )
            
            # Close the WebSocket connection
            try:
                await websocket.close()
            except Exception as e:
                logger.error(f"Failed to close WebSocket connection: {e}")
        
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
        self._validate_emergency_request_id(emergency_request_id)
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
