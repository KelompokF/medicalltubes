# Ambulance Live Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable patients to see real-time ambulance location on a map with route visualization and live ETA updates.

**Architecture:** WebSocket-based real-time tracking using Leaflet maps with OpenStreetMap tiles. Ambulance location updates sent every 5 seconds, broadcast to patient via WebSocket. OSRM for route calculation with straight-line fallback.

**Tech Stack:** FastAPI, SQLAlchemy, WebSocket, Leaflet.js, React-Leaflet, OpenStreetMap, OSRM

---

## File Structure

### Backend Files

**New Files:**
- `app/models/ambulance_location_update.py` - SQLAlchemy model for location history
- `app/routers/tracking.py` - REST endpoints for tracking
- `app/services/routing_service.py` - OSRM integration and route calculation
- `app/services/location_cleanup_service.py` - Background cleanup task
- `app/Websocket/tracking_manager.py` - WebSocket manager for tracking rooms
- `alembic/versions/XXXX_add_ambulance_tracking.py` - Database migration

**Modified Files:**
- `app/main.py` - Register tracking router and WebSocket endpoint
- `app/models/ambulance.py` - Add is_sharing_location column
- `app/models/emergency_request.py` - Add tracking metadata columns

### Frontend Files

**New Files:**
- `Frontend/src/pages/patient/AmbulanceTrackingPage.tsx` - Tracking page for patients
- `Frontend/src/components/tracking/TrackingMap.tsx` - Leaflet map component
- `Frontend/src/hooks/useAmbulanceTracking.ts` - WebSocket connection hook
- `Frontend/src/services/trackingService.ts` - API service for tracking

**Modified Files:**
- `Frontend/src/pages/patient/EmergencyPage.tsx` - Add Track Ambulance button
- `Frontend/src/pages/ambulance/AmbulanceActivePage.tsx` - Add auto location sharing
- `Frontend/src/App.tsx` - Add tracking page route
- `Frontend/package.json` - Add Leaflet dependencies

---

## Task 1: Database Migration

**Files:**
- Create: `alembic/versions/001_add_ambulance_tracking.py`

- [ ] **Step 1: Create migration file**

```bash
cd C:/Users/sdo/OneDrive/Desktop/medicalltubes
alembic revision -m "add ambulance tracking tables and columns"
```

Expected: New migration file created in `alembic/versions/`

- [ ] **Step 2: Write migration upgrade**

Open the generated migration file and add:

```python
"""add ambulance tracking tables and columns

Revision ID: [generated]
Revises: [previous]
Create Date: 2026-05-17
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = '[generated]'
down_revision = '[previous]'
branch_labels = None
depends_on = None

def upgrade():
    # Create ambulance_location_updates table
    op.create_table(
        'ambulance_location_updates',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('ambulance_service_id', UUID(as_uuid=True), sa.ForeignKey('ambulance_services.id', ondelete='CASCADE'), nullable=False),
        sa.Column('emergency_request_id', UUID(as_uuid=True), sa.ForeignKey('emergency_requests.id', ondelete='CASCADE'), nullable=False),
        sa.Column('lat', sa.Float, nullable=False),
        sa.Column('lng', sa.Float, nullable=False),
        sa.Column('accuracy', sa.Float, nullable=True),
        sa.Column('speed', sa.Float, nullable=True),
        sa.Column('heading', sa.Float, nullable=True),
        sa.Column('timestamp', sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.func.now())
    )
    
    # Create indexes
    op.create_index('idx_emergency_request', 'ambulance_location_updates', ['emergency_request_id', 'timestamp'])
    op.create_index('idx_ambulance_service', 'ambulance_location_updates', ['ambulance_service_id', 'timestamp'])
    op.create_index('idx_timestamp', 'ambulance_location_updates', ['timestamp'])
    
    # Add columns to ambulance_services
    op.add_column('ambulance_services', sa.Column('is_sharing_location', sa.Boolean, server_default='false'))
    
    # Add columns to emergency_requests
    op.add_column('emergency_requests', sa.Column('tracking_started_at', sa.DateTime, nullable=True))
    op.add_column('emergency_requests', sa.Column('tracking_stopped_at', sa.DateTime, nullable=True))
    op.add_column('emergency_requests', sa.Column('last_ambulance_location_lat', sa.Float, nullable=True))
    op.add_column('emergency_requests', sa.Column('last_ambulance_location_lng', sa.Float, nullable=True))
    op.add_column('emergency_requests', sa.Column('last_ambulance_location_updated_at', sa.DateTime, nullable=True))

def downgrade():
    # Remove columns from emergency_requests
    op.drop_column('emergency_requests', 'last_ambulance_location_updated_at')
    op.drop_column('emergency_requests', 'last_ambulance_location_lng')
    op.drop_column('emergency_requests', 'last_ambulance_location_lat')
    op.drop_column('emergency_requests', 'tracking_stopped_at')
    op.drop_column('emergency_requests', 'tracking_started_at')
    
    # Remove column from ambulance_services
    op.drop_column('ambulance_services', 'is_sharing_location')
    
    # Drop indexes
    op.drop_index('idx_timestamp', 'ambulance_location_updates')
    op.drop_index('idx_ambulance_service', 'ambulance_location_updates')
    op.drop_index('idx_emergency_request', 'ambulance_location_updates')
    
    # Drop table
    op.drop_table('ambulance_location_updates')
```

- [ ] **Step 3: Run migration**

```bash
alembic upgrade head
```

Expected: Migration applied successfully, tables and columns created

- [ ] **Step 4: Verify migration**

```bash
alembic current
```

Expected: Shows the new migration as current

- [ ] **Step 5: Commit migration**

```bash
git add alembic/versions/001_add_ambulance_tracking.py
git commit -m "feat: add database schema for ambulance tracking"
```

---

## Task 2: Create Location Update Model

**Files:**
- Create: `app/models/ambulance_location_update.py`

- [ ] **Step 1: Create model file**

```python
from sqlalchemy import Column, Float, DateTime, ForeignKey, Index
from datetime import datetime
import uuid
from app.database import Base
from app.models.user import GUID

class AmbulanceLocationUpdate(Base):
    __tablename__ = "ambulance_location_updates"
    
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    ambulance_service_id = Column(
        GUID(), 
        ForeignKey("ambulance_services.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    emergency_request_id = Column(
        GUID(), 
        ForeignKey("emergency_requests.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    accuracy = Column(Float, nullable=True)
    speed = Column(Float, nullable=True)
    heading = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
```

- [ ] **Step 2: Update model imports**

Add to `app/models/__init__.py`:

```python
from app.models.ambulance_location_update import AmbulanceLocationUpdate
```

