from fastapi import APIRouter, Request, status, Depends
from app.networks.database import db_rentify, db_global
from app.helpers.uploadimage import UploadImage
from app.utils import oauth2
from app.utils import config
from datetime import datetime, timezone, timedelta
from typing import Optional, Set

rentify_library_models = APIRouter(tags=["Rentify Admin > Rentify > Library > models"])
collection = db_rentify.rentify_library_models
tenant_models_collection = db_rentify.rentify_library_tenant_models
activity_logs_collection = db_rentify.activity_logs

from app.helpers.general_helper import convert_to_jsonable, get_error_details, get_next_id

from app.helpers.globalfunctions import getBrandById, getBrandsByOriginCountryId, getCountryById

from app.models.rentify.library.models import ModelCreate, ModelUpdate

# Projection to exclude MongoDB _id
NO_ID_PROJECTION = {"_id": 0}


def get_last_activity_details(model: dict, user_detail: dict) -> str:
    """
    Get the last activity date for a model from activity_logs_collection.
    
    Args:
        model: Model document
        user_detail: User details containing tenant_id
        
    Returns:
        Date string from the latest activity timestamp, or empty string if no activity found
    """
    try:
        model_id = model.get("id")
        tenant_id = user_detail.get("tenant_id")
        
        if not model_id:
            return ""
        
        # Get activity logs collection
        activity_logs_collection = db_rentify.activity_logs
        
        # Query for the last activity log for this model
        last_activity = activity_logs_collection.find_one(
            {
                "entity_type": "model",
                "entity_id": int(model_id),
                "tenant_id": int(tenant_id),
                "deleted": {"$ne": 1}
            },
            NO_ID_PROJECTION,
            sort=[("timestamp", -1)]  # Sort by timestamp descending to get latest
        )
        
        if last_activity and last_activity.get("timestamp"):
            timestamp = last_activity.get("timestamp")
            # Parse timestamp and extract date
            try:
                # Handle ISO format timestamp
                dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                return dt.strftime("%Y-%m-%d")  # Return date in YYYY-MM-DD format
            except Exception:
                # If parsing fails, return the timestamp as is
                return str(timestamp)
        
        return ""
    except Exception as e:
        print(f"Error getting last activity for model {model.get('id')}: {e}")
        return ""


