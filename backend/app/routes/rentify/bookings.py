from __future__ import annotations

from fastapi import APIRouter, Request, status, Depends
from app.networks.database import db_rentify
from app.utils import oauth2, config
from datetime import datetime, timezone, timedelta
from typing import Optional, Any
from app.helpers.uploadimage import UploadImage

bookings = APIRouter(tags=["Rentify Admin > Rentify > bookings"])

collection = db_rentify.rentify_bookings
activity_logs_collection = db_rentify.activity_logs
customers_collection = db_rentify.rentify_customers
customers_documents_collection = db_rentify.rentify_customers_documents
vehicle_images_collection = db_rentify.vehicle_images
vehicle_delivery_images_collection = db_rentify.rentify_vehicle_delivery_images
vehicle_return_images_collection = db_rentify.rentify_vehicle_return_images
vehicles_collection = db_rentify.rentify_vehicles
payments_collection = db_rentify.rentify_payments
delivery_collection = db_rentify.rentify_delivery
vehicle_return_collection = db_rentify.rentify_vehicle_returns
refund_request_collection = db_rentify.rentify_refund_requests
customer_attachments_collection = db_rentify.rentify_customers_attachments
favorite_collection = db_rentify.rentify_favorites

attachments_collection = db_rentify.attachments

from app.helpers.general_helper import (
    convert_to_jsonable,
    format_percent_value,
    get_error_details,
    get_last_activity_date,
    get_next_id,
)
from app.helpers.crm_helper import log_activity
from app.helpers.globalfunctions import (
    getVehicleById, getModelById, getVariantById, getBrandById, 
    getBodyTypeById, getFuelTypeById, getTransmissionTypeById, 
    getColorById, getCountryById, getCustomerById,
    getPaymentById, getPaymentsByBookingId, getRefundRequestById,
    getVehicleDeliveryById, getVehicleReturnById
)
from app.models.rentify.bookings import BookingCreate, BookingUpdate
from app.models.rentify.customers import CustomerCreate, CustomersImages
from app.models.rentify.payments import PaymentCreate, PaymentUpdate
from app.models.rentify.delivery import DeliveryCreate, DeliveryUpdate
from app.models.rentify.vehicle_delivery_images import VehicleDeliveryImage
from app.models.rentify.vehicle_return import VehicleReturnCreate, VehicleReturnUpdate
from app.models.rentify.vehicle_return_images import VehicleReturnImage
from app.models.rentify.refund_request import RefundRequestCreate, RefundRequestUpdate

NO_ID_PROJECTION = {"_id": 0}


"""
export const BOOKING_REFUND_REQUESTS_STATUSES = [
  { label: "Requested", value: "1" },
  { label: "Under Verification", value: "2" },
  { label: "Approved", value: "3" },
  { label: "Rejected", value: "4" },
  { label: "In Process", value: "5" },
  { label: "Completed", value: "6" },
  { label: "Failed", value: "7" },
  { label: "Closed", value: "8" },
];



"""



def build_booking_filters(form: dict, tenant_id: int) -> tuple[dict, list[str]]:
    warnings: list[str] = []
    filter_query: dict = {"deleted": {"$ne": 1}, "tenant_id": tenant_id}
    current_time = datetime.now(timezone.utc)
    vehicle_query_filters: dict[str, int] = {}

    

    view_value = form.get("view", "all_bookings")
    if view_value == "my_bookings":
        filter_query["tenant_id"] = tenant_id
    elif view_value == "affiliate_bookings":
        filter_query["$and"] = [{"tenant_id": {"$ne": tenant_id}}]
    elif view_value == "active":
        filter_query["active"] = 1
    elif view_value == "favorite":
        filter_query["favorite"] = 1
    elif view_value == "returning_today":
        filter_query["return_time"] = {"$regex": str(datetime.now(timezone.utc).date().isoformat()), "$options": "i"}
    elif view_value  == "overdue_returns":
        filter_query["return_time"] = {"$lt": datetime.now(timezone.utc).date().isoformat()}
    elif view_value == "refunded":
        refund_requests = list(refund_request_collection.find({
            "tenant_id": tenant_id,
            "deleted": {"$ne": 1},
            "status_id": {"$in": [6]}
        }, {"booking_id": 1}))
        refunded_booking_ids: set[int] = set()
        for refund in refund_requests:
            booking_id = refund.get("booking_id")
            if booking_id is None:
                continue
            try:
                refunded_booking_ids.add(int(booking_id))
            except (TypeError, ValueError):
                continue
        if refunded_booking_ids:
            filter_query["id"] = {"$in": list(refunded_booking_ids)}
        else:
            pass
    elif view_value == "unpaid":
        filter_query["payment_status_id"] = 1
    elif view_value == "fully_paid":
        filter_query["payment_status_id"] = 2
    elif view_value == "deposit_paid":
        filter_query["security_deposit_status_id"] = 2

    # booking_id
    booking_id_value = form.get("booking_id")
    if booking_id_value:
        try:
            filter_query["id"] = int(booking_id_value)
        except (ValueError, TypeError):
            warnings.append(f"Invalid 'booking_id' value '{booking_id_value}', filter skipped")

   
   # model and body_type filters
    def _apply_vehicle_filter(field: str) -> None:
        raw_value = form.get(field)
        if raw_value in (None, ""):
            return
        try:
            vehicle_query_filters[field] = int(raw_value)
        except (ValueError, TypeError):
            warnings.append(f"Invalid '{field}' value '{raw_value}', filter skipped")

    _apply_vehicle_filter("model_id")
    _apply_vehicle_filter("body_type_id")

    vehicle_ids_filter: set[int] | None = None
    if vehicle_query_filters:
        try:
            vehicle_ids = vehicles_collection.distinct(
                "id",
                {
                    "tenant_id": tenant_id,
                    "deleted": {"$ne": 1},
                    **vehicle_query_filters,
                },
            )
            vehicle_ids_filter = {int(vehicle_id) for vehicle_id in vehicle_ids if vehicle_id is not None}
        except Exception:
            warnings.append("Unable to fetch vehicles for provided filters")

    if form.get("model_id") != "" or form.get("body_type_id") != "":
        if vehicle_ids_filter:
            filter_query["vehicle_id"] = {"$in": list(vehicle_ids_filter)}
        else: 
            filter_query["vehicle_id"] = {"$in": []}


    # booking_status_id
    status_id_value = form.get("booking_status_id")
    if status_id_value:
        try:
            filter_query["booking_status_id"] = int(status_id_value)
        except (ValueError, TypeError):
            warnings.append(f"Invalid 'booking_status_id' value '{status_id_value}', filter skipped")

    


    # last_activity date range helpers
    last_activity_value = form.get("last_activity")
    last_activity_duration = None
    if last_activity_value in ["last_24_hours", "last_7_days", "last_30_days"]:
        last_activity_duration = last_activity_value

    if last_activity_duration:
        try:
            now_utc = datetime.now(timezone.utc)
            if last_activity_duration == "last_24_hours":
                start_time = now_utc - timedelta(hours=24)
            elif last_activity_duration == "last_7_days":
                start_time = now_utc - timedelta(days=7)
            elif last_activity_duration == "last_30_days":
                start_time = now_utc - timedelta(days=30)
            else:
                start_time = now_utc

            start_time_iso = start_time.isoformat()

            activity_logs = list(activity_logs_collection.find({
                "entity_type": "booking",
                "tenant_id": tenant_id,
                "deleted": {"$ne": 1},
                "createdon": {"$gte": start_time_iso}
            }, {"entity_id": 1}))

            booking_ids_with_activity: set[int] = set()
            for log in activity_logs:
                entity_id = log.get("entity_id")
                if entity_id:
                    try:
                        booking_ids_with_activity.add(int(entity_id))
                    except (TypeError, ValueError):
                        continue

            if "id" in filter_query:
                existing_filter = filter_query["id"]
                existing_ids: set[int] = set()
                if isinstance(existing_filter, dict) and "$in" in existing_filter:
                    existing_ids = set(existing_filter["$in"])
                else:
                    try:
                        existing_ids = {int(existing_filter)}
                    except (TypeError, ValueError):
                        existing_ids = set()
                if existing_ids:
                    booking_ids_with_activity = booking_ids_with_activity.intersection(existing_ids)
                else:
                    booking_ids_with_activity = set()

            if booking_ids_with_activity:
                filter_query["id"] = {"$in": list(booking_ids_with_activity)}
            else:
                filter_query["id"] = {"$in": []}
        except Exception:
            warnings.append(f"Invalid 'last_activity' value '{last_activity_value}', filter skipped")

    # client info filters via customers collection lookup
    customer_filter_values: dict[str, str] = {}
    for key in ["client_name", "client_phone", "client_email"]:
        val = form.get(key)
        if val not in (None, ""):
            try:
                customer_filter_values[key] = str(val)
            except (ValueError, TypeError):
                warnings.append(f"Invalid '{key}' value '{val}', filter skipped")

    if customer_filter_values:
        try:
            customer_query: dict = {"tenant_id": tenant_id, "deleted": {"$ne": 1}}
            customer_conditions: list[dict] = []

            name_val = customer_filter_values.get("client_name")
            if name_val:
                name_regex = {"$regex": name_val, "$options": "i"}
                customer_conditions.append(
                    {
                        "$or": [
                            {"first_name": name_regex},
                            {"last_name": name_regex},
                            {"company_name": name_regex},
                            {"contact_person": name_regex},
                        ]
                    }
                )

            phone_val = customer_filter_values.get("client_phone")
            if phone_val:
                phone_regex = {"$regex": phone_val, "$options": "i"}
                customer_conditions.append({"contact": phone_regex})

            email_val = customer_filter_values.get("client_email")
            if email_val:
                email_regex = {"$regex": email_val, "$options": "i"}
                customer_conditions.append({"email": email_regex})

            if customer_conditions:
                customer_query["$and"] = customer_conditions

            matching_customers = customers_collection.find(customer_query, {"id": 1})
            matched_customer_ids: set[int] = set()
            for customer in matching_customers:
                customer_id = customer.get("id")
                if customer_id is None:
                    continue
                try:
                    matched_customer_ids.add(int(customer_id))
                except (TypeError, ValueError):
                    continue

            filter_query["customer_id"] = {"$in": list(matched_customer_ids)}
            if not matched_customer_ids:
                filter_query["customer_id"]["$in"] = []
        except Exception:
            warnings.append("Unable to apply client filters due to an internal error")


    booking_date_value = form.get("pickup_time")
    if booking_date_value:
        try:
            filter_query["pickup_time"] = {"$regex": str(booking_date_value), "$options": "i"}
        except (ValueError, TypeError):
            warnings.append(f"Invalid 'booking_date' value '{booking_date_value}', filter skipped")


    # rental_fee range
    rental_fee = form.get("rent_price")
    if rental_fee:
        try:
            filter_query["rent_price"] = float(rental_fee)
        except (ValueError, TypeError):
            warnings.append(f"Invalid 'rental_fee' value '{rental_fee}', filter skipped")

    return filter_query, warnings


