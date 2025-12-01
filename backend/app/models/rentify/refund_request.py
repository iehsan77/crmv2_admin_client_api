from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
from app.helpers.general_helper import form_body


class RefundRequestBase(BaseModel):
    active: Optional[int] = 1
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createdon: Optional[str] = datetime.now(timezone.utc)
    updatedon: Optional[str] = datetime.now(timezone.utc)



@form_body
class RefundRequestCreate(RefundRequestBase):
    id: Optional[int] = Field(default=0)
    tenant_id: Optional[int] = Field(default=0)
    booking_id: Optional[int] = Field(default=0)
    refund_reason_id: Optional[int] = Field(default=0)
    specify_reason: Optional[str] = Field(default="")
    refund_amount: Optional[float] = Field(default=0.0)
    refund_method_id: Optional[int] = Field(default=0)
    bank_name: Optional[str] = Field(default="")
    iban_number: Optional[str] = Field(default="")
    account_name: Optional[str] = Field(default="")
    bank_verified: Optional[int] = Field(default=1)
    agree_refund_policy: Optional[int] = Field(default=1)
    status_id: Optional[int] = Field(default=1)


@form_body
class RefundRequestUpdate(RefundRequestBase):
    id: Optional[int] = Field(default=0)
    tenant_id: Optional[int] = Field(default=0)
    booking_id: Optional[int] = Field(default=0)
    refund_reason_id: Optional[int] = Field(default=0)
    specify_reason: Optional[str] = Field(default="")
    refund_amount: Optional[float] = Field(default=0.0)
    refund_method_id: Optional[int] = Field(default=0)
    bank_name: Optional[str] = Field(default="")
    iban_number: Optional[str] = Field(default="")
    account_name: Optional[str] = Field(default="")
    bank_verified: Optional[int] = Field(default=1)
    agree_refund_policy: Optional[int] = Field(default=1)
    status_id: Optional[int] = Field(default=1)