import json

from fastapi import APIRouter, Request, status, Depends, UploadFile, File
from typing import List, Optional
from datetime import datetime, timezone, timedelta
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
from app.helpers.uploadimage import UploadImage
from app.models.crm.meetings import MeetingCreate, MeetingUpdate, MeetingUpdateVenue, MeetingUpdateStatus, MeetingInDB
from app.models.crm.meeting_participant import MeetingParticipantCreate, MeetingParticipantUpdate, MeetingParticipantInDB
from app.helpers.globalfunctions import build_crm_query, QUERY_TYPE_ALL, QUERY_TYPE_OWNED, QUERY_TYPE_TODAY
from app.helpers.crm_helper import get_entity_details, log_activity

# Router
meetings = APIRouter(tags=["CRM Admin - Meetings"])

# MongoDB Collections
meetings_collection = db.meetings
meeting_participants_collection = db.meeting_participants

# Projection to exclude MongoDB _id
NO_ID_PROJECTION = {"_id": 0}







# ===============================
# CRUD for MEETINGS - starting
# ===============================

def build_meetings_filter_query(user_detail: dict, view: str = "all_meetings", venue: str = "",
                           location: str = "", start_time: str = "", end_time: str = "",
                           owner_id: str = "", related_to_name: str = "", status_id: str = "") -> dict:
    """
    Build MongoDB query for filtering meetings based on various criteria.
    
    Args:
        user_detail: User details containing tenant_id and id
        view: View type for filtering (all_meetings, meetings_today, etc.)
        venue: Venue filter (case-insensitive regex)
        location: Location filter (case-insensitive regex)
        start_time: Start time filter
        end_time: End time filter
        owner_id: Owner ID filter
        related_to_name: Related entity name filter
        status_id: Status ID filter
        
    Returns:
        MongoDB query dictionary
    """
    # Build base query
    query = {
        "tenant_id": user_detail["tenant_id"],
        "deleted": {"$ne": 1}
    }
    
    # Apply view-based filtering
    if view == "today_meetings":
        # Filter for meetings scheduled/started today (UTC) based on start_time
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today + timedelta(days=1)
        query["start_time"] = {"$gte": today.isoformat() + "+00:00", "$lt": tomorrow.isoformat() + "+00:00"}
        
    elif view == "this_week_meetings":
        # Filter for meetings in the last 7 days based on start_time
        week_ago = datetime.utcnow() - timedelta(days=7)
        query["start_time"] = {"$gte": week_ago.isoformat() + "+00:00"}
        
    elif view == "my_meetings":
        # Filter for meetings owned by current user
        query["owner_id"] = int(user_detail["id"])
        
    elif view == "upcoming_meetings":
        # Filter for upcoming meetings (future start_time)
        now = datetime.utcnow()
        query["status_id"] = {"$in": [1,2]}        
        query["start_time"] = {"$gte": now.isoformat() + "+00:00"}
    
    elif view == "past_meetings":
        # Filter for meetings not updated in the last 24 hours
        twenty_four_hours_ago = (datetime.utcnow() - timedelta(hours=24)).isoformat()
        query["$or"] = [
            {"updated_at": {"$lt": twenty_four_hours_ago}},
            {"updated_at": {"$exists": False}},
            {"updated_at": ""},
        ]
    elif view  == "favorite_meetings":
            query["favorite"] = 1
            
    elif view == "related_to_accounts":
            query["related_to"] = "accounts"
    elif view == "related_to_deals":
            query["related_to"] = "deals"
    

    # Apply search filters
    if venue:
        query["venue"] = {"$regex": venue, "$options": "i"}
    
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
        
    if start_time:
        query["start_time"] = {"$regex": start_time, "$options": "i"}
    
    if end_time:
        query["end_time"] = {"$regex": end_time, "$options": "i"}

    if related_to_name:
        query["related_to"] = {"$regex": related_to_name, "$options": "i"}
        
            
    if owner_id:
        try:
            query["owner_id"] = int(owner_id)
        except ValueError:
            pass
    
    if status_id:
        try:
            query["status_id"] = int(status_id)
        except ValueError:
            pass
    
    return query