@bookings.post("/rentify/bookings/get")
async def get_bookings(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        form = await request.form()
        tenant_id = int(user_detail.get("tenant_id", 0))
        view_value = form.get("view", "all_bookings")

        filter_query, warnings = build_booking_filters(form, tenant_id)

        #records = list(collection.find(filter_query, NO_ID_PROJECTION))
        records = list(
                        collection.find(filter_query, NO_ID_PROJECTION)
                        .sort("id", -1)  # -1 means descending order
                    )

        
        if records:
            for record in records:
                record["vehicle_details"] = getVehicleById(int(record.get("vehicle_id", 0)))
                
                # Handle case where vehicle details might be None
                if record["vehicle_details"]:
                    record["vehicle_details"]["model_details"] = getModelById(int(record["vehicle_details"].get("model_id", 0)))
                    record["vehicle_details"]["variant_details"] = getVariantById(int(record["vehicle_details"].get("variant_id", 0)))
                    record["vehicle_details"]["brand_details"] = getBrandById(int(record["vehicle_details"].get("brand_id", 0)))
                    record["vehicle_details"]["origin_country_details"] = getCountryById(int(record["vehicle_details"].get("origin_country_id", 0)))
                    record["vehicle_details"]["body_type_details"] = getBodyTypeById(int(record["vehicle_details"].get("body_type_id", 0)))
                    record["vehicle_details"]["fuel_type_details"] = getFuelTypeById(int(record["vehicle_details"].get("fuel_type_id", 0)))
                    record["vehicle_details"]["transmission_type_details"] = getTransmissionTypeById(int(record["vehicle_details"].get("transmission_type_id", 0)))
                    record["vehicle_details"]["exterior_color_details"] = getColorById(int(record["vehicle_details"].get("exterior_color_id", 0)))
                    record["vehicle_details"]["interior_color_details"] = getColorById(int(record["vehicle_details"].get("interior_color_id", 0)))
                else:
                    # Set default empty structure when vehicle not found
                    record["vehicle_details"] = {
                        "model_details": None,
                        "variant_details": None,
                        "brand_details": None,
                        "origin_country_details": None,
                        "body_type_details": None,
                        "fuel_type_details": None,
                        "transmission_type_details": None,
                        "exterior_color_details": None,
                        "interior_color_details": None,
                        "id": 0
                    }
                record["customer_details"] = getCustomerById(int(record.get("customer_id", 0)))
                record["vehicle_thumbnail"] = list(vehicle_images_collection.find({"vehicle_id": int(record["vehicle_details"].get("id", 0)), "image_type": "thumbnail"}, NO_ID_PROJECTION))
                record["old_vehicle_delivery_images"] = list(vehicle_delivery_images_collection.find({"booking_id": int(record.get("id", 0)), "deleted": {"$ne": 1}}, NO_ID_PROJECTION))
                record["old_vehicle_return_images"] = list(vehicle_return_images_collection.find({"booking_id": int(record.get("id", 0)), "deleted": {"$ne": 1}}, NO_ID_PROJECTION))
                booking_id = int(record.get("id", 0))
                record["refund_request_details"] = getRefundRequestById(booking_id)
                record["vehicle_delivery_details"] = getVehicleDeliveryById(booking_id)
                record["vehicle_return_details"] = getVehicleReturnById(booking_id)
                record["payment_details"] = getPaymentsByBookingId(booking_id)
                # Legacy payment fields for backward compatibility
                record["pos_security_deposit"] = getPaymentById(0, booking_id, "security_deposit_pos")
                record["pos_rent_payment"] = getPaymentById(0, booking_id, "rent_pos")
                record["card_security_deposit"] = getPaymentById(0, booking_id, "security_deposit_card")
                record["card_rent_payment"] = getPaymentById(0, booking_id, "rent_card")
                record["security_deposit_payment_details"] = getPaymentById(0, booking_id, "security")
                


                # Refund request details by booking_id (latest)
                try:
                    refund_obj = refund_request_collection.find_one(
                        {"booking_id": int(record.get("id", 0)), "deleted": {"$ne": 1}},
                        NO_ID_PROJECTION,
                        sort=[("createdon", -1)]
                    )
                    record["refund_request_details"] = refund_obj or {}
                except Exception:
                    record["refund_request_details"] = {}
                
                
        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": convert_to_jsonable(records),
            "total_count": len(records),
            "filters_summary": {
                "view": form.get("view", "all_bookings"),
                "booking_id": form.get("booking_id"),
                "booking_status_id": form.get("booking_status_id"),
                "last_activity": form.get("last_activity"),
                "client_name": form.get("client_name"),
                "phone": form.get("phone"),
                "email": form.get("email"),
                "vehicle_model": form.get("vehicle_model"),
                "vehicle_type": form.get("vehicle_type"),
                "rental_fee": form.get("rental_fee"),
            }
        }
    except Exception as e:
        return get_error_details(e)


@bookings.post("/rentify/bookings/get-for-calendar")
async def get_bookings(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        form = await request.form()
        tenant_id = int(user_detail.get("tenant_id", 0))
        view_value = form.get("view", "all_bookings")

        filter_query, warnings = build_booking_filters(form, tenant_id)
        #records = list(collection.find(filter_query, NO_ID_PROJECTION))
        records = list(
                        collection.find(filter_query, NO_ID_PROJECTION)
                        .sort("id", -1)  # -1 means descending order
                    )

        
        if records:
            for record in records:
                record["vehicle_details"] = getVehicleById(int(record.get("vehicle_id", 0)))
                
                # Handle case where vehicle details might be None
                if record["vehicle_details"]:
                    record["vehicle_details"]["model_details"] = getModelById(int(record["vehicle_details"].get("model_id", 0)))
                    record["vehicle_details"]["variant_details"] = getVariantById(int(record["vehicle_details"].get("variant_id", 0)))
                    record["vehicle_details"]["brand_details"] = getBrandById(int(record["vehicle_details"].get("brand_id", 0)))
                    record["vehicle_details"]["origin_country_details"] = getCountryById(int(record["vehicle_details"].get("origin_country_id", 0)))
                    record["vehicle_details"]["body_type_details"] = getBodyTypeById(int(record["vehicle_details"].get("body_type_id", 0)))
                    record["vehicle_details"]["fuel_type_details"] = getFuelTypeById(int(record["vehicle_details"].get("fuel_type_id", 0)))
                    record["vehicle_details"]["transmission_type_details"] = getTransmissionTypeById(int(record["vehicle_details"].get("transmission_type_id", 0)))
                    record["vehicle_details"]["exterior_color_details"] = getColorById(int(record["vehicle_details"].get("exterior_color_id", 0)))
                    record["vehicle_details"]["interior_color_details"] = getColorById(int(record["vehicle_details"].get("interior_color_id", 0)))
                else:
                    # Set default empty structure when vehicle not found
                    record["vehicle_details"] = {
                        "model_details": None,
                        "variant_details": None,
                        "brand_details": None,
                        "origin_country_details": None,
                        "body_type_details": None,
                        "fuel_type_details": None,
                        "transmission_type_details": None,
                        "exterior_color_details": None,
                        "interior_color_details": None,
                        "id": 0
                    }
                record["customer_details"] = getCustomerById(int(record.get("customer_id", 0)))
                record["vehicle_thumbnail"] = list(vehicle_images_collection.find({"vehicle_id": int(record["vehicle_details"].get("id", 0)), "image_type": "thumbnail"}, NO_ID_PROJECTION))
                record["old_vehicle_delivery_images"] = list(vehicle_delivery_images_collection.find({"booking_id": int(record.get("id", 0)), "deleted": {"$ne": 1}}, NO_ID_PROJECTION))
                record["old_vehicle_return_images"] = list(vehicle_return_images_collection.find({"booking_id": int(record.get("id", 0)), "deleted": {"$ne": 1}}, NO_ID_PROJECTION))
                booking_id = int(record.get("id", 0))
                record["refund_request_details"] = getRefundRequestById(booking_id)
                record["vehicle_delivery_details"] = getVehicleDeliveryById(booking_id)
                record["vehicle_return_details"] = getVehicleReturnById(booking_id)
                record["payment_details"] = getPaymentsByBookingId(booking_id)
                # Legacy payment fields for backward compatibility
                record["pos_security_deposit"] = getPaymentById(0, booking_id, "security_deposit_pos")
                record["pos_rent_payment"] = getPaymentById(0, booking_id, "rent_pos")
                record["card_security_deposit"] = getPaymentById(0, booking_id, "security_deposit_card")
                record["card_rent_payment"] = getPaymentById(0, booking_id, "rent_card")
                record["security_deposit_payment_details"] = getPaymentById(0, booking_id, "security")
                


                # Refund request details by booking_id (latest)
                try:
                    refund_obj = refund_request_collection.find_one(
                        {"booking_id": int(record.get("id", 0)), "deleted": {"$ne": 1}},
                        NO_ID_PROJECTION,
                        sort=[("createdon", -1)]
                    )
                    record["refund_request_details"] = refund_obj or {}
                except Exception:
                    record["refund_request_details"] = {}
                
                
        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": convert_to_jsonable(records),
            "total_count": len(records),
            "filters_summary": {
                "view": form.get("view", "all_bookings"),
                "booking_id": form.get("booking_id"),
                "booking_status_id": form.get("booking_status_id"),
                "last_activity": form.get("last_activity"),
                "client_name": form.get("client_name"),
                "phone": form.get("phone"),
                "email": form.get("email"),
                "vehicle_model": form.get("vehicle_model"),
                "vehicle_type": form.get("vehicle_type"),
                "rental_fee": form.get("rental_fee"),
            },
        }
    except Exception as e:
        return get_error_details(e)



        # Required ints/floats with safe casting
def to_int(val, default=0):
            try:
                return int(val) if val not in (None, "") else default
            except (ValueError, TypeError):
                return default

def to_float(val, default=0.0):
            try:
                return float(val) if val not in (None, "") else default
            except (ValueError, TypeError):
                return default

def parse_iso_datetime(value: Any) -> Optional[datetime]:
            if not value:
                return None
            if isinstance(value, datetime):
                return value
            if isinstance(value, str):
                cleaned = value.strip()
                if not cleaned:
                    return None
                try:
                    return datetime.fromisoformat(cleaned.replace("Z", "+00:00"))
                except ValueError:
                    return None
            return None

def has_interval_overlap(start_a: Optional[datetime], end_a: Optional[datetime], start_b: Optional[datetime], end_b: Optional[datetime]) -> bool:
            if not all([start_a, end_a, start_b, end_b]):
                return False
            return start_a <= end_b and start_b <= end_a


