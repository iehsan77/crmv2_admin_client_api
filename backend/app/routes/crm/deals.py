import json
import re

from fastapi import APIRouter, Request, status, Depends, UploadFile, File
from typing import Any, Dict, List, Optional, Set
from datetime import datetime, timedelta, timezone
from app.networks.database import db
from app.utils import oauth2, config
from app.helpers.general_helper import (
    get_next_id,
    upsert_document,
    json_response,
    get_error_response,
    convert_to_jsonable,
    get_last_activity_date,
    get_error_details,
)
from app.helpers.uploadimage import UploadImage
from app.models.crm.deals import DealCreate, DealUpdate, DealInDB, DealsUpdateStage
from app.helpers.crm_helper import get_entity_details, log_activity

# Router
deals = APIRouter(tags=["CRM Admin - Deals"])

# MongoDB Collection
deals_collection = db.deals

# Projection to exclude MongoDB _id
NO_ID_PROJECTION = {"_id": 0}






# ===============================
# Helper Functions for Deals
# ===============================


def generate_line_chart_data(deals_collection, base_query, end_date, metric_type="total"):
    data = []

    for i in range(7):
        current_date = end_date - timedelta(days=6 - i)
        start_of_day = current_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = current_date.replace(hour=23, minute=59, second=59, microsecond=999999)

        day_query = {k: v for k, v in base_query.items() if k != "createdon"}

        if metric_type == "total":
            count = deals_collection.count_documents(day_query)
        elif metric_type == "active":
            count = deals_collection.count_documents({**day_query, "active": 1})
        elif metric_type == "new_deals":
            day_query["createdon"] = {
                "$gte": start_of_day.isoformat(),
                "$lte": end_of_day.isoformat(),
            }
            count = deals_collection.count_documents(day_query)
        else:
            count = deals_collection.count_documents(day_query)

        data.append({"value": count})

    return data


def enrich_data(deal: dict, user_detail: dict) -> dict:
    """
    Enrich deal data with related user info and last activity date.
    """

    # Owner details
    owner = db.users.find_one({"id": deal.get("owner_id")}, NO_ID_PROJECTION)
    deal["owner_details"] = owner or {}
    deal["owner"] = owner or {}

    # Created by user
    user = db.users.find_one({"id": deal.get("user_id")}, NO_ID_PROJECTION)
    deal["user_details"] = user or {}

    # Last activity date
    deal["last_activity_date"] = get_last_activity_date("deal",deal.get("id") )

    return deal


def search_accounts_contacts_by_email_phone(
    email: str = "",
    phone: str = "",
    tenant_id: int = None
) -> tuple[Set[int], Set[int]]:
    """
    Search accounts and contacts collections by email and/or phone.
    
    Args:
        email: Email address to search for
        phone: Phone number to search for
        tenant_id: Tenant ID to filter results
    
    Returns:
        Tuple of (account_ids_set, contact_ids_set) containing integer IDs
    """
    account_ids = set()
    contact_ids = set()
    
    if not tenant_id or (not email and not phone):
        return account_ids, contact_ids
    
    try:
        # Build search conditions for accounts
        account_conditions = []
        if email:
            email_pattern = str(email).strip()
            if email_pattern:
                account_conditions.append({"email": {"$regex": email_pattern, "$options": "i"}})
        
        if phone:
            phone_pattern = str(phone).strip()
            if phone_pattern:
                account_conditions.append({"phone": {"$regex": phone_pattern, "$options": "i"}})
                account_conditions.append({"mobile": {"$regex": phone_pattern, "$options": "i"}})
        
        # Search in accounts collection
        if account_conditions:
            account_query = {
                "tenant_id": tenant_id,
                "deleted": {"$ne": 1},
                "$or": account_conditions
            }
            matching_accounts = list(db.accounts.find(account_query, {"_id": 0, "id": 1}))
            for acc in matching_accounts:
                acc_id = acc.get("id")
                if acc_id is not None:
                    try:
                        account_ids.add(int(acc_id))
                    except (ValueError, TypeError):
                        continue
        
        # Build search conditions for contacts (contacts have phone, mobile, and email)
        contact_conditions = []
        if email:
            email_pattern = str(email).strip()
            if email_pattern:
                contact_conditions.append({"email": {"$regex": email_pattern, "$options": "i"}})
        
        if phone:
            phone_pattern = str(phone).strip()
            if phone_pattern:
                # Search in both phone and mobile fields for contacts
                contact_conditions.append({"phone": {"$regex": phone_pattern, "$options": "i"}})
                contact_conditions.append({"mobile": {"$regex": phone_pattern, "$options": "i"}})
        
        # Search in contacts collection
        if contact_conditions:
            contact_query = {
                "tenant_id": tenant_id,
                "deleted": {"$ne": 1},
                "$or": contact_conditions
            }
            matching_contacts = list(db.contacts.find(contact_query, {"_id": 0, "id": 1}))
            for cont in matching_contacts:
                cont_id = cont.get("id")
                if cont_id is not None:
                    try:
                        contact_ids.add(int(cont_id))
                    except (ValueError, TypeError):
                        continue
    except Exception as e:
        # Log error but don't break the query
        print(f"Error searching accounts/contacts by email/phone: {e}")
    
    return account_ids, contact_ids



# ===============================
# CRUD for DEALS - starting
# ===============================

