import json

from fastapi import APIRouter, Request, status, Depends, UploadFile, File
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from app.networks.database import db
from app.utils import oauth2, config
from typing import Dict, Any, Optional, Set
from app.helpers.general_helper import (
    get_next_id,
    upsert_document,
    json_response,
    get_error_response,
    convert_to_jsonable,
    get_error_details,
    get_last_activity_date
)
from app.helpers.uploadimage import UploadImage
from app.models.crm.accounts import AccountCreate, AccountUpdate, AccountInDB, AccountUpdateStatus, AccountUpdateOwner
from app.helpers.globalfunctions import build_crm_query, QUERY_TYPE_ALL, QUERY_TYPE_OWNED, QUERY_TYPE_TODAY
from app.helpers.crm_helper import get_entity_details, log_activity

# Router
accounts = APIRouter(tags=["CRM Admin - Accounts"])

# MongoDB Collection
accounts_collection = db.accounts

# Projection to exclude MongoDB _id
NO_ID_PROJECTION = {"_id": 0}

"""
def get_last_activity_date(account: dict, user_detail: dict) -> str:

    try:
        account_id = account.get("id")
        tenant_id = user_detail.get("tenant_id")
        
        if not account_id:
            return ""
        
        # Get activity logs collection
        activity_logs_collection = db.activity_logs
        
        # Query for the last activity log for this account
        last_activity = activity_logs_collection.find_one(
            {
                "entity_type": "account",
                "entity_id": int(account_id),
                "tenant_id": int(tenant_id),
                "deleted": {"$ne": 1}
            },
            NO_ID_PROJECTION,
            sort=[("timestamp", -1)]  # Sort by timestamp descending to get latest
        )
        
        # Also check for activities related to this account's contacts, deals, etc.
        # Check notes related to this account
        last_note = db.notes.find_one(
            {
                "related_to": "accounts",
                "related_to_id": int(account_id),
                "tenant_id": int(tenant_id),
                "deleted": {"$ne": 1}
            },
            NO_ID_PROJECTION,
            sort=[("createdon", -1)]
        )
        
        # Check calls related to this account
        last_call = db.calls.find_one(
            {
                "call_for": "accounts",
                "call_for_id": int(account_id),
                "tenant_id": int(tenant_id),
                "deleted": {"$ne": 1}
            },
            NO_ID_PROJECTION,
            sort=[("start_time", -1)]
        )
        
        # Check meetings related to this account
        last_meeting = db.meetings.find_one(
            {
                "related_to": "accounts",
                "related_to_id": int(account_id),
                "tenant_id": int(tenant_id),
                "deleted": {"$ne": 1}
            },
            NO_ID_PROJECTION,
            sort=[("start_time", -1)]
        )
        
        # Check tasks related to this account
        last_task = db.tasks.find_one(
            {
                "related_to": "accounts",
                "related_to_id": int(account_id),
                "tenant_id": int(tenant_id),
                "deleted": {"$ne": 1}
            },
            NO_ID_PROJECTION,
            sort=[("createdon", -1)]
        )
        
        # Collect all activity dates
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
        
        # Get the most recent activity date
        if activity_dates:
            # Convert all dates to datetime objects and find the latest
            latest_date = None
            for date_str in activity_dates:
                try:
                    dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                    if latest_date is None or dt > latest_date:
                        latest_date = dt
                except Exception:
                    continue
            
            if latest_date:
                return latest_date.strftime("%Y-%m-%d")  # Return date in YYYY-MM-DD format
        
        return ""
    except Exception as e:
        print(f"Error getting last activity for account {account.get('id')}: {e}")
        return ""

def get_last_activity_date(account: dict, user_detail: dict) -> str:

    try:
        latest_log = (
            db.activity_logs
            .find({"entity_type": "account", "entity_id":account.get("id")}, {"_id": 0, "createdon": 1})
            .sort("id", -1)
            .limit(1)
        )
        result = list(latest_log)
        createdon = result[0]["createdon"] or result[0]["timestamp"] if result else None
        return createdon
    except Exception as e:
        print(f"Error getting last activity for account {account.get('id')}: {e}")
        return ""        
"""

# ===============================
# Helper Functions
# ===============================

def generate_line_chart_data(accounts_collection, base_query, end_date, metric_type="total"):
    """
    Generate line chart data based on actual historical data for the last 7 days
    
    Args:
        accounts_collection: MongoDB collection
        base_query: Base query dict
        end_date: datetime object for the end of the date range
        metric_type: Type of metric to generate (total, active, new_accounts)
    """
    data = []
    
    for i in range(7):
        # Calculate date for this day
        current_date = end_date - timedelta(days=6-i)
        start_of_day = current_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = current_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Build query for this specific day
        day_query = {k: v for k, v in base_query.items() if k != "createdon"}
        
        # Count based on metric type
        if metric_type == "total":
            count = accounts_collection.count_documents(day_query)
        elif metric_type == "active":
            count = accounts_collection.count_documents({**day_query, "active": 1})
        elif metric_type == "new_accounts":
            day_query["createdon"] = {
                "$gte": start_of_day.isoformat(),
                "$lte": end_of_day.isoformat()
            }
            count = accounts_collection.count_documents(day_query)
        else:
            count = accounts_collection.count_documents(day_query)
        
        data.append({"value": count})
    
    return data