@bookings.post("/rentify/bookings/save")
async def save_booking(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    form = await request.form()
    try:
        pickup_time_str = form.get("pickup_time", "") or ""
        return_time_str = form.get("return_time", "") or ""
        pickup_dt = parse_iso_datetime(pickup_time_str)
        return_dt = parse_iso_datetime(return_time_str)
        vehicle_id = to_int(form.get("vehicle_id", 0))

      

        
        
        doc_id = int(form.get("id", 0))
        next_id = doc_id or get_next_id(collection)

        data = BookingCreate() if doc_id == 0 else BookingUpdate()
        data.id = next_id if doc_id == 0 else doc_id
     # Map fields
        data.tenant_id = to_int(user_detail.get("tenant_id", 0))
        data.customer_id = to_int(form.get("customer_id", 0))
        data.vehicle_id = vehicle_id
     
        
        # Vehicle related Data
        data.fuel_level_id = to_int(form.get("fuel_level_id", 0))
        data.exterior_condition_id = to_int(form.get("exterior_condition_id", 0))
        data.interior_condition_id = to_int(form.get("interior_condition_id", 0))
        data.tyre_condition_id = to_int(form.get("tyre_condition_id", 0))
        data.spare_tyre = to_int(form.get("spare_tyre", 0))
        data.toolkit = to_int(form.get("toolkit", 0))
        data.mileage_at_pickup = to_float(form.get("mileage_at_pickup", 0))
        data.mileage_limit = to_float(form.get("mileage_limit", 0))
        
        
        # Booking related Data
        data.pickup_time = pickup_time_str
        data.return_time = return_time_str
        data.pickup_location = form.get("pickup_location", "") or ""
        data.dropoff_location = form.get("dropoff_location", "") or ""
        data.confirm_booking = to_int(form.get("confirm_booking", 1))

        pickup_dt = parse_iso_datetime(data.pickup_time)
        return_dt = parse_iso_datetime(data.return_time)

        if pickup_dt and return_dt and return_dt <= pickup_dt:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "success": False,
                "message": "Return time must be after pickup time.",
                "error_code": "INVALID_BOOKING_WINDOW"
            }
        
        
        # Payment related Data
        data.rent_price = to_float(form.get("rent_price", 0))
        data.number_of_days = to_int(form.get("number_of_days", 0))
        data.security_deposit = to_float(form.get("security_deposit", 0))
        data.payment_method_id = to_int(form.get("payment_method_id", 0))
        data.payment_status_id = to_int(form.get("payment_status_id", 1))
        data.total_rent_amount = to_float(form.get("total_rent_amount", 0))
        
        
        data.booking_status_id = to_int(form.get("booking_status_id", 1))
        data.security_deposit_status_id = to_int(form.get("security_deposit_status_id", 1))

        
        if vehicle_id > 0:
            vehicle = vehicles_collection.find_one(
                {"id": vehicle_id, "deleted": {"$ne": 1}},
                {"status_id": 1, "insurance_expiry_date": 1, "fitness_renewal_date": 1, "title": 1, "vehicle_uid": 1}
            )
            if vehicle:
                vehicle_status_id = vehicle.get("status_id", 0)
                if vehicle_status_id == 6:
                    return {
                        "status": status.HTTP_400_BAD_REQUEST,
                        "success": False,
                        "message": "Cannot book this vehicle: Vehicle is inactive (not in use anymore).",
                        "error_code": "VEHICLE_INACTIVE",
                        "data": {
                            "vehicle_id": vehicle_id,
                            "vehicle_uid": vehicle.get("vehicle_uid", ""),
                            "vehicle_title": vehicle.get("title", ""),
                            "status_id": vehicle_status_id
                        }
                    }
                if vehicle_status_id == 5:
                    return {
                        "status": status.HTTP_400_BAD_REQUEST,
                        "success": False,
                        "message": "Cannot book this vehicle: Vehicle is temporarily unavailable. Please contact administrator."
                    }
    
                if vehicle_status_id == 4:
                    return {
                        "status": status.HTTP_400_BAD_REQUEST,
                        "success": False,
                        "message": "Cannot book this vehicle: Vehicle is Under inspection. Please contact administrator.",
                        "error_code": "VEHICLE_ALREADY_BOOKED",
                        "data": {
                            "vehicle_id": vehicle_id,
                            "vehicle_uid": vehicle.get("vehicle_uid", ""),
                            "vehicle_title": vehicle.get("title", ""),
                            "status_id": vehicle_status_id
                        }
                    }
                if vehicle_status_id == 3:
                    return {
                        "status": status.HTTP_400_BAD_REQUEST,
                        "success": False,
                        "message": "Cannot book this vehicle: Vehicle is Under maintenance. Please contact administrator.",
                        "error_code": "VEHICLE_UNDER_MAINTENANCE",
                        "data": {
                            "vehicle_id": vehicle_id,
                            "vehicle_uid": vehicle.get("vehicle_uid", ""),
                            "vehicle_title": vehicle.get("title", "")
                            }
                    }
                
                if pickup_dt and return_dt:
                    overlapping_status_ids = [1, 2, 3]
                    overlap_query: dict[str, Any] = {
                        "vehicle_id": data.vehicle_id,
                        "deleted": {"$ne": 1},
                        "booking_status_id": {"$in": overlapping_status_ids}
                    }
                    current_booking_id = int(form.get("id", 0) or 0)
                    if current_booking_id > 0:
                        overlap_query["id"] = {"$ne": current_booking_id}

                    overlapping_bookings = collection.find(
                        overlap_query,
                        {"_id": 0, "id": 1, "pickup_time": 1, "return_time": 1}
                    )

                    for existing in overlapping_bookings:
                        existing_pickup = parse_iso_datetime(existing.get("pickup_time"))
                        existing_return = parse_iso_datetime(existing.get("return_time"))
                        if has_interval_overlap(pickup_dt, return_dt, existing_pickup, existing_return):
                            return {
                                "status": status.HTTP_400_BAD_REQUEST,
                                "success": False,
                                "message": "Cannot book this vehicle: Vehicle is already booked for the selected dates.",
                                "error_code": "VEHICLE_ALREADY_BOOKED",
                                "data": {
                                    "vehicle_id": data.vehicle_id,
                                    "conflicting_booking_id": existing.get("id")
                                }
                            }


            else:
                return {
                    "status": status.HTTP_400_BAD_REQUEST,
                    "success": False,
                    "message": "Vehicle not found",
                    "error_code": "VEHICLE_NOT_FOUND",
                    "data": {
                        "vehicle_id": vehicle_id
                    }
                }
        

        # Check if vehicle is available for booking (not unavailable or inactive)
        if data.vehicle_id > 0:
            vehicle = vehicles_collection.find_one(
                {"id": data.vehicle_id, "deleted": {"$ne": 1}},
                {"status_id": 1, "insurance_expiry_date": 1, "fitness_renewal_date": 1, "title": 1, "vehicle_uid": 1}
            )
            if vehicle:
                vehicle_status_id = vehicle.get("status_id", 0)
                
                # Check for Inactive status (status_id = 6)
                if vehicle_status_id == 6:  # Inactive (vehicle not in use anymore - sold/scrap)
                    return {
                        "status": status.HTTP_400_BAD_REQUEST,
                        "success": False,
                        "message": "Cannot book this vehicle: Vehicle is inactive (not in use anymore).",
                        "error_code": "VEHICLE_INACTIVE",
                        "data": {
                            "vehicle_id": data.vehicle_id,
                            "vehicle_uid": vehicle.get("vehicle_uid", ""),
                            "vehicle_title": vehicle.get("title", ""),
                            "status_id": vehicle_status_id
                        }
                    }
                
                # Check for Unavailable status (status_id = 5)
                if vehicle_status_id == 5:  # Unavailable (insurance/fitness expired or administrator set)
                    # Determine the reason for unavailability
                    insurance_expiry = vehicle.get("insurance_expiry_date", "")
                    fitness_renewal = vehicle.get("fitness_renewal_date", "")
                    
                    # Check which document is expired
                    current_time = datetime.now(timezone.utc)
                    
                    insurance_expired = False
                    fitness_expired = False
                    
                    if insurance_expiry:
                        try:
                            insurance_expiry_dt = datetime.fromisoformat(insurance_expiry.replace('Z', '+00:00'))
                            insurance_expired = insurance_expiry_dt <= current_time
                        except (ValueError, TypeError):
                            insurance_expired = True
                    else:
                        insurance_expired = True
                    
                    if fitness_renewal:
                        try:
                            fitness_renewal_dt = datetime.fromisoformat(fitness_renewal.replace('Z', '+00:00'))
                            fitness_expired = fitness_renewal_dt <= current_time
                        except (ValueError, TypeError):
                            fitness_expired = True
                    else:
                        fitness_expired = True
                    
                    # Build appropriate error message
                    # If documents are expired, show specific message
                    if insurance_expired or fitness_expired:
                        if insurance_expired and fitness_expired:
                            message = "Cannot book this vehicle: Insurance and Fitness renewal dates have expired. Please renew both before booking."
                            error_code = "VEHICLE_INSURANCE_AND_FITNESS_EXPIRED"
                        elif insurance_expired:
                            message = "Cannot book this vehicle: Insurance has expired. Please renew insurance before booking."
                            error_code = "VEHICLE_INSURANCE_EXPIRED"
                        else:
                            message = "Cannot book this vehicle: Fitness renewal date has expired. Please renew fitness before booking."
                            error_code = "VEHICLE_FITNESS_EXPIRED"
                    else:
                        # Administrator set as unavailable (temporarily blocked due to documents/office issue)
                        message = "Cannot book this vehicle: Vehicle is temporarily unavailable. Please contact administrator."
                        error_code = "VEHICLE_UNAVAILABLE"
                    
                    return {
                        "status": status.HTTP_400_BAD_REQUEST,
                        "success": False,
                        "message": message,
                        "error_code": error_code,
                        "data": {
                            "vehicle_id": data.vehicle_id,
                            "vehicle_uid": vehicle.get("vehicle_uid", ""),
                            "vehicle_title": vehicle.get("title", ""),
                            "insurance_expiry_date": insurance_expiry,
                            "fitness_renewal_date": fitness_renewal,
                            "status_id": vehicle_status_id
                        }
                    }

        # Check for duplicate booking (same tenant, customer, vehicle, and overlapping dates)
        if data.pickup_time and data.return_time and data.vehicle_id and data.customer_id:
            try:
                # Parse dates for comparison
                pickup_dt = datetime.fromisoformat(data.pickup_time.replace('Z', '+00:00'))
                return_dt = datetime.fromisoformat(data.return_time.replace('Z', '+00:00'))
                
                # Build query to find overlapping bookings
                duplicate_check_query = {
                    "tenant_id": data.tenant_id,
                    "customer_id": data.customer_id,
                    "vehicle_id": data.vehicle_id,
                    "deleted": {"$ne": 1},
                    "$or": [
                        # Check if new booking overlaps with existing bookings
                        # Case 1: New pickup is during an existing booking
                        {
                            "$and": [
                                {"pickup_time": {"$lte": data.pickup_time}},
                                {"return_time": {"$gte": data.pickup_time}}
                            ]
                        },
                        # Case 2: New return is during an existing booking
                        {
                            "$and": [
                                {"pickup_time": {"$lte": data.return_time}},
                                {"return_time": {"$gte": data.return_time}}
                            ]
                        },
                        # Case 3: New booking completely encompasses an existing booking
                        {
                            "$and": [
                                {"pickup_time": {"$gte": data.pickup_time}},
                                {"return_time": {"$lte": data.return_time}}
                            ]
                        }
                    ]
                }
                
                # If updating, exclude current booking from check
                if doc_id != 0:
                    duplicate_check_query["id"] = {"$ne": doc_id}
                
                existing_booking = collection.find_one(duplicate_check_query)
                if existing_booking:
                    return {
                        "status": status.HTTP_409_CONFLICT,
                        "success": False,
                        "message": "Duplicate booking: This customer already has a booking for this vehicle during the selected dates",
                        "error_code": "DUPLICATE_BOOKING",
                        "data": {
                            "existing_booking_id": existing_booking.get("id"),
                            "existing_booking_uid": existing_booking.get("booking_uid"),
                            "existing_pickup_time": existing_booking.get("pickup_time"),
                            "existing_return_time": existing_booking.get("return_time")
                        }
                    }
            except Exception as e:
                # If date parsing fails, continue without validation
                # (better to allow booking than block due to date format issues)
                pass

        email = form.get("email", "") or ""
        # Check if email already exists for this tenant
        if email and email.strip():
            # Build query to check for email duplication
            email_check_query = {
                "email": email.strip(),
                "tenant_id": data.tenant_id,
                "deleted": {"$ne": 1}
            }
            
            # If updating existing customer, exclude current customer from check
            if data.customer_id != 0:
                email_check_query["id"] = {"$ne": data.customer_id}
            
            existing_customer = customers_collection.find_one(email_check_query)
            if existing_customer:
                return {
                    "success": False,
                    "message": "Email already exists for another customer",
                    "error_code": "EMAIL_EXISTS"
                }

       
        # Create customer if customer_id is 0
        if data.customer_id == 0:

            customer_data = CustomerCreate()
            customer_data.id = get_next_id(customers_collection)
            customer_data.tenant_id = to_int(user_detail.get("tenant_id", 0))
            customer_data.is_company = to_int(form.get("is_company", 0))
            customer_data.first_name = form.get("first_name", "") or ""
            customer_data.last_name = form.get("last_name", "") or ""
            customer_data.contact = form.get("contact", "") or ""
            customer_data.email = form.get("email", "") or ""
            customer_data.driving_license_no = form.get("driving_license_no", "") or ""
            customer_data.driving_license_expiry = form.get("driving_license_expiry", "") or ""
            customer_data.passport_id = form.get("passport_id", "") or ""
            customer_data.passport_expiry = form.get("passport_expiry", "") or ""
            customer_data.visa_no = form.get("visa_no", "") or ""
            customer_data.visa_expiry = form.get("visa_expiry", "") or ""
            customer_data.nationality_id = to_int(form.get("nationality_id", ""))
            customer_data.country_id = to_int(form.get("country_id", ""))
            customer_data.address1 = form.get("address1", "") or ""
            customer_data.address2 = form.get("address2", "") or ""
            customer_data.postal_code = form.get("postal_code", "") or ""
            
            
            
            # if company
            customer_data.company_name = form.get("company_name", "") or ""
            customer_data.contact_person = form.get("contact_person", "") or ""
            customer_data.contact_cnic = form.get("contact_cnic", "") or ""
            customer_data.contact_cnic_expiry = form.get("contact_cnic_expiry", "") or ""
            customer_data.trade_license_no = form.get("trade_license_no", "") or ""
            customer_data.trade_license_expiry = form.get("trade_license_expiry", "") or ""            
            
            
            # upload files             
            registration_document_qty_raw = form.get("registration_document_qty") or 0
            try:
                registration_document_qty = int(registration_document_qty_raw) if registration_document_qty_raw else 0
            except (ValueError, TypeError):
                    registration_document_qty = 0

            if registration_document_qty != 0:
                for i in range(registration_document_qty):
                    file_obj = form.get(f"registration_document_{i}")
                
                    new_file_name = UploadImage.uploadImage_DO(
                        file_obj,
                        'rentify/vehicles/customers_images/' + str(customer_data.id)
                    )

                    new_data = CustomersImages()
                    new_data.id = get_next_id(customers_documents_collection)
                    new_data.customer_id = int(customer_data.id)
                    new_data.tenant_id = int(user_detail["tenant_id"])
                    new_data.createdon = datetime.now(timezone.utc).isoformat()
                    new_data.active = 1
                    new_data.deleted = 0
                    new_data.image_type = "registration_document"
                    new_data.file_type = file_obj.content_type
                    new_data.file_size = file_obj.size
                    new_data.url = config.IMAGE_DO_URL + new_file_name
                    customers_documents_collection.insert_one(new_data.dict())
            
          
            # driving_license multiple uploads
            driving_license_qty_raw = form.get("driving_license_qty") or 0
            try:
                driving_license_qty = int(driving_license_qty_raw) if driving_license_qty_raw else 0
            except (ValueError, TypeError):
                driving_license_qty = 0

            if driving_license_qty != 0:
                for i in range(driving_license_qty):
                    file_obj = form.get(f"driving_license_{i}")

                    new_file_name = UploadImage.uploadImage_DO(
                        file_obj,
                        'rentify/vehicles/customers_images/' + str(customer_data.id)
                    )

                    new_data = CustomersImages()
                    new_data.id = get_next_id(customers_documents_collection)
                    new_data.customer_id = int(customer_data.id)
                    new_data.tenant_id = int(user_detail["tenant_id"])
                    new_data.createdon = datetime.now(timezone.utc).isoformat()
                    new_data.active = 1
                    new_data.deleted = 0
                    new_data.image_type = "driving_license"
                    new_data.file_type = file_obj.content_type
                    new_data.file_size = file_obj.size
                    new_data.url = config.IMAGE_DO_URL + new_file_name
                    customers_documents_collection.insert_one(new_data.dict())

            # trade_license multiple uploads
            trade_license_qty_raw = form.get("trade_license_qty") or 0
            try:
                trade_license_qty = int(trade_license_qty_raw) if trade_license_qty_raw else 0
            except (ValueError, TypeError):
                trade_license_qty = 0

            if trade_license_qty != 0:
                for i in range(trade_license_qty):
                    file_obj = form.get(f"trade_license_{i}")

                    new_file_name = UploadImage.uploadImage_DO(
                        file_obj,
                        'rentify/vehicles/customers_images/' + str(customer_data.id)
                    )

                    new_data = CustomersImages()
                    new_data.id = get_next_id(customers_documents_collection)
                    new_data.customer_id = int(customer_data.id)
                    new_data.tenant_id = int(user_detail["tenant_id"])
                    new_data.createdon = datetime.now(timezone.utc).isoformat()
                    new_data.active = 1
                    new_data.deleted = 0
                    new_data.image_type = "trade_license"
                    new_data.file_type = file_obj.content_type
                    new_data.file_size = file_obj.size
                    new_data.url = config.IMAGE_DO_URL + new_file_name
                    customers_documents_collection.insert_one(new_data.dict())

            # owner_document multiple uploads
            owner_document_qty_raw = form.get("owner_document_qty") or 0
            try:
                owner_document_qty = int(owner_document_qty_raw) if owner_document_qty_raw else 0
            except (ValueError, TypeError):
                owner_document_qty = 0

            if owner_document_qty != 0:
                for i in range(owner_document_qty):
                    file_obj = form.get(f"owner_document_{i}")

                    new_file_name = UploadImage.uploadImage_DO(
                        file_obj,
                        'rentify/vehicles/customers_images/' + str(customer_data.id)
                    )

                    new_data = CustomersImages()
                    new_data.id = get_next_id(customers_documents_collection)
                    new_data.customer_id = int(customer_data.id)
                    new_data.tenant_id = int(user_detail["tenant_id"])
                    new_data.createdon = datetime.now(timezone.utc).isoformat()
                    new_data.active = 1
                    new_data.deleted = 0
                    new_data.image_type = "owner_document"
                    new_data.file_type = file_obj.content_type
                    new_data.file_size = file_obj.size
                    new_data.url = config.IMAGE_DO_URL + new_file_name
                    customers_documents_collection.insert_one(new_data.dict())        
        
            customers_collection.insert_one(customer_data.dict())
            data.customer_id = int(customer_data.id)
        else:
            data.customer_id = int(form.get("customer_id",0))
            
        record = data.dict()

        # Ensure booking_uid is set based on id in the desired format e.g., B000001
        try:
            current_id = int(record.get("id", 0))
        except Exception:
            current_id = 0
        formatted_uid = f"B{current_id:06d}" if current_id else ""
        if not record.get("booking_uid") and formatted_uid:
            record["booking_uid"] = formatted_uid

        if doc_id == 0:
            collection.insert_one(record)
            message = "Booking created successfully"
            
            log_activity(
                activity_type="booking_created",
                entity_type="booking",
                entity_id=int(record.get("id", 0)),
                user_detail=user_detail,
                title=f"New booking added: {record.get('id', 0)}",
                description="A new booking was created",
                metadata={
                    "vehicle_id": record.get("vehicle_id"),
                    "payment_status_id": record.get("payment_status_id"),
                    "total_rent_amount": record.get("total_rent_amount", 0)
                }
            )
        else:
            collection.update_one({"id": doc_id}, {"$set": record})
            message = "Booking updated successfully"
            
            log_activity(
                activity_type="booking_updated",
                entity_type="booking",
                entity_id=int(record.get("id", 0)),
                user_detail=user_detail,
                title=f"Booking updated: {record.get('id', 0)}",
                description="A booking was modified",
                metadata={
                    "vehicle_id": record.get("vehicle_id"),
                    "payment_status_id": record.get("payment_status_id"),
                    "active": record.get("active", 0)
                }
            )

        record["editable"] = 1
        return {"status": status.HTTP_200_OK, "message": message, "data": convert_to_jsonable(record)}
    except Exception as e:
        return get_error_details(e)


