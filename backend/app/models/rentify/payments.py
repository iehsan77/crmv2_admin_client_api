from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from app.helpers.general_helper import form_body


class PaymentBase(BaseModel):
    active: Optional[int] = 1
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createdon: Optional[str] = datetime.now(timezone.utc)
    updatedon: Optional[str] = datetime.now(timezone.utc)


@form_body
class PaymentCreate(PaymentBase):
    id: Optional[int] = Field(default=0)
    tenant_id: Optional[int] = Field(default=0)
    booking_id: Optional[int] = Field(default=0)
    customer_id: Optional[int] = Field(default=0)
    amount: Optional[float] = Field(default=0.0)
    payment_date: Optional[str] = Field(default="")
    transaction_id: Optional[str] = Field(default="")
    terminal_id: Optional[str] = Field(default="")
    receipt_no: Optional[str] = Field(default="")
    payment_note: Optional[str] = Field(default="")
    customer_note: Optional[str] = Field(default="")
    receipt_image: Optional[Dict[str, Any]] = Field(default={})
    old_receipt_image: Optional[str] = Field(default="")
    payment_purpose: Optional[str] = Field(default="")  # security, rent, deposit, etc.
    payment_status: Optional[str] = Field(default="pending")  # pending, completed, failed


@form_body
class PaymentUpdate(PaymentBase):
    id: Optional[int] = Field(default=0)
    tenant_id: Optional[int] = Field(default=0)
    booking_id: Optional[int] = Field(default=0)
    customer_id: Optional[int] = Field(default=0)
    amount: Optional[float] = Field(default=0.0)
    payment_date: Optional[str] = Field(default="")
    transaction_id: Optional[str] = Field(default="")
    terminal_id: Optional[str] = Field(default="")
    receipt_no: Optional[str] = Field(default="")
    payment_note: Optional[str] = Field(default="")
    customer_note: Optional[str] = Field(default="")
    receipt_image: Optional[Dict[str, Any]] = Field(default={})
    old_receipt_image: Optional[str] = Field(default="")
    payment_purpose: Optional[str] = Field(default="")
    payment_status: Optional[str] = Field(default="pending")
