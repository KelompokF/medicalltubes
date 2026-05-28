# app/schemas/doctor_review.py

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ReviewCreate(BaseModel):
    doctor_id: str = Field(..., description="Doctor user_id (bukan profile id)")
    rating: int = Field(..., ge=1, le=5, description="Rating 1-5")
    comment: Optional[str] = Field(None, max_length=1000, description="Komentar opsional")
    context_type: str = Field(..., description="consultation atau home_visit")
    context_id: str = Field(..., description="ID chat_room atau home_visit_request")


class ReviewResponse(BaseModel):
    id: str
    patient_id: str
    patient_name: str
    doctor_id: str
    rating: int
    comment: Optional[str] = None
    context_type: str
    context_id: str
    created_at: str


class ReviewSummary(BaseModel):
    average_rating: float = 0.0
    total_reviews: int = 0
    distribution: dict = {}  # {"5": 10, "4": 5, "3": 2, "2": 1, "1": 0}
    reviews: List[ReviewResponse] = []


class ReviewCheckResponse(BaseModel):
    has_reviewed: bool = False
    review: Optional[ReviewResponse] = None