@bookings.post("/rentify/bookings/delivery/save")
async def save_booking_delivery(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    form = await request.form()

    def to_int(value: Any, default: int = 0) -> int:
        try:
            return int(value)
        except (TypeError, ValueError):
            return default

    try:
        booking_id = to_int(form.get("booking_id") or form.get("id"), 0)
        if booking_id <= 0:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "success": False,
                "message": "booking_id is required",
                "data": None
            }

        tenant_id = to_int(user_detail.get("tenant_id"), 0)
        booking = collection.find_one(
            {"id": booking_id, "tenant_id": tenant_id, "deleted": {"$ne": 1}},
            {"vehicle_id": 1}
        )
        if not booking:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "success": False,
                "message": "Booking not found",
                "data": None
            }

        delivery_handover_by = form.get("delivery_handover_by", "") or ""
        delivery_received_by = form.get("delivery_received_by", "") or ""
        # confirm_booking_delivery = to_int(form.get("confirm_booking_delivery"), 0)
        delivery_images_qty = to_int(form.get("vehicle_delivery_images_qty"), 0)

        has_payload = any([
            delivery_handover_by,
            delivery_received_by,
            # confirm_booking_delivery,
            delivery_images_qty
        ])

        if not has_payload:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "success": False,
                "message": "Provide delivery details or images to update",
                "data": None
            }

        collection.update_one({"id": booking_id}, {"$set": {
            "delivery_handover_by": delivery_handover_by,
            "delivery_received_by": delivery_received_by,
            # "confirm_booking_delivery": 2,
            "booking_status_id": 3,
            "updatedon": datetime.now(timezone.utc).isoformat()
        }})

        db_rentify.rentify_vehicles.update_one({"id": booking.get("vehicle_id", 0)}, {"$set": {"status_id": 2}})

        uploaded_images = 0
        if delivery_images_qty > 0:
            vehicle_id = to_int(booking.get("vehicle_id"), 0)
            for index in range(delivery_images_qty):
                file_obj = form.get(f"vehicle_delivery_images_{index}")
                if not file_obj:
                    continue
                new_file_name = UploadImage.uploadImage_DO(
                    file_obj,
                    f"rentify/vehicles/delivery_images/{booking_id}"
                )
                image_doc = VehicleDeliveryImage()
                image_doc.id = get_next_id(vehicle_delivery_images_collection)
                image_doc.tenant_id = tenant_id
                image_doc.booking_id = booking_id
                image_doc.vehicle_id = vehicle_id
                image_doc.url = config.IMAGE_DO_URL + new_file_name
                image_doc.image_type = "delivery"
                image_doc.file_type = getattr(file_obj, "content_type", "")
                image_doc.file_size = getattr(file_obj, "size", 0)
                vehicle_delivery_images_collection.insert_one(image_doc.dict())
                uploaded_images += 1

        response_payload = {
            "booking_id": booking_id,
            "delivery_handover_by": delivery_handover_by,
            "delivery_received_by": delivery_received_by,
            "confirm_booking_delivery": 2,
            "uploaded_images": uploaded_images
        }

        return {
            "status": status.HTTP_200_OK,
            "message": "Delivery details saved successfully",
            "data": convert_to_jsonable(response_payload)
        }
    except Exception as e:
        return get_error_details(e)


