from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
from app.helpers.general_helper import form_body


class BookingBase(BaseModel):
    active: Optional[int] = 1
    deleted: Optional[int] = 0
    add_by: Optional[int] = 0
    edit_by: Optional[int] = 0
    deleted_by: Optional[int] = 0
    createdon: Optional[str] = datetime.now(timezone.utc).isoformat()
    updatedon: Optional[str] = datetime.now(timezone.utc).isoformat()


@form_body
class BookingCreate(BookingBase):
    id: Optional[int] = Field(default=0)
    booking_uid: Optional[str] = Field(default="")
    tenant_id: Optional[int] = Field(default=0)
    customer_id: Optional[int] = Field(default=0)
    vehicle_id: Optional[int] = Field(default=0)
    fuel_level_id: Optional[int] = Field(default=0)
    exterior_condition_id: Optional[int] = Field(default=0)
    interior_condition_id: Optional[int] = Field(default=0)
    tyre_condition_id: Optional[int] = Field(default=0)
    spare_tyre: Optional[int] = Field(default=0)
    toolkit: Optional[int] = Field(default=0)
    mileage_at_pickup: Optional[float] = Field(default=0.0)
    mileage_limit: Optional[float] = Field(default=0.0)
    pickup_time: Optional[str] = Field(default="")
    return_time: Optional[str] = Field(default="")
    pickup_location: Optional[str] = Field(default="")
    dropoff_location: Optional[str] = Field(default="")    
    rent_price: Optional[float] = Field(default=0.0)
    number_of_days: Optional[int] = Field(default=0)    
    security_deposit: Optional[float] = Field(default=0.0)
    payment_method_id: Optional[int] = Field(default=0)    
    payment_status_id: Optional[int] = Field(default=1)    
    total_rent_amount: Optional[float] = Field(default=0.0)
    booking_status_id: Optional[int] = Field(default=0)
    confirm_booking: Optional[int] = Field(default=0)
    # Delivery details stored within booking document
    handover_by: Optional[str] = Field(default="")
    received_by: Optional[str] = Field(default="")
    confirm_booking_delivery: Optional[int] = Field(default=0)
    # Return details stored within booking document
    return_received_by: Optional[str] = Field(default="")
    return_received_from: Optional[str] = Field(default="")
    confirm_booking_return: Optional[int] = Field(default=0)
    security_deposit_status_id:Optional[int] = Field(default=1)    
    
   
    


@form_body
class BookingUpdate(BookingBase):
    id: Optional[int] = Field(default=0)
    booking_uid: Optional[str] = Field(default="")
    tenant_id: Optional[int] = Field(default=0)
    customer_id: Optional[int] = Field(default=0)
    vehicle_id: Optional[int] = Field(default=0)
    fuel_level_id: Optional[int] = Field(default=0)
    exterior_condition_id: Optional[int] = Field(default=0)
    interior_condition_id: Optional[int] = Field(default=0)
    tyre_condition_id: Optional[int] = Field(default=0)
    spare_tyre: Optional[int] = Field(default=0)
    toolkit: Optional[int] = Field(default=0)
    mileage_at_pickup: Optional[float] = Field(default=0.0)
    mileage_limit: Optional[float] = Field(default=0.0)
    pickup_time: Optional[str] = Field(default="")
    return_time: Optional[str] = Field(default="")
    pickup_location: Optional[str] = Field(default="")
    dropoff_location: Optional[str] = Field(default="")    
    rent_price: Optional[float] = Field(default=0.0)
    number_of_days: Optional[int] = Field(default=0)    
    security_deposit: Optional[float] = Field(default=0.0)
    payment_method_id: Optional[int] = Field(default=0)    
    payment_status_id: Optional[int] = Field(default=1)    
    total_rent_amount: Optional[float] = Field(default=0.0)
    booking_status_id: Optional[int] = Field(default=0)
    confirm_booking: Optional[int] = Field(default=0)
    # Delivery details stored within booking document
    handover_by: Optional[str] = Field(default="")
    received_by: Optional[str] = Field(default="")
    confirm_booking_delivery: Optional[int] = Field(default=0)
    # Return details stored within booking document
    return_received_by: Optional[str] = Field(default="")
    return_received_from: Optional[str] = Field(default="")
    confirm_booking_return: Optional[int] = Field(default=0)
    security_deposit_status_id:Optional[int] = Field(default=1)
    
   