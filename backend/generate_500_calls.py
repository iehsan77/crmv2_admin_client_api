"""
Script to Generate 500 Call Records for Testing
This script creates 500 call records in the MongoDB database
Can be run inside Docker container
"""

import sys
import os
from datetime import datetime, timezone, timedelta
from random import choice, randint, random
from pymongo import MongoClient

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.networks.database import db
from app.helpers.general_helper import get_next_id

# MongoDB Collection
calls_collection = db.calls
activity_logs_collection = db.activity_logs


# Sample data for realistic call generation
CALL_SUBJECTS = [
    "Follow-up on product inquiry",
    "Discuss pricing and packages",
    "Customer support call",
    "Sales presentation",
    "Technical support request",
    "Meeting schedule discussion",
    "Contract renewal discussion",
    "Complaint resolution",
    "Product demo request",
    "Service inquiry",
    "Billing question",
    "Account verification",
    "Feature request discussion",
    "Feedback session",
    "Onboarding call",
    "Training session",
    "Project update",
    "Quarterly review",
    "Contract negotiation",
    "Partnership discussion"
]

CALL_TYPES = ["inbound", "outbound"]

CALL_PURPOSES = [
    "Prospecting",
    "Follow-up",
    "Demo",
    "Support",
    "Sales",
    "Training",
    "Onboarding",
    "Consultation",
    "Feedback",
    "Renewal"
]

CALL_STATUSES = ["1", "2", "3", "4", "5"]  # Different status IDs

RELATED_TO_OPTIONS = ["contact", "lead", "account", "deal", "opportunity"]

CALL_AGENDAS = [
    "Discuss product features and benefits",
    "Address customer concerns",
    "Present new offerings",
    "Gather requirements",
    "Provide technical support",
    "Schedule next meeting",
    "Close the deal",
    "Renew contract",
    "Upsell opportunity",
    "Customer satisfaction check"
]

CALL_RESULTS = [
    "Connected and discussed",
    "Left voicemail",
    "No answer",
    "Wrong number",
    "Call back later",
    "Meeting scheduled",
    "Deal closed",
    "Not interested",
    "Follow-up required",
    "Issue resolved"
]

DURATIONS = ["5 minutes", "10 minutes", "15 minutes", "20 minutes", "30 minutes", "45 minutes", "1 hour"]


def generate_start_time(days_ago: int = 0, hours_offset: int = 0) -> str:
    """Generate a start time for the call"""
    base_time = datetime.now(timezone.utc) - timedelta(days=days_ago, hours=hours_offset)
    # Random time between 9 AM and 6 PM
    hour = randint(9, 18)
    minute = randint(0, 59)
    call_time = base_time.replace(hour=hour, minute=minute, second=0, microsecond=0)
    return call_time.isoformat()


def generate_call_record(call_id: int, tenant_id: int, user_id: int, days_ago: int = 0) -> dict:
    """Generate a single call record with realistic data"""
    
    # Generate timestamps
    start_time = generate_start_time(days_ago, randint(0, 23))
    createdon = datetime.now(timezone.utc).isoformat()
    
    # Generate related_to_id based on related_to type
    related_to = choice(RELATED_TO_OPTIONS)
    related_to_id = randint(1, 100)  # Random ID for related entity
    
    # Generate call_for (who the call is for)
    call_for = choice(["contact", "lead", "account"])
    call_for_id = randint(1, 100)
    
    # Owner ID (who owns this call)
    owner_id = user_id if random() > 0.3 else randint(1, 10)
    
    # Status and flags
    closed = 1 if random() > 0.5 else 0
    active = 1 if random() > 0.1 else 0
    
    # Generate ukey
    ukey = f"{tenant_id}000{call_id}"
    
    call_record = {
        "id": call_id,
        "ukey": ukey,
        "subject": choice(CALL_SUBJECTS),
        "type": choice(CALL_TYPES),
        "start_time": start_time,
        "related_to": related_to,
        "related_to_id": related_to_id,
        "owner_id": owner_id,
        "purpose": choice(CALL_PURPOSES),
        "duration": choice(DURATIONS),
        "description": f"Call regarding {choice(CALL_SUBJECTS).lower()}. Discussion was productive.",
        "result": choice(CALL_RESULTS),
        "tag": "",
        "status_id": choice(CALL_STATUSES),
        "agenda": choice(CALL_AGENDAS),
        "reminder": "",
        "caller_id": f"+1{randint(1000000000, 9999999999)}",
        "dialled_number": f"+1{randint(1000000000, 9999999999)}",
        "call_for": call_for,
        "call_for_id": call_for_id,
        "tenant_id": tenant_id,
        "user_id": user_id,
        "active": active,
        "sort_by": 0,
        "closed": closed,
        "deletable": 1,
        "deleted": 0,
        "add_by": user_id,
        "edit_by": 0,
        "deleted_by": 0,
        "createdon": createdon,
        "updatedon": createdon
    }
    
    return call_record


