import json

from fastapi import APIRouter, Request, status, Depends, UploadFile, File
from typing import List, Optional
from app.networks.database import db
from app.utils import oauth2, config
from app.helpers.general_helper import (
    get_next_id,
    upsert_document,
    json_response,
    get_error_response,
    convert_to_jsonable,
    get_error_details,
)
from datetime import datetime, timezone, timedelta
from app.helpers.uploadimage import UploadImage
from app.models.crm.calls import CallCreate, CallUpdate, CallUpdatePurpose, CallInDB
from app.helpers.globalfunctions import build_crm_query, QUERY_TYPE_ALL, QUERY_TYPE_OWNED, QUERY_TYPE_TODAY

# Router
calls = APIRouter(tags=["CRM Admin - Calls"])

# MongoDB Collection
calls_collection = db.calls

# Projection to exclude MongoDB _id
NO_ID_PROJECTION = {"_id": 0}




# ===============================
# CRUD for CALLS - starting
# ===============================

def build_calls_filter_query(user_detail: dict, view: str = "all_calls", subject: str = "", 
                           start_time: str = "", duration: str = "", related_to_name: str = "", 
                           owner_id: str = "", assigned_to_id: str = "") -> dict:
    """
    Build MongoDB query for filtering calls based on various criteria.
    
    Args:
        user_detail: User details containing tenant_id and id
        view: View type for filtering (all_calls, calls_today, etc.)
        subject: Subject filter (case-insensitive regex)
        start_time: Start time filter
        duration: Duration filter (case-insensitive regex)
        related_to_name: Related entity name filter
        owner_id: Owner ID filter
        assigned_to_id: Assigned user ID filter
        
    Returns:
        MongoDB query dictionary
    """
    # Build base query
    query = {
        "tenant_id": user_detail["tenant_id"],
        "deleted": {"$ne": 1}
    }
    
    # Apply view-based filtering
    if view == "calls_today":
        # Filter for calls created today
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today + timedelta(days=1)
        today_iso = today.isoformat() + "+00:00"
        tomorrow_iso = tomorrow.isoformat() + "+00:00"
        query["createdon"] = {"$gte": today_iso, "$lt": tomorrow_iso}
        
    elif view == "calls_this_week":
        # Filter for calls created this week (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        week_ago_iso = week_ago.isoformat() + "+00:00"
        query["createdon"] = {"$gte": week_ago_iso}
        
    elif view == "missed_calls":
        # Filter for missed calls
        query["status"] = {"$in": ["missed", "no_answer", "busy", "failed"]}
        
    elif view == "connected_calls":
        # Filter for connected/successful calls
        query["status"] = {"$in": ["completed", "connected", "answered", "successful"]}
        
    elif view == "my_calls":
        # Filter for calls owned by current user
        query["user_id"] = int(user_detail["id"])
        
    elif view == "favorite_calls":
        # Filter for favorite calls (assuming there's a favorite field)
        query["favorite"] = {"$ne": 0}
  
    # Apply search filters
    if subject:
        query["subject"] = {"$regex": subject, "$options": "i"}
        
    if start_time:
        # Handle start_time filtering (assuming ISO format)
        try:
            start_time_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            query["start_time"] = {"$gte": start_time_dt.isoformat()}
        except ValueError:
            # If not ISO format, try regex search
            query["start_time"] = {"$regex": start_time, "$options": "i"}
            
    if duration:
        # Handle duration filtering
        query["duration"] = {"$regex": duration, "$options": "i"}
        
    if related_to_name:
        # Search for calls where the related entity name matches the search term
        # We need to find entity IDs that match the name, then filter calls by those IDs
        related_entity_ids = []
        
        # Search in contacts
        contacts = list(db.contacts.find(
            {
                "tenant_id": user_detail["tenant_id"],
                "deleted": {"$ne": 1},
                "$or": [
                    {"contact_name": {"$regex": related_to_name, "$options": "i"}},
                    {"first_name": {"$regex": related_to_name, "$options": "i"}},
                    {"last_name": {"$regex": related_to_name, "$options": "i"}},
                    {"email": {"$regex": related_to_name, "$options": "i"}}
                ]
            },
            {"id": 1, "_id": 0}
        ))
        related_entity_ids.extend([contact["id"] for contact in contacts])
        
        # Search in leads
        leads = list(db.leads.find(
            {
                "tenant_id": user_detail["tenant_id"],
                "deleted": {"$ne": 1},
                "$or": [
                    {"lead_name": {"$regex": related_to_name, "$options": "i"}},
                    {"first_name": {"$regex": related_to_name, "$options": "i"}},
                    {"last_name": {"$regex": related_to_name, "$options": "i"}},
                    {"email": {"$regex": related_to_name, "$options": "i"}}
                ]
            },
            {"id": 1, "_id": 0}
        ))
        related_entity_ids.extend([lead["id"] for lead in leads])
        
        # Search in accounts
        accounts = list(db.accounts.find(
            {
                "tenant_id": user_detail["tenant_id"],
                "deleted": {"$ne": 1},
                "$or": [
                    {"title": {"$regex": related_to_name, "$options": "i"}},
                    {"account_name": {"$regex": related_to_name, "$options": "i"}}
                ]
            },
            {"id": 1, "_id": 0}
        ))
        related_entity_ids.extend([account["id"] for account in accounts])
        
        # Search in deals
        deals = list(db.deals.find(
            {
                "tenant_id": user_detail["tenant_id"],
                "deleted": {"$ne": 1},
                "title": {"$regex": related_to_name, "$options": "i"}
            },
            {"id": 1, "_id": 0}
        ))
        related_entity_ids.extend([deal["id"] for deal in deals])
        
        # Filter calls by related_to_id if we found matching entities
        if related_entity_ids:
            query["related_to_id"] = {"$in": related_entity_ids}
        else:
            # If no matching entities found, return empty result
            query["related_to_id"] = {"$in": []}
        
    if owner_id:
        try:
            query["owner_id"] = int(owner_id)
        except ValueError:
            # If not a valid integer, skip this filter
            pass
            
    if assigned_to_id:
        try:
            query["assigned_to_id"] = int(assigned_to_id)
        except ValueError:
            # If not a valid integer, skip this filter
            pass
    
    return query

