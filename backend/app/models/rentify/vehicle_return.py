from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
from app.helpers.general_helper import form_body


class VehicleReturnBase(BaseModel):
    active: Optional[int] = 1
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createdon: Optional[str] = datetime.now(timezone.utc)
    updatedon: Optional[str] = datetime.now(timezone.utc)


@form_body
class VehicleReturnCreate(VehicleReturnBase):
    id: Optional[int] = Field(default=0)
    tenant_id: Optional[int] = Field(default=0)
    booking_id: Optional[int] = Field(default=0)
    received_by: Optional[str] = Field(default="")
    received_from: Optional[str] = Field(default="")


@form_body
class VehicleReturnUpdate(VehicleReturnBase):
    id: Optional[int] = Field(default=0)
    tenant_id: Optional[int] = Field(default=0)
    booking_id: Optional[int] = Field(default=0)
    received_by: Optional[str] = Field(default="")
    received_from: Optional[str] = Field(default="")