@bookings.post("/rentify/bookings/return/save")
async def save_booking_return(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    form = await request.form()

    def to_int(value: Any, default: int = 0) -> int:
        try:
            return int(value)
        except (TypeError, ValueError):
            return default

    try:
        booking_id = to_int(form.get("booking_id") or form.get("id"), 0)
        if booking_id <= 0:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "success": False,
                "message": "booking_id is required",
                "data": None
            }

        tenant_id = to_int(user_detail.get("tenant_id"), 0)
        booking = collection.find_one(
            {"id": booking_id, "tenant_id": tenant_id, "deleted": {"$ne": 1}},
            {"vehicle_id": 1, "payment_status_id": 1,"vehicle_id":1}
        )
        if not booking:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "success": False,
                "message": "Booking not found",
                "data": None
            }

        return_received_by = form.get("return_received_by", "") or ""
        return_received_from = form.get("return_received_from", "") or ""
        confirm_booking_return = to_int(form.get("confirm_booking_return"), 0)
        return_images_qty = to_int(form.get("vehicle_return_images_qty"), 0)

        has_payload = any([
            return_received_by,
            return_received_from,
            confirm_booking_return,
            return_images_qty
        ])

        if not has_payload:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "success": False,
                "message": "Provide return details or images to update",
                "data": None
            }

        payment_status_input = form.get("payment_status_id")
        payment_status_id = to_int(
            payment_status_input if payment_status_input not in (None, "") else booking.get("payment_status_id", 1),
            1
        )
        booking_status_id = 5 if payment_status_id == 2 else 4

        collection.update_one({"id": booking_id}, {"$set": {
            "return_received_by": return_received_by,
            "return_received_from": return_received_from,
            "confirm_booking_return": confirm_booking_return,
            "booking_status_id": booking_status_id,
            "updatedon": datetime.now(timezone.utc).isoformat()
        }})

        
                
        
        vehicles_collection.update_one({"id": booking.get("vehicle_id", 0)}, {"$set": {"status_id": 4}})


        uploaded_images = 0
        if return_images_qty > 0:
            vehicle_id = to_int(booking.get("vehicle_id"), 0)
            for index in range(return_images_qty):
                file_obj = form.get(f"vehicle_return_images_{index}") or form.get(f"vehicle_return_images[{index}]")
                if not file_obj:
                    continue
                new_file_name = UploadImage.uploadImage_DO(
                    file_obj,
                    f"rentify/vehicles/return_images/{booking_id}"
                )
                image_doc = VehicleReturnImage()
                image_doc.id = get_next_id(vehicle_return_images_collection)
                image_doc.tenant_id = tenant_id
                image_doc.booking_id = booking_id
                image_doc.vehicle_id = vehicle_id
                image_doc.url = config.IMAGE_DO_URL + new_file_name
                image_doc.image_type = "return"
                image_doc.file_type = getattr(file_obj, "content_type", "")
                image_doc.file_size = getattr(file_obj, "size", 0)
                vehicle_return_images_collection.insert_one(image_doc.dict())
                uploaded_images += 1

        response_payload = {
            "booking_id": booking_id,
            "return_received_by": return_received_by,
            "return_received_from": return_received_from,
            "confirm_booking_return": confirm_booking_return,
            "booking_status_id": booking_status_id,
            "uploaded_images": uploaded_images
        }

        return {
            "status": status.HTTP_200_OK,
            "message": "Return details saved successfully",
            "data": convert_to_jsonable(response_payload)
        }
    except Exception as e:
        return get_error_details(e)

@bookings.post("/rentify/bookings/get-statistics")
async def get_booking_stats(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        form = await request.form()
        from_date_str = form.get("from", "")
        to_date_str = form.get("to", "")
        if not from_date_str or not to_date_str:
            return {"status": status.HTTP_400_BAD_REQUEST, "message": "from and to date parameters are required", "data": None}
        try:
            from_date = datetime.fromisoformat(from_date_str.replace('GMT', '').strip()) if 'T' in from_date_str else datetime.fromisoformat(from_date_str)
            to_date = datetime.fromisoformat(to_date_str.replace('GMT', '').strip()) if 'T' in to_date_str else datetime.fromisoformat(to_date_str)
        except Exception:
            # fallback: best-effort parse common formats
            from dateutil import parser  # type: ignore
            try:
                from_date = parser.parse(from_date_str)
                to_date = parser.parse(to_date_str)
            except Exception:
                return {"status": status.HTTP_400_BAD_REQUEST, "message": "Invalid date format", "data": None}

        # Base query for tenant filtering and date range
        base_query = {
            "tenant_id": user_detail["tenant_id"],
            "deleted": {"$ne": 1},
            "createdon": {"$gte": from_date.isoformat(), "$lte": to_date.isoformat()}
        }
        
        # Get total bookings count
        total_bookings = db_rentify.rentify_bookings.count_documents(base_query)
        
        # Get bookings by status
        bookings_by_status = list(db_rentify.rentify_bookings.aggregate([
            {"$match": base_query},
            {"$group": {
                "_id": "$booking_status_id",
                "count": {"$sum": 1}
            }}
        ]))
        
        # Initialize status counts
        status_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0}  # pending, confirmed, active, completed, cancelled, refunded
        for result in bookings_by_status:
            status_id = result["_id"]
            if status_id in status_counts:
                status_counts[status_id] = result["count"]
        
        # Calculate individual counts
        pending_bookings = status_counts[1] # pending + confirmed
        active_bookings = status_counts[3]  # active/rented
        completed_bookings = status_counts[5]  # completed
        cancelled_bookings = status_counts[6]  # cancelled
        
        # Get upcoming bookings (future bookings)
        future_query = {
            "tenant_id": user_detail["tenant_id"],"booking_status_id": {"$in": [1, 2]},
            "deleted": {"$ne": 1},
            "pickup_time": {"$gt": to_date.isoformat()}
        }
        upcoming_bookings = db_rentify.rentify_bookings.count_documents(future_query)
        
        # Get affiliated bookings (based on vehicles linked to affiliates)
        affiliated_vehicle_ids: list[int] = []
        try:
            affiliated_vehicle_ids = list(vehicles_collection.distinct(
                "id",
                {
                    "tenant_id": user_detail["tenant_id"],
                    "deleted": {"$ne": 1},
                    "affiliate_id": {"$exists": True, "$nin": [None, 0, ""]},
                }
            ))
        except Exception:
            affiliated_vehicle_ids = []

        if affiliated_vehicle_ids:
            affiliated_query = {
                **base_query,
                "vehicle_id": {"$in": affiliated_vehicle_ids}
            }
            affiliated_bookings = db_rentify.rentify_bookings.count_documents(affiliated_query)
        else:
            affiliated_bookings = 0
        
        # Generate daily chart data for last 7 days
        chart_data = []
        for i in range(7):
            day_start = from_date + timedelta(days=i)
            day_end = day_start + timedelta(days=1)
            
            day_query = {
                **base_query,
                "createdon": {"$gte": day_start.isoformat(), "$lt": day_end.isoformat()}
            }
            day_count = db_rentify.rentify_bookings.count_documents(day_query)
            chart_data.append({"value": day_count})
        
        # Calculate percentages
        total_bookings_pct = (total_bookings / total_bookings * 100) if total_bookings > 0 else 0
        cancelled_pct = (cancelled_bookings / total_bookings * 100) if total_bookings > 0 else 0
        completed_pct = (completed_bookings / total_bookings * 100) if total_bookings > 0 else 0
        upcoming_pct = (upcoming_bookings / total_bookings * 100) if total_bookings > 0 else 0
        pending_pct = (pending_bookings / total_bookings * 100) if total_bookings > 0 else 0
        affiliated_pct = (affiliated_bookings / total_bookings * 100) if total_bookings > 0 else 0
        
        # Calculate averages
        days_diff = (to_date - from_date).days + 1
        avg_bookings_per_day = total_bookings_pct / days_diff if days_diff > 0 else 0
        avg_cancelled_per_day = cancelled_bookings / days_diff if days_diff > 0 else 0
        avg_completed_per_day = completed_bookings / days_diff if days_diff > 0 else 0
        avg_upcoming_per_day = upcoming_bookings / days_diff if days_diff > 0 else 0
        avg_pending_per_day = pending_bookings / days_diff if days_diff > 0 else 0
        avg_affiliated_per_day = affiliated_bookings / days_diff if days_diff > 0 else 0
        
        # Find peak days (simplified - using chart data)
        peak_day_index = max(range(len(chart_data)), key=lambda i: chart_data[i]["value"])
        peak_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        peak_day = peak_days[peak_day_index]
        
        # Build dashboard view with actual data
        dashboard_view = [
            {
                "icon":"/icons/calendar_dotted_icon.svg",
                "iconClass":"",
                "title":"Total Bookings",
                "total": total_bookings,
                "change": "1.2",  # Could calculate actual change vs previous period
                "description": f"Peak bookings day: {peak_day} | Average bookings per day: {avg_bookings_per_day:.1f}",
                "lineChartData": chart_data
            },
            {
                "icon":"/icons/calendar_dotted_icon.svg",
                "iconClass":"",
                "title":"Cancelled Bookings",
                "total": cancelled_bookings,
                "change": "1.2",
                "description": f"% of total bookings cancelled: {cancelled_pct:.1f}% | Average cancellation per day: {avg_cancelled_per_day:.1f}",
                "lineChartData": chart_data  # Could generate separate chart for cancellations
            },
            {
                "icon":"/icons/calendar_dotted_icon.svg",
                "iconClass":"",
                "title":"Completed Bookings",
                "total": completed_bookings,
                "change": "1.5",
                "description": f"% of total bookings completed: {completed_pct:.1f}% | Average completions per day: {avg_completed_per_day:.1f}",
                "lineChartData": chart_data  # Could generate separate chart for completions
            },
            {
                "icon":"/icons/calendar_dotted_icon.svg",
                "iconClass":"",
                "title":"Upcoming Bookings",
                "total": upcoming_bookings,
                "change": "4.02",
                "description": f"% of total bookings upcoming: {upcoming_pct:.1f}% | Average new pre-booking per day: {avg_upcoming_per_day:.1f}",
                "lineChartData": chart_data  # Could generate separate chart for upcoming
            },
            {
                "icon":"/icons/calendar_dotted_icon.svg",
                "iconClass":"",
                "title":"Pending Bookings",
                "total": pending_bookings,
                "change": "0.8",
                "description": f"% of total bookings pending: {pending_pct:.1f}% | Average pending per day: {avg_pending_per_day:.1f}",
                "lineChartData": chart_data  # Could generate separate chart for pending
            },
            {
                "icon":"/icons/calendar_dotted_icon.svg",
                "iconClass":"",
                "title":"Affiliated Bookings",
                "total": affiliated_bookings,
                "change": "0.53",
                "description": f"Total affiliated bookings in range: {affiliated_bookings} | % of total bookings from affiliates: {affiliated_pct:.1f}% | Average affiliated per day: {avg_affiliated_per_day:.1f}",
                "lineChartData": chart_data  # Could generate separate chart for affiliated
            },
        ]

        key_metrics = [
            {"title": "Total Bookings", "value": total_bookings, "change": 1.2},
            {"title": "Cancelled Bookings", "value": cancelled_bookings, "change": 1.2},
            {"title": "Completed Bookings", "value": completed_bookings, "change": 1.5},
            {"title": "Upcoming Bookings", "value": upcoming_bookings, "change": 4.02},
            {"title": "Pending Bookings", "value": pending_bookings, "change": -0.8},
            {"title": "Affiliated Bookings", "value": affiliated_bookings, "change": -0.53},
        ]

        return {
            "status": status.HTTP_200_OK,
            "message": "Booking statistics retrieved successfully",
            "data": {"dashboard_view": dashboard_view, "key_metrics": key_metrics},
            "date_range": {"from": from_date.isoformat(), "to": to_date.isoformat()},
        }
    except Exception as e:
        return get_error_details(e)


