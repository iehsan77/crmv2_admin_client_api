from fastapi import APIRouter, Request, status, Depends
from app.helpers.globalfunctions import getCustomerById, getVehicleById
from app.networks.database import db_rentify, db_global
from app.helpers.uploadimage import UploadImage
from app.routes.rentify.bookings import vehicle_images_collection
from app.utils import oauth2
from app.utils import config
from datetime import datetime, timezone, timedelta
from typing import Any, Optional, Dict

rentify_affiliates = APIRouter(tags=["Rentify Admin > Rentify > affiliates"])
collection = db_rentify.rentify_affiliates
affiliate_documents_collection = db_rentify.rentify_affiliate_documents
affiliate_attachments_collection = db_rentify.rentify_affiliates_attachment
bookings_collection = db_rentify.rentify_bookings
customers_collection = db_rentify.rentify_customers


vehicles_collection = db_rentify.rentify_vehicles
notes_collection = db_rentify.rentify_affiliate_notes
favorite_collection = db_rentify.rentify_favorites




from app.helpers.general_helper import (
    convert_to_jsonable,
    format_percent_value,
    get_error_details,
    get_error_response,
    get_next_id,
    get_next_affiliate_uid,
    json_response,
)
from app.helpers.crm_helper import log_activity
from app.helpers.file_handler import process_document
from app.models.rentify.affiliates import AffiliateCreate, AffiliateDocuments, AffiliateUpdate
from app.models.rentify.notes import AffiliateNoteCreate, AffiliateNoteUpdate

# Projection to exclude MongoDB _id
NO_ID_PROJECTION = {"_id": 0}