def get_related_entity_data(related_to: str, related_to_id: int, tenant_id: int) -> dict:
    """
    Fetch data from the relevant collection based on related_to type.
    
    Args:
        related_to: Type of related entity (contacts, leads, accounts, deals)
        related_to_id: ID of the related entity
        tenant_id: Tenant ID for filtering
        
    Returns:
        Related entity data or empty dict if not found
    """
    try:
        if related_to == "contacts":
            related_entity = db.contacts.find_one(
                {"id": related_to_id, "tenant_id": tenant_id, "deleted": {"$ne": 1}},
                NO_ID_PROJECTION
            )
        elif related_to == "leads":
            related_entity = db.leads.find_one(
                {"id": related_to_id, "tenant_id": tenant_id, "deleted": {"$ne": 1}},
                NO_ID_PROJECTION
            )
        elif related_to == "accounts":
            related_entity = db.accounts.find_one(
                {"id": related_to_id, "tenant_id": tenant_id, "deleted": {"$ne": 1}},
                NO_ID_PROJECTION
            )
        elif related_to == "deals":
            related_entity = db.deals.find_one(
                {"id": related_to_id, "tenant_id": tenant_id, "deleted": {"$ne": 1}},
                NO_ID_PROJECTION
            )
        else:
            # Fallback to generic collection lookup
            related_entity = db[related_to].find_one(
                {"id": related_to_id, "tenant_id": tenant_id, "deleted": {"$ne": 1}},
                NO_ID_PROJECTION
            )
        
        return related_entity or {}
    except Exception:
        return {}

def enrich_call_data(call: dict, user_detail: dict) -> dict:
    """
    Enrich call data with related user and entity information.
    
    Args:
        call: Call document from database
        user_detail: User details containing tenant_id
        
    Returns:
        Enriched call document
    """
    # Get user information for owner
    owner = db.users.find_one(
        {"id": call.get("owner_id")},
        NO_ID_PROJECTION
    )
    call["owner"] = owner or {}
    
    # Get user information for user_id
    user = db.users.find_one(
        {"id": call.get("user_id")},
        NO_ID_PROJECTION
    )
    call["user"] = user or {}
    
    # Get assigned user information if assigned_to_id exists
    if call.get("assigned_to_id"):
        assigned_user = db.users.find_one(
            {"id": call.get("assigned_to_id")},
            NO_ID_PROJECTION
        )
        call["assigned_user"] = assigned_user or {}
    else:
        call["assigned_user"] = {}
    
    # Get related entity details using the new function
    if call.get("related_to") and call.get("related_to_id"):
        call["related_entity"] = get_related_entity_data(
            call["related_to"], 
            call["related_to_id"], 
            user_detail["tenant_id"]
        )
    else:
        call["related_entity"] = {}
    
    # Also get call_for entity details if call_for and call_for_id exist
    if call.get("call_for") and call.get("call_for_id"):
        call["call_for_entity"] = get_related_entity_data(
            call["call_for"], 
            call["call_for_id"], 
            user_detail["tenant_id"]
        )
    else:
        call["call_for_entity"] = {}
    
    return call
