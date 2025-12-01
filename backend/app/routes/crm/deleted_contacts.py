from fastapi import APIRouter, Request, status, Depends
from typing import Dict, Any, Optional

from app.networks.database import db
from app.utils import oauth2
from app.helpers.general_helper import (
    get_next_id,
    upsert_document,
    json_response,
    get_error_response,
    convert_to_jsonable,
    get_error_details,
)
from app.helpers.globalfunctions import build_crm_query, QUERY_TYPE_ALL, QUERY_TYPE_OWNED, QUERY_TYPE_TODAY

# Router
contacts = APIRouter(tags=["CRM Admin - Contacts"])


# MongoDB Collection
contacts_collection = db.contacts


# Projection to exclude MongoDB _id
NO_ID_PROJECTION = {"_id": 0}


# ===============================
# Helper Functions
# ===============================

def get_contact_last_activity_date(contact: dict, user_detail: dict) -> str:
    """
    Get the last activity date for a contact from activity_logs and related entities.
    Returns a YYYY-MM-DD string or empty string if none.
    """
    try:
        contact_id = contact.get("id")
        tenant_id = user_detail.get("tenant_id")
        if not contact_id:
            return ""

        activity_logs_collection = db.activity_logs

        last_activity = activity_logs_collection.find_one(
            {
                "entity_type": "contact",
                "entity_id": int(contact_id),
                "tenant_id": int(tenant_id),
                "deleted": {"$ne": 1},
            },
            NO_ID_PROJECTION,
            sort=[("timestamp", -1)],
        )

        last_note = db.notes.find_one(
            {
                "related_to": "contacts",
                "related_to_id": int(contact_id),
                "tenant_id": int(tenant_id),
                "deleted": {"$ne": 1},
            },
            NO_ID_PROJECTION,
            sort=[("createdon", -1)],
        )

        last_call = db.calls.find_one(
            {
                "call_for": "contacts",
                "call_for_id": int(contact_id),
                "tenant_id": int(tenant_id),
                "deleted": {"$ne": 1},
            },
            NO_ID_PROJECTION,
            sort=[("start_time", -1)],
        )

        last_meeting = db.meetings.find_one(
            {
                "related_to": "contacts",
                "related_to_id": int(contact_id),
                "tenant_id": int(tenant_id),
                "deleted": {"$ne": 1},
            },
            NO_ID_PROJECTION,
            sort=[("start_time", -1)],
        )

        last_task = db.tasks.find_one(
            {
                "related_to": "contacts",
                "task_for_id": int(contact_id),
                "tenant_id": int(tenant_id),
                "deleted": {"$ne": 1},
            },
            NO_ID_PROJECTION,
            sort=[("createdon", -1)],
        )

        activity_dates = []
        if last_activity and last_activity.get("timestamp"):
            activity_dates.append(last_activity.get("timestamp"))
        if last_note and last_note.get("createdon"):
            activity_dates.append(last_note.get("createdon"))
        if last_call and last_call.get("start_time"):
            activity_dates.append(last_call.get("start_time"))
        if last_meeting and last_meeting.get("start_time"):
            activity_dates.append(last_meeting.get("start_time"))
        if last_task and last_task.get("createdon"):
            activity_dates.append(last_task.get("createdon"))

        if activity_dates:
            from datetime import datetime as _dt
            latest_date = None
            for date_str in activity_dates:
                try:
                    dt = _dt.fromisoformat(str(date_str).replace("Z", "+00:00"))
                    if latest_date is None or dt > latest_date:
                        latest_date = dt
                except Exception:
                    continue
            if latest_date:
                return latest_date.strftime("%Y-%m-%d")
        return ""
    except Exception:
        return ""


def generate_line_chart_data_from_contacts(collection, base_query, end_date, metric_type: str = "total"):
    """
    Generate simple last-7-days line data for contacts.
    metric_type: total, active, new_contacts
    """
    from datetime import datetime, timedelta

    data = []
    for i in range(7):
        current_date = end_date - timedelta(days=6 - i)
        start_of_day = current_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = current_date.replace(hour=23, minute=59, second=59, microsecond=999999)

        day_query = {k: v for k, v in base_query.items() if k != "createdon"}
        if metric_type == "total":
            count = collection.count_documents(day_query)
        elif metric_type == "active":
            count = collection.count_documents({**day_query, "active": 1})
        elif metric_type == "new_contacts":
            day_query["createdon"] = {
                "$gte": start_of_day.isoformat(),
                "$lte": end_of_day.isoformat(),
            }
            count = collection.count_documents(day_query)
        else:
            count = collection.count_documents(day_query)
        data.append({"value": int(count)})
    return data