- [ ] **Step 3: Commit model**

```bash
git add app/models/ambulance_location_update.py app/models/__init__.py
git commit -m "feat: add AmbulanceLocationUpdate model"
```


---

## Task 3: Create Routing Service

**Files:**
- Create: `app/services/routing_service.py`

- [ ] **Step 1: Write routing service with OSRM integration**

```python
import httpx
from typing import Optional, Dict
from datetime import datetime, timedelta
from math import radians, sin, cos, sqrt, atan2

class RoutingService:
    OSRM_BASE_URL = "https://router.project-osrm.org"
    
    async def calculate_route(
        self, 
        origin_lat: float, 
        origin_lng: float,
        dest_lat: float, 
        dest_lng: float
    ) -> Dict:
        """Calculate route using OSRM with fallback to straight-line"""
        try:
            url = f"{self.OSRM_BASE_URL}/route/v1/driving/{origin_lng},{origin_lat};{dest_lng},{dest_lat}"
            params = {"overview": "full", "geometries": "geojson"}
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=5.0)
                response.raise_for_status()
                data = response.json()
                
                if data.get("code") != "Ok":
                    raise Exception(f"OSRM error: {data.get('code')}")
                
                route = data["routes"][0]
                geometry = route["geometry"]
                
                return {
                    "distance_km": round(route["distance"] / 1000, 2),
                    "duration_minutes": int(route["duration"] / 60),
                    "coordinates": geometry["coordinates"]
                }
        except Exception as e:
            return self._calculate_straight_line(origin_lat, origin_lng, dest_lat, dest_lng)
    
    def _calculate_straight_line(
        self, lat1: float, lng1: float, lat2: float, lng2: float
    ) -> Dict:
        """Fallback: Haversine distance calculation"""
        R = 6371.0
        lat1_rad = radians(lat1)
        lat2_rad = radians(lat2)
        dlat = radians(lat2 - lat1)
        dlng = radians(lng2 - lng1)
        
        a = sin(dlat/2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlng/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        distance_km = R * c
        duration_minutes = int((distance_km / 40) * 60)
        
        return {
            "distance_km": round(distance_km, 2),
            "duration_minutes": duration_minutes,
            "coordinates": [[lng1, lat1], [lng2, lat2]]
        }
    
    async def calculate_eta(
        self, distance_km: float, current_speed_kmh: Optional[float] = None
    ) -> Dict:
        """Calculate ETA based on distance and speed"""
        avg_speed = current_speed_kmh if current_speed_kmh and current_speed_kmh > 0 else 40.0
        minutes = int((distance_km / avg_speed) * 60)
        
        return {
            "estimated_arrival": datetime.utcnow() + timedelta(minutes=minutes),
            "minutes_remaining": minutes
        }

routing_service = RoutingService()
```

- [ ] **Step 2: Commit routing service**

```bash
git add app/services/routing_service.py
git commit -m "feat: add routing service with OSRM integration"
```

---

## Task 4: Create Location Cleanup Service

**Files:**
- Create: `app/services/location_cleanup_service.py`

- [ ] **Step 1: Write cleanup service**

```python
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete
from app.models.ambulance_location_update import AmbulanceLocationUpdate

class LocationCleanupService:
    async def cleanup_old_locations(self, db: AsyncSession, hours: int = 24) -> Dict:
        """Delete location updates older than specified hours"""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        
        result = await db.execute(
            delete(AmbulanceLocationUpdate).where(
                AmbulanceLocationUpdate.timestamp < cutoff_time
            )
        )
        
        await db.commit()
        deleted_count = result.rowcount
        
        return {
            "deleted_count": deleted_count,
            "cutoff_time": cutoff_time.isoformat()
        }

location_cleanup_service = LocationCleanupService()
```

- [ ] **Step 2: Commit cleanup service**

```bash
git add app/services/location_cleanup_service.py
git commit -m "feat: add location cleanup service"
```

---

## Task 5: Create WebSocket Tracking Manager

**Files:**
- Create: `app/Websocket/tracking_manager.py`

- [ ] **Step 1: Write tracking manager**

```python
from fastapi import WebSocket
from typing import Dict, List
import json

class TrackingConnectionManager:
    def __init__(self):
        self.tracking_rooms: Dict[str, List[WebSocket]] = {}
    
    async def connect_to_tracking(self, emergency_request_id: str, websocket: WebSocket):
        """Add client to tracking room"""
        await websocket.accept()
        
        if emergency_request_id not in self.tracking_rooms:
            self.tracking_rooms[emergency_request_id] = []
        
        self.tracking_rooms[emergency_request_id].append(websocket)
    
    async def disconnect_from_tracking(self, emergency_request_id: str, websocket: WebSocket):
        """Remove client from tracking room"""
        if emergency_request_id in self.tracking_rooms:
            if websocket in self.tracking_rooms[emergency_request_id]:
                self.tracking_rooms[emergency_request_id].remove(websocket)
            
            if not self.tracking_rooms[emergency_request_id]:
                del self.tracking_rooms[emergency_request_id]
    
    async def broadcast_location_update(self, emergency_request_id: str, location_data: dict):
        """Broadcast location update to all clients in room"""
        if emergency_request_id not in self.tracking_rooms:
            return
        
        message = {
            "type": "location_update",
            "emergency_request_id": emergency_request_id,
            **location_data
        }
        
        disconnected = []
        for websocket in self.tracking_rooms[emergency_request_id]:
            try:
                await websocket.send_json(message)
            except Exception:
                disconnected.append(websocket)
        
        for ws in disconnected:
            await self.disconnect_from_tracking(emergency_request_id, ws)
    
    async def broadcast_status_change(self, emergency_request_id: str, status_data: dict):
        """Broadcast status change to all clients in room"""
        if emergency_request_id not in self.tracking_rooms:
            return
        
        message = {
            "type": "status_change",
            "emergency_request_id": emergency_request_id,
            **status_data
        }
        
        for websocket in self.tracking_rooms[emergency_request_id]:
            try:
                await websocket.send_json(message)
            except Exception:
                pass
    
    async def send_tracking_stopped(self, emergency_request_id: str, reason: str):
        """Send tracking stopped message"""
        if emergency_request_id not in self.tracking_rooms:
            return
        
        message = {
            "type": "tracking_stopped",
            "emergency_request_id": emergency_request_id,
            "reason": reason,
            "message": f"Pelacakan dihentikan: {reason}"
        }
        
        for websocket in self.tracking_rooms[emergency_request_id]:
            try:
                await websocket.send_json(message)
            except Exception:
                pass

tracking_manager = TrackingConnectionManager()
```