def create_activity_log(call_record: dict, user_id: int, tenant_id: int):
    """Create an activity log entry for the call"""
    try:
        activity_log = {
            "id": get_next_id(activity_logs_collection),
            "activity_type": "call_created",
            "entity_type": "call",
            "entity_id": int(call_record.get("id", 0)),
            "tenant_id": int(tenant_id),
            "user_id": int(user_id),
            "title": f"New call created: {call_record.get('subject', 'No subject')}",
            "description": f"Call created for {call_record.get('call_for', 'N/A')} - Type: {call_record.get('type', 'N/A')}",
            "createdon": datetime.now(timezone.utc).isoformat(),
            "metadata": {
                "call_for": call_record.get("call_for"),
                "call_for_id": call_record.get("call_for_id"),
                "type": call_record.get("type"),
                "purpose": call_record.get("purpose"),
                "start_time": call_record.get("start_time")
            },
            "deleted": 0,
            "active": 1
        }
        activity_logs_collection.insert_one(activity_log)
    except Exception as e:
        print(f"Warning: Could not create activity log for call {call_record['id']}: {e}")


def generate_500_calls(tenant_id: int = 1, user_id: int = 1, batch_size: int = 50):
    """
    Generate 500 call records and insert them into the database
    
    Args:
        tenant_id: The tenant ID for the calls (default: 1)
        user_id: The user ID who creates the calls (default: 1)
        batch_size: Number of records to insert in each batch (default: 50)
    """
    try:
        print("=" * 80)
        print("Starting Call Records Generation")
        print("=" * 80)
        print(f"Tenant ID: {tenant_id}")
        print(f"User ID: {user_id}")
        print(f"Target: 500 records")
        print(f"Batch size: {batch_size}")
        print("-" * 80)
        
        # Get the starting ID
        start_id = get_next_id(calls_collection)
        print(f"Starting ID: {start_id}")
        print("-" * 80)
        
        total_inserted = 0
        total_logs_created = 0
        batch_records = []
        
        # Generate 500 calls
        for i in range(500):
            current_id = start_id + i
            
            # Spread calls across last 30 days
            days_ago = randint(0, 30)
            
            call_record = generate_call_record(current_id, tenant_id, user_id, days_ago)
            batch_records.append(call_record)
            
            # Insert in batches
            if len(batch_records) >= batch_size or i == 499:  # Last record
                try:
                    result = calls_collection.insert_many(batch_records)
                    total_inserted += len(result.inserted_ids)
                    
                    # Create activity logs for each call
                    for record in batch_records:
                        create_activity_log(record, user_id, tenant_id)
                        total_logs_created += 1
                    
                    print(f"Progress: {total_inserted}/500 calls inserted | {total_logs_created} activity logs created")
                    
                    batch_records = []  # Clear batch
                    
                except Exception as e:
                    print(f"Error inserting batch: {e}")
                    print("Continuing with next batch...")
        
        print("-" * 80)
        print("=" * 80)
        print("Generation Complete!")
        print("=" * 80)
        print(f"Total calls created: {total_inserted}")
        print(f"Total activity logs created: {total_logs_created}")
        print(f"ID range: {start_id} to {start_id + total_inserted - 1}")
        print("=" * 80)
        
        # Show sample of created records
        print("\nSample of created records:")
        print("-" * 80)
        sample_records = calls_collection.find(
            {"tenant_id": tenant_id, "id": {"$gte": start_id}},
            {"_id": 0, "id": 1, "subject": 1, "type": 1, "purpose": 1, "start_time": 1}
        ).limit(5)
        
        for idx, record in enumerate(sample_records, 1):
            print(f"\n{idx}. Call ID: {record.get('id')}")
            print(f"   Subject: {record.get('subject')}")
            print(f"   Type: {record.get('type')}")
            print(f"   Purpose: {record.get('purpose')}")
            print(f"   Start Time: {record.get('start_time')}")
        
        print("\n" + "=" * 80)
        
    except Exception as e:
        print(f"Error in generate_500_calls: {e}")
        import traceback
        traceback.print_exc()


def verify_database_connection():
    """Verify that we can connect to the database"""
    try:
        # Try to access the database
        server_info = db.client.server_info()
        print("✓ Database connection successful")
        print(f"  MongoDB version: {server_info.get('version', 'unknown')}")
        return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False


def main():
    """Main function to run the script"""
    print("\n" + "=" * 80)
    print("CALL RECORDS GENERATOR - 500 Records")
    print("=" * 80)
    print("\nStep 1: Verifying database connection...")
    
    if not verify_database_connection():
        print("\nExiting due to database connection failure.")
        return
    
    print("\nStep 2: Generating call records...")
    print("\nNote: You can customize tenant_id and user_id by passing them as arguments")
    print("Example: python generate_500_calls.py <tenant_id> <user_id>")
    
    # Get tenant_id and user_id from command line arguments or use defaults
    tenant_id = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    user_id = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    
    print(f"\nUsing tenant_id: {tenant_id}, user_id: {user_id}")
    
    # Confirm before proceeding
    print("\nPress Enter to continue or Ctrl+C to cancel...")
    try:
        input()
    except KeyboardInterrupt:
        print("\n\nCancelled by user.")
        return
    
    # Generate the calls
    generate_500_calls(tenant_id=tenant_id, user_id=user_id)
    
    print("\n✓ Script completed successfully!")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    main()

