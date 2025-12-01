from pydantic import BaseSettings

from enum import Enum

from dotenv import load_dotenv

import os


table_alias = [
    {"table_name": "banners", "alias": "jobanners"},
    {"table_name": "banner_images", "alias": "jobannersimages"},
    {"table_name": "system_users", "alias": "adminusers"},
    {"table_name": "products_status", "alias": "joproductstatus"},
    {"table_name": "order_packages_status", "alias": "joorder_status"},
    {"table_name": "system_users", "alias": "josystem_users"},
    {"table_name": "products_variants", "alias": "joproducts_variants"},
    {"table_name": "products_variant_values",
        "alias": "joproducts_variant_values"},
    {"table_name": "products_tags", "alias": "joproducts_tags"},
    {"table_name": "products_filters", "alias": "joproducts_filters"},
    {"table_name": "products_filter_values", "alias": "joproducts_filter_values"},
    {"table_name": "countries", "alias": "jocountries"},
    {"table_name": "cities", "alias": "jocities"},
    {"table_name": "categories", "alias": "jocategories"},
    {"table_name": "brands", "alias": "jobrands"},
    {"table_name": "traders", "alias": "jotraders"},
    {"table_name": "regions", "alias": "joregions"},
    {"table_name": "areas", "alias": "joareas"},
    {"table_name": "amenities", "alias": "joamenities"},
    {"table_name": "amenity_group", "alias": "joamenity_group"},
    {"table_name": "property_area_units", "alias": "joproperty_area_units"},
    {"table_name": "property_status", "alias": "joproperty_status"},
    {"table_name": "user_status", "alias": "jouser_status"},
    {"table_name": "property_source", "alias": "joproperty_source"},
    {"table_name":"property_type", "alias":"joproperty_type"},
    {"table_name":"property_type_group", "alias":"joproperty_type_group"},
    {"table_name":"project_status", "alias":"joproject_status"},
    {"table_name":"project_amenities", "alias":"joproject_amenities"},
    {"table_name":"project_type", "alias":"joproject_type"},
    {"table_name": "project_amenity_group", "alias": "joproject_amenity_group"},
    {"table_name": "builders", "alias": "jobuilders"},
    {"table_name": "project_offers", "alias": "joproject_offers"},
    {"table_name": "projects", "alias": "joprojects"},
    {"table_name": "project_image", "alias": "joproject_image"},
    {"table_name": "property_images", "alias": "joproperty_images"},
    {"table_name": "properties", "alias": "joproperties"},
    {"table_name": "agency_profiles", "alias": "joagency_profiles"},
    {"table_name": "agency_specialization", "alias": "joagency_specialization"},
    {"table_name": "privileges_group", "alias": "joprivileges_group"},
    {"table_name": "privileges", "alias": "joprivileges"},
    {"table_name": "departments", "alias": "jodepartments"},
    {"table_name": "roles", "alias": "joroles"},
    {"table_name": "property_purpose", "alias": "joproperty_purpose"},
    {"table_name": "users", "alias": "jousers"},
    {"table_name": "handymen_service_units", "alias": "johandymen_service_units"},
    {"table_name": "handymen_category", "alias": "johandymen_category"},
    {"table_name": "handymen_service", "alias": "johandymen_service"},
    {"table_name": "handymen_company", "alias": "johandymen_company"},
    {"table_name": "handymen_users", "alias": "johandymen_users"},
    {"table_name": "handymen_inquires", "alias": "johandymen_inquires"},
    {"table_name": "zones", "alias": "jozones"},
    {"table_name": "handymen_cart", "alias": "johandymen_cart"},
    {"table_name": "handymen_user_address", "alias": "johandymen_useraddress"},
    {"table_name":"company_representatives", "alias": "jocompany_representatives"},
    {"table_name":"seo_search_contents_category", "alias": "joseo_search_contents_category"},            
    {"table_name":"seo_search_contents","alias": "joseo_search_contents"},
    {"table_name":"meta_pages","alias": "jometa_pages"},
    {"table_name":"meta_setup","alias": "jometa_setup"}

]


class Settings():
    def findTable(req: str):
        for f in table_alias:
            if f['alias'] == req:
                return f['table_name']
                break


IMAGE_URL = "https://storage.googleapis.com/jagahonline-data/"
IMAGE_DO_URL = "https://jocdn.sfo3.cdn.digitaloceanspaces.com/crm_image_collections/"
BRANDS_IMAGE_URL = "brands/"
BANNER_IMAGE_URL = "banners/"
PROPERTY_IMAGE_URL = "property/"



# Set development Environment

# WORKING_ENVIRONMENT = "development"
# API_URL = "https://devapi.jotesting.com/"

# set Local Environment

WORKING_ENVIRONMENT = "development"
API_URL = "http://realstateapi.cloudapiserver.com/"
SENDGRID_API_KEY = "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"


# Set production Environment

# WORKING_ENVIRONMENT = "production"
# API_URL = "https://cloudapi.jagahonline.com/"