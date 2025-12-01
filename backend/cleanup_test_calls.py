"""
Script to Clean Up Test Call Records
This script removes test call records and their associated activity logs
Can be run inside Docker container
"""

import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.networks.database import db

# MongoDB Collections
calls_collection = db.calls
activity_logs_collection = db.activity_logs


def cleanup_calls_by_id_range(tenant_id: int, start_id: int, end_id: int):
    """
    Clean up call records by ID range
    
    Args:
        tenant_id: The tenant ID for the calls
        start_id: Starting ID of the range to delete
        end_id: Ending ID of the range to delete
    """
    try:
        print("=" * 80)
        print("CLEANING UP TEST CALL RECORDS")
        print("=" * 80)
        print(f"Tenant ID: {tenant_id}")
        print(f"ID Range: {start_id} to {end_id}")
        print("-" * 80)
        
        # Confirm deletion
        print(f"\nWARNING: This will delete all calls with ID between {start_id} and {end_id}")
        print("and their associated activity logs.")
        print("\nType 'DELETE' to confirm or press Ctrl+C to cancel: ")
        
        try:
            confirmation = input()
            if confirmation != "DELETE":
                print("\nCleanup cancelled. You must type 'DELETE' to confirm.")
                return
        except KeyboardInterrupt:
            print("\n\nCleanup cancelled by user.")
            return
        
        print("\nStep 1: Deleting call records...")
        calls_result = calls_collection.delete_many({
            "tenant_id": tenant_id,
            "id": {"$gte": start_id, "$lte": end_id}
        })
        print(f"✓ Deleted {calls_result.deleted_count} call records")
        
        print("\nStep 2: Deleting activity logs...")
        logs_result = activity_logs_collection.delete_many({
            "entity_type": "call",
            "tenant_id": tenant_id,
            "entity_id": {"$gte": start_id, "$lte": end_id}
        })
        print(f"✓ Deleted {logs_result.deleted_count} activity log records")
        
        print("-" * 80)
        print("=" * 80)
        print("CLEANUP COMPLETE!")
        print("=" * 80)
        print(f"Total calls deleted: {calls_result.deleted_count}")
        print(f"Total activity logs deleted: {logs_result.deleted_count}")
        print("=" * 80)
        
    except Exception as e:
        print(f"Error during cleanup: {e}")
        import traceback
        traceback.print_exc()


def cleanup_calls_by_count(tenant_id: int, count: int):
    """
    Clean up the last N call records
    
    Args:
        tenant_id: The tenant ID for the calls
        count: Number of recent calls to delete
    """
    try:
        print("=" * 80)
        print("CLEANING UP RECENT TEST CALL RECORDS")
        print("=" * 80)
        print(f"Tenant ID: {tenant_id}")
        print(f"Number of calls to delete: {count}")
        print("-" * 80)
        
        # Get the last N calls
        calls = list(calls_collection.find(
            {"tenant_id": tenant_id},
            {"_id": 0, "id": 1}
        ).sort("id", -1).limit(count))
        
        if not calls:
            print("No calls found to delete.")
            return
        
        call_ids = [call["id"] for call in calls]
        start_id = min(call_ids)
        end_id = max(call_ids)
        
        print(f"Found {len(call_ids)} calls to delete")
        print(f"ID Range: {start_id} to {end_id}")
        print("-" * 80)
        
        # Confirm deletion
        print(f"\nWARNING: This will delete {len(call_ids)} calls")
        print("and their associated activity logs.")
        print("\nType 'DELETE' to confirm or press Ctrl+C to cancel: ")
        
        try:
            confirmation = input()
            if confirmation != "DELETE":
                print("\nCleanup cancelled. You must type 'DELETE' to confirm.")
                return
        except KeyboardInterrupt:
            print("\n\nCleanup cancelled by user.")
            return
        
        print("\nStep 1: Deleting call records...")
        calls_result = calls_collection.delete_many({
            "tenant_id": tenant_id,
            "id": {"$in": call_ids}
        })
        print(f"✓ Deleted {calls_result.deleted_count} call records")
        
        print("\nStep 2: Deleting activity logs...")
        logs_result = activity_logs_collection.delete_many({
            "entity_type": "call",
            "tenant_id": tenant_id,
            "entity_id": {"$in": call_ids}
        })
        print(f"✓ Deleted {logs_result.deleted_count} activity log records")
        
        print("-" * 80)
        print("=" * 80)
        print("CLEANUP COMPLETE!")
        print("=" * 80)
        print(f"Total calls deleted: {calls_result.deleted_count}")
        print(f"Total activity logs deleted: {logs_result.deleted_count}")
        print("=" * 80)
        
    except Exception as e:
        print(f"Error during cleanup: {e}")
        import traceback
        traceback.print_exc()


