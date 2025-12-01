# Generate 500 Call Records - Documentation

## Overview

This script (`generate_500_calls.py`) generates 500 test call records in your CRM system. It creates realistic call data including subjects, types, purposes, durations, and associated activity logs.

## Features

- ✅ Generates 500 call records with realistic data
- ✅ Creates activity logs for each call
- ✅ Spreads calls across the last 30 days
- ✅ Supports custom tenant_id and user_id
- ✅ Batch insertion for performance
- ✅ Progress tracking during generation
- ✅ Database connection verification
- ✅ Compatible with Docker environment

## Call Record Structure

Each generated call includes:

- **Basic Information**: ID, subject, type (inbound/outbound), status
- **Timing**: Start time, duration (5 min to 1 hour)
- **Related Entities**: Related to (contact/lead/account/deal), call for (contact/lead/account)
- **Contact Details**: Caller ID, dialled number
- **Call Details**: Purpose, agenda, result, description
- **Metadata**: Owner, tenant, user, timestamps
- **Status Flags**: Active, closed, deletable

## How to Run

### Method 1: Inside Docker Container (Recommended)

This is the recommended method since your application uses Docker.

#### Step 1: Access the Docker container

```bash
# Find your container name
docker ps

# Access the container (use your container name)
docker exec -it crm-admin-api bash
```

#### Step 2: Run the script

```bash
# Inside the container, run with default tenant_id=1 and user_id=1
python generate_500_calls.py

# Or specify custom tenant_id and user_id
python generate_500_calls.py <tenant_id> <user_id>

# Example: For tenant_id=5 and user_id=3
python generate_500_calls.py 5 3
```

#### Step 3: Verify the records

The script will show:
- Progress during generation
- Total calls created
- Total activity logs created
- ID range of created records
- Sample of created records

### Method 2: Direct Execution (Outside Docker)

If you want to run outside Docker:

```bash
# Make sure you're in the project root
cd /Users/ehsanhaq/Documents/GitHub/crmadmin_api_core

# Run with default values
python generate_500_calls.py

# Or with custom tenant_id and user_id
python generate_500_calls.py 5 3
```

### Method 3: Using Docker Compose Exec

Run directly from your host machine:

```bash
# From project root
docker-compose exec core_api python generate_500_calls.py

# With custom parameters
docker-compose exec core_api python generate_500_calls.py 5 3
```

## Command Line Arguments

The script accepts two optional arguments:

1. **tenant_id** (default: 1) - The tenant ID for the calls
2. **user_id** (default: 1) - The user ID who creates the calls

```bash
python generate_500_calls.py [tenant_id] [user_id]
```

### Examples:

```bash
# Default: tenant_id=1, user_id=1
python generate_500_calls.py

# Custom tenant and user
python generate_500_calls.py 5 3

# Only custom tenant, default user
python generate_500_calls.py 5 1
```

## Sample Data Generated

### Call Subjects
- Follow-up on product inquiry
- Discuss pricing and packages
- Customer support call
- Sales presentation
- Technical support request
- And 15 more variations...

### Call Types
- Inbound
- Outbound

### Call Purposes
- Prospecting
- Follow-up
- Demo
- Support
- Sales
- Training
- Onboarding
- Consultation
- Feedback
- Renewal

### Call Results
- Connected and discussed
- Left voicemail
- No answer
- Meeting scheduled
- Deal closed
- Follow-up required
- And more...

## Database Collections Affected

The script inserts data into two collections:

1. **calls** - The main call records
2. **activity_logs** - Activity logs for each call

## Performance

- Batch size: 50 records per batch
- Total batches: 10 batches
- Estimated time: 10-30 seconds depending on database connection
- Memory efficient: Uses batch processing

## Verification

After running the script, you can verify the data:

### Using MongoDB Shell

```bash
# Access MongoDB
docker exec -it crm-admin-api bash
mongosh "your_mongodb_connection_string"

# Switch to database
use crmadmin_core

# Count calls for specific tenant
db.calls.countDocuments({tenant_id: 1, deleted: 0})

# View sample calls
db.calls.find({tenant_id: 1, deleted: 0}).limit(5).pretty()

# Count activity logs
db.activity_logs.countDocuments({entity_type: "call", tenant_id: 1})
```

### Using the API

```bash
# Get calls list (replace with your API URL and token)
curl -X POST "http://localhost:8006/crm/calls/list" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"page": 1, "limit": 10}'
```

## Troubleshooting

### Issue: Database connection failed