# ------------------------------
# Filter builder utility
# ------------------------------
def build_affiliate_filters(form: dict, tenant_id: int) -> tuple[dict, list[str]]:
    """
    Build MongoDB filter query for affiliates based on the incoming form.
    Returns (filter_query, warnings)
    """
    warnings: list[str] = []
    filter_query: dict = {"deleted": {"$ne": 1}, "tenant_id": tenant_id}
    current_time = datetime.now(timezone.utc)
    print(form)
    
    def _normalize_to_int_list(raw_value: Any, field_name: str) -> list[int]:
        if raw_value is None or raw_value == "":
            return []
        if isinstance(raw_value, (list, tuple, set)):
            candidates = list(raw_value)
        elif isinstance(raw_value, str):
            if raw_value.strip() == "":
                return []
            if "," in raw_value:
                candidates = [item.strip() for item in raw_value.split(",") if item.strip()]
            else:
                candidates = [raw_value.strip()]
        else:
            candidates = [raw_value]

        normalized: list[int] = []
        for candidate in candidates:
            try:
                normalized.append(int(candidate))
            except (TypeError, ValueError):
                warnings.append(f"Invalid '{field_name}' value '{candidate}', skipped")
        return normalized
    
    # Handle view-based filtering
    view_value = form.get("view", "all_affiliates")
    
    # Apply view-specific base filters
    if view_value == "all_affiliates":
        # No additional filters; use base_query to return all affiliates for tenant
        pass
        
    elif view_value == "favorites_affiliates":
        filter_query["favorite"] = 1# High priority affiliates
    elif view_value == "active_affiliates":
        filter_query["active"] = 1
    elif view_value == "inactive_affiliates":
        filter_query["active"] = 0
    elif view_value == "high_vehicle_capacity":
        filter_query["active"] = 1
        vehicle_pipeline = [
            {
                "$match": {
                    "tenant_id": tenant_id,
                    "deleted": {"$ne": 1},
                    "affiliate_id": {"$gt": 0},
                    "rent_price": {"$gt": 0}
                }
            },
            {
                "$group": {
                    "_id": "$affiliate_id",
                    "avg_rent_price": {"$avg": {"$ifNull": ["$rent_price", 0]}},
                    "max_rent_price": {"$max": {"$ifNull": ["$rent_price", 0]}},
                    "vehicle_count": {"$sum": 1}
                }
            },
            {
                "$sort": {"avg_rent_price": -1}
            },
            {
                "$limit": 10
            }
        ]
        high_capacity_result = list(vehicles_collection.aggregate(vehicle_pipeline))
        high_capacity_affiliate_ids = [doc.get("_id") for doc in high_capacity_result if doc.get("_id")]
        if high_capacity_affiliate_ids:
            filter_query["id"] = {"$in": high_capacity_affiliate_ids}
            filter_query["_high_capacity_metadata"] = {
                doc.get("_id"): {
                    "avg_rent_price": doc.get("avg_rent_price", 0),
                    "max_rent_price": doc.get("max_rent_price", 0),
                    "vehicle_count": doc.get("vehicle_count", 0)
                }
                for doc in high_capacity_result if doc.get("_id")
            }
        else:
            filter_query["id"] = {"$in": []}
            filter_query["_high_capacity_metadata"] = {}

    elif view_value == "low_vehicle_capacity":
        filter_query["active"] = 1
        vehicle_pipeline = [
            {
                "$match": {
                    "tenant_id": tenant_id,
                    "deleted": {"$ne": 1},
                    "affiliate_id": {"$gt": 0},
                    "rent_price": {"$gt": 0}
                }
            },
            {
                "$group": {
                    "_id": "$affiliate_id",
                    "avg_rent_price": {"$avg": {"$ifNull": ["$rent_price", 0]}},
                    "min_rent_price": {"$min": {"$ifNull": ["$rent_price", 0]}},
                    "vehicle_count": {"$sum": 1}
                }
            },
            {
                "$sort": {"avg_rent_price": 1}
            },
            {
                "$limit": 10
            }
        ]
        low_capacity_result = list(vehicles_collection.aggregate(vehicle_pipeline))
        low_capacity_affiliate_ids = [doc.get("_id") for doc in low_capacity_result if doc.get("_id")]
        if low_capacity_affiliate_ids:
            filter_query["id"] = {"$in": low_capacity_affiliate_ids}
            filter_query["_low_capacity_metadata"] = {
                doc.get("_id"): {
                    "avg_rent_price": doc.get("avg_rent_price", 0),
                    "min_rent_price": doc.get("min_rent_price", 0),
                    "vehicle_count": doc.get("vehicle_count", 0)
                }
                for doc in low_capacity_result if doc.get("_id")
            }
        else:
            filter_query["id"] = {"$in": []}
            filter_query["_low_capacity_metadata"] = {}

        
    elif view_value == "top_performing":
        filter_query["active"] = 1
        # Get top performing affiliates based on booking count and total revenue
        bookings_collection = db_rentify.rentify_bookings
        
        # Get optional filter parameters for top performing
        min_bookings = form.get("min_bookings")
        max_bookings = form.get("max_bookings")
        min_revenue = form.get("min_revenue")
        max_revenue = form.get("max_revenue")
        top_n = form.get("top_n")  # Limit to top N affiliates
        
        # Aggregate bookings by affiliate_id to calculate performance metrics
        # Join with vehicles to get affiliate_id
        pipeline = [
            {
                "$match": {
                    "tenant_id": tenant_id,
                    "deleted": {"$ne": 1},
                    "booking_status_id": {"$in": [2, 3, 4]},  # Confirmed, Active, Completed
                    "vehicle_id": {"$gt": 0}  # Only vehicles with valid IDs
                }
            },
            {
                "$lookup": {
                    "from": "rentify_vehicles",
                    "localField": "vehicle_id",
                    "foreignField": "id",
                    "as": "vehicle"
                }
            },
            {
                "$unwind": {
                    "path": "$vehicle",
                    "preserveNullAndEmptyArrays": False
                }
            },
            {
                "$match": {
                    "vehicle.tenant_id": tenant_id,
                    "vehicle.deleted": {"$ne": 1},
                    "vehicle.affiliate_id": {"$gt": 0}  # Only affiliates (not 0)
                }
            },
            {
                "$group": {
                    "_id": "$vehicle.affiliate_id",
                    "booking_count": {"$sum": 1},
                    "total_revenue": {"$sum": {"$ifNull": ["$total_rent_amount", 0]}}
                }
            }
        ]
        
        # Apply minimum thresholds after grouping (post-aggregation filtering)
        if min_bookings:
            try:
                min_bookings_int = int(min_bookings)
                pipeline.append({"$match": {"booking_count": {"$gte": min_bookings_int}}})
            except (ValueError, TypeError):
                warnings.append(f"Invalid 'min_bookings' value '{min_bookings}', filter skipped")
        
        if max_bookings:
            try:
                max_bookings_int = int(max_bookings)
                pipeline.append({"$match": {"booking_count": {"$lte": max_bookings_int}}})
            except (ValueError, TypeError):
                warnings.append(f"Invalid 'max_bookings' value '{max_bookings}', filter skipped")
        
        if min_revenue:
            try:
                min_revenue_float = float(min_revenue)
                pipeline.append({"$match": {"total_revenue": {"$gte": min_revenue_float}}})
            except (ValueError, TypeError):
                warnings.append(f"Invalid 'min_revenue' value '{min_revenue}', filter skipped")
        
        if max_revenue:
            try:
                max_revenue_float = float(max_revenue)
                pipeline.append({"$match": {"total_revenue": {"$lte": max_revenue_float}}})
            except (ValueError, TypeError):
                warnings.append(f"Invalid 'max_revenue' value '{max_revenue}', filter skipped")
        
        # Sort by revenue (descending) then by booking count (descending)
        pipeline.append({"$sort": {"total_revenue": -1, "booking_count": -1}})
        
        # Limit to top N if specified
        if top_n:
            try:
                top_n_int = int(top_n)
                if top_n_int > 0:
                    pipeline.append({"$limit": top_n_int})
            except (ValueError, TypeError):
                warnings.append(f"Invalid 'top_n' value '{top_n}', filter skipped")
        
        # Execute aggregation
        top_performing_result = list(bookings_collection.aggregate(pipeline))
        top_performing_affiliate_ids = [doc.get("_id") for doc in top_performing_result if doc.get("_id")]
        
        # Store performance metrics for later use
        affiliate_performance_map = {
            doc.get("_id"): {
                "booking_count": doc.get("booking_count", 0),
                "total_revenue": doc.get("total_revenue", 0)
            }
            for doc in top_performing_result
        }
        
        # Filter affiliates by top performing affiliate IDs
        if top_performing_affiliate_ids:
            filter_query["id"] = {"$in": top_performing_affiliate_ids}
            filter_query["_top_performing_metadata"] = affiliate_performance_map
        else:
            # No top performing affiliates found, return empty result
            filter_query["id"] = {"$in": []}
            filter_query["_top_performing_metadata"] = {}
    
    elif view_value == "document_expiring_soon":
        
        # Get current date range (today through next 7 days) using date-only comparison
        current_date = datetime.now(timezone.utc).date()
        end_date = current_date + timedelta(days=7)
        current_date_str = current_date.isoformat()
        end_date_str = end_date.isoformat()
        
        def _date_only_range_expr(field_name: str) -> dict:
            return {
                "$expr": {
                    "$and": [
                        {
                            "$gte": [
                                {"$substrCP": [f"${field_name}", 0, 10]},
                                current_date_str
                            ]
                        },
                        {
                            "$lte": [
                                {"$substrCP": [f"${field_name}", 0, 10]},
                                end_date_str
                            ]
                        }
                    ]
                }
            }

        # Build $or condition to match any affiliate expiry date within the window
        filter_query["$or"] = [
            _date_only_range_expr("cnic_passport_expiry"),
            _date_only_range_expr("contract_end_date"),
            _date_only_range_expr("trade_license_expiry"),
            _date_only_range_expr("driving_license_expiry"),
            _date_only_range_expr("vat_registration_expiry"),
        ]

    elif view_value == "high_bookings_volume":
        filter_query["active"] = 1
        # Get affiliates with high booking volume
        bookings_collection = db_rentify.rentify_bookings
        
        # Get optional parameters for defining "high" bookings
        min_bookings_threshold = form.get("min_bookings_threshold")  # Minimum bookings to be considered "high"
        
        # Aggregate bookings by affiliate_id to calculate booking counts
        # First, we need to get vehicles and their affiliate_ids, then count bookings per affiliate
        pipeline = [
            {
                "$match": {
                    "tenant_id": tenant_id,
                    "deleted": {"$ne": 1},
                    "booking_status_id": {"$in": [2, 3, 4]},  # Confirmed, Active, Completed
                    "vehicle_id": {"$gt": 0}
                }
            },
            {
                "$lookup": {
                    "from": "rentify_vehicles",
                    "localField": "vehicle_id",
                    "foreignField": "id",
                    "as": "vehicle"
                }
            },
            {
                "$unwind": {
                    "path": "$vehicle",
                    "preserveNullAndEmptyArrays": False
                }
            },
            {
                "$match": {
                    "vehicle.tenant_id": tenant_id,
                    "vehicle.deleted": {"$ne": 1},
                    "vehicle.affiliate_id": {"$gt": 0}  # Only affiliates (not 0)
                }
            },
            {
                "$group": {
                    "_id": "$vehicle.affiliate_id",
                    "booking_count": {"$sum": 1},
                    "total_revenue": {"$sum": {"$ifNull": ["$total_rent_amount", 0]}}
                }
            }
        ]
        
        # Apply minimum threshold if provided
        if min_bookings_threshold:
            try:
                min_bookings_int = int(min_bookings_threshold)
                pipeline.append({"$match": {"booking_count": {"$gte": min_bookings_int}}})
            except (ValueError, TypeError):
                warnings.append(f"Invalid 'min_bookings_threshold' value '{min_bookings_threshold}', filter skipped")
        else:
            # Default: use median or average as threshold for "high" bookings
            # For now, we'll use a reasonable default (e.g., top 50% or bookings >= 10)
            # Calculate average bookings per affiliate
            avg_pipeline = pipeline.copy()
            avg_pipeline.append({
                "$group": {
                    "_id": None,
                    "avg_bookings": {"$avg": "$booking_count"}
                }
            })
            avg_result = list(bookings_collection.aggregate(avg_pipeline))
            avg_bookings = avg_result[0]["avg_bookings"] if avg_result else 10
            # Use average as threshold (affiliates with bookings >= average are "high")
            pipeline.append({"$match": {"booking_count": {"$gte": avg_bookings}}})
        
        # Sort by booking count descending to get high volume affiliates
        pipeline.append({"$sort": {"booking_count": -1}})
        
        # Execute aggregation
        high_volume_result = list(bookings_collection.aggregate(pipeline))
        high_volume_affiliate_ids = [doc.get("_id") for doc in high_volume_result if doc.get("_id")]
        
        if high_volume_affiliate_ids:
            filter_query["id"] = {"$in": high_volume_affiliate_ids}
        else:
            # No high volume affiliates found, return empty result
            filter_query["id"] = {"$in": []}

    elif view_value == "low_bookings_volume":
        filter_query["active"] = 1
        # Get affiliates with low booking volume (including those with 0 bookings)
        bookings_collection = db_rentify.rentify_bookings
        
        # Get optional parameters for defining "low" bookings
        max_bookings_threshold = form.get("max_bookings_threshold")  # Maximum bookings to be considered "low"
        
        # First, get all affiliates for this tenant
        all_affiliates = list(collection.find({
            "tenant_id": tenant_id,
            "deleted": {"$ne": 1}
        }, {"id": 1}))
        
        all_affiliate_ids = [aff.get("id", 0) for aff in all_affiliates if aff.get("id", 0) > 0]
        
        # Aggregate bookings by affiliate_id to calculate booking counts
        pipeline = [
            {
                "$match": {
                    "tenant_id": tenant_id,
                    "deleted": {"$ne": 1},
                    "booking_status_id": {"$in": [2, 3, 4]},  # Confirmed, Active, Completed
                    "vehicle_id": {"$gt": 0}
                }
            },
            {
                "$lookup": {
                    "from": "rentify_vehicles",
                    "localField": "vehicle_id",
                    "foreignField": "id",
                    "as": "vehicle"
                }
            },
            {
                "$unwind": {
                    "path": "$vehicle",
                    "preserveNullAndEmptyArrays": False
                }
            },
            {
                "$match": {
                    "vehicle.tenant_id": tenant_id,
                    "vehicle.deleted": {"$ne": 1},
                    "vehicle.affiliate_id": {"$gt": 0}  # Only affiliates (not 0)
                }
            },
            {
                "$group": {
                    "_id": "$vehicle.affiliate_id",
                    "booking_count": {"$sum": 1},
                    "total_revenue": {"$sum": {"$ifNull": ["$total_rent_amount", 0]}}
                }
            }
        ]
        
        # Execute aggregation to get booking counts per affiliate
        booking_counts_result = list(bookings_collection.aggregate(pipeline))
        affiliate_booking_map = {doc.get("_id"): doc.get("booking_count", 0) for doc in booking_counts_result}
        
        # Determine threshold
        if max_bookings_threshold:
            try:
                max_bookings_int = int(max_bookings_threshold)
                threshold = max_bookings_int
            except (ValueError, TypeError):
                warnings.append(f"Invalid 'max_bookings_threshold' value '{max_bookings_threshold}', filter skipped")
                # Calculate average as fallback
                if affiliate_booking_map:
                    avg_bookings = sum(affiliate_booking_map.values()) / len(affiliate_booking_map)
                    threshold = avg_bookings
                else:
                    threshold = 5
        else:
            # Default: use average as threshold for "low" bookings
            if affiliate_booking_map:
                avg_bookings = sum(affiliate_booking_map.values()) / len(affiliate_booking_map)
                threshold = avg_bookings
            else:
                threshold = 5
        
        # Find affiliates with low bookings (including those with 0 bookings)
        low_volume_affiliate_ids = []
        for affiliate_id in all_affiliate_ids:
            booking_count = affiliate_booking_map.get(affiliate_id, 0)  # 0 if no bookings
            if booking_count < threshold:
                low_volume_affiliate_ids.append(affiliate_id)
        
        if low_volume_affiliate_ids:
            filter_query["id"] = {"$in": low_volume_affiliate_ids}
        else:
            # No low volume affiliates found, return empty result
            filter_query["id"] = {"$in": []}
    
    elif view_value == "newly_added":
        seven_days_ago = current_time.replace(tzinfo=timezone.utc) - timedelta(days=7)
        filter_query["createdon"] = {"$gte": seven_days_ago.isoformat()}
    elif view_value == "recently_updated":
        seven_days_ago = current_time.replace(tzinfo=timezone.utc) - timedelta(days=7)
        if "$and" not in filter_query:
            filter_query["$and"] = []
        filter_query["$and"].append({
            "$or": [
                {"createdon": {"$gte": seven_days_ago.isoformat()}},
                {"updatedon": {"$gte": seven_days_ago.isoformat()}}
            ]
        })
    elif view_value == "no_bookings_in_range":
        # No bookings in last 30 days - get affiliates with no bookings
        thirty_days_ago = current_time.replace(tzinfo=timezone.utc) - timedelta(days=30)
        bookings_collection = db_rentify.rentify_bookings
        
        # Get all affiliates
        all_affiliate_ids = [aff.get("id", 0) for aff in collection.find(
            {"tenant_id": tenant_id, "deleted": {"$ne": 1}}, {"id": 1}
        ) if aff.get("id", 0) > 0]
        
        # Get affiliates that have bookings in the last 30 days
        recent_bookings = list(bookings_collection.aggregate([
            {
                "$match": {
                    "tenant_id": tenant_id,
                    "deleted": {"$ne": 1},
                    "booking_status_id": {"$in": [2, 3, 4]},
                    "createdon": {"$gte": thirty_days_ago.isoformat()},
                    "vehicle_id": {"$gt": 0}
                }
            },
            {
                "$lookup": {
                    "from": "rentify_vehicles",
                    "localField": "vehicle_id",
                    "foreignField": "id",
                    "as": "vehicle"
                }
            },
            {"$unwind": "$vehicle"},
            {
                "$match": {
                    "vehicle.tenant_id": tenant_id,
                    "vehicle.deleted": {"$ne": 1},
                    "vehicle.affiliate_id": {"$gt": 0}
                }
            },
            {
                "$group": {
                    "_id": "$vehicle.affiliate_id"
                }
            }
        ]))
        
        affiliates_with_bookings = [doc.get("_id") for doc in recent_bookings if doc.get("_id")]
        affiliates_without_bookings = [aid for aid in all_affiliate_ids if aid not in affiliates_with_bookings]
        
        if affiliates_without_bookings:
            filter_query["id"] = {"$in": affiliates_without_bookings}
        else:
            filter_query["id"] = {"$in": []}

    elif view_value == "no_of_vehicles_affiliated":
        filter_query["active"] = 1
        # Get affiliates filtered by number of vehicles affiliated (based on actual vehicle count)
        vehicles_collection = db_rentify.rentify_vehicles
        
        # Get the range value from payload (e.g., "1-10", "11-50", "51-100", "100+")
        vehicles_range = form.get("vehicles_range") or form.get("no_of_vehicles_affiliated")
        
        if vehicles_range:
            # Parse the range
            if vehicles_range == "100+":
                # 100 or more vehicles
                min_count = 100
                max_count = None
            elif "-" in vehicles_range:
                # Range like "1-10", "11-50", "51-100"
                try:
                    parts = vehicles_range.split("-")
                    if len(parts) == 2:
                        min_count = int(parts[0].strip())
                        max_count = int(parts[1].strip())
                    else:
                        warnings.append(f"Invalid 'vehicles_range' format '{vehicles_range}', expected 'min-max' or '100+'")
                        min_count = None
                        max_count = None
                except (ValueError, TypeError):
                    warnings.append(f"Invalid 'vehicles_range' value '{vehicles_range}', filter skipped")
                    min_count = None
                    max_count = None
            else:
                warnings.append(f"Invalid 'vehicles_range' format '{vehicles_range}', expected 'min-max' or '100+'")
                min_count = None
                max_count = None
            
            if min_count is not None:
                # Aggregate vehicles per affiliate and filter by range
                pipeline = [
                    {
                        "$match": {
                            "deleted": {"$ne": 1},
                            "tenant_id": tenant_id,
                            "affiliate_id": {"$gt": 0}  # Only affiliates (not 0)
                        }
                    },
                    {
                        "$group": {
                            "_id": "$affiliate_id",
                            "vehicles_count": {"$sum": 1}
                        }
                    }
                ]
                
                # Apply range filter
                vehicles_filter = {}
                if min_count is not None:
                    vehicles_filter["$gte"] = min_count
                if max_count is not None:
                    vehicles_filter["$lte"] = max_count
                
                if vehicles_filter:
                    pipeline.append({"$match": {"vehicles_count": vehicles_filter}})
                
                # Execute aggregation
                vehicles_count_result = list(vehicles_collection.aggregate(pipeline))
                affiliate_ids = [doc.get("_id") for doc in vehicles_count_result if doc.get("_id")]
                
                if affiliate_ids:
                    filter_query["id"] = {"$in": affiliate_ids}
                else:
                    # No affiliates found in this range, return empty result
                    filter_query["id"] = {"$in": []}
            else:
                # Invalid range, return empty result
                filter_query["id"] = {"$in": []}
        else:
            # No range specified, return all active affiliates (or could return empty)
            # For now, return all active affiliates
            pass
    
    
    # Handle keyword search
    keyword_value = form.get("keyword")
    if keyword_value and keyword_value != "":
        keyword_regex = {"$regex": str(keyword_value), "$options": "i"}
        if "$and" not in filter_query:
            filter_query["$and"] = []
        filter_query["$and"].append({
            "$or": [
                {"first_name": keyword_regex},
                {"last_name": keyword_regex},
                {"company_name": keyword_regex},
                {"email": keyword_regex},
                {"phone": keyword_regex}
            ]
        })

    # Handle affiliated_vehicles filter
    affiliated_vehicles_value = form.get("vehicles")
    if affiliated_vehicles_value and affiliated_vehicles_value != "":
        try:
            value_str = str(affiliated_vehicles_value).strip()
            if "-" in value_str:
                # Parse range like "10-50"
                parts = [p.strip() for p in value_str.split("-") if p.strip() != ""]
                if len(parts) == 2:
                    min_count = int(parts[0])
                    max_count = int(parts[1])
                    if min_count > max_count:
                        min_count, max_count = max_count, min_count
                    # Aggregate vehicles per affiliate and filter by range
                    vehicles_collection = db_rentify.rentify_vehicles
                    pipeline = [
                        {"$match": {"deleted": {"$ne": 1}, "tenant_id": tenant_id, "affiliate_id": {"$gt": 0}}},
                        {"$group": {"_id": "$affiliate_id", "vehicles_count": {"$sum": 1}}},
                        {"$match": {"vehicles_count": {"$gte": min_count, "$lte": max_count}}},
                        {"$project": {"_id": 0, "affiliate_id": "$_id"}}
                    ]
                    affiliate_ids = [doc.get("affiliate_id") for doc in vehicles_collection.aggregate(pipeline)]
                    # Restrict affiliates to those whose vehicle counts fall within the range
                    filter_query["id"] = {"$in": affiliate_ids}
                else:
                    warnings.append(f"Invalid 'vehicles' range '{affiliated_vehicles_value}', expected format 'min-max'")
            else:
                # Single threshold number -> affiliates with at least N vehicles
                vehicle_count = int(value_str)
                vehicles_collection = db_rentify.rentify_vehicles
                pipeline = [
                    {"$match": {"deleted": {"$ne": 1}, "tenant_id": tenant_id, "affiliate_id": {"$gt": 0}}},
                    {"$group": {"_id": "$affiliate_id", "vehicles_count": {"$sum": 1}}},
                    {"$match": {"vehicles_count": {"$gte": vehicle_count}}},
                    {"$project": {"_id": 0, "affiliate_id": "$_id"}}
                ]
                affiliate_ids = [doc.get("affiliate_id") for doc in vehicles_collection.aggregate(pipeline)]
                filter_query["id"] = {"$in": affiliate_ids}
        except (ValueError, TypeError):
            warnings.append(f"Invalid 'affiliated_vehicles' value '{affiliated_vehicles_value}', filter skipped")

    # Handle active filter
    active_value = form.get("active")
    if active_value and active_value != "":
        try:
            active_status = int(active_value)
            if active_status == 1:
                filter_query["active"] = 1
            elif active_status == 0:
                filter_query["active"] = 0
        except (ValueError, TypeError):
            warnings.append(f"Invalid 'active' value '{active_value}', filter skipped")

    # Handle status filter
    status_value = form.get("status")
    if status_value and status_value != "":
        filter_query["status"] = str(status_value)

    # Handle priority filter
    priority_value = form.get("priority")
    if priority_value and priority_value != "":
        try:
            priority = int(priority_value)
            filter_query["priority"] = priority
        except (ValueError, TypeError):
            warnings.append(f"Invalid 'priority' value '{priority_value}', filter skipped")

    # Handle commission_rate range filter
    commission_min = form.get("commission_rate_min")
    commission_max = form.get("commission_rate_max")
    if commission_min or commission_max:
        commission_filter = {}
        if commission_min and commission_min != "":
            try:
                commission_filter["$gte"] = float(commission_min)
            except (ValueError, TypeError):
                warnings.append(f"Invalid 'commission_rate_min' value '{commission_min}', filter skipped")
        if commission_max and commission_max != "":
            try:
                commission_filter["$lte"] = float(commission_max)
            except (ValueError, TypeError):
                warnings.append(f"Invalid 'commission_rate_max' value '{commission_max}', filter skipped")
        if commission_filter:
            filter_query["commission_rate"] = commission_filter

    # Handle vehicle_capacity range filter
    capacity_min = form.get("vehicle_capacity_min")
    capacity_max = form.get("vehicle_capacity_max")
    if capacity_min or capacity_max:
        capacity_filter = {}
        if capacity_min and capacity_min != "":
            try:
                capacity_filter["$gte"] = int(capacity_min)
            except (ValueError, TypeError):
                warnings.append(f"Invalid 'vehicle_capacity_min' value '{capacity_min}', filter skipped")
        if capacity_max and capacity_max != "":
            try:
                capacity_filter["$lte"] = int(capacity_max)
            except (ValueError, TypeError):
                warnings.append(f"Invalid 'vehicle_capacity_max' value '{capacity_max}', filter skipped")
        if capacity_filter:
            filter_query["vehicle_capacity"] = capacity_filter

    # Handle total_revenue range filter
    revenue_min = form.get("total_revenue_min")
    revenue_max = form.get("total_revenue_max")
    if revenue_min or revenue_max:
        revenue_filter = {}
        if revenue_min and revenue_min != "":
            try:
                revenue_filter["$gte"] = float(revenue_min)
            except (ValueError, TypeError):
                warnings.append(f"Invalid 'total_revenue_min' value '{revenue_min}', filter skipped")
        if revenue_max and revenue_max != "":
            try:
                revenue_filter["$lte"] = float(revenue_max)
            except (ValueError, TypeError):
                warnings.append(f"Invalid 'total_revenue_max' value '{revenue_max}', filter skipped")
        if revenue_filter:
            filter_query["total_revenue"] = revenue_filter

    print(filter_query)

    return filter_query, warnings


