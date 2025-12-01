"""
Clean up duplicate call records in MongoDB.
This script identifies and removes duplicate calls keeping the most recent one.

Usage:
    python app/cleanup_duplicate_calls.py --tenant_id=6 --dry-run
    python app/cleanup_duplicate_calls.py --tenant_id=6 --execute
    
Or via Docker:
    docker exec -it crm-admin-api python app/cleanup_duplicate_calls.py --tenant_id=6 --dry-run
"""

import sys
import argparse
from networks.database import db
from datetime import datetime

def find_duplicate_calls(tenant_id=None):
    """
    Find all duplicate calls based on 'id' field.
    
    Args:
        tenant_id: Optional tenant_id to filter by
        
    Returns:
        List of duplicate groups
    """
    
    match_stage = {}
    if tenant_id:
        match_stage["tenant_id"] = int(tenant_id)
    
    pipeline = [
        {"$match": match_stage} if match_stage else {"$match": {}},
        {
            "$group": {
                "_id": "$id",
                "count": {"$sum": 1},
                "docs": {"$push": {"mongo_id": "$_id", "createdon": "$createdon"}}
            }
        },
        {"$match": {"count": {"$gt": 1}}},
        {"$sort": {"count": -1}}
    ]
    
    duplicates = list(db.calls.aggregate(pipeline))
    return duplicates


def cleanup_duplicates(duplicates, dry_run=True):
    """
    Remove duplicate calls, keeping the most recent one based on createdon.
    
    Args:
        duplicates: List of duplicate groups from find_duplicate_calls()
        dry_run: If True, only print what would be deleted without actual deletion
        
    Returns:
        Number of deleted records
    """
    
    total_to_delete = 0
    deleted_count = 0
    
    print("\n" + "="*80)
    print(f"{'DRY RUN - ' if dry_run else ''}Duplicate Cleanup Report")
    print("="*80 + "\n")
    
    for dup in duplicates:
        call_id = dup["_id"]
        count = dup["count"]
        docs = dup["docs"]
        
        print(f"Call ID {call_id}: Found {count} duplicate(s)")
        
        # Sort by createdon to find the newest
        sorted_docs = sorted(
            docs,
            key=lambda x: x.get("createdon", ""),
            reverse=True
        )
        
        # Keep the first (newest), mark others for deletion
        to_keep = sorted_docs[0]
        to_delete = sorted_docs[1:]
        
        print(f"  ✓ Keeping: {to_keep['mongo_id']} (created: {to_keep.get('createdon', 'N/A')})")
        
        for doc in to_delete:
            print(f"  ✗ {'Would delete' if dry_run else 'Deleting'}: {doc['mongo_id']} (created: {doc.get('createdon', 'N/A')})")
            total_to_delete += 1
            
            if not dry_run:
                # Actually delete the duplicate
                result = db.calls.delete_one({"_id": doc["mongo_id"]})
                if result.deleted_count > 0:
                    deleted_count += 1
        
        print()
    
    print("="*80)
    print(f"Summary:")
    print(f"  Total duplicate groups: {len(duplicates)}")
    print(f"  Total records {'to delete' if dry_run else 'deleted'}: {total_to_delete}")
    if not dry_run:
        print(f"  Successfully deleted: {deleted_count}")
    print("="*80 + "\n")
    
    return deleted_count if not dry_run else total_to_delete


def analyze_call_uniqueness(tenant_id=None):
    """
    Analyze the uniqueness of call IDs in the database.
    
    Args:
        tenant_id: Optional tenant_id to filter by
    """
    
    match_stage = {}
    if tenant_id:
        match_stage["tenant_id"] = int(tenant_id)
    
    # Count total calls
    total_calls = db.calls.count_documents(match_stage)
    
    # Count unique call IDs
    pipeline = [
        {"$match": match_stage} if match_stage else {"$match": {}},
        {"$group": {"_id": "$id"}},
        {"$count": "unique_ids"}
    ]
    
    result = list(db.calls.aggregate(pipeline))
    unique_ids = result[0]["unique_ids"] if result else 0
    
    duplicate_count = total_calls - unique_ids
    
    print("\n" + "="*80)
    print("Call ID Uniqueness Analysis")
    print("="*80)
    print(f"Total calls: {total_calls}")
    print(f"Unique call IDs: {unique_ids}")
    print(f"Duplicate records: {duplicate_count}")
    
    if duplicate_count > 0:
        percentage = (duplicate_count / total_calls) * 100
        print(f"Duplication rate: {percentage:.2f}%")
        print("\n⚠️  Duplicates detected! Run cleanup to remove them.")
    else:
        print("\n✅ No duplicates found! All call IDs are unique.")
    
    print("="*80 + "\n")


def main():
    parser = argparse.ArgumentParser(
        description="Clean up duplicate call records in MongoDB"
    )
    parser.add_argument(
        "--tenant_id",
        type=int,
        help="Filter by tenant ID (optional)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        default=False,
        help="Perform a dry run without actually deleting records (default)"
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        default=False,
        help="Actually delete duplicate records (use with caution!)"
    )
    parser.add_argument(
        "--analyze-only",
        action="store_true",
        default=False,
        help="Only analyze and report, don't cleanup"
    )
    
    args = parser.parse_args()
    
    try:
        print("\n" + "="*80)
        print("Duplicate Calls Cleanup Script")
        print("="*80)
        print(f"Timestamp: {datetime.now().isoformat()}")
        if args.tenant_id:
            print(f"Filter: tenant_id = {args.tenant_id}")
        else:
            print("Filter: All tenants")
        print("="*80 + "\n")
        
        # Analyze uniqueness first
        analyze_call_uniqueness(args.tenant_id)
        
        if args.analyze_only:
            print("Analysis complete. Use --dry-run or --execute to cleanup duplicates.")
            return
        
        # Find duplicates
        print("Searching for duplicate calls...")
        duplicates = find_duplicate_calls(args.tenant_id)
        
        if not duplicates:
            print("✅ No duplicates found!")
            return
        
        print(f"Found {len(duplicates)} duplicate groups\n")
        
        # Determine if this is a dry run or actual execution
        dry_run = not args.execute
        
        if dry_run:
            print("⚠️  DRY RUN MODE - No actual deletions will occur")
            print("    Use --execute flag to perform actual cleanup\n")
        else:
            print("⚠️  EXECUTE MODE - Duplicates will be permanently deleted!")
            print("    Press Ctrl+C within 5 seconds to cancel...\n")
            
            import time
            for i in range(5, 0, -1):
                print(f"    Starting in {i}...")
                time.sleep(1)
            print()
        
        # Cleanup duplicates
        count = cleanup_duplicates(duplicates, dry_run=dry_run)
        
        if dry_run:
            print(f"\n✅ Dry run complete. {count} duplicate(s) would be deleted.")
            print("   Run with --execute to perform actual cleanup.")
        else:
            print(f"\n✅ Cleanup complete! {count} duplicate(s) deleted.")
            
            # Re-analyze to confirm
            print("\nRe-analyzing after cleanup...")
            analyze_call_uniqueness(args.tenant_id)
        
    except KeyboardInterrupt:
        print("\n\n❌ Operation cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