**Solution**: Verify that MongoDB is accessible and the connection string in `app/networks/database.py` is correct.

```bash
# Test database connection
docker exec -it crm-admin-api python -c "from app.networks.database import db; print(db.client.server_info())"
```

### Issue: Import errors

**Solution**: Make sure you're running the script from the project root directory and all dependencies are installed.

```bash
# Inside Docker container
pip install -r requirements.txt
```

### Issue: Permission denied

**Solution**: Ensure the script has execute permissions.

```bash
chmod +x generate_500_calls.py
```

## Cleaning Up Test Data

If you want to remove the generated test data:

### Option 1: Using MongoDB Shell

```javascript
// Delete calls created by the script
db.calls.deleteMany({
  tenant_id: 1,  // Change to your tenant_id
  id: { $gte: START_ID, $lte: END_ID }  // Use the ID range from script output
})

// Delete associated activity logs
db.activity_logs.deleteMany({
  entity_type: "call",
  tenant_id: 1,  // Change to your tenant_id
  entity_id: { $gte: START_ID, $lte: END_ID }
})
```

### Option 2: Create a cleanup script

You can create a simple cleanup script:

```python
from app.networks.database import db

# Delete calls within a specific ID range
result = db.calls.delete_many({
    "tenant_id": 1,
    "id": {"$gte": START_ID, "$lte": END_ID}
})
print(f"Deleted {result.deleted_count} calls")

# Delete activity logs
result = db.activity_logs.delete_many({
    "entity_type": "call",
    "tenant_id": 1,
    "entity_id": {"$gte": START_ID, "$lte": END_ID}
})
print(f"Deleted {result.deleted_count} activity logs")
```

## Script Output Example

```
================================================================================
CALL RECORDS GENERATOR - 500 Records
================================================================================

Step 1: Verifying database connection...
✓ Database connection successful
  MongoDB version: 5.0.9

Step 2: Generating call records...

Note: You can customize tenant_id and user_id by passing them as arguments
Example: python generate_500_calls.py <tenant_id> <user_id>

Using tenant_id: 1, user_id: 1

Press Enter to continue or Ctrl+C to cancel...

================================================================================
Starting Call Records Generation
================================================================================
Tenant ID: 1
User ID: 1
Target: 500 records
Batch size: 50
--------------------------------------------------------------------------------
Starting ID: 1001
--------------------------------------------------------------------------------
Progress: 50/500 calls inserted | 50 activity logs created
Progress: 100/500 calls inserted | 100 activity logs created
Progress: 150/500 calls inserted | 150 activity logs created
...
Progress: 500/500 calls inserted | 500 activity logs created
--------------------------------------------------------------------------------
================================================================================
Generation Complete!
================================================================================
Total calls created: 500
Total activity logs created: 500
ID range: 1001 to 1500
================================================================================

Sample of created records:
--------------------------------------------------------------------------------

1. Call ID: 1001
   Subject: Follow-up on product inquiry
   Type: outbound
   Purpose: Prospecting
   Start Time: 2024-09-15T14:32:00+00:00

2. Call ID: 1002
   Subject: Sales presentation
   Type: inbound
   Purpose: Sales
   Start Time: 2024-09-20T11:15:00+00:00

...

================================================================================

✓ Script completed successfully!
================================================================================
```

## Best Practices

1. **Test First**: Run with a small number of records first to verify everything works
2. **Use Correct IDs**: Make sure tenant_id and user_id exist in your system
3. **Backup Data**: Always backup your database before running bulk operations
4. **Monitor Resources**: Watch database and memory usage during large inserts
5. **Check Results**: Verify the data after generation using the API or database queries

## Integration with CRM System

The generated calls integrate seamlessly with your CRM:

- ✅ Visible in call lists
- ✅ Searchable and filterable
- ✅ Linked to activity logs
- ✅ Compatible with all call views (All Calls, Today's Calls, etc.)
- ✅ Can be edited and deleted through API
- ✅ Support custom views and filters

## Support

If you encounter any issues:

1. Check the error message in the console
2. Verify database connectivity
3. Ensure tenant_id and user_id are valid
4. Check Docker logs: `docker logs crm-admin-api`
5. Review MongoDB logs

## Related Files

- `app/routes/crm/calls.py` - Call API endpoints
- `app/models/crm/calls.py` - Call data models
- `app/networks/database.py` - Database configuration
- `app/helpers/general_helper.py` - Helper functions

## License

This script is part of the CRM Admin API Core project.