# ================================
# CRUD for affiliates - starting
# ================================
@rentify_affiliates.post("/rentify/affiliates/form_payload")
async def get_affiliate_form_payload(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        tenant_id = int(user_detail.get("tenant_id", 0))
        
        # Get countries for address dropdown
        countries = list(
            db_global.countries
            .find({"deleted": {"$ne": 1}}, {"_id": 0, "id": 1, "name": 1, "flags": 1})
            .sort("name.common", 1)
        )
        
        # Format countries for consistency
        for country in countries:
            country["title"] = country.get("name", {}).get("common", "")
            country["flag"] = country.get("flags", {}).get("svg", "")
        
        # Affiliate types
        affiliate_types = [
            {"id": 1, "title": "Individual", "title_ar": "فرد"},
            {"id": 2, "title": "Company", "title_ar": "شركة"},
            {"id": 3, "title": "Partnership", "title_ar": "شراكة"},
            {"id": 4, "title": "Franchise", "title_ar": "امتياز"}
        ]
        
        # Affiliate categories
        affiliate_categories = [
            {"id": 1, "title": "Premium", "title_ar": "مميز"},
            {"id": 2, "title": "Standard", "title_ar": "عادي"},
            {"id": 3, "title": "Basic", "title_ar": "أساسي"},
            {"id": 4, "title": "Trial", "title_ar": "تجريبي"}
        ]
        
        # Commission types
        commission_types = [
            {"id": 1, "title": "Percentage", "title_ar": "نسبة مئوية"},
            {"id": 2, "title": "Fixed Amount", "title_ar": "مبلغ ثابت"},
            {"id": 3, "title": "Tiered", "title_ar": "متدرج"},
            {"id": 4, "title": "Performance Based", "title_ar": "قائم على الأداء"}
        ]
        
        # Currencies
        currencies = [
            {"id": 1, "title": "USD", "title_ar": "دولار أمريكي"},
            {"id": 2, "title": "EUR", "title_ar": "يورو"},
            {"id": 3, "title": "GBP", "title_ar": "جنيه إسترليني"},
            {"id": 4, "title": "AED", "title_ar": "درهم إماراتي"},
            {"id": 5, "title": "SAR", "title_ar": "ريال سعودي"}
        ]
        
        # Payment methods
        payment_methods = [
            {"id": 1, "title": "Bank Transfer", "title_ar": "تحويل بنكي"},
            {"id": 2, "title": "Check", "title_ar": "شيك"},
            {"id": 3, "title": "Cash", "title_ar": "نقد"},
            {"id": 4, "title": "Digital Wallet", "title_ar": "محفظة رقمية"},
            {"id": 5, "title": "Cryptocurrency", "title_ar": "عملة رقمية"}
        ]
        
        # Document types
        document_types = [
            {"id": 1, "title": "CNIC/Passport", "title_ar": "هوية/جواز سفر"},
            {"id": 2, "title": "Driving License", "title_ar": "رخصة قيادة"},
            {"id": 3, "title": "Trade License", "title_ar": "رخصة تجارية"},
            {"id": 4, "title": "VAT Certificate", "title_ar": "شهادة ضريبة القيمة المضافة"},
            {"id": 5, "title": "Insurance Certificate", "title_ar": "شهادة تأمين"},
            {"id": 6, "title": "Bank Verification", "title_ar": "تحقق بنكي"},
            {"id": 7, "title": "Proof of Address", "title_ar": "إثبات العنوان"}
        ]
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Affiliate form payload retrieved successfully",
            "data": {
                "countries": convert_to_jsonable(countries),
                "affiliate_types": convert_to_jsonable(affiliate_types),
                "affiliate_categories": convert_to_jsonable(affiliate_categories),
                "commission_types": convert_to_jsonable(commission_types),
                "currencies": convert_to_jsonable(currencies),
                "payment_methods": convert_to_jsonable(payment_methods),
                "document_types": convert_to_jsonable(document_types)
            },
            "counts": {
                "countries": len(countries),
                "affiliate_types": len(affiliate_types),
                "affiliate_categories": len(affiliate_categories),
                "commission_types": len(commission_types),
                "currencies": len(currencies),
                "payment_methods": len(payment_methods),
                "document_types": len(document_types)
            }
        }
        
    except Exception as e:
        return get_error_details(e)