# ================================
# CRUD for models - starting
# ================================
@rentify_library_models.post("/rentify/library/models/save")
async def save_model(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
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
        data = ModelCreate() if doc_id == 0 else ModelUpdate()
        data.id = next_id if doc_id == 0 else doc_id

        # Common fields
        data.title = form.get("title", "")
        data.slug = form.get("slug", "")
        data.title_ar = form.get("title_ar", "")
        
        data.brand_id = int(form.get("brand_id", 0))

        data.add_by = int(user_detail["id"])
        data.tenant_id = int(user_detail["tenant_id"])
        data.is_global = 0
        data.editable = 1
        data.active = int(form.get("active", 1))
        data.sort_by = int(form.get("sort_by", 0))

        # Logo handling
        logo_file = form.get("logo")
        if logo_file:
            new_file_name = UploadImage.uploadImage_DO(logo_file, "rentify/library/models")
            data.logo = config.IMAGE_DO_URL + new_file_name
        else:
            data.logo = form.get("old_logo", "")

        record = data.dict()

        if doc_id == 0:
            collection.insert_one(record)
            message = "Record created successfully"
            
            # Log activity for model creation
            try:
                activity_logs_collection = db_rentify.activity_logs
                activity_logs_collection.insert_one({
                    "id": get_next_id(activity_logs_collection),
                    "activity_type": "model_created",
                    "entity_type": "model",
                    "entity_id": int(record.get("id", 0)),
                    "tenant_id": int(user_detail.get("tenant_id", 0)),
                    "user_id": int(user_detail.get("id", 0)),
                    "title": f"New model created: {record.get('title', 'Untitled')}",
                    "description": f"Model '{record.get('title', 'N/A')}' was created for brand ID {record.get('brand_id', 0)}",
                    "createdon": datetime.now(timezone.utc).isoformat(),
                    "metadata": {
                        "model_id": record.get("id"),
                        "title": record.get("title"),
                        "brand_id": record.get("brand_id"),
                        "active": record.get("active", 1)
                    },
                    "deleted": 0,
                    "active": 1
                })
            except Exception:
                pass  # Don't fail the save if logging fails
        else:
            collection.update_one({"id": doc_id}, {"$set": record})
            message = "Record updated successfully"
            
            # Log activity for model update
            try:
                activity_logs_collection = db_rentify.activity_logs
                activity_logs_collection.insert_one({
                    "id": get_next_id(activity_logs_collection),
                    "activity_type": "model_updated",
                    "entity_type": "model",
                    "entity_id": int(record.get("id", 0)),
                    "tenant_id": int(user_detail.get("tenant_id", 0)),
                    "user_id": int(user_detail.get("id", 0)),
                    "title": f"Model updated: {record.get('title', 'Untitled')}",
                    "description": f"Model '{record.get('title', 'N/A')}' was modified",
                    "createdon": datetime.now(timezone.utc).isoformat(),
                    "metadata": {
                        "model_id": record.get("id"),
                        "title": record.get("title"),
                        "brand_id": record.get("brand_id"),
                        "active": record.get("active", 1)
                    },
                    "deleted": 0,
                    "active": 1
                })
            except Exception:
                pass  # Don't fail the save if logging fails

        # Add other info               
        record["origin_country"] = getCountryById(int(record.get("brand_id")))
        record["brand_details"] = getBrandById(int(record.get("brand_id")))  

        # --- Tenant-model mapping ---
        tenant_id = int(user_detail["tenant_id"])
        if doc_id == 0:
            existing_tenant_model = tenant_models_collection.find_one({
                "tenant_id": tenant_id,
                "model_id": record["id"]
            })
            if not existing_tenant_model:
                tenant_model_data = {
                    "id": get_next_id(tenant_models_collection),
                    "tenant_id": tenant_id,
                    "model_id": record["id"],
                    "createdon": datetime.now(timezone.utc).isoformat(),
                    "active": 1,
                    "deleted": 0
                }
                tenant_models_collection.insert_one(tenant_model_data)
                record["is_used"]=1
                record["is_global"]=0
                record["editable"]=1     


        record_for_tenant = tenant_models_collection.find_one({"tenant_id": tenant_id, "model_id":int(record["id"])}, {"_id": 0, "model_id": 1})
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

@rentify_library_models.post("/rentify/library/models/get")
async def get_models(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        # Get form data for filtering
        form = await request.form()
        
        # Resolve current tenant id (default to 0 if missing)
        tenant_id = int(user_detail.get("tenant_id", 0))

        # Build filter query based on form data
        # All filters are applied conditionally and safely handle invalid/empty values
        filter_query = {"deleted": {"$ne": 1}, "$or": [{"is_global": 1}, {"tenant_id": tenant_id}]}  # Always exclude deleted records and match global or tenant-specific
        warnings = []

        # Handle brand_id and origin_country_id filters with proper precedence
        brand_id_value = form.get("brand_id")
        origin_country_id_value = form.get("origin_country_id")
        
        # If both filters are provided, origin_country_id takes precedence
        # If only brand_id is provided, use it directly
        # If only origin_country_id is provided, use it to filter brands
        if origin_country_id_value and origin_country_id_value != "" and origin_country_id_value.lower() != "null":
            try:
                origin_country_id = int(origin_country_id_value)
                # Get all brand IDs that match this origin_country_id
                matching_brand_ids = getBrandsByOriginCountryId(origin_country_id)
                if matching_brand_ids:
                    # If brand_id is also provided, intersect the results
                    if brand_id_value and brand_id_value != "" and brand_id_value.lower() != "null":
                        try:
                            requested_brand_id = int(brand_id_value)
                            if requested_brand_id in matching_brand_ids:
                                filter_query["brand_id"] = requested_brand_id
                                print(f"Applied combined filter: origin_country_id={origin_country_id} + brand_id={requested_brand_id} (match found)")
                            else:
                                # Brand exists but doesn't match origin_country_id, return empty result
                                filter_query["brand_id"] = {"$in": []}
                                print(f"Applied combined filter: origin_country_id={origin_country_id} + brand_id={requested_brand_id} (no match - brand not from this country)")
                        except (ValueError, TypeError):
                            print(f"Warning: Invalid brand_id value '{brand_id_value}', using only origin_country_id filter")
                            filter_query["brand_id"] = {"$in": matching_brand_ids}
                    else:
                        # Only origin_country_id provided
                        filter_query["brand_id"] = {"$in": matching_brand_ids}
                        print(f"Applied origin_country_id filter: {origin_country_id} (affects {len(matching_brand_ids)} brands)")
                else:
                    # No brands found for this origin_country_id, return empty result
                    filter_query["brand_id"] = {"$in": []}
                    print(f"Applied origin_country_id filter: {origin_country_id} (no matching brands found)")
            except (ValueError, TypeError):
                print(f"Warning: Invalid origin_country_id value '{origin_country_id_value}', skipping filter")
                warnings.append(f"Invalid 'origin_country_id' value '{origin_country_id_value}', filter skipped")
        elif brand_id_value and brand_id_value != "" and brand_id_value.lower() != "null":
            # Only brand_id provided
            try:
                filter_query["brand_id"] = int(brand_id_value)
                print(f"Applied brand_id filter: {brand_id_value}")
            except (ValueError, TypeError):
                # Skip invalid brand_id value
                print(f"Warning: Invalid brand_id value '{brand_id_value}', skipping filter")
                warnings.append(f"Invalid 'brand_id' value '{brand_id_value}', filter skipped")
        
        model_id_value = form.get("model_id")
        if model_id_value and model_id_value != "" and model_id_value.lower() != "null":
            try:
                filter_query["id"] = int(model_id_value)
                print(f"Applied model_id filter: {model_id_value}")
            except (ValueError, TypeError):
                # Skip invalid model_id value
                print(f"Warning: Invalid model_id value '{model_id_value}', skipping filter")
                warnings.append(f"Invalid 'model_id' value '{model_id_value}', filter skipped")
        
        # Handle active filter
        active_value = form.get("active")
        if active_value and active_value != "" and active_value.lower() != "null":
            try:
                active_filter = int(active_value)
                filter_query["active"] = active_filter
                print(f"Applied active filter: {active_filter}")
            except (ValueError, TypeError):
                print(f"Warning: Invalid active value '{active_value}', skipping filter")
                warnings.append(f"Invalid 'active' value '{active_value}', filter skipped")
        
        # Handle last_activity filter using activity logs
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
                    "entity_type": "model",
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
        
        # Handle units filter
        units_value = form.get("units")
        if units_value and units_value != "" and units_value.lower() != "null":
            try:
                units_filter = int(units_value)
                filter_query["units"] = units_filter
                print(f"Applied units filter: {units_filter}")
            except (ValueError, TypeError):
                print(f"Warning: Invalid units value '{units_value}', skipping filter")
                warnings.append(f"Invalid 'units' value '{units_value}', filter skipped")
        
        # Debug: Print final filter query
        print(f"Final filter query: {filter_query}")
        
        models = list(
            collection
            .find(filter_query, NO_ID_PROJECTION)
            .sort("id", -1)
        )

        # Get all model IDs that are used in tenant_models
        used_model_ids = set()
        if tenant_models_collection:
            used_models = tenant_models_collection.find({"tenant_id": tenant_id}, {"_id": 0, "model_id": 1})
            used_model_ids = {int(tb.get("model_id")) for tb in used_models if tb.get("model_id") is not None}
        
        # Add is_used field and last activity date to each model
        for model in models:
            model_id_value = int(model.get("id", 0))
            model["is_used"] = 1 if model_id_value in used_model_ids else 0
            model["brand_details"] = getBrandById(int(model.get("brand_id")))
            model["last_activity_date"] = get_last_activity_details(model, user_detail)  
                 
        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": convert_to_jsonable(models),
            "filters_applied": filter_query,
            "total_count": len(models),
            "filters_summary": {
                "active": form.get("active"),
                "model_id": form.get("model_id"),
                "last_activity": form.get("last_activity"),
                "brand_id": form.get("brand_id"),
                "origin_country_id": form.get("origin_country_id"),
                "units": form.get("units")
            },
            "warnings": warnings if len(warnings) > 0 else []
        }
    except Exception as e:
        return get_error_details(e)


@rentify_library_models.post("/rentify/library/models/select-for-tenant")
async def save_tenant_model(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    form = await request.form()
    try:        
        tenant_id = int(user_detail["tenant_id"])
        model_id = int(form.get("model_id", 0))
        
        if not tenant_id or not model_id:
            return {"status": status.HTTP_400_BAD_REQUEST, "message": "tenant_id and model_id are required"}
        
        # Check if model exists in library
        model_exists = collection.find_one({"id": model_id, "deleted": {"$ne": 1}})
        if not model_exists:
            return {"status": status.HTTP_404_NOT_FOUND, "message": "model not found in library"}
        
        # Check if already exists
        existing = tenant_models_collection.find_one({
            "tenant_id": tenant_id,
            "model_id": model_id
        })
        
        if existing:
            return {"status": status.HTTP_302_FOUND, "message": "model already assigned to this tenant"}
        
        # Create new tenant model record
        tenant_model_data = {
            "id": get_next_id(tenant_models_collection),
            "tenant_id": tenant_id,
            "model_id": model_id,
            "createdon": datetime.now(timezone.utc).isoformat(),
            "active": 1,
            "deleted": 0
        }
        
        tenant_models_collection.insert_one(tenant_model_data)
        
        return {
            "status": status.HTTP_200_OK,
            "message": "model assigned to tenant successfully",
            "data": convert_to_jsonable(tenant_model_data)
        }
    except Exception as e:
        return get_error_details(e)

@rentify_library_models.post("/rentify/library/models/unselect-for-tenant")
async def delete_tenant_model(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    form = await request.form()
    try:
        tenant_id = int(user_detail["tenant_id"])
        model_id = int(form.get("model_id", 0))
        
        if not tenant_id or not model_id:
            return {"status": status.HTTP_400_BAD_REQUEST, "message": "tenant_id and model_id are required"}
        
        result = tenant_models_collection.delete_one({
            "tenant_id": tenant_id,
            "model_id": model_id
        })
        
        if result.deleted_count > 0:
            return {
                "status": status.HTTP_200_OK,
                "message": "model removed from tenant successfully",
                "data": None
            }
        else:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Tenant model relationship not found",
                "data": None
            }
    except Exception as e:
        return get_error_details(e)

@rentify_library_models.get("/rentify/library/models/{id}/deleted/{value}")
async def delete_restore_model(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
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
@rentify_library_models.get("/rentify/library/model/dropdown")
async def get_brands_dropdown(user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        tenant_id = int(user_detail["tenant_id"])
        brands = list(tenant_models_collection.find({"tenant_id": tenant_id}, {"_id": 0, "model_id": 1}))
        for brand in brands:
            brand["title"] = collection.find_one({"id": brand["model_id"]}, {"_id": 0, "title": 1})["title"]  

        return {"status": status.HTTP_200_OK, "message": "Records retrieved successfully", "data": convert_to_jsonable(brands)}
    except Exception as e:
        return get_error_details(e)





# ================================
# CRUD for models - ending
# ================================