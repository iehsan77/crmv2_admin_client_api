"""
Seed Script to Generate 200 Sample CRM Records with Relationships
Creates sample data for Leads, Accounts, Contacts, Deals, Tasks, Meetings, and Calls
All records are created for tenant_id = 7

Run this script in Docker:
    docker exec -it crm-admin-api python seed_crm_data.py

Or run directly:
    python seed_crm_data.py
"""

import sys
import os
from datetime import datetime, timezone, timedelta
from random import choice, randint, random, sample
from typing import List, Dict, Any
import json

# Add root directory to path so app.* imports work
if '/' not in sys.path:
    sys.path.insert(0, '/')

from app.networks.database import db
from app.helpers.general_helper import get_next_id

# MongoDB Collections
leads_collection = db.leads
accounts_collection = db.accounts
contacts_collection = db.contacts
deals_collection = db.deals
tasks_collection = db.tasks
meetings_collection = db.meetings
calls_collection = db.calls

# Configuration
TENANT_ID = 7
USER_ID = 1  # Default user ID
OWNER_ID = 1  # Default owner ID
TOTAL_RECORDS = 200

# Sample data pools
FIRST_NAMES = [
    "John", "Jane", "Michael", "Sarah", "David", "Emily", "Robert", "Jessica",
    "William", "Amanda", "Richard", "Ashley", "Joseph", "Melissa", "Thomas", "Nicole",
    "Christopher", "Michelle", "Daniel", "Kimberly", "Matthew", "Amy", "Anthony", "Angela",
    "Mark", "Lisa", "Donald", "Nancy", "Steven", "Karen", "Paul", "Betty", "Andrew", "Helen",
    "Joshua", "Sandra", "Kenneth", "Donna", "Kevin", "Carol", "Brian", "Ruth", "George", "Sharon"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor",
    "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris", "Sanchez",
    "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King",
    "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams",
    "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"
]

COMPANY_NAMES = [
    "Tech Solutions Inc", "Global Industries", "Digital Marketing Pro", "Cloud Services Co",
    "Software Innovations", "Data Analytics Corp", "E-Commerce Solutions", "Business Consultants",
    "Financial Advisors LLC", "Healthcare Partners", "Real Estate Group", "Construction Experts",
    "Manufacturing Plus", "Retail Solutions", "Education Services", "Transportation Logistics",
    "Energy Systems", "Media Productions", "Food & Beverage Co", "Fashion Brands",
    "Automotive Services", "Legal Associates", "Engineering Firm", "Architecture Design",
    "Security Systems", "Telecommunications", "Entertainment Group", "Tourism Services",
    "Agriculture Corp", "Pharmaceuticals", "Biotech Solutions", "Space Technologies"
]

DEAL_TITLES = [
    "Enterprise Software License", "Annual Service Contract", "Cloud Migration Project",
    "Marketing Campaign Package", "Consulting Services", "Hardware Purchase",
    "Training Program", "Support Agreement", "Custom Development", "Integration Services",
    "Data Analytics Platform", "Security Implementation", "Infrastructure Upgrade",
    "Mobile App Development", "Website Redesign", "Branding Package", "PR Campaign",
    "Market Research Study", "Product Launch", "Partnership Agreement"
]

TASK_SUBJECTS = [
    "Follow up with client", "Prepare proposal", "Schedule meeting", "Send contract",
    "Update CRM records", "Review documents", "Send invoice", "Process payment",
    "Schedule demo", "Prepare presentation", "Coordinate delivery", "Update status",
    "Contact supplier", "Review metrics", "Plan strategy", "Update website",
    "Send thank you email", "Schedule call", "Prepare report", "Organize files"
]

MEETING_TITLES = [
    "Quarterly Business Review", "Product Demo", "Strategy Session", "Contract Negotiation",
    "Kickoff Meeting", "Status Update", "Team Building", "Training Workshop",
    "Sales Presentation", "Client Consultation", "Partnership Discussion", "Project Planning",
    "Budget Review", "Performance Review", "Brainstorming Session", "Technical Discussion"
]