def enrich_meeting_data(meeting: dict, user_detail: dict) -> dict:
    """
    Enrich meeting data with related user and entity information.
    
    Args:
        meeting: Meeting document from database
        user_detail: User details containing tenant_id
        
    Returns:
        Enriched meeting document
    """
    tenant_id = user_detail["tenant_id"]
    
    # Get owner_details (user information for owner)
    owner = db.users.find_one(
        {"id": meeting.get("owner_id")},
        NO_ID_PROJECTION
    )
    meeting["owner_details"] = owner or {}
    meeting["owner"] = owner or {}  # Keep for backward compatibility
    
    # Get user information for user_id
    user = db.users.find_one(
        {"id": meeting.get("user_id")},
        NO_ID_PROJECTION
    )
    meeting["user_details"] = user or {}
    
    # Get assigned user information if assigned_to_id exists
    if meeting.get("assigned_to_id"):
        assigned_user = db.users.find_one(
            {"id": meeting.get("assigned_to_id")},
            NO_ID_PROJECTION
        )
        meeting["assigned_to_details"] = assigned_user or {}
    else:
        meeting["assigned_to_details"] = {}
    
    # Get meeting_for_ids_details based on meeting_for_ids
    meeting["meeting_for_ids_details"] = []
    meeting_for_ids_str = meeting.get("meeting_for_ids", "[]")
    if meeting_for_ids_str and meeting_for_ids_str != "[]":
        try:
            import json
            meeting_for_ids = json.loads(meeting_for_ids_str)
            if isinstance(meeting_for_ids, list) and meeting_for_ids:
                meeting_for = meeting.get("meeting_for", "")
                if meeting_for == "contacts":
                    meeting["meeting_for_ids_details"] = list(db.contacts.find(
                        {"id": {"$in": meeting_for_ids}, "tenant_id": tenant_id, "deleted": {"$ne": 1}},
                        NO_ID_PROJECTION
                    ))
                elif meeting_for == "leads":
                    meeting["meeting_for_ids_details"] = list(db.leads.find(
                        {"id": {"$in": meeting_for_ids}, "tenant_id": tenant_id, "deleted": {"$ne": 1}},
                        NO_ID_PROJECTION
                    ))
                elif meeting_for == "accounts":
                    meeting["meeting_for_ids_details"] = list(db.accounts.find(
                        {"id": {"$in": meeting_for_ids}, "tenant_id": tenant_id, "deleted": {"$ne": 1}},
                        NO_ID_PROJECTION
                    ))
                elif meeting_for == "deals":
                    meeting["meeting_for_ids_details"] = list(db.deals.find(
                        {"id": {"$in": meeting_for_ids}, "tenant_id": tenant_id, "deleted": {"$ne": 1}},
                        NO_ID_PROJECTION
                    ))
        except Exception:
            meeting["meeting_for_ids_details"] = []
    
    # Get participant_ids_details based on participant_ids
    meeting["participant_ids_details"] = []
    participant_ids_str = meeting.get("participant_ids", "[]")
    if participant_ids_str and participant_ids_str != "[]":
        try:
            import json
            participant_ids = json.loads(participant_ids_str)
            if isinstance(participant_ids, list) and participant_ids:
                meeting["participant_ids_details"] = list(db.users.find(
                    {"id": {"$in": participant_ids}, "tenant_id": tenant_id, "deleted": {"$ne": 1}},
                    NO_ID_PROJECTION
                ))
        except Exception:
            meeting["participant_ids_details"] = []
    
    # Get related_to_ids_details based on related_to_ids
    meeting["related_to_ids_details"] = []
    related_to_ids_str = meeting.get("related_to_ids", "[]")
    if related_to_ids_str and related_to_ids_str != "[]":
        try:
            import json
            raw_ids = json.loads(related_to_ids_str)
            # Ensure a list of ints like [1,2]
            if isinstance(raw_ids, list):
                related_to_ids = []
                for x in raw_ids:
                    try:
                        related_to_ids.append(int(x))
                    except Exception:
                        continue
            else:
                related_to_ids = []

            if related_to_ids:
                related_to = meeting.get("related_to", "")
                if related_to == "accounts":
                    meeting["related_to_ids_details"] = list(db.accounts.find(
                        {"id": {"$in": related_to_ids}, "tenant_id": tenant_id, "deleted": {"$ne": 1}},
                        NO_ID_PROJECTION
                    ))
                elif related_to == "deals":
                    meeting["related_to_ids_details"] = list(db.deals.find(
                        {"id": {"$in": related_to_ids}, "tenant_id": tenant_id, "deleted": {"$ne": 1}},
                        NO_ID_PROJECTION
                    ))
        except Exception:
            meeting["related_to_ids_details"] = []
    
    # Add last_activity_date - use updated_at if available, otherwise use created_at
    if meeting.get("updated_at"):
        meeting["last_activity_date"] = meeting["updated_at"]
    elif meeting.get("created_at"):
        meeting["last_activity_date"] = meeting["created_at"]
    else:
        # Fallback to current time if neither exists
        meeting["last_activity_date"] = datetime.utcnow().isoformat() + "+00:00"
    
    return meeting


# Generate line chart data based on actual historical data
def generate_line_chart_data_from_meetings(meetings_collection, base_query, to_date, metric_type="total"):
    """
    Generate line chart data based on actual historical data for the last 7 days
    """
    data = []
    
    # Get the last 7 days anchored to provided to_date
    end_date = to_date
    
    for i in range(7):
        # Calculate date for this day
        current_date = end_date - timedelta(days=6-i)
        start_of_day = current_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = current_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Build query for this specific day
        # Build per-day date filter supporting Date and string start_time
        per_day_date_filter = {
            "$or": [
                {"start_time": {"$gte": start_of_day, "$lte": end_of_day}},
                {
                    "$expr": {
                        "$and": [
                            {"$gte": [{"$toDate": "$start_time"}, start_of_day]},
                            {"$lte": [{"$toDate": "$start_time"}, end_of_day]}
                        ]
                    }
                }
            ]
        }
        day_query = {**base_query, **per_day_date_filter}
        
        # Count based on metric type
        if metric_type == "total":
            count = meetings_collection.count_documents(day_query)
        elif metric_type == "missed":
            count = meetings_collection.count_documents({**day_query, "status_id": {"$in": [3, 4]}})
        elif metric_type == "connected":
            count = meetings_collection.count_documents({**day_query, "status_id": {"$in": [5]}})
        elif metric_type == "duration":
            # Count meetings with duration for this day
            count = meetings_collection.count_documents({**day_query, "duration": {"$exists": True, "$ne": ""}})
        else:
            count = meetings_collection.count_documents(day_query)
        
        data.append({"value": count})
    
    return data


