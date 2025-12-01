from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
from app.helpers.general_helper import form_body


class AffiliateBase(BaseModel):
    active: Optional[int] = 1
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createdon: Optional[str] = datetime.now(timezone.utc).isoformat()
    updatedon: Optional[str] = datetime.now(timezone.utc).isoformat()


@form_body
class AffiliateCreate(AffiliateBase):
    id: Optional[int] = Field(default=0)
    is_company: Optional[int] = Field(default=0)  # 0 = individual, 1 = company
    first_name: Optional[str] = Field(default="")
    last_name: Optional[str] = Field(default="")
    name: Optional[str] = Field(default="")
    phone: Optional[str] = Field(default="")
    email: Optional[str] = Field(default="")
    city_id: Optional[int] = Field(default=0)
    country_id: Optional[int] = Field(default=0)
    cnic_passport: Optional[str] = Field(default="")
    cnic_passport_expiry: Optional[str] = Field(default="")
    business_address: Optional[str] = Field(default="")
    mailing_address: Optional[str] = Field(default="")
    proof_of_address: Optional[str] = Field(default="")
    insurance_certificate: Optional[str] = Field(default="")
    bank_ac_verification_doc: Optional[str] = Field(default="")
    type_id: Optional[int] = Field(default=0)
    vehicles_affiliated: Optional[int] = Field(default=0)
    category_id: Optional[int] = Field(default=0)
    comission_type_id: Optional[int] = Field(default=0)
    currency_id: Optional[int] = Field(default=0)
    bank_name: Optional[str] = Field(default="")
    ac_title: Optional[str] = Field(default="")
    ac_number: Optional[str] = Field(default="")
    swift_code: Optional[str] = Field(default="")
    payment_method_preference: Optional[str] = Field(default="")
    payment_terms: Optional[str] = Field(default="")
    contract_start_date: Optional[str] = Field(default="")
    contract_end_date: Optional[str] = Field(default="")
    instructions: Optional[str] = Field(default="")
    company_name: Optional[str] = Field(default="")
    logo: Optional[str] = Field(default="")
    trade_license: Optional[str] = Field(default="")
    vat_certificate: Optional[str] = Field(default="")
    trade_license_no: Optional[str] = Field(default="")
    trade_license_expiry: Optional[str] = Field(default="")
    vat_registration_no: Optional[str] = Field(default="")
    vat_registration_expiry: Optional[str] = Field(default="")
    vehicle_capacity: Optional[int] = Field(default=0)
    affiliate_image: Optional[str] = Field(default="")
    driving_license_no: Optional[str] = Field(default="")
    driving_license_expiry: Optional[str] = Field(default="")
    
    # Additional fields
    tenant_id: Optional[int] = Field(default=0)
    editable: Optional[int] = Field(default=1)
    sort_by: Optional[int] = Field(default=0)


@form_body
class AffiliateUpdate(AffiliateBase):
    id: Optional[int] = Field(default=0)
    is_company: Optional[int] = Field(default=0)  # 1 = individual, 2 = company
    first_name: Optional[str] = Field(default="")
    last_name: Optional[str] = Field(default="")
    name: Optional[str] = Field(default="")
    phone: Optional[str] = Field(default="")
    email: Optional[str] = Field(default="")
    city_id: Optional[int] = Field(default=0)
    country_id: Optional[int] = Field(default=0)
    cnic_passport: Optional[str] = Field(default="")
    cnic_passport_expiry: Optional[str] = Field(default="")
    business_address: Optional[str] = Field(default="")
    mailing_address: Optional[str] = Field(default="")
    proof_of_address: Optional[str] = Field(default="")
    insurance_certificate: Optional[str] = Field(default="")
    bank_ac_verification_doc: Optional[str] = Field(default="")
    type_id: Optional[int] = Field(default=0)
    vehicles_affiliated: Optional[int] = Field(default=0)
    category_id: Optional[int] = Field(default=0)
    comission_type_id: Optional[int] = Field(default=0)
    currency_id: Optional[int] = Field(default=0)
    bank_name: Optional[str] = Field(default="")
    ac_title: Optional[str] = Field(default="")
    ac_number: Optional[str] = Field(default="")
    swift_code: Optional[str] = Field(default="")
    payment_method_preference: Optional[str] = Field(default="")
    payment_terms: Optional[str] = Field(default="")
    contract_start_date: Optional[str] = Field(default="")
    contract_end_date: Optional[str] = Field(default="")
    instructions: Optional[str] = Field(default="")
    company_name: Optional[str] = Field(default="")
    logo: Optional[str] = Field(default="")
    trade_license: Optional[str] = Field(default="")
    vat_certificate: Optional[str] = Field(default="")
    trade_license_no: Optional[str] = Field(default="")
    trade_license_expiry: Optional[str] = Field(default="")
    vat_registration_no: Optional[str] = Field(default="")
    vat_registration_expiry: Optional[str] = Field(default="")
    vehicle_capacity: Optional[int] = Field(default=0)
    affiliate_image: Optional[str] = Field(default="")
    driving_license_no: Optional[str] = Field(default="")
    driving_license_expiry: Optional[str] = Field(default="")
    
    # Additional fields
    tenant_id: Optional[int] = Field(default=0)
    editable: Optional[int] = Field(default=1)
    sort_by: Optional[int] = Field(default=0)


class AffiliateInDB(AffiliateBase):
    id: int
    is_company: int
    first_name: str
    last_name: str
    phone: str
    email: str
    city_id: int
    country_id: int
    cnic_passport: str
    cnic_passport_expiry: str
    business_address: str
    mailing_address: str
    proof_of_address: str
    insurance_certificate: str
    bank_ac_verification_doc: str
    type_id: int
    vehicles_affiliated: int
    category_id: int
    comission_type_id: int
    currency_id: int
    bank_name: str
    ac_title: str
    ac_number: str
    swift_code: str
    payment_method_preference: str
    payment_terms: str
    contract_start_date: str
    contract_end_date: str
    instructions: str
    active: int
    company_name: str
    logo: str
    trade_license: str
    vat_certificate: str
    trade_license_no: str
    trade_license_expiry: str
    vat_registration_no: str
    vat_registration_expiry: str
    vehicle_capacity: int
    affiliate_image: str
    driving_license_no: str
    driving_license_expiry: str
    
    # Additional fields
    tenant_id: int
    editable: int
    sort_by: int

    class Config:
        orm_mode = True


# Documents model for affiliates (for storing individual document records)
class AffiliateDocuments(AffiliateBase):
    id: Optional[int] = Field(default=0)
    affiliate_id: Optional[int] = Field(default=0)
    url: Optional[str] = Field(default="")
    file_type: Optional[str] = Field(default="")
    file_size: Optional[int] = Field(default=0)
    document_type: Optional[str] = Field(default="")  # license, contract, tax_certificate, etc.
    tenant_id: Optional[int] = Field(default=0)
    createdon: Optional[str] = Field(default="")
    active: Optional[int] = Field(default=1)
    deleted: Optional[int] = Field(default=0)

    class Config:
        orm_mode = True