@deals.post("/crm/deals/get-statistics")
async def get_deals_statistics(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get deals statistics for the dashboard (mirrors accounts get-statistics style).
    """
    try:
        form = await request.form()

        tenant_id = int(user_detail.get("tenant_id", 0))

        from_date_str = form.get("from", "")
        to_date_str = form.get("to", "")

        # Helper: parse ISO string and normalize to naive UTC
        def _parse_iso(value: str):
            try:
                if not value:
                    return None
                v = value.replace('Z', '+00:00')
                dt = datetime.fromisoformat(v)
                # Normalize to UTC and drop tzinfo to match stored naive UTC in Mongo
                if dt.tzinfo is not None:
                    dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
                return dt
            except Exception:
                return None

        # Helper: parse from/to dates with fallback
        def _parse_iso_with_fallback(value: str):
            dt = _parse_iso(value)
            return dt if dt is not None else datetime.utcnow()

        from_date = _parse_iso_with_fallback(from_date_str) if from_date_str else datetime.utcnow()
        to_date = _parse_iso_with_fallback(to_date_str) if to_date_str else datetime.utcnow()

        base_query = {"tenant_id": tenant_id, "deleted": {"$ne": 1}}

        # Month ranges
        now_dt = datetime.utcnow()
        month_start = now_dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if month_start.month == 12:
            next_month_start = month_start.replace(year=month_start.year + 1, month=1)
        else:
            next_month_start = month_start.replace(month=month_start.month + 1)
        # Previous month
        prev_month_end = month_start
        if month_start.month == 1:
            prev_month_start = month_start.replace(year=month_start.year - 1, month=12)
        else:
            prev_month_start = month_start.replace(month=month_start.month - 1)

        # Core totals
        total_deals = deals_collection.count_documents(base_query)

        # Stage definitions for won/lost detection
        stages = list(db.deal_status_options.find({"deleted": {"$ne": 1}}, NO_ID_PROJECTION))
        won_status_ids = set()
        lost_status_ids = set()
        for s in stages:
            sid = s.get("id")
            slug = (s.get("slug") or "").lower()
            title = (s.get("title") or "").lower()
            if sid is None:
                continue
            if ("won" in slug) or ("won" in title):
                won_status_ids.add(int(sid))
            if ("lost" in slug) or ("lost" in title):
                lost_status_ids.add(int(sid))

        # New this month
        new_this_month = deals_collection.count_documents({
            **base_query,
            "createdon": {"$gte": month_start.isoformat(), "$lt": next_month_start.isoformat()}
        })
        prev_month_new = deals_collection.count_documents({
            **base_query,
            "createdon": {"$gte": prev_month_start.isoformat(), "$lt": prev_month_end.isoformat()}
        })
        total_change = ( (new_this_month - prev_month_new) / prev_month_new * 100 ) if prev_month_new > 0 else 0

        # Won/Lost counts (lifetime)
        won_count = deals_collection.count_documents({**base_query, "status_id": {"$in": [7]} }) if won_status_ids else 0
        lost_count = deals_collection.count_documents({**base_query, "status_id": {"$in": [8]} }) if lost_status_ids else 0

        # In progress = not won and not lost (status_id is integer and not in [7, 8, 9])
        # Only return records where status_id exists, is an integer, and not matching [7, 8, 9]
        in_progress_query = {
            **base_query,
            "status_id": {"$exists": True, "$ne": None, "$nin": [7, 8, 9]}
        }
        in_progress = deals_collection.count_documents(in_progress_query)
        
        # Approx previous in-progress snapshot: deals created up to prev_month_end and not in won/lost
        prev_in_progress_query = {
            **base_query,
            "createdon": {"$lte": prev_month_end.isoformat()},
            "status_id": {"$exists": True, "$ne": None, "$nin": [7, 8, 9]}
        }
        prev_in_progress = deals_collection.count_documents(prev_in_progress_query)
        in_progress_change = ( (in_progress - prev_in_progress) / prev_in_progress * 100 ) if prev_in_progress > 0 else 0

        # Average deal age for in-progress (in days)
        cursor_in_progress = deals_collection.find(
            in_progress_query,
            {"_id": 0, "createdon": 1}
        ).limit(2000)
        ages_days = []
        for d in cursor_in_progress:
            dt = _parse_iso(d.get("createdon") if isinstance(d.get("createdon"), str) else str(d.get("createdon")))
            if dt is not None:
                ages_days.append(max(0.0, (now_dt - dt).total_seconds() / 86400.0))
        avg_deal_age = round(sum(ages_days) / len(ages_days), 1) if ages_days else 0.0

        # Previous month average deal age (approx: deals created within prev month and not won/lost)
        prev_cursor_query = {
            **base_query,
            "createdon": {"$gte": prev_month_start.isoformat(), "$lt": prev_month_end.isoformat()},
            "status_id": {"$exists": True, "$ne": None, "$nin": [7, 8, 9]}
        }
        prev_cursor = deals_collection.find(
            prev_cursor_query,
            {"_id": 0, "createdon": 1}
        ).limit(2000)
        prev_ages = []
        for d in prev_cursor:
            dt = _parse_iso(d.get("createdon") if isinstance(d.get("createdon"), str) else str(d.get("createdon")))
            if dt is not None:
                prev_ages.append(max(0.0, (prev_month_end - dt).total_seconds() / 86400.0))
        prev_avg_age = (sum(prev_ages) / len(prev_ages)) if prev_ages else 0.0
        avg_age_change = ((avg_deal_age - prev_avg_age) / prev_avg_age * 100) if prev_avg_age > 0 else 0

        # Win rate and MoM change
        closed_total = won_count + lost_count
        win_rate = round((won_count / closed_total * 100), 1) if closed_total > 0 else 0.0
        # Previous month win/loss within that month
        prev_won = deals_collection.count_documents({
            **base_query,
            "status_id": {"$in": list(won_status_ids)},
            "createdon": {"$gte": prev_month_start.isoformat(), "$lt": prev_month_end.isoformat()}
        }) if won_status_ids else 0
        prev_lost = deals_collection.count_documents({
            **base_query,
            "status_id": {"$in": list(lost_status_ids)},
            "createdon": {"$gte": prev_month_start.isoformat(), "$lt": prev_month_end.isoformat()}
        }) if lost_status_ids else 0
        prev_closed = prev_won + prev_lost
        prev_win_rate = (prev_won / prev_closed * 100) if prev_closed > 0 else 0.0
        win_rate_change = win_rate - prev_win_rate

        # Deal penetration across accounts: accounts with at least one deal / total accounts
        try:
            unique_accounts_with_deals = len(set([doc.get("account_id") for doc in deals_collection.find({**base_query}, {"_id": 0, "account_id": 1}) if doc.get("account_id")]))
            total_accounts = db.accounts.count_documents({"tenant_id": tenant_id, "deleted": {"$ne": 1}})
            deals_penetration = round((unique_accounts_with_deals / total_accounts * 100), 1) if total_accounts > 0 else 0.0
        except Exception:
            deals_penetration = 0.0

        # Simple 7-day line chart of new deals per day
        line_chart_data = []
        for i in range(7):
            day_start = (now_dt - timedelta(days=6 - i)).replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            cnt = deals_collection.count_documents({
                **base_query,
                "createdon": {"$gte": day_start.isoformat(), "$lt": day_end.isoformat()}
            })
            line_chart_data.append({"value": cnt})

        dashboard_view = [
            {
                "icon": "/icons/breafcase_file.svg",
                "iconClass": "",
                "title": "Total Deals",
                "total": str(total_deals),
                "change": f"{round(total_change, 1)}%",
                "description": f"New This Month: {new_this_month} | Won: {won_count} | Lost: {lost_count} | Deals Penetration: {int(deals_penetration)}%",
                "lineChartData": line_chart_data
            },
            {
                "icon": "/icons/sand_timer.svg",
                "iconClass": "",
                "title": "In Progress",
                "total": str(in_progress),
                "change": f"{('+' if in_progress_change >= 0 else '')}{round(in_progress_change, 1)}%",
                "description": f"",
                "lineChartData": line_chart_data
            },
            {
                "icon": "/icons/calender_months.svg",
                "iconClass": "",
                "title": "Average Deal Age",
                "total": f"{avg_deal_age} Days",
                "change": f"{round(avg_age_change, 1)}%",
                "description": f"",
                "lineChartData": line_chart_data
            },
            {
                "icon": "/icons/winner_cup.svg",
                "iconClass": "",
                "title": "Win Rate",
                "total": f"{win_rate}%",
                "change": f"{('+' if win_rate_change >= 0 else '')}{round(win_rate_change, 1)}%",
                "description": f"",
                "lineChartData": line_chart_data
            }
        ]

        return {
            "status": status.HTTP_200_OK,
            "message": "Deal statistics retrieved successfully",
            "data": dashboard_view,
            "date_range": {
                "from": from_date.isoformat(),
                "to": to_date.isoformat()
            },
            "tenant_id": tenant_id
        }
    except Exception as e:
        return get_error_details(e)

@deals.post("/crm/deals/get-deal-summary-chart-data")
async def get_deal_summary_chart_data(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Returns weekly deals summary data for the dashboard chart
    showing All Deals, Deal-Won, and Deal-Lost.
    
    

    const SummaryChartData = {
    // 🧠 Dummy data for demonstration
    chartData: [
        { day: "Mon", allDeal: 150, dealWon: 150, dealLost: 300 },
        { day: "Tue", allDeal: 300, dealWon: 20, dealLost: 320 },
        { day: "Wed", allDeal: 40, dealWon: 300, dealLost: 340 },
        { day: "Thr", allDeal: 300, dealWon: 60, dealLost: 360 },
        { day: "Fri", allDeal: 500, dealWon: 500, dealLost: 1000 },
        { day: "Sat", allDeal: 220, dealWon: 200, dealLost: 420 },
        { day: "Sun", allDeal: 100, dealWon: 80, dealLost: 20 },
    ],

    chartConfig: {
        title: "Deals Summary - Weekly",
        titleRight: `
                <span class="inline-flex items-center gap-1 mr-3">
                    <span class="inline-block w-[10px] h-[10px] bg-[#5552faff] rounded-xs"></span>
                    All Deal
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
            key: "allDeal",
            label: "All Deal",
            color: "#5552faff",
        },        
        { key: "dealWon", label: "Deal Won", color: "#8DD3A0" },
        { key: "dealLost", label: "Deal Lost", color: "#ED7F7A" },
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
        tenant_id = int(user_detail.get("tenant_id", 0))
        base_query = {"tenant_id": tenant_id, "deleted": {"$ne": 1}}

        # Calculate date range: last 7 days from current date (going backwards)
        now_dt = datetime.utcnow().replace(tzinfo=None)
        # Start from 7 days ago at 00:00:00
        range_start = (now_dt - timedelta(days=6)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        # End at end of today (start of tomorrow)
        range_end = (now_dt + timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        # Get won/lost status IDs (optimized: only fetch needed fields)
        stages = list(db.deal_status_options.find(
            {"tenant_id": tenant_id, "deleted": {"$ne": 1}},
            {"id": 1, "slug": 1, "title": 1, "_id": 0}
        ))
        won_status_ids = [7]
        lost_status_ids = [8,9]
        # for s in stages:
        #     sid = s.get("id")
        #     if sid is None:
        #         continue
        #     slug = (s.get("slug") or "").lower()
        #     title = (s.get("title") or "").lower()
        #     sid_int = int(sid)
        #     if "won" in slug or "won" in title:
        #         won_status_ids.append(sid_int)
        #     if "lost" in slug or "lost" in title:
        #         lost_status_ids.append(sid_int)

        # Optimized aggregation pipeline for weekly data with live status counting
        agg_pipeline = [
            {"$match": base_query},
            {
                "$addFields": {
                    "created_dt": {
                        "$cond": {
                            "if": {"$eq": [{"$type": "$createdon"}, "date"]},
                            "then": "$createdon",
                            "else": {
                                "$dateFromString": {
                                    "dateString": {"$toString": "$createdon"},
                                    "onError": None,
                                    "onNull": None
                                }
                            }
                        }
                    },
                    # Convert status_id to int for proper comparison (handle both string and int)
                    "status_id_num": {
                        "$cond": {
                            "if": {"$eq": [{"$type": "$status_id"}, "int"]},
                            "then": "$status_id",
                            "else": {
                                "$cond": {
                                    "if": {"$eq": [{"$type": "$status_id"}, "string"]},
                                    "then": {
                                        "$convert": {
                                            "input": "$status_id",
                                            "to": "int",
                                            "onError": None,
                                            "onNull": None
                                        }
                                    },
                                    "else": None
                                }
                            }
                        }
                    }
                }
            },
            {
                "$match": {
                    "$expr": {
                        "$and": [
                            {"$ne": ["$created_dt", None]},
                            {"$gte": ["$created_dt", range_start]},
                            {"$lt": ["$created_dt", range_end]}
                        ]
                    }
                }
            },
            {
                "$group": {
                    "_id": {
                        "$dateToString": {
                            "format": "%Y-%m-%d",
                            "date": "$created_dt"
                        }
                    },
                    "allDeal": {"$sum": 1},  # Count all deals created on this day
                    "dealWon": {
                        "$sum": {
                            "$cond": [
                                {
                                    "$and": [
                                        {"$ne": ["$status_id_num", None]},
                                        {"$in": ["$status_id_num", won_status_ids]}
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    "dealLost": {
                        "$sum": {
                            "$cond": [
                                {
                                    "$and": [
                                        {"$ne": ["$status_id_num", None]},
                                        {"$in": ["$status_id_num", lost_status_ids]}
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {"$sort": {"_id": 1}}
        ]
        
        # Execute aggregation and get live counts
        agg_by_day = {}
        for doc in deals_collection.aggregate(agg_pipeline):
            day_key = doc["_id"]
            agg_by_day[day_key] = {
                "allDeal": int(doc.get("allDeal", 0)),
                "dealWon": int(doc.get("dealWon", 0)),
                "dealLost": int(doc.get("dealLost", 0))
            }

        from calendar import day_abbr
        chart_data = []

        # Generate chart data for all 7 days with live calculated counts
        for i in range(7):
            day_start = (now_dt - timedelta(days=6 - i)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            day_key = day_start.strftime("%Y-%m-%d")
            day_doc = agg_by_day.get(day_key, {})
            
            # Get live calculated counts from aggregation (default to 0 if no data)
            all_deal_count = int(day_doc.get("allDeal", 0))
            deal_won_count = int(day_doc.get("dealWon", 0))
            deal_lost_count = int(day_doc.get("dealLost", 0))

            chart_data.append({
                "day": day_abbr[day_start.weekday()],  # Mon, Tue, Wed, etc.
                "allDeal": all_deal_count,
                "dealWon": deal_won_count,
                "dealLost": deal_lost_count
            })

        # Calculate dynamic y-axis max (round up to nearest 10 for better visualization)
        max_value = 0
        for d in chart_data:
            max_value = max(
                max_value,
                d.get("allDeal", 0),
                d.get("dealWon", 0),
                d.get("dealLost", 0)
            )
        # Round up to nearest 10, minimum 10
        y_max = max(10, ((max_value // 10) + 1) * 10) if max_value > 0 else 10

        # Chart configuration for area chart
        chart_config = {
            "title": "Deals Summary - Weekly",
            "titleRight": """
                <span class="inline-flex items-center gap-1 mr-3">
                  <span class="inline-block w-[10px] h-[10px] bg-[#5552faff] rounded-xs"></span>
                  All Deal
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
                {"key": "allDeal", "label": "All Deal", "color": "#5552faff"},
                {"key": "dealWon", "label": "Deal-Won", "color": "#8DD3A0"},
                {"key": "dealLost", "label": "Deal-Lost", "color": "#ED7F7A"}
            ],
            "options": {
                "height": 250,
                "yDomain": [0, y_max],
                "xKey": "day",
                "showGrid": True,
                "chartType": "area"  # Specify area chart type
            }
        }

        return {
            "status": status.HTTP_200_OK,
            "message": "Deal summary data retrieved successfully",
            "data": {
                "chartData": chart_data,
                "chartConfig": chart_config,
                "tenant_id": tenant_id,
            },
        }
    except Exception as e:
        return get_error_response(e)


