import ast
from app.networks.database import db
from app.networks.database import db_global, db_rentify

from bson import json_util
import json
from datetime import datetime, timedelta
from typing import Dict, Any


# Query type constants for better maintainability
QUERY_TYPE_ALL = 1
QUERY_TYPE_OWNED = 2
QUERY_TYPE_TODAY = 3


def build_crm_query(query_type: int, user_detail: Dict[str, Any], owner_field: str = "contact_owner") -> Dict[str, Any]:
    """
    Build optimized MongoDB query based on query type for CRM modules.
    
    Args:
        query_type: Type of query to build (1=all, 2=owned, 3=today)
        user_detail: User details containing tenant_id and id
        owner_field: Field name for owner filtering (default: "contact_owner")
        
    Returns:
        Optimized MongoDB query dictionary
    """
    # Base query with tenant filtering and soft delete exclusion
    base_query = {
        "tenant_id": user_detail["tenant_id"],
        "deleted": {"$ne": 1}
    }
    
    if query_type == QUERY_TYPE_ALL:
        return base_query
    
    elif query_type == QUERY_TYPE_OWNED:
        return {
            **base_query,
            owner_field: int(user_detail["id"])
        }
    
    elif query_type == QUERY_TYPE_TODAY:
        # Pre-calculate date range for better performance
        # Handle ISO datetime string format: "2025-05-28T11:41:18.721+00:00"
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today + timedelta(days=1)
        
        # Convert to ISO format strings for proper MongoDB comparison
        today_iso = today.isoformat() + "+00:00"
        tomorrow_iso = tomorrow.isoformat() + "+00:00"
        
        return {
            **base_query,
            "created_at": {"$gte": today_iso, "$lt": tomorrow_iso}
        }
    
    # Default to base query for invalid query types
    return base_query


def getLastUserId(self, fieldid: str):
    if len(list(self.find())) != 0:
        results = self.aggregate(
            [
            {
                '$sort': {
                    'id': -1
                }
            }, {
                '$limit': 1
            }, {
                '$project': {
                    'id': '$id',
                    '_id': 0
                }
            }
        ]
        )
        results_ = list(results)
        page_sanitized = json.loads(json_util.dumps(results_))

        if page_sanitized[0]["id"] :
            return page_sanitized[0]["id"]      
        else:
            return 0
    else: 
        return 0

def getLastFieldValue(self, fieldid: str):
    if len(list(self.find())) != 0:
        results = self.aggregate([{
                '$sort': {
                    fieldid: -1
                }
            },{
                '$limit': 1
            }, {
                '$project': {
                    fieldid: f'${fieldid}',
                    '_id': 0
                }
            }
        ])
        results_ = list(results)
        page_sanitized = json.loads(json_util.dumps(results_))
        if page_sanitized[0][fieldid]:
            return page_sanitized[0][fieldid]    
        else:
            return 0
    else: 
        return 0

def getCount(collectionName: str, searchQuery):

    results = db[collectionName].aggregate(
        [   {
                '$match': searchQuery
            },
            {
                '$count': 'total_records'
            }
        ])

    results_ = list(results)
    page_sanitized = json.loads(json_util.dumps(results_))

    if page_sanitized:
        return page_sanitized[0]["total_records"]
    else:
        return 0

def getCountforApps(collectionName: str, searchQuery):

    results = db[collectionName].aggregate(
        [   {
                '$match': searchQuery
            },
            {
                '$count': 'total_records'
            }
        ])

    results_ = list(results)
    page_sanitized = json.loads(json_util.dumps(results_))

    if page_sanitized:

        return page_sanitized[0]["total_records"]
    else:
        return 0







#========================================
#  GLOBAL FUNCTIONS - starting
#========================================
def getCountryById(id:int):
    records = list(
            db_global.countries.aggregate([
                {"$match": {"id":id, "deleted": {"$ne": 1}}},
                {"$sort": {"id": -1}},
                {"$project": {
                    "_id": 0,
                    "id": 1,
                    "title": "$name.common",
                    "flag": "$flags.svg"
                }}
            ])
        )
    return records[0] if len(records) > 0 else None