@meetings.post("/crm/meetings/get-statistics")
async def get_statistics(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):

    try:
        # Get form data
        form = await request.form()
        
        # Resolve current tenant id (default to 0 if missing)
        tenant_id = int(user_detail.get("tenant_id", 0))
        
        # Get date range parameters
        from_date_str = form.get("from", "")
        to_date_str = form.get("to", "")
        
        # Parse dates robustly (like calls) and normalize to day bounds
        def _parse_iso_naive_utc(value: str):
            try:
                dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
                if dt.tzinfo is not None:
                    dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
                return dt
            except Exception:
                return None

        from_date = _parse_iso_naive_utc(from_date_str) if from_date_str else datetime.utcnow()
        to_date = _parse_iso_naive_utc(to_date_str) if to_date_str else datetime.utcnow()

        # Normalize to full-day range
        from_date = from_date.replace(hour=0, minute=0, second=0, microsecond=0)
        to_date = to_date.replace(hour=23, minute=59, second=59, microsecond=999999)

        if from_date.date() == to_date.date():
            from_date = (from_date - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)

        # Build date filter supporting Date and string start_time
        date_filter = {
            "$or": [
                {"start_time": {"$gte": from_date, "$lte": to_date}},
                {
                    "$expr": {
                        "$and": [
                            {"$gte": [{"$toDate": "$start_time"}, from_date]},
                            {"$lte": [{"$toDate": "$start_time"}, to_date]}
                        ]
                    }
                }
            ]
        }

        # Base query with merged date filter
        base_query = {
            "tenant_id": tenant_id,
            "deleted": {"$ne": 1},
            **date_filter
        }
        
        # Get total meetings count
        total_meetings = meetings_collection.count_documents(base_query)
        
        # Get breakdown by meeting type (assuming 'meeting_type' field exists)
        type_breakdown = list(meetings_collection.aggregate([
            {"$match": base_query},
            {"$group": {"_id": "$meeting_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]))
        
        client_meetings = next((t["count"] for t in type_breakdown if (t["_id"] or "").lower() == "client"), 0)
        internal_meetings = next((t["count"] for t in type_breakdown if (t["_id"] or "").lower() == "internal"), 0)
        vendor_meetings = next((t["count"] for t in type_breakdown if (t["_id"] or "").lower() == "vendor"), 0)
        strategy_meetings = next((t["count"] for t in type_breakdown if (t["_id"] or "").lower() == "strategy"), 0)
        
        # Calculate penetration rate (completed vs total)
        completed_meetings = meetings_collection.count_documents({**base_query, "status_id": {"$in": [5]}})
        penetration = round((completed_meetings / total_meetings * 100), 2) if total_meetings > 0 else 0
        
        # Get successful meetings (completed status)
        successfull_meetings = completed_meetings
        
        # Get breakdown by outcome for completed meetings (status_id 5)
        outcome_breakdown = list(meetings_collection.aggregate([
            {"$match": {**base_query, "status_id": {"$in": [5]}}},
            {"$group": {"_id": "$outcome", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]))
        
        deal_progressed = next((o["count"] for o in outcome_breakdown if (o["_id"] or "").lower() in ["deal progressed", "deal_progressed"]), 0)
        plan_set = next((o["count"] for o in outcome_breakdown if (o["_id"] or "").lower() in ["plan set", "plan_set"]), 0)
        client_feedback = next((o["count"] for o in outcome_breakdown if (o["_id"] or "").lower() in ["client feedback", "client_feedback"]), 0)
        
        # Get cancellations (Missed, Over Due)
        cancellation_meetings = meetings_collection.count_documents({**base_query, "status_id": {"$in": [3, 4]}})
        
        # Get breakdown by cancellation reason (Missed, Over Due)
        cancellation_breakdown = list(meetings_collection.aggregate([
            {"$match": {**base_query, "status_id": {"$in": [3, 4]}}},
            {"$group": {"_id": "$cancellation_reason", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]))
        
        client_unavailable = next((c["count"] for c in cancellation_breakdown if (c["_id"] or "").lower() in ["client unavailable", "client_unavailable"]), 0)
        rescheduled = next((c["count"] for c in cancellation_breakdown if (c["_id"] or "").lower() == "rescheduled"), 0)
        internal_conflict = next((c["count"] for c in cancellation_breakdown if (c["_id"] or "").lower() in ["internal conflict", "internal_conflict"]), 0)
        technical_issues = next((c["count"] for c in cancellation_breakdown if (c["_id"] or "").lower() in ["technical issues", "technical_issues"]), 0)
        
        # Get upcoming meetings (scheduled or pending status, starting today onwards)
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).replace(tzinfo=None)
        upcoming_start_filter = {
            "$or": [
                {"start_time": {"$gte": today_start}},
                {
                    "$expr": {
                        "$gte": [{"$toDate": "$start_time"}, today_start]
                    }
                },
            ]
        }
        upcoming_query = {
            **base_query,
            # "status_id": {"$in": [1, 2]},
            **upcoming_start_filter,
        }
        upcoming_meetings = meetings_collection.count_documents(upcoming_query)
        
        # Get breakdown of upcoming by type
        upcoming_breakdown = list(meetings_collection.aggregate([
            {"$match": upcoming_query},
            {"$group": {"_id": "$meeting_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]))
        
        upcoming_client = next((u["count"] for u in upcoming_breakdown if (u["_id"] or "").lower() == "client"), 0)
        upcoming_internal = next((u["count"] for u in upcoming_breakdown if (u["_id"] or "").lower() == "internal"), 0)
        upcoming_external = next((u["count"] for u in upcoming_breakdown if (u["_id"] or "").lower() == "external"), 0)
        
        # Calculate percentage changes (compare with previous period)
        def calculate_percentage_change(current: float, previous: float) -> str:
            try:
                if previous == 0:
                    return "+0%" if current == 0 else "+100%"
                change = ((current - previous) / previous) * 100.0
                sign = "+" if change >= 0 else ""
                return f"{sign}{round(change, 1)}%"
            except Exception:
                return "+0%"

        period_days = max(1, (to_date - from_date).days)
        prev_from = from_date - timedelta(days=period_days)
        prev_to = from_date

        previous_date_filter = {
            "$or": [
                {"start_time": {"$gte": prev_from, "$lte": prev_to}},
                {
                    "$expr": {
                        "$and": [
                            {"$gte": [{"$toDate": "$start_time"}, prev_from]},
                            {"$lte": [{"$toDate": "$start_time"}, prev_to]}
                        ]
                    }
                }
            ]
        }
        previous_base_query = {
            "tenant_id": tenant_id,
            "deleted": {"$ne": 1},
            **previous_date_filter
        }

        previous_total_meetings = meetings_collection.count_documents(previous_base_query)
        previous_completed_meetings = meetings_collection.count_documents({**previous_base_query, "status_id": {"$in": [5]}})
        previous_cancellation_meetings = meetings_collection.count_documents({**previous_base_query, "status_id": {"$in": [3, 4]}})

        prev_now = now - timedelta(days=period_days)
        prev_today_start = prev_now.replace(hour=0, minute=0, second=0, microsecond=0).replace(tzinfo=None)
        previous_upcoming_start_filter = {
            "$or": [
                {"start_time": {"$gte": prev_today_start}},
                {
                    "$expr": {
                        "$gte": [{"$toDate": "$start_time"}, prev_today_start]
                    }
                },
            ]
        }
        previous_upcoming_query = {
            **previous_base_query,
            "status_id": {"$in": [1, 2]},
            **previous_upcoming_start_filter,
        }
        previous_upcoming_meetings = meetings_collection.count_documents(previous_upcoming_query)

        total_meetings_percent = calculate_percentage_change(total_meetings, previous_total_meetings)
        successfull_meetings_percent = calculate_percentage_change(completed_meetings, previous_completed_meetings)
        cancellation_meetings_percent = calculate_percentage_change(cancellation_meetings, previous_cancellation_meetings)
        upcoming_meetings_percent = calculate_percentage_change(upcoming_meetings, previous_upcoming_meetings)
        
        # Build dashboard view data
        dashboard_view = [
            {
                "icon":"/icons/meeting_participants.svg",
                "iconClass":"",
                "title":"Total Meetings Scheduled",
                "total": total_meetings,
                "change": total_meetings_percent,
                "description": f"Client: {client_meetings} | Internal: {internal_meetings} | Vendor: {vendor_meetings} | Strategy: {strategy_meetings} | Meetings Penetration: {penetration}%",
                "lineChartData": generate_line_chart_data_from_meetings(meetings_collection, base_query, to_date, "total")
            },
            {
                "icon":"/icons/two_users_check.svg",
                "iconClass":"",
                "title": "Successfull Meetings",
                "total": successfull_meetings,
                "change": successfull_meetings_percent,
                "description": f"Deal Progressed: {deal_progressed} | Plan Set: {plan_set} | Client Feedback: {client_feedback}",
                "lineChartData": generate_line_chart_data_from_meetings(meetings_collection, base_query, to_date, "missed")
            },
            {
                "icon":"/icons/users_cross.svg",
                "iconClass":"",
                "title": "No-Shows / Cancellations",
                "total": cancellation_meetings,
                "change": cancellation_meetings_percent,
                "description": f"Client Unavailable: {client_unavailable} | Rescheduled: {rescheduled} | Internal Conflict: {internal_conflict} | Technical Issues: {technical_issues}",
                "lineChartData": generate_line_chart_data_from_meetings(meetings_collection, base_query, to_date, "connected")
            },
            {
                "icon":"/icons/user_check_calendar.svg",
                "iconClass":"",
                "title": "Upcoming Meetings",
                "total": upcoming_meetings,
                "change": upcoming_meetings_percent,
                "description": f"Client: {upcoming_client} | Internal: {upcoming_internal} | External: {upcoming_external}",
                "lineChartData": generate_line_chart_data_from_meetings(meetings_collection, base_query, to_date, "duration")
            },
        ]
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Meeting statistics retrieved successfully",
            "data": dashboard_view,
            "date_range": {
                "from": from_date.isoformat(),
                "to": to_date.isoformat()
            },
            "tenant_id": tenant_id
        }
        
    except Exception as e:
        return get_error_details(e)

@meetings.post("/crm/meetings/get")
async def get_meetings(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        # Try to get JSON payload first, fallback to form data
        try:
            payload = await request.json()
        except:
            # If JSON parsing fails, try form data
            form = await request.form()
            payload = dict(form)
        
        # Extract filter parameters
        view = payload.get("view", "all_meetings")
        venue = str(payload.get("venue", "")).strip()
        location = str(payload.get("location", "")).strip()
        start_time = str(payload.get("start_time", "")).strip()
        end_time = str(payload.get("end_time", "")).strip()
        owner_id = str(payload.get("owner_id", "")).strip()
        related_to_name = str(payload.get("related_to_name", "")).strip()
        status_id = str(payload.get("status_id", "")).strip()
        
        # Pagination parameters
        page = int(payload.get("page", 1))
        limit = int(payload.get("limit", 20))
        skip = (page - 1) * limit
        
        # Build query using the separate function
        query = build_meetings_filter_query(
            user_detail=user_detail,
            view=view,
            venue=venue,
            location=location,
            start_time=start_time,
            end_time=end_time,
            owner_id=owner_id,
            related_to_name=related_to_name,
            status_id=status_id
        )
        
        # Get total count for pagination
        total_count = meetings_collection.count_documents(query)
        
        # Execute query with pagination
        meetings = list(meetings_collection.find(query, NO_ID_PROJECTION).sort("id", -1).skip(skip).limit(limit))

        # Enrich meeting data using the separate function
        records = []
        if meetings:
            for meeting in meetings:
                enriched_meeting = enrich_meeting_data(meeting, user_detail)
                records.append(enriched_meeting)

        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": convert_to_jsonable(records),
            "filters_applied": {
                "view": view,
                "venue": venue,
                "location": location,
                "start_time": start_time,
                "end_time": end_time,
                "owner_id": owner_id,
                "related_to_name": related_to_name,
                "status_id": status_id
            },
            "pagination": {
                "page": page,
                "limit": limit,
                "total_count": total_count,
                "total_pages": (total_count + limit - 1) // limit,
                "returned_count": len(records)
            }
        }
    except Exception as e:
        return get_error_details(e)

@meetings.post("/crm/meetings/save")
async def save_meeting(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    """
    Create or update a meeting using JSON payload.
    
    Expected payload:
    {
        "id": 0,
        "title": "Meeting Title",
        "venue": "in-office",
        "location": "Office Address",
        "start_time": "2025-10-28T19:00:00.000Z",
        "end_time": "2025-10-22T19:00:00.000Z",
        "all_day": false,
        "owner_id": "6",
        "participant_ids": "[\"6\"]",
        "related_to_name": "",
        "participants_reminder": "",
        "status_id": "1",
        "meeting_for": "contacts",
        "meeting_for_ids": "[\"1\"]",
        "related_to": "accounts",
        "related_to_ids": "[\"1\"]",
        "reminder_id": "5",
        "description": "Meeting description",
        "deletable": 0
    }
    """
    try:
        # Try to get JSON payload first, fallback to form data
        try:
            payload = await request.json()
        except:
            # If JSON parsing fails, try form data
            form = await request.form()
            payload = dict(form)
        
        doc_id = int(payload.get("id", 0))
        
        # Helper functions for type conversion
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
        
        def to_bool(value, default: bool = False) -> bool:
            if isinstance(value, bool):
                return value
            if isinstance(value, str):
                return value.lower() in ['true', '1', 'yes']
            if isinstance(value, int):
                return value == 1
            return default

        if doc_id == 0:
            # Create new meeting
            meeting_data = MeetingCreate()
            
            next_id = get_next_id(meetings_collection)
            meeting_data.id = next_id
            meeting_data.ukey = str(user_detail['tenant_id']) + "000" + str(next_id)
            
            meeting_data.title = to_str(payload.get("title", ""))
            meeting_data.venue = to_str(payload.get("venue", ""))
            meeting_data.location = to_str(payload.get("location", ""))
            meeting_data.start_time = to_str(payload.get("start_time", ""))
            meeting_data.end_time = to_str(payload.get("end_time", ""))
            meeting_data.all_day = 1 if to_bool(payload.get("all_day", False)) else 0
            meeting_data.owner_id = to_int(payload.get("owner_id", 0), 0)
            meeting_data.status_id = to_int(payload.get("status_id", 0), 0)
            meeting_data.meeting_for = to_str(payload.get("meeting_for", ""))
            meeting_data.meeting_for_ids = to_str(payload.get("meeting_for_ids", "[]"))
            meeting_data.related_to = to_str(payload.get("related_to", ""))
            meeting_data.related_to_ids = to_str(payload.get("related_to_ids", "[]"))
            meeting_data.participant_ids = to_str(payload.get("participant_ids", "[]"))
            meeting_data.reminder_id = to_int(payload.get("reminder_id", ""))
            meeting_data.description = to_str(payload.get("description", ""))
            meeting_data.deletable = to_int(payload.get("deletable", 1), 1)
            meeting_data.tenant_id = to_int(user_detail["tenant_id"], 0)
            meeting_data.user_id = to_int(user_detail["id"], 0)
            
            # Check for duplicate meetings before inserting
            # Duplicate criteria: same title + meeting_for + meeting_for_ids + start_time within same tenant
            if meeting_data.title and (meeting_data.meeting_for or meeting_data.start_time):
                duplicate_query = {
                    "tenant_id": meeting_data.tenant_id,
                    "deleted": {"$ne": 1},
                    "title": meeting_data.title
                }
                
                if meeting_data.meeting_for:
                    duplicate_query["meeting_for"] = meeting_data.meeting_for
                
                if meeting_data.meeting_for_ids:
                    duplicate_query["meeting_for_ids"] = meeting_data.meeting_for_ids
                
                if meeting_data.start_time:
                    duplicate_query["start_time"] = meeting_data.start_time
                
                existing_meeting = meetings_collection.find_one(duplicate_query, NO_ID_PROJECTION)
                
                if existing_meeting:
                    duplicate_fields = []
                    if meeting_data.title and existing_meeting.get("title") == meeting_data.title:
                        duplicate_fields.append("title")
                    if meeting_data.meeting_for and existing_meeting.get("meeting_for") == meeting_data.meeting_for:
                        duplicate_fields.append("meeting_for")
                    if meeting_data.meeting_for_ids and existing_meeting.get("meeting_for_ids") == meeting_data.meeting_for_ids:
                        duplicate_fields.append("meeting_for_ids")
                    if meeting_data.start_time and existing_meeting.get("start_time") == meeting_data.start_time:
                        duplicate_fields.append("start_time")
                    
                    return {
                        "status": status.HTTP_409_CONFLICT,
                        "message": f"Duplicate meeting found with matching {', '.join(duplicate_fields)}. Meeting ID: {existing_meeting.get('id')}",
                        "data": {
                            "duplicate_meeting_id": existing_meeting.get("id"),
                            "duplicate_fields": duplicate_fields
                        }
                    }
            
            result = meetings_collection.insert_one(meeting_data.dict())
            
            return {
                "status": status.HTTP_200_OK,
                "message": "Meeting created successfully",
                "data": convert_to_jsonable(meeting_data.dict())
            }
        else:
            # Update existing meeting
            meeting_data = MeetingUpdate()
            
            meeting_data.id = doc_id
            meeting_data.title = to_str(payload.get("title", ""))
            meeting_data.venue = to_str(payload.get("venue", ""))
            meeting_data.location = to_str(payload.get("location", ""))
            meeting_data.start_time = to_str(payload.get("start_time", ""))
            meeting_data.end_time = to_str(payload.get("end_time", ""))
            meeting_data.all_day = 1 if to_bool(payload.get("all_day", False)) else 0
            meeting_data.owner_id = to_int(payload.get("owner_id", 0), 0)
            meeting_data.status_id = to_int(payload.get("status_id", 0), 0)
            meeting_data.meeting_for = to_str(payload.get("meeting_for", ""))
            meeting_data.meeting_for_ids = to_str(payload.get("meeting_for_ids", "[]"))
            meeting_data.related_to = to_str(payload.get("related_to", ""))
            meeting_data.related_to_ids = to_str(payload.get("related_to_ids", "[]"))
            meeting_data.participant_ids = to_str(payload.get("participant_ids", "[]"))
            meeting_data.reminder_id = to_str(payload.get("reminder_id", ""))
            meeting_data.description = to_str(payload.get("description", ""))
            meeting_data.deletable = to_int(payload.get("deletable", 1), 1)
            meeting_data.tenant_id = to_int(user_detail["tenant_id"], 0)
            meeting_data.user_id = to_int(user_detail["id"], 0)
            
            meetings_collection.update_one(
                {"id": doc_id, "tenant_id": user_detail["tenant_id"]}, 
                {"$set": meeting_data.dict()}
            )

            return {
                "status": status.HTTP_200_OK,
                "message": "Meeting updated successfully",
                "data": convert_to_jsonable(meeting_data.dict())
            }
                
    except Exception as e:
        return get_error_details(e)



@meetings.get("/crm/meetings/details/get/{id}")
async def get_meeting_details_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    return get_entity_details("meeting", id, user_detail)


@meetings.get("/crm/meetings/{id}/deleted/{value}")
async def toggle_meeting_deletion(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Soft delete or restore a meeting by toggling the 'deleted' flag.
    """
    try:
        meetings_collection.update_one({"id": id, "tenant_id": user_detail["tenant_id"]}, {"$set": {"deleted": value}})
        
        # Also soft delete/restore meeting participants
        meeting_participants_collection.update_many(
            {"meeting_id": id, "tenant_id": user_detail["tenant_id"]}, 
            {"$set": {"deleted": value}}
        )
        
        message = "Record deleted successfully" if value else "Record restored successfully"
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": None
        }
    except Exception as e:
        return get_error_details(e)

@meetings.get("/crm/meetings/{id}/favorite/{value}")
async def toggle_meeting_favorite(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Toggle favorite status for a meeting by setting the 'favorite' flag.
    Default value is 0 (not favorite), 1 for favorite.
    """
    try:
        meetings_collection.update_one(
            {"id": id, "tenant_id": user_detail["tenant_id"]}, 
            {"$set": {"favorite": value}}
        )
        message = "Meeting marked as favorite" if value else "Meeting unmarked as favorite"
        
        log_activity(
            activity_type="meeting_marked_as_favorite" if value else "meeting_unmarked_as_favorite",
            entity_type="meeting",
            entity_id=id,
            user_detail=user_detail,
            title=f"Meeting {'marked as favorite' if value else 'unmarked as favorite'}",
            description=f"Meeting {'marked as favorite' if value else 'unmarked as favorite'}",
            metadata={}
        )
        
        return json_response(message)
    except Exception as e:
        return get_error_response(e)




# ===============================
# CRUD for MEETINGS - ending
# ===============================





@meetings.get("/crm/meetings/clone/{id}")
async def clone_meeting_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        # Find the original meeting
        meeting = meetings_collection.find_one(
            {"id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
            NO_ID_PROJECTION
        )

        if not meeting:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Original record not found",
                "data": None
            }

        meeting.pop("_id", None)
        old_id = meeting.get("id")
        new_id = get_next_id(meetings_collection)

        cursor = meetings_collection.find(
            {}, NO_ID_PROJECTION
        ).sort("ukey", -1).limit(1)

        latest_doc = next(cursor, None)
        
        latest_ukey = int(latest_doc["ukey"]) if latest_doc and "ukey" in latest_doc else 9999
        next_ukey = latest_ukey + 1

        # Set new fields
        meeting["id"] = new_id
        meeting["ukey"] = str(next_ukey)
        #meeting["created_at"] = datetime.utcnow()
        #meeting["updated_at"] = None

        # Insert cloned record
        meetings_collection.insert_one(meeting)

        return {
            "status": status.HTTP_201_CREATED,
            "message": f"meeting (cloned from {old_id}) created successfully",
            "data": convert_to_jsonable(meeting)
        }

    except Exception as e:
        return get_error_details(e)

@meetings.post("/crm/meetings/details/get/{ukey}")
async def get_meeting_by_id(ukey: str, user_detail: dict = Depends(oauth2.get_user_by_token)):
    
    try:
        meeting = meetings_collection.find_one({"ukey": ukey, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}}, NO_ID_PROJECTION)
        if meeting:
            
            meeting["owner_details"] = db.users.find_one({"id": meeting.get("owner_id")}, NO_ID_PROJECTION)
            meeting["host_details"] = db.users.find_one({"id": meeting.get("host_id")}, NO_ID_PROJECTION)
            meeting["user_details"] = db.users.find_one({"id": meeting.get("user_id")}, NO_ID_PROJECTION)
            meeting["related_to_details"] = db[meeting.get("related_to")].find_one({"id": meeting.get("related_to_id")}, NO_ID_PROJECTION)
            
            return {
                "status": status.HTTP_200_OK,
                "message": "Record retrieved successfully",
                "data": convert_to_jsonable(meeting)
            }
        return {
            "status": status.HTTP_404_NOT_FOUND,
            "message": "Record not found",
            "data": None
        }
    except Exception as e:
        return get_error_details(e)    
    
@meetings.post("/crm/meetings/get/{id}")
async def get_meeting_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get a single meeting by ID.
    """
    try:
        meeting = meetings_collection.find_one({"id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}}, NO_ID_PROJECTION)
        if meeting:
            # Get host information
            host = db.users.find_one(
                {"id": meeting.get("host_id")},
                NO_ID_PROJECTION
            )
            meeting["host"] = host or {}
            
            # Get user information
            user = db.users.find_one(
                {"id": meeting.get("user_id")},
                NO_ID_PROJECTION
            )
            meeting["user"] = user or {}
            
            # Get meeting participants
            participants = list(meeting_participants_collection.find(
                {"meeting_id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
                NO_ID_PROJECTION
            ))
            meeting["participants"] = participants
            
            return {
                "status": status.HTTP_200_OK,
                "message": "Record retrieved successfully",
                "data": convert_to_jsonable(meeting)
            }
        return {
            "status": status.HTTP_404_NOT_FOUND,
            "message": "Record not found",
            "data": None
        }
    except Exception as e:
        return get_error_details(e)


@meetings.post("/crm/meetings/update-status")
async def update_meeting_status(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    """
    Update meeting status by ID.
    
    Payload (JSON or Form):
    {
        "id": 123,
        "status": 2
    }
    """
    try:
        # Try to get JSON payload first, fallback to form data
        """
        try:
            payload = await request.json()
        except:
            # If JSON parsing fails, try form data
            form = await request.form()
            payload = dict(form)
        id = int(payload.get("id"))
        status_value = int(payload.get("status_id"))
        
        form = await request.form()
        id = int(form.get("id"))
        status_value = int(form.get("status_id"))
        """
        
        try:
            payload = await request.json()
        except Exception:
            payload = dict(await request.form())

        id = int(payload.get("id"), 0)
        status_value = int(payload.get("status_id"), 0)

        # ✅ Validation
        if id <= 0 or status_value < 0:
            return json_response("Valid id and status_id are required", None, status.HTTP_400_BAD_REQUEST)


        # Update existing meeting
        meeting_data = MeetingUpdateStatus()
        meeting_data.status_id = status_value
        
        meetings_collection.update_one(
            {"id": id, "tenant_id": user_detail["tenant_id"]}, 
            {"$set": meeting_data.dict()}
        )
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Meeting status updated successfully",
            "data": convert_to_jsonable(meeting_data.dict())
        }
                
    except Exception as e:
        return get_error_details(e)


@meetings.post("/crm/meetings/get-grouped-by-status")
async def get_meetings_grouped_by_status(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get all meetings grouped by their status from the meeting_status collection.
    Uses MongoDB aggregation pipeline for efficient handling of large datasets.
    Ensures no duplicate records are returned.
    
    Performance optimizations:
    - Single aggregation pipeline with $lookup for joins
    - Indexed queries on tenant_id, status_id, deleted
    - Batch processing to avoid N+1 queries
    - Returns all meetings for each status group
    
    Returns:
        A list of status groups, each containing:
        - Status details from meeting_status collection
        - Array of unique meetings matching that status_id
        - Enriched meeting data with owner and user details via $lookup
    """
    try:
        # Get form data for filtering
        form = await request.form()
        include_enrichment = form.get("include_enrichment", "true").lower() == "true"
        
        tenant_id = user_detail["tenant_id"]
        
        # Get all meeting statuses from the meeting_status collection
        meeting_statuses = list(db.meetings_statuses.find(
            {"deleted": {"$ne": 1}},
            NO_ID_PROJECTION
        ).sort("id", 1))
        
        # Create a map of status_id -> status details for quick lookup
        status_map = {str(status["id"]): status for status in meeting_statuses}
        
        # Build optimized aggregation pipeline
        # This pipeline groups meetings by status_id in a single database operation
        pipeline = [
            # Stage 1: Match tenant's non-deleted meetings (uses index: tenant_id + deleted)
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
            # Stage 3: Group by status_id and collect unique meetings
            {
                "$group": {
                    "_id": "$status_id",
                    "total_meetings": {"$sum": 1},
                    # Use $push to collect all meetings
                    "all_meetings": {"$push": "$$ROOT"}
                }
            }
        ]
        
        # Execute aggregation - single database roundtrip
        aggregation_result = list(meetings_collection.aggregate(pipeline))
        
        # Create lookup map: status_id -> {total_meetings, meeting_ids}
        meetings_by_status = {}
        all_meeting_ids = set()  # Track all unique meeting IDs
        
        for group in aggregation_result:
            status_id = str(group["_id"]) if group["_id"] else "unknown"
            meetings_data = group["all_meetings"]  # Get all meetings (no limit)
            
            # Extract unique meeting IDs (ensure no duplicates)
            meeting_ids = []
            seen_ids = set()
            for meeting in meetings_data:
                meeting_id = meeting.get("id")
                if meeting_id and meeting_id not in seen_ids:
                    seen_ids.add(meeting_id)
                    meeting_ids.append(meeting_id)
                    all_meeting_ids.add(meeting_id)
            
            meetings_by_status[status_id] = {
                "total_meetings": group["total_meetings"],
                "meeting_ids": meeting_ids
            }
        
        # If enrichment is requested, use aggregation with $lookup for batch enrichment
        enriched_meetings_map = {}
        if include_enrichment and all_meeting_ids:
            # Aggregation pipeline for enriching meetings with user details
            # Uses $lookup for efficient joins (similar to SQL JOINs)
            enrich_pipeline = [
                # Match only the meetings we need (uses index: id)
                {
                    "$match": {
                        "id": {"$in": list(all_meeting_ids)},
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
                # Remove temporary array fields and MongoDB _id
                {
                    "$project": {
                        "_id": 0,
                        "owner_details_array": 0,
                        "user_details_array": 0
                    }
                }
            ]
            
            # Execute enrichment aggregation
            enriched_meetings = list(meetings_collection.aggregate(enrich_pipeline))
            
            # Create map for quick lookup by meeting ID
            for meeting in enriched_meetings:
                meeting_id = meeting.get("id")
                if meeting_id:
                    # Add backward compatibility fields
                    meeting["owner"] = meeting.get("owner_details", {})
                    meeting["user"] = meeting.get("user_details", {})
                    
                    # Remove _id from nested objects if present
                    for key in ["owner_details", "user_details"]:
                        if isinstance(meeting.get(key), dict):
                            meeting[key].pop("_id", None)
                    
                    enriched_meetings_map[meeting_id] = meeting
        
        # Build final result structure
        grouped_data = []
        total_meetings_count = 0
        
        # Ensure all status groups are included (even with 0 meetings)
        for status_id_str, status_info in status_map.items():
            # Get meeting data for this status
            status_data = meetings_by_status.get(status_id_str, {"total_meetings": 0, "meeting_ids": []})
            
            # Build status group result
            result_group = {
                **status_info,
                "total_meetings": status_data["total_meetings"],
                "meetings": []
            }
            
            # Add enriched meetings in order, ensuring no duplicates
            if include_enrichment:
                seen_in_group = set()
                for meeting_id in status_data["meeting_ids"]:
                    if meeting_id not in seen_in_group and meeting_id in enriched_meetings_map:
                        result_group["meetings"].append(enriched_meetings_map[meeting_id])
                        seen_in_group.add(meeting_id)
            else:
                # Just include meeting IDs without enrichment (faster for dashboards)
                result_group["meeting_ids"] = status_data["meeting_ids"]
            
            grouped_data.append(result_group)
            total_meetings_count += status_data["total_meetings"]
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Meetings grouped by status retrieved successfully",
            "data": convert_to_jsonable(grouped_data),
            "summary": {
                "total_meetings": total_meetings_count,
                "total_status_groups": len(meeting_statuses),
                "enrichment_enabled": include_enrichment
            }
        }
    except Exception as e:
        return get_error_details(e)


@meetings.post("/crm/meetings/get-by-related")
async def get_meetings_by_related(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get meetings by related_to and related_to_id.
    """
    try:
        form = await request.form()
        meetings = list(meetings_collection.find(
            {
                "related_to": form["related_to"], 
                "related_to_id": int(form["related_to_id"]), 
                "tenant_id": user_detail["tenant_id"], 
                "deleted": {"$ne": 1}
            }, 
            NO_ID_PROJECTION
        ).sort("id", -1))
        
        records = []
        if meetings:
            for meeting in meetings:
                # Get host information
                host = db.users.find_one(
                    {"id": meeting.get("host_id")},
                    NO_ID_PROJECTION
                )
                meeting["host"] = host or {}
                
                # Get user information
                user = db.users.find_one(
                    {"id": meeting.get("user_id")},
                    NO_ID_PROJECTION
                )
                meeting["user"] = user or {}
                
                # Get meeting participants
                participants = list(meeting_participants_collection.find(
                    {"meeting_id": meeting.get("id"), "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
                    NO_ID_PROJECTION
                ))
                meeting["participants"] = participants
                
                records.append(meeting)
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": convert_to_jsonable(records)
        }
    except Exception as e:
        return get_error_details(e)

@meetings.post("/crm/meetings/get-grouped-by-venue")
async def get_meetings_grouped_by_venue(user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get all meetings for the current tenant grouped by venue.
    """
    try:
        # Get all meetings for the tenant
        meetings = list(meetings_collection.find(
            {"tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
            NO_ID_PROJECTION
        ).sort("id", -1))

        # Group meetings by venue
        grouped_meetings = {}
        
        if meetings:
            for meeting in meetings:
                venue_value = meeting.get("venue", "Unknown")
                
                # Get host information
                host = db.users.find_one(
                    {"id": meeting.get("host_id")},
                    NO_ID_PROJECTION
                )
                meeting["host"] = host or {}
                
                # Get user information
                user = db.users.find_one(
                    {"id": meeting.get("user_id")},
                    NO_ID_PROJECTION
                )
                meeting["user"] = user or {}
                
                # Get meeting participants
                participants = list(meeting_participants_collection.find(
                    {"meeting_id": meeting.get("id"), "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
                    NO_ID_PROJECTION
                ))
                meeting["participants"] = participants
                
                # Add meeting to the appropriate venue group
                if venue_value not in grouped_meetings:
                    grouped_meetings[venue_value] = []
                grouped_meetings[venue_value].append(meeting)

        return {
            "status": status.HTTP_200_OK,
            "message": "Meetings grouped by venue retrieved successfully",
            "data": convert_to_jsonable(grouped_meetings)
        }
    except Exception as e:
        return get_error_details(e)

# ===============================
# CRUD for MEETING PARTICIPANTS - starting
# ===============================
@meetings.post("/crm/meeting-participants/save")
async def save_meeting_participant(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    """
    Create or update a meeting participant using Pydantic models.
    """
    try:
        form = await request.form()
        doc_id = int(form.get("id"))

        if doc_id == 0:
            # Create new meeting participant
            participant_data = MeetingParticipantCreate()
            participant_data.meeting_id = int(form.get("meeting_id", 0))
            participant_data.type = form.get("type", "")
            participant_data.participants = form.get("participants", "[]")
            participant_data.tenant_id = user_detail["tenant_id"]
            participant_data.user_id = user_detail["id"]
            participant_data.active = int(form.get("active", 1))
            participant_data.sort_by = int(form.get("sort_by", 0))
            
            meeting_participants_collection.insert_one(participant_data.dict())
            return {
                "status": status.HTTP_200_OK,
                "message": "Meeting participant created successfully",
                "data": convert_to_jsonable(participant_data.dict())
            }
        else:
            # Update existing meeting participant
            participant_data = MeetingParticipantUpdate()
            participant_data.id = doc_id
            participant_data.meeting_id = int(form.get("meeting_id", 0))
            participant_data.type = form.get("type", "")
            participant_data.participants = form.get("participants", "[]")
            participant_data.tenant_id = user_detail["tenant_id"]
            participant_data.user_id = user_detail["id"]
            participant_data.active = int(form.get("active", 1))
            participant_data.sort_by = int(form.get("sort_by", 0))
            
            meeting_participants_collection.update_one(
                {"id": doc_id, "tenant_id": user_detail["tenant_id"]}, 
                {"$set": participant_data.dict()}
            )

            return {
                "status": status.HTTP_200_OK,
                "message": "Meeting participant updated successfully",
                "data": convert_to_jsonable(participant_data.dict())
            }
                
    except Exception as e:
        return get_error_details(e)

@meetings.post("/crm/meeting-participants/get/{meeting_id}")
async def get_meeting_participants(meeting_id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get all participants for a specific meeting.
    """
    try:
        participants = list(meeting_participants_collection.find(
            {"meeting_id": meeting_id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
            NO_ID_PROJECTION
        ).sort("id", -1))

        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": convert_to_jsonable(participants)
        }
    except Exception as e:
        return get_error_details(e)

@meetings.get("/crm/meeting-participants/{id}/deleted/{value}")
async def toggle_meeting_participant_deletion(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Soft delete or restore a meeting participant by toggling the 'deleted' flag.
    """
    try:
        meeting_participants_collection.update_one({"id": id, "tenant_id": user_detail["tenant_id"]}, {"$set": {"deleted": value}})
        message = "Record deleted successfully" if value else "Record restored successfully"
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": None
        }
    except Exception as e:
        return get_error_details(e)

@meetings.post("/crm/meetings/update-venue")
async def update_meeting_venue(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    
    try:
        form = await request.form()
        id = int(form.get("id"))
        venue_value = str(form.get("venue"))
        
        meeting_data = MeetingUpdateVenue()
        meeting_data.venue = venue_value
        
        meetings_collection.update_one(
            {"id": id, "tenant_id": user_detail["tenant_id"]}, 
            {"$set": meeting_data.dict()}
        )
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Record updated successfully",
            "data": convert_to_jsonable(meeting_data.dict())
        }
                
    except Exception as e:
        return get_error_details(e)


