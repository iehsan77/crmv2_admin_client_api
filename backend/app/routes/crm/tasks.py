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
    get_last_activity_date
)
from app.models.crm.tasks import TaskCreate, TaskUpdate, TaskUpdatePriority, TaskUpdateStatus, TaskInDB
from app.helpers.globalfunctions import build_crm_query, QUERY_TYPE_ALL, QUERY_TYPE_OWNED, QUERY_TYPE_TODAY
from app.helpers.crm_helper import get_entity_details, log_activity

# Router
tasks = APIRouter(tags=["CRM Admin - Tasks"])

# MongoDB Collection
tasks_collection = db.tasks

# Projection to exclude MongoDB _id
NO_ID_PROJECTION = {"_id": 0}

# ===============================
# CRUD for TASKS - starting
# ===============================

# Generate line chart data based on actual historical data
def generate_line_chart_data_from_tasks(tasks_collection, base_query, end_date, metric_type="total"):
    """
    Generate line chart data based on actual historical data for the last 7 days
    
    Args:
        tasks_collection: MongoDB collection
        base_query: Base query dict (without date range in due_date, will be added per day)
        end_date: datetime object for the end of the date range
        metric_type: Type of metric to generate (total, completed, overdue, due_today)
    """
    data = []
    
    for i in range(7):
        # Calculate date for this day
        current_date = end_date - timedelta(days=6-i)
        start_of_day = current_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = current_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Build query for this specific day
        # Remove due_date from base_query if it exists to avoid conflicts
        day_query = {k: v for k, v in base_query.items() if k != "due_date"}
        day_query["due_date"] = {
            "$gte": start_of_day.isoformat(),
            "$lte": end_of_day.isoformat()
        }
        
        # Count based on metric type
        if metric_type == "total":
            count = tasks_collection.count_documents(day_query)
        elif metric_type == "completed":
            count = tasks_collection.count_documents({**day_query, "status": {"$in": ["completed", "done"]}})
        elif metric_type == "overdue":
            # Tasks with due_date in the past and not completed
            count = tasks_collection.count_documents({
                **day_query, 
                "status": {"$nin": ["completed", "done"]},
                "due_date": {"$lt": datetime.now(timezone.utc).isoformat()}
            })
        elif metric_type == "due_today":
            count = tasks_collection.count_documents({**day_query, "due_date": {
                "$gte": start_of_day.isoformat(),
                "$lte": end_of_day.isoformat()
            }})
        else:
            count = tasks_collection.count_documents(day_query)
        
        data.append({"value": count})
    
    return data