@deals.post("/crm/deals/save")
async def save_deal(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):

    try:
        form = await request.form()
        doc_id = int(form.get("id") or 0)
        
        next_id = doc_id or get_next_id(deals_collection)

        if doc_id == 0:
            # Create new deal
            deal_data = DealCreate()
            deal_data.id = next_id
            deal_data.ukey = str(user_detail['tenant_id']) + "000" + str(next_id)
            deal_data.owner_id = int(form.get("owner_id") or 0)
            deal_data.title = form.get("title", "")
            deal_data.account_id = int(form.get("account_id") or 0)
            deal_data.type_id = form.get("type_id", "")
            deal_data.lead_id = int(form.get("lead_id") or 0)
            deal_data.source_id = int(form.get("source_id") or 0)
            deal_data.lead_source_id = form.get("lead_source_id", "")
            deal_data.contact_id = int(form.get("contact_id") or 0)
            deal_data.amount = int(form.get("amount", 0))
            deal_data.closing_date = form.get("closing_date", "")
            deal_data.status_id = form.get("status_id", "")
            deal_data.probability = int(form.get("probability", 0))
            deal_data.expected_revenue = int(form.get("expected_revenue", 0))
            deal_data.campaign_source_id = form.get("campaign_source_id", "")
            deal_data.description = form.get("description", "")
            deal_data.tenant_id = user_detail["tenant_id"]
            deal_data.user_id = user_detail["id"]
            deal_data.active = int(form.get("active") or 1)
            deal_data.sort_by = int(form.get("sort_by") or 0)
            
            # Check for duplicate deals before inserting
            # Duplicate criteria: same title + (account_id or contact_id) within same tenant
            if deal_data.title:
                duplicate_query = {
                    "tenant_id": deal_data.tenant_id,
                    "deleted": {"$ne": 1},
                    "title": deal_data.title
                }
                
                # Build conditions for account_id or contact_id match
                duplicate_conditions = []
                if deal_data.account_id and deal_data.account_id > 0:
                    duplicate_conditions.append({"account_id": deal_data.account_id})
                if deal_data.contact_id and deal_data.contact_id > 0:
                    duplicate_conditions.append({"contact_id": deal_data.contact_id})
                
                if duplicate_conditions:
                    duplicate_query["$or"] = duplicate_conditions
                    
                    existing_deal = deals_collection.find_one(duplicate_query, NO_ID_PROJECTION)
                    
                    if existing_deal:
                        duplicate_fields = ["title"]
                        if deal_data.account_id and existing_deal.get("account_id") == deal_data.account_id:
                            duplicate_fields.append("account_id")
                        if deal_data.contact_id and existing_deal.get("contact_id") == deal_data.contact_id:
                            duplicate_fields.append("contact_id")
                        
                        return {
                            "status": status.HTTP_409_CONFLICT,
                            "message": f"Duplicate deal found with matching {', '.join(duplicate_fields)}. Deal ID: {existing_deal.get('id')}",
                            "data": {
                                "duplicate_deal_id": existing_deal.get("id"),
                                "duplicate_fields": duplicate_fields
                            }
                        }
            
            deals_collection.insert_one(deal_data.dict())
            
            # Log activity for deal creation
            log_activity(
                activity_type="deal_created",
                entity_type="deal",
                entity_id=int(deal_data.id),
                user_detail=user_detail,
                title=f"Deal created: {deal_data.title or 'Untitled Deal'}",
                description=f"Deal created: {deal_data.title or 'Untitled Deal'}",
                metadata={
                    "deal_id": deal_data.id,
                    "title": deal_data.title,
                    "owner_id": deal_data.owner_id,
                    "account_id": deal_data.account_id,
                    "contact_id": deal_data.contact_id,
                    "amount": deal_data.amount,
                    "status_id": deal_data.status_id,
                    "probability": deal_data.probability,
                    "closing_date": deal_data.closing_date,
                    "source_id": deal_data.source_id
                }
            )
            
            return {
                "status": status.HTTP_200_OK,
                "message": "Deal created successfully",
                "data": convert_to_jsonable(deal_data.dict())
            }
        else:
            # Update existing deal
            deal_data = DealUpdate()
            deal_data.id = doc_id
            deal_data.owner_id = int(form.get("owner_id") or 0)
            deal_data.title = form.get("title", "")
            deal_data.account_id = int(form.get("account_id") or 0)
            deal_data.type_id = form.get("type_id", "")
            deal_data.lead_source_id = form.get("lead_source_id", "")
            deal_data.contact_id = int(form.get("contact_id") or 0)
            deal_data.amount = int(form.get("amount", 0))
            deal_data.source_id = int(form.get("source_id") or 0)
            deal_data.closing_date = form.get("closing_date", "")
            deal_data.status_id = form.get("status_id", "")
            deal_data.probability = int(form.get("probability", 0))
            deal_data.expected_revenue = int(form.get("expected_revenue", 0))
            deal_data.campaign_source_id = form.get("campaign_source_id", "")
            deal_data.description = form.get("description", "")
            deal_data.tenant_id = user_detail["tenant_id"]
            deal_data.user_id = user_detail["id"]
            deal_data.active = int(form.get("active") or 1)
            deal_data.sort_by = int(form.get("sort_by") or 0)
            
            deals_collection.update_one(
                {"id": doc_id, "tenant_id": user_detail["tenant_id"]}, 
                {"$set": deal_data.dict()}
            )
            
            # Log activity for deal update
            log_activity(
                activity_type="deal_updated",
                entity_type="deal",
                entity_id=int(deal_data.id),
                user_detail=user_detail,
                title=f"Deal updated: {deal_data.title or 'Untitled Deal'}",
                description=f"Deal updated: {deal_data.title or 'Untitled Deal'}",
                metadata={
                    "deal_id": deal_data.id,
                    "title": deal_data.title,
                    "owner_id": deal_data.owner_id,
                    "account_id": deal_data.account_id,
                    "contact_id": deal_data.contact_id,
                    "amount": deal_data.amount,
                    "status_id": deal_data.status_id,
                    "probability": deal_data.probability,
                    "closing_date": deal_data.closing_date,
                    "source_id": deal_data.source_id
                }
            )

            return {
                "status": status.HTTP_200_OK,
                "message": "Deal updated successfully",
                "data": convert_to_jsonable(deal_data.dict())
            }
                
    except Exception as e:
        return get_error_details(e)


# @deals.post("/crm/deals/save")
# async def save_deal(
#     request: Request,
#     user_detail: dict = Depends(oauth2.get_user_by_token)
# ):
#     """
#     Create or update a deal (form or JSON).
#     """
#     try:
#         # Try parsing JSON, fallback to form
#         try:
#             payload = await request.json()
#         except Exception:
#             form = await request.form()
#             payload = dict(form)

#         doc_id = int(payload.get("id") or 0)
#         tenant_id = int(user_detail.get("tenant_id", 0))
#         user_id = int(user_detail.get("id", 0))

#         # Helper converters
#         def to_int(v, default=0):
#             try:
#                 return int(v) if v not in (None, "", "null") else default
#             except:
#                 return default

#         def to_str(v, default=""):
#             return str(v).strip() if v not in (None, "null") else default

#         # Prepare clean data
#         data = {
#             "id": doc_id or get_next_id(deals_collection),
#             "ukey": f"{tenant_id}000{doc_id or get_next_id(deals_collection)}",
#             "owner_id": to_int(payload.get("owner_id")),
#             "title": to_str(payload.get("title")),
#             "type_id": to_int(payload.get("type_id")),
#             "contact_id": to_int(payload.get("contact_id")),
#             "source_id": to_int(payload.get("source_id")),
#             "account_id": to_int(payload.get("account_id")),
#             "amount": to_str(payload.get("amount")),
#             "closing_date": to_str(payload.get("closing_date")),
#             "status_id": to_int(payload.get("status_id")),
#             "probability": to_str(payload.get("probability")),
#             "expected_revenue": to_str(payload.get("expected_revenue")),
#             "description": to_str(payload.get("description")),
#             "tenant_id": tenant_id,
#             "user_id": user_id
            
#         }

#         # Insert or update
#         if doc_id == 0:
#             createdon = datetime.now(timezone.utc).isoformat()
#             data["createdon"] = createdon   
#             deals_collection.insert_one(data)
#             action = "created"
#         else:
            
#             data["updatedon"] = datetime.now(timezone.utc).isoformat()
            
#             deals_collection.update_one(
#                 {"id": doc_id, "tenant_id": tenant_id},
#                 {"$set": data},
#                 upsert=False
#             )
#             action = "updated"


#         # Activity log (non-blocking)
#         log_activity(
#             activity_type=f"deal_{action}",
#             entity_type="deal",
#             entity_id=int(data["id"]),
#             user_detail=user_detail,
#             title=f"Deal {action}: {data.get('name') or data.get('title') or 'Unnamed'}",
#             description=f"Deal {action}: {data.get('name') or data.get('title') or 'Unnamed'}",
#             metadata={
#                 "account_id": data["id"],
#                 "title": data.get("title"),
#                 "owner_id": data.get("owner_id"),
#                 "type_id": data.get("type_id"),
#             }
#         )

#         enriched_data = enrich_data(data, user_detail)



#         return {
#             "status": status.HTTP_200_OK,
#             "message": f"Deal {action} successfully",
#             "data": convert_to_jsonable(enriched_data),
#         }

#     except Exception as e:
#         return get_error_details(e)


@deals.get("/crm/deals/details/get/{id}")
async def get_deal_details_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    return get_entity_details("deal", id, user_detail)



