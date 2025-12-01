"""
Create MongoDB indexes for calls collection to optimize performance.
Run this script to add necessary indexes for efficient query execution.

Usage:
    python app/create_calls_indexes.py
    
Or via Docker:
    docker exec -it crm-admin-api python app/create_calls_indexes.py
"""

from networks.database import db
from pymongo import ASCENDING, DESCENDING

def create_calls_indexes():
    """
    Create indexes for the calls collection to optimize:
    - Grouping by status_id
    - Filtering by tenant_id
    - Filtering by deleted flag
    - Sorting by start_time
    - Looking up by id
    """
    
    calls_collection = db.calls
    
    print("Creating indexes for 'calls' collection...")
    
    # 1. Compound index for tenant_id + deleted + status_id (for grouping queries)
    try:
        calls_collection.create_index(
            [("tenant_id", ASCENDING), ("deleted", ASCENDING), ("status_id", ASCENDING)],
            name="idx_tenant_deleted_status"
        )
        print("✅ Created index: idx_tenant_deleted_status (tenant_id + deleted + status_id)")
    except Exception as e:
        print(f"⚠️  Index idx_tenant_deleted_status: {e}")
    
    # 2. Compound index for tenant_id + deleted + start_time (for date filtering)
    try:
        calls_collection.create_index(
            [("tenant_id", ASCENDING), ("deleted", ASCENDING), ("start_time", DESCENDING)],
            name="idx_tenant_deleted_starttime"
        )
        print("✅ Created index: idx_tenant_deleted_starttime (tenant_id + deleted + start_time)")
    except Exception as e:
        print(f"⚠️  Index idx_tenant_deleted_starttime: {e}")
    
    # 3. Index on id field (for lookups and enrichment)
    try:
        calls_collection.create_index(
            [("id", ASCENDING)],
            name="idx_id"
        )
        print("✅ Created index: idx_id (id)")
    except Exception as e:
        print(f"⚠️  Index idx_id: {e}")
    
    # 4. Index on owner_id (for user-based filtering)
    try:
        calls_collection.create_index(
            [("owner_id", ASCENDING)],
            name="idx_owner_id"
        )
        print("✅ Created index: idx_owner_id (owner_id)")
    except Exception as e:
        print(f"⚠️  Index idx_owner_id: {e}")
    
    # 5. Index on user_id (for user-based filtering)
    try:
        calls_collection.create_index(
            [("user_id", ASCENDING)],
            name="idx_user_id"
        )
        print("✅ Created index: idx_user_id (user_id)")
    except Exception as e:
        print(f"⚠️  Index idx_user_id: {e}")
    
    # 6. Index on assigned_to_id (for assignment-based filtering)
    try:
        calls_collection.create_index(
            [("assigned_to_id", ASCENDING)],
            name="idx_assigned_to_id"
        )
        print("✅ Created index: idx_assigned_to_id (assigned_to_id)")
    except Exception as e:
        print(f"⚠️  Index idx_assigned_to_id: {e}")
    
    # 7. Compound index for related_to + related_to_id (for relationship filtering)
    try:
        calls_collection.create_index(
            [("related_to", ASCENDING), ("related_to_id", ASCENDING)],
            name="idx_related_to"
        )
        print("✅ Created index: idx_related_to (related_to + related_to_id)")
    except Exception as e:
        print(f"⚠️  Index idx_related_to: {e}")
    
    print("\n" + "="*60)
    print("Index creation completed!")
    print("="*60)
    
    # Display all indexes
    print("\nCurrent indexes on 'calls' collection:")
    for index in calls_collection.list_indexes():
        print(f"  - {index['name']}: {index.get('key', {})}")


def create_users_indexes():
    """
    Create indexes for users collection to optimize $lookup operations.
    """
    
    users_collection = db.users
    
    print("\n" + "="*60)
    print("Creating indexes for 'users' collection...")
    print("="*60)
    
    # Index on id field for $lookup operations
    try:
        users_collection.create_index(
            [("id", ASCENDING)],
            name="idx_id"
        )
        print("✅ Created index: idx_id (id)")
    except Exception as e:
        print(f"⚠️  Index idx_id: {e}")
    
    print("\nCurrent indexes on 'users' collection:")
    for index in users_collection.list_indexes():
        print(f"  - {index['name']}: {index.get('key', {})}")


def create_call_status_indexes():
    """
    Create indexes for call_status collection.
    """
    
    call_status_collection = db.call_status
    
    print("\n" + "="*60)
    print("Creating indexes for 'call_status' collection...")
    print("="*60)
    
    # Index on id field
    try:
        call_status_collection.create_index(
            [("id", ASCENDING)],
            name="idx_id"
        )
        print("✅ Created index: idx_id (id)")
    except Exception as e:
        print(f"⚠️  Index idx_id: {e}")
    
    # Index on deleted field
    try:
        call_status_collection.create_index(
            [("deleted", ASCENDING)],
            name="idx_deleted"
        )
        print("✅ Created index: idx_deleted (deleted)")
    except Exception as e:
        print(f"⚠️  Index idx_deleted: {e}")
    
    print("\nCurrent indexes on 'call_status' collection:")
    for index in call_status_collection.list_indexes():
        print(f"  - {index['name']}: {index.get('key', {})}")


if __name__ == "__main__":
    print("\n" + "="*60)
    print("MongoDB Index Creation Script for Calls")
    print("="*60 + "\n")
    
    try:
        # Create indexes for all related collections
        create_calls_indexes()
        create_users_indexes()
        create_call_status_indexes()
        
        print("\n" + "="*60)
        print("✅ All indexes created successfully!")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error creating indexes: {e}")
        import traceback
        traceback.print_exc()