@rentify_affiliates.post("/rentify/affiliates/save")
async def save_affiliate(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    form = await request.form()
    try:
        doc_id = int(form.get("id", 0))
        next_id = doc_id or get_next_id(collection)

        # Duplicate check for email
        email_value = form.get("email", "")
        if email_value:
            query = {
                "email": email_value,
                "deleted": {"$ne": 1}
            }
            if doc_id != 0:
                query["id"] = {"$ne": doc_id}

            existing = collection.find_one(query)
            if existing:
                return {"status": status.HTTP_302_FOUND, "message": "Affiliate with this email already exists"}

        # Choose schema
        data = AffiliateCreate() if doc_id == 0 else AffiliateUpdate()
        data.id = next_id if doc_id == 0 else doc_id

        # Basic information
        data.is_company = int(form.get("is_company", 0))
        data.first_name = form.get("first_name", "")
        data.last_name = form.get("last_name", "")
        data.name = f"{data.first_name} {data.last_name}".strip()
        data.phone = form.get("phone", "")
        data.email = form.get("email", "")
        
        # Location information
        city_id_value = form.get("city_id", 0)
        try:
            data.city_id = int(city_id_value) if city_id_value else 0
        except (ValueError, TypeError):
            data.city_id = 0
            
        country_id_value = form.get("country_id", 0)
        try:
            data.country_id = int(country_id_value) if country_id_value else 0
        except (ValueError, TypeError):
            data.country_id = 0
        
        # Identity documents
        data.cnic_passport = form.get("cnic_passport", "")
        data.cnic_passport_expiry = form.get("cnic_passport_expiry", "")
        data.driving_license_no = form.get("driving_license_no", "")
        data.driving_license_expiry = form.get("driving_license_expiry", "")
        
        # Address information
        data.business_address = form.get("business_address", "")
        data.mailing_address = form.get("mailing_address", "")
        
       
        
        # Affiliate classification
        type_id_value = form.get("type_id", 0)
        try:
            data.type_id = int(type_id_value) if type_id_value else 0
        except (ValueError, TypeError):
            data.type_id = 0
            
        vehicles_affiliated_value = form.get("vehicles_affiliated", 0)
        try:
            data.vehicles_affiliated = int(vehicles_affiliated_value) if vehicles_affiliated_value else 0
        except (ValueError, TypeError):
            data.vehicles_affiliated = 0
            
        category_id_value = form.get("category_id", 0)
        try:
            data.category_id = int(category_id_value) if category_id_value else 0
        except (ValueError, TypeError):
            data.category_id = 0
            
        comission_type_id_value = form.get("comission_type_id", 0)
        try:
            data.comission_type_id = int(comission_type_id_value) if comission_type_id_value else 0
        except (ValueError, TypeError):
            data.comission_type_id = 0
            
        currency_id_value = form.get("currency_id", 0)
        try:
            data.currency_id = int(currency_id_value) if currency_id_value else 0
        except (ValueError, TypeError):
            data.currency_id = 0
        
        # Banking information
        data.bank_name = form.get("bank_name", "")
        data.ac_title = form.get("ac_title", "")
        data.ac_number = form.get("ac_number", "")
        data.swift_code = form.get("swift_code", "")
        data.payment_method_preference = form.get("payment_method_preference", "")
        data.payment_terms = form.get("payment_terms", "")
        
        # Contract information
        data.contract_start_date = form.get("contract_start_date", "")
        data.contract_end_date = form.get("contract_end_date", "")
        data.instructions = form.get("instructions", "")
        
        # Company information (if applicable)
        data.company_name = form.get("company_name", "")
        data.trade_license_no = form.get("trade_license_no", "")
        data.trade_license_expiry = form.get("trade_license_expiry", "")
        data.vat_registration_no = form.get("vat_registration_no", "")
        data.vat_registration_expiry = form.get("vat_registration_expiry", "")
        
        # Vehicle capacity and images
        vehicle_capacity_value = form.get("vehicle_capacity", 0)
        try:
            data.vehicle_capacity = int(vehicle_capacity_value) if vehicle_capacity_value else 0
        except (ValueError, TypeError):
            data.vehicle_capacity = 0
            
        # Handle affiliate image upload
        try:
            logo_image_file = form.get("logo")
            new_image_name = UploadImage.uploadImage_DO(
                logo_image_file,
                'rentify/affiliates/logo/' + str(data.id)
            )
            data.logo = config.IMAGE_DO_URL + new_image_name
        except Exception:
            data.logo = form.get("old_logo", "") or ""

        # Handle affiliate image upload
        try:
            affiliate_image_file = form.get("affiliate_image")
            new_image_name = UploadImage.uploadImage_DO(
                affiliate_image_file,
                'rentify/affiliates/images/' + str(data.id)
            )
            data.affiliate_image = config.IMAGE_DO_URL + new_image_name
        except Exception:
            data.affiliate_image = form.get("old_affiliate_image", "") or ""
    
        
        try:
            data.add_by = int(user_detail["id"])
        except (ValueError, TypeError, KeyError):
            data.add_by = 0
        
        # Handle tenant_id
        try:
            data.tenant_id = int(user_detail["tenant_id"])
        except (ValueError, TypeError, KeyError):
            data.tenant_id = 0
            
        # Handle editable
        data.editable = 1
        
        # Handle active
        active_value = form.get("active", 1)
        try:
            data.active = int(active_value) if active_value else 1
        except (ValueError, TypeError):
            data.active = 1
        
        # Handle sort_by
        sort_by_value = form.get("sort_by", 0)
        try:
            data.sort_by = int(sort_by_value) if sort_by_value else 0
        except (ValueError, TypeError):
            data.sort_by = 0

        record = data.dict()

        if doc_id == 0:
            collection.insert_one(record)
            message = "Affiliate created successfully"
            
            # Log activity for affiliate creation
            log_activity(
                activity_type="affiliate_created",
                entity_type="affiliate",
                entity_id=int(record.get("id", 0)),
                user_detail=user_detail,
                title=f"New affiliate created: {record.get('name', 'No name') or record.get('company_name', 'No name')}",
                description=f"Affiliate created: {record.get('email', 'N/A')}",
                metadata={
                    "email": record.get("email"),
                    "type_id": record.get("type_id"),
                    "category_id": record.get("category_id"),
                    "is_company": record.get("is_company")
                }
            )
        else:
            collection.update_one({"id": doc_id}, {"$set": record})
            message = "Affiliate updated successfully"
            
            # Log activity for affiliate update
            log_activity(
                activity_type="affiliate_updated",
                entity_type="affiliate",
                entity_id=int(record.get("id", 0)),
                user_detail=user_detail,
                title=f"Affiliate updated: {record.get('name', 'No name') or record.get('company_name', 'No name')}",
                description=f"Affiliate modified: {record.get('email', 'N/A')}",
                metadata={
                    "email": record.get("email"),
                    "type_id": record.get("type_id"),
                    "category_id": record.get("category_id"),
                    "is_company": record.get("is_company")
                }
            )

        # Document uploads - Handle as multi-file uploads
        # Proof of address documents
        proof_of_address_qty_raw = form.get("proof_of_address_qty") or 0
        try:
            proof_of_address_qty = int(proof_of_address_qty_raw) if proof_of_address_qty_raw else 0
        except (ValueError, TypeError):
            proof_of_address_qty = 0

        if proof_of_address_qty != 0:
            for i in range(proof_of_address_qty):
                file_obj = form.get(f"proof_of_address_{i}")
              
                new_file_name = UploadImage.uploadImage_DO(
                    file_obj,
                    'rentify/affiliates/documents/' + str(data.id)
                )

                new_data = AffiliateDocuments()
                new_data.id = get_next_id(affiliate_documents_collection)
                new_data.affiliate_id = int(data.id)
                new_data.tenant_id = int(user_detail["tenant_id"])
                new_data.createdon = datetime.now(timezone.utc).isoformat()
                new_data.active = 1
                new_data.deleted = 0
                new_data.file_type = file_obj.content_type
                new_data.file_size = file_obj.size
                new_data.url = config.IMAGE_DO_URL + new_file_name
                new_data.document_type = "proof_of_address"
                affiliate_documents_collection.insert_one(new_data.dict())
        
        # Insurance certificate documents
        insurance_certificate_qty_raw = form.get("insurance_certificate_qty") or 0
        try:
            insurance_certificate_qty = int(insurance_certificate_qty_raw) if insurance_certificate_qty_raw else 0
        except (ValueError, TypeError):
            insurance_certificate_qty = 0

        if insurance_certificate_qty != 0:
            for i in range(insurance_certificate_qty):
                file_obj = form.get(f"insurance_certificate_{i}")
              
                new_file_name = UploadImage.uploadImage_DO(
                    file_obj,
                    'rentify/affiliates/documents/' + str(data.id)
                )

                new_data = AffiliateDocuments()
                new_data.id = get_next_id(affiliate_documents_collection)
                new_data.affiliate_id = int(data.id)
                new_data.tenant_id = int(user_detail["tenant_id"])
                new_data.createdon = datetime.now(timezone.utc).isoformat()
                new_data.active = 1
                new_data.deleted = 0
                new_data.file_type = file_obj.content_type
                new_data.file_size = file_obj.size
                new_data.url = config.IMAGE_DO_URL + new_file_name
                new_data.document_type = "insurance_certificate"
                affiliate_documents_collection.insert_one(new_data.dict())
        
        # Bank account verification documents
        bank_ac_verification_doc_qty_raw = form.get("bank_ac_verification_doc_qty") or 0
        try:
            bank_ac_verification_doc_qty = int(bank_ac_verification_doc_qty_raw) if bank_ac_verification_doc_qty_raw else 0
        except (ValueError, TypeError):
            bank_ac_verification_doc_qty = 0

        if bank_ac_verification_doc_qty != 0:
            for i in range(bank_ac_verification_doc_qty):
                file_obj = form.get(f"bank_ac_verification_doc_{i}")
              
                new_file_name = UploadImage.uploadImage_DO(
                    file_obj,
                    'rentify/affiliates/documents/' + str(data.id)
                )

                new_data = AffiliateDocuments()
                new_data.id = get_next_id(affiliate_documents_collection)
                new_data.affiliate_id = int(data.id)
                new_data.tenant_id = int(user_detail["tenant_id"])
                new_data.createdon = datetime.now(timezone.utc).isoformat()
                new_data.active = 1
                new_data.deleted = 0
                new_data.file_type = file_obj.content_type
                new_data.file_size = file_obj.size
                new_data.url = config.IMAGE_DO_URL + new_file_name
                new_data.document_type = "bank_ac_verification_doc"
                affiliate_documents_collection.insert_one(new_data.dict())
        
        # Trade license documents
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
                    'rentify/affiliates/documents/' + str(data.id)
                )

                new_data = AffiliateDocuments()
                new_data.id = get_next_id(affiliate_documents_collection)
                new_data.affiliate_id = int(data.id)
                new_data.tenant_id = int(user_detail["tenant_id"])
                new_data.createdon = datetime.now(timezone.utc).isoformat()
                new_data.active = 1
                new_data.deleted = 0
                new_data.file_type = file_obj.content_type
                new_data.file_size = file_obj.size
                new_data.url = config.IMAGE_DO_URL + new_file_name
                new_data.document_type = "trade_license"
                affiliate_documents_collection.insert_one(new_data.dict())
        
        # VAT certificate documents
        vat_certificate_qty_raw = form.get("vat_certificate_qty") or 0
        try:
            vat_certificate_qty = int(vat_certificate_qty_raw) if vat_certificate_qty_raw else 0
        except (ValueError, TypeError):
            vat_certificate_qty = 0

        if vat_certificate_qty != 0:
            for i in range(vat_certificate_qty):
                file_obj = form.get(f"vat_certificate_{i}")
              
                new_file_name = UploadImage.uploadImage_DO(
                    file_obj,
                    'rentify/affiliates/documents/' + str(data.id)
                )

                new_data = AffiliateDocuments()
                new_data.id = get_next_id(affiliate_documents_collection)
                new_data.affiliate_id = int(data.id)
                new_data.tenant_id = int(user_detail["tenant_id"])
                new_data.createdon = datetime.now(timezone.utc).isoformat()
                new_data.active = 1
                new_data.deleted = 0
                new_data.file_type = file_obj.content_type
                new_data.file_size = file_obj.size
                new_data.url = config.IMAGE_DO_URL + new_file_name
                new_data.document_type = "vat_certificate"
                affiliate_documents_collection.insert_one(new_data.dict())
        
        record["editable"] = 1
        
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": convert_to_jsonable(record)
        }

    except Exception as e:
        return get_error_details(e)

@rentify_affiliates.post("/rentify/affiliates/get")
async def get_affiliates(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        # Get form data for filtering
        form = await request.form()
        
        # Resolve current tenant id (default to 0 if missing)
        tenant_id = int(user_detail.get("tenant_id", 0))

        # Build filter query using the centralized filter builder
        filter_query, warnings = build_affiliate_filters(form, tenant_id)
        
        # Extract top_performing metadata if available
        top_performing_metadata = filter_query.pop("_top_performing_metadata", {})
        
        view_value = form.get("view", "all_affiliates")

        affiliates = list(
            collection
            .find(filter_query, NO_ID_PROJECTION)
            .sort("id", -1)
        )

        if affiliates:
            affiliate_vehicle_map: dict[int, list[int]] = {}
            for affiliate in affiliates:
                affiliate_id = affiliate.get("id")
                if affiliate_id is None:
                    continue
                affiliate_vehicle_ids = [
                    vehicle_doc.get("id")
                    for vehicle_doc in vehicles_collection.find(
                        {
                            "affiliate_id": affiliate_id,
                            "deleted": {"$ne": 1},
                            "tenant_id": tenant_id
                        },
                        {"_id": 0, "id": 1}
                    )
                    if vehicle_doc.get("id") is not None
                ]
                affiliate_vehicle_map[int(affiliate_id)] = [
                    int(vehicle_id)
                    for vehicle_id in affiliate_vehicle_ids
                    if isinstance(vehicle_id, int) or str(vehicle_id).isdigit()
                ]

            for affiliate in affiliates:
                affiliate_id = affiliate.get("id")
                if affiliate_id is None:
                    continue
                
                # Add performance metrics for top_performing view
                if view_value == "top_performing" and affiliate_id in top_performing_metadata:
                    perf_data = top_performing_metadata[affiliate_id]
                    affiliate["performance_metrics"] = {
                        "booking_count": perf_data.get("booking_count", 0),
                        "total_revenue": perf_data.get("total_revenue", 0)
                    }
                # Get affiliate documents
                affiliate["old_documents"] = list(affiliate_documents_collection.find({"affiliate_id": int(affiliate.get("id"))}, NO_ID_PROJECTION))
                
                # Calculate performance metrics
                affiliate["performance_score"] = calculate_performance_score(affiliate)
                affiliate["utilization_rate"] = calculate_utilization_rate(affiliate)
                affiliate["old_proof_of_address"] = list(affiliate_documents_collection.find({"affiliate_id": int(affiliate.get("id")), "document_type": "proof_of_address"}, NO_ID_PROJECTION))
                affiliate["old_insurance_certificate"] = list(affiliate_documents_collection.find({"affiliate_id": int(affiliate.get("id")), "document_type": "insurance_certificate"}, NO_ID_PROJECTION))
                affiliate["old_bank_ac_verification_doc"] = list(affiliate_documents_collection.find({"affiliate_id": int(affiliate.get("id")), "document_type": "bank_ac_verification_doc"}, NO_ID_PROJECTION))
                affiliate["old_trade_license"] = list(affiliate_documents_collection.find({"affiliate_id": int(affiliate.get("id")), "document_type": "trade_license"}, NO_ID_PROJECTION))
                affiliate["old_vat_certificate"] = list(affiliate_documents_collection.find({"affiliate_id": int(affiliate.get("id")), "document_type": "vat_certificate"}, NO_ID_PROJECTION))
                vehicle_ids = affiliate_vehicle_map.get(int(affiliate_id), [])
                affiliate["bookings_count"] = calculate_affiliate_bookings_count(int(affiliate_id), tenant_id, vehicle_ids)
        
        # Get view statistics for the current tenant
        view_stats = get_affiliate_view_statistics(tenant_id)

        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": convert_to_jsonable(affiliates),
            "filters_applied": filter_query,
            "total_count": len(affiliates),
            "view_statistics": view_stats,
            "filters_summary": {
                "view": form.get("view", "all_affiliates"),
                "keyword": form.get("keyword"),
                "affiliated_vehicles": form.get("affiliated_vehicles"),
                "active": form.get("active"),
                "status": form.get("status"),
                "priority": form.get("priority"),
                "commission_rate_min": form.get("commission_rate_min"),
                "commission_rate_max": form.get("commission_rate_max"),
                "vehicle_capacity_min": form.get("vehicle_capacity_min"),
                "vehicle_capacity_max": form.get("vehicle_capacity_max"),
                "total_revenue_min": form.get("total_revenue_min"),
                "total_revenue_max": form.get("total_revenue_max")
            },
            "warnings": warnings if len(warnings) > 0 else []
        }
    except Exception as e:
        return get_error_details(e)