@bookings.post("/rentify/bookings/get-status")
async def get_booking_status(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        try:
            form = await request.form()
        except Exception:
            form = request.query_params

        tenant_id = int(user_detail.get("tenant_id", 0))

        from_value = str(form.get("from", "") or "").strip()
        to_value = str(form.get("to", "") or "").strip()

        def _parse_datetime(value: str) -> Optional[datetime]:
            if not value:
                return None
            try:
                return datetime.fromisoformat(value.replace("Z", "+00:00"))
            except Exception:
                try:
                    from dateutil import parser  # type: ignore

                    return parser.parse(value)
                except Exception:
                    return None

        base_query: dict = {"tenant_id": tenant_id, "deleted": {"$ne": 1}}
        from_dt = _parse_datetime(from_value)
        to_dt = _parse_datetime(to_value)
        if from_dt and to_dt:
            if to_dt < from_dt:
                from_dt, to_dt = to_dt, from_dt
            base_query["createdon"] = {
                "$gte": from_dt.isoformat(),
                "$lte": to_dt.isoformat(),
            }

        total_bookings = collection.count_documents(base_query)

        statuses_config = [
            {"title": "Pending", "ids": [1], "color": "#2575D6"},
            {"title": "Confirmed", "ids": [2], "color": "#86EFAC"},
            {"title": "Delivered", "ids": [3], "color": "#F97316"},
            {"title": "Return", "ids": [4], "color": "#FACC15"},
            {"title": "Closed - Won", "ids": [5], "color": "#22C55E"},
            {"title": "Cancelled", "ids": [6], "color": "#EF4444"},
        ]

        chart_data: list[dict] = []
        status_totals: dict[str, int] = {}

        for status_info in statuses_config:
            status_query = {
                **base_query,
                "booking_status_id": {"$in": status_info["ids"]},
            }
            count = collection.count_documents(status_query)
            status_totals[status_info["title"]] = count
            percent = (count / total_bookings * 100) if total_bookings > 0 else 0
            chart_data.append(
                {
                    "title": status_info["title"],
                    "value": count,
                    "percent": format_percent_value(percent),
                    "color": status_info["color"],
                }
            )

        counters = [
            {
                "title": "Rented",
                "value": status_totals.get("Delivered", 0),
            },
            {
                "title": "Pending",
                "value": status_totals.get("Pending", 0),
            },
        ]

        response_data = {
            "chartData": chart_data,
            "counters": counters,
            "total": total_bookings,
        }

        metadata: dict = {}
        if from_dt and to_dt:
            metadata["date_range"] = {
                "from": from_dt.isoformat(),
                "to": to_dt.isoformat(),
            }

        return {
            "status": status.HTTP_200_OK,
            "message": "Booking status data retrieved successfully",
            "data": response_data,
            **({"filters": metadata} if metadata else {}),
        }

    except Exception as e:
        return get_error_details(e)


@bookings.post("/rentify/customers/get")
async def get_customers(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Fetch all customers from the customers_collection
    """
    try:
        form = await request.form()
        tenant_id = int(user_detail.get("tenant_id", 0))
        
        # Build filter query for customers
        filter_query = {
            "deleted": {"$ne": 1},
            "tenant_id": tenant_id
        }
        
        # Optional search filters
        search_name = form.get("search_name")
        if search_name:
            filter_query["$or"] = [
                {"first_name": {"$regex": search_name, "$options": "i"}},
                {"last_name": {"$regex": search_name, "$options": "i"}},
                {"company_name": {"$regex": search_name, "$options": "i"}},
                {"contact_person": {"$regex": search_name, "$options": "i"}}
            ]
        
        # Optional email filter
        email = form.get("email")
        if email:
            filter_query["email"] = {"$regex": email, "$options": "i"}
        
        # Optional contact filter
        contact = form.get("contact")
        if contact:
            filter_query["contact"] = {"$regex": contact, "$options": "i"}
        
        # Optional company filter
        is_company = form.get("is_company")
        if is_company is not None:
            try:
                filter_query["is_company"] = int(is_company)
            except (ValueError, TypeError):
                pass
        
        # Fetch customers with pagination support
        page = int(form.get("page", 1))
        limit = int(form.get("limit", 50))
        skip = (page - 1) * limit
        
        # Get total count for pagination
        total_count = customers_collection.count_documents(filter_query)
        
        # Fetch customers with pagination
        customers = list(
            customers_collection.find(filter_query, NO_ID_PROJECTION)
            .sort("createdon", -1)
            .skip(skip)
            .limit(limit)
        )
        
        # Add customer images for each customer
        for customer in customers:
            customer_id = customer.get("id", 0)
            if customer_id:
                customer["registration_document"] = list(db_rentify.rentify_customers_documents.find({"customer_id": customer_id,"image_type": "registration_document", "deleted": {"$ne": 1}}, {"_id": 0}))
                customer["driving_license"] = list(db_rentify.rentify_customers_documents.find({"customer_id": customer_id,"image_type": "driving_license", "deleted": {"$ne": 1}}, {"_id": 0}))
                customer["trade_license"] = list(db_rentify.rentify_customers_documents.find({"customer_id": customer_id,"image_type": "trade_license", "deleted": {"$ne": 1}}, {"_id": 0}))
                customer["owner_document"] = list(db_rentify.rentify_customers_documents.find({"customer_id": customer_id,"image_type": "owner_document", "deleted": {"$ne": 1}}, {"_id": 0}))

            else:
                customer["registration_document"] = []
                customer["driving_license"] = []
                customer["trade_license"] = []
                customer["owner_document"] = []
    

            customer["label"] = customer.get("first_name", "") + " " + customer.get("last_name", "") + " (" + customer.get("email", "") + ")"
            customer["value"] = customer.get("id", 0)
            
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Customers retrieved successfully",
            "data": convert_to_jsonable(customers),
            "total_count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit,
            "filters_summary": {
                "search_name": form.get("search_name"),
                "email": form.get("email"),
                "contact": form.get("contact"),
                "is_company": form.get("is_company"),
            }
        }
        
    except Exception as e:
        return get_error_details(e)

@bookings.get("/rentify/customers/get-details/{id}")
async def get_customer_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        tenant_id = int(user_detail.get("tenant_id", 0))
        customer = customers_collection.find_one({
            "id": int(id),
            "tenant_id": tenant_id,
            "deleted": {"$ne": 1}
        }, NO_ID_PROJECTION)

        if not customer:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Customer not found",
                "data": None
            }

        # Attach customer images
        customer_id_int = int(customer.get("id", 0))
        if customer_id_int:
            customer["registration_document"] = list(db_rentify.rentify_customers_documents.find({"customer_id": customer_id_int,"image_type": "registration_document", "deleted": {"$ne": 1}}, {"_id": 0}))
            customer["driving_license"] = list(db_rentify.rentify_customers_documents.find({"customer_id": customer_id_int,"image_type": "driving_license", "deleted": {"$ne": 1}}, {"_id": 0}))
            customer["trade_license"] = list(db_rentify.rentify_customers_documents.find({"customer_id": customer_id_int,"image_type": "trade_license", "deleted": {"$ne": 1}}, {"_id": 0}))
            customer["owner_document"] = list(db_rentify.rentify_customers_documents.find({"customer_id": customer_id_int,"image_type": "owner_document", "deleted": {"$ne": 1}}, {"_id": 0}))
            customer_bookings = list(collection.find({"customer_id": customer_id_int, "deleted": {"$ne": 1}}, {"_id": 0}))
            for booking in customer_bookings:
                booking_id_int = int(booking.get("id", 0) or 0)
                vehicle_id_int = int(booking.get("vehicle_id", 0) or 0)

                vehicle_details = getVehicleById(vehicle_id_int) if vehicle_id_int else None
                if vehicle_details:
                    vehicle_details["model_details"] = getModelById(int(vehicle_details.get("model_id", 0) or 0))
                    vehicle_details["variant_details"] = getVariantById(int(vehicle_details.get("variant_id", 0) or 0))
                    vehicle_details["brand_details"] = getBrandById(int(vehicle_details.get("brand_id", 0) or 0))
                    vehicle_details["body_type_details"] = getBodyTypeById(int(vehicle_details.get("body_type_id", 0) or 0))
                    vehicle_details["fuel_type_details"] = getFuelTypeById(int(vehicle_details.get("fuel_type_id", 0) or 0))
                    vehicle_details["transmission_type_details"] = getTransmissionTypeById(int(vehicle_details.get("transmission_type_id", 0) or 0))
                    vehicle_details["exterior_color_details"] = getColorById(int(vehicle_details.get("exterior_color_id", 0) or 0))
                    vehicle_details["interior_color_details"] = getColorById(int(vehicle_details.get("interior_color_id", 0) or 0))
                booking["vehicle_details"] = vehicle_details or {}

                booking["vehicle_thumbnail"] = list(
                    vehicle_images_collection.find(
                        {"vehicle_id": vehicle_id_int, "image_type": "thumbnail"},
                        NO_ID_PROJECTION,
                    )
                )

                booking["payment_details"] = getPaymentsByBookingId(booking_id_int)
                booking["refund_request_details"] = getRefundRequestById(booking_id_int)
                booking["vehicle_delivery_details"] = getVehicleDeliveryById(booking_id_int)
                booking["vehicle_return_details"] = getVehicleReturnById(booking_id_int)
                booking["last_activity_date"] = get_last_activity_date("booking", booking_id_int)

            customer["bookings"] = customer_bookings
            customer["last_activity_date"] = get_last_activity_date("customer", customer_id_int)
            customer["activities"] = list(activity_logs_collection.find({"customer_id": customer_id_int, "deleted": {"$ne": 1}}, {"_id": 0}))
            customer["attachments"] = list(customers_documents_collection.find({"customer_id": customer_id_int, "deleted": {"$ne": 1}}, {"_id": 0}))
            customer_notes_collection = db_rentify.rentify_customer_notes
            customer["notes"] = list(customer_notes_collection.find({"customer_id": customer_id_int, "deleted": {"$ne": 1}}, {"_id": 0}))
            customer["quotes"] = []
            customer["invoices"] = []


        else:
            customer["registration_document"] = []
            customer["driving_license"] = []
            customer["trade_license"] = []
            customer["owner_document"] = []
            customer["bookings"] = []
            customer["attachments"] = []
            customer["notes"] = []
            customer["quotes"] = []
            customer["invoices"] = []
            customer["activities"] = []

        

        return {
            "status": status.HTTP_200_OK,
            "message": "Customer retrieved successfully",
            "data": convert_to_jsonable(customer)
        }
    except Exception as e:
        return get_error_details(e)


@bookings.post("/rentify/bookings/payments/save")
async def save_payment(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Save payment for a booking/customer
    """
    try:
        form = await request.form()
        doc_id = int(form.get("id", 0))
        next_id = doc_id or get_next_id(payments_collection)

        data = PaymentCreate() if doc_id == 0 else PaymentUpdate()
        data.id = next_id if doc_id == 0 else doc_id

        # Required ints/floats with safe casting
        def to_int(val, default=0):
            try:
                return int(val) if val not in (None, "") else default
            except (ValueError, TypeError):
                return default

        def to_float(val, default=0.0):
            try:
                return float(val) if val not in (None, "") else default
            except (ValueError, TypeError):
                return default

        # Map fields
        data.tenant_id = to_int(user_detail.get("tenant_id", 0))
        data.booking_id = to_int(form.get("booking_id", 0))
        data.customer_id = to_int(form.get("customer_id", 0))
        data.amount = to_float(form.get("amount", 0))
        data.payment_date = form.get("payment_date", "") or ""
        data.transaction_id = form.get("transaction_id", "") or ""
        data.terminal_id = form.get("terminal_id", "") or ""
        data.receipt_no = form.get("receipt_no", "") or ""
        data.payment_note = form.get("payment_note", "") or ""
        data.customer_note = form.get("customer_note", "") or ""
        data.old_receipt_image = form.get("old_receipt_image", "") or ""
        data.payment_purpose = form.get("payment_purpose", "") or ""
        data.payment_status = form.get("payment_status", "pending") or "pending"
        

        # Handle receipt_image upload
        receipt_image_obj = form.get("receipt_image")
        if receipt_image_obj and hasattr(receipt_image_obj, 'filename') and receipt_image_obj.filename:
            # Upload new receipt image
            new_file_name = UploadImage.uploadImage_DO(
                receipt_image_obj,
                'rentify/payments/receipts/' + str(data.id)
            )
            data.receipt_image = {
                "url": config.IMAGE_DO_URL + new_file_name,
                "file_type": receipt_image_obj.content_type,
                "file_size": receipt_image_obj.size,
                "filename": receipt_image_obj.filename
            }
        elif data.old_receipt_image:
            # Keep existing image
            data.receipt_image = {"url": data.old_receipt_image}
        else:
            data.receipt_image = {}

        record = data.dict()

        if doc_id == 0:
            payments_collection.insert_one(record)
            message = "Payment created successfully"
            
            log_activity(
                activity_type="payment_created",
                entity_type="payment",
                entity_id=int(record.get("id", 0)),
                user_detail=user_detail,
                title=f"New payment added: {record.get('id', 0)}",
                description=f"Payment of {record.get('amount', 0)} for customer {record.get('customer_id', 0)}",
                metadata={
                    "customer_id": record.get("customer_id"),
                    "amount": record.get("amount"),
                    "payment_purpose": record.get("payment_purpose"),
                    "transaction_id": record.get("transaction_id")
                }
            )
        else:
            payments_collection.update_one({"id": doc_id}, {"$set": record})
            message = "Payment updated successfully"
            
            log_activity(
                activity_type="payment_updated",
                entity_type="payment",
                entity_id=int(record.get("id", 0)),
                user_detail=user_detail,
                title=f"Payment updated: {record.get('id', 0)}",
                description=f"Payment of {record.get('amount', 0)} for customer {record.get('customer_id', 0)}",
                metadata={
                    "customer_id": record.get("customer_id"),
                    "amount": record.get("amount"),
                    "payment_purpose": record.get("payment_purpose"),
                    "transaction_id": record.get("transaction_id")
                }
            )
        
        # Update booking status when payment is successful
        booking_id = record.get("booking_id", 0)
        payment_status = record.get("payment_status", "pending")
        payment_purpose = record.get("payment_purpose", "")
        
        if booking_id > 0 :
            try:
                # Get the booking
                booking = collection.find_one({"id": booking_id, "deleted": {"$ne": 1}})
                
                if booking:
                    update_data = {}
                    
                    # Update payment_status_id based on payment purpose
                    if payment_purpose == "rental":
                        # Mark rent payment as completed (payment_status_id = 2 for completed)
                        update_data["payment_status_id"] = 2
                        if booking["booking_status_id"] == 4:
                            collection.update_one({"id": int(booking_id)}, {"$set": {"booking_status_id": 5}})
                        # collection.update_one({"id": int(booking_id)}, {"$set": {"booking_status_id": 5}})
                        
                    elif payment_purpose == "security_deposit":
                        # Mark security deposit as paid (security_deposit_status_id = 2 for paid)
                        update_data["security_deposit_status_id"] = 2
                        update_data["booking_status_id"] = 2
                        db_rentify.rentify_vehicles.update_one({"id": booking.get("vehicle_id", 0)}, {"$set": {"status_id": 7}})
                    
                    # If booking was pending payment, update booking status to confirmed
                    if booking.get("booking_status_id", 0) == 1:  # 1 = pending payment
                        update_data["booking_status_id"] = 2  # 2 = confirmed
                    
                    # Update booking if there are changes
                    if update_data:
                        update_data["updatedon"] = datetime.now(timezone.utc).isoformat()
                        collection.update_one({"id": booking_id}, {"$set": update_data})
                        
                        # Log activity
                        log_activity(
                            activity_type="booking_payment_completed",
                            entity_type="booking",
                            entity_id=booking_id,
                            user_detail=user_detail,
                            title=f"Payment completed for booking {booking_id}",
                            description=f"Payment of {record.get('amount', 0)} received for {payment_purpose}",
                            metadata={
                                "booking_id": booking_id,
                                "payment_id": record.get("id"),
                                "amount": record.get("amount"),
                                "payment_purpose": payment_purpose,
                                "updates_made": update_data
                            }
                        )
            except Exception as e:
                # Don't fail the payment save if booking update fails
                pass

        record["editable"] = 1
        record["booking_status_id"] = 2
        return {"status": status.HTTP_200_OK, "message": message, "data": convert_to_jsonable(record)}
    except Exception as e:
        return get_error_details(e)


@bookings.post("/rentify/bookings/vehicle-return")
async def save_vehicle_return(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Save vehicle return information for a booking
    """
    try:
        form = await request.form()
        doc_id = int(form.get("id", 0))
        next_id = doc_id or get_next_id(vehicle_return_collection)

        data = VehicleReturnCreate() if doc_id == 0 else VehicleReturnUpdate()
        data.id = next_id if doc_id == 0 else doc_id

        # Required ints with safe casting
        def to_int(val, default=0):
            try:
                return int(val) if val not in (None, "") else default
            except (ValueError, TypeError):
                return default

        # Map fields
        data.tenant_id = to_int(user_detail.get("tenant_id", 0))
        data.booking_id = to_int(form.get("booking_id", 0))
        data.received_by = form.get("received_by", "") or ""
        data.received_from = form.get("received_from", "") or ""

        # Validate required fields
        if not data.booking_id:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "booking_id is required",
                "data": None
            }

        record = data.dict()

        if doc_id == 0:
            vehicle_return_collection.insert_one(record)
            message = "Vehicle return information created successfully"

            booking = collection.find_one(
                {"id": data.booking_id, "deleted": {"$ne": 1}},
                {"_id": 0, "vehicle_id": 1, "payment_status_id": 1}
            )

            if booking:
                vehicle_id = int(booking.get("vehicle_id", 0) or 0)
                payment_status_id = int(booking.get("payment_status_id", 1) or 1)

                if payment_status_id == 2:
                    collection.update_one({"id": data.booking_id}, {"$set": {"booking_status_id": 5}})
                else:
                    collection.update_one({"id": data.booking_id}, {"$set": {"booking_status_id": 4}})

                if vehicle_id > 0:
                    vehicles_collection.update_one({"id": vehicle_id}, {"$set": {"status_id": 4}})

            
            
            log_activity(
                activity_type="vehicle_return_created",
                entity_type="vehicle_return",
                entity_id=int(record.get("id", 0)),
                user_detail=user_detail,
                title=f"New vehicle return added: {record.get('id', 0)}",
                description=f"Vehicle return for booking {record.get('booking_id', 0)} - Received by: {record.get('received_by', 'N/A')}, Received from: {record.get('received_from', 'N/A')}",
                metadata={
                    "booking_id": record.get("booking_id"),
                    "received_by": record.get("received_by"),
                    "received_from": record.get("received_from")
                }
            )
        else:
            vehicle_return_collection.update_one({"id": doc_id}, {"$set": record})
            message = "Vehicle return information updated successfully"
            
            log_activity(
                activity_type="vehicle_return_updated",
                entity_type="vehicle_return",
                entity_id=int(record.get("id", 0)),
                user_detail=user_detail,
                title=f"Vehicle return updated: {record.get('id', 0)}",
                description=f"Vehicle return for booking {record.get('booking_id', 0)} - Received by: {record.get('received_by', 'N/A')}, Received from: {record.get('received_from', 'N/A')}",
                metadata={
                    "booking_id": record.get("booking_id"),
                    "received_by": record.get("received_by"),
                    "received_from": record.get("received_from")
                }
            )

        record["editable"] = 1
        return {"status": status.HTTP_200_OK, "message": message, "data": convert_to_jsonable(record)}
    except Exception as e:
        return get_error_details(e)


@bookings.post("/rentify/bookings/refund-request")
async def save_refund_request(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Save refund request information
    """
    try:
        form = await request.form()
        doc_id = int(form.get("id", 0))
        next_id = doc_id or get_next_id(refund_request_collection)

        data = RefundRequestCreate() if doc_id == 0 else RefundRequestUpdate()
        data.id = next_id if doc_id == 0 else doc_id

        # Required ints/floats with safe casting
        def to_int(val, default=0):
            try:
                return int(val) if val not in (None, "") else default
            except (ValueError, TypeError):
                return default

        def to_float(val, default=0.0):
            try:
                return float(val) if val not in (None, "") else default
            except (ValueError, TypeError):
                return default

        # Map fields
        data.tenant_id = to_int(user_detail.get("tenant_id", 0))
        data.booking_id = to_int(form.get("booking_id", 0))
        data.refund_reason_id = to_int(form.get("refund_reason_id", 0))
        data.specify_reason = form.get("bank_name", "") or ""
        data.refund_amount = to_float(form.get("refund_amount", 0))
        data.refund_method_id = to_int(form.get("refund_method_id", 0))
        data.status_id = to_int(form.get("status_id", 1))
        
        data.bank_name = form.get("bank_name", "") or ""
        data.iban_number = form.get("iban_number", "") or ""
        data.account_name = form.get("account_name", "") or ""
        data.bank_verified = to_int(form.get("bank_verified", 1))
        
        data.agree_refund_policy = to_int(form.get("agree_refund_policy", 1))

        # Validate required fields
        if not data.booking_id:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "booking_id is required",
                "data": None
            }

        record = data.dict()

        if doc_id == 0:
            refund_request_collection.insert_one(record)

            collection.update_one(
                {"id": data.booking_id},
                {"$set": {"booking_status_id": 6, "security_deposit_status_id": 3}},
            )

            booking = collection.find_one(
                {"id": data.booking_id, "deleted": {"$ne": 1}},
                {"_id": 0, "vehicle_id": 1},
            )
            if booking:
                vehicle_id_for_refund = int(booking.get("vehicle_id", 0) or 0)
                if vehicle_id_for_refund > 0:
                    vehicles_collection.update_one(
                        {"id": vehicle_id_for_refund},
                        {"$set": {"status_id": 1}},
                    )
            message = "Refund request created successfully"
            
            log_activity(
                activity_type="refund_request_created",
                entity_type="refund_request",
                entity_id=int(record.get("id", 0)),
                user_detail=user_detail,
                title=f"New refund request added: {record.get('id', 0)}",
                description=f"Refund request for booking {record.get('booking_id', 0)} - Amount: {record.get('refund_amount', 0)}, Reason ID: {record.get('refund_reason_id', 0)}",
                metadata={
                    "booking_id": record.get("booking_id"),
                    "refund_amount": record.get("refund_amount"),
                    "refund_reason_id": record.get("refund_reason_id"),
                    "refund_method_id": record.get("refund_method_id"),
                    "bank_name": record.get("bank_name"),
                    "iban_number": record.get("iban_number"),
                    "account_name": record.get("account_name"),
                    "agree_refund_policy": record.get("agree_refund_policy")
                }
            )
        else:
            refund_request_collection.update_one({"id": doc_id}, {"$set": record})
            message = "Refund request updated successfully"
            
            log_activity(
                activity_type="refund_request_updated",
                entity_type="refund_request",
                entity_id=int(record.get("id", 0)),
                user_detail=user_detail,
                title=f"Refund request updated: {record.get('id', 0)}",
                description=f"Refund request for booking {record.get('booking_id', 0)} - Amount: {record.get('refund_amount', 0)}, Reason ID: {record.get('refund_reason_id', 0)}",
                metadata={
                    "booking_id": record.get("booking_id"),
                    "refund_amount": record.get("refund_amount"),
                    "refund_reason_id": record.get("refund_reason_id"),
                    "refund_method_id": record.get("refund_method_id"),
                    "bank_name": record.get("bank_name"),
                    "iban_number": record.get("iban_number"),
                    "account_name": record.get("account_name"),
                    "agree_refund_policy": record.get("agree_refund_policy")
                }
            )

        record["editable"] = 1
        return {"status": status.HTTP_200_OK, "message": message, "data": convert_to_jsonable(record)}
    except Exception as e:
        return get_error_details(e)


@bookings.get("/rentify/bookings/{id}/favorite/{value}")
async def toggle_booking_favorite(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Toggle favorite status for a booking by setting the 'favorite' flag.
    Default value is 0 (not favorite), 1 for favorite.
    """
    try:
        if value == 1:
            favorite_collection.insert_one(
                {"id": get_next_id(favorite_collection),
                "tenant_id": user_detail["tenant_id"], 
                "favorite_type": "booking",
                "favorite_id": id,
                "user_id": int(user_detail["id"])}
                )
            message = "Booking marked as favorite" if value else "Booking unmarked as favorite"
        else:
            favorite_collection.delete_one({"id": id, "tenant_id": user_detail["tenant_id"], "favorite_type": "booking", "favorite_id": id, "user_id": int(user_detail["id"])})
            message = "Booking unmarked as favorite"
        
        log_activity(
            activity_type="booking_marked_as_favorite" if value else "booking_unmarked_as_favorite",
            entity_type="booking",
            entity_id=id,
            user_detail=user_detail,
            title=f"Booking {'marked as favorite' if value else 'unmarked as favorite'}",
            description=f"Booking {'marked as favorite' if value else 'unmarked as favorite'}",
            metadata={}
        )
        
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": None
        }
    except Exception as e:
        return get_error_details(e)


# customer quotes

@bookings.post("/rentify/customers/profile/add_note")
async def add_customer_note(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Add a note to customer profile
    """
    try:
        # Get form data
        form = await request.form()
        
        # Resolve current tenant id (default to 0 if missing)
        tenant_id = int(user_detail.get("tenant_id", 0))
        
        # Get parameters
        id = int(form.get("id", 0))
        customer_id = int(form.get("customer_id", 0))
        note = form.get("content", "")
        
        if not customer_id or not note:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "customer_id and note are required",
                "data": None
            }
        
        # Verify customer exists
        customer = customers_collection.find_one({
            "id": customer_id,
            "deleted": {"$ne": 1},
            "tenant_id": tenant_id
        }, NO_ID_PROJECTION)
        
        if not customer:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Customer not found",
                "data": None
            }
        
        # Persist note
        from app.models.rentify.notes import CustomerNoteCreate
        customer_notes_collection = db_rentify.rentify_customer_notes
        note_obj = CustomerNoteCreate()
        note_obj.id = get_next_id(customer_notes_collection)
        note_obj.customer_id = customer_id
        note_obj.content = note
        note_obj.tenant_id = tenant_id
        # Save the acting user's id ("login as" user)
        note_obj.created_by = int(user_detail.get("id", 0) or 0)

        customer_notes_collection.insert_one(note_obj.dict())

        created = customer_notes_collection.find_one({
            "id": note_obj.id,
            "tenant_id": tenant_id},
            NO_ID_PROJECTION)

        
        created["user"] = customers_collection.find_one({"id": int(customer_id)},{"id":1,"first_name":1,"last_name":1,"company_name":1,"profile_image":1,"_id":0})
            
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Note added successfully",
            "data": convert_to_jsonable(created),
            "tenant_id": tenant_id
        }
        
    except Exception as e:
        return get_error_details(e)