- [ ] **Step 2: Commit tracking manager**

```bash
git add app/Websocket/tracking_manager.py
git commit -m "feat: add WebSocket tracking manager"
```


---

## Task 6: Create Tracking Router

**Files:**
- Create: `app/routers/tracking.py`

- [ ] **Step 1: Write tracking router with location update endpoint**

```python
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from datetime import datetime
import uuid

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.ambulance import AmbulanceService
from app.models.emergency_request import EmergencyRequest
from app.models.ambulance_location_update import AmbulanceLocationUpdate
from app.services.routing_service import routing_service
from app.Websocket.tracking_manager import tracking_manager

router = APIRouter(prefix="/tracking", tags=["Tracking"])

class LocationUpdateRequest(BaseModel):
    emergency_request_id: str
    lat: float
    lng: float
    accuracy: float = None
    speed: float = None
    heading: float = None

@router.patch("/ambulances/location")
async def update_ambulance_location(
    data: LocationUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ambulance sends GPS location update"""
    if current_user.role != "ambulance":
        raise HTTPException(status_code=403, detail="Only ambulance users can update location")
    
    # Validate coordinates
    if not (-90 <= data.lat <= 90) or not (-180 <= data.lng <= 180):
        raise HTTPException(status_code=400, detail="Invalid GPS coordinates")
    
    # Get emergency request
    try:
        emergency_id = uuid.UUID(data.emergency_request_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid emergency request ID")
    
    result = await db.execute(
        select(EmergencyRequest).where(EmergencyRequest.id == emergency_id)
    )
    emergency = result.scalar_one_or_none()
    
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency request not found")
    
    # Verify ambulance is assigned to this emergency
    ambulance_result = await db.execute(
        select(AmbulanceService).where(
            AmbulanceService.user_id == current_user.id,
            AmbulanceService.id == emergency.ambulance_service_id
        )
    )
    ambulance = ambulance_result.scalar_one_or_none()
    
    if not ambulance:
        raise HTTPException(status_code=403, detail="Not assigned to this emergency")
    
    # Store location update
    location_update = AmbulanceLocationUpdate(
        ambulance_service_id=ambulance.id,
        emergency_request_id=emergency.id,
        lat=data.lat,
        lng=data.lng,
        accuracy=data.accuracy,
        speed=data.speed,
        heading=data.heading,
        timestamp=datetime.utcnow()
    )
    db.add(location_update)
    
    # Update emergency request with last known location
    emergency.last_ambulance_location_lat = data.lat
    emergency.last_ambulance_location_lng = data.lng
    emergency.last_ambulance_location_updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(location_update)
    
    # Calculate route to patient
    route = await routing_service.calculate_route(
        data.lat, data.lng,
        emergency.location_lat, emergency.location_lng
    )
    
    # Calculate ETA
    eta = await routing_service.calculate_eta(route["distance_km"], data.speed)
    
    # Broadcast to tracking clients
    await tracking_manager.broadcast_location_update(
        str(emergency.id),
        {
            "ambulance_location": {
                "lat": data.lat,
                "lng": data.lng,
                "timestamp": location_update.timestamp.isoformat(),
                "speed": data.speed,
                "heading": data.heading
            },
            "route": route,
            "eta": {
                "estimated_arrival": eta["estimated_arrival"].isoformat(),
                "minutes_remaining": eta["minutes_remaining"]
            }
        }
    )
    
    return {
        "success": True,
        "location_id": str(location_update.id),
        "timestamp": location_update.timestamp.isoformat(),
        "broadcast_sent": True
    }
```

- [ ] **Step 2: Add get tracking data endpoint**

Add to `app/routers/tracking.py`:

```python
@router.get("/emergencies/{emergency_request_id}")
async def get_tracking_data(
    emergency_request_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current tracking data for an emergency"""
    try:
        emergency_id = uuid.UUID(emergency_request_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid emergency request ID")
    
    result = await db.execute(
        select(EmergencyRequest).where(EmergencyRequest.id == emergency_id)
    )
    emergency = result.scalar_one_or_none()
    
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency request not found")
    
    # Verify access
    if current_user.role == "patient" and emergency.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if current_user.role == "ambulance":
        ambulance_result = await db.execute(
            select(AmbulanceService).where(
                AmbulanceService.user_id == current_user.id,
                AmbulanceService.id == emergency.ambulance_service_id
            )
        )
        if not ambulance_result.scalar_one_or_none():
            raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get ambulance info
    ambulance_result = await db.execute(
        select(AmbulanceService).where(AmbulanceService.id == emergency.ambulance_service_id)
    )
    ambulance = ambulance_result.scalar_one_or_none()
    
    if not ambulance:
        raise HTTPException(status_code=404, detail="Ambulance not found")
    
    # Build response
    response = {
        "emergency_request_id": str(emergency.id),
        "status": emergency.status,
        "patient_location": {
            "lat": emergency.location_lat,
            "lng": emergency.location_lng,
            "address": emergency.location_address
        },
        "ambulance_info": {
            "id": str(ambulance.id),
            "name": ambulance.name,
            "phone": ambulance.phone,
            "vehicle_plate": ambulance.vehicle_plate
        }
    }
    
    # Add ambulance location if available
    if emergency.last_ambulance_location_lat and emergency.last_ambulance_location_lng:
        last_update = emergency.last_ambulance_location_updated_at or datetime.utcnow()
        is_stale = (datetime.utcnow() - last_update).total_seconds() > 300
        
        response["ambulance_location"] = {
            "lat": emergency.last_ambulance_location_lat,
            "lng": emergency.last_ambulance_location_lng,
            "last_updated": last_update.isoformat(),
            "is_stale": is_stale
        }
        
        # Calculate route
        route = await routing_service.calculate_route(
            emergency.last_ambulance_location_lat,
            emergency.last_ambulance_location_lng,
            emergency.location_lat,
            emergency.location_lng
        )
        response["route"] = route
        
        # Calculate ETA
        eta = await routing_service.calculate_eta(route["distance_km"])
        response["eta"] = {
            "estimated_arrival": eta["estimated_arrival"].isoformat(),
            "minutes_remaining": eta["minutes_remaining"]
        }
    else:
        response["ambulance_location"] = None
        response["route"] = None
        response["eta"] = None
    
    return response
```

- [ ] **Step 3: Commit tracking router**

```bash
git add app/routers/tracking.py
git commit -m "feat: add tracking router with location update endpoint"
```


---

## Task 7: Add WebSocket Endpoint

**Files:**
- Modify: `app/main.py`

- [ ] **Step 1: Add WebSocket endpoint to main.py**

