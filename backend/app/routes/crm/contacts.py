from fastapi import APIRouter, Request, status, Depends
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, Set
import re

from app.networks.database import db, db_rentify
from app.utils import oauth2
from app.helpers.general_helper import (
    get_next_id,
    upsert_document,
    json_response,
    get_error_response,
    convert_to_jsonable,
    get_error_details,
    get_last_activity_date
)
from app.helpers.globalfunctions import build_crm_query, QUERY_TYPE_ALL, QUERY_TYPE_OWNED, QUERY_TYPE_TODAY
from app.helpers.crm_helper import get_entity_details, get_favorite, log_activity

# Router
contacts = APIRouter(tags=["CRM Admin - Contacts"])

# MongoDB Collection
favorite_collection = db_rentify.rentify_favorites
contacts_collection = db.contacts

# Projection to exclude MongoDB _id
NO_ID_PROJECTION = {"_id": 0}


# ===============================
# Helper Functions - starting
# ===============================

def generate_line_chart_data_from_contacts(collection, base_query, end_date, metric_type: str = "total"):
    """7-day line chart data for contacts: total/new/active."""
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
        elif metric_type == "new_contacts":
            day_query["createdon"] = {"$gte": start_of_day.isoformat(), "$lte": end_of_day.isoformat()}
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
    owner_id: str = "",
    account_id: str = "",
    status_id: str = "",
    source_id: str = "",
    role_id: str = "",
    country_id: str = "",
    state_id: str = "",
    postal_code: str = "",
) -> dict:
    from datetime import datetime, timedelta

    query = {"tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}}

    if view == "my_contacts":
        # query["user_id"] = int(user_detail["id"]) if str(user_detail.get("id")).isdigit() else user_detail.get("id")
        query["owner_id"] = int(user_detail["id"]) if str(user_detail.get("id")).isdigit() else user_detail.get("id")
    elif view == "unassigned_contacts":
        query["$or"] = [{"assigned_to_id": {"$exists": False}}, {"assigned_to_id": 0}]
    elif view == "favorite_contacts":
        query["favorite"] = 1
    elif view in {"new_contact", "contacted", "qualified", "in_progress", "negotiation", "closed_won", "closed_lost"}:
        statuses_cursor = db.contacts_status_options.find(
            {
                "tenant_id": user_detail["tenant_id"],
                "deleted": {"$ne": 1}
            },
            {"_id": 0, "id": 1, "title": 1}
        )

        def _normalize(value: str) -> str:
            return re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_") if value else ""

        statuses = list(statuses_cursor)
        normalized_status_map = {
            _normalize(status.get("title", "")): status.get("id")
            for status in statuses if status.get("id") is not None
        }

        # Fallback defaults if collection lacks titles or normalization fails
        fallback_status_map = {
            "new_contact": 1,
            "contacted": 2,
            "in_progress": 3,
            "qualified": 4,
            "negotiation": 5,
            "closed_won": 6,
            "closed_lost": 7,
        }

        normalized_view = _normalize(view)
        mapped_status_id = normalized_status_map.get(normalized_view)
        if mapped_status_id is None:
            mapped_status_id = fallback_status_map.get(normalized_view)

        if mapped_status_id is not None:
            query["status_id"] = int(mapped_status_id)

    elif view == "no_recent_activity":
        # Return only contacts that have **no** activity logged in the last 24 hours
        twenty_four_hours_ago = (datetime.utcnow() - timedelta(hours=24)).isoformat()
        tenant_id = user_detail.get("tenant_id")

        activity_contacts = db.activity_logs.find(
            {
                "entity_type": "contact",
                "tenant_id": tenant_id,
                "deleted": {"$ne": 1},
                "createdon": {"$gte": twenty_four_hours_ago},
            },
            {"entity_id": 1},
        )

        contact_ids: list[int] = []
        for activity in activity_contacts:
            if activity.get("entity_id") is not None:
                contact_ids.append(activity["entity_id"])

        # Exclude contacts that have activity in the last 24 hours;
        # if none have recent activity, keep existing query (all contacts are "no recent activity")
        if contact_ids:
            query["id"] = {"$nin": contact_ids}

    elif view == "recently_contacted":
        # Recently contacted = any activity log in last 24 hours for calls/meetings linked to this contact
        twenty_four_hours_ago = (datetime.utcnow() - timedelta(hours=24)).isoformat()
        tenant_id = user_detail.get("tenant_id")

        # Fetch recent activity logs for calls and meetings
        recent_activities = list(db.activity_logs.find(
            {
                "tenant_id": tenant_id,
                "deleted": {"$ne": 1},
                "entity_type": {"$in": ["call", "meeting"]},
                "createdon": {"$gte": twenty_four_hours_ago}
            },
            {"_id": 0, "entity_type": 1, "entity_id": 1}
        ))

        call_ids = [int(a.get("entity_id")) for a in recent_activities if a.get("entity_type") == "call" and a.get("entity_id") is not None]
        meeting_ids = [int(a.get("entity_id")) for a in recent_activities if a.get("entity_type") == "meeting" and a.get("entity_id") is not None]

        contact_ids_set = set()

        if call_ids:
            # Resolve contacts from calls by either call_for/related_to mapping to contacts
            calls_cursor = db.calls.find(
                {"tenant_id": tenant_id, "deleted": {"$ne": 1}, "id": {"$in": call_ids}},
                {"_id": 0, "call_for": 1, "call_for_id": 1, "related_to": 1, "related_to_id": 1}
            )
            for c in calls_cursor:
                try:
                    if c.get("call_for") == "contacts" and c.get("call_for_id"):
                        contact_ids_set.add(int(c.get("call_for_id")))
                    if c.get("related_to") == "contacts" and c.get("related_to_id"):
                        contact_ids_set.add(int(c.get("related_to_id")))
                except Exception:
                    continue

        if meeting_ids:
            # Resolve contacts from meetings via meeting_for == contacts and meeting_for_ids list
            meetings_cursor = db.meetings.find(
                {"tenant_id": tenant_id, "deleted": {"$ne": 1}, "id": {"$in": meeting_ids}},
                {"_id": 0, "meeting_for": 1, "meeting_for_ids": 1}
            )
            for m in meetings_cursor:
                try:
                    if m.get("meeting_for") == "contacts":
                        ids_raw = m.get("meeting_for_ids", "[]")
                        try:
                            import json
                            ids_list = json.loads(ids_raw) if isinstance(ids_raw, str) else ids_raw
                        except Exception:
                            ids_list = []
                        if isinstance(ids_list, list):
                            for cid in ids_list:
                                try:
                                    contact_ids_set.add(int(cid))
                                except Exception:
                                    continue
                except Exception:
                    continue

        if contact_ids_set:
            query["id"] = {"$in": list(contact_ids_set)}
        else:
            # No recent activities found → ensure empty result
            query["id"] = {"$in": []}
    elif view == "no_phone_provided":
        query["$or"] = [{"phone": {"$exists": False}}, {"phone": ""}]
    elif view == "email_only":
        query["email"] = {"$ne": ""}
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
        raw_value = str(createdon).strip()
        try:
            dt = datetime.fromisoformat(raw_value.replace("Z", "+00:00"))
            if dt.tzinfo is not None:
                dt = dt.astimezone(timezone.utc)
            else:
                dt = dt.replace(tzinfo=timezone.utc)
            target_date_str = dt.strftime("%Y-%m-%d")
        except Exception:
            target_date_str = raw_value[:10]

        if target_date_str:
            safe_pattern = re.escape(target_date_str)
            created_date_filter = {
                "$or": [
                    {"created_at": {"$regex": f"^{safe_pattern}", "$options": "i"}},
                    {
                        "$expr": {
                            "$eq": [
                                {
                                    "$dateToString": {
                                        "format": "%Y-%m-%d",
                                        "date": {
                                            "$convert": {
                                                "input": "$created_at",
                                                "to": "date",
                                                "onError": None,
                                                "onNull": None,
                                            }
                                        },
                                        "onNull": None,
                                    }
                                },
                                target_date_str,
                            ]
                        }
                    },
                ]
            }

            if "createdon" in query:
                # If previous filters already set createdon directly, merge into $and
                existing = query.pop("createdon")
                created_date_filter["$or"].append({"createdon": existing})

            if "$and" in query:
                query["$and"].append(created_date_filter)
            else:
                query["$and"] = [created_date_filter]
    
    if last_activity:
        tenant_id = user_detail.get("tenant_id")
        if last_activity in ["last_24_hours", "last_7_days", "last_30_days"]:
            # Time-window based last activity using activity_logs (mirror tasks)
            try:
                if last_activity == "last_24_hours":
                    start_time = datetime.utcnow() - timedelta(hours=24)
                elif last_activity == "last_7_days":
                    start_time = datetime.utcnow() - timedelta(days=7)
                else:
                    start_time = datetime.utcnow() - timedelta(days=30)

                start_time_iso = start_time.isoformat()

                activity_logs = list(db.activity_logs.find({
                    "entity_type": "contact",
                    "tenant_id": tenant_id,
                    "deleted": {"$ne": 1},
                    "createdon": {"$gte": start_time_iso}
                }, {"entity_id": 1}))

                contact_ids: set[int] = set()
                for activity in activity_logs:
                    eid = activity.get("entity_id")
                    if eid is None:
                        continue
                    try:
                        contact_ids.add(int(eid))
                    except Exception:
                        continue

                # AND with existing id filter if present
                if "id" in query and isinstance(query["id"], dict) and "$in" in query["id"]:
                    existing_ids = set(query["id"]["$in"])
                    contact_ids = contact_ids.intersection(existing_ids)

                query["id"] = {"$in": list(contact_ids)} if contact_ids else {"$in": [-1]}
            except Exception:
                query["id"] = {"$in": [-1]}
        else:
            # Fallback: regex on activity_logs.createdon
            last_activity_regex = {"$regex": last_activity, "$options": "i"}
            al_cursor = db.activity_logs.find(
                {
                    "entity_type": "contact",
                    "tenant_id": tenant_id,
                    "deleted": {"$ne": 1},
                    "createdon": last_activity_regex,
                },
                {"_id": 0, "entity_id": 1}
            )
            last_ids: list[int] = []
            for a in al_cursor:
                try:
                    if a.get("entity_id") is not None:
                        last_ids.append(int(a.get("entity_id")))
                except Exception:
                    continue
            query["id"] = {"$in": last_ids or [0]}
    if owner_id and str(owner_id).isdigit():
        query["owner_id"] = int(owner_id)
    if account_id and account_id != "":
        query["account_id"] = int(account_id)
    if status_id and str(status_id).isdigit():
        query["status_id"] = int(status_id)
    if source_id and str(source_id).isdigit():
        query["source_id"] = int(source_id)
    if role_id and str(role_id).isdigit():
        query["role_id"] = int(role_id)
    if country_id and str(country_id).isdigit():
        query["country_id"] = int(country_id)
    if state_id and str(state_id).isdigit():
        query["state_id"] = int(state_id)
    if postal_code:
        query["postal_code"] = {"$regex": postal_code, "$options": "i"}
    return query

from typing import Optional


def enrich_contact_data(contact: dict, user_detail: dict, tenant_id: Optional[int] = None) -> dict:
    """
    Enrich contact with related user/account details, last activity and favorite flag.
    Accepts an optional precomputed tenant_id for minor performance optimization.
    """
    if tenant_id is None:
        tenant_id = int(user_detail.get("tenant_id", 0))

    contact["owner_details"] = (
        db.users.find_one({"id": int(contact.get("owner_id"))}, NO_ID_PROJECTION) or {}
    )
    contact["user_details"] = (
        db.users.find_one({"id": int(contact.get("user_id"))}, NO_ID_PROJECTION) or {}
    )
    contact["assigned_to_details"] = (
        db.users.find_one({"id": int(contact.get("assigned_to_id"))}, NO_ID_PROJECTION)
        or {}
    )
    contact["last_activity_date"] = get_last_activity_date(
        "contact", contact.get("id"), tenant_id
    )
    contact["favorite"] = get_favorite(
        "contact", int(contact.get("id")), tenant_id
    )

    if contact.get("account_id") and contact.get("account_id") > 0:
        contact["account_details"] = (
            db.accounts.find_one({"id": contact.get("account_id")}, NO_ID_PROJECTION)
            or {}
        )

    return contact
# ===============================
# Helper Functions - ending
# ===============================




# ============================
# CRUD for Contacts - starting
# ============================
@contacts.post("/crm/contacts/get-statistics")
async def get_contacts_statistics(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get contact statistics for the dashboard.
    """
    try:
        # Get form data
        form = await request.form()
        
        # Resolve current tenant id
        tenant_id = int(user_detail.get("tenant_id", 0))
        
        # Get date range parameters
        from_date_str = form.get("from", "")
        to_date_str = form.get("to", "")
        
        # Use the same ISO parser as calls: parses ISO string and normalizes to naive UTC
        def _parse_iso_naive_utc(value: str):
            try:
                dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
                if dt.tzinfo is not None:
                    dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
                return dt
            except Exception:
                return None

        if from_date_str and to_date_str:
            from_date = _parse_iso_naive_utc(from_date_str) or datetime.utcnow()
            to_date = _parse_iso_naive_utc(to_date_str) or datetime.utcnow()
        else:
            to_date = datetime.utcnow()
            from_date = to_date

        # Normalize dates: from_date to start of day, to_date to end of day
        from_date = from_date.replace(hour=0, minute=0, second=0, microsecond=0)
        to_date = to_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Build date filter and merge into base_query so all queries use it automatically
        date_filter = {
            "$or": [
                {"created_at": {"$gte": from_date, "$lte": to_date}},
                {"$expr": {"$and": [
                    {"$gte": [{"$toDate": "$created_at"}, from_date]},
                    {"$lte": [{"$toDate": "$created_at"}, to_date]}
                ]}},
                {"$expr": {"$and": [
                    {"$gte": [{"$toDate": "$createdon"}, from_date]},
                    {"$lte": [{"$toDate": "$createdon"}, to_date]}
                ]}},
            ]
        }
        
        base_query = {"tenant_id": tenant_id, "deleted": {"$ne": 1}, **date_filter}
        
        total_contacts = contacts_collection.count_documents(base_query)
        active_contacts = contacts_collection.count_documents({**base_query, "status_id": 2})
        qualified_contacts = contacts_collection.count_documents({**base_query, "status_id": 5})
        inactive_contacts = contacts_collection.count_documents({**base_query, "status_id": 3})

        # Get contact type breakdown
        individuals_count = contacts_collection.count_documents({**base_query, "contact_type": "individual"})
        companies_count = contacts_collection.count_documents({**base_query, "contact_type": "company"})
        brokers_count = contacts_collection.count_documents({**base_query, "contact_type": "broker"})
        
        # Get qualified contacts breakdown by interest
        residential_buyers = contacts_collection.count_documents({**base_query, "status_id": 4, "interest_type": "residential"})
        commercial_clients = contacts_collection.count_documents({**base_query, "status_id": 4, "interest_type": "commercial"})
        
        # Get inactive contacts breakdown by reason
        budget_mismatch = contacts_collection.count_documents({**base_query, "status_id": 3, "inactive_reason": {"$regex": "budget", "$options": "i"}})
        no_response = contacts_collection.count_documents({**base_query, "status_id": 3, "inactive_reason": {"$regex": "response", "$options": "i"}})
        unreachable = contacts_collection.count_documents({**base_query, "status_id": 3, "inactive_reason": {"$regex": "unreachable", "$options": "i"}})

        # Calculate previous period statistics for percentage changes
        prev_from_date = from_date - (to_date - from_date)
        prev_to_date = from_date
        
        prev_date_filter = {
            "$or": [
                {"created_at": {"$gte": prev_from_date, "$lte": prev_to_date}},
                {"$expr": {"$and": [
                    {"$gte": [{"$toDate": "$created_at"}, prev_from_date]},
                    {"$lte": [{"$toDate": "$created_at"}, prev_to_date]}
                ]}},
                {"$expr": {"$and": [
                    {"$gte": [{"$toDate": "$createdon"}, prev_from_date]},
                    {"$lte": [{"$toDate": "$createdon"}, prev_to_date]}
                ]}},
            ]
        }
        
        prev_base_query = {"tenant_id": tenant_id, "deleted": {"$ne": 1}, **prev_date_filter}
        prev_total_contacts = contacts_collection.count_documents(prev_base_query)
        prev_active_contacts = contacts_collection.count_documents({**prev_base_query, "status_id": 2})
        prev_qualified_contacts = contacts_collection.count_documents({**prev_base_query, "status_id": 4})
        prev_inactive_contacts = contacts_collection.count_documents({**prev_base_query, "status_id": 3})

        def calculate_percentage_change(current, previous):
            if previous == 0:
                return "+0.0%" if current == 0 else "+100.0%"
            change = ((current - previous) / previous) * 100
            sign = "+" if change >= 0 else ""
            return f"{sign}{change:.1f}%"
        
        total_change = calculate_percentage_change(total_contacts, prev_total_contacts)
        active_change = calculate_percentage_change(active_contacts, prev_active_contacts)
        qualified_change = calculate_percentage_change(qualified_contacts, prev_qualified_contacts)
        inactive_change = calculate_percentage_change(inactive_contacts, prev_inactive_contacts)

        line_total = generate_line_chart_data_from_contacts(contacts_collection, base_query, to_date, "total")
        line_active = generate_line_chart_data_from_contacts(contacts_collection, base_query, to_date, "active")
        line_qualified = generate_line_chart_data_from_contacts(contacts_collection, base_query, to_date, "new_contacts")
        line_inactive = generate_line_chart_data_from_contacts(contacts_collection, base_query, to_date, "total")

        dashboard_view = [
            {
                "icon": "/icons/contact_book.svg",
                "iconClass": "",
                "title": "Total Contacts",
                "total": str(total_contacts),
                "change": total_change,
                "description": f"Individuals: {individuals_count} | Companies: {companies_count} | Brokers/Agents: {brokers_count}",
                "lineChartData": line_total,
            },
            {
                "icon": "/icons/comments.svg",
                "iconClass": "",
                "title": "Active Contacts",
                "total": str(active_contacts),
                "change": active_change,
                "description": f"Residential Buyers: {residential_buyers} | Commercial Clients: {commercial_clients}",
                "lineChartData": line_active,
            },
            {
                "icon": "/icons/handshake.svg",
                "iconClass": "",
                "title": "Qualified Contacts",
                "total": str(qualified_contacts),
                "change": qualified_change,
                "description": f"Budget Mismatch: {budget_mismatch} | No Response: {no_response}",
                "lineChartData": line_qualified,
            },
            {
                "icon": "/icons/time_peace.svg",
                "iconClass": "",
                "title": "Inactive Contacts",
                "total": str(inactive_contacts),
                "change": inactive_change,
                "description": f"Unreachable/Invalid Info: {unreachable}",
                "lineChartData": line_inactive,
            },
        ]

        return {
            "status": status.HTTP_200_OK,
            "message": "Contact statistics retrieved successfully",
            "data": dashboard_view,
            "date_range": {
                "from": from_date.isoformat(),
                "to": to_date.isoformat()
            },
            "tenant_id": tenant_id,
        }
    except Exception as e:
        return get_error_response(e)

@contacts.post("/crm/contacts/get-summary-chart-data")
async def get_contacts_summary_chart_data(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Returns weekly contacts summary data for the dashboard chart
    showing All Contacts, Closed-Won, and Closed-Lost.
    
    
    
    
    const SummaryChartData = {
    // 🧠 Dummy data for demonstration
    chartData: [
        { day: "Mon", allContacts: 150, closedWon: 150, closedLost: 300 },
        { day: "Tue", allContacts: 300, closedWon: 20, closedLost: 320 },
        { day: "Wed", allContacts: 40, closedWon: 300, closedLost: 340 },
        { day: "Thr", allContacts: 300, closedWon: 60, closedLost: 360 },
        { day: "Fri", allContacts: 500, closedWon: 500, closedLost: 1000 },
        { day: "Sat", allContacts: 220, closedWon: 200, closedLost: 420 },
        { day: "Sun", allContacts: 100, closedWon: 80, closedLost: 20 },
    ],

    chartConfig: {
        title: "Contacts Summary - Weekly",
        titleRight: `
                <span class="inline-flex items-center gap-1 mr-3">
                    <span class="inline-block w-[10px] h-[10px] bg-[#6586E6] rounded-xs"></span>
                    all Contacts
                </span>
                <span class="inline-flex items-center gap-1 mr-3">
                    <span class="inline-block w-[10px] h-[10px] bg-[#8DD3A0] rounded-xs"></span>
                    Closed-Won
                </span>
                <span class="inline-flex items-center gap-1">
                    <span class="inline-block w-[10px] h-[10px] bg-[#ED7F7A] rounded-xs"></span>
                    Closed-Lost
                </span>`,
        description: "",
        series: [
        {
            key: "allContacts",
            label: "All Contacts",
            color: "#5f84ffff",
        },        
        { key: "closedWon", label: "Closed-Won", color: "#65e66bff" },
        { key: "closedLost", label: "Closed-Lost", color: "#ED7F7A" },
        ],
        options: {
        height: 250,
        yDomain: [0, 500],
        xKey: "day",
        showGrid: true,
        },
    },
    };

    
    
    
    
    """
    try:
        form = dict(await request.form())
        tenant_id = int(user_detail.get("tenant_id", 0))
        base_query = {"tenant_id": tenant_id, "deleted": {"$ne": 1}}

        # Always use the current week (today and previous 6 days)
        now_dt = datetime.utcnow().replace(tzinfo=None)
        range_start = (now_dt - timedelta(days=6)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        range_end = (now_dt + timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        # Get won/lost status IDs
        status_won_ids = [5]  # Closed - Won
        status_lost_ids = [6]  # Closed - Lost

        # --- Aggregate Contacts per Day with Closed Statuses ---
        # First, get all contacts with their creation dates
        agg_pipeline = [
            {"$match": base_query},
            {
                "$addFields": {
                    "_created_at_date": {
                        "$cond": [
                            {"$eq": [{"$type": "$created_at"}, "date"]},
                            "$created_at",
                            {
                                "$convert": {"input": "$created_at", "to": "date", "onError": None, "onNull": None}
                            }
                        ]
                    }
                }
            },
            {
                "$addFields": {
                    "created_dt": {
                        "$ifNull": [
                            "$_created_at_date",
                            {
                                "$convert": {"input": "$createdon", "to": "date", "onError": None, "onNull": None}
                            }
                        ]
                    }
                }
            },
            {
                "$match": {
                    "created_dt": {
                        "$gte": range_start,
                        "$lt": range_end,
                    }
                }
            },
            {
                "$group": {
                    "_id": {
                        "$dateToString": {"format": "%Y-%m-%d", "date": "$created_dt"}
                    },
                    "allContacts": {"$sum": 1},
                }
            },
            {"$sort": {"_id": 1}},
        ]
        agg_by_day = {doc["_id"]: doc for doc in contacts_collection.aggregate(agg_pipeline)}

        # Now get contacts with closed won/lost statuses and aggregate by day
        closed_agg_pipeline = [
            {"$match": {
                **base_query,
                "status_id": {"$in": status_won_ids + status_lost_ids}
            }},
            {
                "$addFields": {
                    "_created_at_date": {
                        "$cond": [
                            {"$eq": [{"$type": "$created_at"}, "date"]},
                            "$created_at",
                            {
                                "$convert": {"input": "$created_at", "to": "date", "onError": None, "onNull": None}
                            }
                        ]
                    }
                }
            },
            {
                "$addFields": {
                    "created_dt": {
                        "$ifNull": [
                            "$_created_at_date",
                            {
                                "$convert": {"input": "$createdon", "to": "date", "onError": None, "onNull": None}
                            }
                        ]
                    }
                }
            },
            {
                "$match": {
                    "created_dt": {
                        "$gte": range_start,
                        "$lt": now_dt + timedelta(days=1),
                    }
                }
            },
            {
                "$group": {
                    "_id": {
                        "$dateToString": {"format": "%Y-%m-%d", "date": "$created_dt"}
                    },
                    "closedWon": {
                        "$sum": {"$cond": [{"$in": ["$status_id", status_won_ids]}, 1, 0]}
                    },
                    "closedLost": {
                        "$sum": {"$cond": [{"$in": ["$status_id", status_lost_ids]}, 1, 0]}
                    },
                }
            },
            {"$sort": {"_id": 1}},
        ]
        closed_agg_by_day = {doc["_id"]: doc for doc in contacts_collection.aggregate(closed_agg_pipeline)}

        from calendar import day_abbr
        chart_data = []

        for i in range(7):
            day_start = (now_dt - timedelta(days=6 - i)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            day_key = day_start.strftime("%Y-%m-%d")
            day_doc = agg_by_day.get(day_key, {"allContacts": 0})
            closed_doc = closed_agg_by_day.get(day_key, {"closedWon": 0, "closedLost": 0})

            chart_data.append(
                {
                    "day": day_abbr[day_start.weekday()],  # Mon, Tue, ...
                    "allContacts": int(day_doc.get("allContacts", 0)),
                    "closedWon": int(closed_doc.get("closedWon", 0)),
                    "closedLost": int(closed_doc.get("closedLost", 0)),
                }
            )

        # --- Chart Config ---
        # Dynamic y-axis max based on data
        try:
            max_point = 0
            for d in chart_data:
                max_point = max(max_point, int(d.get("allContacts", 0)), int(d.get("closedWon", 0)), int(d.get("closedLost", 0)))
            y_max = max_point if max_point > 0 else 10
        except Exception:
            y_max = 10
        chart_config = {
            "title": "Contacts Summary - Weekly",
            "titleRight": """
                <span class="inline-flex items-center gap-1 mr-3">
                  <span class="inline-block w-[10px] h-[10px] bg-[#6586E6] rounded-xs"></span>
                  All Contacts
                </span>
                <span class="inline-flex items-center gap-1 mr-3">
                  <span class="inline-block w-[10px] h-[10px] bg-[#8DD3A0] rounded-xs"></span>
                  Closed-Won
                </span>
                <span class="inline-flex items-center gap-1">
                  <span class="inline-block w-[10px] h-[10px] bg-[#ED7F7A] rounded-xs"></span>
                  Closed-Lost
                </span>
            """,
            "description": "",
            "series": [
                {"key": "allContacts", "label": "All Contacts", "color": "#6586E6"},
                {
                    "key": "closedWon",
                    "label": "Closed-Won",
                    "color": "#8DD3A0",
                },
                {"key": "closedLost", "label": "Closed-Lost", "color": "#ED7F7A"},
            ],
            "options": {
                "height": 250,
                "yDomain": [0, y_max],
                "xKey": "day",
                "showGrid": True,
            },
        }

        return {
            "status": status.HTTP_200_OK,
            "message": "Contact summary data retrieved successfully",
            "data": {
                "chartData": chart_data,
                "chartConfig": chart_config,
                "tenant_id": tenant_id,
            },
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

        # Aggregate counts by status within date range (support created_at Date/string and legacy createdon)
        pipeline = [
            {"$match": base_query}
        ]
        
        # Apply date filter using $or to support both created_at and createdon fields
        date_filter = {
            "$or": [
                {"created_at": {"$gte": from_date, "$lte": to_date}},
                {"createdon": {"$gte": from_date.isoformat(), "$lte": to_date.isoformat()}},
                {"$expr": {"$and": [
                    {"$gte": [{"$toDate": "$created_at"}, from_date]},
                    {"$lte": [{"$toDate": "$created_at"}, to_date]}
                ]}},
                {"$expr": {"$and": [
                    {"$gte": [{"$toDate": "$createdon"}, from_date]},
                    {"$lte": [{"$toDate": "$createdon"}, to_date]}
                ]}}
            ]
        }
        pipeline.append({"$match": date_filter})
        pipeline.append({"$group": {"_id": "$status_id", "count": {"$sum": 1}}})
        aggregation_result = list(contacts_collection.aggregate(pipeline))
        status_counts = {int(s.get("id")): 0 for s in contact_statuses if isinstance(s.get("id"), int)}
        for r in aggregation_result:
            key = r.get("_id")
            if isinstance(key, int):
                status_counts[key] = r.get("count", 0)

        total_in_range = sum(status_counts.values())
        color_palette = ["#10B981", "#F59E0B", "#3B82F6", "#EF4444", "#8B5CF6", "#06B6D4"]
        chart_data = []
        def safe_int(value, default: int = 0) -> int:
            try:
                if value in (None, ""):
                    return default
                return int(value)
            except Exception:
                return default
        for s in contact_statuses:
            sid = safe_int(s.get("id", 0), 0)
            title = s.get("title") or s.get("name") or f"Status {sid}"
            count = status_counts.get(sid, 0)
            percent = int(round((count / total_in_range * 100), 0)) if total_in_range > 0 else 0
            color = color_palette[(sid - 1) % len(color_palette)] if sid > 0 else "#6B7280"
            chart_data.append({"title": title, "value": count, "percent": percent, "color": color})

        total_contacts = contacts_collection.count_documents(base_query)
        active_contacts = contacts_collection.count_documents({**base_query, "status_id": 2})

        insights = {
            "date_range": {"from": from_date.isoformat(), "to": to_date.isoformat()},
            "active_rate": round((active_contacts / total_contacts * 100), 1) if total_contacts > 0 else 0,
            "statuses": {str(k): v for k, v in status_counts.items()}
        }

        response_data = {
            "chartData": chart_data,
            "counters": [
                {"title": "Total Contacts", "value": total_contacts, "trend": "neutral"},
                {"title": "Active Contacts", "value": active_contacts, "trend": "neutral"},
                {"title": "In Range", "value": total_in_range, "trend": "neutral"},
            ],
            "insights": insights,
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
        createdon = str(payload.get("created_on", "")).strip()
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
            contacts_collection.find(query, NO_ID_PROJECTION)
            .sort("id", -1)
            .skip(skip)
            .limit(limit)
        )

        tenant_id_int = int(user_detail.get("tenant_id", 0))

        records = []
        for c in contacts_list:
            try:
                records.append(enrich_contact_data(c, user_detail, tenant_id_int))
            except Exception as e:
                print(f"Error enriching contact {c.get('id', 'unknown')}: {e}")
                records.append(
                    {
                        "id": c.get("id", 0),
                        "name": c.get("name", ""),
                        "email": c.get("email", ""),
                        "phone": c.get("phone", ""),
                        "owner_details": {},
                        "user_details": {},
                        "account_details": {},
                    }
                )

        # Ensure all records are JSON serializable
        try:
            serialized_data = convert_to_jsonable(records)
        except Exception as e:
            print(f"Error serializing data: {e}")
            serialized_data = []

        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": serialized_data,
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
  


@contacts.post("/crm/contacts/save")
async def save_contact(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    """
    Handles creating or updating a CRM Contact record.

    Expected fields:
        id, owner_id, assigned_to_id, title, source_id,
        first_name, last_name, email, account_id, role_id,
        status_id, website, phone, mobile, fax, description,
        address1, address2, country_id, state_id, postal_code
    """
    try:
        # ---------- Helper functions ----------
        def to_int(value, default: int = 0) -> int:
            try:
                return int(value) if str(value).strip() not in ["", "None", "null"] else default
            except (ValueError, TypeError):
                return default

        def to_str(value, default: str = "") -> str:
            return str(value).strip() if value not in [None, "None", "null"] else default

        # ---------- Parse incoming payload ----------
        try:
            payload = await request.json()
        except Exception:
            payload = dict(await request.form())

        doc_id = to_int(payload.get("id"), 0)
        next_id = doc_id or get_next_id(contacts_collection)

        # ---------- Prepare contact data ----------
        data = {
            "id": next_id if doc_id == 0 else doc_id,
            "ukey": f"{user_detail['tenant_id']}000{next_id}",
            "tenant_id": to_int(user_detail.get("tenant_id"), 0),
            "user_id": to_int(user_detail.get("id"), 0),
            "title": to_str(payload.get("title")),
            "owner_id": to_int(payload.get("owner_id")),
            "assigned_to_id": to_int(payload.get("assigned_to_id")),
            "source_id": to_int(payload.get("source_id")),
            "first_name": to_str(payload.get("first_name")),
            "last_name": to_str(payload.get("last_name")),
            "name": f"{to_str(payload.get('first_name'))} {to_str(payload.get('last_name'))}".strip(),
            "email": to_str(payload.get("email")),
            "account_id": to_int(payload.get("account_id")),
            "role_id": to_int(payload.get("role_id")),
            "status_id": to_int(payload.get("status_id")),
            "website": to_str(payload.get("website")),
            "phone": to_str(payload.get("phone")),
            "mobile": to_str(payload.get("mobile")),
            "fax": to_str(payload.get("fax")),
            "description": to_str(payload.get("description")),
            "address1": to_str(payload.get("address1")),
            "address2": to_str(payload.get("address2")),
            "country_id": to_int(payload.get("country_id")),
            "state_id": to_int(payload.get("state_id")),
            "postal_code": to_str(payload.get("postal_code")),
            "active": 1,
            "sort_by": 0,
        }

        # ---------- Save or Update ----------
        if doc_id == 0:
            # Check for duplicate contacts before inserting
            # Duplicate criteria: same email, phone, or mobile within same tenant
            tenant_id = to_int(user_detail.get("tenant_id"), 0)
            duplicate_conditions = []
            
            if data.get("email"):
                duplicate_conditions.append({"email": data["email"]})
            
            if data.get("phone"):
                duplicate_conditions.append({"phone": data["phone"]})
            
            if data.get("mobile"):
                duplicate_conditions.append({"mobile": data["mobile"]})
            
            if duplicate_conditions:
                duplicate_query = {
                    "tenant_id": tenant_id,
                    "deleted": {"$ne": 1},
                    "$or": duplicate_conditions
                }
                
                existing_contact = contacts_collection.find_one(duplicate_query, NO_ID_PROJECTION)
                
                if existing_contact:
                    duplicate_fields = []
                    if data.get("email") and existing_contact.get("email") == data["email"]:
                        duplicate_fields.append("email")
                    if data.get("phone") and existing_contact.get("phone") == data["phone"]:
                        duplicate_fields.append("phone")
                    if data.get("mobile") and existing_contact.get("mobile") == data["mobile"]:
                        duplicate_fields.append("mobile")
                    
                    return {
                        "status": status.HTTP_409_CONFLICT,
                        "message": f"Duplicate contact found with matching {', '.join(duplicate_fields)}. Contact ID: {existing_contact.get('id')}",
                        "data": {
                            "duplicate_contact_id": existing_contact.get("id"),
                            "duplicate_fields": duplicate_fields
                        }
                    }
            
            data["created_at"] = datetime.utcnow()
            data["updated_at"] = datetime.utcnow()
            contacts_collection.insert_one(data)
            message = "Record saved successfully"
            activity="contact_saved"
            activity_title= f"contact saved {data.get('title', 'No title')}"
        else:
            data["updated_at"] = datetime.utcnow()
            contacts_collection.update_one(
                {"id": doc_id, "tenant_id": user_detail["tenant_id"]},
                {"$set": data},
            )
            message = "Record updated successfully"
            activity="contact_updated"
            activity_title= f"contact updated {data.get('title', 'No title')}"

        enriched_data = enrich_contact_data(data, user_detail)



        # Log activity for contact update
        log_activity(
            activity_type=activity,
            entity_type="contact",
            entity_id=int(data.get("id", 0)),
            user_detail=user_detail,
            title=activity_title,
            description=f"Contact {message}",
            metadata={
                "owner_id": data.get("owner_id"),
                "assigned_to_id": data.get("assigned_to_id"),
                "status_id": data.get("status_id")
            }
        )








        return json_response(message, convert_to_jsonable(enriched_data))

    except Exception as e:
        return get_error_response(e)
    



@contacts.get("/crm/contacts/details/get/{id}")
async def get_contact_details_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    return get_entity_details("contact", id, user_detail)


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

@contacts.get("/crm/contacts/{id}/favorite/{value}")
async def toggle_contact_favorite(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        if value == 1:
            favorite_collection.insert_one(
                {
                    "id": get_next_id(favorite_collection),
                    "tenant_id": user_detail["tenant_id"],
                    "favorite_type": "contact",
                    "favorite_id": id,
                    "user_id": int(user_detail["id"]),
                }
            )
            message = "contact marked as favorite" if value else "contact unmarked as favorite"
        else:
            favorite_collection.delete_one(
                {
                    "id": id,
                    "tenant_id": user_detail["tenant_id"],
                    "favorite_type": "contact",
                    "favorite_id": id,
                    "user_id": int(user_detail["id"]),
                }
            )
            message = "contact unmarked as favorite"
        
        log_activity(
            activity_type="contact_marked_as_favorite" if value else "contact_unmarked_as_favorite",
            entity_type="contact",
            entity_id=id,
            user_detail=user_detail,
            title=f"contact {'marked as favorite' if value else 'unmarked as favorite'}",
            description=f"contact {'marked as favorite' if value else 'unmarked as favorite'}",
            metadata={}
        )
        
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": None
        }
    except Exception as e:
        return get_error_details(e)

@contacts.post("/crm/contacts/get-grouped-by-status")
async def get_contacts_grouped_by_status(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    """
    Returns contacts grouped by status, optionally enriched with user details.
    """
    try:
        try:
            payload = await request.json()
        except Exception:
            form = await request.form()
            payload = dict(form)

        include_enrichment = str(payload.get("include_enrichment", "true")).lower() == "true"
        tenant_id = user_detail["tenant_id"]

        view = str(payload.get("view", "all_contacts")).strip()
        title = str(payload.get("title", "")).strip()
        email = str(payload.get("email", "")).strip()
        phone = str(payload.get("phone", "")).strip()
        mobile = str(payload.get("mobile", "")).strip()
        fax = str(payload.get("fax", "")).strip()
        website = str(payload.get("website", "")).strip()
        createdon = str(payload.get("created_on", "")).strip()
        last_activity = str(payload.get("last_activity", "")).strip()
        status_id = str(payload.get("status_id", "")).strip()
        owner_id = str(payload.get("owner_id", "")).strip()
        account_id = str(payload.get("account_id", "")).strip()
        role_id = str(payload.get("role_id", "")).strip()
        source_id = str(payload.get("source_id", "")).strip()
        country_id = str(payload.get("country_id", "")).strip()
        state_id = str(payload.get("state_id", "")).strip()
        postal_code = str(payload.get("postal_code", "")).strip()

        base_query = build_contacts_filter_query(
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

        contact_statuses = list(
            db.contacts_status_options
            .find({"tenant_id": tenant_id, "deleted": {"$ne": 1}}, NO_ID_PROJECTION)
            .sort("id", 1)
        ) or [
            {"id": 1, "title": "New"},
            {"id": 2, "title": "Active Contact"},
            {"id": 3, "title": "Inactive Contact"},
            {"id": 4, "title": "Prospect"},
            {"id": 5, "title": "Closed - Won"},
            {"id": 6, "title": "Closed - Lost"},
        ]
        status_map = {str(s.get("id")): s for s in contact_statuses if s.get("id") is not None}

        def _extract_status_values(condition: Any) -> Set[int]:
            values: Set[int] = set()
            if condition is None:
                return values
            if isinstance(condition, int):
                values.add(condition)
            elif isinstance(condition, str) and condition.isdigit():
                values.add(int(condition))
            elif isinstance(condition, (list, tuple, set)):
                for item in condition:
                    values.update(_extract_status_values(item))
            elif isinstance(condition, dict):
                for key in ("$in", "$eq"):
                    if key in condition:
                        values.update(_extract_status_values(condition[key]))
            return values

        # status_filter_values = _extract_status_values(base_query.get("status_id"))

        # if status_filter_values:
        #     filtered_statuses = [
        #         status for status in contact_statuses
        #         if status.get("id") in status_filter_values
        #     ]
        #     if not filtered_statuses:
        #         filtered_statuses = contact_statuses
        # else:
        filtered_statuses = contact_statuses

        pipeline = [
            {"$match": base_query},
            {"$group": {
                "_id": "$status_id",
                "total_contacts": {"$sum": 1},
                "contact_ids": {"$addToSet": "$id"}
            }},
            {"$sort": {"_id": 1}},
        ]
        groups = list(contacts_collection.aggregate(pipeline))

        contacts_by_status = {
            str(g.get("_id") if g.get("_id") is not None else "unknown"): {
                "total_contacts": g.get("total_contacts", 0),
                "contact_ids": g.get("contact_ids", []),
            }
            for g in groups
        }

        all_contact_ids = [
            lid for group in contacts_by_status.values() for lid in group.get("contact_ids", [])
        ]

        enriched_map: Dict[int, Dict[str, Any]] = {}
        if include_enrichment and all_contact_ids:
            enrich_pipeline = [
                {"$match": {
                    "tenant_id": tenant_id,
                    "deleted": {"$ne": 1},
                    "id": {"$in": all_contact_ids},
                }},
                {
                    "$lookup": {
                        "from": "users",
                        "localField": "owner_id",
                        "foreignField": "id",
                        "as": "owner_details_array",
                    }
                },
                {
                    "$addFields": {
                        "owner_details": {
                            "$ifNull": [{"$arrayElemAt": ["$owner_details_array", 0]}, {}]
                        }
                    }
                },
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
                {
                    "$lookup": {
                        "from": "accounts",
                        "localField": "account_id",
                        "foreignField": "id",
                        "as": "account_details_array"
                    }
                },
                {
                    "$addFields": {
                        "account_details": {
                            "$ifNull": [
                                {"$arrayElemAt": ["$account_details_array", 0]},
                                {}
                            ]
                        }
                    }
                },
                {"$project": {"_id": 0, "owner_details_array": 0, "user_details_array": 0, "account_details_array": 0}},
            ]
            enriched_docs = list(contacts_collection.aggregate(enrich_pipeline))
            for contact in enriched_docs:
                lid = contact.get("id")
                if lid is None:
                    continue
                for key in ["owner_details", "user_details", "account_details"]:
                    if isinstance(contact.get(key), dict):
                        contact[key].pop("_id", None)
                contact["last_activity_date"] = get_last_activity_date("contact", contact.get("id"), int(user_detail["tenant_id"]))
                contact["assigned_to_details"] = db.users.find_one({"id": contact.get("assigned_to_id")}, NO_ID_PROJECTION) or {}
                enriched_map[lid] = contact

        grouped_data = []
        total_contacts_count = 0
        processed_status_ids: Set[str] = set()

        for status_doc in filtered_statuses:
            status_id_value = status_doc.get("id")
            if status_id_value is None:
                continue
            status_id_str = str(status_id_value)
            group_info = contacts_by_status.get(status_id_str, {"total_contacts": 0, "contact_ids": []})
            group_result = {
                "id": status_id_value,
                "title": status_doc.get("title", ""),
                "total_contacts": group_info["total_contacts"],
            }

            if include_enrichment:
                group_result["contacts"] = [
                    enriched_map[lid] for lid in group_info.get("contact_ids", [])
                    if lid in enriched_map
                ]
            else:
                group_result["contact_ids"] = group_info.get("contact_ids", [])

            grouped_data.append(group_result)
            total_contacts_count += group_info["total_contacts"]
            processed_status_ids.add(status_id_str)

        for status_id_str, group_info in contacts_by_status.items():
            if status_id_str in processed_status_ids:
                continue
            total_for_status = group_info.get("total_contacts", 0)
            if total_for_status == 0:
                continue

            status_entry = status_map.get(status_id_str)
            status_id_int = int(status_id_str) if status_id_str.isdigit() else None
            if status_entry is None and status_id_int is not None:
                status_entry = db.contacts_status_options.find_one(
                    {"id": status_id_int, "tenant_id": tenant_id, "deleted": {"$ne": 1}},
                    NO_ID_PROJECTION
                )

            group_title = (status_entry or {}).get("title", f"Unknown Status ({status_id_str})")
            group_id = (status_entry or {}).get("id", status_id_int if status_id_int is not None else status_id_str)

            fallback_result = {
                "id": group_id,
                "title": group_title,
                "total_contacts": total_for_status,
            }

            if include_enrichment:
                fallback_result["contacts"] = [
                    enriched_map[lid] for lid in group_info.get("contact_ids", [])
                    if lid in enriched_map
                ]
            else:
                fallback_result["contact_ids"] = group_info.get("contact_ids", [])

            grouped_data.append(fallback_result)
            total_contacts_count += total_for_status

        return {
            "status": status.HTTP_200_OK,
            "message": "Contacts grouped by status retrieved successfully",
            "data": convert_to_jsonable(grouped_data),
            "summary": {
                "total_contacts": total_contacts_count,
                "total_status_groups": len(grouped_data),
                "enrichment_enabled": include_enrichment,
            },
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
            "query": convert_to_jsonable(base_query),
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
            payload = dict(await request.form())

        def to_int(value, default: int = 0) -> int:
            try:
                if value is None or value == "":
                    return default
                return int(value)
            except (ValueError, TypeError):
                return default

        contact_id = to_int(payload.get("id"), 0)
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

        contacts_collection.update_one(
            {"id": id, "tenant_id": user_detail["tenant_id"]},
            {"$set": {"status_id": status_value}}
        )

        return json_response("Contact status updated successfully", {"id": id, "status_id": status_value})
    except Exception as e:
        return get_error_response(e)

# ============================
# CRUD for Contacts - ending
# ============================