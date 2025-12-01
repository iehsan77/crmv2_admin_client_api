from fastapi import APIRouter, Request, status, Depends
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, Set


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
leads = APIRouter(tags=["CRM Admin - Leads"])

# MongoDB Collection
leads_collection = db.leads
favorite_collection = db_rentify.rentify_favorites

# Projection to exclude MongoDB _id
NO_ID_PROJECTION = {"_id": 0}


# ===============================
# Helper Functions - starting
# ===============================

def get_lead_statuses() -> dict:

    try:
        statuses = list(db.leads_statuses.find({"deleted": {"$ne": 1}}, NO_ID_PROJECTION).sort("id", 1))
        return statuses
        
    except Exception:
        statuses = [
            {"id": 1, "name": "New"},
            {"id": 2, "name": "Active Lead"},
            {"id": 3, "name": "Inactive Lead"},
            {"id": 4, "name": "Prospect"},
            {"id": 5, "name": "Closed - Won"},
            {"id": 6, "name": "Closed - Lost"},
        ]
        return statuses


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
    source_id: str = "",
    role_id: str = "",
    country_id: str = "",
    state_id: str = "",
    postal_code: str = "",
    created_on: str = "",
) -> dict:
    from datetime import datetime, timedelta

    query = {"tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}}
    
    # Parse and filter by created_on date only (exact calendar date)
    if created_on:
        try:
            # Accept either full ISO timestamp or YYYY-MM-DD
            date_part = created_on[:10]
            # Validate date format strictly as YYYY-MM-DD
            date_only = datetime.strptime(date_part, "%Y-%m-%d").date()

            # Build a day range in UTC (Mongo stores naive UTC via datetime.utcnow())
            start_of_day = datetime(date_only.year, date_only.month, date_only.day)
            end_of_day = start_of_day + timedelta(days=1)

            # Match any records whose created_at falls exactly on that date
            query["created_at"] = {
                "$gte": start_of_day,
                "$lt": end_of_day,
            }
        except Exception as e:
            # If parsing fails, ignore the created_on filter
            print(f"Error parsing created_on: {e}")
    
    # Store last_activity duration for later processing (after view filters)
    last_activity_duration = None
    if last_activity in ["last_24_hours", "last_7_days", "last_30_days"]:
        last_activity_duration = last_activity
    
     # Process last_activity duration filter (after view filters)
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
                "entity_type": "lead",
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

    if view == "my_leads":
        query["owner_id"] = int(user_detail["id"]) if str(user_detail.get("id")).isdigit() else user_detail.get("id")
    elif view == "unassigned_lead":
        query["$or"] = [{"assigned_to_id": {"$exists": False}}, {"assigned_to_id": 0}]
    elif view == "favorite_lead":
        query["favorite"] = 1
    elif view in {"new_lead", "contacted", "qualified", "in_progress", "negotiation", "closed_won", "closed_lost"}:
        # Map to status ids where available; defaults use provided LEADS_STATUS_OPTIONS
        status_map = {
            "new_lead": 1,
            "contacted": 2,  # treating as Active Lead
            "qualified": 3,  # Prospect
            "in_progress": 4,
            "negotiation": 5,
            "closed_won": 6,  # Closed - Won
            "closed_lost": 7,  # Closed - Lost
        }
        mapped = status_map.get(view)
        if mapped is not None:
            query["status_id"] = mapped
    elif view == "no_recent_activity":
        # Return only leads that have **no** activity logged
        tenant_id = user_detail.get("tenant_id")

        # Fetch all lead_ids from activity_logs for this tenant
        activity_leads = db.activity_logs.find(
            {
                "entity_type": "lead",
                "tenant_id": tenant_id,
                "deleted": {"$ne": 1},
            },
            {"entity_id": 1},
        )

        lead_ids: list[int] = []
        for activity in activity_leads:
            if activity.get("entity_id") is not None:
                lead_ids.append(activity["entity_id"])

        # Exclude leads that have any activity; if none have activity, keep existing query (all leads are "no activity")
        if lead_ids:
            query["id"] = {"$nin": lead_ids}
    elif view == "recently_contacted":
        # Filter for leads contacted in the last 24 hours with active status
        twenty_four_hours_ago = (datetime.utcnow() - timedelta(hours=24)).isoformat()
        tenant_id = user_detail.get("tenant_id")
        
        # Get all lead_ids from activity_logs where entity_type is "lead"
        activity_leads = db.activity_logs.find(
            {
                "entity_type": "lead",
                "tenant_id": tenant_id,
                "deleted": {"$ne": 1},
                "createdon": {"$gte": twenty_four_hours_ago}
            },
            {"entity_id": 1}
        )
        
        lead_ids = []
        for activity in activity_leads:
            if activity.get("entity_id"):
                lead_ids.append(activity["entity_id"])
        
        # Filter leads to only include those with recent activity
        if lead_ids:
            query["id"] = {"$in": lead_ids}
            query["status_id"] = 2
        else:
            # Return empty result if no recent activities found
            pass
    elif view == "no_phone_provided":
        query["$or"] = [{"phone": {"$exists": False}}, {"phone": ""}]
    elif view == "email_only_leads":
        query["email"] = {"$ne": ""}
        # query["$or"] = [{"phone": {"$exists": False}}, {"phone": ""}]
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
    # Only apply createdon regex if created_on date range hasn't been set
    if createdon and "createdon" not in query:
        query["createdon"] = {"$regex": createdon, "$options": "i"}
    
    if owner_id and str(owner_id).isdigit():
        query["owner_id"] = int(owner_id)
    if account_id and str(account_id).isdigit():
        query["account_id"] = int(account_id)
    if status_id and str(status_id).isdigit():
        query["status_id"] = int(status_id)
    if source_id:
        query["source_id"] = int(source_id)
    if role_id and str(role_id).isdigit():
        query["role_id"] = int(role_id)
    if country_id and str(country_id).isdigit():
        query["country_id"] = int(country_id)
    if state_id and str(state_id).isdigit():
        query["state_id"] = int(state_id)
    if postal_code:
        query["postal_code"] = {"$regex": postal_code, "$options": "i"}
    # Note: created_on is handled at the beginning of the function with proper date range filtering
    return query

def enrich_lead_data(lead: dict, user_detail: dict, tenant_id: Optional[int] = None) -> dict:
    """
    Enrich lead with related user/account details and last activity.
    Accepts an optional precomputed tenant_id for minor performance optimization.
    """
    if tenant_id is None:
        tenant_id = int(user_detail.get("tenant_id", 0))

    lead["owner_details"] = (
        db.users.find_one({"id": int(lead.get("owner_id"))}, NO_ID_PROJECTION) or {}
    )
    lead["user_details"] = (
        db.users.find_one({"id": int(lead.get("user_id"))}, NO_ID_PROJECTION) or {}
    )
    lead["assigned_to_details"] = (
        db.users.find_one({"id": int(lead.get("assigned_to_id"))}, NO_ID_PROJECTION)
        or {}
    )
    lead["last_activity_date"] = get_last_activity_date("lead", lead["id"], tenant_id)
    lead["favorite"] = get_favorite("lead", int(lead.get("id")), tenant_id)

    if lead.get("account_id"):
        lead["account_details"] = (
            db.accounts.find_one({"id": lead.get("account_id")}, NO_ID_PROJECTION) or {}
        )

    return lead
# ===============================
# Helper Functions - ending
# ===============================




# ============================
# CRUD for Leads - starting
# ============================

@leads.post("/crm/leads/get-statistics")
async def get_leads_cards_statistics(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Return a cards-only statistics payload (without chart_info), distinct from the chart endpoint.
    Mirrors accounts' get-statistics behavior: an array of card objects with totals and lineChartData.
    Enterprise-grade: Accurate counts with proper date filtering and percentage change calculations.
    """
    try:
        form = dict(await request.form())
        tenant_id = int(user_detail.get("tenant_id", 0))

        # Use from/to (UTC) to anchor calculations
        from_date_str = str(form.get("from", ""))
        to_date_str = str(form.get("to", ""))

        def _parse_iso_naive_utc(s: str):
            try:
                dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
                if dt.tzinfo is not None:
                    dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
                return dt
            except Exception:
                return None

        # Parse dates and ensure to_date includes full day (end of day)
        if from_date_str and to_date_str:
            from_date = _parse_iso_naive_utc(from_date_str) or datetime.utcnow()
            to_date = _parse_iso_naive_utc(to_date_str) or datetime.utcnow()
            # Set to_date to end of day (23:59:59.999999) to include full selected day
            to_date = to_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            # Set from_date to start of day (00:00:00.000000)
            from_date = from_date.replace(hour=0, minute=0, second=0, microsecond=0)
        else:
            to_date = datetime.utcnow().replace(hour=23, minute=59, second=59, microsecond=999999)
            from_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

        # Calculate previous period for percentage change (same duration, before from_date)
        period_duration = (to_date - from_date).total_seconds()
        prev_to_date = from_date - timedelta(seconds=1)  # End of previous period
        prev_from_date = prev_to_date - timedelta(seconds=period_duration)  # Start of previous period
        prev_from_date = prev_from_date.replace(hour=0, minute=0, second=0, microsecond=0)
        prev_to_date = prev_to_date.replace(hour=23, minute=59, second=59, microsecond=999999)

        # Build date filter for current period
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

        # Build date filter for previous period
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
        
        base_query = {"tenant_id": tenant_id, "deleted": {"$ne": 1}, **date_filter}
        prev_base_query = {"tenant_id": tenant_id, "deleted": {"$ne": 1}, **prev_date_filter}

        # Status IDs based on LEADS_STATUS_OPTIONS
        # 1: New Lead, 2: Contacted, 3: Qualified, 4: In Progress, 5: Negotiation, 6: Closed - Won, 7: Closed - Lost
        qualified_status_ids = [3, 6]  # Qualified + Closed - Won
        dropped_status_ids = [7]  # Closed - Lost

        # Current period counts
        total_leads = db.leads.count_documents(base_query)
        qualified_leads = db.leads.count_documents({**base_query, "status_id": {"$in": qualified_status_ids}})
        dropped_leads = db.leads.count_documents({**base_query, "status_id": {"$in": dropped_status_ids}})

        # Previous period counts for percentage change calculation
        prev_total_leads = db.leads.count_documents(prev_base_query)
        prev_qualified_leads = db.leads.count_documents({**prev_base_query, "status_id": {"$in": qualified_status_ids}})
        prev_dropped_leads = db.leads.count_documents({**prev_base_query, "status_id": {"$in": dropped_status_ids}})

        # Calculate percentage changes
        def calculate_change(current, previous):
            if previous == 0:
                return "+0%" if current == 0 else "+100%"
            change = ((current - previous) / previous) * 100
            sign = "+" if change >= 0 else ""
            return f"{sign}{change:.1f}%"

        total_change = calculate_change(total_leads, prev_total_leads)
        qualified_change = calculate_change(qualified_leads, prev_qualified_leads)
        dropped_change = calculate_change(dropped_leads, prev_dropped_leads)

        # Dynamic source breakdown
        sources = list(db.leads.aggregate([
            {"$match": base_query},
            {"$group": {"_id": "$source_id", "count": {"$sum": 1}}}
        ]))
        source_counts = {str(s.get("_id")): s.get("count", 0) for s in sources}
        website_count = source_counts.get("1", 0)
        email_campaign_count = source_counts.get("2", 0)
        call_in_count = source_counts.get("3", 0)
        manual_count = source_counts.get("4", 0)

        # Dynamic qualified segmentation (Residential vs Commercial) using best-effort fields
        def count_by_interest(field_names, value):
            matched = 0
            for fname in field_names:
                try:
                    matched = db.leads.count_documents({**base_query, "status_id": {"$in": qualified_status_ids}, fname: {"$regex": f"^{value}$", "$options": "i"}})
                except Exception:
                    matched = 0
                if matched:
                    break
            return matched

        residential_count = count_by_interest(["interest_type", "property_type", "segment", "category"], "residential")
        commercial_count = count_by_interest(["interest_type", "property_type", "segment", "category"], "commercial")
        if residential_count == 0 and commercial_count == 0:
            residential_count = db.leads.count_documents({**base_query, "status_id": 4})
            commercial_count = db.leads.count_documents({**base_query, "status_id": 5})

        # Dynamic dropped reasons with fixed labels
        def count_reason(regex_list):
            try:
                # Prefer drop_reason; fallback to lost_reason
                pipeline = [
                    {"$match": {**base_query, "status_id": {"$in": dropped_status_ids}, "drop_reason": {"$type": "string"}}},
                    {"$match": {"drop_reason": {"$regex": "|".join(regex_list), "$options": "i"}}},
                    {"$count": "count"},
                ]
                res = list(db.leads.aggregate(pipeline))
                if res and res[0].get("count"):
                    return int(res[0]["count"]) 
                pipeline2 = [
                    {"$match": {**base_query, "status_id": {"$in": dropped_status_ids}, "lost_reason": {"$type": "string"}}},
                    {"$match": {"lost_reason": {"$regex": "|".join(regex_list), "$options": "i"}}},
                    {"$count": "count"},
                ]
                res2 = list(db.leads.aggregate(pipeline2))
                if res2 and res2[0].get("count"):
                    return int(res2[0]["count"])
            except Exception:
                pass
            return 0

        budget_mismatch_count = count_reason(["budget", "price", "cost"]) 
        no_response_count = count_reason(["no\\s*response", "unresponsive", "no\\s*reply"]) 
        unreachable_invalid_count = count_reason(["unreachable", "invalid", "wrong\\s*(number|email)"])
        dropped_desc = f"Budget Mismatch: {budget_mismatch_count} | No Response: {no_response_count} | Unreachable/Invalid Info: {unreachable_invalid_count}"

        # Penetration across accounts
        try:
            unique_accounts_with_leads = len(set([doc.get("account_id") for doc in db.leads.find(base_query, {"_id": 0, "account_id": 1}) if doc.get("account_id")]))
            total_accounts = db.accounts.count_documents({"tenant_id": tenant_id, "deleted": {"$ne": 1}})
            leads_penetration = round((unique_accounts_with_leads / total_accounts * 100), 1) if total_accounts > 0 else 0.0
        except Exception:
            leads_penetration = 0.0

        # 7-day line chart values (last 7 days within the date range)
        line_chart_data = []
        # Calculate days to show (up to 7 days, but within the date range)
        days_in_range = min(7, (to_date - from_date).days + 1)
        chart_start_date = max(from_date, to_date - timedelta(days=6))
        
        for i in range(7):
            # Calculate day relative to to_date (last 7 days)
            day_start = (to_date - timedelta(days=6 - i)).replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            # Only count if day is within the requested date range
            if day_start < from_date or day_start > to_date:
                line_chart_data.append({"value": 0})
                continue
            
            # Build day filter
            day_filter = {
                "$or": [
                    {"created_at": {"$gte": day_start, "$lt": day_end}},
                    {"$expr": {"$and": [
                        {"$gte": [{"$toDate": "$created_at"}, day_start]},
                        {"$lt": [{"$toDate": "$created_at"}, day_end]}
                    ]}},
                    {"$expr": {"$and": [
                        {"$gte": [{"$toDate": "$createdon"}, day_start]},
                        {"$lt": [{"$toDate": "$createdon"}, day_end]}
                    ]}},
                ]
            }
            
            # Count leads for this specific day (within date range)
            query = {
                "tenant_id": tenant_id,
                "deleted": {"$ne": 1},
                "$and": [
                    {"$or": [
                        {"created_at": {"$gte": from_date, "$lte": to_date}},
                        {"$expr": {"$and": [
                            {"$gte": [{"$toDate": "$created_at"}, from_date]},
                            {"$lte": [{"$toDate": "$created_at"}, to_date]}
                        ]}},
                        {"$expr": {"$and": [
                            {"$gte": [{"$toDate": "$createdon"}, from_date]},
                            {"$lte": [{"$toDate": "$createdon"}, to_date]}
                        ]}},
                    ]},
                    day_filter,
                ]
            }
            cnt = db.leads.count_documents(query)
            line_chart_data.append({"value": int(cnt)})

        # Compute live response time metrics from all leads in date range
        def _parse_dt(value):
            try:
                if isinstance(value, datetime):
                    # Normalize to naive UTC to match created_at storage
                    return value if value.tzinfo is None else value.astimezone(timezone.utc).replace(tzinfo=None)
                if isinstance(value, str) and value:
                    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
                    return dt if dt.tzinfo is None else dt.astimezone(timezone.utc).replace(tzinfo=None)
            except Exception:
                return None
            return None

        # Fetch ALL leads within the date range for accurate response time calculation
        # Use aggregation for better performance with large datasets
        response_time_pipeline = [
            {"$match": base_query},
            {"$project": {
                "_id": 0,
                "id": 1,
                "created_at": 1,
                "createdon": 1,
                "source_id": 1,
            }},
            {"$limit": 10000}  # Reasonable limit for performance
        ]
        
        recent_leads = list(db.leads.aggregate(response_time_pipeline))

        total_deltas = []  # in hours
        email_deltas = []
        phone_deltas = []
        
        # Get all activity logs for these leads in one query for better performance
        lead_ids = [int(lead_doc.get("id")) for lead_doc in recent_leads if lead_doc.get("id")]
        
        if lead_ids:
            # Get earliest activity for each lead using aggregation
            activity_pipeline = [
                {"$match": {
                    "entity_type": "lead",
                    "entity_id": {"$in": lead_ids},
                    "tenant_id": tenant_id,
                    "deleted": {"$ne": 1},
                }},
                {"$project": {
                    "_id": 0,
                    "entity_id": 1,
                    "createdon": 1,
                    "timestamp": 1,
                    "activity_date": {
                        "$cond": [
                            {"$ne": [{"$type": "$createdon"}, "missing"]},
                            {"$toDate": "$createdon"},
                            {"$toDate": "$timestamp"}
                        ]
                    }
                }},
                {"$sort": {"activity_date": 1}},
                {"$group": {
                    "_id": "$entity_id",
                    "first_activity": {"$first": "$activity_date"}
                }}
            ]
            
            earliest_activities = {
                doc["_id"]: doc["first_activity"]
                for doc in db.activity_logs.aggregate(activity_pipeline)
            }
            
            # Calculate response times
            for lead_doc in recent_leads:
                lead_id = lead_doc.get("id")
                if not lead_id:
                    continue
                    
                created_dt = _parse_dt(lead_doc.get("created_at")) or _parse_dt(lead_doc.get("createdon"))
                if not created_dt:
                    continue
                
                first_act_dt = earliest_activities.get(int(lead_id))
                if not first_act_dt:
                    continue
                
                # Parse activity date if it's a datetime object
                if isinstance(first_act_dt, datetime):
                    first_act_dt_parsed = first_act_dt
                else:
                    first_act_dt_parsed = _parse_dt(str(first_act_dt))
                
                if not first_act_dt_parsed:
                    continue
                
                delta_hours = max(0.0, (first_act_dt_parsed - created_dt).total_seconds() / 3600.0)
                total_deltas.append(delta_hours)

                src = lead_doc.get("source_id")
                # Source IDs: 1=Website, 2=Email Campaigns, 3=Call-in Leads, 4=Manual
                if src == 2:  # Email Campaigns
                    email_deltas.append(delta_hours)
                elif src == 3:  # Call-in Leads
                    phone_deltas.append(delta_hours)

        def _avg(lst):
            if not lst:
                return 0.0
            return round(sum(lst) / len(lst), 1)

        avg_response_time_hours = _avg(total_deltas)
        email_leads_hours = _avg(email_deltas)
        phone_leads_hours = _avg(phone_deltas)
        
        # Calculate response time change (compare with previous period)
        prev_response_time_pipeline = [
            {"$match": prev_base_query},
            {"$project": {
                "_id": 0,
                "id": 1,
                "created_at": 1,
                "createdon": 1,
            }},
            {"$limit": 10000}
        ]
        prev_leads = list(db.leads.aggregate(prev_response_time_pipeline))
        prev_lead_ids = [int(lead_doc.get("id")) for lead_doc in prev_leads if lead_doc.get("id")]
        prev_total_deltas = []
        
        if prev_lead_ids:
            prev_activity_pipeline = [
                {"$match": {
                    "entity_type": "lead",
                    "entity_id": {"$in": prev_lead_ids},
                    "tenant_id": tenant_id,
                    "deleted": {"$ne": 1},
                }},
                {"$project": {
                    "_id": 0,
                    "entity_id": 1,
                    "createdon": 1,
                    "timestamp": 1,
                    "activity_date": {
                        "$cond": [
                            {"$ne": [{"$type": "$createdon"}, "missing"]},
                            {"$toDate": "$createdon"},
                            {"$toDate": "$timestamp"}
                        ]
                    }
                }},
                {"$sort": {"activity_date": 1}},
                {"$group": {
                    "_id": "$entity_id",
                    "first_activity": {"$first": "$activity_date"}
                }}
            ]
            prev_earliest_activities = {
                doc["_id"]: doc["first_activity"]
                for doc in db.activity_logs.aggregate(prev_activity_pipeline)
            }
            
            for lead_doc in prev_leads:
                lead_id = lead_doc.get("id")
                if not lead_id:
                    continue
                created_dt = _parse_dt(lead_doc.get("created_at")) or _parse_dt(lead_doc.get("createdon"))
                if not created_dt:
                    continue
                first_act_dt = prev_earliest_activities.get(int(lead_id))
                if not first_act_dt:
                    continue
                if isinstance(first_act_dt, datetime):
                    first_act_dt_parsed = first_act_dt
                else:
                    first_act_dt_parsed = _parse_dt(str(first_act_dt))
                if not first_act_dt_parsed:
                    continue
                delta_hours = max(0.0, (first_act_dt_parsed - created_dt).total_seconds() / 3600.0)
                prev_total_deltas.append(delta_hours)
        
        prev_avg_response_time = _avg(prev_total_deltas)
        response_time_change = calculate_change(avg_response_time_hours, prev_avg_response_time) if prev_avg_response_time > 0 else "+0%"

        cards = [
            {
                "icon": "/icons/qualified.svg",
                "iconClass": "",
                "title": "Qualified Leads",
                "total": str(qualified_leads),
                "change": qualified_change,
                "description": f"Interested in Residentials: {residential_count} | Interested in Commercial: {commercial_count} | Leads Penetration: {int(leads_penetration)}%",
                "lineChartData": line_chart_data,
            },
            {
                "icon": "/icons/time_peace.svg",
                "iconClass": "",
                "title": "Average Lead Response Time",
                "total": f"{avg_response_time_hours} Hours",
                "change": response_time_change,
                "description": f"Email Leads: {email_leads_hours}hrs | Phone Leads: {phone_leads_hours}hrs",
                "lineChartData": line_chart_data,
            },
            {
                "icon": "/icons/magnatic.svg",
                "iconClass": "",
                "title": "Total Leads",
                "total": str(total_leads),
                "change": total_change,
                "description": f"Website: {website_count} | Email Campaigns: {email_campaign_count} | Call-in Leads: {call_in_count} | Manually Added: {manual_count}",
                "lineChartData": line_chart_data,
            },
            {
                "icon": "/icons/barchart.svg",
                "iconClass": "",
                "title": "Dropped Leads",
                "total": str(dropped_leads),
                "change": dropped_change,
                "description": dropped_desc,
                "lineChartData": line_chart_data,
            },
        ]

        return json_response("Lead statistics retrieved successfully", cards)
    except Exception as e:
        return get_error_response(e)

"""
@leads.post("/crm/leads/get-lead-summary-chart-data")
async def get_leads_statistics(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        form = dict(await request.form())
        tenant_id = int(user_detail.get("tenant_id", 0))

        base_query = {"tenant_id": tenant_id, "deleted": {"$ne": 1}}

        # Parse optional from/to similar to status chart endpoint
        from_date_str = form.get("from", "")
        to_date_str = form.get("to", "")

        def parse_iso(s: str):
            try:
                dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
                if dt.tzinfo is not None:
                    dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
                return dt
            except Exception:
                return None

        if from_date_str and to_date_str:
            from_date = parse_iso(from_date_str) or datetime.utcnow()
            to_date = parse_iso(to_date_str) or datetime.utcnow()
        else:
            to_date = datetime.utcnow()
            from_date = to_date

        now_dt = to_date

        # Build chartData and chartConfig in requested structure (weekly - last 7 days)
        from calendar import day_name

        def day_range_utc(dt: datetime):
            start = dt.replace(hour=0, minute=0, second=0, microsecond=0)
            end = start + timedelta(days=1)
            return start, end

        def build_date_filter(start_dt: datetime, end_dt: datetime) -> dict:
            # Support created_at as Date, created_at as string, and legacy createdon string
            return {
                "$or": [
                    {"created_at": {"$gte": start_dt, "$lt": end_dt}},
                    {"$expr": {"$and": [
                        {"$gte": [{"$toDate": "$created_at"}, start_dt]},
                        {"$lt": [{"$toDate": "$created_at"}, end_dt]}
                    ]}},
                    {"$expr": {"$and": [
                        {"$gte": [{"$toDate": "$createdon"}, start_dt]},
                        {"$lt": [{"$toDate": "$createdon"}, end_dt]}
                    ]}},
                ]
            }

        # Aggregate once over the full range and group by day for performance
        from_date_start = (now_dt - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
        # Prefer the provided from_date if available; otherwise use 7-day window from now_dt
        try:
            range_start = max(from_date, from_date_start)  # from_date was parsed earlier in the endpoint
        except Exception:
            range_start = from_date_start

        agg_pipeline = [
            {"$match": base_query},
            {"$addFields": {
                "_created_at_date": {
                    "$cond": [
                        {"$eq": [{"$type": "$created_at"}, "date"]},
                        "$created_at",
                        {"$convert": {"input": "$created_at", "to": "date", "onError": None, "onNull": None}}
                    ]
                }
            }},
            {"$addFields": {
                "created_dt": {"$ifNull": [
                    "$_created_at_date",
                    {"$convert": {"input": "$createdon", "to": "date", "onError": None, "onNull": None}}
                ]}
            }},
            {"$match": {"created_dt": {"$gte": range_start, "$lt": now_dt + timedelta(days=1)}}},
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_dt"}},
                "all": {"$sum": 1},
                "converted": {"$sum": {"$cond": [{"$eq": ["$status_id", 3]}, 1, 0]}},
                "lost": {"$sum": {"$cond": [{"$eq": ["$status_id", 7]}, 1, 0]}},
            }},
            {"$sort": {"_id": 1}}
        ]
        agg_by_day = {doc["_id"]: doc for doc in db.leads.aggregate(agg_pipeline)}

        chart_data = []
        for i in range(7):
            day_start = (now_dt - timedelta(days=6 - i)).replace(hour=0, minute=0, second=0, microsecond=0)
            day_key = day_start.strftime("%Y-%m-%d")
            day_doc = agg_by_day.get(day_key, {"all": 0, "converted": 0, "lost": 0})
            chart_data.append({
                "day": day_name[day_start.weekday()],
                "all": int(day_doc.get("all", 0)),
                "converted": int(day_doc.get("converted", 0)),
                "lost": int(day_doc.get("lost", 0)),
            })

        chart_config = {
            "all": {"label": "All Leads", "color": "var(--chart-1)"},
            "converted": {"label": "Converted Leads", "color": "var(--chart-2)"},
            "lost": {"label": "Lost Leads", "color": "var(--chart-3)"},
        }

        return {
            "status": status.HTTP_200_OK,
            "message": "Lead summary data retrieved successfully",
            "data": {"chartData": chart_data,
            "chartConfig": chart_config,
            "tenant_id": tenant_id},
            
        }
    except Exception as e:
        return get_error_response(e)
"""

@leads.post("/crm/leads/get-lead-summary-chart-data")
async def get_leads_summary_chart_data(
    request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)
):
    """
    Returns weekly leads summary data for the dashboard chart
    showing All Leads, Converted Leads, and Lost Leads.
    
    
    
    
    const SummaryChartData = {
    // 🧠 Dummy data for demonstration
    chartData: [
        { day: "Mon", convertedLeads: 150, lostLeads: 150, allLeads: 300 },
        { day: "Tue", convertedLeads: 300, lostLeads: 20, allLeads: 320 },
        { day: "Wed", convertedLeads: 40, lostLeads: 300, allLeads: 340 },
        { day: "Thr", convertedLeads: 300, lostLeads: 60, allLeads: 360 },
        { day: "Fri", convertedLeads: 500, lostLeads: 500, allLeads: 1000 },
        { day: "Sat", convertedLeads: 220, lostLeads: 200, allLeads: 420 },
        { day: "Sun", convertedLeads: 100, lostLeads: 80, allLeads: 20 },
    ],

    chartConfig: {
        title: "Leads Summary - Weekly",
        titleRight: `
                <span class="inline-flex items-center gap-1 mr-3">
                    <span class="inline-block w-[10px] h-[10px] bg-[#6586E6] rounded-xs"></span>
                    All Leads
                </span>
                <span class="inline-flex items-center gap-1 mr-3">
                    <span class="inline-block w-[10px] h-[10px] bg-[#8DD3A0] rounded-xs"></span>
                    Converted Leads
                </span>
                <span class="inline-flex items-center gap-1">
                    <span class="inline-block w-[10px] h-[10px] bg-[#ED7F7A] rounded-xs"></span>
                    Lost Leads
                </span>`,
        description: "",
        series: [
        { key: "allLeads", label: "All Leads", color: "#6586E6" },
        {
            key: "convertedLeads",
            label: "Converted Leads",
            color: "#8DD3A0",
        },
        { key: "lostLeads", label: "Lost Leads", color: "#ED7F7A" },
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

        # --- Aggregate Leads per Day ---
        agg_pipeline = [
            {"$match": base_query},
            {
                "$addFields": {
                    "_created_at_date": {
                        "$cond": [
                            {"$eq": [{"$type": "$created_at"}, "date"]},
                            "$created_at",
                            {
                                "$convert": {
                                    "input": "$created_at",
                                    "to": "date",
                                    "onError": None,
                                    "onNull": None,
                                }
                            },
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
                                "$convert": {
                                    "input": "$createdon",
                                    "to": "date",
                                    "onError": None,
                                    "onNull": None,
                                }
                            },
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
                    "allLeads": {"$sum": 1},
                    "convertedLeads": {
                        "$sum": {"$cond": [{"$eq": ["$status_id", 3]}, 1, 0]}
                    },
                    "lostLeads": {
                        "$sum": {"$cond": [{"$eq": ["$status_id", 7]}, 1, 0]}
                    },
                }
            },
            {"$sort": {"_id": 1}},
        ]

        agg_by_day = {doc["_id"]: doc for doc in db.leads.aggregate(agg_pipeline)}

        from calendar import day_abbr
        chart_data = []

        for i in range(7):
            day_start = (now_dt - timedelta(days=6 - i)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            day_key = day_start.strftime("%Y-%m-%d")
            day_doc = agg_by_day.get(
                day_key, {"allLeads": 0, "convertedLeads": 0, "lostLeads": 0}
            )

            chart_data.append(
                {
                    "day": day_abbr[day_start.weekday()],  # Mon, Tue, ...
                    "convertedLeads": int(day_doc.get("convertedLeads", 0)),
                    "lostLeads": int(day_doc.get("lostLeads", 0)),
                    "allLeads": int(day_doc.get("allLeads", 0)),
                }
            )

        # --- Chart Config ---
        # Dynamic y-axis max based on data
        try:
            max_point = 0
            for d in chart_data:
                max_point = max(max_point, int(d.get("allLeads", 0)), int(d.get("convertedLeads", 0)), int(d.get("lostLeads", 0)))
            y_max = max_point if max_point > 0 else 10
        except Exception:
            y_max = 10
        chart_config = {
            "title": "Leads Summary - Weekly",
            "titleRight": """
                <span class="inline-flex items-center gap-1 mr-3">
                  <span class="inline-block w-[10px] h-[10px] bg-[#6586E6] rounded-xs"></span>
                  All Leads
                </span>
                <span class="inline-flex items-center gap-1 mr-3">
                  <span class="inline-block w-[10px] h-[10px] bg-[#8DD3A0] rounded-xs"></span>
                  Converted Leads
                </span>
                <span class="inline-flex items-center gap-1">
                  <span class="inline-block w-[10px] h-[10px] bg-[#ED7F7A] rounded-xs"></span>
                  Lost Leads
                </span>
            """,
            "description": "",
            "series": [
                {"key": "allLeads", "label": "All Leads", "color": "#6586E6"},
                {
                    "key": "convertedLeads",
                    "label": "Converted Leads",
                    "color": "#8DD3A0",
                },
                {"key": "lostLeads", "label": "Lost Leads", "color": "#ED7F7A"},
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
            "message": "Lead summary data retrieved successfully",
            "data": {
                "chartData": chart_data,
                "chartConfig": chart_config,
                "tenant_id": tenant_id,
            },
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
                dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
                # Normalize to UTC and drop tzinfo to match stored naive UTC in Mongo
                if dt.tzinfo is not None:
                    dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
                return dt
            except Exception:
                return None

        if from_date_str and to_date_str:
            from_date = parse_iso(from_date_str) or datetime.utcnow()
            to_date = parse_iso(to_date_str) or datetime.utcnow()
        else:
            to_date = datetime.utcnow()
            from_date = to_date

        base_query = {"tenant_id": tenant_id, "deleted": {"$ne": 1}}

        statuses = get_lead_statuses()
        
        pipeline = [
            {"$match": {**base_query}},
            {
                "$match": {
                    "$or": [
                        # Native Date type in created_at
                        {"created_at": {"$gte": from_date, "$lte": to_date}},
                        # created_at stored as ISO string → convert at query time
                        {
                            "$expr": {
                                "$and": [
                                    {"$gte": [{"$toDate": "$created_at"}, from_date]},
                                    {"$lte": [{"$toDate": "$created_at"}, to_date]}
                                ]
                            }
                        },
                        # legacy createdon field stored as ISO string
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
            },
            # Normalize status_id to int for grouping regardless of stored type
            {"$addFields": {"status_id_num": {"$convert": {"input": "$status_id", "to": "int", "onError": 0, "onNull": 0}}}},
            {"$group": {"_id": "$status_id_num", "count": {"$sum": 1}}},
        ]
        agg = list(leads_collection.aggregate(pipeline))

        counts = {int(s.get("id")): 0 for s in statuses if isinstance(s.get("id"), int)}
        for r in agg:
            if isinstance(r.get("_id"), int):
                counts[r["_id"]] = r.get("count", 0)

        # Fallback: if aggregation returned nothing, compute counts via direct queries
        if sum(counts.values()) == 0:
            # Reuse the same date filter for count_documents
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
            for s in statuses:
                sid = s.get("id")
                try:
                    sid_int = int(sid)
                except Exception:
                    continue
                filter_with_status = {
                    **base_query,
                    **date_filter,
                    "$or": [
                        {"status_id": sid_int},
                        {"status_id": str(sid_int)},
                    ]
                }
                try:
                    counts[sid_int] = int(leads_collection.count_documents(filter_with_status))
                except Exception:
                    counts[sid_int] = 0

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
            "date_range": {"from": from_date.isoformat()+"+00:00" if from_date.tzinfo else from_date.replace(tzinfo=timezone.utc).isoformat(), "to": to_date.isoformat()+"+00:00" if to_date.tzinfo else to_date.replace(tzinfo=timezone.utc).isoformat()},
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
        source_id = str(payload.get("source_id", "")).strip()
        role_id = str(payload.get("role_id", "")).strip()
        country_id = str(payload.get("country_id", "")).strip()
        state_id = str(payload.get("state_id", "")).strip()
        postal_code = str(payload.get("postal_code", "")).strip()
        created_on = str(payload.get("created_on", "")).strip()

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
            source_id=source_id,
            role_id=role_id,
            country_id=country_id,
            state_id=state_id,
            postal_code=postal_code,
            created_on=created_on,
        )

        total_count = leads_collection.count_documents(query)
        leads_list = list(
            leads_collection.find(query, NO_ID_PROJECTION).sort("id", -1).skip(skip).limit(limit)
        )

        records = []
        tenant_id_int = int(user_detail.get("tenant_id", 0))
        for lead in leads_list:
            records.append(enrich_lead_data(lead, user_detail, tenant_id_int))

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
                "source_id": source_id,
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

@leads.post("/crm/leads/save")
async def save_lead(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    """
    Handles creating or updating a CRM Lead record.

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
        next_id = doc_id or get_next_id(leads_collection)

        # ---------- Prepare lead data ----------
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

        # ---------- Check for duplicates (email, phone) ----------
        tenant_id = to_int(user_detail.get("tenant_id"), 0)

        duplicate_conditions = []

        if data.get("email"):
            duplicate_conditions.append({"email": data["email"]})

        if data.get("phone"):
            duplicate_conditions.append({"phone": data["phone"]})

        if duplicate_conditions:
            duplicate_query: dict = {
                "tenant_id": tenant_id,
                "deleted": {"$ne": 1},
                "$or": duplicate_conditions,
            }

            # On update, exclude the current lead id from duplicate search
            if doc_id:
                duplicate_query["id"] = {"$ne": doc_id}

            existing_lead = leads_collection.find_one(duplicate_query, NO_ID_PROJECTION)

            if existing_lead:
                duplicate_fields = []
                if data.get("email") and existing_lead.get("email") == data["email"]:
                    duplicate_fields.append("email")
                if data.get("phone") and existing_lead.get("phone") == data["phone"]:
                    duplicate_fields.append("phone")

                return json_response(
                    f"Duplicate lead found with matching {', '.join(duplicate_fields)}. Lead ID: {existing_lead.get('id')}",
                    {
                        "duplicate_lead_id": existing_lead.get("id"),
                        "duplicate_fields": duplicate_fields,
                    },
                    status.HTTP_409_CONFLICT,
                )

        # ---------- Save or Update ----------
        if doc_id == 0:
            data["created_at"] = datetime.utcnow()
            data["updated_at"] = datetime.utcnow()
            leads_collection.insert_one(data)
            message = "Record saved successfully"
            activity="lead_saved"
            activity_title= f"lead saved {data.get('title', 'No title')}"
        else:
            data["updated_at"] = datetime.utcnow()
            leads_collection.update_one(
                {"id": doc_id, "tenant_id": user_detail["tenant_id"]},
                {"$set": data},
            )
            message = "Record updated successfully"
            activity="lead_updated"
            activity_title= f"lead updated {data.get('title', 'No title')}"

        enriched_data = enrich_lead_data(data, user_detail, int(user_detail.get("tenant_id", 0)))

        # Log activity for lead update
        log_activity(
            activity_type=activity,
            entity_type="lead",
            entity_id=int(data.get("id", 0)),
            user_detail=user_detail,
            title=activity_title,
            description=f"Lead {message}",
            metadata={
                "owner_id": data.get("owner_id"),
                "assigned_to_id": data.get("assigned_to_id"),
                "status_id": data.get("status_id")
            }
        )





        return json_response(message, convert_to_jsonable(enriched_data))

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

        log_activity(
            activity_type="lead_deleted" if value else "lead_restored",
            entity_type="lead",
            entity_id=id,
            user_detail=user_detail,
            title=f"Lead {'deleted' if value else 'restored'}",
            description=f"Lead {id} was {'deleted' if value else 'restored'}",
            metadata={}
        )

        return json_response(message)
    except Exception as e:
        return get_error_response(e)

@leads.get("/crm/leads/{id}/favorite/{value}")
async def toggle_lead_favorite(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        if value == 1:
            favorite_collection.insert_one(
                {
                    "id": get_next_id(favorite_collection),
                    "tenant_id": user_detail["tenant_id"],
                    "favorite_type": "lead",
                    "favorite_id": id,
                    "user_id": int(user_detail["id"]),
                }
            )
            message = "lead marked as favorite" if value else "lead unmarked as favorite"
        else:
            favorite_collection.delete_one(
                {
                    "id": id,
                    "tenant_id": user_detail["tenant_id"],
                    "favorite_type": "lead",
                    "favorite_id": id,
                    "user_id": int(user_detail["id"]),
                }
            )
            message = "lead unmarked as favorite"
        
        log_activity(
            activity_type="lead_marked_as_favorite" if value else "lead_unmarked_as_favorite",
            entity_type="lead",
            entity_id=id,
            user_detail=user_detail,
            title=f"lead {'marked as favorite' if value else 'unmarked as favorite'}",
            description=f"lead {'marked as favorite' if value else 'unmarked as favorite'}",
            metadata={}
        )
        
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": None
        }
    except Exception as e:
        return get_error_details(e)




@leads.post("/crm/leads/get-grouped-by-status")
async def get_leads_grouped_by_status(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    """
    Fetch all lead statuses from `leads_statuses` and 
    group all leads according to those statuses.
    Each lead includes related data (account, owner, source, etc.)
    Uses in-memory lookup maps for 10× better performance.
    """
    try:
        try:
            payload = await request.json()
        except Exception:
            form = await request.form()
            payload = dict(form)

        include_enrichment = str(payload.get("include_enrichment", "true")).lower() == "true"
        tenant_id = user_detail["tenant_id"]

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
        source_id = str(payload.get("source_id", "")).strip()
        role_id = str(payload.get("role_id", "")).strip()
        country_id = str(payload.get("country_id", "")).strip()
        state_id = str(payload.get("state_id", "")).strip()
        postal_code = str(payload.get("postal_code", "")).strip()
        created_on = str(payload.get("created_on", "")).strip()

        base_query = build_leads_filter_query(
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
            source_id=source_id,
            role_id=role_id,
            country_id=country_id,
            state_id=state_id,
            postal_code=postal_code,
            created_on=created_on,
        )

        statuses_cursor = db.leads_statuses.find(
            {"deleted": {"$ne": 1}},
            NO_ID_PROJECTION
        ).sort("id", 1)

        statuses = [status_doc for status_doc in statuses_cursor if status_doc.get("id") is not None]
        if not statuses:
            statuses = [
                {"id": 1, "title": "New Lead"},
                {"id": 2, "title": "Contacted"},
                {"id": 3, "title": "Qualified"},
                {"id": 4, "title": "In Progress"},
                {"id": 5, "title": "Negotiation"},
                {"id": 6, "title": "Closed - Won"},
                {"id": 7, "title": "Closed - Lost"},
            ]

        status_map = {str(status_doc["id"]): status_doc for status_doc in statuses}

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
                for operator in ("$in", "$eq"):
                    if operator in condition:
                        values.update(_extract_status_values(condition[operator]))
            return values

        # status_filter_values = _extract_status_values(base_query.get("status_id"))

        # if status_filter_values:
        #     filtered_statuses = [
        #         status_doc for status_doc in statuses
        #         if status_doc.get("id") in status_filter_values
        #     ]
        #     if not filtered_statuses:
        #         filtered_statuses = statuses
        # else:
        
        filtered_statuses = statuses

        pipeline = [
            {"$match": base_query},
            {"$group": {
                "_id": "$status_id",
                "total_leads": {"$sum": 1},
                "lead_ids": {"$addToSet": "$id"}
            }},
            {"$sort": {"_id": 1}},
        ]
        groups = list(leads_collection.aggregate(pipeline))

        leads_by_status = {
            str(group.get("_id") if group.get("_id") is not None else "unknown"): {
                "total_leads": group.get("total_leads", 0),
                "lead_ids": group.get("lead_ids", []),
            }
            for group in groups
        }

        all_lead_ids = [
            lead_id
            for group in leads_by_status.values()
            for lead_id in group.get("lead_ids", [])
        ]

        enriched_map: Dict[int, Dict[str, Any]] = {}
        if include_enrichment and all_lead_ids:
            enrichment_query = dict(base_query)
            enrichment_query.pop("id", None)
            enrichment_query["id"] = {"$in": all_lead_ids}

            enriched_docs = list(leads_collection.find(enrichment_query, NO_ID_PROJECTION))
            for lead_doc in enriched_docs:
                lead_id_value = lead_doc.get("id")
                if lead_id_value is None:
                    continue
                enriched_lead = enrich_lead_data(
                    dict(lead_doc),
                    user_detail,
                    int(user_detail.get("tenant_id", 0)),
                )
                enriched_map[lead_id_value] = enriched_lead

        grouped_data = []
        total_leads_count = 0
        processed_status_ids: Set[str] = set()

        for status_doc in filtered_statuses:
            status_id_value = status_doc.get("id")
            if status_id_value is None:
                    continue
            status_id_str = str(status_id_value)
            group_info = leads_by_status.get(status_id_str, {"total_leads": 0, "lead_ids": []})
            group_result: Dict[str, Any] = {
                "id": status_id_value,
                "title": status_doc.get("title", ""),
                "total_leads": group_info.get("total_leads", 0),
            }

            if include_enrichment:
                group_result["leads"] = [
                    enriched_map[lead_id]
                    for lead_id in group_info.get("lead_ids", [])
                    if lead_id in enriched_map
                ]
            else:
                group_result["lead_ids"] = group_info.get("lead_ids", [])

            grouped_data.append(group_result)
            total_leads_count += group_info.get("total_leads", 0)
            processed_status_ids.add(status_id_str)

        for status_id_str, group_info in leads_by_status.items():
            if status_id_str in processed_status_ids:
                continue

            total_for_status = group_info.get("total_leads", 0)
            if total_for_status == 0:
                continue

            status_entry = status_map.get(status_id_str)
            status_id_int = int(status_id_str) if status_id_str.isdigit() else None
            if status_entry is None and status_id_int is not None:
                status_entry = db.leads_statuses.find_one(
                    {"id": status_id_int, "deleted": {"$ne": 1}},
                    NO_ID_PROJECTION
                )

            group_title = (status_entry or {}).get("title", f"Unknown Status ({status_id_str})")
            group_id = (status_entry or {}).get("id", status_id_int if status_id_int is not None else status_id_str)

            fallback_result: Dict[str, Any] = {
                "id": group_id,
                "title": group_title,
                "total_leads": total_for_status,
            }

            if include_enrichment:
                fallback_result["leads"] = [
                    enriched_map[lead_id]
                    for lead_id in group_info.get("lead_ids", [])
                    if lead_id in enriched_map
                ]
            else:
                fallback_result["lead_ids"] = group_info.get("lead_ids", [])

            grouped_data.append(fallback_result)
            total_leads_count += total_for_status

        return {
            "status": status.HTTP_200_OK,
            "message": "Leads grouped by status retrieved successfully",
            "data": convert_to_jsonable(grouped_data),
            "summary": {
                "total_leads": total_leads_count,
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
                "created_on": created_on,
                "last_activity": last_activity,
                "owner_id": owner_id,
                "account_id": account_id,
                "status_id": status_id,
                "source_id": source_id,
                "role_id": role_id,
                "country_id": country_id,
                "state_id": state_id,
                "postal_code": postal_code,
            },
            "query": convert_to_jsonable(base_query),
        }

    except Exception as e:
        import traceback
        print("Error in get_leads_grouped_by_status:", traceback.format_exc())
        return json_response(f"Error: {str(e)}", None, status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        
        form = await request.form()
        id = int(form.get("id"))
        status_value = int(form.get("status_id"))        
        

        if id <= 0 or status_value < 0:
            return json_response("Valid id and status_id are required", None, status.HTTP_400_BAD_REQUEST)
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



        leads_collection.update_one(
            {"id": id, "tenant_id": user_detail["tenant_id"]},
            {"$set": {"status_id": status_value}}
        )

        return json_response("Lead status updated successfully", {"id": id, "status_id": status_value})
    except Exception as e:
        return get_error_response(e)

@leads.get("/crm/leads/details/get/{id}")
async def get_lead_details_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    return get_entity_details("lead", id, user_detail)

# ============================
# CRUD for Leads - ending
# ============================