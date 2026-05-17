# Ambulance Live Tracking Design Specification

**Date:** 2026-05-17  
**Author:** Kiro AI  
**Status:** Approved  

## Overview

This specification describes the implementation of real-time ambulance tracking for the Medicalltubes application. The feature allows patients to see the live location of their assigned ambulance on a map with route visualization and estimated time of arrival (ETA).

### User Story

> "As a patient, I want to see live tracking of the ambulance so I can see the ambulance position in real-time on maps"

### Key Requirements

- Real-time ambulance location updates on a map
- Route visualization between patient and ambulance
- Live ETA calculation
- Automatic location sharing tied to emergency status
- Works with free map services (no API costs)
- Graceful handling of connection issues

---

## 1. Architecture Overview

### System Components

**Backend (FastAPI):**
- New `ambulance_location_updates` table for storing location history
- New WebSocket endpoint: `/ws/tracking/{emergency_request_id}` for real-time updates
- New REST endpoint: `PATCH /ambulances/location` for ambulance to send location
- OSRM integration service for route calculation
- Background task for cleaning old location data (>24 hours)

**Frontend (React):**
- New page: `AmbulanceTrackingPage.tsx` for patients
- Enhanced: `AmbulanceActivePage.tsx` with map and auto-location sharing
- New component: `TrackingMap.tsx` (Leaflet map with markers and route)
- New hook: `useAmbulanceTracking.ts` (WebSocket connection management)
- New service: `trackingService.ts` (API calls for tracking)

**External Services:**
- Leaflet.js for map rendering
- OpenStreetMap for map tiles (free)
- OSRM (Open Source Routing Machine) for route calculation (free)

### Data Flow

1. **Ambulance accepts emergency** → Status changes to "on_my_way"
2. **Frontend detects status change** → Starts automatic GPS tracking (every 5 seconds)
3. **Ambulance sends location** → `PATCH /ambulances/location` with lat/lng
4. **Backend receives location** → Stores in DB, calculates route via OSRM
5. **Backend broadcasts via WebSocket** → Sends to patient's tracking page
6. **Patient's map updates** → Shows new ambulance position and route
7. **Ambulance arrives** → Status changes to "arrived", tracking stops

### Technology Stack
- **Maps**: Leaflet.js + React-Leaflet
- **Map Tiles**: OpenStreetMap (free)
- **Routing**: OSRM public API (free, with fallback to self-hosted if needed)
- **Real-time**: WebSocket (extending existing infrastructure)
- **Location Updates**: Browser Geolocation API

---

## 2. Database Schema

### New Table: `ambulance_location_updates`

Stores historical location updates for ambulances during active emergencies.

```sql
CREATE TABLE ambulance_location_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ambulance_service_id UUID NOT NULL REFERENCES ambulance_services(id) ON DELETE CASCADE,
    emergency_request_id UUID NOT NULL REFERENCES emergency_requests(id) ON DELETE CASCADE,
    lat FLOAT NOT NULL,
    lng FLOAT NOT NULL,
    accuracy FLOAT,  -- GPS accuracy in meters (optional)
    speed FLOAT,     -- Speed in km/h (optional, from GPS)
    heading FLOAT,   -- Direction in degrees (optional)
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_emergency_request ON ambulance_location_updates(emergency_request_id, timestamp DESC);
CREATE INDEX idx_ambulance_service ON ambulance_location_updates(ambulance_service_id, timestamp DESC);
CREATE INDEX idx_timestamp ON ambulance_location_updates(timestamp);
```

**Purpose:**
- Track ambulance movement during emergencies
- Enable debugging of tracking issues
- Support analytics and optimization
- Retain data for 24 hours, then auto-delete

### Modified Table: `ambulance_services`

Add tracking status indicator:

```sql
ALTER TABLE ambulance_services 
ADD COLUMN is_sharing_location BOOLEAN DEFAULT FALSE;
```

**Purpose:** Track whether ambulance is currently sharing location

### Modified Table: `emergency_requests`

Add tracking metadata:

```sql
ALTER TABLE emergency_requests
ADD COLUMN tracking_started_at TIMESTAMP NULL,
ADD COLUMN tracking_stopped_at TIMESTAMP NULL,
ADD COLUMN last_ambulance_location_lat FLOAT NULL,
ADD COLUMN last_ambulance_location_lng FLOAT NULL,
ADD COLUMN last_ambulance_location_updated_at TIMESTAMP NULL;
```

**Purpose:**
- Quick access to latest location without joining tables
- Track when tracking started/stopped
- Support stale location detection

### SQLAlchemy Model

```python
# app/models/ambulance_location_update.py
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
        nullable=False
    )
    emergency_request_id = Column(
        GUID(), 
        ForeignKey("emergency_requests.id", ondelete="CASCADE"), 
        nullable=False
    )
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    accuracy = Column(Float, nullable=True)
    speed = Column(Float, nullable=True)
    heading = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        Index('idx_emergency_request', 'emergency_request_id', 'timestamp'),
        Index('idx_ambulance_service', 'ambulance_service_id', 'timestamp'),
        Index('idx_timestamp', 'timestamp'),
    )
```