Add after existing router includes:

```python
from app.Websocket.tracking_manager import tracking_manager
from app.dependencies import get_current_user_from_token

@app.websocket("/ws/tracking/{emergency_request_id}")
async def tracking_websocket(
    websocket: WebSocket,
    emergency_request_id: str,
    token: str = Query(...)
):
    """WebSocket endpoint for real-time tracking"""
    try:
        # Verify token and get user
        user = await get_current_user_from_token(token)
        
        # Verify access to this emergency
        async with get_db() as db:
            result = await db.execute(
                select(EmergencyRequest).where(EmergencyRequest.id == uuid.UUID(emergency_request_id))
            )
            emergency = result.scalar_one_or_none()
            
            if not emergency:
                await websocket.close(code=1008, reason="Emergency not found")
                return
            
            # Check authorization
            if user.role == "patient" and emergency.user_id != user.id:
                await websocket.close(code=1008, reason="Not authorized")
                return
            
            if user.role == "ambulance":
                ambulance_result = await db.execute(
                    select(AmbulanceService).where(
                        AmbulanceService.user_id == user.id,
                        AmbulanceService.id == emergency.ambulance_service_id
                    )
                )
                if not ambulance_result.scalar_one_or_none():
                    await websocket.close(code=1008, reason="Not authorized")
                    return
        
        # Connect to tracking room
        await tracking_manager.connect_to_tracking(emergency_request_id, websocket)
        
        # Send subscription confirmation
        await websocket.send_json({
            "type": "subscribed",
            "emergency_request_id": emergency_request_id,
            "message": "Successfully subscribed to tracking updates"
        })
        
        # Keep connection alive
        while True:
            try:
                data = await websocket.receive_text()
                # Handle any client messages if needed
            except WebSocketDisconnect:
                break
    
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await tracking_manager.disconnect_from_tracking(emergency_request_id, websocket)
```

- [ ] **Step 2: Add helper function for token verification**

Add to `app/dependencies.py`:

```python
from jose import jwt, JWTError
from app.core.security import SECRET_KEY, ALGORITHM

async def get_current_user_from_token(token: str) -> User:
    """Verify JWT token and return user"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    async with get_db() as db:
        result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
        user = result.scalar_one_or_none()
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
```

- [ ] **Step 3: Commit WebSocket endpoint**

```bash
git add app/main.py app/dependencies.py
git commit -m "feat: add WebSocket endpoint for tracking"
```

---

## Task 8: Register Tracking Router

**Files:**
- Modify: `app/main.py`

- [ ] **Step 1: Import and register tracking router**

Add to imports in `app/main.py`:

```python
from app.routers import tracking
```

Add to router registrations:

```python
app.include_router(tracking.router, prefix="/api")
```

- [ ] **Step 2: Commit router registration**

```bash
git add app/main.py
git commit -m "feat: register tracking router"
```

---

## Task 9: Install Frontend Dependencies

**Files:**
- Modify: `Frontend/package.json`

- [ ] **Step 1: Install Leaflet dependencies**

```bash
cd Frontend
npm install leaflet@^1.9.4 react-leaflet@^4.2.1
npm install --save-dev @types/leaflet@^1.9.8
```

Expected: Dependencies installed successfully

- [ ] **Step 2: Verify installation**

```bash
npm list leaflet react-leaflet
```

Expected: Shows installed versions

- [ ] **Step 3: Commit package files**

```bash
git add package.json package-lock.json
git commit -m "feat: add Leaflet dependencies for map tracking"
```

---

## Task 10: Create Tracking Service

**Files:**
- Create: `Frontend/src/services/trackingService.ts`

- [ ] **Step 1: Write tracking service**

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