@deals.post("/crm/deals/get-grouped-by-status")
async def get_grouped_by_status(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    """
    Fetch deal statuses and group deals according to those statuses.
    Applies the same filters as the deals listing endpoint and optionally enriches
    grouped results with owner/account/user details.
    """
    try:
        try:
            payload = await request.json()
        except Exception:
            form = await request.form()
            payload = dict(form)

        include_enrichment = str(payload.get("include_enrichment", "true")).lower() == "true"
        tenant_id = user_detail["tenant_id"]

        view = str(payload.get("view", "all_deals")).strip()
        title = str(payload.get("title", "")).strip()
        email = str(payload.get("email", "")).strip()
        phone = str(payload.get("phone", "")).strip()
        amount = str(payload.get("amount", "")).strip()
        probability = str(payload.get("probability", "")).strip()
        expected_revenue = str(payload.get("expected_revenue", "")).strip()
        created_date = str(payload.get("created_date", "")).strip()
        closing_date = str(payload.get("closing_date", "")).strip()
        last_activity = str(payload.get("last_activity", "")).strip()
        status_id = str(payload.get("status_id", "")).strip()
        owner_id = str(payload.get("owner_id", "")).strip()
        contact_id = str(payload.get("contact_id", "")).strip()
        source_id = str(payload.get("source_id", "")).strip()
        campaign_source_id = str(payload.get("campaign_source_id", "")).strip()

        base_query = build_deals_filter_query(
            user_detail,
            view,
            title,
            email,
            phone,
            amount,
            probability,
            expected_revenue,
            created_date,
            closing_date,
            last_activity,
            status_id,
            owner_id,
            contact_id,
            source_id,
            campaign_source_id
        )

        statuses_cursor = db.deal_status_options.find(
            {"deleted": {"$ne": 1}},
            NO_ID_PROJECTION
        ).sort("sort_by", 1)
        statuses = [status_doc for status_doc in statuses_cursor if status_doc.get("id") is not None]
        if not statuses:
            statuses = [
                {"id": 1, "title": "New"},
                {"id": 2, "title": "Qualified"},
                {"id": 3, "title": "Proposal"},
                {"id": 4, "title": "Negotiation"},
                {"id": 5, "title": "Closed Won"},
                {"id": 6, "title": "Closed Lost"},
            ]

        status_map = {str(status_doc["id"]): status_doc for status_doc in statuses}

        pipeline = [
            {"$match": base_query},
            {"$group": {
                "_id": "$status_id",
                "total_deals": {"$sum": 1},
                "deal_ids": {"$addToSet": "$id"}
            }},
            {"$sort": {"_id": 1}},
        ]
        groups = list(deals_collection.aggregate(pipeline))

        deals_by_status = {
            str(group.get("_id") if group.get("_id") is not None else "unknown"): {
                "total_deals": group.get("total_deals", 0),
                "deal_ids": group.get("deal_ids", []),
            }
            for group in groups
        }

        all_deal_ids = [
            deal_id
            for group in deals_by_status.values()
            for deal_id in group.get("deal_ids", [])
        ]

        enriched_map: Dict[int, Dict[str, Any]] = {}
        if include_enrichment and all_deal_ids:
            enrichment_query = dict(base_query)
            enrichment_query.pop("id", None)
            enrichment_query["id"] = {"$in": all_deal_ids}

            enriched_docs = list(deals_collection.find(enrichment_query, NO_ID_PROJECTION))
            for deal_doc in enriched_docs:
                deal_id_value = deal_doc.get("id")
                if deal_id_value is None:
                    continue
                enriched_deal = dict(deal_doc)
                enriched_deal["account_details"] = db.accounts.find_one(
                    {
                        "id": deal_doc.get("account_id"),
                        "tenant_id": tenant_id,
                        "deleted": {"$ne": 1}
                    },
                    NO_ID_PROJECTION
                ) or {}
                enriched_deal["owner_details"] = db.users.find_one(
                    {
                        "id": deal_doc.get("owner_id")
                    },
                    NO_ID_PROJECTION
                ) or {}
                enriched_deal["user_details"] = db.users.find_one(
                    {
                        "id": deal_doc.get("user_id")
                    },
                    NO_ID_PROJECTION
                ) or {}
                enriched_deal["last_activity_date"] = get_last_activity_date("deal", deal_id_value)
                enriched_map[deal_id_value] = enriched_deal

        grouped_data = []
        total_deals_count = 0
        processed_status_ids: Set[str] = set()

        for status_doc in statuses:
            status_id_value = status_doc.get("id")
            if status_id_value is None:
                continue
            status_id_str = str(status_id_value)
            status_data = deals_by_status.get(status_id_str, {"total_deals": 0, "deal_ids": []})

            group_result: Dict[str, Any] = {
                "id": status_id_value,
                "title": status_doc.get("title", ""),
                "total_deals": status_data.get("total_deals", 0),
            }

            if include_enrichment:
                group_result["deals"] = [
                    enriched_map[deal_id]
                    for deal_id in status_data.get("deal_ids", [])
                    if deal_id in enriched_map
                ]
            else:
                group_result["deal_ids"] = status_data.get("deal_ids", [])

            grouped_data.append(group_result)
            total_deals_count += status_data.get("total_deals", 0)
            processed_status_ids.add(status_id_str)

        for status_id_str, status_data in deals_by_status.items():
            if status_id_str in processed_status_ids:
                continue

            total_for_status = status_data.get("total_deals", 0)
            if total_for_status == 0:
                continue

            status_id_int = int(status_id_str) if status_id_str.isdigit() else status_id_str
            status_entry = status_map.get(status_id_str)
            if status_entry is None and isinstance(status_id_int, int):
                status_entry = db.deal_status_options.find_one(
                    {"id": status_id_int, "deleted": {"$ne": 1}},
                    NO_ID_PROJECTION
                )

            group_title = (status_entry or {}).get("title", f"Unknown Status ({status_id_str})")
            fallback_result: Dict[str, Any] = {
                "id": (status_entry or {}).get("id", status_id_int),
                "title": group_title,
                "total_deals": total_for_status,
            }

            if include_enrichment:
                fallback_result["deals"] = [
                    enriched_map[deal_id]
                    for deal_id in status_data.get("deal_ids", [])
                    if deal_id in enriched_map
                ]
            else:
                fallback_result["deal_ids"] = status_data.get("deal_ids", [])

            grouped_data.append(fallback_result)
            total_deals_count += total_for_status
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Deals grouped by status retrieved successfully",
            "data": convert_to_jsonable(grouped_data),
            "summary": {
                "total_deals": total_deals_count,
                "total_status_groups": len(grouped_data),
                "enrichment_enabled": include_enrichment,
            },
            "filters_applied": {
                "view": view,
                "title": title,
                "email": email,
                "phone": phone,
                "amount": amount,
                "probability": probability,
                "expected_revenue": expected_revenue,
                "created_date": created_date,
                "closing_date": closing_date,
                "last_activity": last_activity,
                "status_id": status_id,
                "owner_id": owner_id,
                "contact_id": contact_id,
                "source_id": source_id,
                "campaign_source_id": campaign_source_id,
            },
            "query": convert_to_jsonable(base_query),
        }
    except Exception as e:
        return get_error_details(e)

@deals.post("/crm/deals/get-by-view-id")
async def get_deals_by_view_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        query = {
            "tenant_id": user_detail["tenant_id"],
            "deleted": {"$ne": 1}
        }

        if id == 2:
            query["lead_owner"] = user_detail["id"]

        if id == 3:
            today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            tomorrow = today + timedelta(days=1)
            query["created_at"] = {"$gte": today, "$lt": tomorrow}

        records = list(
            deals_collection
            .find(query, NO_ID_PROJECTION)
            .sort("id", -1)
        )

        return json_response("Records retrieved successfully", records)

    except Exception as e:
        return get_error_response(e)



# Deals Filter Query

# Build query
def parse_numeric_or_range(value: str, field_name: str) -> dict:
    """Parse numeric value or range string into a MongoDB condition."""
    if not value:
        return {}
    try:
        if "-" in value:
            low_str, high_str = [v.strip() for v in value.split("-", 1)]
            cond: Dict[str, Any] = {}
            if low_str:
                cond["$gte"] = float(low_str)
            if high_str:
                cond["$lte"] = float(high_str)
            return {field_name: cond} if cond else {}
        return {field_name: float(value)}
    except Exception:
        return {field_name: {"$regex": value, "$options": "i"}}

def parse_probability_filter(value: str) -> dict:
    """
    Parse probability filter - only supports >70% and <30%.
    Converts both stored probability (e.g., "80%") and filter value to integers for comparison.
    """
    if not value:
        return {}
    
    value = str(value).strip().lower()
    
    # Helper to convert stored probability to integer
    # Handles both "80%" (string) and 80 (number) formats
    def extract_probability_int():
        """Convert probability field to integer, handling '80%' format with error handling."""
        return {
            "$toInt": {
                "input": {
                    "$toDouble": {
                        "input": {
                            "$replaceOne": {
                                "input": {"$toString": "$probability"},
                                "find": "%",
                                "replacement": ""
                            }
                        },
                        "onError": 0,
                        "onNull": 0
                    }
                },
                "onError": 0,
                "onNull": 0
            }
        }
    
    # Only support >70% and <30%
    if value == ">70%" or value == ">70":
        return {
            "$expr": {
                "$and": [
                    {"$ne": ["$probability", None]},
                    {"$ne": ["$probability", ""]},
                    {
                        "$gt": [
                            extract_probability_int(),
                            70
                        ]
                    }
                ]
            }
        }
    elif value == "<30%" or value == "<30":
        return {
            "$expr": {
                "$and": [
                    {"$ne": ["$probability", None]},
                    {"$ne": ["$probability", ""]},
                    {
                        "$lt": [
                            extract_probability_int(),
                            30
                        ]
                    }
                ]
            }
        }
    
    # Return empty filter if value doesn't match supported conditions
    return {}

