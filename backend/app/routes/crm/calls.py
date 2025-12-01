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
from app.models.crm.calls import CallCreate, CallUpdate, CallUpdatePurpose, CallUpdateStatus, CallInDB
from app.helpers.globalfunctions import build_crm_query, QUERY_TYPE_ALL, QUERY_TYPE_OWNED, QUERY_TYPE_TODAY
from app.helpers.crm_helper import get_entity_details, log_activity

# Router
calls = APIRouter(tags=["CRM Admin - Calls"])

# MongoDB Collection
calls_collection = db.calls

# Projection to exclude MongoDB _id
NO_ID_PROJECTION = {"_id": 0}

def get_calls_statuses() -> dict:

    try:
        statuses = list(db.calls_statuses.find({"deleted": {"$ne": 1}}, NO_ID_PROJECTION).sort("id", 1))
        return statuses
        
    except Exception:
        statuses = [
            {"id": 1, "name": "Scheduled"},
            {"id": 2, "name": "Connected Calls"},
            {"id": 3, "name": "Missed"},
            {"id": 4, "name": "Over Due"},
            {"id": 5, "name": "Completed"},
        
        ]
        return statuses




def get_laster_activity_details(call: dict, user_detail: dict) -> str:
    """
    Get the last activity date for a call from activity_logs_collection.
    
    Args:
        call: Call document
        user_detail: User details containing tenant_id
        
    Returns:
        Date string from the latest activity timestamp, or empty string if no activity found
    """
    try:
        call_id = call.get("id")
        tenant_id = user_detail.get("tenant_id")
        
        if not call_id:
            return ""
        
        # Get activity logs collection
        activity_logs_collection = db.activity_logs
        
        # Query for the last activity log for this call (use createdon)
        last_activity = activity_logs_collection.find_one(
            {
                "entity_type": "call",
                "entity_id": int(call_id),
                "tenant_id": int(tenant_id),
                "deleted": {"$ne": 1}
            },
            NO_ID_PROJECTION,
            sort=[("createdon", -1)]  # Sort by createdon descending to get latest
        )
        
        if last_activity and last_activity.get("createdon"):
            timestamp = last_activity.get("createdon")
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
        print(f"Error getting last activity for call {call.get('id')}: {e}")
        return ""


# ===============================
# CRUD for CALLS - starting
# ===============================

def calculate_duration_from_times(start_time_str: str, end_time_str: str) -> Optional[int]:
    """
    Calculate duration in minutes (as integer) from start_time and end_time ISO strings.
    
    Args:
        start_time_str: ISO format start time string
        end_time_str: ISO format end time string
        
    Returns:
        Duration in minutes as integer, or None if invalid
    """
    try:
        if not start_time_str or not end_time_str:
            return None
        
        # Parse both times to datetime objects
        def _parse_iso_naive_utc(value: str):
            try:
                dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
                if dt.tzinfo is not None:
                    dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
                return dt
            except Exception:
                return None
        
        start_dt = _parse_iso_naive_utc(start_time_str)
        end_dt = _parse_iso_naive_utc(end_time_str)
        
        if not start_dt or not end_dt:
            return None
        
        # Calculate difference in seconds
        delta = end_dt - start_dt
        total_seconds = int(delta.total_seconds())
        
        if total_seconds < 0:
            return None  # Invalid if end_time is before start_time
        
        # Convert to minutes (exact minutes as integer)
        minutes = total_seconds // 60
        
        return minutes
    except Exception:
        return None