@rentify_affiliates.post("/rentify/affiliates/change-active-status")
async def change_affiliate_active_status(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token),
):
    form = await request.form()
    try:
        id = int(form.get("id", 0))
        active = int(form.get("active", 0))

        record = collection.find_one({"id": id})
        if not record:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Record not found",
                "data": {},
            }


        collection.update_one(
            {"id": id},
            {"$set": {"active": int(active)}},
        )

        return {
            "status": status.HTTP_200_OK,
            "message": "Affiliate status updated successfully",
            "data": {},
        }

    except Exception as e:
        return {
            "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "message": str(e),
            "data": {},
        }

@rentify_affiliates.get("/rentify/affiliates/documents/delete/{id}")
async def delete_affiliate_documents(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        document_id = int(id)
        # Find the single document record by its id
        doc = affiliate_documents_collection.find_one({"id": document_id}, {"_id": 0, "url": 1})
        if not doc:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Document not found",
                "data": {"id": document_id}
            }

        file_url = doc.get("url", "")
        cdn_deleted = 1 if (file_url and UploadImage.deleteImage_DO(file_url)) else 0

        result = affiliate_documents_collection.delete_one({"id": document_id})
        if result.deleted_count > 0:
            return {
                "status": status.HTTP_200_OK,
                "message": "Document deleted successfully",
                "data": {
                    "id": document_id,
                    "db_deleted_count": int(result.deleted_count),
                    "cdn_deleted_count": cdn_deleted
                }
            }
        else:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Document not found",
                "data": {"id": document_id, "db_deleted_count": 0, "cdn_deleted_count": cdn_deleted}
            }
    except Exception as e:
        return get_error_details(e)

@rentify_affiliates.get("/rentify/affiliates/{id}/deleted/{value}")
async def delete_restore_affiliate(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        collection.update_one({"id": id}, {"$set": {"deleted": value}})
        message = "Record deleted successfully" if value else "Record restored successfully"
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": None
        }
    except Exception as e:
        return get_error_details(e)

def calculate_performance_score(affiliate: dict) -> float:
    """
    Calculate performance score based on various metrics
    """
    try:
        score = 0.0
        
        # Vehicle capacity score (40% weight)
        vehicle_capacity = affiliate.get("vehicle_capacity", 0)
        if vehicle_capacity > 100:
            score += 40
        elif vehicle_capacity > 50:
            score += 30
        elif vehicle_capacity > 20:
            score += 20
        elif vehicle_capacity > 10:
            score += 15
        elif vehicle_capacity > 5:
            score += 10
        
        # Affiliated vehicles score (30% weight)
        vehicles_affiliated = affiliate.get("vehicles_affiliated", 0)
        if vehicles_affiliated > 50:
            score += 30
        elif vehicles_affiliated > 20:
            score += 25
        elif vehicles_affiliated > 10:
            score += 20
        elif vehicles_affiliated > 5:
            score += 15
        elif vehicles_affiliated > 2:
            score += 10
        
        # Category score (20% weight)
        category_id = affiliate.get("category_id", 0)
        if category_id == 1:  # Premium
            score += 20
        elif category_id == 2:  # Standard
            score += 15
        elif category_id == 3:  # Basic
            score += 10
        elif category_id == 4:  # Trial
            score += 5
        
        # Company type score (10% weight)
        is_company = affiliate.get("is_company", 0)
        if is_company == 1:  # Company
            score += 10
        else:  # Individual
            score += 5
        
        return min(score, 100.0)  # Cap at 100
    except Exception:
        return 0.0

def calculate_utilization_rate(affiliate: dict) -> float:
    """
    Calculate vehicle utilization rate
    """
    try:
        vehicle_capacity = affiliate.get("vehicle_capacity", 0)
        vehicles_affiliated = affiliate.get("vehicles_affiliated", 0)
        
        if vehicle_capacity > 0:
            return (vehicles_affiliated / vehicle_capacity) * 100
        return 0.0
    except Exception:
        return 0.0

def calculate_affiliate_bookings_count(affiliate_id: int, tenant_id: int, vehicle_ids: Optional[list[int]] = None) -> int:
    """
    Calculate total bookings count for an affiliate by counting bookings for all vehicles assigned to the affiliate.
    
    Args:
        affiliate_id: The affiliate ID
        tenant_id: The tenant ID
        vehicle_ids: Optional pre-computed list of vehicle IDs (for optimization)
    
    Returns:
        Total number of bookings for vehicles assigned to this affiliate
    """
    try:
        # Use provided vehicle_ids or fetch them
        if vehicle_ids is None:
            # Fetch all vehicles assigned to this affiliate
            affiliate_vehicles = list(vehicles_collection.find({
                "affiliate_id": affiliate_id,
                "deleted": {"$ne": 1},
                "tenant_id": tenant_id
            }, {"_id": 0, "id": 1}))
            
            # Extract vehicle IDs
            vehicle_ids = []
            for vehicle in affiliate_vehicles:
                vehicle_id = vehicle.get("id")
                if vehicle_id is None:
                    continue
                try:
                    vehicle_ids.append(int(vehicle_id))
                except (TypeError, ValueError):
                    continue
        
        # Count bookings for these vehicles
        if vehicle_ids:
            return bookings_collection.count_documents({
                "vehicle_id": {"$in": vehicle_ids},
                "deleted": {"$ne": 1},
                "tenant_id": tenant_id
            })
        return 0
    except Exception:
        return 0

def get_affiliate_activity_chart_data(affiliate_id: int, tenant_id: int, year: Optional[int] = None) -> dict:
    """
    Generate affiliate activity chart data (monthly data for bookings and vehicles).
    
    Args:
        affiliate_id: The affiliate ID
        tenant_id: The tenant ID
        year: Optional year (defaults to current year)
    
    Returns:
        Dictionary containing chart_info and data for the activity graph
    """
    try:
        bookings_collection = db_rentify.rentify_bookings
        
        # Use current year if not specified
        if year is None:
            year = datetime.now().year
        
        months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ]
        
        activity_chart_data = []
        for i, month in enumerate(months, 1):
            # Calculate date range for the month
            month_start = datetime(year, i, 1)
            if i == 12:
                month_end = datetime(year + 1, 1, 1)
            else:
                month_end = datetime(year, i + 1, 1)
            
            # Get bookings for this affiliate in this month
            # Note: Bookings don't have direct affiliate_id, they reference vehicles which have affiliate_id
            aggregation_pipeline = [
                {
                    "$match": {
                        "deleted": {"$ne": 1},
                        "tenant_id": tenant_id,
                        "createdon": {
                            "$gte": month_start.isoformat(),
                            "$lt": month_end.isoformat()
                        },
                        "vehicle_id": {"$gt": 0}
                    }
                },
                {
                    "$lookup": {
                        "from": "rentify_vehicles",
                        "localField": "vehicle_id",
                        "foreignField": "id",
                        "as": "vehicle"
                    }
                },
                {
                    "$unwind": {
                        "path": "$vehicle",
                        "preserveNullAndEmptyArrays": False
                    }
                },
                {
                    "$match": {
                        "vehicle.tenant_id": tenant_id,
                        "vehicle.deleted": {"$ne": 1},
                        "vehicle.affiliate_id": affiliate_id
                    }
                },
                {
                    "$group": {
                        "_id": None,
                        "bookings_count": {"$sum": 1},
                        "vehicle_ids": {"$addToSet": "$vehicle_id"}
                    }
                },
                {
                    "$project": {
                        "_id": 0,
                        "bookings_count": 1,
                        "unique_vehicles_count": {"$size": "$vehicle_ids"}
                    }
                }
            ]

            monthly_counts = list(bookings_collection.aggregate(aggregation_pipeline))
            if monthly_counts:
                bookings_count = int(monthly_counts[0].get("bookings_count", 0))
                unique_vehicles_count = int(monthly_counts[0].get("unique_vehicles_count", 0))
            else:
                bookings_count = 0
                unique_vehicles_count = 0
            
            activity_chart_data.append({
                "Month": month,
                "Bookings": bookings_count,
                "Cars": unique_vehicles_count
            })
        
        return {
            "chart_info": {
                "title": "Affiliate Activity Graph",
                "xKey": {"title": "Month", "key": "", "color": "#6B7280"},
                "yKeys": [
                    {"title": "Bookings", "key": "", "color": "#1E3A8A"},
                    {"title": "Cars", "key": "", "color": "#60A5FA"},
                ],
            },
            "data": activity_chart_data,
        }
    except Exception as e:
        print(f"Error generating affiliate activity chart data: {e}")
        # Return empty chart structure on error
        return {
            "chart_info": {
                "title": "Affiliate Activity Graph",
                "xKey": {"title": "Month", "key": "", "color": "#6B7280"},
                "yKeys": [
                    {"title": "Bookings", "key": "", "color": "#1E3A8A"},
                    {"title": "Cars", "key": "", "color": "#60A5FA"},
                ],
            },
            "data": [],
        }

