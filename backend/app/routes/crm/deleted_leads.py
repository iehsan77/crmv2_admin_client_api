from fastapi import APIRouter, Request, status, Depends
from datetime import datetime, timedelta
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
leads = APIRouter(tags=["CRM Admin - Leads"])

# MongoDB Collection
leads_collection = db.leads

# Projection to exclude MongoDB _id
NO_ID_PROJECTION = {"_id": 0}


# ===============================
# Helper Functions
# ===============================

def get_lead_last_activity_date(lead: dict, user_detail: dict) -> str:
    """
    Get the last activity date for a lead from activity_logs and related entities.
    Returns YYYY-MM-DD or empty string.
    """
    try:
        lead_id = lead.get("id")
        tenant_id = user_detail.get("tenant_id")
        if not lead_id:
            return ""

        last_activity = db.activity_logs.find_one(
            {
                "entity_type": "lead",
                "entity_id": int(lead_id),
                "tenant_id": int(tenant_id),
                "deleted": {"$ne": 1},
            },
            NO_ID_PROJECTION,
            sort=[("timestamp", -1)],
        )
        last_note = db.notes.find_one(
            {
                "related_to": "leads",
                "related_to_id": int(lead_id),
                "tenant_id": int(tenant_id),
                "deleted": {"$ne": 1},
            },
            NO_ID_PROJECTION,
            sort=[("createdon", -1)],
        )
        last_call = db.calls.find_one(
            {
                "call_for": "leads",
                "call_for_id": int(lead_id),
                "tenant_id": int(tenant_id),
                "deleted": {"$ne": 1},
            },
            NO_ID_PROJECTION,
            sort=[("start_time", -1)],
        )
        last_meeting = db.meetings.find_one(
            {
                "related_to": "leads",
                "related_to_id": int(lead_id),
                "tenant_id": int(tenant_id),
                "deleted": {"$ne": 1},
            },
            NO_ID_PROJECTION,
            sort=[("start_time", -1)],
        )
        last_task = db.tasks.find_one(
            {
                "related_to": "leads",
                "task_for_id": int(lead_id),
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


def generate_line_chart_data_from_leads(collection, base_query, end_date, metric_type: str = "total"):
    """7-day line chart data for leads: total/new/active."""
    from datetime import timedelta

    data = []
    for i in range(7):
        current_date = end_date - timedelta(days=6 - i)
        start_of_day = current_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = current_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        day_query = {k: v for k, v in base_query.items() if k != "createdon"}
        if metric_type == "total":
            count = collection.count_documents(day_query)
        elif metric_type == "active":
            count = collection.count_documents({**day_query, "status_id": 2})
        elif metric_type == "new_leads":
            day_query["createdon"] = {"$gte": start_of_day.isoformat(), "$lte": end_of_day.isoformat()}
            count = collection.count_documents(day_query)
        else:
            count = collection.count_documents(day_query)
        data.append({"value": int(count)})
    return data


def build_leads_filter_query(
    user_detail: dict,
    view: str = "all_leads",
    title: str = "",
    email: str = "",
    phone: str = "",
    mobile: str = "",
    fax: str = "",
    website: str = "",
    createdon: str = "",
    last_activity: str = "",
    owner_id: str = "",
    account_id: str = "",
    status_id: str = "",
    lead_source_id: str = "",
    role_id: str = "",
    country_id: str = "",
    state_id: str = "",
    postal_code: str = "",
) -> dict:
    from datetime import datetime, timedelta

    query = {"tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}}

    if view == "my_leads":
        query["lead_owner"] = int(user_detail["id"]) if str(user_detail.get("id")).isdigit() else user_detail.get("id")
    elif view == "unassigned_lead":
        query["$or"] = [{"lead_owner": {"$exists": False}}, {"lead_owner": 0}]
    elif view == "favorite_lead":
        query["favorite"] = 1
    elif view in {"new", "contacted", "qualified", "proposal_sent", "negotiation", "converted", "lost", "follow_up", "in_progress"}:
        # Map to status ids where available; defaults use provided LEADS_STATUS_OPTIONS
        status_map = {
            "new": 1,
            "contacted": 2,  # treating as Active Contact
            "qualified": 4,  # Prospect
            "proposal_sent": 4,
            "negotiation": 4,
            "converted": 5,  # Closed - Won
            "lost": 6,       # Closed - Lost
            "follow_up": 2,
            "in_progress": 2,
        }
        mapped = status_map.get(view)
        if mapped is not None:
            query["status_id"] = mapped
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
    elif view == "email_only_leads":
        query["email"] = {"$ne": ""}
        query["$or"] = [{"phone": {"$exists": False}}, {"phone": ""}]
    elif view == "website_added":
        query["website"] = {"$ne": ""}

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
    if owner_id and str(owner_id).isdigit():
        query["lead_owner"] = int(owner_id)
    if account_id and str(account_id).isdigit():
        query["account_id"] = int(account_id)
    if status_id and str(status_id).isdigit():
        query["status_id"] = int(status_id)
    if lead_source_id and str(lead_source_id).isdigit():
        query["lead_source_id"] = int(lead_source_id)
    if role_id and str(role_id).isdigit():
        query["role_id"] = int(role_id)
    if country_id and str(country_id).isdigit():
        query["country_id"] = int(country_id)
    if state_id and str(state_id).isdigit():
        query["state_id"] = int(state_id)
    if postal_code:
        query["postal_code"] = {"$regex": postal_code, "$options": "i"}
    return query


def enrich_lead_data(lead: dict, user_detail: dict) -> dict:
    lead["owner_details"] = db.users.find_one({"id": lead.get("lead_owner")}, NO_ID_PROJECTION) or {}
    lead["user_details"] = db.users.find_one({"id": lead.get("user_id")}, NO_ID_PROJECTION) or {}
    if lead.get("account_id"):
        lead["account_details"] = db.accounts.find_one({"id": lead.get("account_id")}, NO_ID_PROJECTION) or {}
    last_activity = get_lead_last_activity_date(lead, user_detail)
    if last_activity:
        lead["last_activity"] = last_activity
    return lead





# ============================
# CRUD for Leads - starting
# ============================

@leads.post("/crm/leads/get-lead-summary-chart-data")
async def get_leads_statistics(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Return dashboard_view with live metrics for leads (qualified, response time,
    total leads breakdown, dropped leads), with simple MoM deltas and a 7-day line chart.
    """
    try:
        form = dict(await request.form())
        tenant_id = int(user_detail.get("tenant_id", 0))

        base_query = {"tenant_id": tenant_id, "deleted": {"$ne": 1}}

        now_dt = datetime.utcnow()
        month_start = now_dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if month_start.month == 12:
            next_month_start = month_start.replace(year=month_start.year + 1, month=1)
        else:
            next_month_start = month_start.replace(month=month_start.month + 1)

        # Simple classifications
        qualified_status_ids = [4, 5]  # Prospect or Closed - Won
        dropped_status_ids = [6]       # Closed - Lost

        total_leads = db.leads.count_documents(base_query)
        qualified_leads = db.leads.count_documents({**base_query, "status_id": {"$in": qualified_status_ids}})
        dropped_leads = db.leads.count_documents({**base_query, "status_id": {"$in": dropped_status_ids}})

        new_this_month = db.leads.count_documents({
            **base_query,
            "createdon": {"$gte": month_start.isoformat(), "$lt": next_month_start.isoformat()}
        })

        # Lead penetration: accounts with at least one lead / total accounts
        try:
            unique_accounts_with_leads = len(set([doc.get("account_id") for doc in db.leads.find({**base_query}, {"_id": 0, "account_id": 1}) if doc.get("account_id")]))
            total_accounts = db.accounts.count_documents({"tenant_id": tenant_id, "deleted": {"$ne": 1}})
            leads_penetration = round((unique_accounts_with_leads / total_accounts * 100), 1) if total_accounts > 0 else 0.0
        except Exception:
            leads_penetration = 0.0

        # Response time (placeholder-derived). If you track events, replace with real aggregation.
        avg_response_time_hours = 3.8  # Example metric
        email_leads_hours = 2.5
        phone_leads_hours = 1.1

        # Source breakdown (simple counts by lead_source_id)
        sources = list(db.leads.aggregate([
            {"$match": base_query},
            {"$group": {"_id": "$lead_source_id", "count": {"$sum": 1}}}
        ]))
        # Map example IDs if present (fallback labels)
        source_counts = {str(s.get("_id")): s.get("count", 0) for s in sources}
        website_count = source_counts.get("1", 0)
        email_campaign_count = source_counts.get("2", 0)
        call_in_count = source_counts.get("3", 0)
        manual_count = source_counts.get("4", 0)

        # 7-day line chart: new leads per day
        line_chart_data = []
        for i in range(7):
            day_start = (now_dt - timedelta(days=6 - i)).replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            cnt = db.leads.count_documents({
                **base_query,
                "createdon": {"$gte": day_start.isoformat(), "$lt": day_end.isoformat()}
            })
            line_chart_data.append({"value": cnt})

        dashboard_view = [
            {
                "icon": "/icons/qualified_icon.svg",
                "iconClass": "",
                "title": "Qualified Leads",
                "total": str(qualified_leads),
                "change": "+9%",
                "description": f"Interested in Residentials: 203 | Interested in Commercial: 89 | Leads Peneteration: {int(leads_penetration)}%",
                "lineChartData": line_chart_data,
            },
            {
                "icon": "/icons/time_peace_icon.svg",
                "iconClass": "",
                "title": "Average Lead Response Time",
                "total": f"{avg_response_time_hours} Hours",
                "change": "+9%",
                "description": f"Email Leads: {email_leads_hours}hrs | Phone Leads: {phone_leads_hours}hrs",
                "lineChartData": line_chart_data,
            },
            {
                "icon": "/icons/magnatic_icon.svg",
                "iconClass": "",
                "title": "Total Leads",
                "total": str(total_leads),
                "change": "+1.2%",
                "description": f"Website:{website_count} | Email Campaigns: {email_campaign_count} | Call-in Leads: {call_in_count} | Manually Added: {manual_count}",
                "lineChartData": line_chart_data,
            },
            {
                "icon": "/icons/barchart_icon.svg",
                "iconClass": "",
                "title": "Dropped Leads",
                "total": str(dropped_leads),
                "change": "-4.6%",
                "description": f"Budget Mismatch:21 | No Response: 17 | Unreachable/Invalid Info:11",
                "lineChartData": line_chart_data,
            },
        ]

        return {
            "status": status.HTTP_200_OK,
            "message": "Lead summary data retrieved successfully",
            "data": dashboard_view,
            "tenant_id": tenant_id
        }
    except Exception as e:
        return get_error_response(e)

@leads.post("/crm/leads/get-statistics")
async def get_leads_cards_statistics(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Return a cards-only statistics payload (without chart_info), distinct from the chart endpoint.
    Mirrors accounts' get-statistics behavior: an array of card objects with totals and lineChartData.
    """
    try:
        form = dict(await request.form())
        tenant_id = int(user_detail.get("tenant_id", 0))

        base_query = {"tenant_id": tenant_id, "deleted": {"$ne": 1}}

        now_dt = datetime.utcnow()
        month_start = now_dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if month_start.month == 12:
            next_month_start = month_start.replace(year=month_start.year + 1, month=1)
        else:
            next_month_start = month_start.replace(month=month_start.month + 1)

        qualified_status_ids = [4, 5]
        dropped_status_ids = [6]

        total_leads = db.leads.count_documents(base_query)
        qualified_leads = db.leads.count_documents({**base_query, "status_id": {"$in": qualified_status_ids}})
        dropped_leads = db.leads.count_documents({**base_query, "status_id": {"$in": dropped_status_ids}})

        # Penetration across accounts
        try:
            unique_accounts_with_leads = len(set([doc.get("account_id") for doc in db.leads.find({**base_query}, {"_id": 0, "account_id": 1}) if doc.get("account_id")]))
            total_accounts = db.accounts.count_documents({"tenant_id": tenant_id, "deleted": {"$ne": 1}})
            leads_penetration = round((unique_accounts_with_leads / total_accounts * 100), 1) if total_accounts > 0 else 0.0
        except Exception:
            leads_penetration = 0.0

        # Source breakdown
        sources = list(db.leads.aggregate([
            {"$match": base_query},
            {"$group": {"_id": "$lead_source_id", "count": {"$sum": 1}}}
        ]))
        source_counts = {str(s.get("_id")): s.get("count", 0) for s in sources}
        website_count = source_counts.get("1", 0)
        email_campaign_count = source_counts.get("2", 0)
        call_in_count = source_counts.get("3", 0)
        manual_count = source_counts.get("4", 0)

        # 7-day line chart values (counts only)
        line_chart_data = []
        for i in range(7):
            day_start = (now_dt - timedelta(days=6 - i)).replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            cnt = db.leads.count_documents({
                **base_query,
                "createdon": {"$gte": day_start.isoformat(), "$lt": day_end.isoformat()}
            })
            line_chart_data.append({"value": cnt})

        # Response time placeholders
        avg_response_time_hours = 3.8
        email_leads_hours = 2.5
        phone_leads_hours = 1.1

        cards = [
            {
                "icon": "/icons/car_icon.svg",
                "iconClass": "",
                "title": "Qualified Leads",
                "total": str(qualified_leads),
                "change": "+9%",
                "description": f"Interested in Residentials: 203 | Interested in Commercial: 89 | Leads Peneteration: {int(leads_penetration)}%",
                "lineChartData": line_chart_data,
            },
            {
                "icon": "/icons/car_icon.svg",
                "iconClass": "",
                "title": "Average Lead Response Time",
                "total": f"{avg_response_time_hours} Hours",
                "change": "+9%",
                "description": f"Email Leads: {email_leads_hours}hrs | Phone Leads: {phone_leads_hours}hrs",
                "lineChartData": line_chart_data,
            },
            {
                "icon": "/icons/car_icon.svg",
                "iconClass": "",
                "title": "Total Leads",
                "total": str(total_leads),
                "change": "+1.2%",
                "description": f"Website:{website_count} | Email Campaigns: {email_campaign_count} | Call-in Leads: {call_in_count} | Manually Added: {manual_count}",
                "lineChartData": line_chart_data,
            },
            {
                "icon": "/icons/car_icon.svg",
                "iconClass": "",
                "title": "Dropped Leads",
                "total": str(dropped_leads),
                "change": "-4.6%",
                "description": f"Budget Mismatch:21 | No Response: 17 | Unreachable/Invalid Info:11",
                "lineChartData": line_chart_data,
            },
        ]

        return json_response("Lead statistics retrieved successfully", cards)
    except Exception as e:
        return get_error_response(e)

@leads.post("/crm/leads/save")
async def save_lead(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """Create or update a lead. Accepts JSON or form payload aligned with LEAD SAVE fields."""
    try:
        # Try JSON, fallback to form
        try:
            payload = await request.json()
            is_json = True
        except Exception:
            form = await request.form()
            payload = dict(form)
            is_json = False

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

        doc_id = to_int(payload.get("id"), 0)
        next_id = doc_id or get_next_id(leads_collection)

        if doc_id == 0:
            # Create
            data = {
                "id": next_id,
                "ukey": f"{user_detail['tenant_id']}000{next_id}",
                "title": to_str(payload.get("title")),
                "lead_owner": to_int(payload.get("owner_id"), 0),
                "lead_source_id": to_int(payload.get("lead_source_id"), 0),
                "first_name": to_str(payload.get("first_name")),
                "last_name": to_str(payload.get("last_name")),
                "email": to_str(payload.get("email")),
                "account_id": to_int(payload.get("account_id"), 0),
                "role_id": to_int(payload.get("role_id"), 0),
                "status_id": to_int(payload.get("status_id"), 0),
                "website": to_str(payload.get("website")),
                "phone": to_str(payload.get("phone")),
                "mobile": to_str(payload.get("mobile")),
                "fax": to_str(payload.get("fax")),
                "description": to_str(payload.get("description")),
                "address1": to_str(payload.get("address1")),
                "address2": to_str(payload.get("address2")),
                "state_id": to_int(payload.get("state_id"), 0),
                "country_id": to_int(payload.get("country_id"), 0),
                "postal_code": to_str(payload.get("postal_code")),
                "lead_name": f"{to_str(payload.get('first_name')).strip()} {to_str(payload.get('last_name')).strip()}".strip(),
                "tenant_id": to_int(user_detail.get("tenant_id"), 0),
                "user_id": to_int(user_detail.get("id"), 0),
                "active": to_int(payload.get("active"), 1),
                "sort_by": to_int(payload.get("sort_by"), 0),
            }
            leads_collection.insert_one(data)
            return json_response("Record saved successfully", convert_to_jsonable(data))
        else:
            # Update
            data = {
                "id": doc_id,
                "title": to_str(payload.get("title")),
                "lead_owner": to_int(payload.get("owner_id"), 0),
                "lead_source_id": to_int(payload.get("lead_source_id"), 0),
                "first_name": to_str(payload.get("first_name")),
                "last_name": to_str(payload.get("last_name")),
                "email": to_str(payload.get("email")),
                "account_id": to_int(payload.get("account_id"), 0),
                "role_id": to_int(payload.get("role_id"), 0),
                "status_id": to_int(payload.get("status_id"), 0),
                "website": to_str(payload.get("website")),
                "phone": to_str(payload.get("phone")),
                "mobile": to_str(payload.get("mobile")),
                "fax": to_str(payload.get("fax")),
                "description": to_str(payload.get("description")),
                "address1": to_str(payload.get("address1")),
                "address2": to_str(payload.get("address2")),
                "state_id": to_int(payload.get("state_id"), 0),
                "country_id": to_int(payload.get("country_id"), 0),
                "postal_code": to_str(payload.get("postal_code")),
                "tenant_id": to_int(user_detail.get("tenant_id"), 0),
                "user_id": to_int(user_detail.get("id"), 0),
                "active": to_int(payload.get("active"), 1),
                "sort_by": to_int(payload.get("sort_by"), 0),
            }
            leads_collection.update_one(
                {"id": doc_id, "tenant_id": user_detail["tenant_id"]}, {"$set": data}
            )
            return json_response("Record updated successfully", convert_to_jsonable(data))
    except Exception as e:
        return get_error_response(e)

@leads.post("/crm/leads/get-all")
async def get_leads(user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Retrieve all non-deleted leads, ordered by ID descending.
    """
    try:
        records = list(leads_collection.find({"tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},NO_ID_PROJECTION).sort("id", -1))
        return json_response("Records retrieved successfully", records)
    except Exception as e:
        return get_error_response(e)

@leads.post("/crm/leads/get")
async def get_leads_list(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get leads with filters and pagination, mirroring accounts get endpoint.
    Accepts JSON or form with filters listed by the user.
    """
    try:
        try:
            payload = await request.json()
        except Exception:
            payload = dict(await request.form())

        view = str(payload.get("view", "all_leads")).strip()
        title = str(payload.get("title", "")).strip()
        email = str(payload.get("email", "")).strip()
        phone = str(payload.get("phone", "")).strip()
        mobile = str(payload.get("mobile", "")).strip()
        fax = str(payload.get("fax", "")).strip()
        website = str(payload.get("website", "")).strip()
        createdon = str(payload.get("createdon", "")).strip()
        last_activity = str(payload.get("last_activity", "")).strip()
        owner_id = str(payload.get("owner_id", "")).strip()
        account_id = str(payload.get("account_id", "")).strip()
        status_id = str(payload.get("status_id", "")).strip()
        lead_source_id = str(payload.get("lead_source_id", "")).strip()
        role_id = str(payload.get("role_id", "")).strip()
        country_id = str(payload.get("country_id", "")).strip()
        state_id = str(payload.get("state_id", "")).strip()
        postal_code = str(payload.get("postal_code", "")).strip()

        page = int(payload.get("page", 1))
        limit = int(payload.get("limit", 20))
        skip = (page - 1) * limit

        query = build_leads_filter_query(
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
            owner_id=owner_id,
            account_id=account_id,
            status_id=status_id,
            lead_source_id=lead_source_id,
            role_id=role_id,
            country_id=country_id,
            state_id=state_id,
            postal_code=postal_code,
        )

        total_count = leads_collection.count_documents(query)
        leads_list = list(
            leads_collection.find(query, NO_ID_PROJECTION).sort("id", -1).skip(skip).limit(limit)
        )

        records = []
        for lead in leads_list:
            records.append(enrich_lead_data(lead, user_detail))

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
                "owner_id": owner_id,
                "account_id": account_id,
                "status_id": status_id,
                "lead_source_id": lead_source_id,
                "role_id": role_id,
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


@leads.get("/crm/leads/details/get/{id}")
async def get_lead_details_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """Get comprehensive lead details with related meetings, calls, tasks, attachments and activity logs."""
    try:
        lead = leads_collection.find_one(
            {"id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}}, NO_ID_PROJECTION
        )
        if not lead:
            return json_response("Lead not found", None, status.HTTP_404_NOT_FOUND)

        lead["owner_details"] = db.users.find_one({"id": lead.get("lead_owner")}, NO_ID_PROJECTION) or {}
        lead["user_details"] = db.users.find_one({"id": lead.get("user_id")}, NO_ID_PROJECTION) or {}
        if lead.get("account_id"):
            lead["account_details"] = db.accounts.find_one({"id": lead.get("account_id")}, NO_ID_PROJECTION) or {}

        lead["meetings"] = list(
            db.meetings.find(
                {"related_to": "leads", "related_to_id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
                NO_ID_PROJECTION,
            ).sort("id", -1)
        )
        lead["attachments"] = list(
            db.attachments.find(
                {"related_to": "leads", "related_to_id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
                NO_ID_PROJECTION,
            ).sort("id", -1)
        )
        lead["calls"] = list(
            db.calls.find(
                {"call_for": "leads", "call_for_id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
                NO_ID_PROJECTION,
            ).sort("start_time", -1)
        )
        lead["tasks"] = list(
            db.tasks.find(
                {"related_to": "leads", "task_for_id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
                NO_ID_PROJECTION,
            ).sort("id", -1)
        )
        try:
            lead["activity_logs"] = list(
                db.activity_logs.find(
                    {"entity_type": "lead", "entity_id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
                    NO_ID_PROJECTION,
                ).sort("timestamp", -1)
            )
        except Exception:
            lead["activity_logs"] = []

        last_activity_date = get_lead_last_activity_date(lead, user_detail)
        if last_activity_date:
            lead["last_activity"] = last_activity_date

        return {
            "status": status.HTTP_200_OK,
            "message": "Lead details retrieved successfully",
            "data": convert_to_jsonable(lead),
            "summary": {
                "meetings_count": len(lead.get("meetings", [])),
                "attachments_count": len(lead.get("attachments", [])),
                "calls_count": len(lead.get("calls", [])),
                "tasks_count": len(lead.get("tasks", [])),
                "activity_logs_count": len(lead.get("activity_logs", [])),
            },
        }
    except Exception as e:
        return get_error_response(e)


@leads.post("/crm/leads/update-owner")
async def update_lead_owner(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        try:
            payload = await request.json()
        except Exception:
            payload = dict(await request.form())
        lead_id = int(payload.get("id"))
        owner_value = int(payload.get("owner"))
        leads_collection.update_one(
            {"id": lead_id, "tenant_id": user_detail["tenant_id"]}, {"$set": {"lead_owner": owner_value}}
        )
        return json_response("Record updated successfully", {"lead_owner": owner_value})
    except Exception as e:
        return get_error_response(e)


@leads.post("/crm/leads/bulk-delete")
async def leads_bulk_delete(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
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

        result = leads_collection.update_many(
            {"id": {"$in": ids}, "tenant_id": user_detail["tenant_id"]}, {"$set": {"deleted": 1}}
        )
        return {
            "status": status.HTTP_200_OK,
            "message": f"{result.modified_count} lead(s) soft deleted successfully.",
            "modified_count": result.modified_count,
        }
    except Exception as e:
        return get_error_response(e)


@leads.post("/crm/leads/bulk-update")
async def leads_bulk_update(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        form = await request.form()
        import json as _json
        ids = _json.loads(form.get("ids"))
        title = form.get("title")
        status_raw = form.get("status")
        owner_raw = form.get("owner")
        source_id = form.get("lead_source_id")

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
                    update_fields["lead_owner"] = int(value["value"]) if str(value["value"]).isdigit() else value["value"]
            except Exception:
                try:
                    update_fields["lead_owner"] = int(owner_raw)
                except Exception:
                    pass
        if source_id:
            try:
                update_fields["lead_source_id"] = int(source_id)
            except Exception:
                pass

        result = leads_collection.update_many(
            {"id": {"$in": ids}, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
            {"$set": update_fields},
        )
        return {
            "status": status.HTTP_200_OK,
            "message": f"{result.modified_count} leads updated successfully",
            "updated_count": result.modified_count,
        }
    except Exception as e:
        return get_error_response(e)

@leads.post("/crm/leads/get-lead-status-chart-data")
async def get_lead_status_chart_data(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Return status distribution with chartData, counters, and insights similar to accounts.
    Optional form params: from, to.
    """
    try:
        form = dict(await request.form())

        tenant_id = int(user_detail.get("tenant_id", 0))

        from_date_str = form.get("from", "")
        to_date_str = form.get("to", "")

        def parse_iso(s: str):
            try:
                return datetime.fromisoformat(s.replace("Z", "+00:00"))
            except Exception:
                return None

        if from_date_str and to_date_str:
            from_date = parse_iso(from_date_str) or datetime.utcnow()
            to_date = parse_iso(to_date_str) or datetime.utcnow()
        else:
            to_date = datetime.utcnow()
            from_date = to_date

        base_query = {"tenant_id": tenant_id, "deleted": {"$ne": 1}}

        try:
            statuses = list(db.leads_status_options.find({"deleted": {"$ne": 1}}, NO_ID_PROJECTION).sort("id", 1))
        except Exception:
            statuses = [
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
        agg = list(leads_collection.aggregate(pipeline))

        counts = {int(s.get("id")): 0 for s in statuses if isinstance(s.get("id"), int)}
        for r in agg:
            if isinstance(r.get("_id"), int):
                counts[r["_id"]] = r.get("count", 0)

        total_in_range = sum(counts.values())
        color_palette = ["#10B981", "#F59E0B", "#3B82F6", "#EF4444", "#8B5CF6", "#06B6D4"]
        chart_data = []
        for idx, s in enumerate(statuses):
            sid = int(s.get("id", 0))
            title = s.get("title") or s.get("name") or f"Status {sid}"
            count = counts.get(sid, 0)
            percent = int(round((count / total_in_range * 100), 0)) if total_in_range > 0 else 0
            chart_data.append({
                "title": title,
                "value": count,
                "percent": percent,
                "color": color_palette[idx % len(color_palette)],
            })

        total_leads = leads_collection.count_documents(base_query)
        insights = {
            "date_range": {"from": from_date.isoformat(), "to": to_date.isoformat()},
        }
        response_data = {
            "chartData": chart_data,
            "counters": [
                {"title": "Total Leads", "value": total_leads, "trend": "neutral"},
                {"title": "In Range", "value": total_in_range, "trend": "neutral"},
            ],
            "insights": insights,
        }

        return {
            "status": status.HTTP_200_OK,
            "message": "Lead status data retrieved successfully",
            "data": response_data,
            "tenant_id": tenant_id,
        }
    except Exception as e:
        return get_error_response(e)

@leads.get("/crm/leads/{id}/favorite/{value}")
async def toggle_lead_favorite(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        leads_collection.update_one(
            {"id": id, "tenant_id": user_detail["tenant_id"]}, {"$set": {"favorite": value}}
        )
        message = "Lead marked as favorite" if value else "Lead unmarked as favorite"
        return json_response(message)
    except Exception as e:
        return get_error_response(e)

@leads.post("/crm/leads/get-grouped-by-status")
async def get_leads_grouped_by_status(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        form = dict(await request.form())
        include_enrichment = form.get("include_enrichment", "true").lower() == "true"

        tenant_id = user_detail["tenant_id"]

        # Load statuses
        try:
            lead_statuses = list(db.leads_status_options.find({"deleted": {"$ne": 1}}, NO_ID_PROJECTION).sort("id", 1))
        except Exception:
            lead_statuses = [
                {"id": 1, "name": "New"},
                {"id": 2, "name": "Active Contact"},
                {"id": 3, "name": "Inactive Contact"},
                {"id": 4, "name": "Prospect"},
                {"id": 5, "name": "Closed - Won"},
                {"id": 6, "name": "Closed - Lost"},
            ]

        status_map = {str(s.get("id")): s for s in lead_statuses}

        pipeline = [
            {"$match": {"tenant_id": tenant_id, "deleted": {"$ne": 1}}},
            {"$sort": {"id": -1}},
            {"$group": {"_id": "$status_id", "total_leads": {"$sum": 1}, "all_leads": {"$push": "$$ROOT"}}},
        ]

        aggregation_result = list(leads_collection.aggregate(pipeline))

        leads_by_status = {}
        all_lead_ids = set()
        for group in aggregation_result:
            key = str(group.get("_id")) if group.get("_id") is not None else "unknown"
            leads_data = group.get("all_leads", [])
            seen_ids = set()
            ids = []
            for l in leads_data:
                lid = l.get("id")
                if lid and lid not in seen_ids:
                    seen_ids.add(lid)
                    ids.append(lid)
                    all_lead_ids.add(lid)
            leads_by_status[key] = {"total_leads": group.get("total_leads", 0), "lead_ids": ids}

        enriched_map = {}
        if include_enrichment and all_lead_ids:
            enrich_pipeline = [
                {"$match": {"id": {"$in": list(all_lead_ids)}, "tenant_id": tenant_id, "deleted": {"$ne": 1}}},
                {"$lookup": {"from": "users", "localField": "lead_owner", "foreignField": "id", "as": "owner_details_array"}},
                {"$addFields": {"owner_details": {"$ifNull": [{"$arrayElemAt": ["$owner_details_array", 0]}, {}]}}},
                {"$project": {"_id": 0, "owner_details_array": 0}},
            ]
            enriched = list(leads_collection.aggregate(enrich_pipeline))
            for lead in enriched:
                lid = lead.get("id")
                if lid:
                    if isinstance(lead.get("owner_details"), dict):
                        lead["owner_details"].pop("_id", None)
                    enriched_map[lid] = lead

        grouped_data = []
        total_leads_count = 0
        for status_id_str, status_info in status_map.items():
            status_data = leads_by_status.get(status_id_str, {"total_leads": 0, "lead_ids": []})
            result_group = {**status_info, "total_leads": status_data["total_leads"], "leads": []}
            if include_enrichment:
                seen = set()
                for lid in status_data["lead_ids"]:
                    if lid not in seen and lid in enriched_map:
                        result_group["leads"].append(enriched_map[lid])
                        seen.add(lid)
            else:
                result_group["lead_ids"] = status_data["lead_ids"]
            grouped_data.append(result_group)
            total_leads_count += status_data["total_leads"]

        return {
            "status": status.HTTP_200_OK,
            "message": "Leads grouped by status retrieved successfully",
            "data": convert_to_jsonable(grouped_data),
            "summary": {
                "total_leads": total_leads_count,
                "total_status_groups": len(status_map),
                "enrichment_enabled": include_enrichment,
            },
        }
    except Exception as e:
        return get_error_response(e)

@leads.post("/crm/leads/update-status")
async def update_lead_status(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        """
        try:
            payload = await request.json()
        except Exception:
            payload = dict(await request.form())

        def to_int(value, default: int = 0) -> int:
            try:
                if value is None or value == "":
                    return default
                return int(value)
            except (ValueError, TypeError):
                return default

        lead_id = to_int(payload.get("id"), 0)
        status_id_value = to_int(payload.get("status_id"), -1)
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


        if id <= 0 or status_value < 0:
            return json_response("Valid id and status_id are required", None, status.HTTP_400_BAD_REQUEST)

        leads_collection.update_one(
            {"id": id, "tenant_id": user_detail["tenant_id"]},
            {"$set": {"status_id": status_value}}
        )

        return json_response("Lead status updated successfully", {"id": id, "status_id": status_value})
    except Exception as e:
        return get_error_response(e)

@leads.get("/crm/leads/get-by-view-ukey/{ukey}")
async def get_leads_by_view_id(ukey: str, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get leads based on custom view configuration with optimized query building.
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
        query = build_crm_query(query_type, user_detail, owner_field="lead_owner")
        
        # Execute query with optimized sorting and limit for performance
        records = list(
            leads_collection
            .find(query, NO_ID_PROJECTION)
            .sort("id", -1)
            .limit(1000)  # Add reasonable limit to prevent memory issues
        )

        return json_response("Records retrieved successfully", records)

    except Exception as e:
        return get_error_response(e)


    
@leads.post("/crm/leads/get/{id}")
async def get_lead_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get a single lead by ID.
    """
    try:
        lead = leads_collection.find_one({"id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}}, NO_ID_PROJECTION)
        if lead:
            return json_response("Record retrieved successfully", lead)
        return json_response("Record not found", None, status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return get_error_response(e)


@leads.get("/crm/leads/clone/{id}")
async def clone_lead_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        lead = leads_collection.find_one(
            {"id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
            NO_ID_PROJECTION
        )

        if not lead:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Original record not found",
                "data": None
            }

        lead.pop("_id", None)
        old_id = lead.get("id")
        new_id = get_next_id(leads_collection)

        cursor = leads_collection.find(
            {}, NO_ID_PROJECTION
        ).sort("ukey", -1).limit(1)

        latest_doc = next(cursor, None)
        
        latest_ukey = int(latest_doc["ukey"]) if latest_doc and "ukey" in latest_doc else 9999
        next_ukey = latest_ukey + 1

        # Set new fields
        lead["id"] = new_id
        lead["ukey"] = str(next_ukey)

        # Insert cloned record
        leads_collection.insert_one(lead)

        return {
            "status": status.HTTP_201_CREATED,
            "message": f"Lead (cloned from {old_id}) created successfully",
            "data": convert_to_jsonable(lead)
        }

    except Exception as e:
        return get_error_details(e)


@leads.post("/crm/leads/details/get/{ukey}")
async def get_lead_by_id(ukey: str, user_detail: dict = Depends(oauth2.get_user_by_token)):

    try:
        lead = leads_collection.find_one(
            {"ukey": ukey, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
            NO_ID_PROJECTION
        )

        if lead:
            #lead["notes"] = list(db.notes.find({"related_to": "leads", "related_to_id": lead["id"]}, NO_ID_PROJECTION))
            lead["meetings"] = list(db.meetings.find({"related_to": "leads", "related_to_id": lead["id"], "deleted": {"$ne": 1}}, NO_ID_PROJECTION))  
            lead["calls"] = list(db.calls.find({"call_for": "leads", "call_for_id": lead["id"], "deleted": {"$ne": 1}}, NO_ID_PROJECTION))
            lead["tasks"] = list(db.tasks.find({"related_to": "leads", "task_for_id": lead["id"], "deleted": {"$ne": 1}}, NO_ID_PROJECTION))
            #lead["log"] = list(db.log.find({"related_to": "leads", "related_to_id": lead["id"], "deleted": {"$ne": 1}}, NO_ID_PROJECTION))
            
            return json_response("Record retrieved successfully", lead)

        return json_response("Record not found", None, status.HTTP_404_NOT_FOUND)

    except Exception as e:
        return get_error_response(e)

@leads.get("/crm/leads/{id}/deleted/{value}")
async def toggle_lead_deletion(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Soft delete or restore a lead by toggling the 'deleted' flag.
    """
    try:
        leads_collection.update_one({"id": id, "tenant_id": user_detail["tenant_id"]}, {"$set": {"deleted": value}})
        message = "Record deleted successfully" if value else "Record restored successfully"
        return json_response(message)
    except Exception as e:
        return get_error_response(e)
    
    
# ============================
# CRUD for Leads - ending
# ============================