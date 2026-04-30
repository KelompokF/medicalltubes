from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class EmergencyHistoryItem(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    created_at: datetime
    location_address: Optional[str] = None
    location_lat: float
    location_lng: float
    distance_km: float
    status: str
    type: str
    notes: Optional[str] = None


class EmergencyHistoryPagination(BaseModel):
    page: int
    limit: int
    total_items: int
    total_pages: int


class EmergencyHistoryResponse(BaseModel):
    data: List[EmergencyHistoryItem]
    pagination: EmergencyHistoryPagination