def parse_duration_to_minutes(duration_str: str) -> int:
    """
    Parse duration string to minutes. Supports formats like '5m 30s', '5:30', '90s', '90', '90m'
    
    Args:
        duration_str: Duration string in various formats
        
    Returns:
        Duration in minutes as integer, or None if parsing fails
    """
    try:
        # Try to parse as integer (assumed minutes)
        if duration_str.isdigit():
            return int(duration_str)
        
        # Try format "5m 30s" or "5m" or "30s"
        if "m" in duration_str or "s" in duration_str:
            parts = duration_str.replace("m", " m ").replace("s", " s ").split()
            total_minutes = 0
            total_seconds = 0
            i = 0
            while i < len(parts):
                if parts[i].isdigit():
                    val = int(parts[i])
                    if i + 1 < len(parts) and parts[i + 1] == "m":
                        total_minutes += val
                        i += 2
                    elif i + 1 < len(parts) and parts[i + 1] == "s":
                        total_seconds += val
                        i += 2
                    else:
                        total_minutes += val
                        i += 1
                else:
                    i += 1
            return total_minutes + (total_seconds // 60)
        
        # Try format "5:30" (mm:ss) - treat as minutes:seconds
        if ":" in duration_str:
            parts = duration_str.split(":")
            if len(parts) == 2:
                minutes = int(parts[0]) if parts[0].isdigit() else 0
                seconds = int(parts[1]) if parts[1].isdigit() else 0
                return minutes + (seconds // 60)
        
        # Default: try as minutes
        return int(duration_str)
    except Exception:
        return None

def build_calls_filter_query(user_detail: dict, view: str = "all_calls", subject: str = "", 
                           start_time: str = "", duration: str = "", related_to: str = "", 
                           owner_id: str = "", assigned_to_id: str = "", today_date: str = "") -> dict:
    """
    Build MongoDB query for filtering calls based on various criteria.
    
    Args:
        user_detail: User details containing tenant_id and id
        view: View type for filtering (all_calls, calls_today, etc.)
        subject: Subject filter (case-insensitive regex)
        start_time: Start time filter
        duration: Duration filter (case-insensitive regex)
        related_to: Related entity name filter
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
        # Filter for calls created today based on createdon; support provided today_date (ISO) or default to today UTC
        def _parse_iso_naive_utc(value: str):
            try:
                dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
                if dt.tzinfo is not None:
                    dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
                return dt
            except Exception:
                return None
        base_dt = _parse_iso_naive_utc(today_date) if today_date else None
        base_dt = base_dt if base_dt is not None else datetime.utcnow()
        start_day = base_dt.replace(hour=0, minute=0, second=0, microsecond=0)
        end_day = start_day + timedelta(days=1)
        query["$or"] = [
            {"createdon": {"$gte": start_day.isoformat() + "+00:00", "$lt": end_day.isoformat() + "+00:00"}},
            {"$expr": {"$and": [
                {"$gte": [{"$toDate": "$createdon"}, start_day]},
                {"$lt": [{"$toDate": "$createdon"}, end_day]}
            ]}},
        ]
    elif view == "start_time":
        # Filter for calls scheduled/started today (UTC) based on start_time
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today + timedelta(days=1)
        query["start_time"] = {"$gte": today.isoformat() + "+00:00", "$lt": tomorrow.isoformat() + "+00:00"}
        
    elif view == "calls_this_week":
        # Filter for calls in the last 7 days based on createdon (ISO string like "2025-10-29T12:04:53.951+00:00")
        week_ago = datetime.utcnow() - timedelta(days=7)
        week_ago_iso = week_ago.isoformat() + "+00:00"
        # Handle createdon as ISO string (direct comparison) or as Date via $toDate conversion
        query["$or"] = [
            {"createdon": {"$gte": week_ago_iso}},
            {
                "$expr": {
                    "$gte": [{"$toDate": "$createdon"}, week_ago]
                }
            }
        ]
        
    elif view == "missed_calls":
        # Filter for missed calls
        query["status_id"] = {"$in": [3, 4]}
        
    elif view == "connected_calls":
        # Filter for connected/successful calls
        query["status_id"] = 2
        
    elif view == "my_calls":
        # Filter for calls owned by current user
        query["user_id"] = int(user_detail["id"])
        
    elif view == "favorite_calls":
        # Filter for favorite calls (assuming there's a favorite field)
        query["favorite"] = 1
    elif view == "related_to_contacts":
        query["related_to"] = "contacts"
    elif view == "related_to_leads":
        query["related_to"] = "leads"
    elif view == "related_to_accounts":
        query["related_to"] = "accounts"
    elif view == "related_to_deals":
        query["related_to"] = "deals"
  
    # Apply search filters
    if subject:
        query["subject"] = {"$regex": subject, "$options": "i"}
        
    if start_time:
        # Handle start_time filtering - parse the provided start_time parameter and compare
        def _parse_iso_naive_utc(value: str):
            try:
                dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
                if dt.tzinfo is not None:
                    dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
                return dt
            except Exception:
                return None
        
        start_time_dt = _parse_iso_naive_utc(start_time)
        if start_time_dt is not None:
            # Build exact calendar-day range in UTC for the provided start_time
            day_start = start_time_dt.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            # Support both ISO string and Date storage via $toDate
            start_time_filter = {
                "$or": [
                    {"start_time": {"$gte": day_start.isoformat() + "+00:00", "$lt": day_end.isoformat() + "+00:00"}},
                    {
                        "$expr": {
                            "$and": [
                                {"$gte": [{"$toDate": "$start_time"}, day_start]},
                                {"$lt": [{"$toDate": "$start_time"}, day_end]}
                            ]
                        }
                    }
                ]
            }
            # Merge with existing $or if present (from view filters), otherwise add directly
            if "$or" in query:
                # Wrap both conditions in $and to combine them
                query = {"$and": [query, start_time_filter]}
            else:
                query.update(start_time_filter)
        else:
            # If parsing fails, fallback to case-insensitive regex
            query["start_time"] = {"$regex": start_time, "$options": "i"}
            
    if duration:
        # Calculate duration from start_time and end_time in DB, then compare with provided duration (in minutes)
        duration_minutes = parse_duration_to_minutes(duration)
        if duration_minutes is not None:
            # Calculate duration from start_time and end_time, then compare in minutes
            # Convert both to dates, subtract to get milliseconds, divide by 1000 for seconds, divide by 60 for minutes
            # Round to nearest minute for comparison
            duration_filter = {
                "$expr": {
                    "$and": [
                        {"$ne": [{"$ifNull": ["$start_time", None]}, None]},
                        {"$ne": [{"$ifNull": ["$end_time", None]}, None]},
                        {
                            "$eq": [
                                duration_minutes,
                                {
                                    "$round": [
                                        {
                                            "$divide": [
                                                {
                                                    "$subtract": [
                                                        {"$toDate": "$end_time"},
                                                        {"$toDate": "$start_time"}
                                                    ]
                                                },
                                                60000  # milliseconds to minutes
                                            ]
                                        },
                                        0  # round to nearest integer
                                    ]
                                }
                            ]
                        }
                    ]
                }
            }
            # Merge with existing query conditions properly
            if "$and" in query:
                # If $and exists as a list, append to it
                if isinstance(query["$and"], list):
                    query["$and"].append(duration_filter)
                else:
                    # If $and exists as a dict, wrap both in a new $and array
                    query = {"$and": [query["$and"], duration_filter]}
            elif "$or" in query or "$expr" in query:
                # Wrap existing conditions and new filter in $and
                existing_conditions = {k: v for k, v in query.items() if k not in ["$or", "$expr", "$and"]}
                and_conditions = []
                if "$or" in query:
                    and_conditions.append({"$or": query["$or"]})
                if "$expr" in query:
                    and_conditions.append({"$expr": query["$expr"]})
                if existing_conditions:
                    and_conditions.append(existing_conditions)
                and_conditions.append(duration_filter)
                query = {"$and": and_conditions}
            else:
                query.update(duration_filter)
        else:
            # If parsing fails, fallback to regex on duration field
            query["duration"] = {"$regex": duration, "$options": "i"}
        
    if related_to:
        query["related_to"] = related_to
    
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
    if call is None:
        raise ValueError("Call document is None, cannot enrich call data")
    
    tenant_id = user_detail["tenant_id"]
    
    # Get owner_details (user information for owner)
    owner = db.users.find_one(
        {"id": call.get("owner_id")},
        NO_ID_PROJECTION
    )
    call["owner_details"] = owner or {}
    call["owner"] = owner or {}  # Keep for backward compatibility
    
    # Get user information for user_id
    user = db.users.find_one(
        {"id": call.get("user_id")},
        NO_ID_PROJECTION
    )
    call["user_details"] = user or {}
    
    # Get assigned user information if assigned_to_id exists
    if call.get("assigned_to_id"):
        assigned_user = db.users.find_one(
            {"id": call.get("assigned_to_id")},
            NO_ID_PROJECTION
        )
        call["assigned_to_details"] = assigned_user or {}
    else:
        call["assigned_to_details"] = {}
    
    # Get caller_details based on caller_id (typically a phone number or contact reference)
    # First try to parse caller_id as an integer ID for contact lookup
    caller_id = call.get("caller_id", "")
    if caller_id:
        try:
            # Try to parse as integer for database lookup
            caller_id_int = int(caller_id)
            # Try to find in contacts first
            caller = db.contacts.find_one(
                {"id": caller_id_int, "tenant_id": tenant_id, "deleted": {"$ne": 1}},
                NO_ID_PROJECTION
            )
            if not caller:
                # If not found in contacts, try leads
                caller = db.leads.find_one(
                    {"id": caller_id_int, "tenant_id": tenant_id, "deleted": {"$ne": 1}},
                    NO_ID_PROJECTION
                )
            call["caller_details"] = caller or {}
        except (ValueError, TypeError):
            # If caller_id is not an integer (e.g., phone number string), store as is
            call["caller_details"] = {"caller_id": caller_id}
    else:
        call["caller_details"] = {}
    
    # Get call_for_details
    if call.get("call_for") and call.get("call_for_id"):
        call_for_details = get_related_entity_data(
            call["call_for"], 
            call["call_for_id"], 
            tenant_id
        )
        call["call_for_details"] = call_for_details
        
        # Special handling: if call_for is "contacts" and the contact has related_to
        if call["call_for"] == "contacts" and call_for_details:
            contact_related_to = call_for_details.get("related_to")
            contact_related_to_id = call_for_details.get("related_to_id")
            
            if contact_related_to and contact_related_to_id:
                # Fetch related_to_details from the collection specified in related_to
                call["related_to_details"] = get_related_entity_data(
                    contact_related_to,
                    contact_related_to_id,
                    tenant_id
                )
            else:
                call["related_to_details"] = {}
        # Also handle related_to for other entity types (leads, accounts, deals)
        elif call_for_details:
            entity_related_to = call_for_details.get("related_to")
            entity_related_to_id = call_for_details.get("related_to_id")
            
            if entity_related_to and entity_related_to_id:
                call["related_to_details"] = get_related_entity_data(
                    entity_related_to,
                    entity_related_to_id,
                    tenant_id
                )
            else:
                call["related_to_details"] = {}
        else:
            call["related_to_details"] = {}
    else:
        call["call_for_details"] = {}
        call["related_to_details"] = {}
    
    # Handle the call's own related_to field separately if it exists and is different from call_for's related_to
    if call.get("related_to") and call.get("related_to_id"):
        # If related_to_details is still empty, populate it from call's own related_to
        if not call.get("related_to_details"):
            call["related_to_details"] = get_related_entity_data(
                call["related_to"], 
                call["related_to_id"], 
                tenant_id
            )
        # Also keep related_entity for backward compatibility
        call["related_entity"] = get_related_entity_data(
            call["related_to"], 
            call["related_to_id"], 
            tenant_id
        )
    else:
        call["related_entity"] = {}
    
    return call
# Generate line chart data based on actual historical data
def generate_line_chart_data_from_calls(calls_collection, base_query, end_date, metric_type="total"):
    """
    Generate line chart data based on actual historical data for the last 7 days
    
    Args:
        calls_collection: MongoDB collection
        base_query: Base query dict (without date range in start_time, will be added per day)
        end_date: datetime object for the end of the date range
        metric_type: Type of metric to generate (total, missed, connected, duration)
    """
    data = []
    
    for i in range(7):
        # Calculate date for this day
        current_date = end_date - timedelta(days=6-i)
        start_of_day = current_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = current_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Build query for this specific day
        # Remove $or from base_query if it exists to avoid conflicts
        day_query = {k: v for k, v in base_query.items() if k != "$or"}
        day_query["$or"] = [
            {"start_time": {"$gte": start_of_day.isoformat(), "$lte": end_of_day.isoformat()}},
            {"start_time": {"$gte": start_of_day, "$lte": end_of_day}}
        ]
        
        # Count based on metric type
        if metric_type == "total":
            count = calls_collection.count_documents(day_query)
        elif metric_type == "missed":
            # status_id "3" (Missed) and "4" (Over Due)
            count = calls_collection.count_documents({**day_query, "status_id": {"$in": ["3", "4"]}})
        elif metric_type == "connected":
            # status_id "5" (Completed)
            count = calls_collection.count_documents({**day_query, "status_id": "5"})
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
        
        # Use the same ISO parser as leads: parses ISO string and normalizes to naive UTC
        def _parse_iso_naive_utc(value: str) -> datetime:
            try:
                dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
                if dt.tzinfo is not None:
                    dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
                return dt
            except Exception:
                return None

        from_date = _parse_iso_naive_utc(from_date_str)
        to_date = _parse_iso_naive_utc(to_date_str)
        if not from_date or not to_date:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "Invalid date format. Use ISO 8601 (e.g. 2025-10-28T19:00:00.000Z)",
                "data": None
            }
        
        # Normalize dates: from_date to start of day, to_date to end of day
        # This ensures that selecting the same date returns data for the entire day
        from_date = from_date.replace(hour=0, minute=0, second=0, microsecond=0)
        to_date = to_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # 1) Fetch call ids from activity_logs within date range
        al_date_filter = {
            "$or": [
                {"createdon": {"$gte": from_date.isoformat(), "$lte": to_date.isoformat()}},
                {
                    "$expr": {
                        "$and": [
                            {"$gte": [{"$toDate": "$createdon"}, from_date]},
                            {"$lte": [{"$toDate": "$createdon"}, to_date]}
                        ]
                    }
                }
            ]
        }
        al_query = {
            "tenant_id": tenant_id,
            "deleted": {"$ne": 1},
            "entity_type": "call",
            **al_date_filter,
        }
        activity_logs = list(db.activity_logs.find(al_query, {"_id": 0, "entity_id": 1}))
        call_ids = [int(a.get("entity_id")) for a in activity_logs if a.get("entity_id") is not None]

        # Guard: if no ids, short-circuit to zeros
        if not call_ids:
            return {
                "status": status.HTTP_200_OK,
                "message": "Call statistics retrieved successfully",
                "data": [
                    {
                        "icon":"/icons/call_in_out_icon.svg",
                        "iconClass":"",
                        "title":"Total Calls Made",
                        "total": 0,
                        "change": 0,
                        "description": "",
                        "lineChartData": []
                    },
                    {
                        "icon":"/icons/call_missed_icon.svg",
                        "iconClass":"",
                        "title": "Missed/Non-Shows",
                        "total": 0,
                        "change": 0,
                        "description": "",
                        "lineChartData": []
                    },
                    {
                        "icon":"/icons/call_connected_icon.svg",
                        "iconClass":"",
                        "title": "Connected Calls",
                        "total": 0,
                        "change": 0,
                        "description": "",
                        "lineChartData": []
                    },
                    {
                        "icon":"/icons/call_duration_icon.svg",
                        "iconClass":"",
                        "title": "Average Call Duration",
                        "total": "0m",
                        "change": 0,
                        "description": "Short (<2m): 0 | Medium (2-10m): 0 | Long (>10m): 0",
                        "lineChartData": []
                    },
                ],
                "date_range": {
                    "from": from_date.isoformat(),
                    "to": to_date.isoformat()
                },
                "tenant_id": tenant_id
            }

        # 2) Build calls query scoped to the fetched ids
        base_query = {
            "tenant_id": tenant_id,"duration": {"$exists": True, "$nin": [None, 0, ""]},
            "deleted": {"$ne": 1},
            "id": {"$in": call_ids},
        }
        
        # total calls considered in-range: number of calls matched by ids
        total_calls = calls_collection.count_documents(base_query)
        
        # Get missed calls - status_id "3" (Missed) and "4" (Over Due)
        missed_calls_query = {**base_query, "status_id": {"$in": [3, 4]}}
        missed_calls = calls_collection.count_documents(missed_calls_query)
        
        # Get connected calls - status_id "5" (Completed)
        connected_calls_query = {**base_query, "status_id": 2}
        connected_calls = calls_collection.count_documents(connected_calls_query)
        
        # Calculate average call duration (duration stored as integer minutes)
        calls_with_duration = list(calls_collection.find(
            {**base_query, "duration": {"$type": "int", "$gt": 0}},
            {"duration": 1, "_id": 0}
        ))
        
        total_duration_minutes = 0
        valid_durations = 0
        
        for call in calls_with_duration:
            duration_value = call.get("duration")
            if isinstance(duration_value, int) and duration_value > 0:
                total_duration_minutes += duration_value
                valid_durations += 1
        
        # Calculate average duration (only minutes)
        if valid_durations > 0:
            avg_minutes = int(round(total_duration_minutes / valid_durations))
            average_calls = f"{avg_minutes}m"
        else:
            average_calls = "0m"
        
        # Calculate percentage changes (comparing with previous period)
        # Calculate the previous period (same duration before the current period)
        period_duration = max(1, (to_date - from_date).days)
        previous_from_date = from_date - timedelta(days=period_duration)
        previous_to_date = from_date
        
        # Build previous period query with same date filter pattern
        previous_date_filter = {
            "$or": [
                {"start_time": {"$gte": previous_from_date, "$lte": previous_to_date}},
                {
                    "$expr": {
                        "$and": [
                            {"$gte": [{"$toDate": "$start_time"}, previous_from_date]},
                            {"$lte": [{"$toDate": "$start_time"}, previous_to_date]}
                        ]
                    }
                }
            ]
        }
        # previous period ids via activity logs
        prev_al_date_filter = {
            "$or": [
                {"createdon": {"$gte": previous_from_date.isoformat(), "$lte": previous_to_date.isoformat()}},
                {
                    "$expr": {
                        "$and": [
                            {"$gte": [{"$toDate": "$createdon"}, previous_from_date]},
                            {"$lte": [{"$toDate": "$createdon"}, previous_to_date]}
                        ]
                    }
                }
            ]
        }
        prev_al_query = {
            "tenant_id": tenant_id,
            "deleted": {"$ne": 1},
            "entity_type": "call",
            **prev_al_date_filter,
        }
        prev_activity_logs = list(db.activity_logs.find(prev_al_query, {"_id": 0, "entity_id": 1}))
        prev_call_ids = [int(a.get("entity_id")) for a in prev_activity_logs if a.get("entity_id") is not None]
        previous_base_query = {"tenant_id": tenant_id, "deleted": {"$ne": 1}, "id": {"$in": prev_call_ids or [0]}}
        
        # Get previous period counts
        previous_total_calls = calls_collection.count_documents(previous_base_query)
        previous_missed_calls = calls_collection.count_documents({**previous_base_query, "status_id": {"$in": [3, 4]}})
        previous_connected_calls = calls_collection.count_documents({**previous_base_query, "status_id": 2})
        
        # Calculate previous period average duration (duration stored as integer minutes)
        previous_calls_with_duration = list(calls_collection.find(
            {**previous_base_query, "duration": {"$type": "int", "$gt": 0}},
            {"duration": 1, "_id": 0}
        ))
        
        previous_total_duration_minutes = 0
        previous_valid_durations = 0
        
        for call in previous_calls_with_duration:
            duration_value = call.get("duration")
            if isinstance(duration_value, int) and duration_value > 0:
                previous_total_duration_minutes += duration_value
                previous_valid_durations += 1
        
        # Calculate percentage changes
        def calculate_percentage_change(current, previous):
            if previous == 0:
                return 100.0 if current > 0 else 0.0
            return round(((current - previous) / previous) * 100, 1)
        
        total_calls_percent = calculate_percentage_change(total_calls, previous_total_calls)
        missed_calls_percent = calculate_percentage_change(missed_calls, previous_missed_calls)
        connected_calls_percent = calculate_percentage_change(connected_calls, previous_connected_calls)
        
        # Calculate average duration percentage change
        if previous_valid_durations > 0:
            previous_avg_minutes = previous_total_duration_minutes / previous_valid_durations
        else:
            previous_avg_minutes = 0
            
        if valid_durations > 0:
            current_avg_minutes = total_duration_minutes / valid_durations
        else:
            current_avg_minutes = 0
            
        average_calls_percent = calculate_percentage_change(current_avg_minutes, previous_avg_minutes)
        
        
        # Purpose mapping for display
        purpose_labels = {
            "1": "Prospecting",
            "2": "Administrative",
            "3": "Negotiation",
            "4": "Demo",
            "5": "Project",
            "6": "Desk"
        }
        
        # Get additional breakdown data for descriptions
        # Get calls by purpose/type for team breakdown
        purpose_breakdown = list(calls_collection.aggregate([
            {"$match": base_query},
            {"$group": {"_id": {"$ifNull": ["$purpose", "Unknown"]}, "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]))
        
        # Get calls by type (inbound/outbound)
        type_breakdown = list(calls_collection.aggregate([
            {"$match": base_query},
            {"$group": {"_id": {"$ifNull": ["$type", "Unknown"]}, "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]))
        
        # Get duration breakdown
        duration_breakdown = list(calls_collection.find(
            {**base_query, "duration": {"$type": "int", "$gt": 0}},
            {"duration": 1, "_id": 0}
        ))
        
        short_calls = 0
        medium_calls = 0
        long_calls = 0
        
        for call in duration_breakdown:
            duration_value = call.get("duration")
            if isinstance(duration_value, int) and duration_value > 0:
                minutes_val = duration_value
                if minutes_val < 2:
                    short_calls += 1
                elif minutes_val <= 10:
                    medium_calls += 1
                else:
                    long_calls += 1
        
        # Build descriptions with actual data - map purpose IDs to labels
        purpose_desc = " | ".join([
            f"{purpose_labels.get(str(p['_id']), p['_id'])}: {p['count']}" 
            for p in purpose_breakdown[:3]
        ])
        # Live inbound/outbound split
        inbound_count = next((t["count"] for t in type_breakdown if (t["_id"] or "").lower() == "inbound"), 0)
        outbound_count = next((t["count"] for t in type_breakdown if (t["_id"] or "").lower() == "outbound"), 0)
        type_desc = f"Inbound: {inbound_count} | Outbound: {outbound_count}"
        
        # Build dashboard view data
        dashboard_view = [
            {
                "icon":"/icons/call_in_out_icon.svg",
                "iconClass":"",
                "title":"Total Calls Made",
                "total": total_calls,
                "change": total_calls_percent,
                # Live team penetration approximation: share of connected over total
                "description": f"{purpose_desc} | Calls Penetration: {round((connected_calls/total_calls)*100, 2) if total_calls>0 else 0}%",
                "lineChartData": generate_line_chart_data_from_calls(calls_collection, base_query, to_date, "total")
            },
            {
                "icon":"/icons/call_missed_icon.svg",
                "iconClass":"",
                "title": "Missed/Non-Shows",
                "total": missed_calls,
                "change": missed_calls_percent,
                # Live missed split by status categories (3=Missed, 4=Over Due)
                "description": f"Missed: {calls_collection.count_documents({**base_query, 'status_id': 3})} | Over Due: {calls_collection.count_documents({**base_query, 'status_id': 4})}",
                "lineChartData": generate_line_chart_data_from_calls(calls_collection, base_query, to_date, "missed")
            },
            {
                "icon":"/icons/call_connected_icon.svg",
                "iconClass":"",
                "title": "Connected Calls",
                "total": connected_calls,
                "change": connected_calls_percent,
                "description": type_desc,
                "lineChartData": generate_line_chart_data_from_calls(calls_collection, base_query, to_date, "connected")
            },
            {
                "icon":"/icons/call_duration_icon.svg",
                "iconClass":"",
                "title": "Average Call Duration",
                "total": average_calls,
                "change": average_calls_percent,
                "description": f"Short (<2m): {short_calls} | Medium (2-10m): {medium_calls} | Long (>10m): {long_calls}",
                "lineChartData": generate_line_chart_data_from_calls(calls_collection, base_query, to_date, "duration")
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
    """
    Get calls with filters and pagination, mirroring leads get endpoint.
    Accepts JSON or form with filters listed by the user.
    """
    try:
        try:
            payload = await request.json()
        except Exception:
            payload = dict(await request.form())
        
        # Extract filter parameters
        view = str(payload.get("view", "all_calls")).strip()
        subject = str(payload.get("subject", "")).strip()
        start_time = str(payload.get("start_time", "")).strip()
        duration = str(payload.get("duration", "")).strip()
        related_to = str(payload.get("related_to", "")).strip()
        owner_id = str(payload.get("owner_id", "")).strip()
        assigned_to_id = str(payload.get("assigned_to_id", "")).strip()
        today_date = str(payload.get("today_date", "")).strip()
        
        page = int(payload.get("page", 1))
        limit = int(payload.get("limit", 20))
        skip = (page - 1) * limit
        
        # Build query using the separate function
        query = build_calls_filter_query(
            user_detail=user_detail,
            view=view,
            subject=subject,
            start_time=start_time,
            duration=duration,
            related_to=related_to,
            owner_id=owner_id,
            assigned_to_id=assigned_to_id,
            today_date=today_date
        )
        
        # Get total count for pagination
        total_count = calls_collection.count_documents(query)
        
        # Execute query with pagination
        calls_list = list(
            calls_collection.find(query, NO_ID_PROJECTION).sort("id", -1).skip(skip).limit(limit)
        )

        # Enrich call data using the separate function
        records = []
        for call in calls_list:
            call["last_activity_date"] = get_laster_activity_details(call, user_detail)
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
                "related_to": related_to,
                "owner_id": owner_id,
                "assigned_to_id": assigned_to_id
            },
            "pagination": {
                "page": page,
                "limit": limit,
                "total_count": total_count,
                "total_pages": (total_count + limit - 1) // limit,
                "returned_count": len(records),
            },
        }
    except Exception as e:
        return get_error_response(e)


@calls.get("/crm/calls/get-related-calls/{module}/{id}")
async def get_related_calls(
    module: str,
    id: int,
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    try:
        tenant_id = user_detail["tenant_id"]

        # Optional payload for filters (future use)
        try:
            payload = await request.json()
        except Exception:
            payload = dict(await request.form())

        # Query to find related calls
        filters = {
            "call_for": module,
            "call_for_id": id,
            "tenant_id": tenant_id,
            "deleted": {"$ne": 1},
        }

        calls_list = list(
            calls_collection.find(filters, {"_id": 0}).sort("id", -1)
        )

        # Enrich call data
        records = []
        for call in calls_list:
            enriched_call = enrich_call_data(call, user_detail)
            records.append(enriched_call)

        return {
            "status": status.HTTP_200_OK,
            "message": "Related calls retrieved successfully",
            "data": convert_to_jsonable(records),
            "summary": {"total_calls": len(records)},
        }

    except Exception as e:
        return get_error_details(e)




@calls.get("/crm/calls/details/get/{id}")
async def get_call_details_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    return get_entity_details("call", id, user_detail)

# ===============================
# CRUD for CALLS - ending
# ===============================




@calls.post("/crm/calls/save")
async def save_call(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Create or update a call record.
    Mirrors the save pattern used in contacts.
    """
    try:
        form = await request.form()

        # Helpers for coercion
        def to_int(value, default: int = 0) -> int:
            try:
                if value is None or value == "":
                    return default
                return int(value)
            except (ValueError, TypeError):
                return default

        def to_str(value, default: str = "") -> str:
            try:
                return str(value) if value is not None else default
            except Exception:
                return default

        doc_id = to_int(form.get("id", 0), 0)
        next_id = doc_id or get_next_id(calls_collection)

        # Choose schema
        data_obj = CallCreate() if doc_id == 0 else CallUpdate()
        data_obj.id = next_id if doc_id == 0 else doc_id

        # Core fields from payload
        data_obj.call_for = to_str(form.get("call_for", ""))
        data_obj.call_for_id = to_int(form.get("call_for_id", 0), 0)
        data_obj.related_to = to_str(form.get("related_to", ""))
        data_obj.related_to_id = to_int(form.get("related_to_id", 0), 0)
        data_obj.type_id = to_int(form.get("type_id", 0))
        data_obj.status_id = to_int(form.get("status_id", 0), 0)
        data_obj.outgoing_status_id = to_int(form.get("outgoing_status_id", 0), 0)
        data_obj.start_time = to_str(form.get("start_time", ""))
        data_obj.end_time = to_str(form.get("end_time", ""))
        data_obj.assigned_to_id = to_int(form.get("assigned_to_id", 0), 0)
        
        # Calculate duration from start_time and end_time if both are present
        if data_obj.start_time and data_obj.end_time:
            calculated_duration = calculate_duration_from_times(data_obj.start_time, data_obj.end_time)
            if calculated_duration is not None:
                data_obj.duration = calculated_duration  # Integer in minutes
            else:
                # If calculation fails, parse provided duration string to minutes or use 0
                provided_duration_str = to_str(form.get("duration", ""))
                parsed_minutes = parse_duration_to_minutes(provided_duration_str) if provided_duration_str else 0
                data_obj.duration = parsed_minutes or 0
        else:
            # If start_time or end_time is not present, parse provided duration string to minutes or use 0
            provided_duration_str = to_str(form.get("duration", ""))
            parsed_minutes = parse_duration_to_minutes(provided_duration_str) if provided_duration_str else 0
            data_obj.duration = parsed_minutes or 0
        
        data_obj.owner_id = to_int(form.get("owner_id", 0), 0)
        data_obj.subject = to_str(form.get("subject", ""))
        data_obj.reminder_id = to_int(form.get("reminder_id", 0))
        data_obj.purpose_id = to_int(form.get("purpose_id", 0))
        data_obj.agenda = to_str(form.get("agenda", ""))
        data_obj.closed = to_int(form.get("closed", 0), 0)
        data_obj.deletable = to_int(form.get("deletable", 0), 0)
        data_obj.user_id = int(user_detail.get("tenant_id", 0))
        

        # Common metadata
        try:
            data_obj.add_by = int(user_detail.get("id", 0) or 0)
        except Exception:
            data_obj.add_by = 0

        try:
            data_obj.tenant_id = int(user_detail.get("tenant_id", 0) or 0)
        except Exception:
            data_obj.tenant_id = 0

        # Optional flags
        data_obj.active = to_int(form.get("active", 1), 1)
        data_obj.sort_by = to_int(form.get("sort_by", 0), 0)

        # Generate ukey consistently
        data_obj.ukey = f"{data_obj.tenant_id}000{data_obj.id}"

        record = data_obj.dict()

        if doc_id == 0:
            # Check for duplicate calls before inserting
            # Duplicate criteria: same subject + call_for + call_for_id + start_time within same tenant
            if data_obj.subject and (data_obj.call_for or data_obj.start_time):
                duplicate_query = {
                    "tenant_id": data_obj.tenant_id,
                    "deleted": {"$ne": 1},
                    "subject": data_obj.subject
                }
                
                if data_obj.call_for:
                    duplicate_query["call_for"] = data_obj.call_for
                
                if data_obj.call_for_id and data_obj.call_for_id > 0:
                    duplicate_query["call_for_id"] = data_obj.call_for_id
                
                if data_obj.start_time:
                    duplicate_query["start_time"] = data_obj.start_time
                
                existing_call = calls_collection.find_one(duplicate_query, NO_ID_PROJECTION)
                
                if existing_call:
                    duplicate_fields = []
                    if data_obj.subject and existing_call.get("subject") == data_obj.subject:
                        duplicate_fields.append("subject")
                    if data_obj.call_for and existing_call.get("call_for") == data_obj.call_for:
                        duplicate_fields.append("call_for")
                    if data_obj.call_for_id and existing_call.get("call_for_id") == data_obj.call_for_id:
                        duplicate_fields.append("call_for_id")
                    if data_obj.start_time and existing_call.get("start_time") == data_obj.start_time:
                        duplicate_fields.append("start_time")
                    
                    return {
                        "status": status.HTTP_409_CONFLICT,
                        "message": f"Duplicate call found with matching {', '.join(duplicate_fields)}. Call ID: {existing_call.get('id')}",
                        "data": {
                            "duplicate_call_id": existing_call.get("id"),
                            "duplicate_fields": duplicate_fields
                        }
                    }
            
            calls_collection.insert_one(record)
            message = "Call created successfully"
            
            # Log activity for call creation
            log_activity(
                activity_type="call_created",
                entity_type="call",
                entity_id=int(record.get("id", 0)),
                user_detail=user_detail,
                title=f"New call created: {record.get('subject', 'No subject')}",
                description=f"Call created for {record.get('call_for', 'N/A')} - Type: {record.get('type', 'N/A')}",
                metadata={
                    "call_for": record.get("call_for"),
                    "call_for_id": record.get("call_for_id"),
                    "type_id": record.get("type_id"),
                    "purpose_id": record.get("purpose_id"),
                    "start_time": record.get("start_time")
                }
            )
        else:
            calls_collection.update_one({"id": doc_id}, {"$set": record})
            message = "Call updated successfully"
            
            # Log activity for call update
            log_activity(
                activity_type="call_updated",
                entity_type="call",
                entity_id=int(record.get("id", 0)),
                user_detail=user_detail,
                title=f"Call updated: {record.get('subject', 'No subject')}",
                description=f"Call modified for {record.get('call_for', 'N/A')} - Type: {record.get('type', 'N/A')}",
                metadata={
                    "call_for": record.get("call_for"),
                    "call_for_id": record.get("call_for_id"),
                    "type_id": record.get("type_id"),
                    "purpose_id": record.get("purpose_id"),
                    "start_time": record.get("start_time")
                }
            )

        record["editable"] = 1

        # Use the actual ID that was saved (next_id for new calls, doc_id for updates)
        saved_id = next_id if doc_id == 0 else doc_id
        call = calls_collection.find_one({"id": saved_id, "tenant_id": user_detail["tenant_id"]}, NO_ID_PROJECTION)
        enriched_call = enrich_call_data(call, user_detail)

        return json_response(message, convert_to_jsonable(enriched_call))
    except Exception as e:
        return get_error_response(e)


@calls.post("/crm/calls/get/{id}")
async def get_call_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get a single call by ID.
    """
    try:
        record = calls_collection.find_one(
            {"id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
            NO_ID_PROJECTION
        )
        if record:
            # Enrich similar to list endpoint
            record = enrich_call_data(record, user_detail)
            return json_response("Record retrieved successfully", convert_to_jsonable(record))
        return json_response("Record not found", None, status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return get_error_response(e)


@calls.get("/crm/calls/clone/{id}")
async def clone_call_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        record = calls_collection.find_one(
            {"id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
            NO_ID_PROJECTION
        )

        if not record:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Original record not found",
                "data": None
            }

        record.pop("_id", None)
        old_id = record.get("id")
        new_id = get_next_id(calls_collection)

        cursor = calls_collection.find({}, NO_ID_PROJECTION).sort("ukey", -1).limit(1)
        latest_doc = next(cursor, None)
        latest_ukey = int(latest_doc["ukey"]) if latest_doc and "ukey" in latest_doc else 9999
        next_ukey = latest_ukey + 1

        record["id"] = new_id
        record["ukey"] = str(next_ukey)

        calls_collection.insert_one(record)

        return {
            "status": status.HTTP_201_CREATED,
            "message": f"Call (cloned from {old_id}) created successfully",
            "data": convert_to_jsonable(record)
        }
    except Exception as e:
        return get_error_details(e)


@calls.get("/crm/calls/details/get/{ukey}")
async def get_call_by_ukey(ukey: str, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get a single call by ukey with related/enriched data.
    """
    try:
        if not ukey:
            return json_response("Ukey parameter is required", None, status.HTTP_400_BAD_REQUEST)

        record = calls_collection.find_one(
            {"ukey": ukey, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
            NO_ID_PROJECTION
        )

        if not record:
            return json_response("Record not found", None, status.HTTP_404_NOT_FOUND)

        enriched = enrich_call_data(record, user_detail)
        return json_response("Record retrieved successfully", convert_to_jsonable(enriched))
    except Exception as e:
        return get_error_response(e)


@calls.get("/crm/calls/{id}/deleted/{value}")
async def toggle_call_deletion(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Soft delete or restore a call by toggling the 'deleted' flag.
    """
    try:
        calls_collection.update_one({"id": id, "tenant_id": user_detail["tenant_id"]}, {"$set": {"deleted": value}})
        message = "Record deleted successfully" if value else "Record restored successfully"
        return json_response(message)
    except Exception as e:
        return get_error_response(e)


@calls.get("/crm/calls/{id}/favorite/{value}")
async def toggle_call_favorite(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Toggle favorite status for a call by setting the 'favorite' flag.
    Default value is 0 (not favorite), 1 for favorite.
    """
    try:
        calls_collection.update_one({"id": id, "tenant_id": user_detail["tenant_id"]}, {"$set": {"favorite": value}})
        message = "Call marked as favorite" if value else "Call unmarked as favorite"
        
        log_activity(
            activity_type="call_marked_as_favorite" if value else "call_unmarked_as_favorite",
            entity_type="call",
            entity_id=id,
            user_detail=user_detail,
            title=f"Call {'marked as favorite' if value else 'unmarked as favorite'}",
            description=f"Call {'marked as favorite' if value else 'unmarked as favorite'}",
            metadata={}
        )
        
        return json_response(message)
    except Exception as e:
        return get_error_response(e)



@calls.post("/crm/calls/get-grouped-by-status")
async def get_calls_grouped_by_status(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get all calls grouped by their status from the call_status collection.
    Uses MongoDB aggregation pipeline for efficient handling of large datasets.
    Ensures no duplicate records are returned.
    
    Performance optimizations:
    - Single aggregation pipeline with $lookup for joins
    - Indexed queries on tenant_id, status_id, deleted
    - Batch processing to avoid N+1 queries
    - Returns all calls for each status group
    
    Returns:
        A list of status groups, each containing:
        - Status details from call_status collection
        - Array of unique calls matching that status_id
        - Enriched call data with owner and user details via $lookup
    """
    try:
        # Get form data for filtering
        form = await request.form()
        include_enrichment = form.get("include_enrichment", "true").lower() == "true"
        
        tenant_id = user_detail["tenant_id"]
        
        # Get all call statuses from the call_status collection
        call_statuses = get_calls_statuses()
        
        # Create a map of status_id -> status details for quick lookup
        status_map = {str(status["id"]): status for status in call_statuses}
        
        # Build optimized aggregation pipeline
        # This pipeline groups calls by status_id in a single database operation
        pipeline = [
            # Stage 1: Match tenant's non-deleted calls (uses index: tenant_id + deleted)
            {
                "$match": {
                    "tenant_id": tenant_id,
                    "deleted": {"$ne": 1}
                }
            },
            # Stage 2: Sort by start_time descending (most recent first)
            {
                "$sort": {"start_time": -1}
            },
            # Stage 3: Group by status_id and collect unique calls
            {
                "$group": {
                    "_id": "$status_id",
                    "total_calls": {"$sum": 1},
                    # Use $push to collect all calls, we'll deduplicate and limit later
                    "all_calls": {"$push": "$$ROOT"}
                }
            }
        ]
        
        # Execute aggregation - single database roundtrip
        aggregation_result = list(calls_collection.aggregate(pipeline))
        
        # Create lookup map: status_id -> {total_calls, call_ids}
        calls_by_status = {}
        all_call_ids = set()  # Track all unique call IDs
        
        for group in aggregation_result:
            status_id = str(group["_id"]) if group["_id"] else "unknown"
            calls_data = group["all_calls"]  # Get all calls (no limit)
            
            # Extract unique call IDs (ensure no duplicates)
            call_ids = []
            seen_ids = set()
            for call in calls_data:
                call_id = call.get("id")
                if call_id and call_id not in seen_ids:
                    seen_ids.add(call_id)
                    call_ids.append(call_id)
                    all_call_ids.add(call_id)
            
            calls_by_status[status_id] = {
                "total_calls": group["total_calls"],
                "call_ids": call_ids
            }
        
        # If enrichment is requested, use aggregation with $lookup for batch enrichment
        enriched_calls_map = {}
        if include_enrichment and all_call_ids:
            # Aggregation pipeline for enriching calls with user details
            # Uses $lookup for efficient joins (similar to SQL JOINs)
            enrich_pipeline = [
                # Match only the calls we need (uses index: id)
                {
                    "$match": {
                        "id": {"$in": list(all_call_ids)},
                        "tenant_id": tenant_id,
                        "deleted": {"$ne": 1}
                    }
                },
                # Lookup owner details from users collection
                {
                    "$lookup": {
                        "from": "users",
                        "localField": "owner_id",
                        "foreignField": "id",
                        "as": "owner_details_array"
                    }
                },
                # Convert array to single object (or empty object if not found)
                {
                    "$addFields": {
                        "owner_details": {
                            "$ifNull": [
                                {"$arrayElemAt": ["$owner_details_array", 0]},
                                {}
                            ]
                        }
                    }
                },
                # Lookup user details from users collection
                {
                    "$lookup": {
                        "from": "users",
                        "localField": "user_id",
                        "foreignField": "id",
                        "as": "user_details_array"
                    }
                },
                {
                    "$addFields": {
                        "user_details": {
                            "$ifNull": [
                                {"$arrayElemAt": ["$user_details_array", 0]},
                                {}
                            ]
                        }
                    }
                },
                # Lookup assigned user details
                {
                    "$lookup": {
                        "from": "users",
                        "localField": "assigned_to_id",
                        "foreignField": "id",
                        "as": "assigned_to_details_array"
                    }
                },
                {
                    "$addFields": {
                        "assigned_to_details": {
                            "$ifNull": [
                                {"$arrayElemAt": ["$assigned_to_details_array", 0]},
                                {}
                            ]
                        }
                    }
                },
                # Lookup related_to_details based on call's related_to and related_to_id
                # Use $lookup with conditional collection selection
                {
                    "$lookup": {
                        "from": "contacts",
                        "let": {"related_to_id": "$related_to_id", "related_to": "$related_to"},
                        "pipeline": [
                            {"$match": {"$expr": {"$and": [{"$eq": ["$id", "$$related_to_id"]}, {"$eq": ["$$related_to", "contacts"]}]}}},
                            {"$project": {"_id": 0}}
                        ],
                        "as": "related_to_details_contacts"
                    }
                },
                {
                    "$lookup": {
                        "from": "leads",
                        "let": {"related_to_id": "$related_to_id", "related_to": "$related_to"},
                        "pipeline": [
                            {"$match": {"$expr": {"$and": [{"$eq": ["$id", "$$related_to_id"]}, {"$eq": ["$$related_to", "leads"]}]}}},
                            {"$project": {"_id": 0}}
                        ],
                        "as": "related_to_details_leads"
                    }
                },
                {
                    "$lookup": {
                        "from": "accounts",
                        "let": {"related_to_id": "$related_to_id", "related_to": "$related_to"},
                        "pipeline": [
                            {"$match": {"$expr": {"$and": [{"$eq": ["$id", "$$related_to_id"]}, {"$eq": ["$$related_to", "accounts"]}]}}},
                            {"$project": {"_id": 0}}
                        ],
                        "as": "related_to_details_accounts"
                    }
                },
                {
                    "$lookup": {
                        "from": "deals",
                        "let": {"related_to_id": "$related_to_id", "related_to": "$related_to"},
                        "pipeline": [
                            {"$match": {"$expr": {"$and": [{"$eq": ["$id", "$$related_to_id"]}, {"$eq": ["$$related_to", "deals"]}]}}},
                            {"$project": {"_id": 0}}
                        ],
                        "as": "related_to_details_deals"
                    }
                },
                {
                    "$addFields": {
                        "related_to_details": {
                            "$cond": {
                                "if": {"$gt": [{"$size": "$related_to_details_contacts"}, 0]},
                                "then": {"$arrayElemAt": ["$related_to_details_contacts", 0]},
                                "else": {
                                    "$cond": {
                                        "if": {"$gt": [{"$size": "$related_to_details_leads"}, 0]},
                                        "then": {"$arrayElemAt": ["$related_to_details_leads", 0]},
                                        "else": {
                                            "$cond": {
                                                "if": {"$gt": [{"$size": "$related_to_details_accounts"}, 0]},
                                                "then": {"$arrayElemAt": ["$related_to_details_accounts", 0]},
                                                "else": {
                                                    "$cond": {
                                                        "if": {"$gt": [{"$size": "$related_to_details_deals"}, 0]},
                                                        "then": {"$arrayElemAt": ["$related_to_details_deals", 0]},
                                                        "else": {}
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                # Remove temporary array fields and MongoDB _id
                {
                    "$project": {
                        "_id": 0,
                        "owner_details_array": 0,
                        "user_details_array": 0,
                        "assigned_to_details_array": 0,
                        "related_to_details_contacts": 0,
                        "related_to_details_leads": 0,
                        "related_to_details_accounts": 0,
                        "related_to_details_deals": 0
                    }
                }
            ]
            
            # Execute enrichment aggregation
            enriched_calls = list(calls_collection.aggregate(enrich_pipeline))
            
            # Create map for quick lookup by call ID
            for call in enriched_calls:
                call_id = call.get("id")
                if call_id:
                    # Add backward compatibility fields
                    call["owner"] = call.get("owner_details", {})
                    call["user"] = call.get("user_details", {})
                    call["assigned_to"] = call.get("assigned_to_details", {})
                    call["related_to_details"] = call.get("related_to_details", {})
                    
                    # Remove _id from nested objects if present
                    for key in ["owner_details", "user_details", "assigned_to_details", "related_to_details"]:
                        if isinstance(call.get(key), dict):
                            call[key].pop("_id", None)
                    
                    enriched_calls_map[call_id] = call
        
        # Build final result structure
        grouped_data = []
        total_calls_count = 0
        
        # Ensure all status groups are included (even with 0 calls)
        for status_id_str, status_info in status_map.items():
            # Get call data for this status
            status_data = calls_by_status.get(status_id_str, {"total_calls": 0, "call_ids": []})
            
            # Build status group result
            result_group = {
                **status_info,
                "total_calls": status_data["total_calls"],
                "calls": []
            }
            
            # Add enriched calls in order, ensuring no duplicates
            if include_enrichment:
                seen_in_group = set()
                for call_id in status_data["call_ids"]:
                    if call_id not in seen_in_group and call_id in enriched_calls_map:
                        result_group["calls"].append(enriched_calls_map[call_id])
                        seen_in_group.add(call_id)
            else:
                # Just include call IDs without enrichment (faster for dashboards)
                result_group["call_ids"] = status_data["call_ids"]
            
            grouped_data.append(result_group)
            total_calls_count += status_data["total_calls"]
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Calls grouped by status retrieved successfully",
            "data": convert_to_jsonable(grouped_data),
            "summary": {
                "total_calls": total_calls_count,
                "total_status_groups": len(call_statuses),
                "enrichment_enabled": include_enrichment
            }
        }
    except Exception as e:
        return get_error_details(e)
    
    
@calls.post("/crm/calls/update-status")
async def update_call_status(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    
    try:
        try:
            payload = await request.json()
        except Exception:
            payload = dict(await request.form())

        id = int(payload.get("id"), 0)
        status_value = int(payload.get("status_id"), 0)

        # ✅ Validation
        if id <= 0 or status_value < 0:
            return json_response("Valid id and status_id are required", None, status.HTTP_400_BAD_REQUEST)

        
        # Update existing call
        call_data = CallUpdateStatus()
        call_data.status_id = status_value
        
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