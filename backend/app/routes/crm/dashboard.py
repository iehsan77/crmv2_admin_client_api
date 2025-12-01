from fastapi import Request, APIRouter, status, Depends
from app.helpers.globalfunctions import getLastUserId, getCountforApps
from app.networks.database import db
from app.utils import config, oauth2

crm_dashboard = APIRouter(tags=["CRM Admin - Dashboard"])
collection = db.settigs
 

# =============================
# Dashbaord Stats - starting
# =============================
@crm_dashboard.get("/crm/dashboard/statistics")
async def get_stats():    
    try:
        data = {}
        
        counters = {
            "apps": 0,
            "modules": 0,
            "customers": 0,
        }
        counters["leads"] = {}
        counters["contacts"] = {}
        counters["accounts"] = {}
        
        data["counters"] = counters

        # top_customers = {}
        # data["top_customers"] = top_customers

        return {
            "status": status.HTTP_200_OK,
            "data": data,
        }
        
    except Exception as e:
        return {
            "status": status.HTTP_400_BAD_REQUEST, 
            "message": str(e) + ",Something went wrong with the requested data."
        }
# =============================
# Dashbaord Stats - ending
# =============================
