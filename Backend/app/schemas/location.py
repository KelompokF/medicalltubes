from pydantic import BaseModel

class LocationSettingResponse(BaseModel):
    is_location_enabled: bool

    class Config:
        from_attributes = True