import sys
import traceback
from bson import ObjectId
from app.networks.database import db, db_rentify
from fastapi import status
from fastapi.responses import JSONResponse
from fastapi import Form
from fastapi import APIRouter
from random import randint
from typing import Any, Optional
import datetime
try:
    from sendgrid import SendGridAPIClient  # type: ignore
    from sendgrid.helpers.mail import Mail  # type: ignore
except Exception:  # pragma: no cover
    SendGridAPIClient = None  # type: ignore
    Mail = None  # type: ignore


def convert_to_jsonable(data):
    try:
        if isinstance(data, list):
            return [convert_to_jsonable(item) for item in data]
        elif isinstance(data, dict):
            return {k: convert_to_jsonable(v) for k, v in data.items()}
        elif isinstance(data, ObjectId):
            return str(data)
        elif isinstance(data, datetime.datetime):
            return data.isoformat()
        elif isinstance(data, datetime.date):
            return data.isoformat()
        elif data is None:
            return None
        elif isinstance(data, (int, float, str, bool)):
            return data
        else:
            # Handle any other types by converting to string
            return str(data)
    except Exception as e:
        print(f"Error in convert_to_jsonable: {e}")
        return None


def format_percent_value(
    value: Any,
    *,
    include_sign: bool = False,
    decimals: int = 2,
) -> str:
    """
    Format numeric values as percentage strings with configurable precision
    and optional leading sign.
    """
    try:
        numeric_value = float(value)
    except (TypeError, ValueError):
        numeric_value = 0.0

    fmt_sign = "+" if include_sign else ""
    format_string = f"{{:{fmt_sign}.{decimals}f}}%"
    return format_string.format(numeric_value)

def get_error_response(exc: Exception):
    _, _, tb = sys.exc_info()
    trace = traceback.extract_tb(tb)[-1]
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "status": status.HTTP_400_BAD_REQUEST,
            "message": str(exc),
            "error_details": {
                "file": trace.filename,
                "line": trace.lineno
            }
        }
    )

def json_response(message: str, data=None, code=status.HTTP_200_OK):
    return JSONResponse(
        status_code=code,
        content={
            "status": code,
            "message": message,
            "data": convert_to_jsonable(data)
        }
    )

def upsert_document(collection, data: dict, doc_id: int) -> str:
    if doc_id == 0:
        collection.insert_one(data)
        return "Record created successfully"
    else:
        collection.update_one({"id": doc_id}, {"$set": data})
        return "Record updated successfully"

def get_next_id(collection):
    return collection.count_documents({}) + 1

def get_next_vehicle_uid(collection):
    """
    Generate the next vehicle UID in format S000001, S000002, etc.
    """
    # Find the highest existing vehicle_uid that matches the pattern S######
    pipeline = [
        {
            "$match": {
                "vehicle_uid": {"$regex": "^S[0-9]{6}$"}
            }
        },
        {
            "$project": {
                "numeric_part": {
                    "$toInt": {"$substr": ["$vehicle_uid", 1, 6]}
                }
            }
        },
        {
            "$group": {
                "_id": None,
                "max_numeric": {"$max": "$numeric_part"}
            }
        }
    ]
    
    result = list(collection.aggregate(pipeline))
    
    if result and result[0].get("max_numeric"):
        next_number = result[0]["max_numeric"] + 1
    else:
        next_number = 1
    
    # Format as S000001, S000002, etc.
    return f"S{next_number:06d}"

def get_next_affiliate_uid(collection):
    """
    Generate the next affiliate UID in format A000001, A000002, etc.
    """
    # Find the highest existing affiliate_uid that matches the pattern A######
    pipeline = [
        {
            "$match": {
                "affiliate_uid": {"$regex": "^A[0-9]{6}$"}
            }
        },
        {
            "$project": {
                "numeric_part": {
                    "$toInt": {"$substr": ["$affiliate_uid", 1, 6]}
                }
            }
        },
        {
            "$group": {
                "_id": None,
                "max_numeric": {"$max": "$numeric_part"}
            }
        }
    ]
    
    result = list(collection.aggregate(pipeline))
    
    if result and result[0].get("max_numeric"):
        next_number = result[0]["max_numeric"] + 1
    else:
        next_number = 1
    
    # Format as A000001, A000002, etc.
    return f"A{next_number:06d}"

def random_with_n_digits(n):
    range_start = 10 ** (n - 1)
    range_end = (10**n) - 1
    return randint(range_start, range_end)

def sendChangePasswordEmail(SENDER_EMAIL, name, hostname, remember_pin):
    RECEIVER_EMAIL = "noreply@businessesify.com"
    TEMPLATE_ID = "d-e448c92c40614af2bd889bef3106062a"

    try:
        message = Mail(from_email=RECEIVER_EMAIL, to_emails=SENDER_EMAIL)
        message.template_id = TEMPLATE_ID
        message.dynamic_template_data = {
            "subject": "Invitation to join the organization!",
            "name": name,
            "host_name": hostname,
            "temp_password_code": remember_pin,
        }

        message.template_id = TEMPLATE_ID

        sg = SendGridAPIClient(
            "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"
        )
        response = sg.send(message)
        response.status_code
        response.body
        response.headers
        return {"status": status.HTTP_200_OK, "message": str(response.status_code)}

    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST,
            "message": "Something went wrong with the requested data.",
            "line_no": e.__traceback__.tb_lineno,
            "error_message": e,
        }

def get_error_details(e):
    exc_type, exc_obj, exc_tb = sys.exc_info()
    tb = traceback.extract_tb(exc_tb)
    filename = tb[-1][0]
    line_no = tb[-1][1]
    return {
        "status": status.HTTP_400_BAD_REQUEST,
        "message": str(e),
        "error_details": {
            "file": filename,
            "line": line_no
        }
    }
    
def form_body(cls):
    cls.__signature__ = cls.__signature__.replace(
        parameters=[
            arg.replace(default=Form(...))
            for arg in cls.__signature__.parameters.values()
        ]
    )
    return cls    



# ====================================
#  GENERAL FUNCTIONS (HANEEF) - Starting
# ====================================    

def get_last_activity_date(entity_type: str, entity_id: int, tenant_id: Optional[int] = None) -> str:
    """
    Return the latest activity timestamp (createdon) for a given entity.

    Args:
        entity_type: Type of entity (e.g. customer, booking).
        entity_id: Integer ID of the entity.
        tenant_id: Optional tenant scoping for multi-tenant filtering.

    Returns:
        ISO datetime string of the most recent activity, or empty string when not found.
    """
    try:
        query: dict[str, Any] = {
            "entity_type": entity_type,
            "entity_id": entity_id,
            "deleted": {"$ne": 1},"tenant_id": tenant_id
        }
        
        last_activity = (
            db.activity_logs.find(query, {"_id": 0, "createdon": 1})
            .sort("createdon", -1)
            .limit(1)
        )
        result = list(last_activity)
        return result[0].get("createdon", "") if result else ""
    except Exception as exc:
        print(f"Error getting last activity for {entity_type} {entity_id}: {exc}")
        return ""

# ====================================
#  GENERAL FUNCTIONS (HANEEF) - Ending
# ====================================    