# Brands - stating
def getBrandById(id: int):
    record = db_rentify.rentify_library_brands.find_one(
        {"id": id, "deleted": 0},
        {"_id": 0}
    )
    if not record:  # safeguard against None
        return None
    
    record["origin_country"] = getCountryById(int(record.get("origin_country_id", 0)))
    return record

def getBrandsByOriginCountryId(origin_country_id: int):
    brands = list(
        db_rentify.rentify_library_brands.find(
            {"origin_country_id": origin_country_id, "deleted": {"$ne": 1}},
            {"_id": 0, "id": 1}
        )
    )
    return [brand["id"] for brand in brands]
# Brands - ending

# Vehicles - starting
def getVehicleById(id: int):
    """Get vehicle by ID with all related details"""
    record = db_rentify.rentify_vehicles.find_one(
        {"id": id, "deleted": {"$ne": 1}},
        {"_id": 0}
    )
    if not record:
        return None
    
    # Add related details
    record["brand_details"] = db_rentify.rentify_library_brands.find_one({"id": record.get("brand_id")}, {"_id": 0})
    record["model_details"] = db_rentify.rentify_library_models.find_one({"id": record.get("model_id")}, {"_id": 0})
    record["variant_details"] = db_rentify.rentify_library_variants.find_one({"id": record.get("variant_id")}, {"_id": 0})
    record["origin_country_details"] = db_rentify.countries.find_one({"id": record.get("origin_country_id")}, {"_id": 0})
    record["body_type_details"] = db_rentify.rentify_library_body_types.find_one({"id": record.get("body_type_id")}, {"_id": 0})
    record["fuel_type_details"] = db_rentify.rentify_library_fuel_types.find_one({"id": record.get("fuel_type_id")}, {"_id": 0})
    record["transmission_type_details"] = db_rentify.rentify_library_transmission_types.find_one({"id": record.get("transmission_type_id")}, {"_id": 0})
    record["exterior_color_details"] = db_rentify.rentify_library_colors.find_one({"id": record.get("exterior_color_id")}, {"_id": 0})
    record["interior_color_details"] = db_rentify.rentify_library_colors.find_one({"id": record.get("interior_color_id")}, {"_id": 0})
    
    return record

def getModelById(id: int):
    """Get model by ID"""
    record = db_rentify.rentify_library_models.find_one(
        {"id": id, "deleted": {"$ne": 1}},
        {"_id": 0}
    )
    if not record:
        return None
    
    record["brand_details"] = getBrandById(int(record.get("brand_id", 0)))
    return record

def getVariantById(id: int):
    """Get variant by ID"""
    record = db_rentify.rentify_library_variants.find_one(
        {"id": id, "deleted": {"$ne": 1}},
        {"_id": 0}
    )
    if not record:
        return None
    
    record["brand_details"] = getBrandById(int(record.get("brand_id", 0)))
    return record

def getBodyTypeById(id: int):
    """Get body type by ID"""
    record = db_rentify.rentify_library_body_types.find_one(
        {"id": id, "deleted": {"$ne": 1}},
        {"_id": 0}
    )
    return record

def getFuelTypeById(id: int):
    """Get fuel type by ID"""
    record = db_rentify.rentify_library_fuel_types.find_one(
        {"id": id, "deleted": {"$ne": 1}},
        {"_id": 0}
    )
    return record

def getTransmissionTypeById(id: int):
    """Get transmission type by ID"""
    record = db_rentify.rentify_library_transmission_types.find_one(
        {"id": id, "deleted": {"$ne": 1}},
        {"_id": 0}
    )
    return record

def getColorById(id: int):
    """Get color by ID"""
    record = db_rentify.rentify_library_colors.find_one(
        {"id": id, "deleted": {"$ne": 1}},
        {"_id": 0}
    )
    return record