@tasks.post("/crm/tasks/get-statistics")
async def get_statistics(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get task statistics for the given date range.
    """
    try:
        # Get form data
        form = await request.form()
        
        # Resolve current tenant id (default to 0 if missing)
        tenant_id = int(user_detail.get("tenant_id", 0))
        
        # Get date range parameters
        from_date_str = form.get("from", "")
        to_date_str = form.get("to", "")
        
        # Parse dates (simple ISO format)
        from_date = datetime.fromisoformat(from_date_str.replace('Z', '+00:00')) if from_date_str else datetime.now(timezone.utc)
        to_date = datetime.fromisoformat(to_date_str.replace('Z', '+00:00')) if to_date_str else datetime.now(timezone.utc)
        
        # Build base query for the date range and tenant
        base_query = {
            "tenant_id": tenant_id,
            "deleted": {"$ne": 1}
        }
        
        # Get tasks due today
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today + timedelta(days=1)
        due_today_query = {
            **base_query,
            "due_date": {
                "$gte": today.isoformat(),
                "$lt": tomorrow.isoformat()
            }
        }
        due_today_count = tasks_collection.count_documents(due_today_query)
        
        # Get priority breakdown for tasks due today
        priority_breakdown = list(tasks_collection.aggregate([
            {"$match": due_today_query},
            {"$group": {"_id": "$priority", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]))
        
        high_priority = next((p["count"] for p in priority_breakdown if (p["_id"] or "").lower() == "high"), 0)
        medium_priority = next((p["count"] for p in priority_breakdown if (p["_id"] or "").lower() == "medium"), 0)
        low_priority = next((p["count"] for p in priority_breakdown if (p["_id"] or "").lower() == "low"), 0)
        
        # Calculate task completion rate
        total_tasks_query = {**base_query, "due_date": {"$gte": from_date.isoformat(), "$lte": to_date.isoformat()}}
        total_tasks_assigned = tasks_collection.count_documents(total_tasks_query)
        tasks_completed = tasks_collection.count_documents({**total_tasks_query, "status_id": {"$in": [4]}})
        completion_rate = round((tasks_completed / total_tasks_assigned * 100), 1) if total_tasks_assigned > 0 else 0
        penetration = round((tasks_completed / total_tasks_assigned * 100), 1) if total_tasks_assigned > 0 else 0
        
        # Get upcoming tasks (1-5 days) within the provided range, using from_date as anchor
        window_start = from_date.replace(hour=0, minute=0, second=0, microsecond=0)
        day_1 = window_start + timedelta(days=1)
        days_1_2_end = window_start + timedelta(days=2)
        days_3_5_end = window_start + timedelta(days=5)

        def _date_field_range(field_name: str, start_dt: datetime, end_dt: datetime) -> dict:
            return {
                "$or": [
                    {field_name: {"$gte": start_dt, "$lt": end_dt}},
                    {
                        "$expr": {
                            "$and": [
                                {"$gte": [
                                    {"$convert": {"input": f"${field_name}", "to": "date", "onError": None, "onNull": None}},
                                    start_dt
                                ]},
                                {"$lt": [
                                    {"$convert": {"input": f"${field_name}", "to": "date", "onError": None, "onNull": None}},
                                    end_dt
                                ]}
                            ]
                        }
                    }
                ]
            }

        upcoming_1_2 = tasks_collection.count_documents({
            **base_query,
            **_date_field_range("due_date", day_1, days_1_2_end),
            "status_id": {"$nin": [4]}
        })

        upcoming_3_5 = tasks_collection.count_documents({
            **base_query,
            **_date_field_range("due_date", days_1_2_end, days_3_5_end),
            "status_id": {"$nin": [4]}
        })

        upcoming_total = upcoming_1_2 + upcoming_3_5

        # Get overdue tasks relative to to_date within tenant scope
        ref_now = to_date
        overdue_query = {
            **base_query,
            **_date_field_range("due_date", datetime.min.replace(year=1970), ref_now),
            "status_id": {"$nin": [4]}
        }
        overdue_total = tasks_collection.count_documents(overdue_query)

        # Breakdown overdue by days late relative to to_date
        overdue_0_3 = tasks_collection.count_documents({
            **base_query,
            **_date_field_range("due_date", ref_now - timedelta(days=3), ref_now),
            "status_id": {"$nin": [4]}
        })

        overdue_4_7 = tasks_collection.count_documents({
            **base_query,
            **_date_field_range("due_date", ref_now - timedelta(days=7), ref_now - timedelta(days=3)),
            "status_id": {"$nin": [4]}
        })

        overdue_8_plus = tasks_collection.count_documents({
            **base_query,
            **_date_field_range("due_date", datetime.min.replace(year=1970), ref_now - timedelta(days=7)),
            "status_id": {"$nin": [4]}
        })
        
        # Calculate dynamic percentage changes vs previous period of equal length
        def _pct_change(current_value: float, previous_value: float) -> str:
            try:
                if previous_value == 0:
                    return "+100.0%" if current_value > 0 else "+0.0%"
                delta = ((current_value - previous_value) / previous_value) * 100.0
                return f"{delta:+.1f}%"
            except Exception:
                return "+0.0%"

        period_days = max(1, (to_date - from_date).days or 1)
        prev_from = from_date - timedelta(days=period_days)
        prev_to = from_date

        # Previous period: completion rate
        total_tasks_query_prev = {**base_query, **_date_field_range("due_date", prev_from, prev_to)}
        total_tasks_assigned_prev = tasks_collection.count_documents(total_tasks_query_prev)
        tasks_completed_prev = tasks_collection.count_documents({**total_tasks_query_prev, "status_id": {"$in": [4]}})
        completion_rate_prev = round((tasks_completed_prev / total_tasks_assigned_prev * 100), 1) if total_tasks_assigned_prev > 0 else 0
        completion_rate_percent = _pct_change(completion_rate, completion_rate_prev)

        # Previous period: due today equivalent (the last day of previous window)
        prev_day_start = prev_to.replace(hour=0, minute=0, second=0, microsecond=0)
        prev_day_end = prev_day_start + timedelta(days=1)
        due_today_prev_query = {**base_query, **_date_field_range("due_date", prev_day_start, prev_day_end)}
        due_today_prev = tasks_collection.count_documents(due_today_prev_query)
        due_today_percent = _pct_change(due_today_count, due_today_prev)

        # Previous period: upcoming window (anchored to prev_from)
        prev_window_start = prev_from.replace(hour=0, minute=0, second=0, microsecond=0)
        prev_day_1 = prev_window_start + timedelta(days=1)
        prev_days_1_2_end = prev_window_start + timedelta(days=2)
        prev_days_3_5_end = prev_window_start + timedelta(days=5)

        upcoming_prev_1_2 = tasks_collection.count_documents({
            **base_query,
            **_date_field_range("due_date", prev_day_1, prev_days_1_2_end),
            "status_id": {"$nin": [4]}
        })
        upcoming_prev_3_5 = tasks_collection.count_documents({
            **base_query,
            **_date_field_range("due_date", prev_days_1_2_end, prev_days_3_5_end),
            "status_id": {"$nin": [4]}
        })
        upcoming_prev_total = upcoming_prev_1_2 + upcoming_prev_3_5
        upcoming_percent = _pct_change(upcoming_total, upcoming_prev_total)

        # Previous period: overdue relative to prev_to
        ref_prev_now = prev_to
        overdue_prev_total = tasks_collection.count_documents({
            **base_query,
            **_date_field_range("due_date", datetime.min.replace(year=1970), ref_prev_now),
            "status_id": {"$nin": [4]}
        })
        overdue_percent = _pct_change(overdue_total, overdue_prev_total)
        
        # Build dashboard view data with live counts
        dashboard_view = [
            {
                "icon": "/icons/calendar_with_exclamation.svg",
                "iconClass": "",
                "title": "Due Today",
                "total": f"{due_today_count} Tasks",
                "change": due_today_percent,
                "description": f"High Priority: {high_priority} | Medium Priority: {medium_priority} | Low Priority: {low_priority}",
                "lineChartData": generate_line_chart_data_from_tasks(tasks_collection, base_query, to_date, "due_today")
            },
            {
                "icon": "/icons/check_list_with_check.svg",
                "iconClass": "",
                "title": "Task Completion Rate",
                "total": f"{completion_rate}%",
                "change": completion_rate_percent,
                "description": f"Total Tasks Assigned: {total_tasks_assigned} | Tasks Completed: {tasks_completed} | Goal Rate: 85% | Tasks Penetration: {penetration}%",
                "lineChartData": generate_line_chart_data_from_tasks(tasks_collection, base_query, to_date, "completed")
            },
            {
                "icon": "/icons/check_list_with_clock.svg",
                "iconClass": "",
                "title": "Upcoming Tasks",
                "total": upcoming_total,
                "change": upcoming_percent,
                "description": f"Due in 1-2 Days: {upcoming_1_2} | Due in 3-5 Days: {upcoming_3_5}",
                "lineChartData": generate_line_chart_data_from_tasks(tasks_collection, base_query, to_date, "total")
            },
            {
                "icon": "/icons/check_list_with_calendar.svg",
                "iconClass": "",
                "title": "Overdue Tasks",
                "total": overdue_total,
                "change": overdue_percent,
                "description": f"0-3 Days Late: {overdue_0_3} | 4-7 Days Late: {overdue_4_7} | 8+ Days Late: {overdue_8_plus}",
                "lineChartData": generate_line_chart_data_from_tasks(tasks_collection, base_query, to_date, "overdue")
            },
        ]
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Task statistics retrieved successfully",
            "data": dashboard_view,
            "date_range": {
                "from": from_date.isoformat(),
                "to": to_date.isoformat()
            },
            "tenant_id": tenant_id
        }
        
    except Exception as e:
        return get_error_details(e)


@tasks.post("/crm/tasks/save")
async def save_task(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    """
    Create or update a task using JSON payload.
    
    Expected payload:
    {
        "id": 0,
        "subject": "Task Subject",
        "owner_id": 6,
        "due_date": "2025-10-28T19:00:00.000Z",
        "task_for": "contacts",
        "task_for_id": 1,
        "related_to": "accounts",
        "related_to_id": 1,
        "status_id": 1,
        "priority_id": 1,
        "reminder": "5 minutes before",
        "description": "Task description"
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
        
        next_id = doc_id or get_next_id(tasks_collection)

        if doc_id == 0:
            # Create new task
            task_data = TaskCreate()
            
            task_data.id = next_id
            task_data.ukey = str(user_detail['tenant_id']) + "000" + str(next_id)
            task_data.subject = to_str(payload.get("subject", ""))
            task_data.owner_id = to_int(payload.get("owner_id", 0), 0)
            task_data.due_date = to_str(payload.get("due_date", ""))
            task_data.task_for = to_str(payload.get("task_for", ""))
            task_data.task_for_id = to_int(payload.get("task_for_id", 0), 0)
            task_data.related_to = to_str(payload.get("related_to", ""))
            task_data.related_to_id = to_int(payload.get("related_to_id", 0), 0)
            task_data.status_id = to_int(payload.get("status_id", 0), 0)
            task_data.priority_id = to_int(payload.get("priority_id", 0), 0)
            task_data.reminder = to_str(payload.get("reminder", ""))
            task_data.description = to_str(payload.get("description", ""))
            task_data.tenant_id = to_int(user_detail["tenant_id"], 0)
            task_data.user_id = to_int(user_detail["id"], 0)
            task_data.completed_on = ""
            task_data.assigned_to_id = to_int(payload.get("assigned_to_id", 0), 0)
            
            # Check for duplicate tasks before inserting
            # Duplicate criteria: same subject + task_for + task_for_id + due_date within same tenant
            # Only check if we have at least subject and one other identifying field
            if task_data.subject and (task_data.task_for or task_data.due_date):
                duplicate_query = {
                    "tenant_id": task_data.tenant_id,
                    "deleted": {"$ne": 1},
                    "subject": task_data.subject
                }
                
                # Add task_for condition if provided
                if task_data.task_for:
                    duplicate_query["task_for"] = task_data.task_for
                
                # Add task_for_id condition if provided
                if task_data.task_for_id and task_data.task_for_id > 0:
                    duplicate_query["task_for_id"] = task_data.task_for_id
                
                # Add due_date condition if provided
                if task_data.due_date:
                    duplicate_query["due_date"] = task_data.due_date
                
                # Check if duplicate exists
                existing_task = tasks_collection.find_one(duplicate_query, NO_ID_PROJECTION)
                
                if existing_task:
                    duplicate_fields = []
                    if task_data.subject and existing_task.get("subject") == task_data.subject:
                        duplicate_fields.append("subject")
                    if task_data.task_for and existing_task.get("task_for") == task_data.task_for:
                        duplicate_fields.append("task_for")
                    if task_data.task_for_id and existing_task.get("task_for_id") == task_data.task_for_id:
                        duplicate_fields.append("task_for_id")
                    if task_data.due_date and existing_task.get("due_date") == task_data.due_date:
                        duplicate_fields.append("due_date")
                    
                    return {
                        "status": status.HTTP_409_CONFLICT,
                        "message": f"Duplicate task found with matching {', '.join(duplicate_fields)}. Task ID: {existing_task.get('id')}",
                        "data": {
                            "duplicate_task_id": existing_task.get("id"),
                            "duplicate_fields": duplicate_fields
                        }
                    }
            
            tasks_collection.insert_one(task_data.dict())
            # Create activity log for task creation
            log_activity(
                activity_type="task_created",
                entity_type="task",
                entity_id=next_id,
                user_detail=user_detail,
                title=f"Task created: {task_data.subject or 'No subject'}",
                description=f"Task created for {task_data.task_for or 'N/A'}",
                metadata={
                    "task_for": task_data.task_for,
                    "task_for_id": task_data.task_for_id,
                    "related_to": task_data.related_to,
                    "related_to_id": task_data.related_to_id,
                    "status_id": task_data.status_id,
                    "priority_id": task_data.priority_id,
                    "owner_id": task_data.owner_id
                }
            )
            
            task = tasks_collection.find_one({"id": next_id, "tenant_id": user_detail["tenant_id"]}, NO_ID_PROJECTION)
            enriched_task = enrich_task_data(task, user_detail)
            return {
                "status": status.HTTP_200_OK,
                "message": "Task created successfully",
                "data": convert_to_jsonable(enriched_task)
            }
        else:
            # Update existing task
            task_data = TaskUpdate()
            task_data.id = doc_id
            task_data.subject = to_str(payload.get("subject", ""))
            task_data.owner_id = to_int(payload.get("owner_id", 0), 0)
            task_data.due_date = to_str(payload.get("due_date", ""))
            task_data.task_for = to_str(payload.get("task_for", ""))
            task_data.task_for_id = to_int(payload.get("task_for_id", 0), 0)
            task_data.related_to = to_str(payload.get("related_to", ""))
            task_data.related_to_id = to_int(payload.get("related_to_id", 0), 0)
            task_data.status_id = to_int(payload.get("status_id", 0), 0)
            task_data.priority_id = to_int(payload.get("priority_id", 0), 0)
            task_data.reminder = to_str(payload.get("reminder", ""))
            task_data.description = to_str(payload.get("description", ""))
            task_data.tenant_id = to_int(user_detail["tenant_id"], 0)
            task_data.user_id = to_int(user_detail["id"], 0)
            task_data.assigned_to_id = to_int(payload.get("assigned_to_id", 0), 0)

            if task_data.status_id == 4:
                task_data.completed_on = datetime.now(timezone.utc).isoformat()
            
            tasks_collection.update_one(
                {"id": doc_id, "tenant_id": user_detail["tenant_id"]}, 
                {"$set": task_data.dict()}
            )

            task = tasks_collection.find_one({"id": doc_id, "tenant_id": user_detail["tenant_id"]}, NO_ID_PROJECTION)
            enriched_task = enrich_task_data(task, user_detail)
            
            # Create activity log for task update
            log_activity(
                activity_type="task_updated",
                entity_type="task",
                entity_id=doc_id,
                user_detail=user_detail,
                title=f"Task updated: {task_data.subject or 'No subject'}",
                description=f"Task modified for {task_data.task_for or 'N/A'}",
                metadata={
                    "task_for": task_data.task_for,
                    "task_for_id": task_data.task_for_id,
                    "related_to": task_data.related_to,
                    "related_to_id": task_data.related_to_id,
                    "status_id": task_data.status_id,
                    "priority_id": task_data.priority_id,
                    "owner_id": task_data.owner_id,
                    "completed_on": task_data.completed_on
                }
            )

            return {
                "status": status.HTTP_200_OK,
                "message": "Task updated successfully",
                "data": convert_to_jsonable(enriched_task)
            }
                
    except Exception as e:
        return get_error_details(e)

def build_tasks_filter_query(user_detail: dict, view: str = "all_tasks", subject: str = "",
                           related_to_name: str = "", status_id: str = "", priority_id: str = "",
                           due_date: str = "", reminder_date: str = "", owner_id: str = "",
                           last_modified_by: str = "", create_date: str = "", 
                           last_activity: str = "", completion_date: str = "", related_to: str = "", reminder: str = "") -> dict:
    """
    Build MongoDB query for filtering tasks based on various criteria.
    
    Args:
        user_detail: User details containing tenant_id and id
        view: View type for filtering
        subject: Subject filter (case-insensitive regex)
        related_to_name: Related entity name filter
        status_id: Status ID filter
        priority_id: Priority ID filter
        due_date: Due date filter
        reminder_date: Reminder date filter
        owner_id: Owner ID filter
        last_modified_by: Last modified by user ID filter
        create_date: Create date filter
        last_activity: Last activity date filter
        completion_date: Completion date filter
        
    Returns:
        MongoDB query dictionary
    """
    # Build base query
    query = {
        "tenant_id": user_detail["tenant_id"],
        "deleted": {"$ne": 1}
    }
    
    # Apply view-based filtering
    if view == "due_today":
        # Filter for tasks due today
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today + timedelta(days=1)
        query["due_date"] = {"$gte": today.isoformat(), "$lt": tomorrow.isoformat()}
        
    elif view == "due_this_week":
        # Filter for tasks due in the next 7 days
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        week_end = today + timedelta(days=7)
        query["due_date"] = {"$gte": today.isoformat(), "$lt": week_end.isoformat()}
        
    elif view == "overdue":
        # Filter for overdue tasks (not completed and past due date)
        now = datetime.utcnow()
        query["due_date"] = {"$lt": now.isoformat()}
        query["status_id"] = {"$nin": [3, 4]}  # Assuming 3=Completed, 4=Done
        
    elif view == "my_tasks":
        # Filter for tasks owned by current user
        query["owner_id"] = int(user_detail["id"])
        
    elif view == "favorite_tasks":
        # Filter for favorite tasks
        query["favorite"] = 1
        
    elif view == "related_to_leads":
        query["related_to"] = "leads"
        
    elif view == "related_to_deals":
        query["related_to"] = "deals"

    if reminder:
        query["reminder"] = {"$regex": reminder, "$options": "i"}
  
    # Apply search filters
    if subject:
        query["subject"] = {"$regex": subject, "$options": "i"}
        
    if status_id:
        try:
            query["status_id"] = int(status_id)
        except ValueError:
            pass
    
    if priority_id:
        try:
            query["priority_id"] = int(priority_id)
        except ValueError:
            pass
            
    if due_date:
        query["due_date"] = {"$regex": due_date, "$options": "i"}
    
    if reminder_date:
        query["reminder_date"] = {"$regex": reminder_date, "$options": "i"}

    if(related_to == "accounts"):
        query["related_to"] = "accounts"
    if(related_to == "deals"):
        query["related_to"] = "deals"
    if(related_to == "campaigns"):
        query["related_to"] = "campaigns"
            
    if owner_id:
        try:
            query["owner_id"] = int(owner_id)
        except ValueError:
            pass
    
    if last_modified_by:
        # Filter tasks by activity logs user_id → entity_id list (robust to schema differences)

        try:
            ids = db.activity_logs.find({"user_id": int(last_modified_by)}, {"entity_id": 1})
            ids = list(set([i.get("entity_id") for i in ids]))
            query["id"] = {"$in": ids}
        except Exception:
            query["id"] = {"$in": [-1]}
      
    
    if create_date:
        # Match exact calendar day for createdon (supports Date or ISO string)
        try:
            dt = datetime.fromisoformat(create_date.replace("Z", "+00:00"))
            if dt.tzinfo is not None:
                dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
            start_day = dt.replace(hour=0, minute=0, second=0, microsecond=0)
            end_day = start_day + timedelta(days=1)
            createdon_day_filter = {
                "$or": [
                    {"createdon": {"$gte": start_day, "$lt": end_day}},
                    {
                        "$expr": {
                            "$and": [
                                {"$gte": [
                                    {"$convert": {"input": "$createdon", "to": "date", "onError": None, "onNull": None}},
                                    start_day
                                ]},
                                {"$lt": [
                                    {"$convert": {"input": "$createdon", "to": "date", "onError": None, "onNull": None}},
                                    end_day
                                ]}
                            ]
                        }
                    }
                ]
            }
            if "$and" in query:
                query["$and"].append(createdon_day_filter)
            else:
                query["$and"] = [createdon_day_filter]
        except Exception:
            query["createdon"] = {"$regex": create_date, "$options": "i"}

    if completion_date:
        # Match exact calendar day by activity_logs.createdon and filter tasks by entity_id
        try:
            dt = datetime.fromisoformat(completion_date.replace("Z", "+00:00"))
            if dt.tzinfo is not None:
                dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
            start_day = dt.replace(hour=0, minute=0, second=0, microsecond=0)
            end_day = start_day + timedelta(days=1)

            logs_filter = {
                "entity_type": {"$regex": "^task", "$options": "i"},
                "tenant_id": user_detail["tenant_id"],
                "deleted": {"$ne": 1},
                "$or": [
                    {"createdon": {"$gte": start_day, "$lt": end_day}},
                    {
                        "$expr": {
                            "$and": [
                                {"$gte": [
                                    {"$convert": {"input": "$createdon", "to": "date", "onError": None, "onNull": None}},
                                    start_day
                                ]},
                                {"$lt": [
                                    {"$convert": {"input": "$createdon", "to": "date", "onError": None, "onNull": None}},
                                    end_day
                                ]}
                            ]
                        }
                    }
                ]
            }

            activities = list(db.activity_logs.find(logs_filter, {"entity_id": 1}))
            task_ids: set[int] = set()
            for a in activities:
                eid = a.get("entity_id")
                if eid is None:
                    continue
                try:
                    task_ids.add(int(eid))
                except Exception:
                    continue

            # Merge with existing ids (AND logic) if present
            if "id" in query and isinstance(query["id"], dict) and "$in" in query["id"]:
                existing = set(query["id"]["$in"])
                task_ids = task_ids.intersection(existing)

            query["id"] = {"$in": list(task_ids)} if task_ids else {"$in": [-1]}
            query["status_id"] = 4
        except Exception:
            query["id"] = {"$in": [-1]}

    
    
    last_activity_duration = None
    if last_activity in ["last_24_hours", "last_7_days", "last_30_days"]:
        last_activity_duration = last_activity


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
            
            # Query activity_logs to get lead IDs with activity in the specified time range
            activity_logs = list(db.activity_logs.find({
                "entity_type": "task",
                "tenant_id": tenant_id,
                "deleted": {"$ne": 1},
                "createdon": {"$gte": start_time_iso}
            }, {"entity_id": 1}))
            
            # Collect unique lead IDs from activity_logs
            lead_ids = set()
            for activity in activity_logs:
                if activity.get("entity_id"):
                    lead_ids.add(activity["entity_id"])
            
            # Merge with existing query["id"] if it exists (AND logic)
            if "id" in query and "$in" in query["id"]:
                existing_ids = set(query["id"]["$in"])
                lead_ids = lead_ids.intersection(existing_ids)
            
            # Filter leads by IDs with activity in the specified time range
            if lead_ids:
                query["id"] = {"$in": list(lead_ids)}
            else:
                # No activity found in the time range, return empty result
                query["id"] = {"$in": []}
                
        except Exception as e:
            # If parsing fails, ignore the last_activity filter
            print(f"Error parsing last_activity: {e}")
    
    
  
    return query

def get_related_entity_data(related_to: str, related_to_id: int, tenant_id: int) -> dict:

    try:
        related_entity = db[related_to].find_one(
                {"id": related_to_id, "tenant_id": tenant_id, "deleted": {"$ne": 1}},
                NO_ID_PROJECTION
            )
        
        return related_entity or {}
    except Exception:
        return {}


def enrich_task_data(task: dict, user_detail: dict) -> dict:
    """
    Enrich task data with related user and entity information.
    
    Args:
        task: Task document from database
        user_detail: User details containing tenant_id
        
    Returns:
        Enriched task document
    """
    if task is None:
        raise ValueError("Task document is None, cannot enrich task data")
    
    # Get owner_details (user information for owner)
    owner = db.users.find_one(
        {"id": task.get("owner_id")},
        NO_ID_PROJECTION
    )
    task["owner_details"] = owner or {}
    task["owner"] = owner or {}  # Keep for backward compatibility
    
    # Get user information for user_id
    user = db.users.find_one(
        {"id": task.get("user_id")},
        NO_ID_PROJECTION
    )
    task["user_details"] = db.users.find_one({"id": task.get("user_id")}, NO_ID_PROJECTION) or {}
    
    task["last_activity_date"] = get_last_activity_date('task', task.get("id"))

    task["assigned_to_details"] = db.users.find_one(
        {"id": task.get("assigned_to_id")},
        NO_ID_PROJECTION
    ) or {}
    
    if task.get("related_to") and task.get("related_to_id"):
        if not task.get("related_to_details"):
            task["related_to_details"] = get_related_entity_data(
                task["related_to"], 
                task["related_to_id"], 
                user_detail["tenant_id"]
            )
    else:
        task["related_to_details"] = {}    

    return task


@tasks.post("/crm/tasks/get")
async def get_tasks(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get all tasks for the current tenant with filters.
    
    Payload:
    {
        "view": "all_tasks",
        "page": 1,
        "limit": 20,
        "subject": "",
        "related_to_name": "",
        "status_id": "",
        "priority_id": "",
        "due_date": "",
        "reminder_date": "",
        "owner_id": "",
        "last_modified_by": "",
        "create_date": "",
        "last_activity": "",
        "completion_date": ""
    }
    """
    try:
        # Try to get JSON payload first, fallback to form data
        try:
            payload = await request.json()
        except:
            form = await request.form()
            payload = dict(form)
        
        # Extract filter parameters
        view = payload.get("view", "all_tasks")
        subject = str(payload.get("subject", "")).strip()
        related_to_name = str(payload.get("related_to_name", "")).strip()
        status_id = str(payload.get("status_id", "")).strip()
        priority_id = str(payload.get("priority_id", "")).strip()
        due_date = str(payload.get("due_date", "")).strip()
        reminder_date = str(payload.get("reminder_date", "")).strip()
        owner_id = str(payload.get("owner_id", "")).strip()
        last_modified_by = str(payload.get("last_modified_by", "")).strip()
        create_date = str(payload.get("create_date", "")).strip()
        last_activity = str(payload.get("last_activity", "")).strip()
        completion_date = str(payload.get("completion_date", "")).strip()
        related_to = str(payload.get("related_to", "")).strip()
        reminder = str(payload.get("reminder", "")).strip()
        
        # Pagination parameters
        page = int(payload.get("page", 1))
        limit = int(payload.get("limit", 20))
        skip = (page - 1) * limit
        
        # Build query using the filter function
        query = build_tasks_filter_query(
            user_detail=user_detail,
            view=view,
            subject=subject,
            related_to_name=related_to_name,
            status_id=status_id,
            priority_id=priority_id,
            due_date=due_date,
            reminder_date=reminder_date,
            owner_id=owner_id,
            last_modified_by=last_modified_by,
            create_date=create_date,
            last_activity=last_activity,
            completion_date=completion_date,
            related_to = related_to,
            reminder = reminder
        )
        
        # Get total count for pagination
        total_count = tasks_collection.count_documents(query)
        
        # Execute query with pagination
        tasks = list(tasks_collection.find(query, NO_ID_PROJECTION).sort("id", -1).skip(skip).limit(limit))

        # Enrich task data
        records = []
        if tasks:
            for task in tasks:
                enriched_task = enrich_task_data(task, user_detail)
                records.append(enriched_task)

        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": convert_to_jsonable(records),
            "filters_applied": {
                "view": view,
                "subject": subject,
                "related_to_name": related_to_name,
                "status_id": status_id,
                "priority_id": priority_id,
                "due_date": due_date,
                "reminder_date": reminder_date,
                "owner_id": owner_id,
                "last_modified_by": last_modified_by,
                "create_date": create_date,
                "last_activity": last_activity,
                "completion_date": completion_date
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

@tasks.get("/crm/tasks/get-by-view-ukey/{ukey}")
async def get_tasks_by_view_id(ukey: str, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get tasks based on custom view configuration with optimized query building.
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
            tasks_collection
            .find(query, NO_ID_PROJECTION)
            .sort("id", -1)
            .limit(1000)  # Add reasonable limit to prevent memory issues
        )

        # Add owner and user details to each task
        for task in records:
            # Get user information for owner
            owner = db.users.find_one(
                {"id": task.get("owner_id")},
                NO_ID_PROJECTION
            )
            task["owner"] = owner or {}
            
            # Get user information for user_id
            user = db.users.find_one(
                {"id": task.get("user_id")},
                NO_ID_PROJECTION
            )
            task["user"] = user or {}

        return json_response("Records retrieved successfully", records)

    except Exception as e:
        return get_error_response(e)

@tasks.post("/crm/tasks/get/{id}")
async def get_task_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get a single task by ID.
    """
    try:
        task = tasks_collection.find_one({"id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}}, NO_ID_PROJECTION)
        if task:
            return {
                "status": status.HTTP_200_OK,
                "message": "Record retrieved successfully",
                "data": convert_to_jsonable(task)
            }
        return {
            "status": status.HTTP_404_NOT_FOUND,
            "message": "Record not found",
            "data": None
        }
    except Exception as e:
        return get_error_details(e)



@tasks.get("/crm/tasks/details/get/{id}")
async def get_task_details_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    return get_entity_details("task", id, user_detail)


@tasks.get("/crm/tasks/clone/{id}")
async def clone_task_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        # Find the original task
        task = tasks_collection.find_one(
            {"id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
            NO_ID_PROJECTION
        )

        if not task:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Original record not found",
                "data": None
            }

        task.pop("_id", None)
        old_id = task.get("id")
        new_id = get_next_id(tasks_collection)

        cursor = tasks_collection.find(
            {}, NO_ID_PROJECTION
        ).sort("ukey", -1).limit(1)

        latest_doc = next(cursor, None)
        
        latest_ukey = int(latest_doc["ukey"]) if latest_doc and "ukey" in latest_doc else 9999
        next_ukey = latest_ukey + 1

        # Set new fields
        task["id"] = new_id
        task["ukey"] = str(next_ukey)
        #task["created_at"] = datetime.utcnow()
        #task["updated_at"] = None

        # Insert cloned record
        tasks_collection.insert_one(task)

        return {
            "status": status.HTTP_201_CREATED,
            "message": f"task (cloned from {old_id}) created successfully",
            "data": convert_to_jsonable(task)
        }

    except Exception as e:
        return get_error_details(e)
   
@tasks.post("/crm/tasks/details/get/{ukey}")
async def get_tasks_by_id(ukey: str, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        task = tasks_collection.find_one({"ukey": ukey, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}}, NO_ID_PROJECTION)
        if task:
            
            task["owner_details"] = db.users.find_one({"id": task.get("owner_id")}, NO_ID_PROJECTION)
            task["user_details"] = db.users.find_one({"id": task.get("user_id")}, NO_ID_PROJECTION)            
            task["task_for_details"] = db[task.get("task_for")].find_one({"id": task.get("task_for_id")}, NO_ID_PROJECTION)
            task["related_to_details"] = db[task.get("related_to")].find_one({"id": task.get("related_to_id")}, NO_ID_PROJECTION)

            return {
                "status": status.HTTP_200_OK,
                "message": "Record retrieved successfully",
                "data": convert_to_jsonable(task)
            }
        return {
            "status": status.HTTP_404_NOT_FOUND,
            "message": "Record not found",
            "data": None
        }
    except Exception as e:
        return get_error_details(e)
 
@tasks.get("/crm/tasks/{id}/deleted/{value}")
async def toggle_task_deletion(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Soft delete or restore a task by toggling the 'deleted' flag.
    """
    try:
        tasks_collection.update_one({"id": id, "tenant_id": user_detail["tenant_id"]}, {"$set": {"deleted": value}})
        message = "Record deleted successfully" if value else "Record restored successfully"
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": None
        }
    except Exception as e:
        return get_error_details(e)

@tasks.post("/crm/tasks/get-by-related")
async def get_tasks_by_related(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get tasks by related_to and related_to_id.
    """
    try:
        form = await request.form()
        tasks = list(tasks_collection.find(
            {
                "related_to": form["related_to"], 
                "related_to_id": int(form["related_to_id"]), 
                "tenant_id": user_detail["tenant_id"], 
                "deleted": {"$ne": 1}
            }, 
            NO_ID_PROJECTION
        ).sort("id", -1))
        
        records = []
        if tasks:
            for task in tasks:
                # Get user information for owner
                owner = db.users.find_one(
                    {"id": task.get("owner_id")},
                    NO_ID_PROJECTION
                )
                task["owner"] = owner or {}
                
                # Get user information for user_id
                user = db.users.find_one(
                    {"id": task.get("user_id")},
                    NO_ID_PROJECTION
                )
                task["user"] = user or {}
                
                records.append(task)
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": convert_to_jsonable(records)
        }
    except Exception as e:
        return get_error_details(e)

@tasks.post("/crm/tasks/get-grouped-by-status")
async def get_tasks_grouped_by_status(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get all tasks grouped by their status from the task_status collection.
    Uses MongoDB aggregation pipeline for efficient handling of large datasets.
    Ensures no duplicate records are returned.
    
    Performance optimizations:
    - Single aggregation pipeline with $lookup for joins
    - Indexed queries on tenant_id, status_id, deleted
    - Batch processing to avoid N+1 queries
    - Returns all tasks for each status group
    
    Returns:
        A list of status groups, each containing:
        - Status details from task_status collection
        - Array of unique tasks matching that status_id
        - Enriched task data with owner and user details via $lookup
    """
    try:
        # Get form data for filtering
        form = await request.form()
        include_enrichment = form.get("include_enrichment", "true").lower() == "true"
        
        tenant_id = user_detail["tenant_id"]
        
        # Get all task statuses from the task_status collection
        task_statuses = list(db.task_status.find(
            {"deleted": {"$ne": 1}},
            NO_ID_PROJECTION
        ).sort("id", 1))
        
        # Create a map of status_id -> status details for quick lookup
        status_map = {str(status["id"]): status for status in task_statuses}
        
        # Build optimized aggregation pipeline
        # This pipeline groups tasks by status_id in a single database operation
        pipeline = [
            # Stage 1: Match tenant's non-deleted tasks (uses index: tenant_id + deleted)
            {
                "$match": {
                    "tenant_id": tenant_id,
                    "deleted": {"$ne": 1}
                }
            },
            # Stage 2: Sort by due_date descending (most recent first)
            {
                "$sort": {"due_date": -1}
            },
            # Stage 3: Group by status_id and collect unique tasks
            {
                "$group": {
                    "_id": "$status_id",
                    "total_tasks": {"$sum": 1},
                    # Use $push to collect all tasks
                    "all_tasks": {"$push": "$$ROOT"}
                }
            }
        ]
        
        # Execute aggregation - single database roundtrip
        aggregation_result = list(tasks_collection.aggregate(pipeline))
        
        # Create lookup map: status_id -> {total_tasks, task_ids}
        tasks_by_status = {}
        all_task_ids = set()  # Track all unique task IDs
        
        for group in aggregation_result:
            status_id = str(group["_id"]) if group["_id"] else "unknown"
            tasks_data = group["all_tasks"]  # Get all tasks (no limit)
            
            # Extract unique task IDs (ensure no duplicates)
            task_ids = []
            seen_ids = set()
            for task in tasks_data:
                task_id = task.get("id")
                if task_id and task_id not in seen_ids:
                    seen_ids.add(task_id)
                    task_ids.append(task_id)
                    all_task_ids.add(task_id)
            
            tasks_by_status[status_id] = {
                "total_tasks": group["total_tasks"],
                "task_ids": task_ids
            }
        
        # If enrichment is requested, use aggregation with $lookup for batch enrichment
        enriched_tasks_map = {}
        if include_enrichment and all_task_ids:
            # Aggregation pipeline for enriching tasks with user details
            # Uses $lookup for efficient joins (similar to SQL JOINs)
            enrich_pipeline = [
                # Match only the tasks we need (uses index: id)
                {
                    "$match": {
                        "id": {"$in": list(all_task_ids)},
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
            enriched_tasks = list(tasks_collection.aggregate(enrich_pipeline))
            
            # Create map for quick lookup by task ID
            for task in enriched_tasks:
                task_id = task.get("id")
                if task_id:
                    # Add backward compatibility fields
                    task["owner"] = task.get("owner_details", {})
                    task["user"] = task.get("user_details", {})
                    
                    # Remove _id from nested objects if present
                    for key in ["owner_details", "user_details"]:
                        if isinstance(task.get(key), dict):
                            task[key].pop("_id", None)
                    
                    enriched_tasks_map[task_id] = task
        
        # Build final result structure
        grouped_data = []
        total_tasks_count = 0
        
        # Ensure all status groups are included (even with 0 tasks)
        for status_id_str, status_info in status_map.items():
            # Get task data for this status
            status_data = tasks_by_status.get(status_id_str, {"total_tasks": 0, "task_ids": []})
            
            # Build status group result
            result_group = {
                **status_info,
                "total_tasks": status_data["total_tasks"],
                "tasks": []
            }
            
            # Add enriched tasks in order, ensuring no duplicates
            if include_enrichment:
                seen_in_group = set()
                for task_id in status_data["task_ids"]:
                    if task_id not in seen_in_group and task_id in enriched_tasks_map:
                        result_group["tasks"].append(enriched_tasks_map[task_id])
                        seen_in_group.add(task_id)
            else:
                # Just include task IDs without enrichment (faster for dashboards)
                result_group["task_ids"] = status_data["task_ids"]
            
            grouped_data.append(result_group)
            total_tasks_count += status_data["total_tasks"]

        return {
            "status": status.HTTP_200_OK,
            "message": "Tasks grouped by status retrieved successfully",
            "data": convert_to_jsonable(grouped_data),
            "summary": {
                "total_tasks": total_tasks_count,
                "total_status_groups": len(task_statuses),
                "enrichment_enabled": include_enrichment
            }
        }
    except Exception as e:
        return get_error_details(e)

@tasks.post("/crm/tasks/get-grouped-by-priority")
async def get_tasks_grouped_by_priority(user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get all tasks for the current tenant grouped by priority.
    """
    try:
        # Get all tasks for the tenant
        tasks = list(tasks_collection.find(
            {"tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
            NO_ID_PROJECTION
        ).sort("id", -1))

        # Group tasks by priority
        grouped_tasks = {}
        
        if tasks:
            for task in tasks:
                priority_value = task.get("priority", "Unknown")
                
                # Get user information for owner
                owner = db.users.find_one(
                    {"id": task.get("owner_id")},
                    NO_ID_PROJECTION
                )
                task["owner"] = owner or {}
                
                # Get user information for user_id
                user = db.users.find_one(
                    {"id": task.get("user_id")},
                    NO_ID_PROJECTION
                )
                task["user"] = user or {}
                
                # Add task to the appropriate priority group
                if priority_value not in grouped_tasks:
                    grouped_tasks[priority_value] = []
                grouped_tasks[priority_value].append(task)

        return {
            "status": status.HTTP_200_OK,
            "message": "Tasks grouped by priority retrieved successfully",
            "data": convert_to_jsonable(grouped_tasks)
        }
    except Exception as e:
        return get_error_details(e)




@tasks.post("/crm/tasks/update-priority")
async def update_task_priority(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    """
    Update task priority by ID.
    
    Payload:
    {
        "id": 123,
        "priority": 1
    }
    """
    try:
        # Try to get JSON payload first, fallback to form data
        try:
            payload = await request.json()
        except:
            form = await request.form()
            payload = dict(form)
        
        id = int(payload.get("id"))
        priority_value = int(payload.get("priority"))
        
        task_data = TaskUpdatePriority()
        task_data.priority_id = priority_value
        
        tasks_collection.update_one(
            {"id": id, "tenant_id": user_detail["tenant_id"]}, 
            {"$set": task_data.dict()}
        )
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Record updated successfully",
            "data": convert_to_jsonable(task_data.dict())
        }
                
    except Exception as e:
        return get_error_details(e)


@tasks.post("/crm/tasks/update-status")
async def update_task_status(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    """
    Update task status by ID.
    
    Payload:
    {
        "id": 123,
        "status": 1
    }
    """
    try:
        # Try to get JSON payload first, fallback to form data
        """
        try:
            payload = await request.json()
        except:
            form = await request.form()
            payload = dict(form)
        
        id = int(payload.get("id"))
        status_value = int(payload.get("status_id"))
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
    
        
        
        task_data = TaskUpdateStatus()
        task_data.status_id = status_value
        
        tasks_collection.update_one(
            {"id": id, "tenant_id": user_detail["tenant_id"]}, 
            {"$set": task_data.dict()}
        )
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Record updated successfully",
            "data": convert_to_jsonable(task_data.dict())
        }
                
    except Exception as e:
        return get_error_details(e)


@tasks.get("/crm/tasks/{id}/favorite/{value}")
async def toggle_task_favorite(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Toggle favorite status for a task by setting the 'favorite' flag.
    Default value is 0 (not favorite), 1 for favorite.
    """
    try:
        tasks_collection.update_one(
            {"id": id, "tenant_id": user_detail["tenant_id"]}, 
            {"$set": {"favorite": value}}
        )
        message = "Task marked as favorite" if value else "Task unmarked as favorite"
        
        log_activity(
            activity_type="task_marked_as_favorite" if value else "task_unmarked_as_favorite",
            entity_type="task",
            entity_id=id,
            user_detail=user_detail,
            title=f"Task {'marked as favorite' if value else 'unmarked as favorite'}",
            description=f"Task {'marked as favorite' if value else 'unmarked as favorite'}",
            metadata={}
        )
        
        return json_response(message)
    except Exception as e:
        return get_error_response(e)


# ===============================
# CRUD for TASKS - ending
# =============================== 