def verify_database_connection():
    """Verify that we can connect to the database"""
    try:
        server_info = db.client.server_info()
        print("✓ Database connection successful")
        print(f"  MongoDB version: {server_info.get('version', 'unknown')}")
        return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False


def show_stats(tenant_id: int):
    """Show statistics about calls in the database"""
    try:
        total_calls = calls_collection.count_documents({"tenant_id": tenant_id, "deleted": {"$ne": 1}})
        total_logs = activity_logs_collection.count_documents({
            "entity_type": "call",
            "tenant_id": tenant_id,
            "deleted": {"$ne": 1}
        })
        
        print("\n" + "=" * 80)
        print("CURRENT STATISTICS")
        print("=" * 80)
        print(f"Tenant ID: {tenant_id}")
        print(f"Total calls: {total_calls}")
        print(f"Total call activity logs: {total_logs}")
        
        # Get ID range
        min_call = calls_collection.find_one(
            {"tenant_id": tenant_id},
            {"_id": 0, "id": 1},
            sort=[("id", 1)]
        )
        max_call = calls_collection.find_one(
            {"tenant_id": tenant_id},
            {"_id": 0, "id": 1},
            sort=[("id", -1)]
        )
        
        if min_call and max_call:
            print(f"ID Range: {min_call['id']} to {max_call['id']}")
        
        print("=" * 80)
        
    except Exception as e:
        print(f"Error getting statistics: {e}")


def main():
    """Main function to run the cleanup script"""
    print("\n" + "=" * 80)
    print("CALL RECORDS CLEANUP UTILITY")
    print("=" * 80)
    print("\nThis script helps you clean up test call records.")
    print("\nVerifying database connection...")
    
    if not verify_database_connection():
        print("\nExiting due to database connection failure.")
        return
    
    print("\nCleanup Options:")
    print("  1. Delete by ID range (recommended if you know the range)")
    print("  2. Delete last N records")
    print("  3. Show statistics only")
    print("  4. Exit")
    
    try:
        choice = input("\nSelect option (1-4): ").strip()
    except KeyboardInterrupt:
        print("\n\nCancelled by user.")
        return
    
    if choice == "4":
        print("Exiting...")
        return
    
    # Get tenant_id
    try:
        tenant_id_input = input("\nEnter tenant_id (default: 1): ").strip()
        tenant_id = int(tenant_id_input) if tenant_id_input else 1
    except ValueError:
        print("Invalid tenant_id. Using default: 1")
        tenant_id = 1
    except KeyboardInterrupt:
        print("\n\nCancelled by user.")
        return
    
    if choice == "3":
        show_stats(tenant_id)
        return
    
    elif choice == "1":
        # Delete by ID range
        try:
            start_id = int(input("\nEnter start ID: ").strip())
            end_id = int(input("Enter end ID: ").strip())
            
            if start_id > end_id:
                print("Error: start_id cannot be greater than end_id")
                return
            
            cleanup_calls_by_id_range(tenant_id, start_id, end_id)
            
        except ValueError:
            print("Error: Invalid ID values. IDs must be integers.")
        except KeyboardInterrupt:
            print("\n\nCancelled by user.")
    
    elif choice == "2":
        # Delete last N records
        try:
            count = int(input("\nEnter number of recent calls to delete (e.g., 500): ").strip())
            
            if count <= 0:
                print("Error: Count must be greater than 0")
                return
            
            cleanup_calls_by_count(tenant_id, count)
            
        except ValueError:
            print("Error: Invalid count. Must be a positive integer.")
        except KeyboardInterrupt:
            print("\n\nCancelled by user.")
    
    else:
        print("Invalid option. Please run the script again.")
    
    print("\n✓ Script completed!")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    main()