def get_affiliate_attachments_data(affiliate_id: int, tenant_id: int) -> dict:
    """
    Get affiliate attachments organized by folder buckets
    """
    try:
        # Get all attachments for this affiliate
        attachments = list(affiliate_attachments_collection.find({
            "affiliate_id": int(affiliate_id),
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
        print(f"Error getting affiliate attachments: {e}")
        return {
            "business_documents": [],
            "vehicle_documents": [],
            "booking_documents": [],
            "miscellaneous": []
        }

def get_affiliate_view_statistics(tenant_id: int) -> dict:
    """
    Get statistics for all affiliate views for a specific tenant
    """
    try:
        current_time = datetime.now(timezone.utc)
        seven_days_ago = current_time.replace(tzinfo=timezone.utc) - timedelta(days=7)
        thirty_days_ago = current_time.replace(tzinfo=timezone.utc) - timedelta(days=30)
        
        # Base query for tenant access
        base_query = {"deleted": {"$ne": 1}, "tenant_id": tenant_id}
        
        # Get counts for each view
        stats = {
            "all_affiliates": collection.count_documents(base_query),
            "favorites_affiliates": collection.count_documents({**base_query, "category_id": 1}),  # Premium category
            "active_affiliates": collection.count_documents({**base_query, "active": 1}),
            "inactive_affiliates": collection.count_documents({**base_query, "active": 0}),
            "high_vehicle_capacity": collection.count_documents({**base_query, "vehicle_capacity": {"$gte": 50}}),
            "top_performing": collection.count_documents({**base_query, "vehicles_affiliated": {"$gte": 20}}),
            "newly_added": collection.count_documents({**base_query, "createdon": {"$gte": seven_days_ago.isoformat()}}),
            "recently_updated": collection.count_documents({
                **base_query,
                "$or": [
                    {"createdon": {"$gte": seven_days_ago.isoformat()}},
                    {"updatedon": {"$gte": seven_days_ago.isoformat()}}
                ]
            }),
            "document_expiring_soon": collection.count_documents({
                **base_query,
                "$or": [
                    {"cnic_passport_expiry": {"$lte": (current_time + timedelta(days=30)).isoformat()}},
                    {"driving_license_expiry": {"$lte": (current_time + timedelta(days=30)).isoformat()}},
                    {"trade_license_expiry": {"$lte": (current_time + timedelta(days=30)).isoformat()}},
                    {"vat_registration_expiry": {"$lte": (current_time + timedelta(days=30)).isoformat()}}
                ]
            }),
            "high_bookings_volume": collection.count_documents({**base_query, "vehicles_affiliated": {"$gte": 10}}),
            "low_bookings_volume": collection.count_documents({**base_query, "vehicles_affiliated": {"$lt": 3}}),
            "no_bookings_in_range": collection.count_documents({
                **base_query, 
                "vehicles_affiliated": 0
            })
        }
        
        return stats
        
    except Exception as e:
        print(f"Error getting affiliate view statistics: {e}")
        return {}

@rentify_affiliates.post("/rentify/affiliates/get-statistics")
async def get_affiliate_statistics(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get comprehensive affiliate statistics for dashboard
    """
    try:
        # Get form data
        form = dict(await request.form())

        # Resolve current tenant id (default to 0 if missing)
        tenant_id = int(user_detail.get("tenant_id", 0))

        # Get date range parameters (optional, mirror leads behavior)
        from_form_str = str(form.get("from", ""))
        to_form_str = str(form.get("to", ""))

        # Parse ISO strings and normalize to naive UTC (like leads.get-statistics)
        def _parse_iso_naive_utc(s: str):
            try:
                dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
                if dt.tzinfo is not None:
                    dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
                return dt
            except Exception:
                return None

        if from_form_str and to_form_str:
            from_date = _parse_iso_naive_utc(from_form_str) or datetime.utcnow()
            to_date = _parse_iso_naive_utc(to_form_str) or datetime.utcnow()
        else:
            # Default to single-day anchor at current UTC if not provided
            to_date = datetime.utcnow()
            from_date = to_date

        # If same calendar date, extend range back by 1 day
        try:
            if from_date.date() == to_date.date():
                from_date = from_date - timedelta(days=1)
        except Exception:
            pass

        # String representations for collections where dates are stored as ISO strings
        from_date_str = from_date.isoformat()
        to_date_str = to_date.isoformat()

        # Build date filter (mirror leads behavior) and include in base_query
        date_filter = {
            "$or": [
                {"$expr": {"$and": [
                    {"$gte": [{"$toDate": "$createdon"}, from_date]},
                    {"$lte": [{"$toDate": "$createdon"}, to_date]}
                ]}},
                {"createdon": {"$gte": from_date_str, "$lte": to_date_str}},
            ]
        }

        # Base query for tenant access with date filter
        base_query = {"deleted": {"$ne": 1}, "tenant_id": tenant_id, **date_filter}
        # Pre-fetch vehicle ids that belong to affiliates for this tenant
        tenant_affiliate_vehicle_ids_raw = vehicles_collection.distinct(
            "id",
            {
                "tenant_id": tenant_id,
                "deleted": {"$ne": 1},
                "affiliate_id": {"$gt": 0}
            }
        )
        tenant_affiliate_vehicle_ids: list[int] = []
        for vehicle_id in tenant_affiliate_vehicle_ids_raw:
            if vehicle_id is None:
                continue
            try:
                tenant_affiliate_vehicle_ids.append(int(vehicle_id))
            except (TypeError, ValueError):
                continue
        
        # Get total affiliates created in date range (base_query already has date filter)
        total_affiliates = collection.count_documents(base_query)
        total_active_affiliates = collection.count_documents({**base_query, "active": 1})
        
        # Calculate previous period for percentage comparison
        date_range_days = (to_date - from_date).days
        previous_start = from_date - timedelta(days=date_range_days)
        previous_end = from_date
        
        previous_start_str = previous_start.isoformat()
        previous_end_str = previous_end.isoformat()
        
        previous_period_query = {
            **base_query
        }
        
        previous_total_affiliates = collection.count_documents(previous_period_query)
        previous_active_affiliates = collection.count_documents({
            **base_query, 
            "active": 1, 
            "$or": [
                {"createdon": {"$lt": from_date_str}},
                {"createdon": {"$lt": from_date}}
            ]
        })
        
        # Calculate percentages
        def calculate_percentage_change(current: int, previous: int) -> float:
            if previous == 0:
                return 100.0 if current > 0 else 0.0
            return ((current - previous) / previous) * 100

        total_affiliates_percent = calculate_percentage_change(total_affiliates, previous_total_affiliates)
        active_affiliates_percent = calculate_percentage_change(total_active_affiliates, previous_active_affiliates)
        
        def count_affiliate_bookings(additional_match: Optional[Dict[str, Any]] = None) -> int:
            if not tenant_affiliate_vehicle_ids:
                return 0
            match_stage = {
                **base_query,
                "vehicle_id": {"$in": tenant_affiliate_vehicle_ids}
            }
            if additional_match:
                match_stage.update(additional_match)
            return bookings_collection.count_documents(match_stage)

        affiliate_bookings_total = count_affiliate_bookings()

        previous_affiliate_bookings = count_affiliate_bookings()

        affiliate_bookings_percent = calculate_percentage_change(affiliate_bookings_total, previous_affiliate_bookings)

        # Pending bookings (confirm_booking == 0)
        pending_bookings_total = count_affiliate_bookings({"booking_status_id": 1})

        previous_pending_bookings = count_affiliate_bookings({"booking_status_id": 1})

        pending_bookings_percent = calculate_percentage_change(pending_bookings_total, previous_pending_bookings)
                
        # Key metrics (calculated from actual data)
        key_metrics = [
            {
                "title": "Total Affiliations",
                "value": str(total_affiliates),
                "change": format_percent_value(total_affiliates_percent, include_sign=True)
            },
            {
                "title": "Pending Bookings",
                "value": str(pending_bookings_total),
                "change": format_percent_value(pending_bookings_percent, include_sign=True)
            },
            {
                "title": "Affiliated Bookings",
                "value": str(affiliate_bookings_total),
                "change": format_percent_value(affiliate_bookings_percent, include_sign=True)
            }
        ]
        
      
        # Helper: iterate calendar days in range (inclusive of the last day)
        def daterange_inclusive(start_dt: datetime, end_dt: datetime):
            tzinfo = start_dt.tzinfo
            current_day = start_dt.date()
            last_day = end_dt.date()
            while current_day <= last_day:
                day_start = datetime(current_day.year, current_day.month, current_day.day, tzinfo=tzinfo)
                day_end = day_start + timedelta(days=1)
                yield day_start, day_end
                current_day = current_day + timedelta(days=1)

        # Counts for descriptions
        new_affiliates_in_range = collection.count_documents({
            **base_query
        })

        deactivated_affiliates_in_range = collection.count_documents({
            **base_query,
            "active": 0
        })

        total_bookings_in_range = bookings_collection.count_documents({
            **base_query
        })

        # Revenue from affiliate bookings (sum of total_rent_amount) via join
        affiliate_bookings_docs = list(bookings_collection.aggregate([
            {"$match": {**base_query}},
            {"$lookup": {
                "from": "rentify_vehicles",
                "localField": "vehicle_id",
                "foreignField": "id",
                "as": "vehicle"
            }},
            {"$unwind": "$vehicle"},
            {"$match": {"vehicle.affiliate_id": {"$gt": 0}}},
            {"$project": {"_id": 0, "total_rent_amount": 1}}
        ]))
        affiliate_revenue = sum(float(d.get("total_rent_amount", 0) or 0) for d in affiliate_bookings_docs)

        # Derived metrics
        num_days = max(1, (to_date - from_date).days or 1)
        avg_bookings_per_active_affiliate = (
            (affiliate_bookings_total / total_active_affiliates) if total_active_affiliates > 0 else 0.0
        )
        affiliate_share_percent = (
            (affiliate_bookings_total / total_bookings_in_range) * 100 if total_bookings_in_range > 0 else 0.0
        )
        avg_affiliate_bookings_per_day = round(affiliate_bookings_total / num_days, 2)

        # Build time-series data
        affiliates_series = []
        active_affiliates_series = []
        affiliate_bookings_series = []

        # Preload active affiliates createdon dates for robust cumulative counts
        active_affiliates_docs = list(collection.find({
            **base_query,
            "active": 1
        }, {"_id": 0, "createdon": 1}))

        def safe_parse_dt(value: str) -> datetime:
            tz = from_date.tzinfo
            # Already a datetime
            if isinstance(value, datetime):
                return value if value.tzinfo is not None else value.replace(tzinfo=tz)
            # Try ISO with Z handling
            try:
                dt = datetime.fromisoformat(str(value).replace('Z', '+00:00'))
                return dt if dt.tzinfo is not None else dt.replace(tzinfo=tz)
            except Exception:
                pass
            # Fallback generic parse
            try:
                from dateutil import parser  # type: ignore
                dt = parser.parse(str(value))
                return dt if dt.tzinfo is not None else dt.replace(tzinfo=tz)
            except Exception:
                # If unable to parse, include from day one
                return datetime(1970, 1, 1, tzinfo=tz)

        active_affiliates_created_dates = [
            safe_parse_dt(doc.get("createdon", "1970-01-01T00:00:00+00:00")) for doc in active_affiliates_docs
        ]

        for day_start, day_end in daterange_inclusive(from_date, to_date):

            # Affiliates created that day via aggregation with date parsing
            day_aff_pipeline = [
                {"$match": {**base_query}},
                {"$match": {"$expr": {"$and": [
                    {"$gte": [{"$toDate": "$createdon"}, day_start]},
                    {"$lt":  [{"$toDate": "$createdon"}, day_end]}
                ]}}},
                {"$count": "count"}
            ]
            day_aff_result = list(collection.aggregate(day_aff_pipeline))
            day_affiliates = day_aff_result[0]["count"] if day_aff_result else 0
            affiliates_series.append({"value": day_affiliates})

            # Active affiliates created within the day using aggregation
            day_active_pipeline = [
                {"$match": {**base_query, "active": 1}},
                {"$match": {"$expr": {"$and": [
                    {"$gte": [{"$toDate": "$createdon"}, day_start]},
                    {"$lt":  [{"$toDate": "$createdon"}, day_end]}
                ]}}},
                {"$count": "count"}
            ]
            day_active_result = list(collection.aggregate(day_active_pipeline))
            day_active = day_active_result[0]["count"] if day_active_result else 0
            active_affiliates_series.append({"value": day_active})

            # Affiliate bookings that day using join with vehicles
            day_aff_bookings = count_affiliate_bookings({
                "$or": [
                    {"createdon": {"$gte": day_start.isoformat(), "$lt": day_end.isoformat()}},
                    {"createdon": {"$gte": day_start, "$lt": day_end}}
                ]
            })
            affiliate_bookings_series.append({"value": day_aff_bookings})

        # Build dashboard view data (now dynamic)
        dashboard_view = [
            {
                "icon":"/icons/total_affiliates_icon.svg",
                "iconClass":"",
                "title":"Total Affiliates",
                "total": total_affiliates,
                "change": format_percent_value(total_affiliates_percent),
                "description": f"New affiliates added in range: {new_affiliates_in_range} | Affiliate Revenue: AED {round(affiliate_revenue, 2)}",
                "lineChartData": affiliates_series
            },
            {
                "icon":"/icons/active_affiliates_icon.svg",
                "iconClass":"",
                "title": "Active Affiliates",
                "total": total_active_affiliates,
                "change": format_percent_value(active_affiliates_percent),
                "description": f"Affiliates deactivated in range: {deactivated_affiliates_in_range} | Average booking per active affiliate: {round(avg_bookings_per_active_affiliate, 2)}",
                "lineChartData": active_affiliates_series
            },
            {
                "icon":"/icons/total_affiliates_bookings_icon.svg",
                "iconClass":"",
                "title": "Total Affiliation Bookings",
                "total": affiliate_bookings_total,
                "change": format_percent_value(affiliate_bookings_percent),
                "description": f"% of all bookings from affiliates: {format_percent_value(affiliate_share_percent)} | Average affiliate bookings per day: {avg_affiliate_bookings_per_day}",
                "lineChartData": affiliate_bookings_series
            }
        ]

        
        # Build response data
        response_data = {
            "dashboard_view": dashboard_view,
            "key_metrics": key_metrics,
            # From all affiliates in range
            "total_bookings": affiliate_bookings_total,
            "pending_bookings": pending_bookings_total
        }
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Affiliate statistics retrieved successfully",
            "data": response_data,
            "date_range": {
                "from": from_date.isoformat(),
                "to": to_date.isoformat()
            },
            "tenant_id": tenant_id
        }
        
    except Exception as e:
        return get_error_details(e)

@rentify_affiliates.get("/rentify/affiliates/get-profile-details/{id}")
async def get_affiliate_profile_details(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get comprehensive affiliate profile details with overview, activity, and chart data
    """
    try:
        # Resolve current tenant id (default to 0 if missing)
        tenant_id = int(user_detail.get("tenant_id", 0))
        
        # Get affiliate profile data
        affiliate = collection.find_one({
            "id": id,
            "deleted": {"$ne": 1},
            "tenant_id": tenant_id
        }, NO_ID_PROJECTION)
        affiliate["proof_of_address"] = list(affiliate_documents_collection.find({"affiliate_id": int(affiliate.get("id")), "document_type": "proof_of_address"}, NO_ID_PROJECTION))
        affiliate["insurance_certificate"] = list(affiliate_documents_collection.find({"affiliate_id": int(affiliate.get("id")), "document_type": "insurance_certificate"}, NO_ID_PROJECTION))
        affiliate["bank_ac_verification_doc"] = list(affiliate_documents_collection.find({"affiliate_id": int(affiliate.get("id")), "document_type": "bank_ac_verification_doc"}, NO_ID_PROJECTION))
        affiliate["trade_license"] = list(affiliate_documents_collection.find({"affiliate_id": int(affiliate.get("id")), "document_type": "trade_license"}, NO_ID_PROJECTION))
        affiliate["vat_certificate"] = list(affiliate_documents_collection.find({"affiliate_id": int(affiliate.get("id")), "document_type": "vat_certificate"}, NO_ID_PROJECTION))
        # Fetch bookings where the linked vehicle has this affiliate_id
        bookings_collection = db_rentify.rentify_bookings
        affiliate_id_value = int(affiliate.get("id"))
        # affiliate["booking_history"] = list(bookings_collection.aggregate([
        #     {"$match": {"deleted": {"$ne": 1}, "tenant_id": tenant_id}},
        #     {"$lookup": {
        #         "from": "rentify_vehicles",
        #         "localField": "vehicle_id",
        #         "foreignField": "id",
        #         "as": "vehicle"
        #     }},
        #     {"$unwind": "$vehicle"},
        #     {"$match": {"vehicle.affiliate_id": affiliate_id_value}},
        #     {"$project": {"_id": 0}}
        # ]))
        
        

        if not affiliate:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Affiliate not found",
                "data": None
            }
        
        
        affiliate_vehicles = list(vehicles_collection.find({
            "affiliate_id": id,
            "deleted": {"$ne": 1},
            "tenant_id": tenant_id
        }, {"_id": 0, "id": 1}))
        
        affiliate_vehicle_ids: list[int] = []
        for vehicle in affiliate_vehicles:
            vehicle_id = vehicle.get("id")
            if vehicle_id is None:
                continue
            try:
                affiliate_vehicle_ids.append(int(vehicle_id))
            except (TypeError, ValueError):
                continue
        affiliate["vehicle_ids"] = affiliate_vehicle_ids
        
        # Calculate actual overview data from bookings
        affiliate_bookings: list[dict] = []
        if affiliate_vehicle_ids:
            affiliate_bookings = list(bookings_collection.find({
                "vehicle_id": {"$in": affiliate_vehicle_ids},
                "deleted": {"$ne": 1},"booking_status_id": {"$in": [5]},
                "tenant_id": tenant_id
            }, {"_id": 0, "total_rent_amount": 1, "vehicle_id": 1}))
        
        # Calculate total earnings from completed bookings
        total_earning = sum(float(booking.get("total_rent_amount", 0)) for booking in affiliate_bookings)
        
        # Count total vehicles directly assigned to this affiliate
        affiliated_vehicles = vehicles_collection.count_documents({
            "affiliate_id": id,
            "deleted": {"$ne": 1},
            "tenant_id": tenant_id
        })
        
        affiliated_date = affiliate.get("createdon", "")
        
        highlights = {
            "total_earning": total_earning,
            "affiliated_vehicles": affiliated_vehicles,
            "affiliated_date": affiliated_date
        }
        
        # Get actual activity data
        # Get notes from notes collection
        notes = list(notes_collection.find({
            "affiliate_id": id,
            "deleted": {"$ne": 1},
            "tenant_id": tenant_id
        }, NO_ID_PROJECTION))
        
        # Get attachments using the helper function
        attachments = get_affiliate_attachments_data(id, tenant_id)
        
        activity = {
            "notes": notes,
            "attachments": attachments
        }
        
        # Generate activity chart data using the separate function
        activity_chart_data = get_affiliate_activity_chart_data(id, tenant_id)
        
        # Build response data
        response_data = {
            "profile": convert_to_jsonable(affiliate),
            "highlights": highlights,
            "activity_chart_data": activity_chart_data,
        }
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Affiliate profile details retrieved successfully",
            "data": response_data,
            "tenant_id": tenant_id
        }
        
    except Exception as e:
        return get_error_details(e)

@rentify_affiliates.post("/rentify/affiliates/get-profile-details/booking-history")
async def get_affiliate_booking_history(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get affiliate booking history with filtering options
    """
    try:
        # Get incoming data (support GET query params and fallback to form)
        try:
            form = await request.form()
        except Exception:
            form = request.query_params
        
        # Resolve current tenant id (default to 0 if missing)
        tenant_id = int(user_detail.get("tenant_id", 0))
        
        # Get affiliate_id from form data
        affiliate_id = form.get("affiliate_id", 0)
        
        if not affiliate_id:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "affiliate_id is required",
                "data": None
            }
        
        # Verify affiliate exists
        query = {
            "id": int(affiliate_id),
            "deleted": {"$ne": 1},
            "tenant_id": tenant_id
        }
        affiliate = collection.find_one(query)
        
        if not affiliate:
            # Check if affiliate exists without tenant restriction for debugging
            affiliate_any_tenant = collection.find_one({"id": int(affiliate_id)})
            debug_info = {
                "searched_affiliate_id": int(affiliate_id),
                "searched_tenant_id": tenant_id,
                "query_used": query,
                "exists_in_any_tenant": affiliate_any_tenant is not None
            }
            if affiliate_any_tenant:
                debug_info["found_tenant_id"] = affiliate_any_tenant.get("tenant_id")
                debug_info["found_deleted"] = affiliate_any_tenant.get("deleted", 0)
            
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Affiliate not found",
                "data": None,
                "debug": debug_info
            }
        
        # Get filter parameters
        view = form.get("view", "all_bookings")
        booking_uid = form.get("booking_uid", "")
        pickup_time = form.get("pickup_time", "")  # supports single date or from,to
        customer_id = form.get("customer_id", "")
        vehicle_id = form.get("vehicle_id", "")
        rental_period_from = form.get("rental_period_from", "")  
        rental_period_to = form.get("rental_period_to", "")
        rent_price = form.get("rent_price", "")
        payment_status_id = form.get("payment_status_id", "")
        security_deposit = form.get("security_deposit", "")
        security_payment = form.get("security_payment", "")  # not in schema; ignored if provided
        booking_status_id = form.get("booking_status_id", "")
        
 
        # Get all vehicles for this affiliate
        # Note: Bookings don't have direct affiliate_id, they reference vehicles which have affiliate_id
        from app.networks.database import db_rentify
      
        vehicles_collection = db_rentify.rentify_vehicles
        affiliate_vehicles = list(vehicles_collection.find(
            {
                "affiliate_id": int(affiliate_id),
                "deleted": {"$ne": 1},
                "tenant_id": tenant_id
            },
            {"id": 1, "_id": 0}
        ))
        affiliate_vehicle_ids = [v["id"] for v in affiliate_vehicles]
        
        # If no vehicles found for this affiliate, return empty results
        if not affiliate_vehicle_ids:
            return {
                "status": status.HTTP_200_OK,
                "message": "No vehicles found for this affiliate",
                "data": [],
                "tenant_id": tenant_id,
                "filters_applied": {
                    "view": view,
                    "booking_uid": booking_uid,
                    "pickup_time": pickup_time,
                    "customer_id": customer_id,
                    "vehicle_id": vehicle_id,
                    "rental_period_from": rental_period_from,
                    "rental_period_to": rental_period_to,
                    "rent_price": rent_price,
                    "payment_status_id": payment_status_id,
                    "security_deposit": security_deposit,
                    "security_payment": security_payment,
                    "booking_status_id": booking_status_id,
                },
                "total_count": 0,
                "affiliate_id": int(affiliate_id)
            }
        
        # Build filter query for booking history
        filter_query = {
            "deleted": {"$ne": 1},
            "tenant_id": tenant_id,
            "vehicle_id": {"$in": affiliate_vehicle_ids}
        }
        
        # Apply filters based on form data (map to actual schema fields)
        if booking_uid and booking_uid != "":
            try:
                filter_query["booking_uid"] = {"$regex": str(booking_uid), "$options": "i"}
            except (ValueError, TypeError):
                pass  # Skip invalid booking_uid
        
        if pickup_time and pickup_time != "":
            try:
                filter_query["pickup_time"] = {"$regex": str(pickup_time), "$options": "i"}
            except (ValueError, TypeError):
                pass  # Skip invalid pickup_time

            
        
        if customer_id and customer_id != "":
            try:
                filter_query["customer_id"] = int(customer_id)
            except (ValueError, TypeError):
                pass  # Skip invalid client_id
        
        if vehicle_id and vehicle_id != "":
            try:
                filter_query["vehicle_id"] = int(vehicle_id)
            except (ValueError, TypeError):
                pass  # Skip invalid vehicle_id
        
        if rental_period_from and rental_period_to:
            try:
                from_dt = datetime.fromisoformat(str(rental_period_from).replace("Z", "+00:00"))
                to_dt = datetime.fromisoformat(str(rental_period_to).replace("Z", "+00:00"))

                pickup_start = datetime(
                    from_dt.year,
                    from_dt.month,
                    from_dt.day,
                    0,
                    0,
                    0,
                    tzinfo=from_dt.tzinfo or timezone.utc,
                ).isoformat()
                return_end = datetime(
                    to_dt.year,
                    to_dt.month,
                    to_dt.day,
                    23,
                    59,
                    59,
                    tzinfo=to_dt.tzinfo or timezone.utc,
                ).isoformat()

                date_filters = filter_query.setdefault("$and", [])
                date_filters.extend([
                    {"pickup_time": {"$gte": pickup_start}},
                    {"return_time": {"$lte": return_end}},
                ])
            except Exception:
                pass  # Skip invalid period
        
        if rent_price and rent_price != "":
            try:
                filter_query["rent_price"] = float(rent_price)
            except (ValueError, TypeError):
                pass  # Skip invalid rent_price
        
        if payment_status_id and payment_status_id != "":
            try:
                filter_query["payment_status_id"] = int(payment_status_id)
            except (ValueError, TypeError):
                pass  # Skip invalid payment_status
        
        if security_deposit and security_deposit != "":
            try:
                filter_query["security_deposit"] = float(security_deposit)
            except (ValueError, TypeError):
                pass  # Skip invalid security_deposit
        
        # security_payment not part of schema; ignored if provided
        
        if booking_status_id and booking_status_id != "":
            try:
                filter_query["booking_status_id"] = int(booking_status_id)
            except (ValueError, TypeError):
                pass  # Skip invalid booking_status

        # Query bookings collection
        bookings_collection = db_rentify.rentify_bookings
        records = list(bookings_collection.find(filter_query, NO_ID_PROJECTION))

        for record in records:
            record["vehicle_details"] = getVehicleById(int(record.get("vehicle_id", 0)))
            record["customer_details"] = getCustomerById(int(record.get("customer_id", 0)))
            record["vehicle_thumbnail"] = list(vehicle_images_collection.find({"vehicle_id": int(record.get("vehicle_id", 0)), "image_type": "thumbnail"}, NO_ID_PROJECTION))

        return {
            "status": status.HTTP_200_OK,
            "message": "Affiliate booking history retrieved successfully",
            "data": convert_to_jsonable(records),
            "tenant_id": tenant_id,
            "filters_applied": {
                "view": view,
                "booking_uid": booking_uid,
                "pickup_time": pickup_time,
                "customer_id": customer_id,
                    "vehicle_id": vehicle_id,
                    "rental_period_from": rental_period_from,
                    "rental_period_to": rental_period_to,
                "vehicle_id": vehicle_id,
                "rental_period_from": rental_period_from,
                "rental_period_to": rental_period_to,
                "rent_price": rent_price,
                "payment_status_id": payment_status_id,
                "security_deposit": security_deposit,
                "security_payment": security_payment,
                "booking_status_id": booking_status_id,
            },
            "total_count": len(records),
            "affiliate_id": int(affiliate_id)
        }
        
    except Exception as e:
        return get_error_details(e)

@rentify_affiliates.get("/rentify/affiliates/get-profile-details/{id}/booking-history/payload-data")
async def get_affiliate_booking_history_payload(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Payload for affiliate booking history filters:
    - Clients: all customers present in bookings for this affiliate
    - Vehicles: all vehicles present in bookings for this affiliate
    """
    try:
        # Resolve tenant
        tenant_id = int(user_detail.get("tenant_id", 0))




        # Get all vehicles for this affiliate
        vehicles_cursor = list(vehicles_collection.find(
            {
                "affiliate_id": int(id),
                "deleted": {"$ne": 1},
                "tenant_id": tenant_id
            },
            {"id": 1, "_id": 0, "title": 1, "brand_id": 1, "model_id": 1, "year": 1}
        ))
        vehicle_ids: list[int] = []
        for vehicle in vehicles_cursor:
            vehicle_id = vehicle.get("id")
            if vehicle_id is None:
                continue
            try:
                vehicle_ids.append(int(vehicle_id))
            except (TypeError, ValueError):
                continue

        # Find distinct customers linked to bookings of these vehicles
        customer_ids: list[int] = []
        if vehicle_ids:
            distinct_customers = bookings_collection.distinct("customer_id", {
                "vehicle_id": {"$in": vehicle_ids},
                "deleted": {"$ne": 1},
                "tenant_id": tenant_id
            })
            for customer_id in distinct_customers:
                if customer_id is None:
                    continue
                try:
                    customer_ids.append(int(customer_id))
                except (TypeError, ValueError):
                    continue

        clients: list[dict] = []
        if customer_ids:
            clients = list(customers_collection.find({
                "id": {"$in": customer_ids},
                "deleted": {"$ne": 1},
                "tenant_id": tenant_id
            }, {"_id": 0, "id": 1, "first_name": 1, "last_name": 1, "email": 1, "phone": 1}))
            for client in clients:
                client["name"] = f"{client.get('first_name', '')} {client.get('last_name', '')}".strip()


        
        return {
            "status": status.HTTP_200_OK,
            "message": "Affiliate booking history payload retrieved successfully",
            "data": {
                "clients": convert_to_jsonable(clients),
                "vehicles": convert_to_jsonable(vehicles_cursor)
            },
            "tenant_id": tenant_id,
            "affiliate_id": id,
            "counts": {
                "clients": len(clients),
                "vehicles": len(vehicles_cursor)
            },
            # "distinct_vehicle_ids":distinct_vehicle_ids,
            # "distinct_customer_ids":distinct_customer_ids
        }
    except Exception as e:
        return get_error_details(e)

@rentify_affiliates.get("/rentify/affiliates/get-profile-details/{id}/booking-history/filters")
async def get_affiliate_booking_history_filters(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get filter options for affiliate booking history
    """
    try:
        # Resolve current tenant id (default to 0 if missing)
        tenant_id = int(user_detail.get("tenant_id", 0))
        
        # Verify affiliate exists
        affiliate = collection.find_one({
            "id": id,
            "deleted": {"$ne": 1},
            "tenant_id": tenant_id
        })
        
        if not affiliate:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Affiliate not found",
                "data": None
            }
        
        # Import collections
        from app.networks.database import db_rentify
        bookings_collection = db_rentify.rentify_bookings
        customers_collection = db_rentify.rentify_customers
        vehicles_collection = db_rentify.rentify_vehicles
        
        # Get all booking IDs for this affiliate
        booking_ids = list(bookings_collection.distinct("id", {
            "deleted": {"$ne": 1},
            "tenant_id": tenant_id,
            "affiliate_id": id
        }))
        
        # Get all booking dates for this affiliate
        booking_dates = list(bookings_collection.distinct("booking_date", {
            "deleted": {"$ne": 1},
            "tenant_id": tenant_id,
            "affiliate_id": id
        }))
        
        # Get all clients for this affiliate (from bookings)
        client_ids = list(bookings_collection.distinct("customer_id", {
            "deleted": {"$ne": 1},
            "tenant_id": tenant_id,
            "affiliate_id": id
        }))
        
        clients = []
        if client_ids:
            clients = list(customers_collection.find(
                {"id": {"$in": client_ids}, "deleted": {"$ne": 1}},
                {"_id": 0, "id": 1, "first_name": 1, "last_name": 1, "email": 1, "phone": 1}
            ))
            # Format client data
            for client in clients:
                client["name"] = f"{client.get('first_name', '')} {client.get('last_name', '')}".strip()
        
        # Get all vehicles for this affiliate (from bookings)
        vehicle_ids = list(bookings_collection.distinct("vehicle_id", {
            "deleted": {"$ne": 1},
            "tenant_id": tenant_id,
            "affiliate_id": id
        }))
        
        vehicles = []
        if vehicle_ids:
            vehicles = list(vehicles_collection.find(
                {"id": {"$in": vehicle_ids}, "deleted": {"$ne": 1}},
                {"_id": 0, "id": 1, "title": 1, "brand_id": 1, "model_id": 1, "year": 1}
            ))
            # Add basic vehicle info (brand and model details would need separate queries)
            for vehicle in vehicles:
                vehicle["brand"] = ""  # Would need to query brand collection
                vehicle["model"] = ""  # Would need to query model collection
        
        # Get all rent per day values for this affiliate
        rent_per_day_values = list(bookings_collection.distinct("rent_price", {
            "deleted": {"$ne": 1},
            "tenant_id": tenant_id,
            "affiliate_id": id,
            "rent_price": {"$gt": 0}
        }))
        
        # Get all security deposit amounts for this affiliate
        security_deposit_values = list(bookings_collection.distinct("security_deposit", {
            "deleted": {"$ne": 1},
            "tenant_id": tenant_id,
            "affiliate_id": id,
            "security_deposit": {"$gt": 0}
        }))
        
        # Build response data
        filters_data = {
            "booking_id": booking_ids,
            "booking_date": booking_dates,
            "client": clients,
            "vehicle": vehicles,
            "rent_per_day": rent_per_day_values,
            "security_deposit": security_deposit_values
        }
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Affiliate booking history filters retrieved successfully",
            "data": filters_data,
            "affiliate_id": id,
            "tenant_id": tenant_id
        }
        
    except Exception as e:
        return get_error_details(e)

@rentify_affiliates.post("/rentify/affiliates/profile/add_note")
async def add_affiliate_note(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Add a note to affiliate profile
    """
    try:
        # Get form data
        form = await request.form()
        
        # Resolve current tenant id (default to 0 if missing)
        tenant_id = int(user_detail.get("tenant_id", 0))
        
        # Get parameters
        id = int(form.get("id", 0))
        affiliate_id = int(form.get("affiliate_id", 0))
        note = form.get("content", "")
        
        if not affiliate_id or not note:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "affiliate_id and note are required",
                "data": None
            }
        
        # Verify affiliate exists
        affiliate = collection.find_one({
            "id": affiliate_id,
            "deleted": {"$ne": 1},
            "tenant_id": tenant_id
        }, NO_ID_PROJECTION)
        
        if not affiliate:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Affiliate not found",
                "data": None
            }
        
        # Persist note
        notes_collection = db_rentify.rentify_affiliate_notes
        note_obj = AffiliateNoteCreate()
        note_obj.id = get_next_id(notes_collection)
        note_obj.affiliate_id = affiliate_id
        note_obj.content = note
        note_obj.tenant_id = tenant_id
        # Save the acting user's id ("login as" user)
        note_obj.created_by = int(user_detail.get("id", 0) or 0)

        notes_collection.insert_one(note_obj.dict())

        created = notes_collection.find_one({
            "id": note_obj.id,
            "tenant_id": tenant_id},
            NO_ID_PROJECTION)

        
        created["user"] = collection.find_one({"id": int(affiliate_id)},{"id":1,"company_name":1,"is_company":1,"affiliate_image":1,"logo":1,"first_name":1,"last_name":1,"_id":0})
            
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Note added successfully",
            "data": convert_to_jsonable(created),
            "tenant_id": tenant_id
        }
        
    except Exception as e:
        return get_error_details(e)

@rentify_affiliates.post("/rentify/affiliates/profile/create_folder")
async def create_affiliate_folder(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Create a folder for affiliate profile attachments
    """
    try:
        # Get form data
        form = await request.form()
        
        # Resolve current tenant id (default to 0 if missing)
        tenant_id = int(user_detail.get("tenant_id", 0))
        
        # Get parameters
        affiliate_id = int(form.get("affiliate_id", 0))
        id = form.get("id", 0)
        name = form.get("name", "")
        
        if not affiliate_id or not name:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "affiliate_id and name are required",
                "data": None
            }
        
        # Verify affiliate exists
        affiliate = collection.find_one({
            "id": affiliate_id,
            "deleted": {"$ne": 1},
            "tenant_id": tenant_id
        })
        
        if not affiliate:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Affiliate not found",
                "data": None
            }
        
        # TODO: Implement folder collection integration
        # This would create a new folder record with:
        # - affiliate_id
        # - folder name
        # - created_by (user_id)
        # - createdon timestamp
        # - tenant_id
        
        # Placeholder response
        folder_data = {
            "id": 0,  # Would be generated by get_next_id
            "affiliate_id": affiliate_id,
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

@rentify_affiliates.post("/rentify/affiliates/profile/add_attachment")
async def add_affiliate_attachment(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Add an attachment to affiliate profile
    """
    try:
        # Get form data
        form = await request.form()
        
        # Resolve current tenant id (default to 0 if missing)
        tenant_id = int(user_detail.get("tenant_id", 0))
        affiliate_id = int(form.get("affiliate_id", 0))
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
        
        if not affiliate_id:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "affiliate_id is required",
                "data": None
            }
        if not upload_file:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "file is required",
                "data": None
            }
        
        # Verify affiliate exists
        affiliate = collection.find_one({
            "id": affiliate_id,
            "deleted": {"$ne": 1},
            "tenant_id": tenant_id
        })
        
        if not affiliate:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Affiliate not found",
                "data": None
            }
        
        # Upload file to DO and persist record
        folder_segment = folder or "general"
        upload_path = UploadImage.uploadImage_DO(upload_file, f"rentify/affiliates/attachments/{affiliate_id}/{folder_segment}")
        file_url = (getattr(config, 'IMAGE_DO_URL', '') or '') + upload_path

        record = {
            "id": (record_id if record_id else get_next_id(affiliate_attachments_collection)),
            "affiliate_id": int(affiliate_id),
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

        affiliate_attachments_collection.insert_one(record)

        # Get all attachments using the helper function
        buckets = get_affiliate_attachments_data(affiliate_id, tenant_id)
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Attachment added successfully",
            "data": convert_to_jsonable(buckets),
            "tenant_id": tenant_id,
            "affiliate_id": int(affiliate_id)
        }
        
    except Exception as e:
        return get_error_details(e)

