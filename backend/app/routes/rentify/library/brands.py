from fastapi import APIRouter, Request, status, Depends
from app.networks.database import db_rentify, db_global
from app.helpers.uploadimage import UploadImage
from app.utils import oauth2
from app.utils import config
from datetime import datetime, timezone, timedelta
from typing import Optional, Set

rentify_library_brands = APIRouter(tags=["Rentify Admin > Rentify > Library > Brands"])
collection = db_rentify.rentify_library_brands
tenant_brands_collection = db_rentify.rentify_library_tenant_brands
vehicles_collection = db_rentify.rentify_vehicles
activity_logs_collection = db_rentify.activity_logs

from app.helpers.general_helper import convert_to_jsonable, get_error_details, get_next_id

from app.helpers.globalfunctions import getCountryById

from app.models.rentify.library.brands import BrandCreate, BrandUpdate

# Projection to exclude MongoDB _id
NO_ID_PROJECTION = {"_id": 0}


def _count_available_units(brand_id: int, tenant_id: int) -> int:
    """
    Count the number of non-deleted vehicles for a brand assigned to the given tenant.
    """
    if brand_id <= 0:
        return 0
    return vehicles_collection.count_documents(
        {
            "brand_id": brand_id,
            "deleted": {"$ne": 1},
            "tenant_id": tenant_id,
        }
    )



# ================================
# CRUD for Brands - starting
# ================================
@rentify_library_brands.post("/rentify/library/brands/save")
async def save_brand(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    form = await request.form()
    try:
        doc_id = int(form.get("id", 0))
        next_id = doc_id or get_next_id(collection)

        # Duplicate check for title
        title_value = form.get("title", "")
        query = {
            "title": title_value,
            "deleted": {"$ne": 1}
        }
        if doc_id != 0:
            query["id"] = {"$ne": doc_id}

        existing = collection.find_one(query)
        if existing:
            return {"status": status.HTTP_302_FOUND, "message": "Record with this title already exists"}

        # Duplicate check for title_ar
        title_ar_value = form.get("title_ar", "")
        if title_ar_value and title_ar_value.strip():  # Only check if title_ar is provided and not empty
            query_ar = {
                "title_ar": title_ar_value,
                "deleted": {"$ne": 1}
            }
            if doc_id != 0:
                query_ar["id"] = {"$ne": doc_id}

            existing_ar = collection.find_one(query_ar)
            if existing_ar:
                return {"status": status.HTTP_302_FOUND, "message": "Record with this Arabic title already exists"}

        # Choose schema
        data = BrandCreate() if doc_id == 0 else BrandUpdate()
        data.id = next_id if doc_id == 0 else doc_id
        
        # Common fields
        data.title = form.get("title", "")
        data.slug = form.get("slug", "")
        data.title_ar = form.get("title_ar", "")
        data.origin_country_id = int(form.get("origin_country_id", 0))
        data.origin_country = form.get("origin_country")
        data.add_by = int(user_detail["id"])
        data.tenant_id = int(user_detail["tenant_id"])
        # data.is_global = 0
        # data.editable = 1
        data.active = int(form.get("active", 1))
        data.sort_by = int(form.get("sort_by", 0))
        try:
            data.units = int(form.get("units", 0))
        except (ValueError, TypeError):
            data.units = 0

        # Logo handling
        logo_file = form.get("logo")
        if logo_file:
            new_file_name = UploadImage.uploadImage_DO(logo_file, "rentify/library/brands")
            data.logo = config.IMAGE_DO_URL + new_file_name
        else:
            data.logo = form.get("old_logo", "")

        record = data.dict()

        if doc_id == 0:
            collection.insert_one(record)
            message = "Record created successfully"

            # Log activity for brand creation
            try:
                activity_logs_collection.insert_one({
                    "id": get_next_id(activity_logs_collection),
                    "activity_type": "brand_created",
                    "entity_type": "brand",
                    "entity_id": int(record.get("id", 0)),
                    "tenant_id": int(user_detail.get("tenant_id", 0)),
                    "user_id": int(user_detail.get("id", 0)),
                    "title": f"New brand created: {record.get('title', 'Untitled')}",
                    "description": f"Brand '{record.get('title', 'N/A')}' was created",
                    "createdon": datetime.now(timezone.utc).isoformat(),
                    "metadata": {
                        "brand_id": record.get("id"),
                        "title": record.get("title"),
                        "origin_country_id": record.get("origin_country_id"),
                        "active": record.get("active", 1)
                    },
                    "deleted": 0,
                    "active": 1
                })
            except Exception:
                pass  # Do not block save if logging fails
        else:
            collection.update_one({"id": doc_id}, {"$set": record})
            message = "Record updated successfully"

            # Log activity for brand update
            try:
                activity_logs_collection.insert_one({
                    "id": get_next_id(activity_logs_collection),
                    "activity_type": "brand_updated",
                    "entity_type": "brand",
                    "entity_id": int(record.get("id", 0)),
                    "tenant_id": int(user_detail.get("tenant_id", 0)),
                    "user_id": int(user_detail.get("id", 0)),
                    "title": f"Brand updated: {record.get('title', 'Untitled')}",
                    "description": f"Brand '{record.get('title', 'N/A')}' was modified",
                    "createdon": datetime.now(timezone.utc).isoformat(),
                    "metadata": {
                        "brand_id": record.get("id"),
                        "title": record.get("title"),
                        "origin_country_id": record.get("origin_country_id"),
                        "active": record.get("active", 1)
                    },
                    "deleted": 0,
                    "active": 1
                })
            except Exception:
                pass  # Do not block save if logging fails

        # Add origin_country info
        record["origin_country"] = getCountryById(int(record.get("origin_country_id")))

        # --- Tenant-brand mapping ---
        tenant_id = int(user_detail["tenant_id"])
        existing_tenant_brand = tenant_brands_collection.find_one({
            "tenant_id": tenant_id,
            "brand_id": record["id"]
        })
        
        if doc_id == 0:
            record["is_used"]=1
            record["is_global"]=0
            record["editable"]=1            
            if not existing_tenant_brand:
                tenant_brand_data = {
                    "id": get_next_id(tenant_brands_collection),
                    "tenant_id": tenant_id,
                    "brand_id": record["id"],
                    "createdon": datetime.now(timezone.utc).isoformat(),
                    "active": 1,
                    "deleted": 0
                }
                tenant_brands_collection.insert_one(tenant_brand_data)

        record_for_tenant = tenant_brands_collection.find_one({"tenant_id": tenant_id, "brand_id":int(record["id"])}, {"_id": 0, "brand_id": 1})
        if record_for_tenant:
            record["is_used"] = 1
        else:
            record["is_used"] = 0
            
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": convert_to_jsonable(record)
        }

    except Exception as e:
        return get_error_details(e)