@bookings.post("/rentify/customers/profile/create_folder")
async def create_customer_folder(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Create a folder for customer profile attachments
    """
    try:
        # Get form data
        form = await request.form()
        
        # Resolve current tenant id (default to 0 if missing)
        tenant_id = int(user_detail.get("tenant_id", 0))
        
        # Get parameters
        customer_id = int(form.get("customer_id", 0))
        id = form.get("id", 0)
        name = form.get("name", "")
        
        if not customer_id or not name:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "customer_id and name are required",
                "data": None
            }
        
        # Verify customer exists
        customer = customer_attachments_collection.find_one({
            "id": customer_id,
            "deleted": {"$ne": 1},
            "tenant_id": tenant_id
        })
        
        if not customer:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Customer not found",
                "data": None
            }
        
        # TODO: Implement folder collection integration
        # This would create a new folder record with:
        # - customer_id
        # - folder name
        # - created_by (user_id)
        # - createdon timestamp
        # - tenant_id
        
        # Placeholder response
        folder_data = {
            "id": 0,  # Would be generated by get_next_id
            "customer_id": customer_id,
            "name": name,
            "created_by": user_detail.get("id", 0),
            "createdon": datetime.now(timezone.utc).isoformat(),
            "tenant_id": tenant_id
        }
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Folder created successfully",
            "data": folder_data,
            "tenant_id": tenant_id
        }
        
    except Exception as e:
        return get_error_details(e)

@bookings.post("/rentify/customers/profile/add_attachment")
async def add_customer_attachment(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Add an attachment to customer profile
    """
    try:
        # Get form data
        form = await request.form()
        
        # Resolve current tenant id (default to 0 if missing)
        tenant_id = int(user_detail.get("tenant_id", 0))
        customer_id = int(form.get("customer_id", 0))
        # Payload fields (support form/multipart)
        record_id = int(form.get("id", 0) or 0)
        file_name = form.get("file_name", "")
        folder = form.get("folder", "")
        attached_by = form.get("attached_by", user_detail.get("id", 0))
        attached_date = form.get("attached_date", datetime.now(timezone.utc).isoformat())
        old_file = form.get("old_file", "")
        active_raw = form.get("active", 1)
        try:
            active_val = int(active_raw)
        except (ValueError, TypeError):
            active_val = 1
        # Tags may be JSON array string or comma-separated or multi-select
        tags_val = form.get("tags", [])
        if isinstance(tags_val, str):
            import json
            try:
                parsed = json.loads(tags_val)
                if isinstance(parsed, list):
                    tags_list: list[str] = [str(x) for x in parsed]
                else:
                    tags_list = [tags_val]
            except Exception:
                tags_list = [t.strip() for t in tags_val.split(",") if t.strip()]
        else:
            try:
                tags_list = list(tags_val)
            except Exception:
                tags_list = []
        # File can come under "file" or "attachment"
        upload_file = form.get("file") or form.get("attachment")
        
        if not customer_id:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "customer_id is required",
                "data": None
            }
        if not upload_file:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "file is required",
                "data": None
            }
        
        # Verify customer exists
        customer = customers_collection.find_one({
            "id": customer_id,
            "deleted": {"$ne": 1},
            "tenant_id": tenant_id
        })
        
        if not customer:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Customer not found",
                "data": None
            }
        
        # Upload file to DO and persist record
        from app.helpers.uploadimage import UploadImage
        folder_segment = folder or "general"
        upload_path = UploadImage.uploadImage_DO(upload_file, f"rentify/customers/attachments/{customer_id}/{folder_segment}")
        file_url = (getattr(config, 'IMAGE_DO_URL', '') or '') + upload_path

        record = {
            "id": (record_id if record_id else get_next_id(customer_attachments_collection)),
            "customer_id": int(customer_id),
            "file_name": file_name or getattr(upload_file, 'filename', ''),
            "file_path": upload_path,
            "file_url": file_url,
            "file_type": getattr(upload_file, 'content_type', ''),
            "file_size": getattr(upload_file, 'size', 0) or 0,
            "attached_by": attached_by,
            "attached_date": attached_date,
            "folder": folder,
            "old_file": old_file,
            "tags": tags_list,
            "active": active_val,
            "deleted": 0,
            "createdon": datetime.now(timezone.utc).isoformat(),
            "tenant_id": tenant_id
        }

        customer_attachments_collection.insert_one(record)

        # Get all attachments using the helper function
        buckets = get_customer_attachments_data(customer_id, tenant_id)
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Attachment added successfully",
            "data": convert_to_jsonable(buckets),
            "tenant_id": tenant_id,
            "customer_id": int(customer_id)
        }
        
    except Exception as e:
        return get_error_details(e)

