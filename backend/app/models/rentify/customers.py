from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
from app.helpers.general_helper import form_body


class CustomerBase(BaseModel):
    active: Optional[int] = 1
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createdon: Optional[str] = datetime.now(timezone.utc).isoformat()
    updatedon: Optional[str] = datetime.now(timezone.utc).isoformat()


@form_body
class CustomerCreate(CustomerBase):
    id: Optional[int] = Field(default=0)
    tenant_id: Optional[int] = Field(default=0)
    is_company: Optional[int] = Field(default=0)
    first_name: Optional[str] = Field(default="")
    last_name: Optional[str] = Field(default="")
    
    contact: Optional[str] = Field(default="")
    email: Optional[str] = Field(default="")
    company_name: Optional[str] = Field(default="")
    contact_person: Optional[str] = Field(default="")
    address1: Optional[str] = Field(default="")
    address2: Optional[str] = Field(default="")
    postal_code: Optional[str] = Field(default="")
    driving_license_no: Optional[str] = Field(default="")
    driving_license_expiry: Optional[str] = Field(default="")
    passport_id: Optional[str] = Field(default="")
    passport_expiry: Optional[str] = Field(default="")
    visa_no: Optional[str] = Field(default="")
    visa_expiry: Optional[str] = Field(default="")
    nationality_id: Optional[int] = Field(default="")
    country_id: Optional[int] = Field(default="")
    contact_cnic: Optional[str] = Field(default="")
    contact_cnic_expiry: Optional[str] = Field(default="")
    trade_license_no: Optional[str] = Field(default="")
    trade_license_expiry: Optional[str] = Field(default="")



@form_body
class CustomerUpdate(CustomerBase):
    id: Optional[int] = Field(default=0)
    tenant_id: Optional[int] = Field(default=0)
    is_company: Optional[int] = Field(default=0)
    first_name: Optional[str] = Field(default="")
    last_name: Optional[str] = Field(default="")
    
    contact: Optional[str] = Field(default="")
    email: Optional[str] = Field(default="")
    company_name: Optional[str] = Field(default="")
    contact_person: Optional[str] = Field(default="")
    address1: Optional[str] = Field(default="")
    address2: Optional[str] = Field(default="")
    postal_code: Optional[str] = Field(default="")
    driving_license_no: Optional[str] = Field(default="")
    driving_license_expiry: Optional[str] = Field(default="")
    passport_id: Optional[str] = Field(default="")
    passport_expiry: Optional[str] = Field(default="")
    visa_no: Optional[str] = Field(default="")
    visa_expiry: Optional[str] = Field(default="")
    nationality_id: Optional[int] = Field(default="")
    country_id: Optional[int] = Field(default="")
    contact_cnic: Optional[str] = Field(default="")
    contact_cnic_expiry: Optional[str] = Field(default="")
    trade_license_no: Optional[str] = Field(default="")
    trade_license_expiry: Optional[str] = Field(default="")


# Images model for customers (for storing individual image records)
class CustomersImages(CustomerBase):
    id: Optional[int] = Field(default=0)
    customer_id: Optional[int] = Field(default=0)
    url: Optional[str] = Field(default="")
    image_type: Optional[str] = Field(default="")
    tenant_id: Optional[int] = Field(default=0)
    file_type: Optional[str] = Field(default="")
    file_size: Optional[int] = Field(default=0)
    createdon: Optional[str] = Field(default="")
    active: Optional[int] = Field(default=1)
    deleted: Optional[int] = Field(default=0)

    class Config:
        orm_mode = True