@rentify_library_brands.post("/rentify/library/brands/get")
async def get_brands(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        # Get form data for filtering
        form = await request.form()
        
        # Resolve current tenant id (default to 0 if missing)
        tenant_id = int(user_detail.get("tenant_id", 0))

        # Build filter query based on form data
        # All filters are applied conditionally and safely handle invalid/empty values
        filter_query = {"deleted": {"$ne": 1}, "$or": [{"is_global": 1}, {"tenant_id": tenant_id}]}  # Always exclude deleted records and match global or tenant-specific
        warnings = []
        
        # Apply filters only if they are provided in the payload and not empty
       
        active_value = form.get("active")
        if active_value and active_value != "":
            filter_query["active"] = int(active_value)
       
        
        brand_id_value = form.get("brand_id")
        if brand_id_value and brand_id_value != "":
            try:
                filter_query["id"] = int(brand_id_value)
                print(f"Applied brand_id filter: {brand_id_value}")
            except (ValueError, TypeError):
                # Skip invalid brand_id value
                print(f"Warning: Invalid brand_id value '{brand_id_value}', skipping filter")
                warnings.append(f"Invalid 'brand_id' value '{brand_id_value}', filter skipped")
        
        origin_country_id_value = form.get("origin_country_id")
        if origin_country_id_value and origin_country_id_value != "":
            try:
                filter_query["origin_country_id"] = int(origin_country_id_value)
                print(f"Applied origin_country_id filter: {origin_country_id_value}")
            except (ValueError, TypeError):
                # Skip invalid origin_country_id value
                print(f"Warning: Invalid origin_country_id value '{origin_country_id_value}', skipping filter")
                warnings.append(f"Invalid 'origin_country_id' value '{origin_country_id_value}', filter skipped")
        
        # Handle units filter (vehicles count per brand)
        vehicles_units_raw = form.get("vehicles_units") or form.get("units")
        vehicles_units_value: Optional[int] = None
        if vehicles_units_raw not in (None, ""):
            try:
                vehicles_units_value = int(vehicles_units_raw)
                print(f"Applied vehicles_units filter: {vehicles_units_value}")
            except (ValueError, TypeError):
                print(f"Warning: Invalid vehicles_units value '{vehicles_units_raw}', skipping filter")
                warnings.append(f"Invalid 'vehicles_units' value '{vehicles_units_raw}', filter skipped")

        if vehicles_units_value is not None and vehicles_units_value >= 0:
            pipeline = [
                {
                    "$match": {
                        "tenant_id": tenant_id,
                        "deleted": {"$ne": 1},
                        "brand_id": {"$ne": None},
                    }
                },
                {
                    "$group": {
                        "_id": "$brand_id",
                        "vehicles_count": {"$sum": 1},
                    }
                },
                {
                    "$match": {
                        "vehicles_count": vehicles_units_value
                    }
                }
            ]

            matching_ids: Set[int] = set()
            for doc in vehicles_collection.aggregate(pipeline):
                brand_id_raw = doc.get("_id")
                if brand_id_raw in (None, 0):
                    continue
                try:
                    matching_ids.add(int(brand_id_raw))
                except (TypeError, ValueError):
                    continue

            existing_id_filter = filter_query.get("id")
            if existing_id_filter is not None and matching_ids:
                existing_ids: Set[int] = set()
                if isinstance(existing_id_filter, dict) and "$in" in existing_id_filter:
                    try:
                        existing_ids = {int(val) for val in existing_id_filter["$in"]}
                    except (TypeError, ValueError):
                        existing_ids = set()
                else:
                    try:
                        existing_ids = {int(existing_id_filter)}
                    except (TypeError, ValueError):
                        existing_ids = set()
                matching_ids &= existing_ids

            filter_query["id"] = {"$in": list(matching_ids)} if matching_ids else {"$in": [-1]}
        
        # Handle last_activity filter based on createdon/updatedon fields
        last_activity_duration = None
        if form.get("last_activity") in ["last_24_hours", "last_7_days", "last_30_days"]:
            last_activity_duration = form.get("last_activity")

        if last_activity_duration:
        
            try:
                tenant_id = user_detail.get("tenant_id")
                
                # Calculate the start time based on the duration
                if last_activity_duration == "last_24_hours":
                    start_time = datetime.utcnow() - timedelta(hours=24)
                elif last_activity_duration == "last_7_days":
                    start_time = datetime.utcnow() - timedelta(days=7)
                elif last_activity_duration == "last_30_days":
                    start_time = datetime.utcnow() - timedelta(days=30)
                
                start_time_iso = start_time.isoformat()
                
                # Query activity_logs to get brand IDs with activity in the specified time range
                activity_logs = list(activity_logs_collection.find({
                    "entity_type": "brand",
                    "tenant_id": tenant_id,
                    "deleted": {"$ne": 1},
                    "createdon": {"$gte": start_time_iso}
                }, {"entity_id": 1}))
                
                # Collect unique brand IDs from activity_logs
                brand_ids: Set[int] = set()
                for activity in activity_logs:
                    entity_id = activity.get("entity_id")
                    if entity_id is None:
                        continue
                    try:
                        brand_ids.add(int(entity_id))
                    except (TypeError, ValueError):
                        continue
                
                # Merge with existing filter_query["id"] if it exists (AND logic)
                existing_id_filter = filter_query.get("id")
                if existing_id_filter is not None:
                    existing_ids: Set[int] = set()
                    if isinstance(existing_id_filter, dict) and "$in" in existing_id_filter:
                        try:
                            existing_ids = {int(val) for val in existing_id_filter["$in"]}
                        except (TypeError, ValueError):
                            existing_ids = set()
                    else:
                        try:
                            existing_ids = {int(existing_id_filter)}
                        except (TypeError, ValueError):
                            existing_ids = set()
                    brand_ids &= existing_ids
                
                # Filter brands by IDs with activity in the specified time range
                if brand_ids:
                    filter_query["id"] = {"$in": list(brand_ids)}
                else:
                    # No activity found in the time range, return empty result
                    filter_query["id"] = {"$in": [-1]}
                    
            except Exception as e:
                # If parsing fails, ignore the last_activity filter
                print(f"Error parsing last_activity: {e}")    
        
        # Get filtered brands from the library
        brands = list(
            collection
            .find(filter_query, NO_ID_PROJECTION)
            .sort("id", -1)
        )
        
        # Log the filter query for debugging (you can remove this in production)
        print(f"Applied filters: {filter_query}")
        print(f"Found {len(brands)} brands matching the criteria")
        
        # Log which filters were provided and processed
        print(f"Form data received: {dict(form)}")
        print(f"Filters processed successfully")
        
        # Get all brand IDs that are used in tenant_brands
        used_brand_ids = set()
        if tenant_brands_collection:
            used_brands = tenant_brands_collection.find({"tenant_id": tenant_id}, {"_id": 0, "brand_id": 1})
            used_brand_ids = {int(tb.get("brand_id")) for tb in used_brands if tb.get("brand_id") is not None}
        
        # Add is_used field and count vehicles for each brand
        filtered_brands = []
        for brand in brands:
            brand_id_value = int(brand.get("id", 0))
            brand["is_used"] = 1 if brand_id_value in used_brand_ids else 0
            brand["origin_country"] = getCountryById(int(brand.get("origin_country_id"))) 
            # Count actual vehicles for this brand
            available_units = _count_available_units(brand_id_value, tenant_id)
            brand["available_units"] = available_units

            if vehicles_units_value is not None and available_units != vehicles_units_value:
                continue

            filtered_brands.append(brand)

        brands = filtered_brands
             
        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": convert_to_jsonable(brands),
            "filters_applied": filter_query,
            "total_count": len(brands),
            "filters_summary": {
                "active": form.get("active"),
                "brand_id": form.get("brand_id"),
                "last_activity": form.get("last_activity"),
                "origin_country_id": form.get("origin_country_id"),
                "vehicles_units": form.get("vehicles_units") or form.get("units")
            },
            "warnings": warnings if len(warnings) > 0 else []
        }
    except Exception as e:
        return get_error_details(e)

