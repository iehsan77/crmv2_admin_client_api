from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
from app.helpers.general_helper import form_body


class DeliveryBase(BaseModel):
    active: Optional[int] = 1
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createdon: Optional[str] = datetime.now(timezone.utc)
    updatedon: Optional[str] = datetime.now(timezone.utc)


@form_body
class DeliveryCreate(DeliveryBase):
    id: Optional[int] = Field(default=0)
    tenant_id: Optional[int] = Field(default=0)
    booking_id: Optional[int] = Field(default=0)
    handover_by: Optional[str] = Field(default="")
    received_by: Optional[str] = Field(default="")
    confirm_booking_delivery: Optional[int] = Field(default=0)


@form_body
class DeliveryUpdate(DeliveryBase):
    id: Optional[int] = Field(default=0)
    tenant_id: Optional[int] = Field(default=0)
    booking_id: Optional[int] = Field(default=0)
    handover_by: Optional[str] = Field(default="")
    received_by: Optional[str] = Field(default="")
    confirm_booking_delivery: Optional[int] = Field(default=0)