export interface LocationUpdate {
  emergency_request_id: string;
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export interface TrackingData {
  emergency_request_id: string;
  status: string;
  patient_location: {
    lat: number;
    lng: number;
    address: string;
  };
  ambulance_location: {
    lat: number;
    lng: number;
    last_updated: string;
    is_stale: boolean;
  } | null;
  ambulance_info: {
    id: string;
    name: string;
    phone: string;
    vehicle_plate: string;
  };
  route: {
    distance_km: number;
    duration_minutes: number;
    coordinates: [number, number][];
  } | null;
  eta: {
    estimated_arrival: string;
    minutes_remaining: number;
  } | null;
}

class TrackingService {
  async getTrackingData(emergencyRequestId: string): Promise<TrackingData> {
    const response = await axios.get(
      `${API_BASE_URL}/tracking/emergencies/${emergencyRequestId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  }

  async updateLocation(data: LocationUpdate): Promise<void> {
    await axios.patch(
      `${API_BASE_URL}/tracking/ambulances/location`,
      data,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
  }
}

export const trackingService = new TrackingService();
```

- [ ] **Step 2: Commit tracking service**

```bash
git add Frontend/src/services/trackingService.ts
git commit -m "feat: add tracking service for API calls"
```


---

## Task 11: Create useAmbulanceTracking Hook

**Files:**
- Create: `Frontend/src/hooks/useAmbulanceTracking.ts`

- [ ] **Step 1: Write WebSocket tracking hook**

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import { trackingService, TrackingData } from '@/services/trackingService';

interface UseAmbulanceTrackingReturn {
  trackingData: TrackingData | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  isLocationStale: boolean;
  reconnect: () => void;
}

export function useAmbulanceTracking(emergencyRequestId: string): UseAmbulanceTrackingReturn {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocationStale, setIsLocationStale] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const checkLocationStale = useCallback((data: TrackingData) => {
    if (!data.ambulance_location) {
      setIsLocationStale(false);
      return;
    }
    
    const lastUpdate = new Date(data.ambulance_location.last_updated);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastUpdate.getTime()) / 1000 / 60;
    setIsLocationStale(diffMinutes > 5);
  }, []);

  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await trackingService.getTrackingData(emergencyRequestId);
      setTrackingData(data);
      checkLocationStale(data);
      setError(null);
    } catch (err) {
      setError('Failed to load tracking data');
      console.error('Error fetching tracking data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [emergencyRequestId, checkLocationStale]);

  const connectWebSocket = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token');
      return;
    }

    const wsUrl = `ws://localhost:8001/ws/tracking/${emergencyRequestId}?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'subscribed') {
        console.log('Subscribed to tracking updates');
      } else if (message.type === 'location_update') {
        setTrackingData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            ambulance_location: message.ambulance_location,
            route: message.route,
            eta: message.eta
          };
        });
        checkLocationStale({ ...trackingData!, ambulance_location: message.ambulance_location });
      } else if (message.type === 'status_change') {
        setTrackingData((prev) => {
          if (!prev) return prev;
          return { ...prev, status: message.new_status };
        });
      } else if (message.type === 'tracking_stopped') {
        console.log('Tracking stopped:', message.reason);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      
      // Exponential backoff reconnection
      const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      reconnectAttemptsRef.current += 1;
      
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log(`Reconnecting... (attempt ${reconnectAttemptsRef.current})`);
        connectWebSocket();
      }, backoffDelay);
    };

    wsRef.current = ws;
  }, [emergencyRequestId, checkLocationStale, trackingData]);

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    reconnectAttemptsRef.current = 0;
    fetchInitialData().then(() => connectWebSocket());
  }, [fetchInitialData, connectWebSocket]);

  useEffect(() => {
    fetchInitialData().then(() => connectWebSocket());

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [fetchInitialData, connectWebSocket]);

  return {
    trackingData,
    isConnected,
    isLoading,
    error,
    isLocationStale,
    reconnect
  };
}
```

- [ ] **Step 2: Commit tracking hook**

```bash
git add Frontend/src/hooks/useAmbulanceTracking.ts
git commit -m "feat: add useAmbulanceTracking hook for WebSocket connection"
```

---

## Task 12: Create TrackingMap Component

**Files:**
- Create: `Frontend/src/components/tracking/TrackingMap.tsx`

- [ ] **Step 1: Write TrackingMap component**

```typescript
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface TrackingMapProps {
  patientLocation: { lat: number; lng: number };
  ambulanceLocation: { lat: number; lng: number } | null;
  route: { coordinates: [number, number][] } | null;
  isLocationStale: boolean;
  onRecenter: () => void;
}

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const patientIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const ambulanceIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapBoundsUpdater({ 
  patientLocation, 
  ambulanceLocation 
}: { 
  patientLocation: { lat: number; lng: number }; 
  ambulanceLocation: { lat: number; lng: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (ambulanceLocation) {
      const bounds = L.latLngBounds(
        [patientLocation.lat, patientLocation.lng],
        [ambulanceLocation.lat, ambulanceLocation.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView([patientLocation.lat, patientLocation.lng], 13);
    }
  }, [map, patientLocation, ambulanceLocation]);

  return null;
}

export function TrackingMap({
  patientLocation,
  ambulanceLocation,
  route,
  isLocationStale,
  onRecenter
}: TrackingMapProps) {
  const routeCoordinates = route?.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]) || [];

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[patientLocation.lat, patientLocation.lng]}
        zoom={13}
        className="w-full h-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Marker position={[patientLocation.lat, patientLocation.lng]} icon={patientIcon} />
        
        {ambulanceLocation && (
          <Marker 
            position={[ambulanceLocation.lat,

---

## Task 11: Create useAmbulanceTracking Hook

**Files:**
- Create: `Frontend/src/hooks/useAmbulanceTracking.ts`

- [ ] **Step 1: Write WebSocket tracking hook**

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import { trackingService, TrackingData } from '@/services/trackingService';

interface UseAmbulanceTrackingReturn {
  trackingData: TrackingData | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  isLocationStale: boolean;
  reconnect: () => void;
}

export function useAmbulanceTracking(emergencyRequestId: string): UseAmbulanceTrackingReturn {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocationStale, setIsLocationStale] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const checkLocationStale = useCallback((data: TrackingData) => {
    if (!data.ambulance_location) {
      setIsLocationStale(false);
      return;
    }
    
    const lastUpdate = new Date(data.ambulance_location.last_updated);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastUpdate.getTime()) / 1000 / 60;
    setIsLocationStale(diffMinutes > 5);
  }, []);

  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await trackingService.getTrackingData(emergencyRequestId);
      setTrackingData(data);
      checkLocationStale(data);
      setError(null);
    } catch (err) {
      setError('Failed to load tracking data');
      console.error('Error fetching tracking data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [emergencyRequestId, checkLocationStale]);

  const connectWebSocket = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token');
      return;
    }

    const wsUrl = `ws://localhost:8001/ws/tracking/${emergencyRequestId}?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'location_update') {
        setTrackingData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            ambulance_location: message.ambulance_location,
            route: message.route,
            eta: message.eta
          };
        });
      }
    };

    ws.onerror = (error) => {
      setError('Connection error');
    };

    ws.onclose = () => {
      setIsConnected(false);
      const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      reconnectAttemptsRef.current += 1;
      reconnectTimeoutRef.current = setTimeout(() => connectWebSocket(), backoffDelay);
    };

    wsRef.current = ws;
  }, [emergencyRequestId]);

  const reconnect = useCallback(() => {
    if (wsRef.current) wsRef.current.close();
    reconnectAttemptsRef.current = 0;
    fetchInitialData().then(() => connectWebSocket());
  }, [fetchInitialData, connectWebSocket]);

  useEffect(() => {
    fetchInitialData().then(() => connectWebSocket());
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [fetchInitialData, connectWebSocket]);

  return { trackingData, isConnected, isLoading, error, isLocationStale, reconnect };
}
```

- [ ] **Step 2: Commit tracking hook**

```bash
git add Frontend/src/hooks/useAmbulanceTracking.ts
git commit -m "feat: add useAmbulanceTracking hook for WebSocket connection"
```

---

## Task 12: Create TrackingMap Component

**Files:**
- Create: `Frontend/src/components/tracking/TrackingMap.tsx`

- [ ] **Step 1: Write TrackingMap component**

```typescript
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface TrackingMapProps {
  patientLocation: { lat: number; lng: number };
  ambulanceLocation: { lat: number; lng: number } | null;
  route: { coordinates: [number, number][] } | null;
  isLocationStale: boolean;
  onRecenter: () => void;
}

const patientIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41]
});

const ambulanceIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41]
});

function MapBoundsUpdater({ patientLocation, ambulanceLocation }: any) {
  const map = useMap();
  useEffect(() => {
    if (ambulanceLocation) {
      const bounds = L.latLngBounds(
        [patientLocation.lat, patientLocation.lng],
        [ambulanceLocation.lat, ambulanceLocation.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView([patientLocation.lat, patientLocation.lng], 13);
    }
  }, [map, patientLocation, ambulanceLocation]);
  return null;
}

export function TrackingMap({ patientLocation, ambulanceLocation, route, isLocationStale, onRecenter }: TrackingMapProps) {
  const routeCoordinates = route?.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]) || [];

  return (
    <div className="relative w-full h-full">
      <MapContainer center={[patientLocation.lat, patientLocation.lng]} zoom={13} className="w-full h-full">
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[patientLocation.lat, patientLocation.lng]} icon={patientIcon} />
        {ambulanceLocation && <Marker position={[ambulanceLocation.lat, ambulanceLocation.lng]} icon={ambulanceIcon} />}
        {routeCoordinates.length > 0 && <Polyline positions={routeCoordinates} color="blue" weight={3} opacity={0.7} dashArray="10, 10" />}
        <MapBoundsUpdater patientLocation={patientLocation} ambulanceLocation={ambulanceLocation} />
      </MapContainer>
      {isLocationStale && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-warning px-4 py-2 rounded-md shadow-lg z-[1000]">
          Lokasi ambulans tidak diperbarui dalam 5 menit terakhir
        </div>
      )}
      <button onClick={onRecenter} className="absolute bottom-4 right-4 bg-white hover:bg-gray-100 px-4 py-2 rounded shadow-lg z-[1000]">
        Recenter
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit TrackingMap component**