def build_filter_query(user_detail: dict, view: str = "all_accounts", name: str = "",
                                email: str = "", phone: str = "", fax: str = "", website: str = "",
                                industry_id: str = "", type_id: str = "", annual_revenue: str = "",
                                employees: str = "", owner_id: str = "", status_id: str = "",
                                last_activity: str = "", created_date: str = "", mobile: str = "") -> dict:
    """
    Build MongoDB query for filtering accounts based on various criteria.
    
    Args:
        user_detail: User details containing tenant_id and id
        view: View type for filtering
        name: Name filter (case-insensitive regex)
        email: Email filter
        phone: Phone filter
        fax: Fax filter
        website: Website filter
        industry_id: Industry ID filter
        type_id: Type ID filter
        annual_revenue: Annual revenue filter
        employees: Employees count filter
        owner_id: Owner ID filter
        status_id: Status ID filter
        last_activity: Last activity date filter
        created_date: Create date filter
        
    Returns:
        MongoDB query dictionary
    """
    # Build base query
    query = {
        "tenant_id": user_detail["tenant_id"],
        "deleted": {"$ne": 1}
    }
    
    # Store last_activity duration for later processing (after view filters)
    last_activity_duration = None
    if last_activity in ["last_24_hours", "last_7_days", "last_30_days"]:
        last_activity_duration = last_activity
    
    # Apply view-based filtering
    if view == "my_accounts":
        query["owner_id"] = int(user_detail["id"])
        
    elif view == "favorite_accounts":
        query["favorite"] = 1

    elif view == "active_account":
        query["active"] = 1
    elif view == "inactive_account":
        query["active"] = 0
    elif view == "recently_added":
        # Accounts created in the last 24 hours (using createdon as the source timestamp)
        twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
        query["createdon"] = {"$gte": twenty_four_hours_ago.isoformat()}
    elif view == "no_recent_activity":
        # Accounts with **no** activity in the last 24 hours
        twenty_four_hours_ago = (datetime.utcnow() - timedelta(hours=24)).isoformat()
        tenant_id = user_detail.get("tenant_id")

        activity_accounts = db.activity_logs.find(
            {
                "entity_type": "account",
                "tenant_id": tenant_id,
                "deleted": {"$ne": 1},
                "createdon": {"$gte": twenty_four_hours_ago},
            },
            {"entity_id": 1},
        )

        account_ids = []
        for activity in activity_accounts:
            if activity.get("entity_id"):
                account_ids.append(activity["entity_id"])

        # Exclude accounts with activity in the last 24 hours;
        # if none have recent activity, leave query as-is (all are "no recent activity")
        if account_ids:
            query["id"] = {"$nin": account_ids}
    
    elif view == "no_phone_provided":
        query["$or"] = [
            {"phone": {"$exists": False}},
            {"phone": ""}
        ]
        
    elif view == "email_only_leads":
        query["email"] = {"$ne": ""}
        query["$or"] = [
            {"phone": {"$exists": False}},
            {"phone": ""}
        ]
        
    elif view == "website_added":
        query["website"] = {"$ne": ""}
  
    # Apply search filters
    if name:
        query["$or"] = [
            {"title": {"$regex": name, "$options": "i"}},
            {"name": {"$regex": name, "$options": "i"}}
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
    
    if industry_id:
        try:
            query["industry_id"] = int(industry_id)
        except ValueError:
            pass
    
    if type_id:
        try:
            query["type_id"] = int(type_id)
        except ValueError:
            pass
    
    if annual_revenue:
        query["annual_revenue"] = {"$regex": annual_revenue, "$options": "i"}
        
    if employees:
        query["employees"] = {"$regex": employees, "$options": "i"}
            
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
            
            # Query activity_logs to get account IDs with activity in the specified time range
            activity_logs = list(db.activity_logs.find({
                "entity_type": "account",
                "tenant_id": tenant_id,
                "deleted": {"$ne": 1},
                "createdon": {"$gte": start_time_iso}
            }, {"entity_id": 1}))
            
            # Collect unique account IDs from activity_logs
            account_ids = set()
            for activity in activity_logs:
                if activity.get("entity_id"):
                    account_ids.add(activity["entity_id"])
            
            # Merge with existing query["id"] if it exists (AND logic)
            if "id" in query and "$in" in query["id"]:
                existing_ids = set(query["id"]["$in"])
                account_ids = account_ids.intersection(existing_ids)
            elif "id" in query and "$nin" in query["id"]:
                # If we have a $nin filter, we need to subtract these IDs
                excluded_ids = set(query["id"]["$nin"])
                account_ids = account_ids - excluded_ids
            
            # Filter accounts by IDs with activity in the specified time range
            if account_ids:
                query["id"] = {"$in": list(account_ids)}
            else:
                # No activity found in the time range, return empty result
                query["id"] = {"$in": []}
                
        except Exception as e:
            # If parsing fails, ignore the last_activity filter
            print(f"Error parsing last_activity: {e}")
    
    if created_date:
        raw_value = str(created_date).strip()
        # Extract only the date part (first 10 characters: YYYY-MM-DD)
        try:
            dt = datetime.fromisoformat(raw_value.replace("Z", "+00:00"))
            if dt.tzinfo is not None:
                dt = dt.astimezone(timezone.utc)
            else:
                dt = dt.replace(tzinfo=timezone.utc)
            target_date_str = dt.strftime("%Y-%m-%d")
        except Exception:
            target_date_str = created_date[:10]

        if target_date_str:
            # createdon is stored as an ISO datetime string in the DB; convert it to a Date for comparison
            created_date_filter = {
                "$expr": {
                    "$eq": [
                        {
                            "$dateToString": {
                                "format": "%Y-%m-%d",
                                "date": {
                                    "$convert": {
                                        "input": "$createdon",
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
            }

            if "$and" in query:
                query["$and"].append(created_date_filter)
            else:
                query["$and"] = [created_date_filter]
    
    return query


def enrich_data(account: dict, user_detail: dict) -> dict:
    """
    Enrich account data with related user information and last activity date.
    
    Args:
        account: Account document from database
        user_detail: User details containing tenant_id
        
    Returns:
        Enriched account document
    """
    # Get owner_details (user information for owner)
    owner = db.users.find_one(
        {"id": account.get("owner_id")},
        NO_ID_PROJECTION
    )
    account["owner_details"] = owner or {}
    account["owner"] = owner or {}  # Keep for backward compatibility
    
    # Get user information for user_id
    user = db.users.find_one(
        {"id": account.get("user_id")},
        NO_ID_PROJECTION
    )
    account["user_details"] = user or {}
    account["last_activity_date"] = get_last_activity_date('account', account.get("id"))
        
    return account


# ===============================
# CRUD for ACCOUNTS - starting
# ===============================

@accounts.post("/crm/accounts/get-account-summary-chart-data")
async def get_account_summary_chart_data(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Returns weekly accounts summary data for the dashboard chart
    showing All Accounts, Deal-Won, and Deal-Lost.
    
    
    
    
    const SummaryChartData = {
    // 🧠 Dummy data for demonstration
    chartData: [
        { day: "Mon", allAccounts: 150, dealWon: 150, dealLost: 300 },
        { day: "Tue", allAccounts: 300, dealWon: 20, dealLost: 320 },
        { day: "Wed", allAccounts: 40, dealWon: 300, dealLost: 340 },
        { day: "Thr", allAccounts: 300, dealWon: 60, dealLost: 360 },
        { day: "Fri", allAccounts: 500, dealWon: 500, dealLost: 1000 },
        { day: "Sat", allAccounts: 220, dealWon: 200, dealLost: 420 },
        { day: "Sun", allAccounts: 100, dealWon: 80, dealLost: 20 },
    ],

    chartConfig: {
        title: "Acounts Summary - Weekly",
        titleRight: `
                <span class="inline-flex items-center gap-1 mr-3">
                    <span class="inline-block w-[10px] h-[10px] bg-[#6586E6] rounded-xs"></span>
                    all Accounts
                </span>
                <span class="inline-flex items-center gap-1 mr-3">
                    <span class="inline-block w-[10px] h-[10px] bg-[#8DD3A0] rounded-xs"></span>
                    Deal-Won
                </span>
                <span class="inline-flex items-center gap-1">
                    <span class="inline-block w-[10px] h-[10px] bg-[#ED7F7A] rounded-xs"></span>
                    Deal-Lost
                </span>`,
        description: "",
        series: [
        {
            key: "allAccounts",
            label: "All Accounts",
            color: "#5f84ffff",
        },        
        { key: "dealWon", label: "Deal-Won", color: "#65e66bff" },
        { key: "dealLost", label: "Deal-Lost", color: "#ED7F7A" },
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

        # Always use the previous seven days (current day inclusive)
        now_dt = datetime.utcnow().replace(tzinfo=None)
        days_back = 7
        range_end = (now_dt + timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        range_start = (range_end - timedelta(days=days_back)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        # Get won/lost status IDs (configured to match status_id in deals collection)
        _stages = list(db.deals_stages.find({"tenant_id": tenant_id, "deleted": {"$ne": 1}}, NO_ID_PROJECTION))
        won_stage_ids = [5]
        lost_stage_ids = [6]
        
        agg_pipeline = [
            {"$match": base_query},
            {
                "$addFields": {
                    "created_dt": {
                        "$ifNull": [
                            {"$convert": {"input": "$createdon", "to": "date", "onError": None, "onNull": None}},
                            {"$convert": {"input": "$createdon", "to": "date", "onError": None, "onNull": None}}
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
                    "allAccounts": {"$sum": 1},
                }
            },
            {"$sort": {"_id": 1}},
        ]
        agg_by_day = {doc["_id"]: doc for doc in accounts_collection.aggregate(agg_pipeline)}

        # Now get deals for the accounts and aggregate by day
        deals_collection = db.deals
        deals_agg_pipeline = [
            {"$match": {"tenant_id": tenant_id, "deleted": {"$ne": 1}}},
            {
                "$addFields": {
                    "deal_created_dt": {
                        "$ifNull": [
                            {"$convert": {"input": "$createdon", "to": "date", "onError": None, "onNull": None}},
                            None,
                        ]
                    },
                    "status_id_num": {
                        "$switch": {
                            "branches": [
                                {
                                    "case": {"$eq": [{"$type": "$status_id"}, "int"]},
                                    "then": "$status_id",
                                },
                                {
                                    "case": {"$eq": [{"$type": "$status_id"}, "string"]},
                                    "then": {
                                        "$convert": {
                                            "input": "$status_id",
                                            "to": "int",
                                            "onError": None,
                                            "onNull": None,
                                        }
                                    },
                                },
                            ],
                            "default": None,
                        }
                    },
                }
            },
            {
                "$match": {
                    "deal_created_dt": {
                        "$gte": range_start,
                        "$lt": range_end,
                    }
                }
            },
            {
                "$group": {
                    "_id": {
                        "$dateToString": {"format": "%Y-%m-%d", "date": "$deal_created_dt"}
                    },
                    "dealWon": {
                        "$sum": {"$cond": [{"$in": ["$status_id_num", won_stage_ids]}, 1, 0]}
                    },
                    "dealLost": {
                        "$sum": {"$cond": [{"$in": ["$status_id_num", lost_stage_ids]}, 1, 0]}
                    },
                }
            },
            {"$sort": {"_id": 1}},
        ]
        deals_agg_by_day = {doc["_id"]: doc for doc in deals_collection.aggregate(deals_agg_pipeline)}

        from calendar import day_abbr
        chart_data = []

        for i in range(days_back):
            day_start = (range_start + timedelta(days=i)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            day_key = day_start.strftime("%Y-%m-%d")
            day_doc = agg_by_day.get(day_key, {"allAccounts": 0})
            deals_doc = deals_agg_by_day.get(day_key, {"dealWon": 0, "dealLost": 0})

            chart_data.append(
                {
                    "day": day_abbr[day_start.weekday()],  # Mon, Tue, ...
                    "allAccounts": int(day_doc.get("allAccounts", 0)),
                    "dealWon": int(deals_doc.get("dealWon", 0)),
                    "dealLost": int(deals_doc.get("dealLost", 0)),
                }
            )

        # --- Chart Config ---
        # Dynamic y-axis max based on data
        try:
            max_point = 0
            for d in chart_data:
                max_point = max(max_point, int(d.get("allAccounts", 0)), int(d.get("dealWon", 0)), int(d.get("dealLost", 0)))
            y_max = max_point if max_point > 0 else 10
        except Exception:
            y_max = 10
        chart_config = {
            "title": "Accounts Summary - Weekly",
            "titleRight": """
                <span class="inline-flex items-center gap-1 mr-3">
                  <span class="inline-block w-[10px] h-[10px] bg-[#6586E6] rounded-xs"></span>
                  All Accounts
                </span>
                <span class="inline-flex items-center gap-1 mr-3">
                  <span class="inline-block w-[10px] h-[10px] bg-[#8DD3A0] rounded-xs"></span>
                  Deal-Won
                </span>
                <span class="inline-flex items-center gap-1">
                  <span class="inline-block w-[10px] h-[10px] bg-[#ED7F7A] rounded-xs"></span>
                  Deal-Lost
                </span>
            """,
            "description": "",
            "series": [
                {"key": "allAccounts", "label": "All Accounts", "color": "#6586E6"},
                {
                    "key": "dealWon",
                    "label": "Deal-Won",
                    "color": "#8DD3A0",
                },
                {"key": "dealLost", "label": "Deal-Lost", "color": "#ED7F7A"},
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
            "message": "Account summary data retrieved successfully",
            "data": {
                "chartData": chart_data,
                "chartConfig": chart_config,
                "tenant_id": tenant_id,
            },
        }
    except Exception as e:
        return get_error_response(e)

@accounts.post("/crm/accounts/get-statistics")
async def get_statistics(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get account statistics for the dashboard.
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
        def _parse_iso_naive_utc(value: str) -> datetime:
            try:
                dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
                if dt.tzinfo is not None:
                    dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
                return dt
            except Exception:
                return None

        from_date = _parse_iso_naive_utc(from_date_str) if from_date_str else datetime.utcnow()
        to_date = _parse_iso_naive_utc(to_date_str) if to_date_str else datetime.utcnow()

        # Normalize dates: from_date to start of day, to_date to end of day
        # This ensures that selecting the same date returns data for the entire day
        from_date = from_date.replace(hour=0, minute=0, second=0, microsecond=0)
        to_date = to_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # 1) Fetch account ids from activity_logs within date range
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
            "entity_type": "account",
            **al_date_filter,
        }
        activity_logs = list(db.activity_logs.find(al_query, {"_id": 0, "entity_id": 1}))
        account_ids = [int(a.get("entity_id")) for a in activity_logs if a.get("entity_id") is not None]

        # Build base query
        if account_ids:
            base_query = {
                "tenant_id": tenant_id,
                "deleted": {"$ne": 1},
                "id": {"$in": account_ids}
            }
        else:
            # No accounts with activity in date range, use empty base query
            base_query = {
                "tenant_id": tenant_id,
                "deleted": {"$ne": 1},
                "id": {"$in": []}
            }
        
        # Get total accounts
        total_accounts = accounts_collection.count_documents(base_query)
        
        # Get active accounts
        active_accounts = accounts_collection.count_documents({**base_query, "active": 1})
        
        # Get newly onboarded accounts (last 30 days)
        thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
        newly_onboarded = accounts_collection.count_documents({
            **base_query,
            "createdon": {"$gte": thirty_days_ago}
        })
        
        # Get accounts with open deals
        # This would require joining with deals collection
        accounts_with_deals = accounts_collection.count_documents({
            **base_query,
            "active": 1
        })
        
        # Get accounts by industry breakdown
        industry_breakdown = list(accounts_collection.aggregate([
            {"$match": base_query},
            {"$group": {"_id": "$industry_id", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 4}
        ]))
        
        # Fetch industry details from industries collection
        industry_ids_from_breakdown = [i.get("_id") for i in industry_breakdown if i.get("_id") is not None]
        industries_list = list(db.industries.find(
            {"id": {"$in": industry_ids_from_breakdown}, "deleted": {"$ne": 1}},
            NO_ID_PROJECTION
        )) if industry_ids_from_breakdown else []
        
        # Get top industries with their counts
        industry_map = {i.get("_id"): i.get("count", 0) for i in industry_breakdown}
        industry_details = []
        for industry in industries_list:
            industry_id = industry.get("id")
            if industry_id and industry_id in industry_map:
                industry_details.append({
                    "id": industry_id,
                    "title": industry.get("title", "Unknown"),
                    "count": industry_map[industry_id]
                })
        
        # Sort by count descending and limit to 4
        industry_details = sorted(industry_details, key=lambda x: x["count"], reverse=True)[:4]
        
        # Build dynamic industry description from actual data
        industry_description_parts = []
        for ind in industry_details[:4]:  # Only show top 4
            title = ind.get("title", "Unknown")
            count = ind.get("count", 0)
            industry_description_parts.append(f"{title}: {count}")
        
        # If no industries found, show default message
        if not industry_description_parts:
            industry_description_parts.append("No industries data available")
        
        # For backwards compatibility, keep individual counts (legacy names)
        # These are now just the top 4 industries by count
        real_estate_count = industry_details[0].get("count", 0) if len(industry_details) > 0 else 0
        construction_count = industry_details[1].get("count", 0) if len(industry_details) > 1 else 0
        hospitality_count = industry_details[2].get("count", 0) if len(industry_details) > 2 else 0
        retail_count = industry_details[3].get("count", 0) if len(industry_details) > 3 else 0
        
        # Dynamic industry description
        industry_description = " | ".join(industry_description_parts)
        
        # Calculate revenue from deals
        def parse_amount(amount_str):
            """Parse amount string to float, handling various formats"""
            try:
                if not amount_str:
                    return 0.0
                # Remove common currency symbols and whitespace
                cleaned = str(amount_str).replace('AED', '').replace('$', '').replace(',', '').replace(' ', '')
                return float(cleaned)
            except:
                return 0.0
        
        def format_currency(amount):
            """Format amount as currency string"""
            if amount >= 1000000:
                return f"AED {(amount / 1000000):.2f}M"
            elif amount >= 1000:
                return f"AED {(amount / 1000):.2f}K"
            else:
                return f"AED {amount:.2f}"
        
        # Get deals for accounts in the date range
        deals_collection = db.deals
        deals_query = {
            "tenant_id": tenant_id,
            "deleted": {"$ne": 1},
            "account_id": {"$in": account_ids} if account_ids else {"$in": []}
        }
        
        # Get all deals and sum expected_revenue
        deals_list = list(deals_collection.find(deals_query, {"_id": 0, "expected_revenue": 1, "amount": 1}))
        total_revenue_amount = sum(parse_amount(d.get("expected_revenue", d.get("amount", ""))) for d in deals_list)
        total_revenue = format_currency(total_revenue_amount)
        
        # Calculate previous period revenue for percentage change
        prev_from_date = from_date - (to_date - from_date)
        prev_to_date = from_date
        prev_activity_logs = list(db.activity_logs.find({
            "tenant_id": tenant_id,
            "deleted": {"$ne": 1},
            "entity_type": "account",
            "$or": [
                {"createdon": {"$gte": prev_from_date.isoformat(), "$lte": prev_to_date.isoformat()}},
                {
                    "$expr": {
                        "$and": [
                            {"$gte": [{"$toDate": "$createdon"}, prev_from_date]},
                            {"$lte": [{"$toDate": "$createdon"}, prev_to_date]}
                        ]
                    }
                }
            ]
        }, {"_id": 0, "entity_id": 1}))
        prev_account_ids = [int(a.get("entity_id")) for a in prev_activity_logs if a.get("entity_id") is not None]
        
        prev_deals_query = {
            "tenant_id": tenant_id,
            "deleted": {"$ne": 1},
            "account_id": {"$in": prev_account_ids} if prev_account_ids else {"$in": []}
        }
        prev_deals_list = list(deals_collection.find(prev_deals_query, {"_id": 0, "expected_revenue": 1, "amount": 1}))
        prev_total_revenue_amount = sum(parse_amount(d.get("expected_revenue", d.get("amount", ""))) for d in prev_deals_list)
        
        def calculate_percentage_change(current, previous):
            if previous == 0:
                return "+0.0%" if current == 0 else "+100.0%"
            change = ((current - previous) / previous) * 100
            sign = "+" if change >= 0 else ""
            return f"{sign}{change:.1f}%"
        
        revenue_change = calculate_percentage_change(total_revenue_amount, prev_total_revenue_amount)
        
        # Get top accounts by revenue for description
        accounts_with_revenue = {}
        for deal in deals_list:
            account_id = deal.get("account_id")
            if account_id:
                amount = parse_amount(deal.get("expected_revenue", deal.get("amount", "")))
                if account_id not in accounts_with_revenue:
                    accounts_with_revenue[account_id] = 0
                accounts_with_revenue[account_id] += amount
        
        # Sort and get top 2 accounts
        top_accounts = sorted(accounts_with_revenue.items(), key=lambda x: x[1], reverse=True)[:2]
        top_accounts_info = []
        for account_id, revenue in top_accounts:
            account = accounts_collection.find_one({"id": account_id}, NO_ID_PROJECTION)
            if account:
                top_accounts_info.append(f"{account.get('title', 'Unknown')}: {format_currency(revenue)}")
        
        # Calculate account penetration
        accounts_with_deals_count = len(accounts_with_revenue)
        account_penetration = round((accounts_with_deals_count / total_accounts * 100), 0) if total_accounts > 0 else 0
        
        # Build revenue description
        if top_accounts_info:
            revenue_description = " | ".join(top_accounts_info) + f" | Account Penetration: {int(account_penetration)}%"
        else:
            revenue_description = "No deals data available | Account Penetration: 0%"
        
        # Calculate average POCs (contacts) per account
        # Query contacts associated with accounts in the date range
        contacts_query = {
            "tenant_id": tenant_id,
            "deleted": {"$ne": 1}
        }
        if account_ids:
            contacts_query["account_id"] = {"$in": account_ids}
        else:
            contacts_query["account_id"] = {"$in": []}
        
        total_contacts = db.contacts.count_documents(contacts_query)
        avg_pocs = round(total_contacts / total_accounts, 1) if total_accounts > 0 else 0
        
        # Get accounts with different POC counts
        poc_aggregation = list(db.contacts.aggregate([
            {"$match": contacts_query},
            {"$group": {"_id": "$account_id", "contact_count": {"$sum": 1}}}
        ]))
        
        accounts_with_1_poc = sum(1 for p in poc_aggregation if p.get("contact_count") == 1)
        accounts_with_2_3_pocs = sum(1 for p in poc_aggregation if 2 <= p.get("contact_count", 0) <= 3)
        
        # Calculate previous period statistics for percentage changes
        prev_active_accounts_query = {
            "tenant_id": tenant_id,
            "deleted": {"$ne": 1},
            "active": 1
        }
        if prev_account_ids:
            prev_active_accounts_query["id"] = {"$in": prev_account_ids}
        else:
            prev_active_accounts_query["id"] = {"$in": []}
        
        prev_active_accounts = accounts_collection.count_documents(prev_active_accounts_query)
        prev_total_accounts = accounts_collection.count_documents({
            "tenant_id": tenant_id,
            "deleted": {"$ne": 1},
            "id": {"$in": prev_account_ids} if prev_account_ids else {"$in": []}
        })
        
        prev_industry_breakdown = list(accounts_collection.aggregate([
            {"$match": {
                "tenant_id": tenant_id,
                "deleted": {"$ne": 1},
                "id": {"$in": prev_account_ids} if prev_account_ids else {"$in": []}
            }},
            {"$group": {"_id": "$industry_id", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 4}
        ]))
        prev_industry_total = sum(i.get("count", 0) for i in prev_industry_breakdown)
        
        prev_contacts_query = {
            "tenant_id": tenant_id,
            "deleted": {"$ne": 1}
        }
        if prev_account_ids:
            prev_contacts_query["account_id"] = {"$in": prev_account_ids}
        else:
            prev_contacts_query["account_id"] = {"$in": []}
        prev_total_contacts = db.contacts.count_documents(prev_contacts_query)
        prev_avg_pocs = round(prev_total_contacts / prev_total_accounts, 1) if prev_total_accounts > 0 else 0
        
        # Calculate percentage changes
        active_accounts_percent = calculate_percentage_change(active_accounts, prev_active_accounts)
        industry_percent = calculate_percentage_change(len(industry_breakdown), len(prev_industry_breakdown))
        avg_pocs_percent = calculate_percentage_change(avg_pocs, prev_avg_pocs)
        
        # Build dashboard view data
        dashboard_view = [
            {
                "icon": "/icons/db_up.svg",
                "iconClass": "",
                "title": "Revenue By Account",
                "total": total_revenue,
                "change": revenue_change,
                "description": revenue_description,
                "lineChartData": generate_line_chart_data(accounts_collection, base_query, to_date, "total")
            },
            {
                "icon": "/icons/user_check.svg",
                "iconClass": "",
                "title": "Active Accounts",
                "total": str(active_accounts),
                "change": active_accounts_percent,
                "description": f"Newly Onboarded: {newly_onboarded} | With Open Deals: {accounts_with_deals}",
                "lineChartData": generate_line_chart_data(accounts_collection, base_query, to_date, "active")
            },
            {
                "icon": "/icons/paper_calculator.svg",
                "iconClass": "",
                "title": "Accounts by Industry",
                "total": total_accounts,
                "change": industry_percent,
                "description": industry_description,
                "lineChartData": generate_line_chart_data(accounts_collection, base_query, to_date, "total")
            },
            {
                "icon": "/icons/papers.svg",
                "iconClass": "",
                "title": "Average POCs Per Account",
                "total": avg_pocs,
                "change": avg_pocs_percent,
                "description": f"Accounts with 1 POC: {accounts_with_1_poc} | Accounts with 2-3 POCs: {accounts_with_2_3_pocs}",
                "lineChartData": generate_line_chart_data(accounts_collection, base_query, to_date, "new_accounts")
            },
        ]
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Account statistics retrieved successfully",
            "data": dashboard_view,
            "date_range": {
                "from": from_date.isoformat(),
                "to": to_date.isoformat()
            },
            "tenant_id": tenant_id
        }
        
    except Exception as e:
        return get_error_details(e)


@accounts.post("/crm/accounts/save")
async def save_account(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    """
    Create or update an account (JSON or form data).
    """
    try:
        # Parse payload
        try:
            payload = await request.json()
            is_json = True
        except Exception:
            form = await request.form()
            payload = dict(form)
            is_json = False

        doc_id = int(payload.get("id") or 0)
        tenant_id = int(user_detail.get("tenant_id", 0))
        user_id = int(user_detail.get("id", 0))

        # Helpers
        def to_int(v, default=0):
            try:
                return int(v) if v not in (None, "", "null") else default
            except:
                return default

        def to_str(v, default=""):
            return str(v) if v not in (None, "null") else default

        # Generate ID if new
        next_id = doc_id or get_next_id(accounts_collection)

        # Define field map for dynamic assignment
        FIELD_MAP = {
            "uid": to_str,
            "title": to_str,
            "owner_id": to_int,
            "parent_id": to_int,
            "location": to_str,
            "account_number": to_str,
            "type_id": to_int,
            "industry_id": to_int,
            "status_id": to_int,
            "annual_revenue": to_str,
            "employees": to_str,
            "phone": to_str,
            "mobile": to_str,
            "email": to_str,
            "website": to_str,
            "fax": to_str,
            "rating": to_str,
            "description": to_str,
            "active": to_int,
            "sort_by": to_int,
            "create_date": to_str,
            "status_id": to_int,
        }

        # Build data dictionary dynamically
        data = {k: fn(payload.get(k)) for k, fn in FIELD_MAP.items()}
        data.update({
            "id": next_id,
            "tenant_id": tenant_id,
            "user_id": user_id,
        })

        # Create or update logic
        if doc_id == 0:
            # Check for duplicate accounts before inserting
            # Duplicate criteria: same email, phone, or title within same tenant
            duplicate_conditions = []
            
            if data.get("email"):
                duplicate_conditions.append({"email": data["email"]})
            
            if data.get("phone"):
                duplicate_conditions.append({"phone": data["phone"]})
            
            if data.get("title"):
                duplicate_conditions.append({"title": data["title"]})
            
            if duplicate_conditions:
                duplicate_query = {
                    "tenant_id": tenant_id,
                    "deleted": {"$ne": 1},
                    "$or": duplicate_conditions
                }
                
                existing_account = accounts_collection.find_one(duplicate_query, NO_ID_PROJECTION)
                
                if existing_account:
                    duplicate_fields = []
                    if data.get("email") and existing_account.get("email") == data["email"]:
                        duplicate_fields.append("email")
                    if data.get("phone") and existing_account.get("phone") == data["phone"]:
                        duplicate_fields.append("phone")
                    if data.get("title") and existing_account.get("title") == data["title"]:
                        duplicate_fields.append("title")
                    
                    return {
                        "status": status.HTTP_409_CONFLICT,
                        "message": f"Duplicate account found with matching {', '.join(duplicate_fields)}. Account ID: {existing_account.get('id')}",
                        "data": {
                            "duplicate_account_id": existing_account.get("id"),
                            "duplicate_fields": duplicate_fields
                        }
                    }
            
            # New record
            data["active"] = 1
            data["deleted["] =0
            data["add_by"] = 0
            data["edit_by"] = 0
            data["deleted_by"] = 0
            data["createdon"] = datetime.now(timezone.utc).isoformat()
            data["updatedon"] = datetime.now(timezone.utc).isoformat()
            
            data["uid"] = f"{tenant_id}000{next_id}"
            accounts_collection.insert_one(data)
            action = "created"
        else:
            # Update record
            data["active"] = 1
            data["deleted"] = 0
            data["add_by"] = 0
            data["edit_by"] = 0
            data["deleted_by"] = 0
            data["updatedon"] = datetime.now(timezone.utc).isoformat()

            accounts_collection.update_one(
                {"id": doc_id, "tenant_id": tenant_id},
                {"$set": data},
                upsert=False
            )
            action = "updated"

        # Activity log (non-blocking)
        log_activity(
            activity_type=f"account_{action}",
            entity_type="account",
            entity_id=int(data["id"]),
            user_detail=user_detail,
            title=f"Account {action}: {data.get('name') or data.get('title') or 'Unnamed'}",
            description=f"Account {action}: {data.get('name') or data.get('title') or 'Unnamed'}",
            metadata={
                "account_id": data["id"],
                "title": data.get("title"),
                "owner_id": data.get("owner_id"),
                "type_id": data.get("type_id"),
                "industry_id": data.get("industry_id"),
                "email": data.get("email"),
            }
        )

        enriched_data = enrich_data(data, user_detail)

        return {
            "status": status.HTTP_200_OK,
            "message": f"Account {action} successfully",
            "data": convert_to_jsonable(enriched_data),
        }

    except Exception as e:
        return get_error_details(e)



# @accounts.post("/crm/accounts/save")
# async def save_account(
#     request: Request,
#     user_detail: dict = Depends(oauth2.get_user_by_token)
# ):
#     try:
#         # Try to get JSON payload first, fallback to form data
#         try:
#             payload = await request.json()
#             is_json = True
#         except:
#             form = await request.form()
#             payload = dict(form)
#             is_json = False
        
#         doc_id = int(payload.get("id") or 0)
        
#         # Helper functions for type conversion
#         def to_int(value, default: int = 0) -> int:
#             try:
#                 if value is None or value == "":
#                     return default
#                 return int(value)
#             except (ValueError, TypeError):
#                 return default

#         def to_str(value, default: str = "") -> str:
#             try:
#                 return str(value) if value is not None else default
#             except Exception:
#                 return default
        
#         next_id = doc_id or get_next_id(accounts_collection)

#         # Handle logo file upload (only for form data)
#         logo_path = ""
#         logo_url = ""
        
#         if not is_json:
#             logo_file = payload.get("logo")
#             if logo_file and hasattr(logo_file, 'filename') and logo_file.filename:
#                 # Upload logo file
#                 logo_path = UploadImage.uploadImage_DO(logo_file, "accounts")
#                 logo_url = config.IMAGE_DO_URL + logo_path

#         if doc_id == 0:
#             # Create new account
#             account_data = AccountCreate()
#             account_data.id = next_id
#             account_data.ukey = str(user_detail['tenant_id']) + "000" + str(next_id)
#             account_data.owner_id = to_int(payload.get("owner_id"), 0)
#             account_data.title = to_str(payload.get("title"))
#             account_data.name = to_str(payload.get("name"))
#             account_data.parent_id = to_int(payload.get("parent_id"), 0)
#             account_data.site = to_str(payload.get("site"))
#             account_data.number = to_str(payload.get("number"))
#             account_data.type_id = to_int(payload.get("type_id"), 0)
#             account_data.industry_id = to_int(payload.get("industry_id"), 0)
#             account_data.annual_revenue = to_str(payload.get("annual_revenue"))
#             account_data.employees = to_str(payload.get("employees"))
#             account_data.phone = to_str(payload.get("phone"))
#             account_data.mobile = to_str(payload.get("mobile"))
#             account_data.email = to_str(payload.get("email"))
#             account_data.website = to_str(payload.get("website"))
#             account_data.fax = to_str(payload.get("fax"))
#             account_data.status_id = to_int(payload.get("status_id"), 0)
#             account_data.location = to_str(payload.get("location"))
#             account_data.uid = to_str(payload.get("uid"))
            
#             account_data.rating = to_str(payload.get("rating"))
#             account_data.ownership = to_str(payload.get("ownership"))
#             account_data.sic_code = to_str(payload.get("sic_code"))
#             account_data.billing_street = to_str(payload.get("billing_street"))
#             account_data.billing_country = to_str(payload.get("billing_country"))
#             account_data.billing_state = to_str(payload.get("billing_state"))
#             account_data.billing_city = to_str(payload.get("billing_city"))
#             account_data.billing_code = to_str(payload.get("billing_code"))
#             account_data.shipping_street = to_str(payload.get("shipping_street"))
#             account_data.shipping_country = to_str(payload.get("shipping_country"))
#             account_data.shipping_state = to_str(payload.get("shipping_state"))
#             account_data.shipping_city = to_str(payload.get("shipping_city"))
#             account_data.shipping_code = to_str(payload.get("shipping_code"))
#             account_data.description = to_str(payload.get("description"))
#             account_data.logo = logo_path if logo_path else to_str(payload.get("logo"))
#             account_data.logo_url = logo_url
#             account_data.tenant_id = to_int(user_detail["tenant_id"], 0)
#             account_data.user_id = to_int(user_detail["id"], 0)
#             account_data.active = to_int(payload.get("active"), 1)
#             account_data.sort_by = to_int(payload.get("sort_by"), 0)
            
#             accounts_collection.insert_one(account_data.dict())
            
#             # Log activity for account creation
#             try:
#                 activity_logs_collection = db.activity_logs
#                 activity_logs_collection.insert_one({
#                     "id": get_next_id(activity_logs_collection),
#                     "activity_type": "account_created",
#                     "entity_type": "account",
#                     "entity_id": int(account_data.id),
#                     "tenant_id": int(user_detail.get("tenant_id", 0)),
#                     "user_id": int(user_detail.get("id", 0)),
#                     "title": f"New account created: {account_data.name or account_data.title or 'Unnamed Account'}",
#                     "description": f"Account created: {account_data.name or account_data.title or 'Unnamed Account'} - Type: {account_data.type or 'N/A'}",
#                     "createdon": datetime.now(timezone.utc).isoformat(),
#                     "metadata": {
#                         "account_name": account_data.name or account_data.title,
#                         "account_id": account_data.id,
#                         "owner_id": account_data.owner_id,
#                         "type_id": account_data.type_id,
#                         "industry_id": account_data.industry_id,
#                         "email": account_data.email
#                     },
#                     "deleted": 0,
#                     "active": 1
#                 })
#             except Exception:
#                 pass  # Don't fail the save if logging fails
            
#             return {
#                 "status": status.HTTP_200_OK,
#                 "message": "Account created successfully",
#                 "data": convert_to_jsonable(account_data.dict())
#             }
#         else:
#             # Update existing account
#             account_data = AccountUpdate()
#             account_data.id = doc_id
#             account_data.owner_id = to_int(payload.get("owner_id"), 0)
#             account_data.title = to_str(payload.get("title"))
#             account_data.name = to_str(payload.get("name"))
#             account_data.parent_id = to_int(payload.get("parent_id"), 0)
#             account_data.site = to_str(payload.get("site"))
#             account_data.number = to_str(payload.get("number"))
#             account_data.type_id = to_int(payload.get("type_id"), 0)
#             account_data.industry_id = to_int(payload.get("industry_id"), 0)
#             account_data.annual_revenue = to_str(payload.get("annual_revenue"))
#             account_data.employees = to_str(payload.get("employees"))
#             account_data.phone = to_str(payload.get("phone"))
#             account_data.mobile = to_str(payload.get("mobile"))
#             account_data.email = to_str(payload.get("email"))
#             account_data.website = to_str(payload.get("website"))
#             account_data.fax = to_str(payload.get("fax"))
#             account_data.status_id = to_int(payload.get("status_id"), 0)
#             account_data.location = to_str(payload.get("location"))
#             account_data.uid = to_str(payload.get("uid"))
#             account_data.type = to_str(payload.get("type"))
#             account_data.industry = to_int(payload.get("industry"), 0)
#             account_data.rating = to_str(payload.get("rating"))
#             account_data.ownership = to_str(payload.get("ownership"))
#             account_data.sic_code = to_str(payload.get("sic_code"))
#             account_data.billing_street = to_str(payload.get("billing_street"))
#             account_data.billing_country = to_str(payload.get("billing_country"))
#             account_data.billing_state = to_str(payload.get("billing_state"))
#             account_data.billing_city = to_str(payload.get("billing_city"))
#             account_data.billing_code = to_str(payload.get("billing_code"))
#             account_data.shipping_street = to_str(payload.get("shipping_street"))
#             account_data.shipping_country = to_str(payload.get("shipping_country"))
#             account_data.shipping_state = to_str(payload.get("shipping_state"))
#             account_data.shipping_city = to_str(payload.get("shipping_city"))
#             account_data.shipping_code = to_str(payload.get("shipping_code"))
#             account_data.description = to_str(payload.get("description"))
#             account_data.logo = logo_path if logo_path else to_str(payload.get("logo"))
#             account_data.logo_url = logo_url
#             account_data.tenant_id = to_int(user_detail["tenant_id"], 0)
#             account_data.user_id = to_int(user_detail["id"], 0)
#             account_data.active = to_int(payload.get("active"), 1)
#             account_data.sort_by = to_int(payload.get("sort_by"), 0)
            
#             accounts_collection.update_one(
#                 {"id": doc_id, "tenant_id": user_detail["tenant_id"]}, 
#                 {"$set": account_data.dict()}
#             )
            
#             # Log activity for account update
#             try:
#                 activity_logs_collection = db.activity_logs
#                 activity_logs_collection.insert_one({
#                     "id": get_next_id(activity_logs_collection),
#                     "activity_type": "account_updated",
#                     "entity_type": "account",
#                     "entity_id": int(account_data.id),
#                     "tenant_id": int(user_detail.get("tenant_id", 0)),
#                     "user_id": int(user_detail.get("id", 0)),
#                     "title": f"Account updated: {account_data.name or account_data.title or 'Unnamed Account'}",
#                     "description": f"Account updated: {account_data.name or account_data.title or 'Unnamed Account'} - Type: {account_data.type or 'N/A'}",
#                     "createdon": datetime.now(timezone.utc).isoformat(),
#                     "metadata": {
#                         "account_name": account_data.name or account_data.title,
#                         "account_id": account_data.id,
#                         "owner_id": account_data.owner_id,
#                         "type_id": account_data.type_id,
#                         "industry_id": account_data.industry_id,
#                         "email": account_data.email
#                     },
#                     "deleted": 0,
#                     "active": 1
#                 })
#             except Exception:
#                 pass  # Don't fail the save if logging fails

#             return {
#                 "status": status.HTTP_200_OK,
#                 "message": "Account updated successfully",
#                 "data": convert_to_jsonable(account_data.dict())
#             }
                
#     except Exception as e:
#         return get_error_details(e)




@accounts.post("/crm/accounts/get")
async def get_accounts(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get all accounts for the current tenant with filters and pagination.
    
    Payload:
    {
        "view": "all_accounts/my_accounts/my_favorite/no_recent_activity/recent_connected/no_phone_provided/email_only_leads/website_added",
        "page": 1,
        "limit": 20,
        "name": "",
        "email": "",
        "phone": "",
        "fax": "",
        "website": "",
        "industry_id": "",
        "type_id": "",
        "annual_revenue": "",
        "employees": "",
        "owner_id": "",
        "status_id": "",
        "last_activity": "",
        "created_date": ""
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
        view = payload.get("view", "all_accounts")
        name = str(payload.get("title", "")).strip()
        email = str(payload.get("email", "")).strip()
        phone = str(payload.get("phone", "")).strip()
        mobile = str(payload.get("mobile", "")).strip()
        fax = str(payload.get("fax", "")).strip()
        website = str(payload.get("website", "")).strip()
        industry_id = str(payload.get("industry_id", "")).strip()
        type_id = str(payload.get("type_id", "")).strip()
        annual_revenue = str(payload.get("annual_revenue", "")).strip()
        employees = str(payload.get("employees", "")).strip()
        owner_id = str(payload.get("owner_id", "")).strip()
        status_id = str(payload.get("status_id", "")).strip()
        last_activity = str(payload.get("last_activity", "")).strip()
        # Support new payload key `created_on` (ISO string), fallback to legacy `create_date`
        created_date = str(payload.get("created_on") or payload.get("create_date", "")).strip()
        
        # Pagination parameters
        page = int(payload.get("page", 1))
        limit = int(payload.get("limit", 20))
        skip = (page - 1) * limit
        
        # Build query using the filter function
        query = build_filter_query(
            user_detail=user_detail,
            view=view,
            name=name,
            email=email,
            phone=phone,
            fax=fax,
            website=website,
            industry_id=industry_id,
            type_id=type_id,
            annual_revenue=annual_revenue,
            employees=employees,
            owner_id=owner_id,
            status_id=status_id,
            last_activity=last_activity,
            created_date=created_date,
            mobile=mobile
        )
        
        # Get total count for pagination
        total_count = accounts_collection.count_documents(query)
        
        # Execute query with pagination
        accounts = list(accounts_collection.find(query, NO_ID_PROJECTION).sort("id", -1).skip(skip).limit(limit))

        # Enrich account data
        records = []
        if accounts:
            for account in accounts:
                enriched_account = enrich_data(account, user_detail)
                records.append(enriched_account)

        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": convert_to_jsonable(records),
            "filters_applied": {
                "view": view,
                "name": name,
                "email": email,
                "phone": phone,
                "fax": fax,
                "website": website,
                "industry_id": industry_id,
                "type_id": type_id,
                "annual_revenue": annual_revenue,
                "employees": employees,
                "owner_id": owner_id,
                "status_id": status_id,
                "last_activity": last_activity,
                "created_date": created_date,
                "query":convert_to_jsonable(query)
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

@accounts.get("/crm/accounts/get-by-view-ukey/{ukey}")
async def get_contacts_by_view_id(ukey: str, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get accounts based on custom view configuration with optimized query building.
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
            accounts_collection
            .find(query, NO_ID_PROJECTION)
            .sort("id", -1)
            .limit(1000)  # Add reasonable limit to prevent memory issues
        )

        return json_response("Records retrieved successfully", records)

    except Exception as e:
        return get_error_response(e)


@accounts.post("/crm/accounts/get/{id}")
async def get_account_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get a single account by ID.
    """
    try:
        account = accounts_collection.find_one({"id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}}, NO_ID_PROJECTION)
        if account:
            return {
                "status": status.HTTP_200_OK,
                "message": "Record retrieved successfully",
                "data": convert_to_jsonable(account)
            }
        return {
            "status": status.HTTP_404_NOT_FOUND,
            "message": "Record not found",
            "data": None
        }
    except Exception as e:
        return get_error_details(e)

@accounts.get("/crm/accounts/clone/{id}")
async def clone_account_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        # Find the original account
        account = accounts_collection.find_one(
            {"id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
            NO_ID_PROJECTION
        )

        if not account:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Original record not found",
                "data": None
            }

        account.pop("_id", None)
        old_id = account.get("id")
        new_id = get_next_id(accounts_collection)

        cursor = accounts_collection.find(
            {}, NO_ID_PROJECTION
        ).sort("ukey", -1).limit(1)

        latest_doc = next(cursor, None)
        latest_ukey = int(latest_doc["ukey"]) if latest_doc and "ukey" in latest_doc else 9999
        next_ukey = latest_ukey + 1

        # Set new fields
        account["id"] = new_id
        account["ukey"] = str(next_ukey)

        # Insert cloned record
        accounts_collection.insert_one(account)

        return {
            "status": status.HTTP_201_CREATED,
            "message": f"Account (cloned from {old_id}) created successfully",
            "data": convert_to_jsonable(account)
        }

    except Exception as e:
        return get_error_details(e)

@accounts.get("/crm/accounts/details/get/{id}")
async def get_account_details_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get comprehensive account details with all related data including notes, attachments, 
    contacts, deals, invoices, quotes, orders, bookings, and activity logs.
    
    Returns:
        Account data with enriched related information:
        - Basic account information
        - Owner and user details
        - Notes related to this account
        - Attachments related to this account
        - Contacts associated with this account
        - Deals associated with this account
        - Invoices (if available)
        - Quotes (if available)
        - Orders (if available)
        - Bookings (if available)
        - Activity logs (creation, updates, etc.)
        - Last activity date
    """
    try:
        # Get the main account record
        account = accounts_collection.find_one(
            {
                "id": id,
                "tenant_id": user_detail["tenant_id"],
                "deleted": {"$ne": 1}
            },
            NO_ID_PROJECTION
        )

        if not account:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Account not found",
                "data": None
            }

        # Enrich account with owner and user details
        account["owner_details"] = db.users.find_one(
            {"id": account.get("owner_id")}, 
            NO_ID_PROJECTION
        ) or {}
        account["user_details"] = db.users.find_one(
            {"id": account.get("user_id")}, 
            NO_ID_PROJECTION
        ) or {}

        # Get notes related to this account
        account["notes"] = list(db.notes.find(
            {
                "related_to": "accounts", 
                "related_to_id": id, 
                "tenant_id": user_detail["tenant_id"], 
                "deleted": {"$ne": 1}
            }, 
            NO_ID_PROJECTION
        ).sort("id", -1))

        # Get attachments related to this account
        account["attachments"] = list(db.attachments.find(
            {
                "related_to": "accounts", 
                "related_to_id": id, 
                "tenant_id": user_detail["tenant_id"], 
                "deleted": {"$ne": 1}
            }, 
            NO_ID_PROJECTION
        ).sort("id", -1))

        # Get contacts associated with this account
        account["contacts"] = list(db.contacts.find(
            {
                "account_id": id, 
                "tenant_id": user_detail["tenant_id"], 
                "deleted": {"$ne": 1}
            }, 
            NO_ID_PROJECTION
        ).sort("id", -1))

        # Get deals associated with this account
        account["deals"] = list(db.deals.find(
            {
                "account_id": id, 
                "tenant_id": user_detail["tenant_id"], 
                "deleted": {"$ne": 1}
            }, 
            NO_ID_PROJECTION
        ).sort("id", -1))

        # Get invoices related to this account (if invoices collection exists)
        try:
            account["invoices"] = list(db.invoices.find(
                {
                    "account_id": id, 
                    "tenant_id": user_detail["tenant_id"], 
                    "deleted": {"$ne": 1}
                }, 
                NO_ID_PROJECTION
            ).sort("id", -1))
        except:
            account["invoices"] = []

        # Get quotes related to this account (if quotes collection exists)
        try:
            account["quotes"] = list(db.quotes.find(
                {
                    "account_id": id, 
                    "tenant_id": user_detail["tenant_id"], 
                    "deleted": {"$ne": 1}
                }, 
                NO_ID_PROJECTION
            ).sort("id", -1))
        except:
            account["quotes"] = []

        # Get orders related to this account (if orders collection exists)
        try:
            account["orders"] = list(db.orders.find(
                {
                    "account_id": id, 
                    "tenant_id": user_detail["tenant_id"], 
                    "deleted": {"$ne": 1}
                }, 
                NO_ID_PROJECTION
            ).sort("id", -1))
        except:
            account["orders"] = []

        # Get bookings related to this account (if bookings collection exists)
        try:
            account["bookings"] = list(db.bookings.find(
                {
                    "account_id": id, 
                    "tenant_id": user_detail["tenant_id"], 
                    "deleted": {"$ne": 1}
                }, 
                NO_ID_PROJECTION
            ).sort("id", -1))
        except:
            account["bookings"] = []

        # Get activity logs related to this account
        try:
            account["activity_logs"] = list(db.activity_logs.find(
                {
                    "entity_type": "account",
                    "entity_id": id,
                    "tenant_id": user_detail["tenant_id"],
                    "deleted": {"$ne": 1}
                },
                NO_ID_PROJECTION
            ).sort("timestamp", -1))
        except:
            account["activity_logs"] = []

        # Enrich related data with additional details where needed
        # Enrich contacts with owner details
        for contact in account["contacts"]:
            contact["owner_details"] = db.users.find_one(
                {"id": contact.get("owner_id")}, 
                NO_ID_PROJECTION
            ) or {}

        # Enrich deals with contact and owner details
        for deal in account["deals"]:
            deal["owner_details"] = db.users.find_one(
                {"id": deal.get("owner_id")}, 
                NO_ID_PROJECTION
            ) or {}
            deal["contact_details"] = db.contacts.find_one(
                {"id": deal.get("contact_id")}, 
                NO_ID_PROJECTION
            ) or {}

        # Get and populate last activity date
        last_activity_date = get_last_activity_date("account", account["id"])
        if last_activity_date:
            account["last_activity_date"] = last_activity_date

        return {
            "status": status.HTTP_200_OK,
            "message": "Account details retrieved successfully",
            "data": convert_to_jsonable(account),
            "summary": {
                "notes_count": len(account["notes"]),
                "attachments_count": len(account["attachments"]),
                "contacts_count": len(account["contacts"]),
                "deals_count": len(account["deals"]),
                "invoices_count": len(account["invoices"]),
                "quotes_count": len(account["quotes"]),
                "orders_count": len(account["orders"]),
                "bookings_count": len(account["bookings"]),
                "activity_logs_count": len(account.get("activity_logs", []))
            }
        }

    except Exception as e:
        return get_error_details(e)



@accounts.get("/crm/accounts/details/get/{id}")
async def get_account_details_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    return get_entity_details("account", id, user_detail)



@accounts.get("/crm/accounts/{id}/deleted/{value}")
async def toggle_account_deletion(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Soft delete or restore an account by toggling the 'deleted' flag.
    """
    try:
        accounts_collection.update_one({"id": id, "tenant_id": user_detail["tenant_id"]}, {"$set": {"deleted": value}})
        message = "Record deleted successfully" if value else "Record restored successfully"
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": None
        }
    except Exception as e:
        return get_error_details(e)

@accounts.post("/crm/accounts/bulk-delete")
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

        result = accounts_collection.update_many(
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
            "message": f"{result.modified_count} account(s) soft deleted successfully.",
            "modified_count": result.modified_count
        }

    except Exception as e:
        return get_error_details(e)
        

@accounts.post("/crm/accounts/bulk-update")
async def bulk_update(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    try:
        form = await request.form()
        ids = json.loads(form.get("ids"))  # stringified array from frontend
        title = form.get("title")
        type_raw = form.get("type")
        industry = form.get("industry")
        rating_raw = form.get("rating")

        # Check if at least one field is provided
        if not any([title, type_raw, industry, rating_raw]):
            return {
                "status": status.HTTP_422_UNPROCESSABLE_ENTITY,
                "message": "At least one of title, type, industry, or rating must be provided."
            }

        # Parse nested JSON if needed
        type_value = json.loads(type_raw) if type_raw else None
        rating_value = json.loads(rating_raw) if rating_raw else None

        update_fields = {}
        if title:
            update_fields["title"] = title
        if type_value and "value" in type_value:
            update_fields["type"] = type_value["value"]
        if industry:
            update_fields["industry"] = int(industry or 0)
        if rating_value and "value" in rating_value:
            update_fields["rating"] = rating_value["value"]

        # Update records matching ids and tenant
        result = accounts_collection.update_many(
            {
                "id": {"$in": ids},
                "tenant_id": user_detail["tenant_id"],
                "deleted": {"$ne": 1}
            },
            {"$set": update_fields}
        )

        return {
            "status": status.HTTP_200_OK,
            "message": f"{result.modified_count} accounts updated successfully",
            "updated_count": result.modified_count
        }

    except Exception as e:
        return get_error_details(e)


@accounts.get("/crm/accounts/{id}/favorite/{value}")
async def toggle_account_favorite(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Toggle favorite status for an account by setting the 'favorite' flag.
    Default value is 0 (not favorite), 1 for favorite.
    """
    try:
        accounts_collection.update_one(
            {"id": id, "tenant_id": user_detail["tenant_id"]}, 
            {"$set": {"favorite": value}}
        )
        message = "Account marked as favorite" if value else "Account unmarked as favorite"

        log_activity(
            activity_type="account_marked_as_favorite" if value else "account_unmarked_as_favorite",
            entity_type="account",
            entity_id=id,
            user_detail=user_detail,
            title=f"Account {'marked as favorite' if value else 'unmarked as favorite'}",
            description=f"Account {'marked as favorite' if value else 'unmarked as favorite'}",
            metadata={}
        )
        return json_response(message)
    except Exception as e:
        return get_error_response(e)


@accounts.post("/crm/accounts/get-grouped-by-industry")
async def get_accounts_grouped_by_industry(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get all accounts for the current tenant grouped by industry.
    Uses MongoDB aggregation pipeline for efficient handling of large datasets.
    
    Returns:
        A list of industry groups, each containing:
        - Industry details from industry library collection
        - Array of accounts matching that industry_id
        - Enriched account data with owner and user details
    """
    try:
        try:
            payload = await request.json()
        except Exception:
            form = await request.form()
            payload = dict(form)

        include_enrichment = str(payload.get("include_enrichment", "true")).lower() == "true"
        tenant_id = user_detail["tenant_id"]

        name = str(payload.get("name", "")).strip()
        email = str(payload.get("email", "")).strip()
        phone = str(payload.get("phone", "")).strip()
        fax = str(payload.get("fax", "")).strip()
        website = str(payload.get("website", "")).strip()
        industry_id = str(payload.get("industry_id", "")).strip()
        type_id = str(payload.get("type_id", "")).strip()
        annual_revenue = str(payload.get("annual_revenue", "")).strip()
        employees = str(payload.get("employees", "")).strip()
        owner_id = str(payload.get("owner_id", "")).strip()
        status_id = str(payload.get("status_id", "")).strip()
        last_activity = str(payload.get("last_activity", "")).strip()
        created_date = str(payload.get("created_date", "")).strip()
        view = str(payload.get("view", "all_accounts")).strip()
        mobile = str(payload.get("mobile", "")).strip()

        base_query = build_filter_query(
            user_detail=user_detail,
            view=view,
            name=name,
            email=email,
            phone=phone,
            fax=fax,
            website=website,
            industry_id=industry_id,
            type_id=type_id,
            annual_revenue=annual_revenue,
            employees=employees,
            owner_id=owner_id,
            status_id=status_id,
            last_activity=last_activity,
            created_date=created_date,
            mobile=mobile,
        )

        industries_cursor = db.accounts_industry_options.find(
            {"deleted": {"$ne": 1}},
            NO_ID_PROJECTION
        ).sort("id", 1)

        industries = [industry_doc for industry_doc in industries_cursor if industry_doc.get("id") is not None]
        if not industries:
            industries = [{"id": "unknown", "title": "Unknown Industry"}]

        industry_map = {str(industry_doc["id"]): industry_doc for industry_doc in industries}

        pipeline = [
            {"$match": base_query},
            {"$group": {
                "_id": "$industry_id",
                "total_accounts": {"$sum": 1},
                "account_ids": {"$addToSet": "$id"}
            }},
            {"$sort": {"_id": 1}},
        ]
        groups = list(accounts_collection.aggregate(pipeline))

        accounts_by_industry = {
            str(group.get("_id") if group.get("_id") is not None else "unknown"): {
                "total_accounts": group.get("total_accounts", 0),
                "account_ids": group.get("account_ids", []),
            }
            for group in groups
        }

        all_account_ids = [
            account_id
            for group in accounts_by_industry.values()
            for account_id in group.get("account_ids", [])
        ]

        enriched_map: Dict[int, Dict[str, Any]] = {}
        if include_enrichment and all_account_ids:
            enrichment_query = dict(base_query)
            enrichment_query.pop("id", None)
            enrichment_query["id"] = {"$in": all_account_ids}

            enriched_docs = list(accounts_collection.find(enrichment_query, NO_ID_PROJECTION))
            for account_doc in enriched_docs:
                account_id_value = account_doc.get("id")
                if account_id_value is None:
                    continue
                enriched_account = enrich_data(dict(account_doc), user_detail)
                enriched_account["last_activity_date"] = get_last_activity_date("account", account_id_value)
                enriched_map[account_id_value] = enriched_account

        grouped_data = []
        total_accounts_count = 0
        processed_industry_ids: Set[str] = set()

        for industry_doc in industries:
            industry_id_value = industry_doc.get("id")
            industry_id_str = str(industry_id_value)
            industry_data = accounts_by_industry.get(industry_id_str, {"total_accounts": 0, "account_ids": []})

            group_result: Dict[str, Any] = {
                "industry_id": industry_id_value,
                "industry_name": industry_doc.get("title") or industry_doc.get("name", ""),
                "total_accounts": industry_data.get("total_accounts", 0),
            }

            if include_enrichment:
                group_result["accounts"] = [
                    enriched_map[account_id]
                    for account_id in industry_data.get("account_ids", [])
                    if account_id in enriched_map
                ]
            else:
                group_result["account_ids"] = industry_data.get("account_ids", [])

            grouped_data.append(group_result)
            total_accounts_count += industry_data.get("total_accounts", 0)
            processed_industry_ids.add(industry_id_str)

        for industry_id_str, industry_data in accounts_by_industry.items():
            if industry_id_str in processed_industry_ids:
                continue

            total_for_industry = industry_data.get("total_accounts", 0)
            if total_for_industry == 0:
                continue

            industry_id_int = int(industry_id_str) if industry_id_str.isdigit() else industry_id_str
            industry_entry = industry_map.get(industry_id_str)
            if industry_entry is None and isinstance(industry_id_int, int):
                industry_entry = db.accounts_industry_options.find_one(
                    {"id": industry_id_int, "deleted": {"$ne": 1}},
                    NO_ID_PROJECTION
                )

            group_title = (industry_entry or {}).get("title", f"Unknown Industry ({industry_id_str})")

            fallback_result: Dict[str, Any] = {
                "industry_id": industry_id_int,
                "industry_name": group_title,
                "total_accounts": total_for_industry,
            }

            if include_enrichment:
                fallback_result["accounts"] = [
                    enriched_map[account_id]
                    for account_id in industry_data.get("account_ids", [])
                    if account_id in enriched_map
                ]
            else:
                fallback_result["account_ids"] = industry_data.get("account_ids", [])

            grouped_data.append(fallback_result)
            total_accounts_count += total_for_industry

        return {
            "status": status.HTTP_200_OK,
            "message": "Accounts grouped by industry retrieved successfully",
            "data": convert_to_jsonable(grouped_data),
            "summary": {
                "total_accounts": total_accounts_count,
                "total_industry_groups": len(grouped_data),
                "enrichment_enabled": include_enrichment,
            },
            "filters_applied": {
                "view": view,
                "name": name,
                "email": email,
                "phone": phone,
                "fax": fax,
                "website": website,
                "industry_id": industry_id,
                "type_id": type_id,
                "annual_revenue": annual_revenue,
                "employees": employees,
                "owner_id": owner_id,
                "status_id": status_id,
                "last_activity": last_activity,
                "created_date": created_date,
                "mobile": mobile,
            },
            "query": convert_to_jsonable(base_query),
        }
    except Exception as e:
        return get_error_details(e)


@accounts.post("/crm/accounts/get-grouped-by-type")
async def get_accounts_grouped_by_type(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get all accounts for the current tenant grouped by type.
    """
    try:
        # Get form data for filtering
        form = await request.form()
        include_enrichment = form.get("include_enrichment", "true").lower() == "true"
        
        tenant_id = user_detail["tenant_id"]
        
        # Build base query
        base_query = {
            "tenant_id": tenant_id,
            "deleted": {"$ne": 1}
        }
        
        # Get all accounts
        accounts = list(accounts_collection.find(base_query, NO_ID_PROJECTION).sort("id", -1))

        # Group accounts by type
        grouped_accounts = {}
        
        if accounts:
            for account in accounts:
                type_value = account.get("type", "Unknown")
                
                if include_enrichment:
                    # Get user information for owner
                    owner = db.users.find_one(
                        {"id": account.get("owner_id")},
                        NO_ID_PROJECTION
                    )
                    account["owner"] = owner or {}
                    account["owner_details"] = owner or {}
                    
                    # Get user information for user_id
                    user = db.users.find_one(
                        {"id": account.get("user_id")},
                        NO_ID_PROJECTION
                    )
                    account["user"] = user or {}
                    account["user_details"] = user or {}
                
                # Add account to the appropriate type group
                if type_value not in grouped_accounts:
                    grouped_accounts[type_value] = {
                        "type": type_value,
                        "total_accounts": 0,
                        "accounts": []
                    }
                grouped_accounts[type_value]["total_accounts"] += 1
                grouped_accounts[type_value]["accounts"].append(account)

        return {
            "status": status.HTTP_200_OK,
            "message": "Accounts grouped by type retrieved successfully",
            "data": convert_to_jsonable(list(grouped_accounts.values())),
            "summary": {
                "total_accounts": len(accounts),
                "total_type_groups": len(grouped_accounts),
                "enrichment_enabled": include_enrichment
            }
        }
    except Exception as e:
        return get_error_details(e)


@accounts.post("/crm/accounts/get-grouped-by-status")
async def get_accounts_grouped_by_status(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get all accounts grouped by their status from the account_status collection.
    Uses MongoDB aggregation pipeline for efficient handling of large datasets.
    Ensures no duplicate records are returned.
    
    Performance optimizations:
    - Single aggregation pipeline with $lookup for joins
    - Indexed queries on tenant_id, status_id, deleted
    - Batch processing to avoid N+1 queries
    - Returns all accounts for each status group
    
    Returns:
        A list of status groups, each containing:
        - Status details from account_status collection
        - Array of unique accounts matching that status_id
        - Enriched account data with owner and user details via $lookup
    """
    try:
        # Get form data for filtering
        form = await request.form()
        include_enrichment = form.get("include_enrichment", "true").lower() == "true"
        
        tenant_id = user_detail["tenant_id"]
        
        try:
            payload = await request.json()
        except Exception:
            form = await request.form()
            payload = dict(form)

        include_enrichment = str(payload.get("include_enrichment", "true")).lower() == "true"
        tenant_id = user_detail["tenant_id"]

        name = str(payload.get("name", "")).strip()
        email = str(payload.get("email", "")).strip()
        phone = str(payload.get("phone", "")).strip()
        fax = str(payload.get("fax", "")).strip()
        website = str(payload.get("website", "")).strip()
        industry_id = str(payload.get("industry_id", "")).strip()
        type_id = str(payload.get("type_id", "")).strip()
        annual_revenue = str(payload.get("annual_revenue", "")).strip()
        employees = str(payload.get("employees", "")).strip()
        owner_id = str(payload.get("owner_id", "")).strip()
        status_id = str(payload.get("status_id", "")).strip()
        last_activity = str(payload.get("last_activity", "")).strip()
        created_date = str(payload.get("created_date", "")).strip()
        view = str(payload.get("view", "all_accounts")).strip()
        mobile = str(payload.get("mobile", "")).strip()

        base_query = build_filter_query(
            user_detail=user_detail,
            view=view,
            name=name,
            email=email,
            phone=phone,
            fax=fax,
            website=website,
            industry_id=industry_id,
            type_id=type_id,
            annual_revenue=annual_revenue,
            employees=employees,
            owner_id=owner_id,
            status_id=status_id,
            last_activity=last_activity,
            created_date=created_date,
            mobile=mobile,
        )

        statuses_cursor = db.accounts_status_options.find(
            {"deleted": {"$ne": 1}},
            NO_ID_PROJECTION
        ).sort("id", 1)

        statuses = [status_doc for status_doc in statuses_cursor if status_doc.get("id") is not None]
        if not statuses:
            statuses = [
                {"id": 1, "title": "Active"},
                {"id": 2, "title": "Inactive"},
                {"id": 3, "title": "Pending"},
            ]

        status_map = {str(status_doc["id"]): status_doc for status_doc in statuses}

        pipeline = [
            {"$match": base_query},
            {"$group": {
                "_id": "$status_id",
                "total_accounts": {"$sum": 1},
                "account_ids": {"$addToSet": "$id"}
            }},
            {"$sort": {"_id": 1}},
        ]
        groups = list(accounts_collection.aggregate(pipeline))

        accounts_by_status = {
            str(group.get("_id") if group.get("_id") is not None else "unknown"): {
                "total_accounts": group.get("total_accounts", 0),
                "account_ids": group.get("account_ids", []),
            }
            for group in groups
        }

        all_account_ids = [
            account_id
            for group in accounts_by_status.values()
            for account_id in group.get("account_ids", [])
        ]

        enriched_map: Dict[int, Dict[str, Any]] = {}
        if include_enrichment and all_account_ids:
            enrichment_query = dict(base_query)
            enrichment_query.pop("id", None)
            enrichment_query["id"] = {"$in": all_account_ids}

            enriched_docs = list(accounts_collection.find(enrichment_query, NO_ID_PROJECTION))
            for account_doc in enriched_docs:
                account_id_value = account_doc.get("id")
                if account_id_value is None:
                    continue
                enriched_account = enrich_data(dict(account_doc), user_detail)
                enriched_account["last_activity_date"] = get_last_activity_date("account", account_id_value)
                enriched_map[account_id_value] = enriched_account

        grouped_data = []
        total_accounts_count = 0
        processed_status_ids: Set[str] = set()

        for status_doc in statuses:
            status_id_value = status_doc.get("id")
            if status_id_value is None:
                continue
            status_id_str = str(status_id_value)
            status_data = accounts_by_status.get(status_id_str, {"total_accounts": 0, "account_ids": []})

            group_result: Dict[str, Any] = {
                **status_doc,
                "total_accounts": status_data.get("total_accounts", 0),
            }

            if include_enrichment:
                group_result["accounts"] = [
                    enriched_map[account_id]
                    for account_id in status_data.get("account_ids", [])
                    if account_id in enriched_map
                ]
            else:
                group_result["account_ids"] = status_data.get("account_ids", [])

            grouped_data.append(group_result)
            total_accounts_count += status_data.get("total_accounts", 0)
            processed_status_ids.add(status_id_str)

        for status_id_str, status_data in accounts_by_status.items():
            if status_id_str in processed_status_ids:
                continue

            total_for_status = status_data.get("total_accounts", 0)
            if total_for_status == 0:
                continue

            status_id_int = int(status_id_str) if status_id_str.isdigit() else status_id_str
            status_entry = status_map.get(status_id_str)
            if status_entry is None and isinstance(status_id_int, int):
                status_entry = db.accounts_status_options.find_one(
                    {"id": status_id_int, "deleted": {"$ne": 1}},
                    NO_ID_PROJECTION
                )

            group_title = (status_entry or {}).get("title", f"Unknown Status ({status_id_str})")
            fallback_result: Dict[str, Any] = {
                "id": (status_entry or {}).get("id", status_id_int),
                "title": group_title,
                "total_accounts": total_for_status,
            }

            if include_enrichment:
                fallback_result["accounts"] = [
                    enriched_map[account_id]
                    for account_id in status_data.get("account_ids", [])
                    if account_id in enriched_map
                ]
            else:
                fallback_result["account_ids"] = status_data.get("account_ids", [])

            grouped_data.append(fallback_result)
            total_accounts_count += total_for_status

        return {
            "status": status.HTTP_200_OK,
            "message": "Accounts grouped by status retrieved successfully",
            "data": convert_to_jsonable(grouped_data),
            "summary": {
                "total_accounts": total_accounts_count,
                "total_status_groups": len(grouped_data),
                "enrichment_enabled": include_enrichment,
            },
            "filters_applied": {
                "view": view,
                "name": name,
                "email": email,
                "phone": phone,
                "fax": fax,
                "website": website,
                "industry_id": industry_id,
                "type_id": type_id,
                "annual_revenue": annual_revenue,
                "employees": employees,
                "owner_id": owner_id,
                "status_id": status_id,
                "last_activity": last_activity,
                "created_date": created_date,
                "mobile": mobile,
            },
            "query": convert_to_jsonable(base_query),
        }
    except Exception as e:
        return get_error_details(e)


@accounts.post("/crm/accounts/get-account-status-chart-data")
async def get_account_status_chart_data(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get account status distribution with chart data, counters and insights.
    Optional form fields: from, to (ISO dates). Defaults to today.
    """
    try:
        form = await request.form()

        tenant_id = int(user_detail.get("tenant_id", 0))

        from_date_str = form.get("from", "")
        to_date_str = form.get("to", "")

        # Date range defaults to today if not provided or parse fails
        if from_date_str and to_date_str:
            try:
                from_date = datetime.fromisoformat(from_date_str.replace('Z', '+00:00'))
                to_date = datetime.fromisoformat(to_date_str.replace('Z', '+00:00'))
            except ValueError:
                to_date = datetime.now(timezone.utc)
                from_date = to_date
        else:
            to_date = datetime.now(timezone.utc)
            from_date = to_date

        base_query = {"deleted": {"$ne": 1}, "tenant_id": tenant_id}

        # Load status options
        try:
            account_statuses = list(db.accounts_status_options.find(
                {"deleted": {"$ne": 1}}, NO_ID_PROJECTION
            ).sort("id", 1))
        except Exception:
            account_statuses = [
                {"id": 1, "name": "Active"},
                {"id": 2, "name": "Inactive"},
                {"id": 3, "name": "Pending"}
            ]

        # Aggregate counts by status within date range (createdon)
        pipeline = [
            {"$match": {**base_query, "createdon": {"$gte": from_date.isoformat(), "$lte": to_date.isoformat()}}},
            {"$group": {"_id": "$status_id", "count": {"$sum": 1}}}
        ]

        aggregation_result = list(accounts_collection.aggregate(pipeline))

        status_counts = {int(s.get("id")): 0 for s in account_statuses if isinstance(s.get("id"), int)}
        for r in aggregation_result:
            key = r.get("_id")
            if isinstance(key, int):
                status_counts[key] = r.get("count", 0)

        total_accounts_in_range = sum(status_counts.values())

        # Build chart data
        chart_data = []
        for s in account_statuses:
            sid = int(s.get("id", 0))
            title = s.get("title") or s.get("name") or f"Status {sid}"
            count = status_counts.get(sid, 0)
            percent = int(round((count / total_accounts_in_range * 100), 0)) if total_accounts_in_range > 0 else 0
            # Assign simple colors deterministically
            color_palette = ["#10B981", "#F59E0B", "#3B82F6", "#EF4444", "#8B5CF6", "#06B6D4"]
            color = color_palette[(sid - 1) % len(color_palette)] if sid > 0 else "#6B7280"
            chart_data.append({
                "title": title,
                "value": count,
                "percent": percent,
                "color": color
            })

        # Counters and insights
        total_accounts = accounts_collection.count_documents(base_query)
        active_accounts = accounts_collection.count_documents({**base_query, "active": 1})

        insights = {
            "date_range": {"from": from_date.isoformat(), "to": to_date.isoformat()},
            "active_rate": round((active_accounts / total_accounts * 100), 1) if total_accounts > 0 else 0,
            "statuses": {str(k): v for k, v in status_counts.items()}
        }

        response_data = {
            "chartData": chart_data,
            "counters": [
                {"title": "Total Accounts", "value": total_accounts, "trend": "neutral"},
                {"title": "Active Accounts", "value": active_accounts, "trend": "neutral"},
                {"title": "In Range", "value": total_accounts_in_range, "trend": "neutral"}
            ],
            "insights": insights,
            "summary": {
                "total_accounts": total_accounts,
                "active_accounts": active_accounts,
                "in_range": total_accounts_in_range
            }
        }

        return {
            "status": status.HTTP_200_OK,
            "message": "Account status chart data retrieved successfully",
            "data": response_data,
            "tenant_id": tenant_id
        }

    except Exception as e:
        return get_error_details(e)


@accounts.post("/crm/accounts/update-status")
async def update_account_status(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    """
    Update account status by ID.
    
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
            # If JSON parsing fails, try form data
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

        
        account_data = AccountUpdateStatus()
        account_data.status_id = status_value
        
        accounts_collection.update_one(
            {"id": id, "tenant_id": user_detail["tenant_id"]}, 
            {"$set": account_data.dict()}
        )
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Record updated successfully",
            "data": convert_to_jsonable(account_data.dict())
        }
                
    except Exception as e:
        return get_error_details(e)


@accounts.post("/crm/accounts/update-owner")
async def update_account_owner(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    """
    Update account owner by ID.
    
    Payload:
    {
        "id": 123,
        "owner": 5
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
        owner_value = int(payload.get("owner"))
        
        account_data = AccountUpdateOwner()
        account_data.owner_id = owner_value
        
        accounts_collection.update_one(
            {"id": id, "tenant_id": user_detail["tenant_id"]}, 
            {"$set": account_data.dict()}
        )
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Record updated successfully",
            "data": convert_to_jsonable(account_data.dict())
        }
                
    except Exception as e:
        return get_error_details(e)


# ===============================
# CRUD for ACCOUNTS - ending
# ===============================
