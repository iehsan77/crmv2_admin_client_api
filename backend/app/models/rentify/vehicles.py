from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
from app.helpers.general_helper import form_body


class VehicleBase(BaseModel):
    active: Optional[int] = 1
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    status_id: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createdon: Optional[str] = datetime.now(timezone.utc).isoformat()
    updatedon: Optional[str] = datetime.now(timezone.utc).isoformat()


@form_body
class VehicleCreate(VehicleBase):
    id: Optional[int] = Field(default=0)
    affiliate_id: Optional[int] = Field(default=0)
    vehicle_uid: Optional[str] = Field(default="")
    title: Optional[str] = Field(default="")
    slug: Optional[str] = Field(default="")
    title_ar: Optional[str] = Field(default="")
    brand_id: Optional[int] = Field(default=0)
    model_id: Optional[int] = Field(default=0)
    variant_id: Optional[int] = Field(default=0)
    body_type_id: Optional[int] = Field(default=0)
    
    # Vehicle meta
    vehicle_condition: Optional[int] = Field(default=0)
    year: Optional[int] = Field(default=0)
    purchase_date: Optional[str] = Field(default="")
    purchase_price: Optional[float] = Field(default=0.0)
    rent_price: Optional[float] = Field(default=0.0)
    transmission_type_id: Optional[int] = Field(default=0)
    top_speed: Optional[float] = Field(default=0.0)
    acceleration: Optional[float] = Field(default=0.0)
    seats: Optional[int] = Field(default=0)
    fuel_tank_range: Optional[float] = Field(default=0.0)
    fuel_type_id: Optional[int] = Field(default=0)
    mileage: Optional[float] = Field(default=0.0)
    exterior_color_id: Optional[int] = Field(default=0)
    interior_color_id: Optional[int] = Field(default=0)
    number_plate: Optional[str] = Field(default="")
    fitness_renewal_date: Optional[str] = Field(default="")
    horse_power: Optional[float] = Field(default=0.0)
    
    # Features
    feature_ids: Optional[List[int]] = Field(default=[])
    is_feature: Optional[int] = Field(default=0)
    
    # Insurance
    insurer_name: Optional[str] = Field(default="")
    insurance_issue_date: Optional[str] = Field(default="")
    insurance_expiry_date: Optional[str] = Field(default="")
    premium_payment: Optional[float] = Field(default=0.0)
    
    # Descriptions
    description: Optional[str] = Field(default="")
    description_ar: Optional[str] = Field(default="")
    
    # Files
    registration_document: Optional[str] = Field(default="")
    
    # Additional fields
    tenant_id: Optional[int] = Field(default=0)
    editable: Optional[int] = Field(default=1)
    sort_by: Optional[int] = Field(default=0)
    inventory_status: Optional[int] = Field(default=0)


@form_body
class VehicleUpdate(VehicleBase):
    id: Optional[int] = Field(default=0)
    affiliate_id: Optional[int] = Field(default=0)
    vehicle_uid: Optional[str] = Field(default="")
    title: Optional[str] = Field(default="")
    slug: Optional[str] = Field(default="")
    title_ar: Optional[str] = Field(default="")
    brand_id: Optional[int] = Field(default=0)
    model_id: Optional[int] = Field(default=0)
    variant_id: Optional[int] = Field(default=0)
    body_type_id: Optional[int] = Field(default=0)
    
    
    # Vehicle meta
    vehicle_condition: Optional[int] = Field(default=0)
    year: Optional[int] = Field(default=0)
    purchase_date: Optional[str] = Field(default="")
    purchase_price: Optional[float] = Field(default=0.0)
    rent_price: Optional[float] = Field(default=0.0)
    transmission_type_id: Optional[int] = Field(default=0)
    top_speed: Optional[float] = Field(default=0.0)
    acceleration: Optional[float] = Field(default=0.0)
    seats: Optional[int] = Field(default=0)
    fuel_tank_range: Optional[float] = Field(default=0.0)
    fuel_type_id: Optional[int] = Field(default=0)
    mileage: Optional[float] = Field(default=0.0)
    exterior_color_id: Optional[int] = Field(default=0)
    interior_color_id: Optional[int] = Field(default=0)
    number_plate: Optional[str] = Field(default="")
    fitness_renewal_date: Optional[str] = Field(default="")
    horse_power: Optional[float] = Field(default=0.0)
    
    # Features
    feature_ids: Optional[List[int]] = Field(default=[])
    is_feature: Optional[int] = Field(default=0)
    
    # Insurance
    insurer_name: Optional[str] = Field(default="")
    insurance_issue_date: Optional[str] = Field(default="")
    insurance_expiry_date: Optional[str] = Field(default="")
    premium_payment: Optional[float] = Field(default=0.0)
    
    # Descriptions
    description: Optional[str] = Field(default="")
    description_ar: Optional[str] = Field(default="")
    
    # Files
    registration_document: Optional[str] = Field(default="")
    
    # Additional fields
    tenant_id: Optional[int] = Field(default=0)
    editable: Optional[int] = Field(default=1)
    sort_by: Optional[int] = Field(default=0)
    inventory_status: Optional[int] = Field(default=0)


class VehicleInDB(VehicleBase):
    id: int
    affiliate_id: int
    vehicle_uid: str
    title: str
    slug: str
    title_ar: str
    brand_id: int
    model_id: int
    variant_id: int
    body_type_id: int
    
    vehicle_condition: int
    year: int
    purchase_date: str
    purchase_price: float
    rent_price: float
    transmission_type_id: int
    top_speed: float
    acceleration: float
    seats: int
    fuel_tank_range: float
    fuel_type_id: int
    mileage: float
    exterior_color_id: int
    interior_color_id: int
    number_plate: str
    fitness_renewal_date: str
    horse_power: float
    
    feature_ids: List[int]
    is_feature: int
    
    insurer_name: str
    insurance_issue_date: str
    insurance_expiry_date: str    
    premium_payment: float
    
    description: str
    description_ar: str
    
    registration_document: str
    
    tenant_id: int
    editable: int
    sort_by: int
    inventory_status: int

    class Config:
        orm_mode = True



# Images model for vehicles (for storing individual image records)
class VehicleImages(VehicleBase):
    id: Optional[int] = Field(default=0)
    vehicle_id: Optional[int] = Field(default=0)
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


# Documents model for vehicles (for storing individual document records)
class VehicleDocuments(VehicleBase):
    id: Optional[int] = Field(default=0)
    vehicle_id: Optional[int] = Field(default=0)
    url: Optional[str] = Field(default="")
    file_type: Optional[str] = Field(default="")
    file_size: Optional[int] = Field(default=0)
    tenant_id: Optional[int] = Field(default=0)
    createdon: Optional[str] = Field(default="")
    active: Optional[int] = Field(default=1)
    deleted: Optional[int] = Field(default=0)

    class Config:
        orm_mode = True