def build_contacts_filter_query(
    user_detail: dict,
    view: str = "all_contacts",
    title: str = "",
    email: str = "",
    phone: str = "",
    mobile: str = "",
    fax: str = "",
    website: str = "",
    createdon: str = "",
    last_activity: str = "",
    status_id: str = "",
    owner_id: str = "",
    account_id: str = "",
    role_id: str = "",
    source_id: str = "",
    country_id: str = "",
    state_id: str = "",
    postal_code: str = "",
) -> dict:
    """Build MongoDB query for contacts filters and views."""
    from datetime import datetime, timedelta

    query = {
        "tenant_id": user_detail["tenant_id"],
        "deleted": {"$ne": 1},
    }

    if view == "my_contacts":
        query["owner_id"] = int(user_detail["id"])
    elif view == "unassigned_contacts":
        query["$or"] = [{"owner_id": {"$exists": False}}, {"owner_id": 0}]
    elif view == "favorite_contacts":
        query["favorite"] = 1
    elif view in {"new", "active", "inactive", "prospect", "closed_won", "closed_lost"}:
        status_map = {
            "new": 1,
            "active": 2,
            "inactive": 3,
            "prospect": 4,
            "closed_won": 5,
            "closed_lost": 6,
        }
        query["status_id"] = status_map.get(view)
    elif view == "no_recent_activity":
        thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
        query["$or"] = [
            {"last_activity": {"$lt": thirty_days_ago}},
            {"last_activity": {"$exists": False}},
            {"last_activity": ""},
        ]
    elif view == "recently_contacted":
        seven_days_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
        query["last_activity"] = {"$gte": seven_days_ago}
    elif view == "no_phone_provided":
        query["$or"] = [{"phone": {"$exists": False}}, {"phone": ""}]
    elif view == "email_only":
        query["email"] = {"$ne": ""}
        query["$or"] = [{"phone": {"$exists": False}}, {"phone": ""}]

    if title:
        query["$or"] = [
            {"title": {"$regex": title, "$options": "i"}},
            {"first_name": {"$regex": title, "$options": "i"}},
            {"last_name": {"$regex": title, "$options": "i"}},
        ]
    if email:
        query["email"] = {"$regex": email, "$options": "i"}
    if phone:
        query["phone"] = {"$regex": phone, "$options": "i"}
    if mobile:
        query["mobile"] = {"$regex": mobile, "$options": "i"}
    if fax:
        query["fax"] = {"$regex": fax, "$options": "i"}
    if website:
        query["website"] = {"$regex": website, "$options": "i"}
    if createdon:
        query["createdon"] = {"$regex": createdon, "$options": "i"}
    if last_activity:
        query["last_activity"] = {"$regex": last_activity, "$options": "i"}
    if status_id:
        try:
            query["status_id"] = int(status_id)
        except ValueError:
            pass
    if owner_id:
        try:
            query["owner_id"] = int(owner_id)
        except ValueError:
            pass
    if account_id:
        try:
            query["account_id"] = int(account_id)
        except ValueError:
            pass
    if role_id:
        try:
            query["role_id"] = int(role_id)
        except ValueError:
            pass
    if source_id:
        try:
            query["source_id"] = int(source_id)
        except ValueError:
            pass
    if country_id:
        try:
            query["country_id"] = int(country_id)
        except ValueError:
            pass
    if state_id:
        try:
            query["state_id"] = int(state_id)
        except ValueError:
            pass
    if postal_code:
        query["postal_code"] = {"$regex": postal_code, "$options": "i"}

    return query


def enrich_contact_data(contact: dict, user_detail: dict) -> dict:
    """Enrich contact with owner, user and account details and last activity."""
    owner = db.users.find_one({"id": contact.get("owner_id")}, NO_ID_PROJECTION)
    contact["owner_details"] = owner or {}
    contact["owner"] = owner or {}

    user = db.users.find_one({"id": contact.get("user_id")}, NO_ID_PROJECTION)
    contact["user_details"] = user or {}

    if contact.get("account_id"):
        account = db.accounts.find_one({"id": contact.get("account_id")}, NO_ID_PROJECTION)
        contact["account_details"] = account or {}

    last_activity_date = get_contact_last_activity_date(contact, user_detail)
    if last_activity_date:
        contact["last_activity"] = last_activity_date
    return contact

