from fastapi import APIRouter, Request, status, Depends
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from bson import ObjectId

from app.networks.database import db, db_rentify

from app.helpers.general_helper import (
    get_last_activity_date,
    get_error_details,
    convert_to_jsonable,
    get_next_id
)

NO_ID_PROJECTION = {"_id": 0}

accounts_collection = db.accounts
users_collection = db.users
favorite_collection = db_rentify.rentify_favorites

def get_related_records(collection, filters, projection):
    """Safely fetch related records from any collection."""
    try:
        return list(db[collection].find(filters, projection).sort("id", -1))
    except Exception:
        return []

def build_summary(entity_data):
    """Count summary of related entities dynamically."""
    return {f"{k}_count": len(v) for k, v in entity_data.items() if isinstance(v, list)}

def get_user_details(user_id, tenant_id):
    return db.users.find_one(
        {"id": user_id, "tenant_id": tenant_id},
        {"_id": 0, "password": 0}  # exclude sensitive info
    )

def get_notes(entity, id, tenant_id):
    notes = get_related_records(
        "notes",
        {
            "related_to": entity,
            "related_to_id": id,
            "tenant_id": tenant_id,
            "deleted": {"$ne": 1}
        },
        {"_id": 0}
    )
    enriched_notes = []
    for note in notes:
        user_details = get_user_details(note.get("user_id"), tenant_id)
        enriched_notes.append({
            **note,
            "user_details": user_details or {}
        })
    return enriched_notes

def get_tasks(entity, id, tenant_id):
    tasks = get_related_records(
        "tasks",
        {
            "task_for": entity,
            "task_for_id": id,
            "tenant_id": tenant_id,
            "deleted": {"$ne": 1}
        },
        {"_id": 0}
    )
    enriched_tasks = []
    for task in tasks:
        owner_details = get_user_details(task.get("owner_id"), tenant_id)
        enriched_tasks.append({
            **task,
            "owner_details": owner_details or {}
        })
    return enriched_tasks

def get_calls(entity, id, tenant_id):
    calls = get_related_records(
        "calls",
        {
            "call_for": entity,
            "call_for_id": id,
            "tenant_id": tenant_id,
            "deleted": {"$ne": 1}
        },
        {"_id": 0}
    )
    enriched_calls = []
    for call in calls:
        owner_details = get_user_details(call.get("owner_id"), tenant_id)
        enriched_calls.append({
            **call,
            "owner_details": owner_details or {}
        })
    return enriched_calls