### Data Retention Strategy

- **Retention Period:** 24 hours
- **Cleanup Frequency:** Every 6 hours via background task
- **On Emergency Completion:** Last known location saved in `emergency_requests` table
- **Purpose:** Balance debugging needs with database size

---

## 3. Backend API Design

### New Endpoints

#### 3.1 Update Ambulance Location

**Endpoint:** `PATCH /api/ambulances/location`  
**Authentication:** Required (ambulance user only)  
**Purpose:** Ambulance sends GPS location update

**Request:**
```json
{
  "emergency_request_id": "uuid",
  "lat": -6.2088,
  "lng": 106.8456,
  "accuracy": 10.5,      // optional, meters
  "speed": 45.2,         // optional, km/h
  "heading": 180.0       // optional, degrees
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "location_id": "uuid",
  "timestamp": "2026-05-17T10:56:40Z",
  "broadcast_sent": true
}
```

**Error Responses:**
- `400 Bad Request`: Invalid coordinates (lat/lng out of range)
- `403 Forbidden`: User is not an ambulance or not assigned to this emergency
- `404 Not Found`: Emergency request not found
- `500 Internal Server Error`: Database or WebSocket broadcast failure

**Business Logic:**
1. Validate user is ambulance and assigned to this emergency
2. Validate GPS coordinates (lat: -90 to 90, lng: -180 to 180)
3. Store location in `ambulance_location_updates` table
4. Update `emergency_requests.last_ambulance_location_*` fields
5. Calculate route using OSRM
6. Broadcast location + route via WebSocket to tracking clients
7. Return success response

#### 3.2 Get Emergency Tracking Data

**Endpoint:** `GET /api/emergencies/{emergency_request_id}/tracking`  
**Authentication:** Required (patient or ambulance)  
**Purpose:** Get current tracking data for an emergency

**Response (200 OK):**
```json
{
  "emergency_request_id": "uuid",
  "status": "on_my_way",
  "patient_location": {
    "lat": -6.2088,
    "lng": 106.8456,
    "address": "Jl. Sudirman No. 123, Jakarta Selatan"
  },
  "ambulance_location": {
    "lat": -6.2000,
    "lng": 106.8400,
    "last_updated": "2026-05-17T10:56:30Z",
    "is_stale": false
  },
  "ambulance_info": {
    "id": "uuid",
    "name": "Ambulans RS Siloam",
    "phone": "+62812345678",
    "vehicle_plate": "B 1234 XYZ"
  },
  "route": {
    "distance_km": 5.2,
    "duration_minutes": 12,
    "polyline": "encoded_polyline_string",
    "coordinates": [[106.8400, -6.2000], [106.8456, -6.2088]]
  },
  "eta": {
    "estimated_arrival": "2026-05-17T11:08:40Z",
    "minutes_remaining": 12
  }
}
```

**Error Responses:**
- `403 Forbidden`: User not authorized to view this emergency
- `404 Not Found`: Emergency request not found
- `422 Unprocessable Entity`: Tracking not available (status not "on_my_way")

#### 3.3 Get Location History

**Endpoint:** `GET /api/emergencies/{emergency_request_id}/location-history`  
**Authentication:** Required (ambulance only)  
**Purpose:** Get historical location updates for debugging

**Query Parameters:**
- `limit`: Number of records (default: 50, max: 200)

**Response (200 OK):**
```json
{
  "emergency_request_id": "uuid",
  "locations": [
    {
      "lat": -6.2088,
      "lng": 106.8456,
      "timestamp": "2026-05-17T10:56:40Z",
      "speed": 45.2,
      "accuracy": 10.5
    }
  ],
  "total": 150
}
```

### Backend Services

#### 3.4 OSRM Integration Service

**File:** `app/services/routing_service.py`

