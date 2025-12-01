from fastapi import APIRouter, Request, status, Depends
from app.networks.database import db_rentify
from app.helpers.uploadimage import UploadImage
from app.utils import oauth2
from app.utils import config
from datetime import datetime, timezone, timedelta

rentify_library_body_types = APIRouter(tags=["Rentify Admin > Rentify > Library > Body Types"])
collection = db_rentify.rentify_library_body_types
tenant_body_types_collection = db_rentify.rentify_library_tenant_body_types

from app.helpers.general_helper import convert_to_jsonable, get_error_details, get_next_id

from app.models.rentify.library.body_types import BodyTypeCreate, BodyTypeUpdate

def validate_integer_field(value, field_name, default=0):
    """Validate and convert a field to integer with proper error handling"""
    try:
        if value is None or value == "":
            return default
        return int(value)
    except (ValueError, TypeError) as e:
        print(f"Debug: Error converting {field_name} '{value}': {e}")
        return default

# Projection to exclude MongoDB _id
NO_ID_PROJECTION = {"_id": 0}



# ================================
# CRUD for BodyTypes - starting
# ================================
@rentify_library_body_types.post("/rentify/library/body-types/save")
async def save_body_type(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    form = await request.form()
    print(f"Debug: All form data: {dict(form)}")
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

        if doc_id == 0:
            data = BodyTypeCreate()
            data.id = next_id
            data.title = form.get("title", "")
            data.title_ar = form.get("title_ar", "")
            data.slug = form.get("slug", "")
            data.origin_country = form.get("origin_country", "")
            # Safe integer conversion for security_deposit - ensure it's always an integer
            security_deposit_value = form.get("security_deposit", "0")
            print(f"Debug: security_deposit form value: '{security_deposit_value}' (type: {type(security_deposit_value)})")
            
            data.security_deposit = validate_integer_field(security_deposit_value, "security_deposit", 0)
            print(f"Debug: security_deposit final value: {data.security_deposit} (type: {type(data.security_deposit)})")
            
            # Ensure the value is an integer
            assert isinstance(data.security_deposit, int), f"security_deposit must be int, got {type(data.security_deposit)}"
            
            data.tenant_id = user_detail['tenant_id']
            data.is_global = 0
            data.editable = 1
            data.add_by = int(user_detail["id"])
            data.createdon = datetime.now(timezone.utc).isoformat()
            
            # Safe integer conversion with default values
            data.active = validate_integer_field(form.get("active", "1"), "active", 1)
            data.sort_by = validate_integer_field(form.get("sort_by", "0"), "sort_by", 0)

            # logo handling (changed from thumbnail to logo)
            logo_file = form.get("logo")
            if logo_file:
                new_file_name = UploadImage.uploadImage_DO(logo_file, "rentify/library/body_types")
                data.logo = config.IMAGE_DO_URL + new_file_name
            else:
                data.logo = form.get("old_logo", "")

            
            data_dict = data.dict()
            print(f"Debug: Data being inserted: {data_dict}")
            collection.insert_one(data_dict)

            # --- Tenant-body type mapping ---
            tenant_id = int(user_detail["tenant_id"])
            existing_tenant_body_type = tenant_body_types_collection.find_one({
                "tenant_id": tenant_id,
                "body_type_id": data.id
            })
            if not existing_tenant_body_type:
                tenant_body_type_data = {
                    "id": get_next_id(tenant_body_types_collection),
                    "tenant_id": tenant_id,
                    "body_type_id": data.id,
                    "createdon": datetime.now(timezone.utc).isoformat(),
                    "active": 1,
                    "deleted": 0
                }
                tenant_body_types_collection.insert_one(tenant_body_type_data)

            # Add is_used field and return the complete record
            #data_dict = data.dict()
                data_dict["is_used"] = 1
                data_dict["is_global"] = 0
                data_dict["editable"] = 1

            return {
                "status": status.HTTP_200_OK,
                "message": "Record created successfully",
                "data": convert_to_jsonable(data_dict)
            }
        else:
            data = BodyTypeUpdate()
            data.id = doc_id
            data.title = form.get("title", "")
            data.title_ar = form.get("title_ar", "")
            data.slug = form.get("slug", "")
            data.origin_country = form.get("origin_country", "")
            # Safe integer conversion for security_deposit - ensure it's always an integer
            security_deposit_value = form.get("security_deposit", "0")
            print(f"Debug: security_deposit form value: '{security_deposit_value}' (type: {type(security_deposit_value)})")
            
            data.security_deposit = validate_integer_field(security_deposit_value, "security_deposit", 0)
            print(f"Debug: security_deposit final value: {data.security_deposit} (type: {type(data.security_deposit)})")
            
            # Ensure the value is an integer
            assert isinstance(data.security_deposit, int), f"security_deposit must be int, got {type(data.security_deposit)}"
             
            data.tenant_id = user_detail['tenant_id']
            #data.is_global = 0
            #data.editable = 1       
            data.edit_by = int(user_detail["id"])
            data.updatedon = datetime.now(timezone.utc).isoformat()
            
            # Safe integer conversion with default values
            data.active = validate_integer_field(form.get("active", "1"), "active", 1)
            data.sort_by = validate_integer_field(form.get("sort_by", "0"), "sort_by", 0)

            # logo handling (changed from thumbnail to logo)
            logo_file = form.get("logo")
            if logo_file:
                new_file_name = UploadImage.uploadImage_DO(logo_file, "rentify/library/body_types")
                data.logo = config.IMAGE_DO_URL + new_file_name
            else:
                data.logo = form.get("old_logo", "")

            
            data_dict = data.dict()
            print(f"Debug: Data being updated: {data_dict}")
            collection.update_one({"id": doc_id}, {"$set": data_dict})

            # --- Tenant-body type mapping (ensure exists) ---
            tenant_id = int(user_detail["tenant_id"])
            existing_tenant_body_type = tenant_body_types_collection.find_one({
                "tenant_id": tenant_id,
                "body_type_id": data.id
            })
            
            # Note: The tenant-body type mapping is handled below
            # The commented code was moved to a more appropriate location

            if doc_id == 0:
                existing_tenant_body_type = tenant_body_types_collection.find_one({"tenant_id": tenant_id,"body_type_id": data_dict["id"]})
                if not existing_tenant_body_type:
                    tenant_body_type_data = {
                        "id": get_next_id(tenant_body_types_collection),
                        "tenant_id": tenant_id,
                        "body_type_id": data_dict["id"],
                        "createdon": datetime.now(timezone.utc).isoformat(),
                        "active": 1,
                        "deleted": 0
                    }
                    tenant_body_types_collection.insert_one(tenant_body_type_data)

            record_for_tenant = tenant_body_types_collection.find_one({"tenant_id": tenant_id, "body_type_id":int(data_dict["id"])}, {"_id": 0, "body_type_id": 1})
            if record_for_tenant:
                data_dict["is_used"] = 1
            else:
                data_dict["is_used"] = 0

            return {
                "status": status.HTTP_200_OK,
                "message": "Record updated successfully",
                "data": convert_to_jsonable(data_dict)
            }
    except Exception as e:
        return get_error_details(e)

@rentify_library_body_types.post("/rentify/library/body-types/get")
async def get_body_types(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        # Get form data for filtering
        form = await request.form()
        
        # Resolve current tenant id (default to 0 if missing)
        tenant_id = int(user_detail.get("tenant_id", 0))

        # Build filter query based on form data
        # All filters are applied conditionally and safely handle invalid/empty values
        filter_query = {"deleted": {"$ne": 1}, "$or": [{"is_global": 1}, {"tenant_id": tenant_id}]}  # Always exclude deleted records and match global or tenant-specific
        warnings = []

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
        
        # Handle body_type_id filter
        body_type_id_value = form.get("body_type_id")
        if body_type_id_value and body_type_id_value != "" and body_type_id_value.lower() != "null":
            try:
                filter_query["id"] = int(body_type_id_value)
                print(f"Applied body_type_id filter: {body_type_id_value}")
            except (ValueError, TypeError):
                print(f"Warning: Invalid body_type_id value '{body_type_id_value}', skipping filter")
                warnings.append(f"Invalid 'body_type_id' value '{body_type_id_value}', filter skipped")
        
        # Handle last_activity filter based on createdon/updatedon fields
        last_activity_value = form.get("last_activity")
        if last_activity_value and last_activity_value != "" and last_activity_value.lower() != "null":
            try:
                last_activity = last_activity_value
                current_time = datetime.now(timezone.utc)
                
                if last_activity == "last_7_days":
                    # Filter for body types updated in the last 7 days
                    seven_days_ago = current_time.replace(tzinfo=timezone.utc) - timedelta(days=7)
                    # Preserve existing $or conditions and add date conditions
                    existing_or = filter_query.get("$or", [])
                    date_or = [
                        {"createdon": {"$gte": seven_days_ago.isoformat()}},
                        {"updatedon": {"$gte": seven_days_ago.isoformat()}}
                    ]
                    # Combine existing conditions with date conditions using $and
                    if existing_or:
                        filter_query["$and"] = [
                            {"$or": existing_or},
                            {"$or": date_or}
                        ]
                        # Remove the original $or since it's now in $and
                        del filter_query["$or"]
                    else:
                        filter_query["$or"] = date_or
                    print(f"Applied last_activity filter: {last_activity}")
                elif last_activity == "last_30_days":
                    # Filter for body types updated in the last 30 days
                    thirty_days_ago = current_time.replace(tzinfo=timezone.utc) - timedelta(days=30)
                    # Preserve existing $or conditions and add date conditions
                    existing_or = filter_query.get("$or", [])
                    date_or = [
                        {"createdon": {"$gte": thirty_days_ago.isoformat()}},
                        {"updatedon": {"$gte": thirty_days_ago.isoformat()}}
                    ]
                    # Combine existing conditions with date conditions using $and
                    if existing_or:
                        filter_query["$and"] = [
                            {"$or": existing_or},
                            {"$or": date_or}
                        ]
                        # Remove the original $or since it's now in $and
                        del filter_query["$or"]
                    else:
                        filter_query["$or"] = date_or
                elif last_activity == "last_90_days":
                    # Filter for body types updated in the last 90 days
                    ninety_days_ago = current_time.replace(tzinfo=timezone.utc) - timedelta(days=90)
                    # Preserve existing $or conditions and add date conditions
                    existing_or = filter_query.get("$or", [])
                    date_or = [
                        {"createdon": {"$gte": ninety_days_ago.isoformat()}},
                        {"updatedon": {"$gte": ninety_days_ago.isoformat()}}
                    ]
                    # Combine existing conditions with date conditions using $and
                    if existing_or:
                        filter_query["$and"] = [
                            {"$or": existing_or},
                            {"$or": date_or}
                        ]
                        # Remove the original $or since it's now in $and
                        del filter_query["$or"]
                    else:
                        filter_query["$or"] = date_or
                elif last_activity == "this_month":
                    # Filter for body types updated this month
                    first_day = current_time.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                    # Preserve existing $or conditions and add date conditions
                    existing_or = filter_query.get("$or", [])
                    date_or = [
                        {"createdon": {"$gte": first_day.isoformat()}},
                        {"updatedon": {"$gte": first_day.isoformat()}}
                    ]
                    # Combine existing conditions with date conditions using $and
                    if existing_or:
                        filter_query["$and"] = [
                            {"$or": existing_or},
                            {"$or": date_or}
                        ]
                        # Remove the original $or since it's now in $and
                        del filter_query["$or"]
                    else:
                        filter_query["$or"] = date_or
                elif last_activity == "this_year":
                    # Filter for body types updated this year
                    first_day_year = current_time.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
                    # Preserve existing $or conditions and add date conditions
                    existing_or = filter_query.get("$or", [])
                    date_or = [
                        {"createdon": {"$gte": first_day_year.isoformat()}},
                        {"updatedon": {"$gte": first_day_year.isoformat()}}
                    ]
                    # Combine existing conditions with date conditions using $and
                    if existing_or:
                        filter_query["$and"] = [
                            {"$or": existing_or},
                            {"$or": date_or}
                        ]
                        # Remove the original $or since it's now in $and
                        del filter_query["$or"]
                    else:
                        filter_query["$or"] = date_or
                else:
                    print(f"Warning: Unknown last_activity value '{last_activity}', skipping filter")
            except Exception as e:
                print(f"Warning: Error processing last_activity filter '{last_activity_value}': {e}, skipping filter")
        
        # Debug: Print final filter query
        print(f"Final filter query: {filter_query}")
        
        # Get filtered body types from the library
        body_types = list(
            collection
            .find(filter_query, NO_ID_PROJECTION)
            .sort("id", -1)
        )

        # Get all body type IDs that are used in tenant_body_types
        used_body_type_ids = set()
        if tenant_body_types_collection:
            used_body_types = tenant_body_types_collection.find({"tenant_id": tenant_id}, {"_id": 0, "body_type_id": 1})
            used_body_type_ids = {int(bt.get("body_type_id")) for bt in used_body_types if bt.get("body_type_id") is not None}
            print(f"Debug: Found {len(used_body_type_ids)} used body types for tenant {tenant_id}: {used_body_type_ids}")
        else:
            print(f"Debug: tenant_body_types_collection is None")
        
        # Add is_used field to each body type
        for body_type in body_types:
            body_type_id_value = int(body_type.get("id", 0))
            body_type["is_used"] = 1 if body_type_id_value in used_body_type_ids else 0
            print(f"Debug: Body type {body_type_id_value} - is_used: {body_type['is_used']}")
        
        # Debug: Print final data structure
        print(f"Debug: Final body types data structure (first item): {body_types[0] if body_types else 'No body types'}")
                 
        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": convert_to_jsonable(body_types),
            "filters_applied": filter_query,
            "total_count": len(body_types),
            "filters_summary": {
                "active": form.get("active"),
                "body_type_id": form.get("body_type_id"),
                "last_activity": form.get("last_activity")
            },
            "warnings": warnings if len(warnings) > 0 else []
        }
    except Exception as e:
        return get_error_details(e)

@rentify_library_body_types.post("/rentify/library/body-types/get/{id}")
async def get_body_type_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        result = collection.find_one(
            {"id": id, "deleted": {"$ne": 1}},
            NO_ID_PROJECTION
        )
        if result:
            return {
                "status": status.HTTP_200_OK,
                "message": "Record retrieved successfully",
                "data": convert_to_jsonable(result)
            }
        else:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Record not found",
                "data": None
            }
    except Exception as e:
        return get_error_details(e)