def build_deals_filter_query(
    user_detail: dict,
    view: str = "all_deals",
    title: str = "",
    email: str = "",
    phone: str = "",
    amount: int = 0,
    probability: int = 0,
    expected_revenue: str = "",
    created_date: str = "",
    closing_date: str = "",
    last_activity: str = "",
    status_id: str = "",
    owner_id: str = "",
    contact_id: str = "",
    source_id: str = "",
    campaign_source_id: str = "",
) -> dict:
    """Build MongoDB query for filtering deals based on various criteria."""
    tenant_id = user_detail["tenant_id"]
    q: Dict[str, Any] = {"tenant_id": tenant_id, "deleted": {"$ne": 1}}

    # Parse and filter by created_date (exact calendar date)
    if created_date:
        try:
            # Accept either full ISO timestamp or YYYY-MM-DD
            date_part = created_date[:10]
            # Validate date format strictly as YYYY-MM-DD
            date_only = datetime.strptime(date_part, "%Y-%m-%d").date()

            # Build a day range in UTC
            start_of_day = datetime(date_only.year, date_only.month, date_only.day)
            end_of_day = start_of_day + timedelta(days=1)

            # Match any records whose created_at or createdon falls exactly on that date
            # Use $or to handle different date field formats (created_at vs createdon)
            q["$or"] = q.get("$or", [])
            q["$or"].extend([
                {"created_at": {"$gte": start_of_day, "$lt": end_of_day}},
                {"createdon": {"$gte": start_of_day.isoformat(), "$lt": end_of_day.isoformat()}},
                {
                    "$expr": {
                        "$and": [
                            {"$gte": [{"$toDate": "$created_at"}, start_of_day]},
                            {"$lt": [{"$toDate": "$created_at"}, end_of_day]}
                        ]
                    }
                },
                {
                    "$expr": {
                        "$and": [
                            {"$gte": [{"$toDate": "$createdon"}, start_of_day]},
                            {"$lt": [{"$toDate": "$createdon"}, end_of_day]}
                        ]
                    }
                }
            ])
        except Exception as e:
            # If parsing fails, ignore the created_date filter
            print(f"Error parsing created_date: {e}")

    # Store last_activity duration for later processing (after view filters)
    last_activity_duration = None
    if last_activity in ["last_24_hours", "last_7_days", "last_30_days"]:
        last_activity_duration = last_activity

    # View filters
    if view == "my_deals":
        q["owner_id"] = int(user_detail.get("id", 0))
    elif view == "favorite_deals":
        q["favorite"] = 1
    elif view == "no_recent_activity":
        twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
        date_filter = {
            "$or": [
                {"createdon": {"$gte": twenty_four_hours_ago.isoformat() + "+00:00"}},
                {
                    "$expr": {
                        "$gte": [
                            {"$convert": {"input": "$createdon", "to": "date", "onError": None, "onNull": None}},
                            twenty_four_hours_ago,
                        ]
                    }
                },
            ]
        }
        active_ids = db.activity_logs.distinct(
            "entity_id",
            {
                "entity_type": "deal",
                "tenant_id": tenant_id,
                "deleted": {"$ne": 1},
                **date_filter,
            },
        )
        active_ids = [int(eid) for eid in active_ids if eid is not None]
        if active_ids:
            q["id"] = {"$nin": active_ids}
    elif view == "overdue_closing_date":
        now_dt = datetime.utcnow()
        # Add overdue closing date condition directly (not to $or array)
        q["$expr"] = {
            "$and": [
                {"$ne": ["$closing_date", None]},
                {"$ne": ["$closing_date", ""]},
                {
                "$lt": [
                    {"$convert": {"input": "$closing_date", "to": "date", "onError": None, "onNull": None}},
                        now_dt
                    ]
                }
            ]
        }
    elif view == "probability_grater_70":
        q["probability"] = {"$gt": 70}
    elif view == "probability_less_30":
        q["probability"] = {"$lt": 30}
    elif view == "high_value_deals":
        # Fetch top 5 highest amount value deals
        # Use a simpler approach: fetch deals, sort in Python, get top 5 IDs
        try:
            # Fetch all deals for this tenant with amount field
            # Filter out null and empty amounts at database level
            all_deals = list(deals_collection.find(
                {
                    "tenant_id": tenant_id,
                    "deleted": {"$ne": 1},
                    "amount": {"$exists": True, "$ne": None, "$ne": ""}
                },
                {"id": 1, "amount": 1, "_id": 0}
            ))
            
            # Process deals and extract amounts as numeric values
            deals_with_amounts = []
            for deal in all_deals:
                deal_id = deal.get("id")
                amount = deal.get("amount")
                
                # Skip if no valid ID
                if deal_id is None:
                    continue
                
                # Convert deal_id to int
                try:
                    deal_id_int = int(deal_id) if not isinstance(deal_id, int) else deal_id
                except (ValueError, TypeError):
                    continue
                
                # Convert amount to numeric value (amounts are stored as integers)
                amount_numeric = 0
                if amount is not None:
                    if isinstance(amount, (int, float)):
                        amount_numeric = float(amount)
                    elif isinstance(amount, str):
                        try:
                            # Handle string amounts (should be numeric strings)
                            cleaned = str(amount).strip()
                            if cleaned:
                                amount_numeric = float(cleaned)
                        except (ValueError, TypeError):
                            amount_numeric = 0
                
                # Only include deals with amount > 0
                if amount_numeric > 0:
                    deals_with_amounts.append({"id": deal_id_int, "amount": amount_numeric})
            
            # Sort by amount descending, then by ID descending, and get top 5
            deals_with_amounts.sort(key=lambda x: (-x["amount"], -x["id"]))
            top_5_deals = deals_with_amounts[:5]
            top_deal_ids = [deal["id"] for deal in top_5_deals]
            
            if top_deal_ids:
                # Filter query to only include top 5 deals
                q["id"] = {"$in": top_deal_ids}
            else:
                # No deals found with amount > 0, return empty result
                q["id"] = {"$in": []}
        except Exception as e:
            # If processing fails, return empty result
            print(f"Error in high_value_deals filter: {e}")
            q["id"] = {"$in": []}
        
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
            
            # Query activity_logs to get deal IDs with activity in the specified time range
            activity_logs = list(db.activity_logs.find({
                "entity_type": "deal",
                "tenant_id": tenant_id,
                "deleted": {"$ne": 1},
                "createdon": {"$gte": start_time_iso}
            }, {"entity_id": 1}))
            
            # Collect unique deal IDs from activity_logs
            deal_ids = set()
            for activity in activity_logs:
                if activity.get("entity_id"):
                    deal_ids.add(activity["entity_id"])
            
            # Merge with existing query["id"] if it exists (AND logic)
            if "id" in q and "$in" in q["id"]:
                existing_ids = set(q["id"]["$in"])
                deal_ids = deal_ids.intersection(existing_ids)
            elif "id" in q and "$nin" in q["id"]:
                # If we have $nin, we need to exclude deals with activity
                existing_ids = set(q["id"]["$nin"])
                deal_ids = deal_ids - existing_ids
                if deal_ids:
                    q["id"] = {"$in": list(deal_ids)}
                else:
                    q["id"] = {"$in": []}
                return q
            
            # Filter deals by IDs with activity in the specified time range
            if deal_ids:
                q["id"] = {"$in": list(deal_ids)}
            else:
                # No activity found in the time range, return empty result
                q["id"] = {"$in": []}
                
        except Exception as e:
            # If parsing fails, ignore the last_activity filter
            print(f"Error parsing last_activity: {e}")

    # Apply field filters
    if title:
        q["title"] = {"$regex": title, "$options": "i"}
    
    if amount and amount > 0:
        # Match exact amount (handle both string and numeric amounts in DB)
        q["$or"] = q.get("$or", [])
        q["$or"].extend([
            {"amount": amount},  # Exact match for numeric
            {"amount": str(amount)},  # Exact match for string
        ])
    
    if probability:
        q["probability"] = probability
    
    if expected_revenue:
        try:
            expected_revenue_str = str(expected_revenue).strip()
            if expected_revenue_str:
                # Convert to integer for exact value matching
                expected_revenue_int = int(expected_revenue_str)
                if expected_revenue_int > 0:
                    # Match exact expected_revenue value
                    q["expected_revenue"] = expected_revenue_int
        except (ValueError, TypeError):
            # Invalid integer format, skip filter
            pass
    
    # Parse and filter by closing_date (exact calendar date)
    if closing_date:
        try:
            # Parse ISO timestamp or YYYY-MM-DD format
            closing_date_str = str(closing_date).strip()
            
            # Try parsing as full ISO timestamp first
            try:
                # Handle ISO format with timezone (e.g., "2025-12-26T19:00:00.000Z")
                dt = datetime.fromisoformat(closing_date_str.replace('Z', '+00:00'))
                if dt.tzinfo is not None:
                    # Convert to UTC and make naive (remove timezone info)
                    dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
                date_only = dt.date()
            except (ValueError, AttributeError):
                # Fallback to YYYY-MM-DD format
                date_part = closing_date_str[:10]
                date_only = datetime.strptime(date_part, "%Y-%m-%d").date()

            # Build a day range in UTC (start of day to start of next day)
            start_of_day = datetime(date_only.year, date_only.month, date_only.day)
            end_of_day = start_of_day + timedelta(days=1)

            # Match any records whose closing_date falls exactly on that date
            # Use $or to handle different date field formats (ISO strings, date objects, etc.)
            q["$or"] = q.get("$or", [])
            q["$or"].extend([
                # Match ISO string format (with timezone suffix)
                {"closing_date": {"$gte": start_of_day.isoformat() + "+00:00", "$lt": end_of_day.isoformat() + "+00:00"}},
                # Match ISO string format (without timezone)
                {"closing_date": {"$gte": start_of_day.isoformat(), "$lt": end_of_day.isoformat()}},
                # Match using $toDate for date conversion
                {
                    "$expr": {
                        "$and": [
                            {"$ne": ["$closing_date", None]},
                            {"$ne": ["$closing_date", ""]},
                            {"$gte": [{"$toDate": "$closing_date"}, start_of_day]},
                            {"$lt": [{"$toDate": "$closing_date"}, end_of_day]}
                        ]
                    }
                },
                # Match using $convert for string-to-date conversion (handles ISO format strings)
                {
                    "$expr": {
                        "$and": [
                            {"$ne": ["$closing_date", None]},
                            {"$ne": ["$closing_date", ""]},
                            {
                                "$and": [
                                    {"$gte": [
                                        {"$convert": {"input": "$closing_date", "to": "date", "onError": None, "onNull": None}},
                                        start_of_day
                                    ]},
                                    {"$lt": [
                                        {"$convert": {"input": "$closing_date", "to": "date", "onError": None, "onNull": None}},
                                        end_of_day
                                    ]}
                                ]
                            }
                        ]
                    }
                }
            ])
        except Exception as e:
            # If parsing fails, ignore the closing_date filter
            print(f"Error parsing closing_date: {e}")
    
    if owner_id and str(owner_id).isdigit():
        q["owner_id"] = int(owner_id)
    
    if contact_id and str(contact_id).isdigit():
        q["contact_id"] = int(contact_id)
    
    if status_id and str(status_id).isdigit():
        q["status_id"] = int(status_id)
    
    if source_id and str(source_id).isdigit():
        q["source_id"] = int(source_id)
    
    if campaign_source_id and str(campaign_source_id).isdigit():
        q["campaign_source_id"] = int(campaign_source_id)

    # Search email and phone in related accounts and contacts
    account_ids_from_search, contact_ids_from_search = search_accounts_contacts_by_email_phone(
        email=email,
        phone=phone,
        tenant_id=user_detail.get("tenant_id")
    )
    
    # Filter deals by matching account_id or contact_id
    if account_ids_from_search or contact_ids_from_search:
        deal_conditions = []
        
        # Handle account_id filtering
        if account_ids_from_search:
            # If we already have account_id filter, intersect with it
            if "account_id" in q:
                existing_account_id = q.pop("account_id")  # Remove existing to replace with intersected result
                if isinstance(existing_account_id, int):
                    existing_account_id_int = int(existing_account_id)
                    if existing_account_id_int in account_ids_from_search:
                        deal_conditions.append({"account_id": existing_account_id_int})
                    else:
                        # No match, return empty result
                        q["id"] = {"$in": []}
                        return q
                elif isinstance(existing_account_id, dict) and "$in" in existing_account_id:
                    # Intersect with existing $in
                    existing_ids = set()
                    for id_val in existing_account_id["$in"]:
                        try:
                            existing_ids.add(int(id_val))
                        except (ValueError, TypeError):
                            continue
                    matching = existing_ids.intersection(account_ids_from_search)
                    if matching:
                        deal_conditions.append({"account_id": {"$in": list(matching)}})
                    else:
                        q["id"] = {"$in": []}
                        return q
            else:
                deal_conditions.append({"account_id": {"$in": list(account_ids_from_search)}})
        
        # Handle contact_id filtering
        if contact_ids_from_search:
            # If we already have contact_id filter, intersect with it
            if "contact_id" in q:
                existing_contact_id = q.pop("contact_id")  # Remove existing to replace with intersected result
                if isinstance(existing_contact_id, int):
                    existing_contact_id_int = int(existing_contact_id)
                    if existing_contact_id_int in contact_ids_from_search:
                        deal_conditions.append({"contact_id": existing_contact_id_int})
                    else:
                        # No match, return empty result
                        q["id"] = {"$in": []}
                        return q
                elif isinstance(existing_contact_id, dict) and "$in" in existing_contact_id:
                    # Intersect with existing $in
                    existing_ids = set()
                    for id_val in existing_contact_id["$in"]:
                        try:
                            existing_ids.add(int(id_val))
                        except (ValueError, TypeError):
                            continue
                    matching = existing_ids.intersection(contact_ids_from_search)
                    if matching:
                        deal_conditions.append({"contact_id": {"$in": list(matching)}})
                    else:
                        q["id"] = {"$in": []}
                        return q
            else:
                deal_conditions.append({"contact_id": {"$in": list(contact_ids_from_search)}})
        
        # Combine account_id and contact_id conditions with $or (deals match if linked to matching account OR contact)
        if deal_conditions:
            if len(deal_conditions) == 1:
                # Single condition, add directly to query
                q.update(deal_conditions[0])
            else:
                # Multiple conditions, use $or to match deals with either matching account_id OR contact_id
                # If we already have $or conditions (e.g., from date filters), wrap in $and
                if "$or" in q and len(q["$or"]) > 0:
                    existing_or = q.pop("$or")
                    q["$and"] = q.get("$and", [])
                    q["$and"].append({"$or": existing_or})
                    q["$and"].append({"$or": deal_conditions})
                else:
                    q["$or"] = deal_conditions
    elif email or phone:
        # Email/phone provided but no matching accounts or contacts found, return empty result
        q["id"] = {"$in": []}
        return q

    # Clean up query structure
    # If we have $and with only one condition, simplify it
    if "$and" in q and isinstance(q["$and"], list):
        if len(q["$and"]) == 0:
            q.pop("$and")
        elif len(q["$and"]) == 1:
            # Single $and condition can be merged
            and_condition = q.pop("$and")[0]
            if isinstance(and_condition, dict):
                # Merge the condition into the query
                for key, value in and_condition.items():
                    if key == "$or" and "$or" in q:
                        # Merge $or arrays
                        if isinstance(q["$or"], list) and isinstance(value, list):
                            q["$or"].extend(value)
                    else:
                        q[key] = value
    
    # Clean up $or if it's empty
    if "$or" in q and isinstance(q["$or"], list) and len(q["$or"]) == 0:
        q.pop("$or")

    return q

