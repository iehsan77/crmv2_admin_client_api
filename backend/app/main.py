from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
import uvicorn
from fastapi.templating import Jinja2Templates
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from app.utils.oauth2 import SECRET_KEY, ALGORITHM
from jose import JWTError, jwt
import json
from datetime import datetime





# ==================================
# AUTH IMPORTS - starting
# ==================================
from app.routes.auth.super_admin_auth import super_admin_auth
from app.routes.auth.tenant_admin_auth import tenant_admin_auth
# ==================================
# AUTH IMPORTS - starting
# ==================================




# v2
# from app.routes.crm_v2.crm_services import crmv2

"""
# CRM
from app.routes.crm.layouts import layout
from app.routes.super_admin.forms import forms
from app.routes.super_admin.fields import fields
from app.routes.super_admin.sections import sections
"""

# ==================================
# COMMON IMPORTS - starting
# ==================================
from app.routes.common.form_builder import form_builder
from app.routes.common.countries import countries
from app.routes.common.cities import cities
# ==================================
# COMMON IMPORTS - ending
# ==================================





# ==================================
# SUPER ADMIN IMPORTS - starting
# ==================================
from app.routes.super_admin.apps import apps
from app.routes.super_admin.modules import modules
from app.routes.super_admin.customers import customers
from app.routes.super_admin.statistics import statistics
from app.routes.super_admin.settings import super_admin_settings
from app.routes.super_admin.default_layouts import default_layouts
from app.routes.super_admin.permissions import permissions_management

from app.routes.super_admin.library.rentify.brands import library_rentify_brands
from app.routes.super_admin.library.rentify.models import library_rentify_models
from app.routes.super_admin.library.rentify.variants import library_rentify_variants
from app.routes.super_admin.library.rentify.features import library_rentify_features
from app.routes.super_admin.library.rentify.body_types import library_rentify_body_types
# ==================================
# SUPER ADMIN IMPORTS - ending
# ==================================





# ==================================
# CRM ADMIN IMPORTS - starting
# ==================================
from app.routes.crm.notes import notes
from app.routes.crm.leads import leads
from app.routes.crm.contacts import contacts
from app.routes.crm.settings import crm_settings
from app.routes.crm.attachments import attachments
from app.routes.crm.permissions import permissions
from app.routes.crm.listing_views import listing_views
from app.routes.crm.custom_views import custom_views
from app.routes.crm.calls import calls
from app.routes.crm.meetings import meetings
from app.routes.crm.tasks import tasks
from app.routes.crm.accounts import accounts
from app.routes.crm.deals import deals
from app.routes.crm.associations import associations

from app.routes.rentify.library.brands import rentify_library_brands
from app.routes.rentify.library.models import rentify_library_models
from app.routes.rentify.library.variants import rentify_library_variants
from app.routes.rentify.library.features import rentify_library_features
from app.routes.rentify.library.body_types import rentify_library_body_types
from app.routes.rentify.vehicles import rentify_vehicles
from app.routes.rentify.affiliates import rentify_affiliates
from app.routes.rentify.bookings import bookings
# ==================================
# CRM ADMIN IMPORTS - ending
# ==================================

templates = Jinja2Templates(directory="app/templates")
from app.utils import  config


origins = [config.API_URL]


app = FastAPI(docs_url="/sec_doc_documentation", redoc_url=None)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring and deployment verification"""
    return {
        "status": "healthy",
        "createdon": datetime.utcnow().isoformat(),
        "service": "crmadmin-api",
        "version": "1.0.0"
    }

@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    excluded_paths = [
        "/docs", 
        "/openapi.json", 
        "/redoc", 
        "/sec_doc_documentation", 
        "/health",  # Add health endpoint to excluded paths
        "/auth/admin-login",
        
        "/auth/tenant-login",
        "/auth/tenant-signup",
        "/auth/tenant-verify",
        "/auth/tenant-company-info",
        "/auth/tenant-domain-info",
        "/auth/tenant-modules",
        
        "/form-builder/fields-with-attributes",
        "/apps/get-with-modules",
        "/apps/get"  # Allow apps/get endpoint without authentication
    ]
    path = request.url.path.rstrip('/')  # Remove trailing slash
    if path in excluded_paths:
        return await call_next(request)

    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"status": status.HTTP_403_FORBIDDEN, "message": "Invalid or expired token"}
        )

    # Check if token is missing or invalid
    token = auth_header.split("Bearer ")[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # You can attach payload to request.state if you need it in routes
        request.state.user = payload
    except JWTError:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"status": status.HTTP_403_FORBIDDEN, "message": "Invalid or expired token"}
        )

    # If token is valid, continue to the route
    response = await call_next(request)
    return response


if config.WORKING_ENVIRONMENT == "development":
    app.add_middleware(
        TrustedHostMiddleware, allowed_hosts=["127.0.0.1","sendgrid.api-docs.io","realstateapi.cloudapiserver.com","164.92.102.85","192.168.1.188","htdevexperts.com"] 
        )
else:
      app.add_middleware(
         TrustedHostMiddleware, allowed_hosts=["cloudapi.cloudapiserver.com","crmapi.cloudapiserver.com","htdevexperts.com"] 
        )


#app.include_router(api)





# ==================================
# AUTH ROUTES - starting
# ==================================
app.include_router(super_admin_auth)
app.include_router(tenant_admin_auth)
# ==================================
# AUTH ROUTES - ending
# ==================================





# ==================================
# GLOBAL ROUTES - starting
# ==================================
app.include_router(countries)
app.include_router(cities)
# ==================================
# GLOBAL ROUTES - ending
# ==================================





# ==================================
# COMMON ROUTES - starting
# ==================================
app.include_router(form_builder)
# ==================================
# COMMON ROUTES - ending
# ==================================





# ==================================
# SUPER ADMIN ROUTES - starting
# ==================================
app.include_router(apps)
app.include_router(modules)
app.include_router(customers)
app.include_router(statistics)
app.include_router(default_layouts)
app.include_router(super_admin_settings)
app.include_router(permissions_management)

app.include_router(library_rentify_brands)
app.include_router(library_rentify_models)
app.include_router(library_rentify_variants)
app.include_router(library_rentify_features)
app.include_router(library_rentify_body_types)
# ==================================
# SUPER ADMIN ROUTES - ending
# ==================================





# ==================================
# CRM ADMIN ROUTES - starting
# ==================================
app.include_router(notes)
app.include_router(leads)
app.include_router(contacts)
app.include_router(crm_settings)
app.include_router(attachments)
app.include_router(permissions)
app.include_router(listing_views)
app.include_router(custom_views)
app.include_router(calls)
app.include_router(meetings)
app.include_router(tasks)
app.include_router(accounts)
app.include_router(deals)
app.include_router(associations)

app.include_router(rentify_library_brands)
app.include_router(rentify_library_models)
app.include_router(rentify_library_variants)
app.include_router(rentify_library_features)
app.include_router(rentify_library_body_types)
app.include_router(rentify_vehicles)
app.include_router(rentify_affiliates)
app.include_router(bookings)
# ==================================
# CRM ADMIN ROUTES - ending
# ==================================


"""
app.include_router(forms)
app.include_router(sections)
app.include_router(fields)
app.include_router(super_admin_auth)
app.include_router(layout)
"""

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8006, reload=True)