# Vehicles - ending

# Customers - starting
def getCustomerById(id: int):
    """Get customer by ID with all related details"""
    record = db_rentify.rentify_customers.find_one(
        {"id": id, "deleted": {"$ne": 1}},
        {"_id": 0}
    )
    if not record:
        return None
    
    # Add customer images
    customer_id = record.get("id", 0)
    if customer_id:
        record["registration_document"] = list(db_rentify.rentify_customers_documents.find({"customer_id": customer_id,"image_type": "registration_document", "deleted": {"$ne": 1}}, {"_id": 0}))
        record["driving_license"] = list(db_rentify.rentify_customers_documents.find({"customer_id": customer_id,"image_type": "driving_license", "deleted": {"$ne": 1}}, {"_id": 0}))
        record["trade_license"] = list(db_rentify.rentify_customers_documents.find({"customer_id": customer_id,"image_type": "trade_license", "deleted": {"$ne": 1}}, {"_id": 0}))
        record["owner_document"] = list(db_rentify.rentify_customers_documents.find({"customer_id": customer_id,"image_type": "owner_document", "deleted": {"$ne": 1}}, {"_id": 0}))


        
    else:
        record["registration_document"] = []
        record["driving_license"] = []
        record["trade_license"] = []
        record["owner_document"] = []
    
    return record
# Customers - ending

# Payments - starting
def getPaymentById(id: int, booking_id: int = 0, payment_purpose: str = ""):
    """Get payment by ID or by booking_id and payment_purpose"""
    query = {"deleted": {"$ne": 1}}
    
    if id > 0:
        query["id"] = id
    elif booking_id > 0 and payment_purpose:
        query["booking_id"] = booking_id
        query["payment_purpose"] = payment_purpose
    else:
        return None
    
    record = db_rentify.rentify_payments.find_one(query, {"_id": 0})
    return record

def getPaymentsByBookingId(booking_id: int):
    """Get all payments for a booking"""
    records = list(db_rentify.rentify_payments.find(
        {"booking_id": booking_id, "deleted": {"$ne": 1}},
        {"_id": 0}
    ))
    return records
# Payments - ending

# Refund Requests - starting
def getRefundRequestById(booking_id: int):
    """Get refund request by booking ID"""
    record = db_rentify.rentify_refund_requests.find_one(
        {"booking_id": booking_id, "deleted": {"$ne": 1}},
        {"_id": 0}
    )
    return record
# Refund Requests - ending

# Vehicle Delivery - starting
def getVehicleDeliveryById(booking_id: int):
    """Get vehicle delivery details by booking ID"""
    record = db_rentify.rentify_vehicle_delivery.find_one(
        {"booking_id": booking_id, "deleted": {"$ne": 1}},
        {"_id": 0}
    )
    if record:
        # Get delivery images
        delivery_id = record.get("id", 0)
        if delivery_id:
            record["images"] = list(db_rentify.rentify_vehicle_delivery_images.find(
                {"delivery_id": delivery_id, "deleted": {"$ne": 1}},
                {"_id": 0}
            ))
        else:
            record["images"] = []
    return record
# Vehicle Delivery - ending

# Vehicle Return - starting
def getVehicleReturnById(booking_id: int):
    """Get vehicle return details by booking ID"""
    record = db_rentify.rentify_vehicle_returns.find_one(
        {"booking_id": booking_id, "deleted": {"$ne": 1}},
        {"_id": 0}
    )
    if record:
        # Get return images
        return_id = record.get("id", 0)
        if return_id:
            record["images"] = list(db_rentify.rentify_vehicle_return_images.find(
                {"return_id": return_id, "deleted": {"$ne": 1}},
                {"_id": 0}
            ))
        else:
            record["images"] = []
    return record
# Vehicle Return - ending


#========================================
#  GLOBAL FUNCTIONS - ending
#========================================