@deals.post("/crm/deals/get")
async def get_deals(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        try:
            payload = await request.json()
        except Exception:
            try:
                payload = dict(await request.form())
            except Exception:
                payload = {}

        page = 1
        limit = 20
        try:
            page = int(payload.get("page", 1))
        except Exception:
            page = 1
        try:
            limit = int(payload.get("limit", 20))
        except Exception:
            limit = 20
        if limit <= 0:
            limit = 20
        if page <= 0:
            page = 1
        skip = (page - 1) * limit

        # Extract filters
        view = str(payload.get("view", "all_deals")).strip()
        title = str(payload.get("title", "")).strip()
        email = str(payload.get("email", "")).strip()
        phone = str(payload.get("phone", "")).strip()
        # Safely convert amount to int, handling empty strings
        amount_str = str(payload.get("amount", "")).strip()
        try:
            amount = int(amount_str) if amount_str else 0
        except (ValueError, TypeError):
            amount = 0
        # Safely convert probability to int, handling empty strings
        probability_str = str(payload.get("probability", "")).strip()
        try:
            probability = int(probability_str) if probability_str else 0
        except (ValueError, TypeError):
            probability = 0
        
        expected_revenue = str(payload.get("expected_revenue", "")).strip()
        created_date = str(payload.get("created_date", "")).strip()
        closing_date = str(payload.get("closing_date", "")).strip()
        last_activity = str(payload.get("last_activity", "")).strip()
        status_id = str(payload.get("status_id", "")).strip()
        owner_id = str(payload.get("owner_id", "")).strip()
        contact_id = str(payload.get("contact_id", "")).strip()
        source_id = str(payload.get("source_id", "")).strip()
        campaign_source_id = str(payload.get("campaign_source_id", "")).strip()

        
        base_query = build_deals_filter_query(user_detail, view, title, email, phone, amount, probability, expected_revenue, created_date, closing_date, last_activity, status_id, owner_id, contact_id, source_id, campaign_source_id)
        
        total_count = deals_collection.count_documents(base_query)
        cursor = deals_collection.find(base_query, NO_ID_PROJECTION).sort("id", -1).skip(skip).limit(limit)
        deals = list(cursor)

        records = []
        if deals:
            # Batch enrich to avoid N+1 queries
            owner_ids = list({d.get("owner_id") for d in deals if d.get("owner_id")})
            user_ids = list({d.get("user_id") for d in deals if d.get("user_id")})
            account_ids = list({d.get("account_id") for d in deals if d.get("account_id")})
            contact_ids = list({d.get("contact_id") for d in deals if d.get("contact_id")})

            owners_map = {u.get("id"): u for u in db.users.find({"id": {"$in": owner_ids}}, NO_ID_PROJECTION)} if owner_ids else {}
            users_map = {u.get("id"): u for u in db.users.find({"id": {"$in": user_ids}}, NO_ID_PROJECTION)} if user_ids else {}
            accounts_map = {a.get("id"): a for a in db.accounts.find({"id": {"$in": account_ids}}, NO_ID_PROJECTION)} if account_ids else {}
            contacts_map = {c.get("id"): c for c in db.contacts.find({"id": {"$in": contact_ids}}, NO_ID_PROJECTION)} if contact_ids else {}
            

            for deal in deals:
                deal["owner_details"] = owners_map.get(deal.get("owner_id"), {})
                deal["user_details"] = users_map.get(deal.get("user_id"), {})
                deal["account_details"] = accounts_map.get(deal.get("account_id"), {})
                deal["contact_details"] = contacts_map.get(deal.get("contact_id"), {})
                deal["last_activity_date"] = get_last_activity_date( "deal",deal.get("id"),int(user_detail.get("tenant_id")))
                
                records.append(deal)

        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": convert_to_jsonable(records),
            "filters_applied": {
                "view": view,
                "title": title,
                "email": email,
                "phone": phone,
                "amount": amount,
                "probability": probability,
                "expected_revenue": expected_revenue,
                "created_date": created_date,
                "closing_date": closing_date,
                "last_activity": last_activity,
                "status_id": status_id,
                "owner_id": owner_id,
                "contact_id": contact_id,
                "source_id": source_id,
                "campaign_source_id": campaign_source_id,
            },
            "pagination": {
                "page": page,
                "limit": limit,
                "total_count": total_count,
                "total_pages": (total_count + limit - 1) // limit,
                "returned_count": len(records),
            }
        }
    except Exception as e:
        return get_error_details(e)


@deals.get("/crm/deals/{id}/favorite/{value}")
async def toggle_deal_favorite(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Toggle favorite flag for a deal (0/1) similar to accounts.
    """
    try:
        deals_collection.update_one(
            {"id": id, "tenant_id": user_detail["tenant_id"]}, 
            {"$set": {"favorite": value}}
        )
        message = "Deal marked as favorite" if value else "Deal unmarked as favorite"
        
        log_activity(
            activity_type="deal_marked_as_favorite" if value else "deal_unmarked_as_favorite",
            entity_type="deal",
            entity_id=id,
            user_detail=user_detail,
            title=f"Deal {'marked as favorite' if value else 'unmarked as favorite'}",
            description=f"Deal {'marked as favorite' if value else 'unmarked as favorite'}",
            metadata={}
        )
        
        return json_response(message)
    except Exception as e:
        return get_error_response(e)


@deals.post("/crm/deals/get-grouped-by-stages")
async def get_deals_grouped_by_stages(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Group deals by stage similar to accounts grouped-by-stage endpoint.
    Returns list of stage groups with totals and optional enrichment.
    """
    try:
        form = await request.form()
        include_enrichment = form.get("include_enrichment", "true").lower() == "true"

        tenant_id = user_detail["tenant_id"]

        # Load stages
        stages = list(
            db.deal_status_options.find({"deleted": {"$ne": 1}}, NO_ID_PROJECTION).sort("sort_by", 1)
        )
        stage_map = {
            str(s.get("id")): {
                "id": s.get("id"),
                "title": s.get("title"),
                "slug": s.get("slug", "")
            }
            for s in stages
        }

        # Aggregate deals by status_id
        pipeline = [
            {"$match": {"tenant_id": tenant_id, "deleted": {"$ne": 1}}},
            {"$sort": {"id": -1}},
            {
                "$group": {
                    "_id": "$status_id",
                    "total_deals": {"$sum": 1},
                    "all_deals": {"$push": "$$ROOT"}
                }
            },
        ]

        aggregation_result = list(deals_collection.aggregate(pipeline))

        deals_by_stage = {}
        all_deal_ids = set()

        for group in aggregation_result:
            stage_key = str(group.get("_id")) if group.get("_id") is not None else "unknown"
            deals_data = group.get("all_deals", [])

            deal_ids = []
            seen_ids = set()
            for d in deals_data:
                did = d.get("id")
                if did and did not in seen_ids:
                    seen_ids.add(did)
                    deal_ids.append(did)
                    all_deal_ids.add(did)

            deals_by_stage[stage_key] = {
                "total_deals": group.get("total_deals", 0),
                "deal_ids": deal_ids
            }

        enriched_deals_map = {}
        if include_enrichment and all_deal_ids:
            enrich_pipeline = [
                {
                    "$match": {
                        "id": {"$in": list(all_deal_ids)},
                        "tenant_id": tenant_id,
                        "deleted": {"$ne": 1},
                    }
                },
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
                        "as": "user_details_array",
                    }
                },
                {
                    "$addFields": {
                        "user_details": {
                            "$ifNull": [{"$arrayElemAt": ["$user_details_array", 0]}, {}]
                        }
                    }
                },
                {
                    "$project": {
                        "_id": 0,
                        "owner_details_array": 0,
                        "user_details_array": 0,
                    }
                },
            ]

            enriched_deals = list(deals_collection.aggregate(enrich_pipeline))
            for deal in enriched_deals:
                did = deal.get("id")
                if did:
                    deal["owner"] = deal.get("owner_details", {})
                    deal["user"] = deal.get("user_details", {})
                    for key in ["owner_details", "user_details"]:
                        if isinstance(deal.get(key), dict):
                            deal[key].pop("_id", None)
                    enriched_deals_map[did] = deal

        grouped_data = []
        total_deals_count = 0

        # Ensure all stage groups included
        for status_id_str, stage_info in stage_map.items():
            stage_data = deals_by_stage.get(status_id_str, {"total_deals": 0, "deal_ids": []})
            result_group = {
                **stage_info,
                "total_deals": stage_data["total_deals"],
                "deals": [],
            }

            if include_enrichment:
                seen_in_group = set()
                for did in stage_data["deal_ids"]:
                    if did not in seen_in_group and did in enriched_deals_map:
                        result_group["deals"].append(enriched_deals_map[did])
                        seen_in_group.add(did)
            else:
                result_group["deal_ids"] = stage_data["deal_ids"]

            grouped_data.append(result_group)
            total_deals_count += stage_data["total_deals"]

        return {
            "status": status.HTTP_200_OK,
            "message": "Deals grouped by stage retrieved successfully",
            "data": convert_to_jsonable(grouped_data),
            "summary": {
                "total_deals": total_deals_count,
                "total_stage_groups": len(stage_map),
                "enrichment_enabled": include_enrichment,
            },
        }
    except Exception as e:
        return get_error_details(e)