# Generate line chart data based on actual historical data
def generate_line_chart_data_from_calls(calls_collection, base_query, metric_type="total"):
    """
    Generate line chart data based on actual historical data for the last 7 days
    """
    data = []
    
    # Get the last 7 days from the to_date
    end_date = datetime.fromisoformat(base_query["start_time"]["$lte"])
    
    for i in range(7):
        # Calculate date for this day
        current_date = end_date - timedelta(days=6-i)
        start_of_day = current_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = current_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Build query for this specific day
        day_query = {
            **base_query,
            "start_time": {
                "$gte": start_of_day.isoformat(),
                "$lte": end_of_day.isoformat()
            }
        }
        
        # Count based on metric type
        if metric_type == "total":
            count = calls_collection.count_documents(day_query)
        elif metric_type == "missed":
            count = calls_collection.count_documents({**day_query, "status": {"$in": ["missed", "no_answer", "busy"]}})
        elif metric_type == "connected":
            count = calls_collection.count_documents({**day_query, "status": {"$in": ["completed", "connected", "answered"]}})
        elif metric_type == "duration":
            # Count calls with duration for this day
            count = calls_collection.count_documents({**day_query, "duration": {"$exists": True, "$ne": ""}})
        else:
            count = calls_collection.count_documents(day_query)
        
        data.append({"value": count})
    
    return data