@rentify_affiliates.get("/rentify/affiliates/get-notes/{id}")
async def get_affiliate_notes(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        tenant_id = int(user_detail.get("tenant_id", 0))
        notes_collection = db_rentify.rentify_affiliate_notes
        records = list(notes_collection.find({
            "deleted": {"$ne": 1},
            "tenant_id": tenant_id,
            "affiliate_id": int(id)
        }, NO_ID_PROJECTION))

        for record in records:
            record["user"] = collection.find_one({"id": int(id)},{"id":1,"company_name":1,"is_company":1,"affiliate_image":1,"logo":1,"first_name":1,"last_name":1,"_id":0})

        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": convert_to_jsonable(records),
            "tenant_id": tenant_id,
            "affiliate_id": int(id)
        }

    except Exception as e:
        return get_error_details(e)

@rentify_affiliates.get("/rentify/affiliates/get-attachments/{id}")
async def get_affiliate_attachments(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        tenant_id = int(user_detail.get("tenant_id", 0))
        
        # Get all attachments using the helper function
        buckets = get_affiliate_attachments_data(id, tenant_id)
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Attachments retrieved successfully",
            "data": convert_to_jsonable(buckets),
            "tenant_id": tenant_id,
            "affiliate_id": int(id)
        }

    except Exception as e:
        return get_error_details(e)


