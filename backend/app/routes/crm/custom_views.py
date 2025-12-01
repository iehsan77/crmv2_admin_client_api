from fastapi import APIRouter, Request, status, Depends
from datetime import datetime, date

from app.networks.database import db
from app.utils import oauth2
from app.helpers.general_helper import (
    get_next_id,
    upsert_document,
    json_response,
    get_error_response,
)

# Router
custom_views = APIRouter(tags=["CRM Admin - Custom Views"])

# MongoDB Collection
custom_views_collection = db.modules_custom_views

# Projection to exclude MongoDB _id
NO_ID_PROJECTION = {"_id": 0}


# ====================================
# CRUD for Custom Views - starting
# ====================================
@custom_views.post("/custom/views/save")
async def save_view(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Create or update a lead.
    """
    try:
        form = dict(await request.form())  # Use `await request.json()` if sending JSON
        doc_id = int(form.get("id") or 0)

        data = {
            **form,
            "id": doc_id or get_next_id(custom_views_collection),
            "tenant_id": user_detail["tenant_id"],
            "module": form.get("module", 1),
            "active": int(form.get("active", 1)),
            "sort_by": int(form.get("sort_by", 0)),
        }

        message = upsert_document(custom_views_collection, data, doc_id)
        return json_response(message, data)
    except Exception as e:
        return get_error_response(e)

@custom_views.post("/custom/views/get")
async def get_views(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        form = dict(await request.form())
        module_id = form.get("module_id")
        data_flag = int(form.get("data", 0))  # Default to 0 if missing

        query_params = {
            "tenant_id": int(user_detail["tenant_id"]),
            "module_id": int(module_id),
            "deleted": {"$ne": 1}
        }

        records = list(custom_views_collection.find(query_params, NO_ID_PROJECTION))

        return json_response("Records retrieved successfully", records)

    except Exception as e:
        return get_error_response(e)
 

@custom_views.get("/custom/views/get-by-module-id/{module_id}")
async def get_views(module_id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
      
        query_params = {
            "tenant_id": int(user_detail["tenant_id"]),
            "module_id": int(module_id),
            "deleted": {"$ne": 1}
        }
        #records = list(custom_views_collection.find(query_params, NO_ID_PROJECTION))
        records = list(custom_views_collection.find(query_params, NO_ID_PROJECTION).sort("default", -1))
        return json_response("Records retrieved successfully", records)
    
    except Exception as e:
        return get_error_response(e)
 

@custom_views.post("/custom/views/get/{id}")
async def get_view_by_id(id: int):
    """
    Get a single lead by ID.
    """
    try:
        lead = custom_views_collection.find_one({"id": id, "deleted": {"$ne": 1}}, NO_ID_PROJECTION)
        if lead:
            return json_response("Record retrieved successfully", lead)
        return json_response("Record not found", None, status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return get_error_response(e)

@custom_views.post("/custom/views/by-ukey/{ukey}")
async def get_view_by_ukey(ukey: int):
    """
    Get a single lead by ID.
    """
    try:
        lead = custom_views_collection.find_one({"ukey": ukey, "deleted": {"$ne": 1}}, NO_ID_PROJECTION)
        if lead:
            return json_response("Record retrieved successfully", lead)
        return json_response("Record not found", None, status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return get_error_response(e)

@custom_views.get("/custom/views/{id}/deleted/{value}")
async def toggle_view_deletion(id: int, value: int):
    """
    Soft delete or restore a lead by toggling the 'deleted' flag.
    """
    try:
        custom_views_collection.update_one({"id": id}, {"$set": {"deleted": value}})
        message = "Record deleted successfully" if value else "Record restored successfully"
        return json_response(message)
    except Exception as e:
        return get_error_response(e)
# ====================================
# CRUD for Custom Views - ending
# ====================================