```python
import httpx
from typing import Optional
from datetime import datetime, timedelta

class RoutingService:
    OSRM_BASE_URL = "https://router.project-osrm.org"
    
    async def calculate_route(
        self, 
        origin_lat: float, 
        origin_lng: float,
        dest_lat: float, 
        dest_lng: float
    ) -> dict:
        """
        Calculate route using OSRM public API
        
        Returns:
        {
            "distance_km": float,
            "duration_minutes": int,
            "polyline": str,
            "coordinates": [[lng, lat], ...]
        }
        """
        try:
            url = f"{self.OSRM_BASE_URL}/route/v1/driving/{origin_lng},{origin_lat};{dest_lng},{dest_lat}"
            params = {
                "overview": "full",
                "geometries": "geojson"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=5.0)
                response.raise_for_status()
                data = response.json()
                
                if data.get("code") != "Ok":
                    raise Exception(f"OSRM error: {data.get('code')}")
                
                route = data["routes"][0]
                geometry = route["geometry"]
                
                return {
                    "distance_km": route["distance"] / 1000,
                    "duration_minutes": int(route["duration"] / 60),
                    "coordinates": geometry["coordinates"],
                    "polyline": self._encode_polyline(geometry["coordinates"])
                }
        except Exception as e:
            # Fallback to straight-line distance
            return self._calculate_straight_line(
                origin_lat, origin_lng, dest_lat, dest_lng
            )
    
    def _calculate_straight_line(
        self, lat1: float, lng1: float, lat2: float, lng2: float
    ) -> dict:
        """Fallback: calculate straight-line distance using Haversine"""
        from math import radians, sin, cos, sqrt, atan2
        
        R = 6371.0  # Earth radius in km
        lat1_rad = radians(lat1)
        lat2_rad = radians(lat2)
        dlat = radians(lat2 - lat1)
        dlng = radians(lng2 - lng1)
        
        a = sin(dlat/2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlng/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        distance_km = R * c
        
        # Estimate duration at 40 km/h average speed
        duration_minutes = int((distance_km / 40) * 60)
        
        return {
            "distance_km": round(distance_km, 2),
            "duration_minutes": duration_minutes,
            "coordinates": [[lng1, lat1], [lng2, lat2]],
            "polyline": None
        }
    
    async def calculate_eta(
        self,
        distance_km: float,
        current_speed_kmh: Optional[float] = None
    ) -> dict:
        """Calculate ETA based on distance and optional current speed"""
        avg_speed = current_speed_kmh if current_speed_kmh else 40.0
        minutes = int((distance_km / avg_speed) * 60)
        
        return {
            "estimated_arrival": datetime.utcnow() + timedelta(minutes=minutes),
            "minutes_remaining": minutes
        }
```

#### 3.5 Location Cleanup Service

**File:** `app/services/location_cleanup_service.py`

```python
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete
from app.models.ambulance_location_update import AmbulanceLocationUpdate

class LocationCleanupService:
    async def cleanup_old_locations(
        self, 
        db: AsyncSession, 
        hours: int = 24
    ):
        """
        Delete location updates older than specified hours
        Runs as background task every 6 hours
        """
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
            "cutoff_time": cutoff_time
        }
```

---

## 4. WebSocket Protocol

### WebSocket Connection

**Endpoint:** `ws://api/ws/tracking/{emergency_request_id}`

**Authentication:** 
- Token passed as query parameter: `?token=<jwt_token>`
- Verify user is either the patient or the assigned ambulance

### Message Types

#### 4.1 Client → Server: Subscribe to Tracking

```json
{
  "type": "subscribe_tracking",
  "emergency_request_id": "uuid"
}
```

**Server Response:**
```json
{
  "type": "subscribed",
  "emergency_request_id": "uuid",
  "message": "Successfully subscribed to tracking updates"
}
```

#### 4.2 Server → Client: Location Update

Sent when ambulance location is updated.

```json
{
  "type": "location_update",
  "emergency_request_id": "uuid",
  "ambulance_location": {
    "lat": -6.2000,
    "lng": 106.8400,
    "timestamp": "2026-05-17T10:56:40Z",
    "speed": 45.2,
    "heading": 180.0
  },
  "route": {
    "distance_km": 5.2,
    "duration_minutes": 12,
    "coordinates": [[106.8400, -6.2000], [106.8456, -6.2088]]
  },
  "eta": {
    "estimated_arrival": "2026-05-17T11:08:40Z",
    "minutes_remaining": 12
  }
}
```

#### 4.3 Server → Client: Status Change

Sent when emergency status changes.

```json
{
  "type": "status_change",
  "emergency_request_id": "uuid",
  "old_status": "on_my_way",
  "new_status": "arrived",
  "message": "Ambulans telah tiba di lokasi",
  "timestamp": "2026-05-17T11:08:40Z"
}
```

#### 4.4 Server → Client: Tracking Stopped

Sent when tracking ends.

```json
{
  "type": "tracking_stopped",
  "emergency_request_id": "uuid",
  "reason": "arrived",
  "message": "Pelacakan dihentikan: ambulans telah tiba"
}
```

#### 4.5 Server → Client: Connection Error

Sent when there's an issue with tracking.

```json
{
  "type": "error",
  "code": "STALE_LOCATION",
  "message": "Lokasi ambulans tidak diperbarui dalam 5 menit terakhir",
  "last_update": "2026-05-17T10:51:40Z"
}
```

### WebSocket Manager Extension

**File:** `app/Websocket/tracking_manager.py`