@rentify_library_body_types.get("/rentify/library/body-types/{id}/deleted/{value}")
async def delete_restore_body_type(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
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

@rentify_library_body_types.post("/rentify/library/body-types/select-for-tenant")
async def save_tenant_body_type(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    form = await request.form()
    try:        
        tenant_id = int(user_detail["tenant_id"])
        body_type_id = int(form.get("body_type_id", 0))
        
        if not tenant_id or not body_type_id:
            return {"status": status.HTTP_400_BAD_REQUEST, "message": "tenant_id and body_type_id are required"}
        
        # Check if body type exists in library
        body_type_exists = collection.find_one({"id": body_type_id, "deleted": {"$ne": 1}})
        if not body_type_exists:
            return {"status": status.HTTP_404_NOT_FOUND, "message": "Body type not found in library"}
        
        # Check if already exists
        existing = tenant_body_types_collection.find_one({
            "tenant_id": tenant_id,
            "body_type_id": body_type_id
        })
        
        if existing:
            return {"status": status.HTTP_302_FOUND, "message": "Body type already assigned to this tenant"}
        
        # Create new tenant body type record
        tenant_body_type_data = {
            "id": get_next_id(tenant_body_types_collection),
            "tenant_id": tenant_id,
            "body_type_id": body_type_id,
            "createdon": datetime.now(timezone.utc).isoformat(),
            "active": 1,
            "deleted": 0
        }
        
        tenant_body_types_collection.insert_one(tenant_body_type_data)
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Body type assigned to tenant successfully",
            "data": convert_to_jsonable(tenant_body_type_data)
        }
    except Exception as e:
        return get_error_details(e)

@rentify_library_body_types.post("/rentify/library/body-types/unselect-for-tenant")
async def delete_tenant_body_type(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    form = await request.form()
    try:
        tenant_id = int(user_detail["tenant_id"])
        body_type_id = int(form.get("body_type_id", 0))
        
        if not tenant_id or not body_type_id:
            return {"status": status.HTTP_400_BAD_REQUEST, "message": "tenant_id and body_type_id are required"}
        
        result = tenant_body_types_collection.delete_one({
            "tenant_id": tenant_id,
            "body_type_id": body_type_id
        })
        
        if result.deleted_count > 0:
            return {
                "status": status.HTTP_200_OK,
                "message": "Body type removed from tenant successfully",
                "data": None
            }
        else:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Tenant body type relationship not found",
                "data": None
            }
    except Exception as e:
        return get_error_details(e)



# fetch all body types for dropdown - selected by tenant_id
@rentify_library_body_types.get("/rentify/library/body-types/dropdown")
async def get_body_types_dropdown(user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        tenant_id = int(user_detail["tenant_id"])
        body_types = list(tenant_body_types_collection.find({"tenant_id": tenant_id}, {"_id": 0, "body_type_id": 1}))
        for body_type in body_types:
            body_type["title"] = collection.find_one({"id": body_type["body_type_id"]}, {"_id": 0, "title": 1})["title"]  

        return {"status": status.HTTP_200_OK, "message": "Records retrieved successfully", "data": convert_to_jsonable(body_types)}
    except Exception as e:
        return get_error_details(e)



# ================================
# CRUD for BodyTypes - ending
# ================================