@calls.post("/crm/calls/get-statistics")
async def get_statistics(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):

    try:
        # Get form data
        form = await request.form()
        
        # Resolve current tenant id (default to 0 if missing)
        tenant_id = int(user_detail.get("tenant_id", 0))
        
        # Get date range parameters
        from_date_str = form.get("from", "")
        to_date_str = form.get("to", "")
        
        # Validate date range
        if not from_date_str or not to_date_str:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "from and to date parameters are required",
                "data": None
            }
        
        try:
            # Parse dates (assuming ISO format or similar)
            from_date = datetime.fromisoformat(from_date_str.replace('Z', '+00:00'))
            to_date = datetime.fromisoformat(to_date_str.replace('Z', '+00:00'))
        except ValueError:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "Invalid date format. Please use ISO format",
                "data": None
            }
        
        # Build base query for the date range and tenant
        base_query = {
            "tenant_id": tenant_id,
            "deleted": {"$ne": 1},
            "start_time": {
                "$gte": from_date.isoformat(),
                "$lte": to_date.isoformat()
            }
        }
        
        # Get total calls count
        total_calls = calls_collection.count_documents(base_query)
        
        # Get missed calls (assuming status indicates missed calls)
        missed_calls_query = {**base_query, "status": {"$in": ["missed", "no_answer", "busy"]}}
        missed_calls = calls_collection.count_documents(missed_calls_query)
        
        # Get connected calls (assuming status indicates successful calls)
        connected_calls_query = {**base_query, "status": {"$in": ["completed", "connected", "answered"]}}
        connected_calls = calls_collection.count_documents(connected_calls_query)
        
        # Calculate average call duration
        calls_with_duration = list(calls_collection.find(
            {**base_query, "duration": {"$exists": True, "$ne": ""}},
            {"duration": 1, "_id": 0}
        ))
        
        total_duration_seconds = 0
        valid_durations = 0
        
        for call in calls_with_duration:
            duration_str = call.get("duration", "")
            if duration_str:
                try:
                    # Parse duration in format "5m 42s" or "5:42" or "342s"
                    if "m" in duration_str and "s" in duration_str:
                        # Format: "5m 42s"
                        parts = duration_str.replace("m", "").replace("s", "").split()
                        minutes = int(parts[0]) if parts[0].isdigit() else 0
                        seconds = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0
                        total_duration_seconds += minutes * 60 + seconds
                        valid_durations += 1
                    elif ":" in duration_str:
                        # Format: "5:42"
                        parts = duration_str.split(":")
                        minutes = int(parts[0]) if parts[0].isdigit() else 0
                        seconds = int(parts[1]) if parts[1].isdigit() else 0
                        total_duration_seconds += minutes * 60 + seconds
                        valid_durations += 1
                    elif duration_str.endswith("s"):
                        # Format: "342s"
                        seconds = int(duration_str.replace("s", ""))
                        total_duration_seconds += seconds
                        valid_durations += 1
                except (ValueError, IndexError):
                    continue
        
        # Calculate average duration
        if valid_durations > 0:
            avg_seconds = total_duration_seconds / valid_durations
            avg_minutes = int(avg_seconds // 60)
            avg_remaining_seconds = int(avg_seconds % 60)
            average_calls = f"{avg_minutes}m {avg_remaining_seconds}s"
        else:
            average_calls = "0m 0s"
        
        # Calculate percentage changes (comparing with previous period)
        # For now, we'll use placeholder percentages - these could be calculated by comparing with previous period
        total_calls_percent = 3.2  # TODO: Calculate actual percentage change
        missed_calls_percent = 1.7  # TODO: Calculate actual percentage change
        connected_calls_percent = 5.4  # TODO: Calculate actual percentage change
        average_calls_percent = 0.9  # TODO: Calculate actual percentage change
        
        
        
        # Get additional breakdown data for descriptions
        # Get calls by purpose/type for team breakdown
        purpose_breakdown = list(calls_collection.aggregate([
            {"$match": base_query},
            {"$group": {"_id": "$purpose", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]))
        
        # Get calls by type (inbound/outbound)
        type_breakdown = list(calls_collection.aggregate([
            {"$match": base_query},
            {"$group": {"_id": "$type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]))
        
        # Get duration breakdown
        duration_breakdown = list(calls_collection.find(
            {**base_query, "duration": {"$exists": True, "$ne": ""}},
            {"duration": 1, "_id": 0}
        ))
        
        short_calls = 0
        medium_calls = 0
        long_calls = 0
        
        for call in duration_breakdown:
            duration_str = call.get("duration", "")
            if duration_str:
                try:
                    # Parse duration and categorize
                    if "m" in duration_str and "s" in duration_str:
                        parts = duration_str.replace("m", "").replace("s", "").split()
                        minutes = int(parts[0]) if parts[0].isdigit() else 0
                        seconds = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0
                        total_seconds = minutes * 60 + seconds
                    elif ":" in duration_str:
                        parts = duration_str.split(":")
                        minutes = int(parts[0]) if parts[0].isdigit() else 0
                        seconds = int(parts[1]) if parts[1].isdigit() else 0
                        total_seconds = minutes * 60 + seconds
                    elif duration_str.endswith("s"):
                        total_seconds = int(duration_str.replace("s", ""))
                    else:
                        continue
                    
                    if total_seconds < 120:  # Less than 2 minutes
                        short_calls += 1
                    elif total_seconds <= 600:  # 2-10 minutes
                        medium_calls += 1
                    else:  # More than 10 minutes
                        long_calls += 1
                except (ValueError, IndexError):
                    continue
        
        # Build descriptions with actual data
        purpose_desc = " | ".join([f"{p['_id'] or 'Unknown'}: {p['count']}" for p in purpose_breakdown[:3]])
        type_desc = " | ".join([f"{t['_id'] or 'Unknown'}: {t['count']}" for t in type_breakdown[:2]])
        
        # Build dashboard view data
        dashboard_view = [
            {
                "icon":"/icons/car_icon.svg",
                "iconClass":"",
                "title":"Total Calls Made",
                "total": total_calls,
                "change": total_calls_percent,
                "description": f"Breakdown: {purpose_desc}",
                "lineChartData": generate_line_chart_data_from_calls(calls_collection, base_query, "total")
            },
            {
                "icon":"/icons/car_icon.svg",
                "iconClass":"",
                "title": "Missed/Non-Shows",
                "total": missed_calls,
                "change": missed_calls_percent,
                "description": f"Missed calls in selected period",
                "lineChartData": generate_line_chart_data_from_calls(calls_collection, base_query, "missed")
            },
            {
                "icon":"/icons/car_icon.svg",
                "iconClass":"",
                "title": "Connected Calls",
                "total": connected_calls,
                "change": connected_calls_percent,
                "description": f"Type breakdown: {type_desc}",
                "lineChartData": generate_line_chart_data_from_calls(calls_collection, base_query, "connected")
            },
            {
                "icon":"/icons/car_icon.svg",
                "iconClass":"",
                "title": "Average Call Duration",
                "total": average_calls,
                "change": average_calls_percent,
                "description": f"Short (<2m): {short_calls} | Medium (2-10m): {medium_calls} | Long (>10m): {long_calls}",
                "lineChartData": generate_line_chart_data_from_calls(calls_collection, base_query, "duration")
            },
        ]

        
        return {
            "status": status.HTTP_200_OK,
            "message": "Call statistics retrieved successfully",
            "data": dashboard_view,
            "date_range": {
                "from": from_date.isoformat(),
                "to": to_date.isoformat()
            },
            "tenant_id": tenant_id
        }
        
    except Exception as e:
        return get_error_details(e)

@calls.post("/crm/calls/get")
async def get_calls(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        # Get form data
        form = await request.form()
        
        # Extract filter parameters
        view = form.get("view", "all_calls")
        subject = form.get("subject", "").strip()
        start_time = form.get("start_time", "").strip()
        duration = form.get("duration", "").strip()
        related_to_name = form.get("related_to_name", "").strip()
        owner_id = form.get("owner_id", "").strip()
        assigned_to_id = form.get("assigned_to_id", "").strip()
        
        # Build query using the separate function
        query = build_calls_filter_query(
            user_detail=user_detail,
            view=view,
            subject=subject,
            start_time=start_time,
            duration=duration,
            related_to_name=related_to_name,
            owner_id=owner_id,
            assigned_to_id=assigned_to_id
        )
        
        # Execute query
        calls = list(calls_collection.find(query, NO_ID_PROJECTION).sort("id", -1))

        # Enrich call data using the separate function
        records = []
        if calls:
            for call in calls:
                enriched_call = enrich_call_data(call, user_detail)
                records.append(enriched_call)

        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": convert_to_jsonable(records),
            "filters_applied": {
                "view": view,
                "subject": subject,
                "start_time": start_time,
                "duration": duration,
                "related_to_name": related_to_name,
                "owner_id": owner_id,
                "assigned_to_id": assigned_to_id
            },
            "total_count": len(records)
        }
    except Exception as e:
        return get_error_details(e)





# ===============================
# CRUD for CALLS - ending
# ===============================




# ===============================
# OLD CRUD for CALLS - starting
# ===============================
"""
@calls.post("/calls/save")
async def save_call(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):

    try:
        form = await request.form()
        doc_id = int(form.get("id"))
        
        next_id = doc_id or get_next_id(calls_collection)

        if doc_id == 0:
            # Create new call
            call_data = CallCreate()
            call_data.id = next_id
            #call_data.ukey = {user_detail['tenant_id']}000{next_id}",
            call_data.ukey = str(user_detail['tenant_id']) + "000" + str(next_id)
            call_data.subject = form.get("subject", "")
            call_data.type = form.get("type", "")
            call_data.start_time = form.get("start_time", "")
            call_data.related_to = form.get("related_to", "")
            call_data.related_to_id = int(form.get("related_to_id", 0))
            call_data.owner_id = int(form.get("owner_id", 0))
            call_data.purpose = form.get("purpose", "")
            call_data.duration = form.get("duration", "")
            call_data.description = form.get("description", "")
            call_data.result = form.get("result", "")
            call_data.tag = form.get("tag", "")
            call_data.status = form.get("status", "")
            call_data.agenda = form.get("agenda", "")
            call_data.reminder = form.get("reminder", "")
            call_data.caller_id = form.get("caller_id", "")
            call_data.dialled_number = form.get("dialled_number", "")
            call_data.call_for = form.get("call_for", "")
            call_data.call_for_id = int(form.get("call_for_id", 0))
            call_data.tenant_id = user_detail["tenant_id"]
            call_data.user_id = user_detail["id"]
            call_data.active = int(form.get("active", 1))
            call_data.sort_by = int(form.get("sort_by", 0))
            
            calls_collection.insert_one(call_data.dict())
            return {
                "status": status.HTTP_200_OK,
                "message": "Call created successfully",
                "data": convert_to_jsonable(call_data.dict())
            }
        else:
            # Update existing call
            call_data = CallUpdate()
            call_data.id = doc_id
            call_data.subject = form.get("subject", "")
            call_data.type = form.get("type", "")
            call_data.start_time = form.get("start_time", "")
            call_data.related_to = form.get("related_to", "")
            call_data.related_to_id = int(form.get("related_to_id", 0))
            call_data.owner_id = int(form.get("owner_id", 0))
            call_data.purpose = form.get("purpose", "")
            call_data.duration = form.get("duration", "")
            call_data.description = form.get("description", "")
            call_data.result = form.get("result", "")
            call_data.tag = form.get("tag", "")
            call_data.status = form.get("status", "")
            call_data.agenda = form.get("agenda", "")
            call_data.reminder = form.get("reminder", "")
            call_data.caller_id = form.get("caller_id", "")
            call_data.dialled_number = form.get("dialled_number", "")
            call_data.call_for = form.get("call_for", "")
            call_data.call_for_id = int(form.get("call_for_id", 0))
            call_data.tenant_id = user_detail["tenant_id"]
            call_data.user_id = user_detail["id"]
            call_data.active = int(form.get("active", 1))
            call_data.sort_by = int(form.get("sort_by", 0))
            
            calls_collection.update_one(
                {"id": doc_id, "tenant_id": user_detail["tenant_id"]}, 
                {"$set": call_data.dict()}
            )

            return {
                "status": status.HTTP_200_OK,
                "message": "Call updated successfully",
                "data": convert_to_jsonable(call_data.dict())
            }
                
    except Exception as e:
        return get_error_details(e)

@calls.post("/calls/get")
async def get_calls(user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        calls = list(calls_collection.find(
            {"tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
            NO_ID_PROJECTION
        ).sort("id", -1))

        records = []
        if calls:
            for call in calls:
                # Get user information for owner
                owner = db.users.find_one(
                    {"id": call.get("owner_id")},
                    NO_ID_PROJECTION
                )
                call["owner"] = owner or {}
                
                # Get user information for user_id
                user = db.users.find_one(
                    {"id": call.get("user_id")},
                    NO_ID_PROJECTION
                )
                call["user"] = user or {}
                
                records.append(call)

        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": convert_to_jsonable(records)
        }
    except Exception as e:
        return get_error_details(e)

@calls.get("/calls/get-by-view-ukey/{ukey}")
async def get_calls_by_view_id(ukey: str, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get calls based on custom view configuration with optimized query building.
    """
    try:
        if not ukey:
            return json_response("Ukey parameter is required", None, status.HTTP_400_BAD_REQUEST)
        
        # Get custom view configuration with optimized projection
        custom_view = db.modules_custom_views.find_one(
            {
                "ukey": ukey, 
                "tenant_id": int(user_detail["tenant_id"]), 
                "deleted": {"$ne": 1}
            }, 
            {"query_type": 1, "_id": 0}  # Only fetch needed fields
        )
        
        if not custom_view:
            return json_response("Custom view not found", None, status.HTTP_404_NOT_FOUND)
        
        query_type = custom_view.get("query_type")
        if not query_type:
            return json_response("Invalid custom view configuration", None, status.HTTP_400_BAD_REQUEST)
        
        try:
            query_type = int(query_type)
        except (ValueError, TypeError):
            return json_response("Invalid query type in custom view", None, status.HTTP_400_BAD_REQUEST)
        
        # Build optimized query using global function
        query = build_crm_query(query_type, user_detail, owner_field="owner_id")
        
        # Execute query with optimized sorting and limit for performance
        records = list(
            calls_collection
            .find(query, NO_ID_PROJECTION)
            .sort("id", -1)
            .limit(1000)  # Add reasonable limit to prevent memory issues
        )

        # Add owner and user details to each call
        for call in records:
            # Get user information for owner
            owner = db.users.find_one(
                {"id": call.get("owner_id")},
                NO_ID_PROJECTION
            )
            call["owner"] = owner or {}
            
            # Get user information for user_id
            user = db.users.find_one(
                {"id": call.get("user_id")},
                NO_ID_PROJECTION
            )
            call["user"] = user or {}

        return json_response("Records retrieved successfully", records)

    except Exception as e:
        return get_error_response(e)

@calls.post("/calls/get/{id}")
async def get_call_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get a single call by ID.
    """
    try:
        call = calls_collection.find_one({"id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}}, NO_ID_PROJECTION)
        if call:
            return {
                "status": status.HTTP_200_OK,
                "message": "Record retrieved successfully",
                "data": convert_to_jsonable(call)
            }
        return {
            "status": status.HTTP_404_NOT_FOUND,
            "message": "Record not found",
            "data": None
        }
    except Exception as e:
        return get_error_details(e)

@calls.get("/calls/clone/{id}")
async def clone_call_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        # Find the original call
        call = calls_collection.find_one(
            {"id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
            NO_ID_PROJECTION
        )

        if not call:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Original record not found",
                "data": None
            }

        call.pop("_id", None)
        old_id = call.get("id")
        new_id = get_next_id(calls_collection)

        #latest = await calls_collection.find_one({},sort=[("ukey", -1)])
        #next_ukey = latest["ukey"] + 1 if latest and "ukey" in latest else 00000  # start from a base if none
        
        
        #latest_ukey_doc = await calls_collection.find({"tenant_id": user_detail["tenant_id"]}).sort("ukey", -1).to_list(1)
        
        cursor = calls_collection.find(
            {}, NO_ID_PROJECTION
        ).sort("ukey", -1).limit(1)

        latest_doc = next(cursor, None)
        #next_ukey = (int(latest_doc["ukey"]) + 1) if latest_doc and "ukey" in latest_doc else 10000
        
        latest_ukey = int(latest_doc["ukey"]) if latest_doc and "ukey" in latest_doc else 9999
        next_ukey = latest_ukey + 1

        # Set new fields
        call["id"] = new_id
        call["ukey"] = str(next_ukey)
        #call["created_at"] = datetime.utcnow()
        #call["updated_at"] = None

        # Insert cloned record
        calls_collection.insert_one(call)

        return {
            "status": status.HTTP_201_CREATED,
            "message": f"Call (cloned from {old_id}) created successfully",
            "data": convert_to_jsonable(call)
        }

    except Exception as e:
        return get_error_details(e)

@calls.post("/calls/details/get/{ukey}")
async def get_call_by_id(ukey: str, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        call = calls_collection.find_one(
            {
                "ukey": str(ukey),
                "tenant_id": user_detail["tenant_id"],
                "deleted": {"$ne": 1}
            },
            NO_ID_PROJECTION
        )

        if call:
            # Basic owner and user details
            call["owner_details"] = db.users.find_one({"id": call.get("owner_id")}, NO_ID_PROJECTION)
            call["user_details"] = db.users.find_one({"id": call.get("user_id")}, NO_ID_PROJECTION)

            # Safe related_to_details
            related_to_collection = call.get("related_to")
            related_to_id = call.get("related_to_id")
            if related_to_collection and related_to_id:
                call["related_to_details"] = db[related_to_collection].find_one({"id": related_to_id}, NO_ID_PROJECTION)
                call["notes"] = db.notes.list({"related_to":related_to_collection , "related_to_id": related_to_id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}}, NO_ID_PROJECTION)
            else:
                call["related_to_details"] = []
                call["notes"] = []

            # Safe call_for_details
            call_for_collection = call.get("call_for")
            call_for_id = call.get("call_for_id")
            if call_for_collection and call_for_id:
                call["call_for_details"] = db[call_for_collection].find_one({"id": call_for_id}, NO_ID_PROJECTION)
            else:
                call["call_for_details"] = []

            return {
                "status": status.HTTP_200_OK,
                "message": "Record retrieved successfully",
                "data": convert_to_jsonable(call)
            }

        return {
            "status": status.HTTP_404_NOT_FOUND,
            "message": "Record not found",
            "data": None
        }

    except Exception as e:
        return get_error_details(e)

@calls.get("/calls/{id}/deleted/{value}")
async def toggle_call_deletion(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Soft delete or restore a call by toggling the 'deleted' flag.
    """
    try:
        calls_collection.update_one({"id": id, "tenant_id": user_detail["tenant_id"]}, {"$set": {"deleted": value}})
        message = "Record deleted successfully" if value else "Record restored successfully"
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": None
        }
    except Exception as e:
        return get_error_details(e)

@calls.post("/calls/get-by-related")
async def get_calls_by_related(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get calls by related_to and related_to_id.
    """
    try:
        form = await request.form()
        calls = list(calls_collection.find(
            {
                "related_to": form["related_to"], 
                "related_to_id": int(form["related_to_id"]), 
                "tenant_id": user_detail["tenant_id"], 
                "deleted": {"$ne": 1}
            }, 
            NO_ID_PROJECTION
        ).sort("id", -1))
        
        records = []
        if calls:
            for call in calls:
                # Get user information for owner
                owner = db.users.find_one(
                    {"id": call.get("owner_id")},
                    NO_ID_PROJECTION
                )
                call["owner"] = owner or {}
                
                # Get user information for user_id
                user = db.users.find_one(
                    {"id": call.get("user_id")},
                    NO_ID_PROJECTION
                )
                call["user"] = user or {}
                
                records.append(call)
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": convert_to_jsonable(records)
        }
    except Exception as e:
        return get_error_details(e)

@calls.post("/calls/get-grouped-by-status")
async def get_calls_grouped_by_status(user_detail: dict = Depends(oauth2.get_user_by_token)):

    try:
        # Get all calls for the tenant
        calls = list(calls_collection.find(
            {"tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
            NO_ID_PROJECTION
        ).sort("id", -1))

        # Group calls by status
        grouped_calls = {}
        
        if calls:
            for call in calls:
                status_value = call.get("purpose", "Unknown")
                
                # Get user information for owner
                owner = db.users.find_one(
                    {"id": call.get("owner_id")},
                    NO_ID_PROJECTION
                )
                call["owner"] = owner or {}
                
                # Get user information for user_id
                user = db.users.find_one(
                    {"id": call.get("user_id")},
                    NO_ID_PROJECTION
                )
                call["user"] = user or {}
                
                # Add call to the appropriate status group
                if status_value not in grouped_calls:
                    grouped_calls[status_value] = []
                grouped_calls[status_value].append(call)

        return {
            "status": status.HTTP_200_OK,
            "message": "Calls grouped by status retrieved successfully",
            "data": convert_to_jsonable(grouped_calls)
        }
    except Exception as e:
        return get_error_details(e)

@calls.post("/calls/update-purpose")
async def update_call_purpose(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    
    try:
        form = await request.form()
        id = int(form.get("id"))
        purpose_value = str(form.get("purpose"))
        
        # Update existing call
        call_data = CallUpdatePurpose()
        #call_data.status = status_value
        call_data.purpose = purpose_value
        
        calls_collection.update_one(
            {"id": id, "tenant_id": user_detail["tenant_id"]}, 
            {"$set": call_data.dict()}
        )
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Call updated successfully",
            "data": convert_to_jsonable(call_data.dict())
        }
                
    except Exception as e:
        return get_error_details(e)

@calls.post("/calls/bulk-delete")
async def bulk_delete(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    try:
        
        form = await request.form()
        raw_ids = form.get("ids")  # e.g., "[1, 2, 3]"

        if not raw_ids:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "No IDs provided for deletion."
            }

        try:
            ids = json.loads(raw_ids)
        except Exception:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "IDs must be a valid JSON array."
            }

        if not isinstance(ids, list):
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "IDs must be a list."
            }

        result = calls_collection.update_many(
            {
                "id": {"$in": ids},
                "tenant_id": user_detail["tenant_id"]
            },
            {
                "$set": {"deleted": 1}
            }
        )

        return {
            "status": status.HTTP_200_OK,
            "message": f"{result.modified_count} call(s) soft deleted successfully.",
            "modified_count": result.modified_count
        }

    except Exception as e:
        return get_error_details(e)

@calls.post("/calls/bulk-update")
async def bulk_update(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    try:
        form = await request.form()
        ids = json.loads(form.get("ids"))  # stringified array from frontend
        subject = form.get("subject")
        agenda = form.get("agenda")
        purpose_raw = form.get("purpose")

        # Check if at least one field is provided
        if not any([subject, agenda, purpose_raw]):
            return {
                "status": status.HTTP_422_UNPROCESSABLE_ENTITY,
                "message": "At least one of subject, agenda, or purpose must be provided."
            }

        # Parse nested JSON if needed
        purpose = json.loads(purpose_raw) if purpose_raw else None

        update_fields = {}
        if subject:
            update_fields["subject"] = subject
        if agenda:
            update_fields["agenda"] = agenda
        if purpose and "value" in purpose:
            update_fields["purpose"] = purpose["value"]

        # Update records matching ids and tenant
        result = await calls_collection.update_many(
            {
                "id": {"$in": ids},
                "tenant_id": user_detail["tenant_id"],
                "deleted": {"$ne": 1}
            },
            {"$set": update_fields}
        )

        return {
            "status": status.HTTP_200_OK,
            "message": f"{result.modified_count} calls updated successfully",
            "updated_count": result.modified_count
        }

    except Exception as e:
        return get_error_details(e)
"""
# ===============================
# OLD CRUD for CALLS - ending
# =============================== 