CALL_SUBJECTS = [
    "Follow-up call", "Product inquiry", "Support request", "Sales discussion",
    "Contract review", "Account update", "Technical support", "Billing question",
    "Feedback collection", "Appointment scheduling", "Project update", "Issue resolution"
]

STATUS_OPTIONS = [1, 2, 3, 4, 5, 6]
SOURCE_OPTIONS = [1, 2, 3, 4, 5]
TYPE_OPTIONS = [1, 2, 3, 4]
PRIORITY_OPTIONS = [1, 2, 3, 4]
VENUE_OPTIONS = ["in-office", "online", "on-site", "conference-room"]

RELATED_TO_OPTIONS = ["leads", "contacts", "accounts", "deals"]
TASK_FOR_OPTIONS = ["leads", "contacts", "accounts", "deals", "calls", "meetings"]
CALL_FOR_OPTIONS = ["leads", "contacts", "accounts", "deals"]


def generate_email(first_name: str, last_name: str, domain: str = None) -> str:
    """Generate a realistic email address"""
    if domain is None:
        domain = choice(["gmail.com", "yahoo.com", "outlook.com", "company.com", "business.com"])
    return f"{first_name.lower()}.{last_name.lower()}@{domain}"


def generate_phone() -> str:
    """Generate a random phone number"""
    return f"+1{randint(200, 999)}{randint(200, 999)}{randint(1000, 9999)}"


def generate_date_in_past(days_ago_min: int = 0, days_ago_max: int = 365) -> str:
    """Generate a date string in ISO format"""
    days_ago = randint(days_ago_min, days_ago_max)
    dt = datetime.now(timezone.utc) - timedelta(days=days_ago)
    return dt.isoformat()


def generate_future_date(days_ahead_min: int = 1, days_ahead_max: int = 90) -> str:
    """Generate a future date string in ISO format"""
    days_ahead = randint(days_ahead_min, days_ahead_max)
    dt = datetime.now(timezone.utc) + timedelta(days=days_ahead)
    return dt.isoformat()


def generate_time_range() -> tuple:
    """Generate start and end time for meetings/calls"""
    start_time = datetime.now(timezone.utc) + timedelta(days=randint(0, 30), hours=randint(9, 17))
    end_time = start_time + timedelta(minutes=randint(30, 120))
    return start_time.isoformat(), end_time.isoformat()