# ================================
# CRUD for affiliates - ending
# ================================




@rentify_affiliates.get("/rentify/affiliates/{id}/favorite/{value}")
async def toggle_affiliate_favorite(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        if value == 1:
            favorite_collection.insert_one(
                {
                    "id": get_next_id(favorite_collection),
                    "tenant_id": user_detail["tenant_id"],
                    "favorite_type": "affiliate",
                    "favorite_id": id,
                    "user_id": int(user_detail["id"]),
                }
            )
            message = "Affiliate marked as favorite" if value else "Affiliate unmarked as favorite"
        else:
            favorite_collection.delete_one(
                {
                    "id": id,
                    "tenant_id": user_detail["tenant_id"],
                    "favorite_type": "affiliate",
                    "favorite_id": id,
                    "user_id": int(user_detail["id"]),
                }
            )
            message = "Affiliate unmarked as favorite"

        log_activity(
            activity_type="affiliate_marked_as_favorite" if value else "affiliate_unmarked_as_favorite",
            entity_type="affiliate",
            entity_id=id,
            user_detail=user_detail,
            title=f"Affiliate {'marked as favorite' if value else 'unmarked as favorite'}",
            description=f"Affiliate {'marked as favorite' if value else 'unmarked as favorite'}",
            metadata={}
        )

        return json_response(message)
    except Exception as e:
        return get_error_response(e)