@rentify_library_brands.post("/rentify/library/brands/select-for-tenant")
async def save_tenant_brand(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    form = await request.form()
    try:        
        tenant_id = int(user_detail["tenant_id"])
        brand_id = int(form.get("brand_id", 0))
        
        if not tenant_id or not brand_id:
            return {"status": status.HTTP_400_BAD_REQUEST, "message": "tenant_id and brand_id are required"}
        
        # Check if brand exists in library
        brand_exists = collection.find_one({"id": brand_id, "deleted": {"$ne": 1}})
        if not brand_exists:
            return {"status": status.HTTP_404_NOT_FOUND, "message": "Brand not found in library"}
        
        # Check if already exists
        existing = tenant_brands_collection.find_one({
            "tenant_id": tenant_id,
            "brand_id": brand_id
        })
        
        if existing:
            return {"status": status.HTTP_302_FOUND, "message": "Brand already assigned to this tenant"}
        
        # Create new tenant brand record
        tenant_brand_data = {
            "id": get_next_id(tenant_brands_collection),
            "tenant_id": tenant_id,
            "brand_id": brand_id,
            "createdon": datetime.now(timezone.utc).isoformat(),
            "active": 1,
            "deleted": 0
        }
        
        tenant_brands_collection.insert_one(tenant_brand_data)
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Brand assigned to tenant successfully",
            "data": convert_to_jsonable(tenant_brand_data)
        }
    except Exception as e:
        return get_error_details(e)