def get_entity_details(entity_name: str, id: int, user_detail: dict):
    """
    Generic function to fetch entity (lead/contact/deal/task/meeting/call/account) details.
    """
    try:
        tenant_id = user_detail["tenant_id"]

        # Base collection
        collection = db[entity_name + "s"]

        # Get main entity
        record = collection.find_one(
            {"id": id, "tenant_id": tenant_id, "deleted": {"$ne": 1}},
            {"_id": 0}
        )

        if not record:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": f"{entity_name.capitalize()} not found",
                "data": None
            }

        # Common enrichments
        record["owner_details"] = db.users.find_one({"id": record.get("owner_id")}) or {}
        record["user_details"] = db.users.find_one({"id": record.get("user_id")}) or {}

        # Attach related data (shared across CRM modules)
        related_data: Dict[str, Any] = {}

        # Common filters/helpers for activity logs and meetings
        plural_name = f"{entity_name}s"
        activity_filter = {
            "entity_type": entity_name,
            "entity_id": id,
            "tenant_id": tenant_id,
            "deleted": {"$ne": 1},
        }
        meetings_filter = {
            "meeting_for": plural_name,
            "meeting_for_ids": {"$regex": f'\"{id}\"'},
            "tenant_id": tenant_id,
            "deleted": {"$ne": 1},
        }

        # Module-specific related data
        if entity_name == "lead":
            related_data.update({
                "activity_log": get_related_records("activity_logs", activity_filter, {"_id": 0}),
                "notes": get_notes("leads", id, tenant_id),
                "tasks": get_tasks("leads", id, tenant_id),
                "meetings": get_related_records("meetings", meetings_filter, {"_id": 0}),
                "calls": get_calls("leads", id, tenant_id),
                "assign_to_details": users_collection.find_one(
                    {
                        "id": int(record.get("assigned_to_id")),
                        "tenant_id": tenant_id,
                        "deleted": {"$ne": 1},
                    },
                    {
                        "_id": 0,
                        "first_name": 1,
                        "last_name": 1,
                        "email": 1,
                        "phone": 1,
                        "mobile": 1,
                        "fax": 1,
                        "website": 1,
                        "image": 1,
                    },
                ),
                "account_details": accounts_collection.find_one(
                    {"id": int(record.get("account_id")), "deleted": {"$ne": 1}},
                    {"_id": 0},
                ),
            })

        elif entity_name == "contact":
            related_data.update({
                "activity_log": get_related_records("activity_logs", activity_filter, {"_id": 0}),
                "notes": get_notes("contacts", id, tenant_id),
                "tasks": get_tasks("contacts", id, tenant_id),
                "meetings": get_related_records("meetings", meetings_filter, {"_id": 0}),
                "calls": get_calls("calls", id, tenant_id),
            })

        elif entity_name == "account":
            related_data.update({
                "activity_log": get_related_records("activity_logs", activity_filter, {"_id": 0}),
                "notes": get_notes("accounts", id, tenant_id),
                "tasks": get_tasks("accounts", id, tenant_id),
                "meetings": get_related_records("meetings", meetings_filter, {"_id": 0}),
                "calls": get_calls("accounts", id, tenant_id),
            })

        elif entity_name == "deal":
            related_data.update({
                "activity_log": get_related_records("activity_logs", activity_filter, {"_id": 0}),
                "notes": get_notes("deals", id, tenant_id),
                "tasks": get_tasks("deals", id, tenant_id),
                "meetings": get_related_records("meetings", meetings_filter, {"_id": 0}),
                "calls": get_calls("deals", id, tenant_id),
            })

        """
        elif entity_name in ["deal", "task", "meeting", "call"]:
            related_data.update({
                "notes": related_data["notes"],
                "attachments": related_data["attachments"],
            })
        """
        # Add all related data into the record
        record.update(related_data)

        # Last activity date
        record["last_activity_date"] = get_last_activity_date(entity_name, record["id"],tenant_id)


        return {
            "status": status.HTTP_200_OK,
            "message": f"{entity_name.capitalize()} details retrieved successfully",
            "data": convert_to_jsonable(record),
            "summary": build_summary(related_data)
        }

    except Exception as e:
        return get_error_details(e)


def log_activity(
    activity_type: str,
    entity_type: str,
    entity_id: int,
    user_detail: dict,
    title: str,
    description: str,
    metadata: Optional[Dict[str, Any]] = None,
    use_rentify_db: bool = False
) -> None:
    """
    Global helper function to log activity to activity_logs collection.
    
    Args:
        activity_type: Type of activity (e.g., "call_created", "call_updated", "lead_saved")
        entity_type: Type of entity (e.g., "call", "lead", "account", "deal", "affiliate", "booking", "vehicle")
        entity_id: ID of the entity
        user_detail: User detail dictionary containing tenant_id and id (user_id)
        title: Title of the activity log
        description: Description of the activity log
        metadata: Optional dictionary containing additional metadata
        use_rentify_db: If True, uses db_rentify instead of db (default: False for CRM, True for Rentify)
    
    Returns:
        None (logs errors silently to not interrupt main operations)
    """
    try:
        # Determine which database to use based on entity type or explicit flag
        if use_rentify_db or entity_type in ["affiliate", "booking", "vehicle", "payment", "vehicle_return", "refund_request"]:
            activity_logs_collection = db_rentify.activity_logs
        else:
            activity_logs_collection = db.activity_logs
            
        tenant_id = int(user_detail.get("tenant_id", 0))
        user_id = int(user_detail.get("id", 0))  # Use 'id' for user_id, not 'tenant_id'
        
        activity_log = {
            "id": get_next_id(activity_logs_collection),
            "activity_type": activity_type,
            "entity_type": entity_type,
            "entity_id": int(entity_id),
            "tenant_id": tenant_id,
            "user_id": user_id,
            "title": title,
            "description": description,
            "createdon": datetime.now(timezone.utc).isoformat(),
            "metadata": metadata or {},
            "deleted": 0,
            "active": 1
        }
        
        activity_logs_collection.insert_one(activity_log)
    except Exception as e:
        # Don't fail the main operation if logging fails
        print(f"[LOG WARNING] Failed to insert activity log: {e}")
        pass


def get_favorite(favorite_type: str, favorite_id: int, tenant_id: int) -> int:
    """
    Return 1 if a favorite exists for the given type/id/tenant, otherwise 0.
    """
    exists = favorite_collection.find_one(
        {
            "favorite_type": favorite_type,
            "favorite_id": favorite_id,
            "tenant_id": tenant_id,
        },
        NO_ID_PROJECTION,
    )
    return 1 if exists else 0