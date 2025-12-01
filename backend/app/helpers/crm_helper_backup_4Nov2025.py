from fastapi import APIRouter, Request, status, Depends
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from bson import ObjectId

from app.networks.database import db

from app.helpers.general_helper import (
    get_last_activity_date,
    get_error_details,
    convert_to_jsonable
)


def get_related_records(collection, filters, projection):
    """Safely fetch related records from any collection."""
    try:
        return list(db[collection].find(filters, projection).sort("id", -1))
    except Exception:
        return []

def build_summary(entity_data):
    """Count summary of related entities dynamically."""
    return {f"{k}_count": len(v) for k, v in entity_data.items() if isinstance(v, list)}

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
        related_to_value = entity_name + "s"

        related_data = {
            "notes": get_related_records("notes", {
                "related_to": related_to_value,
                "related_to_id": id,
                "tenant_id": tenant_id,
                "deleted": {"$ne": 1}
            }, {"_id": 0}),
            
            "attachments": get_related_records("attachments", {
                "related_to": related_to_value,
                "related_to_id": id,
                "tenant_id": tenant_id,
                "deleted": {"$ne": 1}
            }, {"_id": 0}),
            
            "activity_logs": get_related_records("activity_logs", {
                "entity_type": entity_name,
                "entity_id": id,
                "tenant_id": tenant_id,
                "deleted": {"$ne": 1}
            }, {"_id": 0}),
            
            "calls": get_related_records("calls", {"related_to": "calls", "related_to_id": id, "tenant_id": tenant_id, "deleted": {"$ne": 1}}, {"_id": 0}),
            
            "tasks": get_related_records("tasks", {"related_to": "tasks", "related_to_id": id, "tenant_id": tenant_id, "deleted": {"$ne": 1}}, {"_id": 0}),   
            
            "meetings":[],
        }   

        # Module-specific related data
        if entity_name == "deal":
            related_data.update({
                "deals": get_related_records("deals", {"account_id": id, "tenant_id": tenant_id, "deleted": {"$ne": 1}}, {"_id": 0}),
                "invoices": get_related_records("invoices", {"account_id": id, "tenant_id": tenant_id, "deleted": {"$ne": 1}}, {"_id": 0}),
                "quotes": get_related_records("quotes", {"account_id": id, "tenant_id": tenant_id, "deleted": {"$ne": 1}}, {"_id": 0}),
                "orders": get_related_records("orders", {"account_id": id, "tenant_id": tenant_id, "deleted": {"$ne": 1}}, {"_id": 0}),
                "bookings": get_related_records("bookings", {"account_id": id, "tenant_id": tenant_id, "deleted": {"$ne": 1}}, {"_id": 0}),
            })
            
        elif entity_name == "account":
            related_data.update({
                "contacts": get_related_records("contacts", {"account_id": id, "tenant_id": tenant_id, "deleted": {"$ne": 1}}, {"_id": 0}),
                "deals": get_related_records("deals", {"account_id": id, "tenant_id": tenant_id, "deleted": {"$ne": 1}}, {"_id": 0}),
                "invoices": get_related_records("invoices", {"account_id": id, "tenant_id": tenant_id, "deleted": {"$ne": 1}}, {"_id": 0}),
                "quotes": get_related_records("quotes", {"account_id": id, "tenant_id": tenant_id, "deleted": {"$ne": 1}}, {"_id": 0}),
                "orders": get_related_records("orders", {"account_id": id, "tenant_id": tenant_id, "deleted": {"$ne": 1}}, {"_id": 0}),
            })

        elif entity_name == "lead":
            related_data.update({
                "deals": get_related_records("deals", {"lead_id": id, "tenant_id": tenant_id, "deleted": {"$ne": 1}}, {"_id": 0}),
                "tasks": get_related_records("tasks", {"lead_id": id, "tenant_id": tenant_id, "deleted": {"$ne": 1}}, {"_id": 0}),
            })

        elif entity_name == "contact":
            related_data.update({
                "meetings":[],
                "calls": get_related_records("calls", {"related_to": "calls", "related_to_id": id, "tenant_id": tenant_id, "deleted": {"$ne": 1}}, {"_id": 0}),
                "tasks": get_related_records("tasks", {"related_to": "tasks", "related_to_id": id, "tenant_id": tenant_id, "deleted": {"$ne": 1}}, {"_id": 0}),
                
                "deals": get_related_records("deals", {"contact_id": id, "tenant_id": tenant_id, "deleted": {"$ne": 1}}, {"_id": 0}),
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
        record["last_activity_date"] = get_last_activity_date(entity_name, record["id"])


        return {
            "status": status.HTTP_200_OK,
            "message": f"{entity_name.capitalize()} details retrieved successfully",
            "data": convert_to_jsonable(record),
            "summary": build_summary(related_data)
        }

    except Exception as e:
        return get_error_details(e)
