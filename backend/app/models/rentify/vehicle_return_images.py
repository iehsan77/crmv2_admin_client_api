from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone


class VehicleReturnImageBase(BaseModel):
    active: Optional[int] = 1
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createdon: Optional[str] = datetime.now(timezone.utc)
    updatedon: Optional[str] = datetime.now(timezone.utc)


class VehicleReturnImage(VehicleReturnImageBase):
    id: Optional[int] = Field(default=0)
    tenant_id: Optional[int] = Field(default=0)
    booking_id: Optional[int] = Field(default=0)
    vehicle_id: Optional[int] = Field(default=0)
    url: Optional[str] = Field(default="")
    image_type: Optional[str] = Field(default="return")
    file_type: Optional[str] = Field(default="")
    file_size: Optional[int] = Field(default=0)

    class Config:
        orm_mode = True


