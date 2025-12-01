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
listing_views = APIRouter(tags=["CRM Admin - Listing Views"])

# MongoDB Collection
listing_views_collection = db.listing_views

# Projection to exclude MongoDB _id
NO_ID_PROJECTION = {"_id": 0}


# ====================================
# CRUD for Listing Views - starting
# ====================================
@listing_views.post("/listings/views/save")
async def save_view(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Create or update a lead.
    """
    try:
        form = dict(await request.form())  # Use `await request.json()` if sending JSON
        doc_id = int(form.get("id") or 0)

        data = {
            **form,
            "id": doc_id or get_next_id(listing_views_collection),
            "tenant_id": user_detail["tenant_id"],
            "module": form.get("module", 1),
            "active": int(form.get("active", 1)),
            "sort_by": int(form.get("sort_by", 0)),
        }

        message = upsert_document(listing_views_collection, data, doc_id)
        return json_response(message, data)
    except Exception as e:
        return get_error_response(e)

@listing_views.post("/listings/views/get")
async def get_views(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        form = dict(await request.form())
        module = form.get("module")
        data_flag = int(form.get("data", 0))  # Default to 0 if missing

        query_params = {
            "tenant_id": user_detail["tenant_id"],
            "module": module,
            "deleted": {"$ne": 1}
        }

        records = list(listing_views_collection.find(query_params, NO_ID_PROJECTION))
        records_data = []

        valid_modules = {
            "leads": db.leads,
            "contacts": db.contacts,
            "accounts": db.accounts,
            "meetings": db.meetings,
            "tasks": db.tasks,
            "calls": db.calls,
        }
        this_collection = valid_modules.get(module)

        if this_collection is None:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Invalid module",
                "data": []
            }
        
        

        all_records = {"9000100001", "9000100004", "9000100007", "9000100010", "9000100013", "9000100016"}
        today_records = {"9000100002", "9000100005", "9000100008", "9000100011", "9000100014", "9000100017"}
        my_records = {"9000100003", "9000100006", "9000100009", "9000100012", "9000100015", "9000100018"}

        if data_flag == 1:
            today = datetime.combine(date.today(), datetime.min.time())
            tomorrow = datetime.combine(date.today(), datetime.max.time())

            for record in records:
                ukey = record.get("ukey")

                if ukey in all_records:
                    record["data"] = list(this_collection.find({"tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}}, NO_ID_PROJECTION))

                elif ukey in today_records:
                    record["data"] = list(this_collection.find({
                        "tenant_id": user_detail["tenant_id"],
                        "deleted": {"$ne": 1},
                        "created_at": {"$gte": today, "$lt": tomorrow}
                    }, NO_ID_PROJECTION))

                elif ukey in my_records:
                    record["data"] = list(this_collection.find({
                        "tenant_id": user_detail["tenant_id"],
                        "deleted": {"$ne": 1},
                        "user_id": user_detail["id"]
                    }, NO_ID_PROJECTION))

                records_data.append(record)
        else:
            records_data = records

        return json_response("Records retrieved successfully", records_data)

    except Exception as e:
        return get_error_response(e)


"""
@listing_views.post("/listings/views/get")
async def get_views(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):

    form = dict(await request.form())

    query_params = {"tenant_id": user_detail["tenant_id"],"module":form.get("module"), "deleted": {"$ne": 1}}
   
    try:

        records = list(listing_views_collection.find(query_params, NO_ID_PROJECTION))

        records_data = []
        
        all_records  = ["9000100001","9000100004","9000100007","9000100010","9000100013","9000100016",]
        today_records= ["9000100002","9000100005","9000100008","9000100011","9000100014","9000100017",]
        my_records   = ["9000100003","9000100006","9000100009","9000100012","9000100015","9000100018",]
        
        if int(form.get("data")) == 1:
            for record in records:
                if in_array(record["ukey"], all_records):
                    record["data"] = list(db.listings.find({"tenant_id": user_detail["tenant_id"]}))
                    records_data.append(record)

                if in_array(record["ukey"], today_records):
                    today = datetime.combine(date.today(), datetime.min.time()).strftime("%Y-%m-%d %H:%M:%S")
                    tomorrow = datetime.combine(date.today(), datetime.max.time()).strftime("%Y-%m-%d %H:%M:%S")
                    record["data"] = list(db.listings.find({
                        "tenant_id": user_detail["tenant_id"],
                        "created_at": {
                            "$gte": today,
                            "$lt": tomorrow
                        }
                    }))
                    records_data.append(record)

                if in_array(record["ukey"], my_records):
                    record["data"] = list(db.listings.find({"tenant_id": user_detail["tenant_id"], "user_id": user_detail["user_id"]}))
                    records_data.append(record)

        else:
            records_data = records


        return json_response("Records retrieved successfully", records_data)
    except Exception as e:
        return get_error_response(e)
"""    

@listing_views.post("/listings/views/get/{id}")
async def get_view_by_id(id: int):
    """
    Get a single lead by ID.
    """
    try:
        lead = listing_views_collection.find_one({"id": id, "deleted": {"$ne": 1}}, NO_ID_PROJECTION)
        if lead:
            return json_response("Record retrieved successfully", lead)
        return json_response("Record not found", None, status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return get_error_response(e)

@listing_views.post("/listings/views/by-ukey/{ukey}")
async def get_view_by_ukey(ukey: int):
    """
    Get a single lead by ID.
    """
    try:
        lead = listing_views_collection.find_one({"ukey": ukey, "deleted": {"$ne": 1}}, NO_ID_PROJECTION)
        if lead:
            return json_response("Record retrieved successfully", lead)
        return json_response("Record not found", None, status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return get_error_response(e)

@listing_views.get("/listings/views/{id}/deleted/{value}")
async def toggle_view_deletion(id: int, value: int):
    """
    Soft delete or restore a lead by toggling the 'deleted' flag.
    """
    try:
        listing_views_collection.update_one({"id": id}, {"$set": {"deleted": value}})
        message = "Record deleted successfully" if value else "Record restored successfully"
        return json_response(message)
    except Exception as e:
        return get_error_response(e)
# ====================================
# CRUD for Listing Views - ending
# ====================================