def create_leads(count: int) -> List[int]:
    """Create sample leads and return their IDs"""
    print(f"\n📋 Creating {count} leads...")
    lead_ids = []
    
    for i in range(count):
        first_name = choice(FIRST_NAMES)
        last_name = choice(LAST_NAMES)
        email = generate_email(first_name, last_name)
        
        lead_id = get_next_id(leads_collection)
        lead_data = {
            "id": lead_id,
            "ukey": f"{TENANT_ID}000{lead_id}",
            "tenant_id": TENANT_ID,
            "user_id": USER_ID,
            "title": choice(["Mr.", "Mrs.", "Ms.", "Dr."]),
            "owner_id": OWNER_ID,
            "assigned_to_id": OWNER_ID,
            "source_id": choice(SOURCE_OPTIONS),
            "first_name": first_name,
            "last_name": last_name,
            "name": f"{first_name} {last_name}",
            "email": email,
            "phone": generate_phone(),
            "mobile": generate_phone(),
            "website": f"www.{first_name.lower()}{last_name.lower()}.com",
            "status_id": choice(STATUS_OPTIONS),
            "description": f"Lead generated for {first_name} {last_name}",
            "address1": f"{randint(100, 9999)} {choice(['Main', 'Park', 'Oak', 'Cedar'])} Street",
            "country_id": 1,
            "state_id": 1,
            "postal_code": f"{randint(10000, 99999)}",
            "active": 1,
            "sort_by": 0,
            "deleted": 0,
            "created_at": generate_date_in_past(0, 180),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        
        try:
            leads_collection.insert_one(lead_data)
            lead_ids.append(lead_data["id"])
            if (i + 1) % 20 == 0:
                print(f"  ✓ Created {i + 1}/{count} leads")
        except Exception as e:
            print(f"  ✗ Error creating lead {i + 1}: {e}")
    
    print(f"  ✅ Created {len(lead_ids)} leads")
    return lead_ids


def create_accounts(count: int) -> List[int]:
    """Create sample accounts and return their IDs"""
    print(f"\n🏢 Creating {count} accounts...")
    account_ids = []
    
    for i in range(count):
        company_name = choice(COMPANY_NAMES)
        first_name = choice(FIRST_NAMES)
        last_name = choice(LAST_NAMES)
        
        account_id = get_next_id(accounts_collection)
        account_data = {
            "id": account_id,
            "uid": f"{TENANT_ID}000{account_id}",
            "ukey": f"{TENANT_ID}000{account_id}",
            "tenant_id": TENANT_ID,
            "user_id": USER_ID,
            "title": company_name,
            "owner_id": OWNER_ID,
            "type_id": choice(TYPE_OPTIONS),
            "industry_id": choice(TYPE_OPTIONS),
            "status_id": choice(STATUS_OPTIONS),
            "email": generate_email(first_name, last_name, f"{company_name.lower().replace(' ', '')}.com"),
            "phone": generate_phone(),
            "mobile": generate_phone(),
            "website": f"www.{company_name.lower().replace(' ', '')}.com",
            "annual_revenue": str(randint(100000, 10000000)),
            "employees": str(randint(10, 1000)),
            "location": f"{choice(['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'])}",
            "description": f"Account for {company_name}",
            "active": 1,
            "sort_by": 0,
            "deleted": 0,
            "add_by": USER_ID,
            "edit_by": 0,
            "deleted_by": 0,
            "createdon": generate_date_in_past(0, 180),
            "updatedon": datetime.now(timezone.utc).isoformat(),
        }
        
        try:
            accounts_collection.insert_one(account_data)
            account_ids.append(account_data["id"])
            if (i + 1) % 20 == 0:
                print(f"  ✓ Created {i + 1}/{count} accounts")
        except Exception as e:
            print(f"  ✗ Error creating account {i + 1}: {e}")
    
    print(f"  ✅ Created {len(account_ids)} accounts")
    return account_ids


def create_contacts(count: int, account_ids: List[int]) -> List[int]:
    """Create sample contacts linked to accounts and return their IDs"""
    print(f"\n👤 Creating {count} contacts...")
    contact_ids = []
    
    for i in range(count):
        first_name = choice(FIRST_NAMES)
        last_name = choice(LAST_NAMES)
        account_id = choice(account_ids) if account_ids else 0
        
        contact_id = get_next_id(contacts_collection)
        contact_data = {
            "id": contact_id,
            "ukey": f"{TENANT_ID}000{contact_id}",
            "tenant_id": TENANT_ID,
            "user_id": USER_ID,
            "title": choice(["Mr.", "Mrs.", "Ms.", "Dr."]),
            "owner_id": OWNER_ID,
            "assigned_to_id": OWNER_ID,
            "source_id": choice(SOURCE_OPTIONS),
            "first_name": first_name,
            "last_name": last_name,
            "name": f"{first_name} {last_name}",
            "email": generate_email(first_name, last_name),
            "phone": generate_phone(),
            "mobile": generate_phone(),
            "account_id": account_id,
            "role_id": choice(TYPE_OPTIONS),
            "status_id": choice(STATUS_OPTIONS),
            "website": f"www.{first_name.lower()}{last_name.lower()}.com",
            "description": f"Contact for {first_name} {last_name}",
            "address1": f"{randint(100, 9999)} {choice(['Main', 'Park', 'Oak', 'Cedar'])} Street",
            "country_id": 1,
            "state_id": 1,
            "postal_code": f"{randint(10000, 99999)}",
            "active": 1,
            "sort_by": 0,
            "deleted": 0,
            "created_at": generate_date_in_past(0, 180),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        
        try:
            contacts_collection.insert_one(contact_data)
            contact_ids.append(contact_data["id"])
            if (i + 1) % 20 == 0:
                print(f"  ✓ Created {i + 1}/{count} contacts")
        except Exception as e:
            print(f"  ✗ Error creating contact {i + 1}: {e}")
    
    print(f"  ✅ Created {len(contact_ids)} contacts")
    return contact_ids


def create_deals(count: int, account_ids: List[int], contact_ids: List[int], lead_ids: List[int]) -> List[int]:
    """Create sample deals linked to accounts/contacts/leads and return their IDs"""
    print(f"\n💼 Creating {count} deals...")
    deal_ids = []
    
    for i in range(count):
        account_id = choice(account_ids) if account_ids else 0
        contact_id = choice(contact_ids) if contact_ids else 0
        lead_id = choice(lead_ids) if random() > 0.5 and lead_ids else 0
        amount = randint(5000, 500000)
        
        deal_id = get_next_id(deals_collection)
        deal_data = {
            "id": deal_id,
            "ukey": f"{TENANT_ID}000{deal_id}",
            "tenant_id": TENANT_ID,
            "user_id": USER_ID,
            "owner_id": OWNER_ID,
            "title": choice(DEAL_TITLES),
            "account_id": account_id,
            "contact_id": contact_id,
            "lead_id": lead_id,
            "source_id": choice(SOURCE_OPTIONS),
            "type_id": choice(TYPE_OPTIONS),
            "amount": amount,
            "expected_revenue": int(amount * (randint(80, 100) / 100)),
            "probability": randint(10, 90),
            "status_id": choice(STATUS_OPTIONS),
            "closing_date": generate_future_date(1, 90),
            "description": f"Deal for {choice(DEAL_TITLES)}",
            "active": 1,
            "sort_by": 0,
            "deleted": 0,
            "add_by": USER_ID,
            "edit_by": 0,
            "deleted_by": 0,
            "createdon": generate_date_in_past(0, 180),
            "updatedon": datetime.now(timezone.utc).isoformat(),
        }
        
        try:
            deals_collection.insert_one(deal_data)
            deal_ids.append(deal_data["id"])
            if (i + 1) % 20 == 0:
                print(f"  ✓ Created {i + 1}/{count} deals")
        except Exception as e:
            print(f"  ✗ Error creating deal {i + 1}: {e}")
    
    print(f"  ✅ Created {len(deal_ids)} deals")
    return deal_ids


def create_tasks(count: int, lead_ids: List[int], contact_ids: List[int], 
                 account_ids: List[int], deal_ids: List[int]) -> List[int]:
    """Create sample tasks linked to various entities and return their IDs"""
    print(f"\n✅ Creating {count} tasks...")
    task_ids = []
    
    entity_pools = {
        "leads": lead_ids,
        "contacts": contact_ids,
        "accounts": account_ids,
        "deals": deal_ids,
    }
    
    for i in range(count):
        task_for = choice(TASK_FOR_OPTIONS)
        entity_pool = entity_pools.get(task_for, [])
        task_for_id = choice(entity_pool) if entity_pool else 0
        
        task_id = get_next_id(tasks_collection)
        task_data = {
            "id": task_id,
            "ukey": f"{TENANT_ID}000{task_id}",
            "tenant_id": TENANT_ID,
            "user_id": USER_ID,
            "owner_id": OWNER_ID,
            "subject": choice(TASK_SUBJECTS),
            "task_for": task_for,
            "task_for_id": task_for_id,
            "status_id": choice(STATUS_OPTIONS),
            "priority_id": choice(PRIORITY_OPTIONS),
            "due_date": generate_future_date(1, 30),
            "description": f"Task: {choice(TASK_SUBJECTS)}",
            "assigned_to_id": OWNER_ID,
            "active": 1,
            "sort_by": 0,
            "deleted": 0,
            "add_by": USER_ID,
            "edit_by": 0,
            "deleted_by": 0,
            "createdon": generate_date_in_past(0, 90),
            "updatedon": datetime.now(timezone.utc).isoformat(),
            "completed_on": None,
        }
        
        try:
            tasks_collection.insert_one(task_data)
            task_ids.append(task_data["id"])
            if (i + 1) % 20 == 0:
                print(f"  ✓ Created {i + 1}/{count} tasks")
        except Exception as e:
            print(f"  ✗ Error creating task {i + 1}: {e}")
    
    print(f"  ✅ Created {len(task_ids)} tasks")
    return task_ids


def create_meetings(count: int, contact_ids: List[int], account_ids: List[int]) -> List[int]:
    """Create sample meetings linked to contacts/accounts and return their IDs"""
    print(f"\n📅 Creating {count} meetings...")
    meeting_ids = []
    
    for i in range(count):
        meeting_for = choice(["contacts", "accounts"])
        entity_pool = contact_ids if meeting_for == "contacts" else account_ids
        entity_ids = sample(entity_pool, min(randint(1, 3), len(entity_pool))) if entity_pool else []
        
        start_time, end_time = generate_time_range()
        
        meeting_id = get_next_id(meetings_collection)
        meeting_data = {
            "id": meeting_id,
            "ukey": f"{TENANT_ID}000{meeting_id}",
            "tenant_id": TENANT_ID,
            "user_id": USER_ID,
            "owner_id": OWNER_ID,
            "title": choice(MEETING_TITLES),
            "venue": choice(VENUE_OPTIONS),
            "location": f"{choice(['Conference Room A', 'Main Office', 'Virtual', 'Client Office'])}",
            "start_time": start_time,
            "end_time": end_time,
            "all_day": 0,
            "status_id": choice(STATUS_OPTIONS),
            "meeting_for": meeting_for,
            "meeting_for_ids": json.dumps([str(eid) for eid in entity_ids]) if entity_ids else "[]",
            "related_to": choice(["accounts", "deals"]) if random() > 0.5 else "",
            "related_to_ids": "[]",
            "participant_ids": json.dumps([str(OWNER_ID)]),
            "description": f"Meeting: {choice(MEETING_TITLES)}",
            "deletable": 1,
            "active": 1,
            "deleted": 0,
            "add_by": USER_ID,
            "edit_by": 0,
            "deleted_by": 0,
            "createdon": generate_date_in_past(0, 90),
            "updatedon": datetime.now(timezone.utc).isoformat(),
        }
        
        try:
            meetings_collection.insert_one(meeting_data)
            meeting_ids.append(meeting_data["id"])
            if (i + 1) % 20 == 0:
                print(f"  ✓ Created {i + 1}/{count} meetings")
        except Exception as e:
            print(f"  ✗ Error creating meeting {i + 1}: {e}")
    
    print(f"  ✅ Created {len(meeting_ids)} meetings")
    return meeting_ids


def create_calls(count: int, contact_ids: List[int], account_ids: List[int], 
                 lead_ids: List[int], deal_ids: List[int]) -> List[int]:
    """Create sample calls linked to various entities and return their IDs"""
    print(f"\n📞 Creating {count} calls...")
    call_ids = []
    
    entity_pools = {
        "contacts": contact_ids,
        "accounts": account_ids,
        "leads": lead_ids,
        "deals": deal_ids,
    }
    
    for i in range(count):
        call_for = choice(CALL_FOR_OPTIONS)
        entity_pool = entity_pools.get(call_for, [])
        call_for_id = choice(entity_pool) if entity_pool else 0
        
        start_time, end_time = generate_time_range()
        duration_minutes = randint(5, 60)
        
        call_id = get_next_id(calls_collection)
        call_data = {
            "id": call_id,
            "ukey": f"{TENANT_ID}000{call_id}",
            "tenant_id": TENANT_ID,
            "user_id": USER_ID,
            "owner_id": OWNER_ID,
            "subject": choice(CALL_SUBJECTS),
            "call_for": call_for,
            "call_for_id": call_for_id,
            "type_id": choice(TYPE_OPTIONS),
            "status_id": choice(STATUS_OPTIONS),
            "outgoing_status_id": choice(TYPE_OPTIONS),
            "start_time": start_time,
            "end_time": end_time,
            "duration": f"{duration_minutes} minutes",
            "purpose_id": choice(TYPE_OPTIONS),
            "assigned_to_id": OWNER_ID,
            "description": f"Call: {choice(CALL_SUBJECTS)}",
            "agenda": f"Discuss {choice(['project', 'contract', 'support', 'sales'])}",
            "result": choice(["Connected", "Voicemail", "No answer", "Follow-up needed"]),
            "active": 1,
            "sort_by": 0,
            "closed": 0,
            "deletable": 1,
            "deleted": 0,
            "add_by": USER_ID,
            "edit_by": 0,
            "deleted_by": 0,
            "createdon": generate_date_in_past(0, 90),
            "updatedon": datetime.now(timezone.utc).isoformat(),
        }
        
        try:
            calls_collection.insert_one(call_data)
            call_ids.append(call_data["id"])
            if (i + 1) % 20 == 0:
                print(f"  ✓ Created {i + 1}/{count} calls")
        except Exception as e:
            print(f"  ✗ Error creating call {i + 1}: {e}")
    
    print(f"  ✅ Created {len(call_ids)} calls")
    return call_ids


def verify_database_connection():
    """Verify database connection"""
    try:
        server_info = db.client.server_info()
        print(f"✓ Database connection successful")
        print(f"  MongoDB version: {server_info.get('version', 'unknown')}")
        print(f"  Database: {db.name}")
        return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False


def main():
    """Main function to seed all CRM data"""
    print("=" * 60)
    print("CRM Data Seeding Script")
    print("=" * 60)
    print(f"Tenant ID: {TENANT_ID}")
    print(f"Total Records Target: {TOTAL_RECORDS}")
    print("=" * 60)
    
    # Verify database connection
    if not verify_database_connection():
        print("\n✗ Cannot proceed without database connection")
        return
    
    try:
        # Calculate distribution (approximately 200 total records)
        leads_count = 30
        accounts_count = 30
        contacts_count = 35
        deals_count = 30
        tasks_count = 30
        meetings_count = 25
        calls_count = 20
        
        print(f"\n📊 Distribution:")
        print(f"  Leads: {leads_count}")
        print(f"  Accounts: {accounts_count}")
        print(f"  Contacts: {contacts_count}")
        print(f"  Deals: {deals_count}")
        print(f"  Tasks: {tasks_count}")
        print(f"  Meetings: {meetings_count}")
        print(f"  Calls: {calls_count}")
        print(f"  Total: {leads_count + accounts_count + contacts_count + deals_count + tasks_count + meetings_count + calls_count}")
        
        # Create entities in order (respecting relationships)
        lead_ids = create_leads(leads_count)
        account_ids = create_accounts(accounts_count)
        contact_ids = create_contacts(contacts_count, account_ids)
        deal_ids = create_deals(deals_count, account_ids, contact_ids, lead_ids)
        task_ids = create_tasks(tasks_count, lead_ids, contact_ids, account_ids, deal_ids)
        meeting_ids = create_meetings(meetings_count, contact_ids, account_ids)
        call_ids = create_calls(calls_count, contact_ids, account_ids, lead_ids, deal_ids)
        
        # Summary
        print("\n" + "=" * 60)
        print("✅ Seeding Complete!")
        print("=" * 60)
        print(f"Leads created: {len(lead_ids)}")
        print(f"Accounts created: {len(account_ids)}")
        print(f"Contacts created: {len(contact_ids)}")
        print(f"Deals created: {len(deal_ids)}")
        print(f"Tasks created: {len(task_ids)}")
        print(f"Meetings created: {len(meeting_ids)}")
        print(f"Calls created: {len(call_ids)}")
        print(f"Total records: {len(lead_ids) + len(account_ids) + len(contact_ids) + len(deal_ids) + len(task_ids) + len(meeting_ids) + len(call_ids)}")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ Error during seeding: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()