@deals.post("/crm/deals/update-stage")
async def update_deal_stage_route(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Update deal stage (status_id) by deal ID. Mirrors accounts update-stage.
    Payload: { "id": 123, "stage": "Closed Won" or stage id/slug/title }
    """
    try:
        try:
            payload = await request.json()
        except Exception:
            form = await request.form()
            payload = dict(form)

        try:
            deal_id = int(payload.get("id"))
        except Exception:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "Valid id is required",
            }
        stage_value = payload.get("stage")  # can be id/slug/title

        # Resolve stage to status_id if needed
        status_id_value = None
        if isinstance(stage_value, int):
            status_id_value = stage_value
        elif isinstance(stage_value, str):
            # Try slug, then title, then int cast
            stage = (
               
                db.deal_status_options.find_one({"title": stage_value}, NO_ID_PROJECTION)
            )
            if stage and stage.get("id") is not None:
                status_id_value = int(stage.get("id"))
            else:
                try:
                    status_id_value = int(stage_value)
                except Exception:
                    status_id_value = None

        update_doc = {"status_id": status_id_value} if status_id_value is not None else {}

        if status_id_value is None:
            return {
                "status": status.HTTP_400_BAD_REQUEST,
                "message": "Valid stage is required",
            }

        deals_collection.update_one(
            {"id": deal_id, "tenant_id": user_detail["tenant_id"]},
            {"$set": update_doc}
        )

        return {
            "status": status.HTTP_200_OK,
            "message": "Deal stage updated successfully",
            "data": convert_to_jsonable(update_doc),
        }

    except Exception as e:
        return get_error_details(e)



@deals.post("/crm/deals/get-deal-status-chart-data")
async def get_deal_status_chart_data(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get deal stage distribution with chart data, counters and insights.
    Optional form fields: from, to (ISO dates). Defaults to today.
    """
    try:
        form = await request.form()

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

        apply_date_filter = False
        exact_date_match = False
        if from_date_str and to_date_str:
            from_date = parse_iso(from_date_str)
            to_date = parse_iso(to_date_str)
            if from_date is not None and to_date is not None:
                apply_date_filter = True
                # If from_date and to_date are the same, use exact date filter (not range)
                if from_date.date() == to_date.date():
                    exact_date_match = True
                    # Set to start of the day for exact date match
                    from_date = from_date.replace(hour=0, minute=0, second=0, microsecond=0)
                    # to_date will be used as start of next day for $lt comparison
                    to_date = from_date + timedelta(days=1)
        # Ensure defaults are UTC-naive to avoid naive/aware subtraction issues
        if not apply_date_filter:
            now_dt = datetime.utcnow().replace(tzinfo=None)
            from_date = now_dt - timedelta(days=1)
            to_date = now_dt + timedelta(days=1)

        base_query = {"deleted": {"$ne": 1}, "tenant_id": tenant_id}

        # Add date filter to base_query if needed
        if apply_date_filter:
            if exact_date_match:
                # Exact date match: filter for the specific day (start of day to start of next day)
                base_query["$expr"] = {
                    "$and": [
                        {"$gte": [
                            {"$convert": {"input": "$createdon", "to": "date", "onError": None, "onNull": None}},
                            from_date
                        ]},
                        {"$lt": [
                            {"$convert": {"input": "$createdon", "to": "date", "onError": None, "onNull": None}},
                            to_date
                        ]}
                    ]
                }
            else:
                # Range filter: from_date to to_date
                base_query["$expr"] = {
                        "$and": [
                            {"$gte": [
                                {"$convert": {"input": "$createdon", "to": "date", "onError": None, "onNull": None}},
                                from_date
                            ]},
                            {"$lte": [
                                {"$convert": {"input": "$createdon", "to": "date", "onError": None, "onNull": None}},
                                to_date
                            ]}
                        ]
                    }

        # Load stage options
        try:
            stages = list(db.deal_status_options.find({"deleted": {"$ne": 1}}, NO_ID_PROJECTION).sort("sort_by", 1))
        except Exception:
            stages = []

        # Aggregate counts by stage within date range (support created_at Date/string and legacy createdon)
        # Handle both status_id and status_id fields, and support both string and int values
        # Use $ifNull to fallback from status_id to status_id, then convert to int
        pipeline = [
            {"$match": {**base_query}}
        ]
        pipeline.extend([
            {
                "$addFields": {
                    "status_id_raw": {"$ifNull": ["$status_id", "$status_id"]}
                }
            },
            {
                "$addFields": {
                    "status_id_num": {
                        "$cond": {
                            "if": {"$eq": [{"$type": "$status_id_raw"}, "int"]},
                            "then": "$status_id_raw",
                            "else": {
                                "$cond": {
                                    "if": {"$eq": [{"$type": "$status_id_raw"}, "string"]},
                                    "then": {
                                        "$convert": {
                                            "input": "$status_id_raw",
                                            "to": "int",
                                            "onError": None,
                                            "onNull": None
                                        }
                                    },
                                    "else": None
                                }
                            }
                        }
                    }
                }
            },
            {"$match": {"status_id_num": {"$ne": None}}},  # Exclude deals without valid status_id
            {"$group": {"_id": "$status_id_num", "count": {"$sum": 1}}}
        ])

        aggregation_result = list(deals_collection.aggregate(pipeline))

        # Build lookup maps for stages (id, slug, title)
        stages_by_id = {str(s.get("id")): s for s in stages if s.get("id") is not None}
        stages_by_slug = {s.get("slug"): s for s in stages if s.get("slug")}
        stages_by_title = {s.get("title"): s for s in stages if s.get("title")}

        # Build counts per stage id; include fallback via count_documents if empty
        counts_map = {}
        total_in_range = 0
        for r in aggregation_result:
            key = r.get("_id")
            count = r.get("count", 0)
            counts_map[str(key)] = count
            total_in_range += count

        if total_in_range == 0 and stages:
            date_filter = {}
            if apply_date_filter:
                date_filter = {
                    "$or": [
                        {"created_at": {"$gte": from_date, "$lte": to_date}},
                        {
                            "$expr": {
                                "$and": [
                                    {"$gte": [{"$convert": {"input": "$created_at", "to": "date", "onError": None, "onNull": None}}, from_date]},
                                    {"$lte": [{"$convert": {"input": "$created_at", "to": "date", "onError": None, "onNull": None}}, to_date]}
                                ]
                            }
                        },
                        {
                            "$expr": {
                                "$and": [
                                    {"$gte": [{"$convert": {"input": "$createdon", "to": "date", "onError": None, "onNull": None}}, from_date]},
                                    {"$lte": [{"$convert": {"input": "$createdon", "to": "date", "onError": None, "onNull": None}}, to_date]}
                                ]
                            }
                        }
                    ]
                }
            for s in stages:
                sid = s.get("id")
                try:
                    sid_int = int(sid)
                except Exception:
                    continue
                # Check both status_id and status_id fields
                stage_query = {
                    "$or": [
                        {"status_id": {"$in": [sid_int, str(sid_int)]}},
                        {"status_id": {"$in": [sid_int, str(sid_int)]}}
                    ]
                }
                c = deals_collection.count_documents({**base_query, **date_filter, **stage_query})
                if c:
                    counts_map[str(sid_int)] = c
                    total_in_range += c

        # Build chart data using stages ordering if available; otherwise, use aggregation keys
        chart_data = []

        def resolve_stage(key: str):
            return stages_by_slug.get(key) or stages_by_id.get(key) or stages_by_title.get(key)

        used_keys = set()
        for s in stages:
            # Preferred key for mapping is slug, then id, then title
            possible_keys = [s.get("slug"), str(s.get("id")), s.get("title")]
            # We rely on numeric stage id in counts_map keys
            match_key = str(s.get("id")) if s.get("id") is not None else None
            count = counts_map.get(str(match_key), 0)
            used_keys.add(str(match_key)) if match_key is not None else None

            title = s.get("title") or s.get("name") or (str(match_key) if match_key is not None else "Unknown")
            # Colors deterministic by index
            color_palette = ["#3B82F6", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6", "#06B6D4"]
            idx = len(chart_data)
            color = color_palette[idx % len(color_palette)]
            percent = int(round((count / total_in_range * 100), 0)) if total_in_range > 0 else 0
            chart_data.append({
                "title": title,
                "value": count,
                "percent": percent,
                "color": color
            })

        # Include any aggregation keys not present in stages definition
        for key, count in counts_map.items():
            if key in used_keys:
                continue
            stage = resolve_stage(key)
            title = (stage.get("title") if stage else None) or key
            color_palette = ["#3B82F6", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6", "#06B6D4"]
            idx = len(chart_data)
            color = color_palette[idx % len(color_palette)]
            percent = int(round((count / total_in_range * 100), 0)) if total_in_range > 0 else 0
            chart_data.append({
                "title": title,
                "value": count,
                "percent": percent,
                "color": color
            })

        total_deals = deals_collection.count_documents(base_query)
        active_deals = deals_collection.count_documents({**base_query, "active": 1})

        insights = {
            "date_range": {"from": from_date.isoformat(), "to": to_date.isoformat()},
            "active_rate": round((active_deals / total_deals * 100), 1) if total_deals > 0 else 0,
        }

        response_data = {
            "chartData": chart_data,
            "counters": [
                {"title": "Total Deals", "value": total_deals, "trend": "neutral"},
                {"title": "Active Deals", "value": active_deals, "trend": "neutral"},
                {"title": "In Range", "value": total_in_range, "trend": "neutral"}
            ],
            "insights": insights,
            "summary": {
                "total_deals": total_deals,
                "active_deals": active_deals,
                "in_range": total_in_range
            }
        }

        return {
            "status": status.HTTP_200_OK,
            "message": "Deal status chart data retrieved successfully",
            "data": response_data,
            "tenant_id": tenant_id
        }

    except Exception as e:
        return get_error_details(e)

@deals.post("/crm/deals/get/{id}")
async def get_deal_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get a single deal by ID.
    """
    try:
        deal = deals_collection.find_one({"id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}}, NO_ID_PROJECTION)
        if deal:
            return {
                "status": status.HTTP_200_OK,
                "message": "Record retrieved successfully",
                "data": convert_to_jsonable(deal)
            }
        return {
            "status": status.HTTP_404_NOT_FOUND,
            "message": "Record not found",
            "data": None
        }
    except Exception as e:
        return get_error_details(e)

@deals.get("/crm/deals/clone/{id}")
async def clone_deal_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        # Find the original deal
        deal = deals_collection.find_one(
            {"id": id, "tenant_id": user_detail["tenant_id"], "deleted": {"$ne": 1}},
            NO_ID_PROJECTION
        )

        if not deal:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Original record not found",
                "data": None
            }

        deal.pop("_id", None)
        old_id = deal.get("id")
        new_id = get_next_id(deals_collection)

        cursor = deals_collection.find(
            {}, NO_ID_PROJECTION
        ).sort("ukey", -1).limit(1)

        latest_doc = next(cursor, None)
        latest_ukey = int(latest_doc["ukey"]) if latest_doc and "ukey" in latest_doc else 9999
        next_ukey = latest_ukey + 1

        # Set new fields
        deal["id"] = new_id
        deal["ukey"] = str(next_ukey)

        # Insert cloned record
        deals_collection.insert_one(deal)

        return {
            "status": status.HTTP_201_CREATED,
            "message": f"Deal (cloned from {old_id}) created successfully",
            "data": convert_to_jsonable(deal)
        }

    except Exception as e:
        return get_error_details(e)

@deals.post("/crm/deals/details/get/{ukey}")
async def get_deal_by_ukey(ukey: str, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        deal = deals_collection.find_one(
            {
                "ukey": str(ukey),
                "tenant_id": user_detail["tenant_id"],
                "deleted": {"$ne": 1}
            },
            NO_ID_PROJECTION
        )

        if deal:
            # Basic owner and user details
            deal["owner_details"] = db.users.find_one({"id": deal.get("owner_id")}, NO_ID_PROJECTION)
            deal["user_details"] = db.users.find_one({"id": deal.get("user_id")}, NO_ID_PROJECTION)

            # Get account details
            deal["account_details"] = db.accounts.find_one({"id": deal.get("account_id")}, NO_ID_PROJECTION)

            # Get contact details
            deal["contact_details"] = db.contacts.find_one({"id": deal.get("contact_id")}, NO_ID_PROJECTION)

            # Get notes for this deal
            deal["notes"] = list(db.notes.find(
                {
                    "related_to": "deals", 
                    "related_to_id": deal.get("id"), 
                    "tenant_id": user_detail["tenant_id"], 
                    "deleted": {"$ne": 1}
                }, 
                NO_ID_PROJECTION
            ).sort("id", -1))

            return {
                "status": status.HTTP_200_OK,
                "message": "Record retrieved successfully",
                "data": convert_to_jsonable(deal)
            }

        return {
            "status": status.HTTP_404_NOT_FOUND,
            "message": "Record not found",
            "data": None
        }

    except Exception as e:
        return get_error_details(e)

@deals.get("/crm/deals/{id}/deleted/{value}")
async def toggle_deal_deletion(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Soft delete or restore a deal by toggling the 'deleted' flag.
    """
    try:
        deals_collection.update_one({"id": id, "tenant_id": user_detail["tenant_id"]}, {"$set": {"deleted": value}})
        message = "Record deleted successfully" if value else "Record restored successfully"
        return {
            "status": status.HTTP_200_OK,
            "message": message,
            "data": None
        }
    except Exception as e:
        return get_error_details(e)

@deals.post("/crm/deals/get-by-account")
async def get_deals_by_account(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    """
    Get deals by account_id.
    """
    try:
        form = await request.form()
        deals = list(deals_collection.find(
            {
                "account_id": int(form["account_id"]), 
                "tenant_id": user_detail["tenant_id"], 
                "deleted": {"$ne": 1}
            }, 
            NO_ID_PROJECTION
        ).sort("id", -1))
        
        records = []
        if deals:
            for deal in deals:
                # Get user information for owner
                owner = db.users.find_one(
                    {"id": deal.get("owner_id")},
                    NO_ID_PROJECTION
                )
                deal["owner"] = owner or {}
                
                # Get user information for user_id
                user = db.users.find_one(
                    {"id": deal.get("user_id")},
                    NO_ID_PROJECTION
                )
                deal["user"] = user or {}
                
                # Get account information
                account = db.accounts.find_one(
                    {"id": deal.get("account_id")},
                    NO_ID_PROJECTION
                )
                deal["account"] = account or {}
                
                # Get contact information
                contact = db.contacts.find_one(
                    {"id": deal.get("contact_id")},
                    NO_ID_PROJECTION
                )
                deal["contact"] = contact or {}
                
                records.append(deal)
        
        return {
            "status": status.HTTP_200_OK,
            "message": "Records retrieved successfully",
            "data": convert_to_jsonable(records)
        }
    except Exception as e:
        return get_error_details(e)

@deals.post("/crm/deals/bulk-delete")
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

        result = deals_collection.update_many(
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
            "message": f"{result.modified_count} deal(s) soft deleted successfully.",
            "modified_count": result.modified_count
        }

    except Exception as e:
        return get_error_details(e)

@deals.post("/crm/deals/bulk-update")
async def bulk_update(
    request: Request,
    user_detail: dict = Depends(oauth2.get_user_by_token)
):
    try:
        form = await request.form()
        ids = json.loads(form.get("ids"))  # stringified array from frontend
        title = form.get("title")
        stage_raw = form.get("stage")
        amount = form.get("amount")
        probability = form.get("probability")

        # Check if at least one field is provided
        if not any([title, stage_raw, amount, probability]):
            return {
                "status": status.HTTP_422_UNPROCESSABLE_ENTITY,
                "message": "At least one of title, stage, amount, or probability must be provided."
            }

        # Parse nested JSON if needed
        stage_value = json.loads(stage_raw) if stage_raw else None

        update_fields = {}
        if title:
            update_fields["title"] = title
        if stage_value and "value" in stage_value:
            update_fields["stage"] = stage_value["value"]
        if amount:
            update_fields["amount"] = amount
        if probability:
            update_fields["probability"] = probability

        # Update records matching ids and tenant
        result = deals_collection.update_many(
            {
                "id": {"$in": ids},
                "tenant_id": user_detail["tenant_id"],
                "deleted": {"$ne": 1}
            },
            {"$set": update_fields}
        )

        return {
            "status": status.HTTP_200_OK,
            "message": f"{result.modified_count} deals updated successfully",
            "updated_count": result.modified_count
        }

    except Exception as e:
        return get_error_details(e)

# ===============================
# CRUD for DEALS - ending
# ===============================




# ==========================================
# CRUD for Departments Setting - starting
# ==========================================
@deals.post("/crm/deals/stages/save")
async def save_stage(request: Request, user_detail: dict = Depends(oauth2.get_user_by_token)):
    request_form = await request.form()
    try:
        if int(request_form["id"]) == 0:
            # Check if stage with same slug exists
            existing = db.deal_status_options.find_one({"title": request_form["title"]})
            if existing:
                return {"status": status.HTTP_302_FOUND, "message": "Stage already exists"}
            
            stage = dict(request_form)
            stage["id"] = int(db.deal_status_options.count_documents({})) + 1
            stage["tenant_id"] = user_detail["tenant_id"]
            stage["active"] = int(request_form.get("active", 1))
            stage["sort_by"] = int(request_form.get("sort_by", 0))
            db.deal_status_options.insert_one(stage)
            return {
                "status": status.HTTP_200_OK, 
                "message": "Stage created successfully", 
                "data": convert_to_jsonable(stage)
            }
        else:
            # Check if stage with same slug exists (excluding current stage)
            existing = db.deal_status_options.find_one({"slug": request_form["slug"], "id": {"$ne": int(request_form["id"])}})
            if existing:
                return {"status": status.HTTP_302_FOUND, "message": "Stage with this slug already exists"}
            
            stage = dict(request_form)
            stage["id"] = int(request_form["id"])
            stage["tenant_id"] = user_detail["tenant_id"]
            stage["active"] = int(request_form.get("active", 1))
            stage["sort_by"] = int(request_form.get("sort_by", 0))
            db.deal_status_options.update_one({"id": int(request_form["id"])}, {"$set": stage})
            return {
                "status": status.HTTP_200_OK, 
                "message": "Stage updated successfully", 
                "data": convert_to_jsonable(stage)
            }
    except Exception as e:
        return get_error_details(e)

@deals.post("/crm/deals/stages/get")
async def get_departments(user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        query = {}
        query["tenant_id"] = user_detail["tenant_id"]
        results = list(db.deal_status_options.find(query, {"_id": 0}).sort("sort_by", 1))
        return {
            "status": status.HTTP_200_OK,
            "message": "Departments retrieved successfully",
            "data": convert_to_jsonable(results)
        }
    except Exception as e:
        return get_error_details(e)

@deals.post("/crm/deals/stages/get/{id}")
async def get_department_by_id(id: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        query = {}
        query["tenant_id"] = user_detail["tenant_id"]
        query["id"] = id
        result = db.deal_status_options.find_one(query, {"_id": 0})
        if result:
            return {
                "status": status.HTTP_200_OK,
                "message": "Stage retrieved successfully",
                "data": convert_to_jsonable(result)
            }
        else:
            return {
                "status": status.HTTP_404_NOT_FOUND,
                "message": "Stage not found",
                "data": None
            }
    except Exception as e:
        return get_error_details(e)

@deals.get("/crm/deals/stages/{id}/deleted/{value}")
async def delete_restore_department(id: int, value: int, user_detail: dict = Depends(oauth2.get_user_by_token)):
    try:
        query = {}
        query["tenant_id"] = user_detail["tenant_id"]
        query["id"] = id
        db.deal_status_options.update_one(query, {"$set": {"deleted": value}})
        message = "Stage deleted successfully" if value else "Stage restored successfully"
        return {
            "status": status.HTTP_200_OK, 
            "message": message, 
            "data": None
        }
    except Exception as e:
        return get_error_details(e)
# ==========================================
# CRUD for Departments Setting - ending
# ==========================================