```pyt


---

## 5. Frontend Components

### New Page: AmbulanceTrackingPage.tsx

**Route:** `/patient/emergency/track/:emergencyRequestId`

**Layout:**
- Map Section (70% height): Full-width Leaflet map
- Info Panel (30% height): Ambulance details, ETA, status, actions

**Key Features:**
- Real-time ambulance marker with custom icon
- Patient location marker (blue pin)
- Animated route polyline
- Auto-center map to show both markers
- Recenter button
- Live ETA countdown
- Call Ambulance button
- Back to Emergency Page button
- Stale location warning (>5 minutes)

### New Component: TrackingMap.tsx

**Props:**
```typescript
interface TrackingMapProps {
  patientLocation: { lat: number; lng: number };
  ambulanceLocation: { lat: number; lng: number } | null;
  route: { coordinates: [number, number][] } | null;
  isLocationStale: boolean;
  onRecenter: () => void;
}
```

### New Hook: useAmbulanceTracking.ts

**Interface:**
```typescript
interface UseAmbulanceTrackingReturn {
  trackingData: TrackingData | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  isLocationStale: boolean;
  reconnect: () => void;
}
```

**Responsibilities:**
- Establish WebSocket connection on mount
- Handle reconnection with exponential backoff
- Parse incoming WebSocket messages
- Update tracking state on location updates
- Detect stale locations (>5 minutes)
- Clean up on unmount

### Enhanced: AmbulanceActivePage.tsx

**New Features:**
- Small map showing patient location (300px height)
- Navigate to Patient button (opens Google Maps)
- Auto-start location sharing when status = "on_my_way"
- Auto-stop when status = "arrived", "completed", "cancelled"
- Location sharing indicator badge
- Manual pause/resume toggle
- GPS permission handling

### Enhanced: EmergencyPage.tsx

**New Features:**
- Track Ambulance button when status = "on_my_way"
- Navigates to tracking page
- Tracking Available badge on status card

### Dependencies

```json
{
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1",
  "@types/leaflet": "^1.9.8"
}
```

---

## 6. Integration Flow

### Patient Tracking Flow

1. Patient clicks SOS button
2. Emergency request created, ambulance assigned
3. Ambulance accepts, status changes to "on_my_way"
4. Track Ambulance button appears
5. Patient opens tracking page
6. Fetch initial tracking data via REST
7. Establish WebSocket connection
8. Render map with markers and route
9. Receive real-time location updates
10. Update map on each update
11. Ambulance arrives, tracking stops
12. Show arrival notification

### Ambulance Location Sharing Flow

1. Driver accepts emergency
2. Status changes to "on_my_way"
3. Frontend auto-starts location sharing
4. Request GPS permission
5. Capture GPS every 5 seconds
6. Send location to backend
7. Backend stores, calculates route, broadcasts
8. Patient map updates in real-time
9. Driver arrives, status changes to "arrived"
10. Frontend auto-stops location sharing

### Connection Issue Handling

**Patient loses connection:**
- WebSocket disconnects
- Show reconnecting indicator
- Exponential backoff reconnection
- Fetch latest data on reconnect
- Show stale warning if >5 min old

**Ambulance loses GPS:**
- GPS signal fails
- Stop sending updates
- Patient sees stale warning after 5 min
- Resume when GPS returns

### Status Transitions

- **dispatched**: Sharing OFF, tracking unavailable
- **on_my_way**: Sharing AUTO-START, tracking available
- **arrived**: Sharing AUTO-STOP, show arrived message
- **completed**: Tracking closed, redirect
- **cancelled**: Sharing stops, tracking closed

---

## 7. Error Handling & Edge Cases

### Edge Case 1: Ambulance Never Starts Sharing

**Handling:**
- Show "Waiting for ambulance..." message
- Display ambulance phone prominently
- After 5 min, show "Call ambulance?" notification
- Tracking page shows static location

### Edge Case 2: GPS Permission Denied

**Handling:**
- Show error: "GPS permission required"
- Enable GPS button with instructions
- Prevent status change until permission granted
- Alternative: Allow status update with warning

### Edge Case 3: Stale Location Data

**Handling:**
- Show warning badge: "Last updated X minutes ago"
- Keep showing last known location
- Display estimated ETA from last position
- Show Call Ambulance button prominently
- Don't remove markers or route

### Edge Case 4: OSRM API Failure

**Handling:**
- Fallback to straight-line distance
- Show warning: "Route unavailable"
- Display ambulance and patient markers
- Draw straight line instead of route
- Calculate ETA using straight-line distance

### Edge Case 5: Emergency Cancelled Mid-Tracking

**Handling:**
- Broadcast tracking_stopped with reason="cancelled"
- Show "Emergency cancelled" message
- Redirect to EmergencyPage after 3 seconds
- Ambulance auto-stops location sharing

### Edge Case 6: Browser Doesn't Support Geolocation

**Handling:**
- Detect: if (!navigator.geolocation)
- Show error message
- Provide manual address entry alternative
- Ambulance can accept but can't share location
- Patient sees static location only

### Edge Case 7: WebSocket Connection Fails Repeatedly

**Handling:**
- After 5 failed attempts, switch to polling
- Poll GET /api/emergencies/{id}/tracking every 10 seconds
- Show warning: "Using fallback mode"
- Retry WebSocket every 2 minutes

### Edge Case 8: Ambulance Location Jumps Erratically

**Handling:**
- Implement location smoothing on backend
- Reject locations with accuracy >100 meters
- Ignore locations requiring >150 km/h speed
- Use previous location if new seems invalid
- Log anomalies for debugging

### Error Messages (Indonesian)

```typescript
const ERROR_MESSAGES = {
  GPS_PERMISSION_DENIED: "Izin GPS ditolak. Aktifkan GPS untuk berbagi lokasi.",
  GPS_UNAVAILABLE: "GPS tidak tersedia. Periksa pengaturan lokasi Anda.",
  NETWORK_ERROR: "Koneksi terputus. Mencoba menyambung kembali...",
  STALE_LOCATION: "Lokasi ambulans terakhir diperbarui {minutes} menit yang lalu.",
  ROUTE_UNAVAILABLE: "Rute tidak tersedia. Menampilkan jarak langsung.",
  WEBSOCKET_FAILED: "Koneksi real-time gagal. Menggunakan mode polling.",
  AMBULANCE_NOT_SHARING: "Ambulans belum mulai berbagi lokasi.",
  EMERGENCY_CANCELLED: "Permintaan darurat dibatalkan.",
  EMERGENCY_COMPLETED: "Permintaan darurat selesai.",
  TRACKING_UNAVAILABLE: "Pelacakan tidak tersedia untuk permintaan ini."
};
```



---

## 5. Frontend Components

### New Page: AmbulanceTrackingPage.tsx

**Route:** `/patient/emergency/track/:emergencyRequestId`

**Layout:**
- Map Section (70% height): Full-width Leaflet map
- Info Panel (30% height): Ambulance details, ETA, status, actions

**Key Features:**
- Real-time ambulance marker with custom icon
- Patient location marker (blue pin)
- Animated route polyline
- Auto-center map to show both markers
- Recenter button
- Live ETA countdown
- Call Ambulance button
- Back to Emergency Page button
- Stale location warning (>5 minutes)

### New Component: TrackingMap.tsx

**Props:**
```typescript
interface TrackingMapProps {
  patientLocation: { lat: number; lng: number };
  ambulanceLocation: { lat: number; lng: number } | null;
  route: { coordinates: [number, number][] } | null;
  isLocationStale: boolean;
  onRecenter: () => void;
}
```

### New Hook: useAmbulanceTracking.ts

**Interface:**
```typescript
interface UseAmbulanceTrackingReturn {
  trackingData: TrackingData | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  isLocationStale: boolean;
  reconnect: () => void;
}
```

**Responsibilities:**
- Establish WebSocket connection on mount
- Handle reconnection with exponential backoff
- Parse incoming WebSocket messages
- Update tracking state on location updates
- Detect stale locations (>5 minutes)
- Clean up on unmount

### Enhanced: AmbulanceActivePage.tsx

**New Features:**
- Small map showing patient location (300px height)
- Navigate to Patient button (opens Google Maps)
- Auto-start location sharing when status = "on_my_way"
- Auto-stop when status = "arrived", "completed", "cancelled"
- Location sharing indicator badge
- Manual pause/resume toggle
- GPS permission handling

### Enhanced: EmergencyPage.tsx

**New Features:**
- Track Ambulance button when status = "on_my_way"
- Navigates to tracking page
- Tracking Available badge on status card

### Dependencies

```json
{
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1",
  "@types/leaflet": "^1.9.8"
}
```

---

## 6. Integration Flow

### Patient Tracking Flow

1. Patient clicks SOS button
2. Emergency request created, ambulance assigned
3. Ambulance accepts, status changes to "on_my_way"
4. Track Ambulance button appears
5. Patient opens tracking page
6. Fetch initial tracking data via REST
7. Establish WebSocket connection
8. Render map with markers and route
9. Receive real-time location updates
10. Update map on each update
11. Ambulance arrives, tracking stops
12. Show arrival notification

### Ambulance Location Sharing Flow

1. Driver accepts emergency
2. Status changes to "on_my_way"
3. Frontend auto-starts location sharing
4. Request GPS permission
5. Capture GPS every 5 seconds
6. Send location to backend
7. Backend stores, calculates route, broadcasts
8. Patient map updates in real-time
9. Driver arrives, status changes to "arrived"
10. Frontend auto-stops location sharing

### Connection Issue Handling

**Patient loses connection:**
- WebSocket disconnects
- Show reconnecting indicator
- Exponential backoff reconnection
- Fetch latest data on reconnect
- Show stale warning if >5 min old

**Ambulance loses GPS:**
- GPS signal fails
- Stop sending updates
- Patient sees stale warning after 5 min
- Resume when GPS returns

### Status Transitions

- **dispatched**: Sharing OFF, tracking unavailable
- **on_my_way**: Sharing AUTO-START, tracking available
- **arrived**: Sharing AUTO-STOP, show arrived message
- **completed**: Tracking closed, redirect
- **cancelled**: Sharing stops, tracking closed

---

## 7. Error Handling & Edge Cases

### Edge Case 1: Ambulance Never Starts Sharing

**Handling:**
- Show "Waiting for ambulance..." message
- Display ambulance phone prominently
- After 5 min, show "Call ambulance?" notification
- Tracking page shows static location

### Edge Case 2: GPS Permission Denied

**Handling:**
- Show error: "GPS permission required"
- Enable GPS button with instructions
- Prevent status change until permission granted
- Alternative: Allow status update with warning

### Edge Case 3: Stale Location Data

**Handling:**
- Show warning badge: "Last updated X minutes ago"
- Keep showing last known location
- Display estimated ETA from last position
- Show Call Ambulance button prominently
- Don't remove markers or route

### Edge Case 4: OSRM API Failure

**Handling:**
- Fallback to straight-line distance
- Show warning: "Route unavailable"
- Display ambulance and patient markers
- Draw straight line instead of route
- Calculate ETA using straight-line distance

### Edge Case 5: Emergency Cancelled Mid-Tracking

**Handling:**
- Broadcast tracking_stopped with reason="cancelled"
- Show "Emergency cancelled" message
- Redirect to EmergencyPage after 3 seconds
- Ambulance auto-stops location sharing

### Edge Case 6: Browser Doesn't Support Geolocation

**Handling:**
- Detect: if (!navigator.geolocation)
- Show error message
- Provide manual address entry alternative
- Ambulance can accept but can't share location
- Patient sees static location only

### Edge Case 7: WebSocket Connection Fails Repeatedly

**Handling:**
- After 5 failed attempts, switch to polling
- Poll GET /api/emergencies/{id}/tracking every 10 seconds
- Show warning: "Using fallback mode"
- Retry WebSocket every 2 minutes

### Edge Case 8: Ambulance Location Jumps Erratically

**Handling:**
- Implement location smoothing on backend
- Reject locations with accuracy >100 meters
- Ignore locations requiring >150 km/h speed
- Use previous location if new seems invalid
- Log anomalies for debugging

### Error Messages (Indonesian)

```typescript
const ERROR_MESSAGES = {
  GPS_PERMISSION_DENIED: "Izin GPS ditolak. Aktifkan GPS untuk berbagi lokasi.",
  GPS_UNAVAILABLE: "GPS tidak tersedia. Periksa pengaturan lokasi Anda.",
  NETWORK_ERROR: "Koneksi terputus. Mencoba menyambung kembali...",
  STALE_LOCATION: "Lokasi ambulans terakhir diperbarui {minutes} menit yang lalu.",
  ROUTE_UNAVAILABLE: "Rute tidak tersedia. Menampilkan jarak langsung.",
  WEBSOCKET_FAILED: "Koneksi real-time gagal. Menggunakan mode polling.",
  AMBULANCE_NOT_SHARING: "Ambulans belum mulai berbagi lokasi.",
  EMERGENCY_CANCELLED: "Permintaan darurat dibatalkan.",
  EMERGENCY_COMPLETED: "Permintaan darurat selesai.",
  TRACKING_UNAVAILABLE: "Pelacakan tidak tersedia untuk permintaan ini."
};
```



---

## 8. Testing Strategy

### Unit Tests

#### Backend Tests

**test_ambulance_location_update.py**
- Valid location update creates database record
- Invalid coordinates (lat >90, lng >180) rejected
- Unauthorized user cannot update location
- Location update broadcasts via WebSocket
- Emergency request last_location fields updated

**test_routing_service.py**
- OSRM route calculation returns valid polyline
- Fallback to straight-line on OSRM failure
- ETA calculation based on distance and speed
- Route caching works correctly

**test_location_cleanup_service.py**
- Locations older than 24 hours are deleted
- Recent locations are preserved
- Cleanup doesn't affect other tables

**test_tracking_websocket.py**
- Client can subscribe to tracking room
- Location updates broadcast to all room members
- Unauthorized clients rejected
- Disconnection removes client from room

#### Frontend Tests

**TrackingMap.test.tsx**
- Map renders with patient and ambulance markers
- Route polyline displays correctly
- Stale location shows warning badge
- Recenter button resets map bounds

**useAmbulanceTracking.test.ts**
- WebSocket connects on mount
- Reconnection with exponential backoff
- Location updates update state
- Stale location detection (>5 min)
- Cleanup on unmount

**AmbulanceTrackingPage.test.tsx**
- Page loads tracking data on mount
- WebSocket connection established
- Call button opens phone dialer
- Back button navigates to emergency page

### Integration Tests

**End-to-End Tracking Flow**
1. Patient creates emergency request
2. Ambulance accepts (status → "on_my_way")
3. Ambulance location sharing starts automatically
4. Patient opens tracking page
5. WebSocket connection established
6. Location updates received and displayed
7. Ambulance changes status to "arrived"
8. Location sharing stops
9. Tracking page shows "arrived" message

**Connection Failure Recovery**
1. Patient tracking ambulance
2. Simulate network disconnect
3. Verify reconnection attempts
4. Verify fallback to polling mode
5. Verify data consistency after reconnect

**Multiple Concurrent Tracking Sessions**
1. Create 3 emergency requests
2. 3 patients open tracking pages simultaneously
3. Ambulances send location updates
4. Verify each patient sees only their ambulance
5. Verify no cross-contamination of data

### Manual Testing Checklist

**Patient Flow:**
- [ ] Request emergency from EmergencyPage
- [ ] "Track Ambulance" button appears when status = "on_my_way"
- [ ] Tracking page loads with map
- [ ] Patient and ambulance markers visible
- [ ] Route line displays correctly
- [ ] ETA updates in real-time
- [ ] Call button works
- [ ] Stale location warning appears after 5 min
- [ ] "Arrived" notification when ambulance arrives
- [ ] Can navigate back to EmergencyPage

**Ambulance Flow:**
- [ ] Accept emergency from dashboard
- [ ] Change status to "on_my_way"
- [ ] GPS permission requested (if not granted)
- [ ] Location sharing starts automatically
- [ ] "Sharing Location" badge visible
- [ ] Small map shows patient location
- [ ] "Navigate in Google Maps" button works
- [ ] Can manually pause/resume location sharing
- [ ] Change status to "arrived"
- [ ] Location sharing stops automatically

**Error Scenarios:**
- [ ] GPS permission denied - shows error message
- [ ] Network disconnect - reconnection works
- [ ] OSRM API down - fallback to straight line
- [ ] Stale location - warning displayed
- [ ] WebSocket fails - polling mode activates
- [ ] Invalid GPS coordinates - rejected gracefully

### Performance Testing

**Metrics to Measure:**
- Location update latency (target: <2 seconds)
- WebSocket message delivery time (target: <500ms)
- OSRM API response time (target: <1 second)
- Map rendering performance (target: 60fps)
- Database query time for location updates (target: <100ms)

**Load Testing:**
- 10 concurrent tracking sessions
- 50 location updates per minute
- WebSocket connection stability over 30 minutes
- Database performance with 10,000+ location records

### Acceptance Criteria

**Feature is complete when:**
- Patient can see ambulance location in real-time on map
- Route between patient and ambulance is displayed
- ETA updates as ambulance moves
- Location sharing starts/stops automatically with status changes
- Stale location warnings work correctly
- Call ambulance button works
- Works on mobile browsers (Chrome, Safari)
- Handles network disconnections gracefully
- All tests pass
- No console errors in normal operation

---

## 9. Implementation Summary

### Database Changes
- New table: `ambulance_location_updates`
- Modified: `ambulance_services` (add `is_sharing_location`)
- Modified: `emergency_requests` (add tracking metadata columns)
- Migration script required

### Backend Changes
- New model: `AmbulanceLocationUpdate`
- New router: `tracking.py` with location update endpoint
- New service: `RoutingService` (OSRM integration)
- New service: `LocationCleanupService` (background task)
- Enhanced: WebSocket manager with tracking rooms
- New WebSocket endpoint: `/ws/tracking/{emergency_request_id}`

### Frontend Changes
- New page: `AmbulanceTrackingPage.tsx`
- New component: `TrackingMap.tsx`
- New hook: `useAmbulanceTracking.ts`
- New service: `trackingService.ts`
- Enhanced: `EmergencyPage.tsx` (add Track button)
- Enhanced: `AmbulanceActivePage.tsx` (add auto location sharing)
- New dependencies: leaflet, react-leaflet

### External Dependencies
- Leaflet.js (MIT license, free)
- OpenStreetMap tiles (free)
- OSRM public API (free, with fallback option)

### Estimated Implementation Time
- Database setup: 0.5 days
- Backend API & WebSocket: 1.5 days
- Frontend components: 1.5 days
- Integration & testing: 1 day
- **Total: 4-5 days**

### Deployment Considerations
- Run database migration before deployment
- Set up background task for location cleanup (cron job or scheduler)
- Monitor OSRM API usage (consider self-hosted if needed)
- Test WebSocket connections in production environment
- Ensure HTTPS for WebSocket (wss://)

---

## 10. Future Enhancements (Out of Scope)

- Driver photo and rating display
- In-app chat between patient and driver
- Multiple ambulance comparison
- Historical route replay
- Traffic-aware ETA calculation
- Push notifications for status changes
- Offline mode support
- Driver behavior analytics
- Geofencing alerts (ambulance near patient)
- Integration with hospital systems

---

**End of Design Specification**



---

## 8. Testing Strategy

### Unit Tests

#### Backend Tests

**test_ambulance_location_update.py**
- Valid location update creates database record
- Invalid coordinates (lat >90, lng >180) rejected
- Unauthorized user cannot update location
- Location update broadcasts via WebSocket
- Emergency request last_location fields updated

**test_routing_service.py**
- OSRM route calculation returns valid polyline
- Fallback to straight-line on OSRM failure
- ETA calculation based on distance and speed
- Route caching works correctly

**test_location_cleanup_service.py**
- Locations older than 24 hours are deleted
- Recent locations are preserved
- Cleanup doesn't affect other tables

**test_tracking_websocket.py**
- Client can subscribe to tracking room
- Location updates broadcast to all room members
- Unauthorized clients rejected
- Disconnection removes client from room

#### Frontend Tests

**TrackingMap.test.tsx**
- Map renders with patient and ambulance markers
- Route polyline displays correctly
- Stale location shows warning badge
- Recenter button resets map bounds

**useAmbulanceTracking.test.ts**
- WebSocket connects on mount
- Reconnection with exponential backoff
- Location updates update state
- Stale location detection (>5 min)
- Cleanup on unmount

**AmbulanceTrackingPage.test.tsx**
- Page loads tracking data on mount
- WebSocket connection established
- Call button opens phone dialer
- Back button navigates to emergency page

### Integration Tests

**End-to-End Tracking Flow**
1. Patient creates emergency request
2. Ambulance accepts (status → "on_my_way")
3. Ambulance location sharing starts automatically
4. Patient opens tracking page
5. WebSocket connection established
6. Location updates received and displayed
7. Ambulance changes status to "arrived"
8. Location sharing stops
9. Tracking page shows "arrived" message

**Connection Failure Recovery**
1. Patient tracking ambulance
2. Simulate network disconnect
3. Verify reconnection attempts
4. Verify fallback to polling mode
5. Verify data consistency after reconnect

**Multiple Concurrent Tracking Sessions**
1. Create 3 emergency requests
2. 3 patients open tracking pages simultaneously
3. Ambulances send location updates
4. Verify each patient sees only their ambulance
5. Verify no cross-contamination of data

### Manual Testing Checklist

**Patient Flow:**
- [ ] Request emergency from EmergencyPage
- [ ] "Track Ambulance" button appears when status = "on_my_way"
- [ ] Tracking page loads with map
- [ ] Patient and ambulance markers visible
- [ ] Route line displays correctly
- [ ] ETA updates in real-time
- [ ] Call button works
- [ ] Stale location warning appears after 5 min
- [ ] "Arrived" notification when ambulance arrives
- [ ] Can navigate back to EmergencyPage

**Ambulance Flow:**
- [ ] Accept emergency from dashboard
- [ ] Change status to "on_my_way"
- [ ] GPS permission requested (if not granted)
- [ ] Location sharing starts automatically
- [ ] "Sharing Location" badge visible
- [ ] Small map shows patient location
- [ ] "Navigate in Google Maps" button works
- [ ] Can manually pause/resume location sharing
- [ ] Change status to "arrived"
- [ ] Location sharing stops automatically

**Error Scenarios:**
- [ ] GPS permission denied - shows error message
- [ ] Network disconnect - reconnection works
- [ ] OSRM API down - fallback to straight line
- [ ] Stale location - warning displayed
- [ ] WebSocket fails - polling mode activates
- [ ] Invalid GPS coordinates - rejected gracefully

### Performance Testing

**Metrics to Measure:**
- Location update latency (target: <2 seconds)
- WebSocket message delivery time (target: <500ms)
- OSRM API response time (target: <1 second)
- Map rendering performance (target: 60fps)
- Database query time for location updates (target: <100ms)

**Load Testing:**
- 10 concurrent tracking sessions
- 50 location updates per minute
- WebSocket connection stability over 30 minutes
- Database performance with 10,000+ location records

### Acceptance Criteria

**Feature is complete when:**
- Patient can see ambulance location in real-time on map
- Route between patient and ambulance is displayed
- ETA updates as ambulance moves
- Location sharing starts/stops automatically with status changes
- Stale location warnings work correctly
- Call ambulance button works
- Works on mobile browsers (Chrome, Safari)
- Handles network disconnections gracefully
- All tests pass
- No console errors in normal operation

---

## 9. Implementation Summary

### Database Changes
- New table: `ambulance_location_updates`
- Modified: `ambulance_services` (add `is_sharing_location`)
- Modified: `emergency_requests` (add tracking metadata columns)
- Migration script required

### Backend Changes
- New model: `AmbulanceLocationUpdate`
- New router: `tracking.py` with location update endpoint
- New service: `RoutingService` (OSRM integration)
- New service: `LocationCleanupService` (background task)
- Enhanced: WebSocket manager with tracking rooms
- New WebSocket endpoint: `/ws/tracking/{emergency_request_id}`

### Frontend Changes
- New page: `AmbulanceTrackingPage.tsx`
- New component: `TrackingMap.tsx`
- New hook: `useAmbulanceTracking.ts`
- New service: `trackingService.ts`
- Enhanced: `EmergencyPage.tsx` (add Track button)
- Enhanced: `AmbulanceActivePage.tsx` (add auto location sharing)
- New dependencies: leaflet, react-leaflet

### External Dependencies
- Leaflet.js (MIT license, free)
- OpenStreetMap tiles (free)
- OSRM public API (free, with fallback option)

### Estimated Implementation Time
- Database setup: 0.5 days
- Backend API & WebSocket: 1.5 days
- Frontend components: 1.5 days
- Integration & testing: 1 day
- **Total: 4-5 days**

### Deployment Considerations
- Run database migration before deployment
- Set up background task for location cleanup (cron job or scheduler)
- Monitor OSRM API usage (consider self-hosted if needed)
- Test WebSocket connections in production environment
- Ensure HTTPS for WebSocket (wss://)

---

## 10. Future Enhancements (Out of Scope)

- Driver photo and rating display
- In-app chat between patient and driver
- Multiple ambulance comparison
- Historical route replay
- Traffic-aware ETA calculation
- Push notifications for status changes
- Offline mode support
- Driver behavior analytics
- Geofencing alerts (ambulance near patient)
- Integration with hospital systems

---

**End of Design Specification**