@rentify_library_brands.post("/rentify/library/brands/unselect-for-tenant")
async def delete_tenant_brand(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    form = await request.form()
    try:
        tenant_id = int(user_detail["tenant_id"])
        brand_id = int(form.get("brand_id", 0))
        
        if not tenant_id or not brand_id:
            return {"status": status.HTTP_400_BAD_REQUEST, "message": "tenant_id and brand_id are required"}
        
        result = tenant_brands_collection.delete_one({
            "tenant_id": tenant_id,
            "brand_id": brand_id
        })
        
        if result.deleted_count > 0:
            return {
                "status": status.HTTP_200_OK,
                "message": "Brand removed from tenant successfully",
                "data": None
            }
        else:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Tenant brand relationship not found",
                "data": None
            }
    except Exception as e:
        return get_error_details(e)


@rentify_library_brands.get("/rentify/library/brands/{id}/deleted/{value}")
async def delete_restore_brand(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
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


# fetch all brands for dropdown - selected by tenant_id
@rentify_library_brands.get("/rentify/library/brands/dropdown")
async def get_brands_dropdown(user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        tenant_id = int(user_detail["tenant_id"])
        brands = list(tenant_brands_collection.find({"tenant_id": tenant_id}, {"_id": 0, "brand_id": 1}))
        for brand in brands:
            brand["title"] = collection.find_one({"id": brand["brand_id"]}, {"_id": 0, "title": 1})["title"]  

        return {"status": status.HTTP_200_OK, "message": "Records retrieved successfully", "data": convert_to_jsonable(brands)}
    except Exception as e:
        return get_error_details(e)



# ================================
# CRUD for Brands - ending
# ================================