@bookings.get("/rentify/customers/get-notes/{id}")
async def get_customer_notes(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        tenant_id = int(user_detail.get("tenant_id", 0))
        customer_notes_collection = db_rentify.rentify_customer_notes
        records = list(customer_notes_collection.find({
            "deleted": {"$ne": 1},
            "tenant_id": tenant_id,
            "customer_id": int(id)
        }, NO_ID_PROJECTION))

        for record in records:
            record["user"] = customers_collection.find_one({"id": int(id)},{"id":1,"first_name":1,"last_name":1,"company_name":1,"profile_image":1,"_id":0})

        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": convert_to_jsonable(records),
            "tenant_id": tenant_id,
            "customer_id": int(id)
        }

    except Exception as e:
        return get_error_details(e)

def get_customer_attachments_data(customer_id: int, tenant_id: int) -> dict:
    """
    Get customer attachments organized by folder buckets
    """
    try:
        # Get all attachments for this customer
        attachments = list(customer_attachments_collection.find({
            "customer_id": int(customer_id),
            "deleted": {"$ne": 1},
            "tenant_id": tenant_id
        }, NO_ID_PROJECTION))

        # Fixed folders buckets
        buckets = {
            "business_documents": [],
            "vehicle_documents": [],
            "booking_documents": [],
            "miscellaneous": []
        }

        for attachment in attachments:
            folder = (attachment.get("folder") or "").strip() or "miscellaneous"
            if folder not in buckets:
                # Anything else goes to miscellaneous
                buckets["miscellaneous"].append(attachment)
            else:
                buckets[folder].append(attachment)
        
        return buckets
    except Exception as e:
        print(f"Error getting customer attachments: {e}")
        return {
            "business_documents": [],
            "vehicle_documents": [],
            "booking_documents": [],
            "miscellaneous": []
        }        

@bookings.get("/rentify/customers/get-attachments/{id}")
async def get_customer_attachments(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        tenant_id = int(user_detail.get("tenant_id", 0))
        
       
        buckets = get_customer_attachments_data(id, tenant_id)
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Attachments retrieved successfully",
            "data": convert_to_jsonable(buckets),
            "tenant_id": tenant_id,
            "customer_id": int(id)
        }

    except Exception as e:
        return get_error_details(e)