```bash
git add Frontend/src/components/tracking/TrackingMap.tsx
git commit -m "feat: add TrackingMap component with Leaflet"
```


---

## Task 11: Create useAmbulanceTracking Hook

**Files:**
- Create: `Frontend/src/hooks/useAmbulanceTracking.ts`

- [ ] **Step 1: Write WebSocket tracking hook**

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import { trackingService, TrackingData } from '@/services/trackingService';

interface UseAmbulanceTrackingReturn {
  trackingData: TrackingData | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  isLocationStale: boolean;
  reconnect: () => void;
}

export function useAmbulanceTracking(emergencyRequestId: string): UseAmbulanceTrackingReturn {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocationStale, setIsLocationStale] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const checkLocationStale = useCallback((data: TrackingData) => {
    if (!data.ambulance_location) {
      setIsLocationStale(false);
      return;
    }
    
    const lastUpdate = new Date(data.ambulance_location.last_updated);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastUpdate.getTime()) / 1000 / 60;
    setIsLocationStale(diffMinutes > 5);
  }, []);

  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await trackingService.getTrackingData(emergencyRequestId);
      setTrackingData(data);
      checkLocationStale(data);
      setError(null);
    } catch (err) {
      setError('Failed to load tracking data');
      console.error('Error fetching tracking data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [emergencyRequestId, checkLocationStale]);

  const connectWebSocket = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token');
      return;
    }

    const wsUrl = `ws://localhost:8001/ws/tracking/${emergencyRequestId}?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'location_update') {
        setTrackingData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            ambulance_location: message.ambulance_location,
            route: message.route,
            eta: message.eta
          };
        });
      }
    };

    ws.onerror = (error) => {
      setError('Connection error');
    };

    ws.onclose = () => {
      setIsConnected(false);
      const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      reconnectAttemptsRef.current += 1;
      reconnectTimeoutRef.current = setTimeout(() => connectWebSocket(), backoffDelay);
    };

    wsRef.current = ws;
  }, [emergencyRequestId]);

  const reconnect = useCallback(() => {
    if (wsRef.current) wsRef.current.close();
    reconnectAttemptsRef.current = 0;
    fetchInitialData().then(() => connectWebSocket());
  }, [fetchInitialData, connectWebSocket]);

  useEffect(() => {
    fetchInitialData().then(() => connectWebSocket());
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [fetchInitialData, connectWebSocket]);

  return { trackingData, isConnected, isLoading, error, isLocationStale, reconnect };
}
```

- [ ] **Step 2: Commit tracking hook**

```bash
git add Frontend/src/hooks/useAmbulanceTracking.ts
git commit -m "feat: add useAmbulanceTracking hook for WebSocket connection"
```

---

## Task 12: Create TrackingMap Component

**Files:**
- Create: `Frontend/src/components/tracking/TrackingMap.tsx`

- [ ] **Step 1: Write TrackingMap component**

```typescript
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface TrackingMapProps {
  patientLocation: { lat: number; lng: number };
  ambulanceLocation: { lat: number; lng: number } | null;
  route: { coordinates: [number, number][] } | null;
  isLocationStale: boolean;
  onRecenter: () => void;
}

const patientIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41]
});

const ambulanceIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41]
});

function MapBoundsUpdater({ patientLocation, ambulanceLocation }: any) {
  const map = useMap();
  useEffect(() => {
    if (ambulanceLocation) {
      const bounds = L.latLngBounds(
        [patientLocation.lat, patientLocation.lng],
        [ambulanceLocation.lat, ambulanceLocation.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView([patientLocation.lat, patientLocation.lng], 13);
    }
  }, [map, patientLocation, ambulanceLocation]);
  return null;
}

export function TrackingMap({ patientLocation, ambulanceLocation, route, isLocationStale, onRecenter }: TrackingMapProps) {
  const routeCoordinates = route?.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]) || [];

  return (
    <div className="relative w-full h-full">
      <MapContainer center={[patientLocation.lat, patientLocation.lng]} zoom={13} className="w-full h-full">
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[patientLocation.lat, patientLocation.lng]} icon={patientIcon} />
        {ambulanceLocation && <Marker position={[ambulanceLocation.lat, ambulanceLocation.lng]} icon={ambulanceIcon} />}
        {routeCoordinates.length > 0 && <Polyline positions={routeCoordinates} color="blue" weight={3} opacity={0.7} dashArray="10, 10" />}
        <MapBoundsUpdater patientLocation={patientLocation} ambulanceLocation={ambulanceLocation} />
      </MapContainer>
      {isLocationStale && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-warning px-4 py-2 rounded-md shadow-lg z-[1000]">
          Lokasi ambulans tidak diperbarui dalam 5 menit terakhir
        </div>
      )}
      <button onClick={onRecenter} className="absolute bottom-4 right-4 bg-white hover:bg-gray-100 px-4 py-2 rounded shadow-lg z-[1000]">
        Recenter
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit TrackingMap component**

```bash
git add Frontend/src/components/tracking/TrackingMap.tsx
git commit -m "feat: add TrackingMap component with Leaflet"
```


---

## Task 13: Create AmbulanceTrackingPage

**Files:**
- Create: `Frontend/src/pages/patient/AmbulanceTrackingPage.tsx`

- [ ] **Step 1: Write AmbulanceTrackingPage component**

```typescript
import { useParams, useNavigate } from 'react-router-dom';
import { Phone, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrackingMap } from '@/components/tracking/TrackingMap';
import { useAmbulanceTracking } from '@/hooks/useAmbulanceTracking';

export default function AmbulanceTrackingPage() {
  const { emergencyRequestId } = useParams<{ emergencyRequestId: string }>();
  const navigate = useNavigate();
  const { trackingData, isConnected, isLoading, error, isLocationStale, reconnect } = useAmbulanceTracking(emergencyRequestId!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-destructive">{error || 'Failed to load tracking data'}</p>
        <Button onClick={reconnect}>Retry</Button>
      </div>
    );
  }

  const handleRecenter = () => {
    // Map component handles recentering internally
  };

  const handleCallAmbulance = () => {
    if (trackingData.ambulance_info.phone) {
      window.open(`tel:${trackingData.ambulance_info.phone}`, '_self');
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="h-[70%] relative">
        <TrackingMap
          patientLocation={trackingData.patient_location}
          ambulanceLocation={trackingData.ambulance_location}
          route={trackingData.route}
          isLocationStale={isLocationStale}
          onRecenter={handleRecenter}
        />
      </div>

      <div className="h-[30%] overflow-y-auto p-4 bg-background">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/patient/emergency')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Badge variant={isConnected ? 'default' : 'destructive'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <h3 className="font-semibold text-lg">{trackingData.ambulance_info.name}</h3>
              <p className="text-sm text-muted-foreground">{trackingData.ambulance_info.vehicle_plate}</p>
            </div>

            {trackingData.eta && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="font-medium">{trackingData.route?.distance_km} km</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">ETA</p>
                  <p className="font-medium">{trackingData.eta.minutes_remaining} min</p>
                </div>
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Pickup Location</p>
              <p className="text-sm">{trackingData.patient_location.address}</p>
            </div>

            <Button className="w-full" onClick={handleCallAmbulance}>
              <Phone className="h-4 w-4 mr-2" />
              Call Ambulance
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit AmbulanceTrackingPage**

```bash
git add Frontend/src/pages/patient/AmbulanceTrackingPage.tsx
git commit -m "feat: add AmbulanceTrackingPage for live tracking"
```

---

## Task 14: Update EmergencyPage

**Files:**
- Modify: `Frontend/src/pages/patient/EmergencyPage.tsx`

- [ ] **Step 1: Add Track Ambulance button**

Add after the emergency status card (around line 450):

```typescript
{emergencyStatus && emergencyStatus.status === 'on_my_way' && (
  <Button
    className="w-full"
    onClick={() => navigate(`/patient/emergency/track/${emergencyStatus.id}`)}
  >
    <MapPin className="h-4 w-4 mr-2" />
    Track Ambulance
  </Button>
)}
```

Add import at top:

```typescript
import { useNavigate } from 'react-router-dom';
```

Add inside component:

```typescript
const navigate = useNavigate();
```

- [ ] **Step 2: Commit EmergencyPage update**

```bash
git add Frontend/src/pages/patient/EmergencyPage.tsx
git commit -m "feat: add Track Ambulance button to EmergencyPage"
```

---

## Task 15: Update AmbulanceActivePage

**Files:**
- Modify: `Frontend/src/pages/ambulance/AmbulanceActivePage.tsx`

- [ ] **Step 1: Add auto location sharing logic**

Add state and refs:

```typescript
const [isSharingLocation, setIsSharingLocation] = useState(false);
const locationWatchIdRef = useRef<number | null>(null);
```

Add location sharing functions:

```typescript
const startLocationSharing = useCallback(() => {
  if (!navigator.geolocation) {
    toast.error('GPS tidak didukung oleh browser Anda');
    return;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      trackingService.updateLocation({
        emergency_request_id: activeEmergency.id,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed || undefined,
        heading: position.coords.heading || undefined
      }).catch(err => console.error('Failed to update location:', err));
    },
    (error) => {
      console.error('GPS error:', error);
      toast.error('Gagal mendapatkan lokasi GPS');
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );

  locationWatchIdRef.current = watchId;
  setIsSharingLocation(true);
}, [activeEmergency]);

const stopLocationSharing = useCallback(() => {
  if (locationWatchIdRef.current !== null) {
    navigator.geolocation.clearWatch(locationWatchIdRef.current);
    locationWatchIdRef.current = null;
  }
  setIsSharingLocation(false);
}, []);
```

Add auto-start/stop effect:

```typescript
useEffect(() => {
  if (activeEmergency?.status === 'on_my_way' && !isSharingLocation) {
    startLocationSharing();
  }
  if (['arrived', 'completed', 'cancelled'].includes(activeEmergency?.status || '') && isSharingLocation) {
    stopLocationSharing();
  }
}, [activeEmergency?.status, isSharingLocation, startLocationSharing, stopLocationSharing]);
```

Add cleanup:

```typescript
useEffect(() => {
  return () => stopLocationSharing();
}, [stopLocationSharing]);
```

- [ ] **Step 2: Add location sharing indicator**

Add badge in UI:

```typescript
{isSharingLocation && (
  <Badge variant="default" className="bg-success">
    Sharing Location
  </Badge>
)}
```

- [ ] **Step 3: Commit AmbulanceActivePage update**

```bash
git add Frontend/src/pages/ambulance/AmbulanceActivePage.tsx
git commit -m "feat: add auto location sharing to AmbulanceActivePage"
```


---

## Task 16: Update App Routes

**Files:**
- Modify: `Frontend/src/App.tsx`

- [ ] **Step 1: Add tracking page route**

Add to routes:

```typescript
import AmbulanceTrackingPage from '@/pages/patient/AmbulanceTrackingPage';

// Add route in patient routes section
<Route path="/patient/emergency/track/:emergencyRequestId" element={<AmbulanceTrackingPage />} />
```

- [ ] **Step 2: Commit route update**

```bash
git add Frontend/src/App.tsx
git commit -m "feat: add route for ambulance tracking page"
```

---

## Task 17: Testing

**Files:**
- Create: `Frontend/src/hooks/__tests__/useAmbulanceTracking.test.ts`
- Create: `Frontend/src/components/tracking/__tests__/TrackingMap.test.tsx`

- [ ] **Step 1: Test useAmbulanceTracking hook**

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useAmbulanceTracking } from '../useAmbulanceTracking';
import { trackingService } from '@/services/trackingService';

jest.mock('@/services/trackingService');

describe('useAmbulanceTracking', () => {
  it('fetches initial tracking data on mount', async () => {
    const mockData = {
      emergency_request_id: '123',
      status: 'on_my_way',
      patient_location: { lat: -6.2088, lng: 106.8456, address: 'Test' },
      ambulance_location: { lat: -6.2000, lng: 106.8400, last_updated: new Date().toISOString(), is_stale: false },
      ambulance_info: { id: '1', name: 'Test Ambulance', phone: '123', vehicle_plate: 'B123' },
      route: { distance_km: 5, duration_minutes: 10, coordinates: [] },
      eta: { estimated_arrival: new Date().toISOString(), minutes_remaining: 10 }
    };

    (trackingService.getTrackingData as jest.Mock).mockResolvedValue(mockData);

    const { result } = renderHook(() => useAmbulanceTracking('123'));

    await waitFor(() => {
      expect(result.current.trackingData).toEqual(mockData);
      expect(result.current.isLoading).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run frontend tests**

```bash
cd Frontend
npm test
```

Expected: All tests pass

- [ ] **Step 3: Test backend endpoints**

```bash
cd ..
pytest tests/test_tracking.py -v
```

Expected: All tests pass

- [ ] **Step 4: Manual testing checklist**

Test the following scenarios:
- [ ] Patient can request emergency and see Track Ambulance button
- [ ] Tracking page loads with map showing patient location
- [ ] Ambulance accepts emergency and location sharing starts
- [ ] Patient sees ambulance marker moving on map
- [ ] Route line updates as ambulance moves
- [ ] ETA updates in real-time
- [ ] Call button works
- [ ] Stale location warning appears after 5 minutes
- [ ] WebSocket reconnects after network disconnect
- [ ] Tracking stops when ambulance arrives

- [ ] **Step 5: Commit tests**

```bash
git add Frontend/src/hooks/__tests__/ Frontend/src/components/tracking/__tests__/
git commit -m "test: add tests for tracking functionality"
```

---

## Self-Review

### Spec Coverage Check

- [x] Database schema for location tracking - Task 1, 2
- [x] Backend API for location updates - Task 6
- [x] WebSocket for real-time updates - Task 5, 7
- [x] OSRM routing integration - Task 3
- [x] Frontend tracking page - Task 13
- [x] Map component with Leaflet - Task 12
- [x] WebSocket hook - Task 11
- [x] Auto location sharing for ambulance - Task 15
- [x] Track button for patient - Task 14
- [x] Error handling and reconnection - Task 11
- [x] Testing - Task 17

### Placeholder Scan

No TBD, TODO, or incomplete sections found.

### Type Consistency Check

- LocationUpdate interface matches backend LocationUpdateRequest
- TrackingData interface matches backend response
- WebSocket message types consistent between frontend and backend
- All function signatures match across tasks

### Implementation Estimate

- Database setup: 0.5 days (Tasks 1-2)
- Backend services: 1.5 days (Tasks 3-8)
- Frontend components: 1.5 days (Tasks 9-16)
- Testing and integration: 1 day (Task 17)
- **Total: 4.5 days**

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-17-ambulance-live-tracking.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**


---

## Task 16: Update App Routes

**Files:**
- Modify: `Frontend/src/App.tsx`

- [ ] **Step 1: Add tracking page route**

Add to routes:

```typescript
import AmbulanceTrackingPage from '@/pages/patient/AmbulanceTrackingPage';

// Add route in patient routes section
<Route path="/patient/emergency/track/:emergencyRequestId" element={<AmbulanceTrackingPage />} />
```

- [ ] **Step 2: Commit route update**

```bash
git add Frontend/src/App.tsx
git commit -m "feat: add route for ambulance tracking page"
```

---

## Task 17: Testing

**Files:**
- Create: `Frontend/src/hooks/__tests__/useAmbulanceTracking.test.ts`
- Create: `Frontend/src/components/tracking/__tests__/TrackingMap.test.tsx`

- [ ] **Step 1: Test useAmbulanceTracking hook**

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useAmbulanceTracking } from '../useAmbulanceTracking';
import { trackingService } from '@/services/trackingService';

jest.mock('@/services/trackingService');

describe('useAmbulanceTracking', () => {
  it('fetches initial tracking data on mount', async () => {
    const mockData = {
      emergency_request_id: '123',
      status: 'on_my_way',
      patient_location: { lat: -6.2088, lng: 106.8456, address: 'Test' },
      ambulance_location: { lat: -6.2000, lng: 106.8400, last_updated: new Date().toISOString(), is_stale: false },
      ambulance_info: { id: '1', name: 'Test Ambulance', phone: '123', vehicle_plate: 'B123' },
      route: { distance_km: 5, duration_minutes: 10, coordinates: [] },
      eta: { estimated_arrival: new Date().toISOString(), minutes_remaining: 10 }
    };

    (trackingService.getTrackingData as jest.Mock).mockResolvedValue(mockData);

    const { result } = renderHook(() => useAmbulanceTracking('123'));

    await waitFor(() => {
      expect(result.current.trackingData).toEqual(mockData);
      expect(result.current.isLoading).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run frontend tests**

```bash
cd Frontend
npm test
```

Expected: All tests pass

- [ ] **Step 3: Test backend endpoints**

```bash
cd ..
pytest tests/test_tracking.py -v
```

Expected: All tests pass

- [ ] **Step 4: Manual testing checklist**

Test the following scenarios:
- [ ] Patient can request emergency and see Track Ambulance button
- [ ] Tracking page loads with map showing patient location
- [ ] Ambulance accepts emergency and location sharing starts
- [ ] Patient sees ambulance marker moving on map
- [ ] Route line updates as ambulance moves
- [ ] ETA updates in real-time
- [ ] Call button works
- [ ] Stale location warning appears after 5 minutes
- [ ] WebSocket reconnects after network disconnect
- [ ] Tracking stops when ambulance arrives

- [ ] **Step 5: Commit tests**

```bash
git add Frontend/src/hooks/__tests__/ Frontend/src/components/tracking/__tests__/
git commit -m "test: add tests for tracking functionality"
```

---

## Self-Review

### Spec Coverage Check

- [x] Database schema for location tracking - Task 1, 2
- [x] Backend API for location updates - Task 6
- [x] WebSocket for real-time updates - Task 5, 7
- [x] OSRM routing integration - Task 3
- [x] Frontend tracking page - Task 13
- [x] Map component with Leaflet - Task 12
- [x] WebSocket hook - Task 11
- [x] Auto location sharing for ambulance - Task 15
- [x] Track button for patient - Task 14
- [x] Error handling and reconnection - Task 11
- [x] Testing - Task 17

### Placeholder Scan

No TBD, TODO, or incomplete sections found.

### Type Consistency Check

- LocationUpdate interface matches backend LocationUpdateRequest
- TrackingData interface matches backend response
- WebSocket message types consistent between frontend and backend
- All function signatures match across tasks

### Implementation Estimate

- Database setup: 0.5 days (Tasks 1-2)
- Backend services: 1.5 days (Tasks 3-8)
- Frontend components: 1.5 days (Tasks 9-16)
- Testing and integration: 1 day (Task 17)
- **Total: 4.5 days**

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-17-ambulance-live-tracking.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**

