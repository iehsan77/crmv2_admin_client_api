from fastapi import APIRouter, Request, status, Depends
from app.networks.database import db_rentify, db_global
from app.utils import oauth2
from datetime import datetime, timezone, timedelta

rentify_library_features = APIRouter(tags=["Rentify Admin > Rentify > Library > Features"])
collection = db_rentify.rentify_library_features
tenant_features_collection = db_rentify.rentify_library_tenant_features

from app.helpers.general_helper import convert_to_jsonable, get_error_details, get_next_id

from app.models.super_admin.library.rentify.features import FeatureCreate, FeatureUpdate

# Projection to exclude MongoDB _id
NO_ID_PROJECTION = {"_id": 0}



# ================================
# CRUD for Features - starting
# ================================
@rentify_library_features.post("/rentify/library/features/save")
async def save_feature(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    form = await request.form()
    try:
        doc_id = int(form.get("id", 0))
        next_id = doc_id or get_next_id(collection)

        # Duplicate check for title
        title_value = form.get("title", "")
        if not title_value:
            return {"status": status.HTTP_400_BAD_REQUEST, "message": "Title is required"}
        
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
        
        # Prepare data for insert/update
        current_time = datetime.now(timezone.utc).isoformat()
        
        if doc_id == 0:
            # Create new record
            record = {
                "id": next_id,
                "title": title_value,
                "title_ar": form.get("title_ar", ""),
                "active": int(form.get("active", 1)),
                "add_by": int(user_detail["id"]),
                "tenant_id": int(user_detail["tenant_id"]),
                "is_global": 0,
                "editable": 1,
                "deleted": 0,
                "createdon": current_time,
                "updatedon": current_time
            }
            
            # Insert the record
            result = collection.insert_one(record)
            if result.inserted_id:
                message = "Record created successfully"
            else:
                return {"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "Failed to create record"}
                
        else:
            # Update existing record
            update_data = {
                "title": title_value,
                "title_ar": form.get("title_ar", ""),
                "active": int(form.get("active", 1)),
                "edit_by": int(user_detail["id"]),
                "updatedon": current_time
            }
            
            # Update the record
            result = collection.update_one({"id": doc_id}, {"$set": update_data})
            if result.modified_count > 0:
                message = "Record updated successfully"
                # Get the updated record
                record = collection.find_one({"id": doc_id}, {"_id": 0})
            else:
                return {"status": status.HTTP_500_INTERNAL_SERVER_ERROR, "message": "Failed to update record"}



        # --- Tenant-feature mapping ---
        tenant_id = int(user_detail["tenant_id"])
        
        if doc_id == 0:
            existing_tenant_feature = tenant_features_collection.find_one({"tenant_id": tenant_id, "feature_id": record["id"]})
            if not existing_tenant_feature:
                tenant_feature_data = {
                    "id": get_next_id(tenant_features_collection),
                    "tenant_id": tenant_id,
                    "feature_id": record["id"],
                    "createdon": current_time,
                    "active": 1,
                    "deleted": 0
                }
                tenant_features_collection.insert_one(tenant_feature_data)
                record["is_used"] = 1
                record["is_global"] = 0
                record["editable"] = 1
                
        record_for_tenant = tenant_features_collection.find_one({"tenant_id": tenant_id, "feature_id":int(record["id"])}, {"_id": 0, "feature_id": 1})
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

@rentify_library_features.post("/rentify/library/features/get")
async def get_features(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        # Get form data for filtering
        form = await request.form()
        
        # Resolve current tenant id (default to 0 if missing)
        tenant_id = int(user_detail.get("tenant_id", 0))

        # Build filter query based on form data
        # All filters are applied conditionally and safely handle invalid/empty values
        filter_query = {"deleted": {"$ne": 1}, "$or": [{"is_global": 1}, {"tenant_id": tenant_id}]}  # Always exclude deleted records and match global or tenant-specific
        warnings = []
  
        # Get filtered features from the library with only required fields
        features = list(
            collection
            .find(filter_query, {
                "_id": 0,
                "id": 1,
                "title": 1,
                "title_ar": 1,
                "active": 1,
                "is_used": 1
            })
            .sort("id", -1)
        )

        # Get all feature IDs that are used in tenant_features
        used_feature_ids = set()
        if tenant_features_collection:
            used_features = tenant_features_collection.find({"tenant_id": tenant_id}, {"_id": 0, "feature_id": 1})
            used_feature_ids = {int(tb.get("feature_id")) for tb in used_features if tb.get("feature_id") is not None}
        
        # Add is_used field to each feature
        for feature in features:
            feature_id_value = int(feature.get("id", 0))
            feature["is_used"] = 1 if feature_id_value in used_feature_ids else 0
                 
        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": convert_to_jsonable(features),
            "filters_applied": filter_query,
            "total_count": len(features),
            "filters_summary": {
                "active": form.get("active"),
                "feature_id": form.get("feature_id"),
                "last_activity": form.get("last_activity")
            },
            "warnings": warnings if len(warnings) > 0 else []
        }
    except Exception as e:
        return get_error_details(e)

@rentify_library_features.post("/rentify/library/features/select-for-tenant")
async def save_tenant_feature(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    form = await request.form()
    try:        
        tenant_id = int(user_detail["tenant_id"])
        feature_id = int(form.get("feature_id", 0))
        
        if not tenant_id or not feature_id:
            return {"status": status.HTTP_400_BAD_REQUEST, "message": "tenant_id and feature_id are required"}
        
        # Check if feature exists in library
        feature_exists = collection.find_one({"id": feature_id, "deleted": {"$ne": 1}})
        if not feature_exists:
            return {"status": status.HTTP_404_NOT_FOUND, "message": "feature not found in library"}
        
        # Check if already exists
        existing = tenant_features_collection.find_one({
            "tenant_id": tenant_id,
            "feature_id": feature_id
        })
        
        if existing:
            return {"status": status.HTTP_302_FOUND, "message": "feature already assigned to this tenant"}
        
        # Create new tenant feature record
        tenant_feature_data = {
            "id": get_next_id(tenant_features_collection),
            "tenant_id": tenant_id,
            "feature_id": feature_id,
            "createdon": datetime.now(timezone.utc).isoformat(),
            "active": 1,
            "deleted": 0
        }
        
        tenant_features_collection.insert_one(tenant_feature_data)
        
        return {
            "status": status.HTTP_200_OK,
            "message": "feature assigned to tenant successfully",
            "data": convert_to_jsonable(tenant_feature_data)
        }
    except Exception as e:
        return get_error_details(e)

@rentify_library_features.post("/rentify/library/features/unselect-for-tenant")
async def delete_tenant_feature(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    form = await request.form()
    try:
        tenant_id = int(user_detail["tenant_id"])
        feature_id = int(form.get("feature_id", 0))
        
        if not tenant_id or not feature_id:
            return {"status": status.HTTP_400_BAD_REQUEST, "message": "tenant_id and feature_id are required"}
        
        result = tenant_features_collection.delete_one({
            "tenant_id": tenant_id,
            "feature_id": feature_id
        })
        
        if result.deleted_count > 0:
            return {
                "status": status.HTTP_200_OK,
                "message": "feature removed from tenant successfully",
                "data": None
            }
        else:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Tenant feature relationship not found",
                "data": None
            }
    except Exception as e:
        return get_error_details(e)

@rentify_library_features.post("/rentify/library/features/get/{id}")
async def get_feature_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
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

@rentify_library_features.get("/rentify/library/features/{id}/deleted/{value}")
async def delete_restore_feature(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
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



# fetch all features for dropdown - selected by tenant_id
@rentify_library_features.get("/rentify/library/features/dropdown")
async def get_features_dropdown(user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        tenant_id = int(user_detail["tenant_id"])
        features = list(tenant_features_collection.find({"tenant_id": tenant_id}, {"_id": 0, "feature_id": 1}))
        for feature in features:
            feature["title"] = collection.find_one({"id": feature["feature_id"]}, {"_id": 0, "title": 1})["title"]  

        return {"status": status.HTTP_200_OK, "message": "Records retrieved successfully", "data": convert_to_jsonable(features)}
    except Exception as e:
        return get_error_details(e)





# ================================
# CRUD for Features - ending
# ================================