# ===============================
# CRUD for CONTACTS - starting
# ===============================
@contacts.post("/contacts/save")
async def save_contact(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Create or update a contact.
    """
    try:
        form = dict(await request.form())  # Use `await request.json()` if sending JSON
        doc_id = int(form.get("id") or 0)
        
        next_id = doc_id or get_next_id(contacts_collection)

        data = {
            **form,
            "id": doc_id or get_next_id(contacts_collection),
            "ukey": f"{user_detail['tenant_id']}000{next_id}",
            "contact_name": f"{form.get('first_name', '').strip()} {form.get('last_name', '').strip()}".strip(),
            "tenant_id": user_detail["tenant_id"],
            "active": int(form.get("active", 1)),
            "sort_by": int(form.get("sort_by", 0)),
        }

        message = upsert_document(contacts_collection, data, doc_id)
        return json_response(message, data)
    except Exception as e:
        return get_error_response(e)



@contacts.post("/crm/contacts/get")
async def get_contacts_filtered(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get contacts with filters, views and pagination similar to accounts.
    """
    try:
        try:
            payload = await request.json()
        except Exception:
            form = await request.form()
            payload = dict(form)

        view = str(payload.get("view", "all_contacts")).strip()
        title = str(payload.get("title", "")).strip()
        email = str(payload.get("email", "")).strip()
        phone = str(payload.get("phone", "")).strip()
        mobile = str(payload.get("mobile", "")).strip()
        fax = str(payload.get("fax", "")).strip()
        website = str(payload.get("website", "")).strip()
        createdon = str(payload.get("createdon", "")).strip()
        last_activity = str(payload.get("last_activity", "")).strip()
        status_id = str(payload.get("status_id", "")).strip()
        owner_id = str(payload.get("owner_id", "")).strip()
        account_id = str(payload.get("account_id", "")).strip()
        role_id = str(payload.get("role_id", "")).strip()
        source_id = str(payload.get("source_id", "")).strip()
        country_id = str(payload.get("country_id", "")).strip()
        state_id = str(payload.get("state_id", "")).strip()
        postal_code = str(payload.get("postal_code", "")).strip()

        page = int(payload.get("page", 1))
        limit = int(payload.get("limit", 20))
        skip = (page - 1) * limit

        query = build_contacts_filter_query(
            user_detail=user_detail,
            view=view,
            title=title,
            email=email,
            phone=phone,
            mobile=mobile,
            fax=fax,
            website=website,
            createdon=createdon,
            last_activity=last_activity,
            status_id=status_id,
            owner_id=owner_id,
            account_id=account_id,
            role_id=role_id,
            source_id=source_id,
            country_id=country_id,
            state_id=state_id,
            postal_code=postal_code,
        )

        total_count = contacts_collection.count_documents(query)
        contacts_list = list(
            contacts_collection.find(query, NO_ID_PROJECTION).sort("id", -1).skip(skip).limit(limit)
        )

        records = []
        for c in contacts_list:
            records.append(enrich_contact_data(c, user_detail))

        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": convert_to_jsonable(records),
            "filters_applied": {
                "view": view,
                "title": title,
                "email": email,
                "phone": phone,
                "mobile": mobile,
                "fax": fax,
                "website": website,
                "createdon": createdon,
                "last_activity": last_activity,
                "status_id": status_id,
                "owner_id": owner_id,
                "account_id": account_id,
                "role_id": role_id,
                "source_id": source_id,
                "country_id": country_id,
                "state_id": state_id,
                "postal_code": postal_code,
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
    

@contacts.get("/contacts/get-by-view-ukey/{ukey}")
async def get_contacts_by_view_id(ukey: str, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get contacts based on custom view configuration with optimized query building.
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
        
        # Build optimized query
        query = build_crm_query(query_type, user_detail)
        
        # Execute query with optimized sorting and limit for performance
        records = list(
            contacts_collection
            .find(query, NO_ID_PROJECTION)
            .sort("id", -1)
            .limit(1000)  # Add reasonable limit to prevent memory issues
        )

        return json_response("Records retrieved successfully", records)

    except Exception as e:
        return get_error_response(e)


@contacts.post("/contacts/get/{id}")
async def get_contact_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get a single contact by ID.
    """
    try:
        contact = contacts_collection.find_one({"id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}}, NO_ID_PROJECTION)
        if contact:
            return json_response("Record retrieved successfully", contact)
        return json_response("Record not found", None, status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return get_error_response(e)


@contacts.post("/crm/contacts/get/{id}")
async def get_contact_by_id_crm(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        contact = contacts_collection.find_one(
            {"id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}}, NO_ID_PROJECTION
        )
        if contact:
            return json_response("Record retrieved successfully", convert_to_jsonable(contact))
        return json_response("Record not found", None, status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return get_error_response(e)


@contacts.get("/crm/contacts/clone/{id}")
async def clone_contact_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        contact = contacts_collection.find_one(
            {"id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
            NO_ID_PROJECTION
        )

        if not contact:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Original record not found",
                "data": None
            }

        contact.pop("_id", None)
        old_id = contact.get("id")
        new_id = get_next_id(contacts_collection)

        cursor = contacts_collection.find(
            {}, NO_ID_PROJECTION
        ).sort("ukey", -1).limit(1)

        latest_doc = next(cursor, None)
        
        latest_ukey = int(latest_doc["ukey"]) if latest_doc and "ukey" in latest_doc else 9999
        next_ukey = latest_ukey + 1

        # Set new fields
        contact["id"] = new_id
        contact["ukey"] = str(next_ukey)

        # Insert cloned record
        contacts_collection.insert_one(contact)

        return {
            "status": status.HTTP_201_CREATED,
            "message": f"Contact (cloned from {old_id}) created successfully",
            "data": convert_to_jsonable(contact)
        }

    except Exception as e:
        return get_error_details(e)


@contacts.get("/crm/contacts/details/get/{id}")
async def get_contact_details_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get comprehensive contact details with related meetings, calls, tasks, deals and activity logs.
    """
    try:
        contact = contacts_collection.find_one(
            {"id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}}, NO_ID_PROJECTION
        )
        if not contact:
            return json_response("Contact not found", None, status.HTTP_404_NOT_FOUND)

        contact["owner_details"] = db.users.find_one({"id": contact.get("owner_id")}, NO_ID_PROJECTION) or {}
        contact["user_details"] = db.users.find_one({"id": contact.get("user_id")}, NO_ID_PROJECTION) or {}
        if contact.get("account_id"):
            contact["account_details"] = db.accounts.find_one({"id": contact.get("account_id")}, NO_ID_PROJECTION) or {}

        contact["meetings"] = list(
            db.meetings.find(
                {"related_to": "contacts", "related_to_id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
                NO_ID_PROJECTION,
            ).sort("id", -1)
        )
        contact["attachments"] = list(
            db.attachments.find(
                {"related_to": "contacts", "related_to_id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
                NO_ID_PROJECTION,
            ).sort("id", -1)
        )
        contact["calls"] = list(
            db.calls.find(
                {"call_for": "contacts", "call_for_id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
                NO_ID_PROJECTION,
            ).sort("start_time", -1)
        )
        contact["tasks"] = list(
            db.tasks.find(
                {"related_to": "contacts", "task_for_id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
                NO_ID_PROJECTION,
            ).sort("id", -1)
        )
        try:
            contact["activity_logs"] = list(
                db.activity_logs.find(
                    {"entity_type": "contact", "entity_id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
                    NO_ID_PROJECTION,
                ).sort("timestamp", -1)
            )
        except Exception:
            contact["activity_logs"] = []

        last_activity_date = get_contact_last_activity_date(contact, user_detail)
        if last_activity_date:
            contact["last_activity"] = last_activity_date

        return {
            "status": status.HTTP_200_OK,
            "message": "Contact details retrieved successfully",
            "data": convert_to_jsonable(contact),
            "summary": {
                "meetings_count": len(contact.get("meetings", [])),
                "attachments_count": len(contact.get("attachments", [])),
                "calls_count": len(contact.get("calls", [])),
                "tasks_count": len(contact.get("tasks", [])),
                "activity_logs_count": len(contact.get("activity_logs", [])),
            },
        }
    except Exception as e:
        return get_error_response(e)

@contacts.get("/crm/contacts/{id}/deleted/{value}")
async def toggle_contact_deletion(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Soft delete or restore a contact by toggling the 'deleted' flag.
    """
    try:
        contacts_collection.update_one({"id": id, "tenant_id": user_detail["tenant_id"]}, {"$set": {"deleted": value}})
        message = "Record deleted successfully" if value else "Record restored successfully"
        return json_response(message)
    except Exception as e:
        return get_error_response(e)


@contacts.post("/crm/contacts/get-statistics")
async def get_contacts_statistics(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """Return dashboard-style statistics for contacts similar to accounts."""
    try:
        form = await request.form()
        tenant_id = int(user_detail.get("tenant_id", 0))

        from datetime import datetime, timezone, timedelta
        to_date = datetime.now(timezone.utc)

        base_query = {"deleted": {"$ne": 1}, "tenant_id": tenant_id}
        total_contacts = contacts_collection.count_documents(base_query)
        active_contacts = contacts_collection.count_documents({**base_query, "status_id": 2})
        qualified_contacts = contacts_collection.count_documents({**base_query, "status_id": 4})
        inactive_contacts = contacts_collection.count_documents({**base_query, "status_id": 3})

        email_threads = db.emails.count_documents({"tenant_id": tenant_id}) if hasattr(db, "emails") else 0
        calls_logged = db.calls.count_documents({"tenant_id": tenant_id, "call_for": "contacts"})
        meeting_followups = db.meetings.count_documents({"tenant_id": tenant_id, "related_to": "contacts"})

        line_total = generate_line_chart_data_from_contacts(contacts_collection, base_query, to_date, "total")
        line_active = generate_line_chart_data_from_contacts(contacts_collection, base_query, to_date, "active")
        line_qualified = generate_line_chart_data_from_contacts(contacts_collection, base_query, to_date, "new_contacts")
        line_inactive = generate_line_chart_data_from_contacts(contacts_collection, base_query, to_date, "total")

        dashboard_view = [
            {
                "icon": "/icons/car_icon.svg",
                "iconClass": "",
                "title": "Total Contacts",
                "total": str(total_contacts),
                "change": "+5.6%",
                "description": "Individuals: N/A | Companies: N/A | Brokers/Agents: N/A | Contacts Penetration: N/A",
                "lineChartData": line_total,
            },
            {
                "icon": "/icons/car_icon.svg",
                "iconClass": "",
                "title": "Active Contacts",
                "total": str(active_contacts),
                "change": "+9%",
                "description": f"Email Threads: {email_threads} | Calls Logged: {calls_logged} | Meeting Follow-ups:{meeting_followups}",
                "lineChartData": line_active,
            },
            {
                "icon": "/icons/car_icon.svg",
                "iconClass": "",
                "title": "Qualified Contacts",
                "total": str(qualified_contacts),
                "change": "+4.6%",
                "description": "Residential Buyers: N/A | Commercial Clients: N/A",
                "lineChartData": line_qualified,
            },
            {
                "icon": "/icons/car_icon.svg",
                "iconClass": "",
                "title": "Inactive Contacts",
                "total": str(inactive_contacts),
                "change": "-5%",
                "description": "Potential Value Lost: $0",
                "lineChartData": line_inactive,
            },
        ]

        return {
            "status": status.HTTP_200_OK,
            "message": "Contact statistics retrieved successfully",
            "data": dashboard_view,
            "tenant_id": tenant_id,
        }
    except Exception as e:
        return get_error_response(e)


@contacts.post("/crm/contacts/get-contact-summary-chart-data")
async def get_contacts_summary_chart_data(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Return chartData and chartConfig for contacts (weekly - last 7 days).
    """
    try:
        form = dict(await request.form())
        tenant_id = int(user_detail.get("tenant_id", 0))

        base_query = {"tenant_id": tenant_id, "deleted": {"$ne": 1}}

        from datetime import datetime, timedelta
        now_dt = datetime.utcnow()

        # Build chartData and chartConfig in requested structure (weekly - last 7 days)
        from calendar import day_name
        chart_data = []
        for i in range(7):
            day_start = (now_dt - timedelta(days=6 - i)).replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)

            all_cnt = db.contacts.count_documents({
                **base_query,
                "createdon": {"$gte": day_start.isoformat(), "$lt": day_end.isoformat()}
            })
            active_cnt = db.contacts.count_documents({
                **base_query,
                "status_id": 2,
                "createdon": {"$gte": day_start.isoformat(), "$lt": day_end.isoformat()}
            })
            qualified_cnt = db.contacts.count_documents({
                **base_query,
                "status_id": 4,
                "createdon": {"$gte": day_start.isoformat(), "$lt": day_end.isoformat()}
            })

            chart_data.append({
                "day": day_name[day_start.weekday()],
                "all": int(all_cnt),
                "active": int(active_cnt),
                "qualified": int(qualified_cnt),
            })

        chart_config = {
            "all": {"label": "All Contacts", "color": "var(--chart-1)"},
            "active": {"label": "Active Contacts", "color": "var(--chart-2)"},
            "qualified": {"label": "Qualified Contacts", "color": "var(--chart-3)"},
        }

        return {
            "status": status.HTTP_200_OK,
            "message": "Contact summary data retrieved successfully",
            "data": {},
            "chartData": chart_data,
            "chartConfig": chart_config,
            "tenant_id": tenant_id
        }
    except Exception as e:
        return get_error_response(e)


@contacts.post("/crm/contacts/get-status-chart-data")
async def get_contacts_status_chart_data(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        form = await request.form()
        from datetime import datetime, timezone
        tenant_id = int(user_detail.get("tenant_id", 0))
        from_date_str = form.get("from", "")
        to_date_str = form.get("to", "")
        if from_date_str and to_date_str:
            try:
                from_date = datetime.fromisoformat(from_date_str.replace("Z", "+00:00"))
                to_date = datetime.fromisoformat(to_date_str.replace("Z", "+00:00"))
            except Exception:
                to_date = datetime.now(timezone.utc)
                from_date = to_date
        else:
            to_date = datetime.now(timezone.utc)
            from_date = to_date

        base_query = {"deleted": {"$ne": 1}, "tenant_id": tenant_id}

        try:
            contact_statuses = list(db.contacts_status_options.find({"deleted": {"$ne": 1}}, NO_ID_PROJECTION).sort("id", 1))
        except Exception:
            contact_statuses = [
                {"id": 1, "name": "New"},
                {"id": 2, "name": "Active Contact"},
                {"id": 3, "name": "Inactive Contact"},
                {"id": 4, "name": "Prospect"},
                {"id": 5, "name": "Closed - Won"},
                {"id": 6, "name": "Closed - Lost"},
            ]

        pipeline = [
            {"$match": {**base_query, "createdon": {"$gte": from_date.isoformat(), "$lte": to_date.isoformat()}}},
            {"$group": {"_id": "$status_id", "count": {"$sum": 1}}},
        ]
        aggregation_result = list(contacts_collection.aggregate(pipeline))
        status_counts = {int(s.get("id")): 0 for s in contact_statuses if isinstance(s.get("id"), int)}
        for r in aggregation_result:
            key = r.get("_id")
            if isinstance(key, int):
                status_counts[key] = r.get("count", 0)

        total_in_range = sum(status_counts.values())
        color_palette = ["#10B981", "#F59E0B", "#3B82F6", "#EF4444", "#8B5CF6", "#06B6D4"]
        chart_data = []
        for s in contact_statuses:
            sid = int(s.get("id", 0))
            title = s.get("title") or s.get("name") or f"Status {sid}"
            count = status_counts.get(sid, 0)
            percent = int(round((count / total_in_range * 100), 0)) if total_in_range > 0 else 0
            color = color_palette[(sid - 1) % len(color_palette)] if sid > 0 else "#6B7280"
            chart_data.append({"title": title, "value": count, "percent": percent, "color": color})

        total_contacts = contacts_collection.count_documents(base_query)
        active_contacts = contacts_collection.count_documents({**base_query, "status_id": 2})

        response_data = {
            "chartData": chart_data,
            "counters": [
                {"title": "Total Contacts", "value": total_contacts, "trend": "neutral"},
                {"title": "Active Contacts", "value": active_contacts, "trend": "neutral"},
                {"title": "In Range", "value": total_in_range, "trend": "neutral"},
            ],
            "summary": {
                "total_contacts": total_contacts,
                "active_contacts": active_contacts,
                "in_range": total_in_range,
            },
        }

        return {
            "status": status.HTTP_200_OK,
            "message": "Contact status chart data retrieved successfully",
            "data": response_data,
            "tenant_id": tenant_id,
        }
    except Exception as e:
        return get_error_response(e)


@contacts.post("/crm/contacts/get-grouped-by-status")
async def get_contacts_grouped_by_status(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        form = await request.form()
        include_enrichment = form.get("include_enrichment", "true").lower() == "true"

        tenant_id = user_detail["tenant_id"]

        try:
            contact_statuses = list(db.contacts_status_options.find({"deleted": {"$ne": 1}}, NO_ID_PROJECTION).sort("id", 1))
        except Exception:
            contact_statuses = [
                {"id": 1, "name": "New"},
                {"id": 2, "name": "Active Contact"},
                {"id": 3, "name": "Inactive Contact"},
                {"id": 4, "name": "Prospect"},
                {"id": 5, "name": "Closed - Won"},
                {"id": 6, "name": "Closed - Lost"},
            ]

        status_map = {str(s["id"]): s for s in contact_statuses}

        pipeline = [
            {"$match": {"tenant_id": tenant_id, "deleted": {"$ne": 1}}},
            {"$sort": {"id": -1}},
            {"$group": {"_id": "$status_id", "total_contacts": {"$sum": 1}, "all_contacts": {"$push": "$$ROOT"}}},
        ]
        aggregation_result = list(contacts_collection.aggregate(pipeline))

        contacts_by_status = {}
        all_contact_ids = set()
        for group in aggregation_result:
            status_id = str(group.get("_id")) if group.get("_id") else "unknown"
            contact_docs = group.get("all_contacts", [])
            seen = set()
            ids = []
            for c in contact_docs:
                cid = c.get("id")
                if cid and cid not in seen:
                    seen.add(cid)
                    ids.append(cid)
                    all_contact_ids.add(cid)
            contacts_by_status[status_id] = {"total_contacts": group.get("total_contacts", 0), "contact_ids": ids}

        enriched_map = {}
        if include_enrichment and all_contact_ids:
            enrich_pipeline = [
                {"$match": {"id": {"$in": list(all_contact_ids)}, "tenant_id": tenant_id, "deleted": {"$ne": 1}}},
                {"$lookup": {"from": "users", "localField": "owner_id", "foreignField": "id", "as": "owner_details_array"}},
                {"$addFields": {"owner_details": {"$ifNull": [{"$arrayElemAt": ["$owner_details_array", 0]}, {}]}}},
                {"$lookup": {"from": "users", "localField": "user_id", "foreignField": "id", "as": "user_details_array"}},
                {"$addFields": {"user_details": {"$ifNull": [{"$arrayElemAt": ["$user_details_array", 0]}, {}]}}},
                {"$project": {"_id": 0, "owner_details_array": 0, "user_details_array": 0}},
            ]
            enriched_contacts = list(contacts_collection.aggregate(enrich_pipeline))
            for c in enriched_contacts:
                cid = c.get("id")
                if cid:
                    c["owner"] = c.get("owner_details", {})
                    for k in ["owner_details", "user_details"]:
                        if isinstance(c.get(k), dict):
                            c[k].pop("_id", None)
                    enriched_map[cid] = c

        grouped_data = []
        total_count = 0
        for sid_str, status_info in status_map.items():
            status_data = contacts_by_status.get(sid_str, {"total_contacts": 0, "contact_ids": []})
            group_obj = {**status_info, "total_contacts": status_data["total_contacts"], "contacts": []}
            if include_enrichment:
                seen = set()
                for cid in status_data["contact_ids"]:
                    if cid not in seen and cid in enriched_map:
                        group_obj["contacts"].append(enriched_map[cid])
                        seen.add(cid)
            else:
                group_obj["contact_ids"] = status_data["contact_ids"]
            grouped_data.append(group_obj)
            total_count += status_data["total_contacts"]

        return {
            "status": status.HTTP_200_OK,
            "message": "Contacts grouped by status retrieved successfully",
            "data": convert_to_jsonable(grouped_data),
            "summary": {
                "total_contacts": total_count,
                "total_status_groups": len(contact_statuses),
                "enrichment_enabled": include_enrichment,
            },
        }
    except Exception as e:
        return get_error_response(e)


@contacts.post("/crm/contacts/update-status")
async def update_contact_status(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        """
        try:
            payload = await request.json()
        except Exception:
            form = await request.form()
            payload = dict(form)
        cid = int(payload.get("id"))
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

        
        contacts_collection.update_one(
            {"id": id, "tenant_id": user_detail["tenant_id"]}, {"$set": {"status_id": status_value}}
        )
        return json_response("Record updated successfully", {"status_id": status_value})
    except Exception as e:
        return get_error_response(e)


@contacts.post("/crm/contacts/update-owner")
async def update_contact_owner(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        try:
            payload = await request.json()
        except Exception:
            form = await request.form()
            payload = dict(form)
        cid = int(payload.get("id"))
        owner_value = int(payload.get("owner"))
        contacts_collection.update_one(
            {"id": cid, "tenant_id": user_detail["tenant_id"]}, {"$set": {"owner_id": owner_value}}
        )
        return json_response("Record updated successfully", {"owner_id": owner_value})
    except Exception as e:
        return get_error_response(e)


@contacts.get("/crm/contacts/{id}/favorite/{value}")
async def toggle_contact_favorite(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        contacts_collection.update_one(
            {"id": id, "tenant_id": user_detail["tenant_id"]}, {"$set": {"favorite": value}}
        )
        message = "Contact marked as favorite" if value else "Contact unmarked as favorite"
        return json_response(message)
    except Exception as e:
        return get_error_response(e)


@contacts.post("/crm/contacts/bulk-delete")
async def contacts_bulk_delete(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        form = await request.form()
        raw_ids = form.get("ids")
        if not raw_ids:
            return {"status": status.HTTP_400_BAD_REQUEST, "message": "No IDs provided for deletion."}
        import json as _json

        try:
            ids = _json.loads(raw_ids)
        except Exception:
            return {"status": status.HTTP_400_BAD_REQUEST, "message": "IDs must be a valid JSON array."}
        if not isinstance(ids, list):
            return {"status": status.HTTP_400_BAD_REQUEST, "message": "IDs must be a list."}

        result = contacts_collection.update_many(
            {"id": {"$in": ids}, "tenant_id": user_detail["tenant_id"]}, {"$set": {"deleted": 1}}
        )
        return {
            "status": status.HTTP_200_OK,
            "message": f"{result.modified_count} contact(s) soft deleted successfully.",
            "modified_count": result.modified_count,
        }
    except Exception as e:
        return get_error_response(e)


@contacts.post("/crm/contacts/bulk-update")
async def contacts_bulk_update(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        form = await request.form()
        import json as _json

        ids = _json.loads(form.get("ids"))
        title = form.get("title")
        status_raw = form.get("status")
        owner_raw = form.get("owner")
        source_id = form.get("source_id")

        if not any([title, status_raw, owner_raw, source_id]):
            return {"status": status.HTTP_422_UNPROCESSABLE_ENTITY, "message": "Provide at least one updatable field."}

        update_fields = {}
        if title:
            update_fields["title"] = title
        if status_raw:
            try:
                value = _json.loads(status_raw)
                if isinstance(value, dict) and "value" in value:
                    update_fields["status_id"] = int(value["value"]) if str(value["value"]).isdigit() else value["value"]
            except Exception:
                try:
                    update_fields["status_id"] = int(status_raw)
                except Exception:
                    pass
        if owner_raw:
            try:
                value = _json.loads(owner_raw)
                if isinstance(value, dict) and "value" in value:
                    update_fields["owner_id"] = int(value["value"]) if str(value["value"]).isdigit() else value["value"]
            except Exception:
                try:
                    update_fields["owner_id"] = int(owner_raw)
                except Exception:
                    pass
        if source_id:
            try:
                update_fields["source_id"] = int(source_id)
            except Exception:
                pass

        result = contacts_collection.update_many(
            {"id": {"$in": ids}, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
            {"$set": update_fields},
        )
        return {
            "status": status.HTTP_200_OK,
            "message": f"{result.modified_count} contacts updated successfully",
            "updated_count": result.modified_count,
        }
    except Exception as e:
        return get_error_response(e)
# ===============================
# CRUD for CONTACTS - ending
# ===============================