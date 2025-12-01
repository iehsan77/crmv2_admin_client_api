# Quick Start Guide - Generate 500 Call Records

## TL;DR - Fast Command Reference

### Generate 500 Calls (Docker)

```bash
# Step 1: Access Docker container
docker exec -it crm-admin-api bash

# Step 2: Run the script
python generate_500_calls.py

# With custom tenant_id and user_id
python generate_500_calls.py 5 3
```

### Clean Up Test Calls (Docker)

```bash
# Step 1: Access Docker container
docker exec -it crm-admin-api bash

# Step 2: Run cleanup script
python cleanup_test_calls.py

# Follow the interactive prompts
```

### One-Line Commands (From Host)

```bash
# Generate calls
docker-compose exec core_api python generate_500_calls.py

# With parameters
docker-compose exec core_api python generate_500_calls.py 5 3

# Run cleanup
docker-compose exec core_api python cleanup_test_calls.py
```

## What Gets Created

### Per Call Record:
- ✅ Unique ID and ukey
- ✅ Subject, type (inbound/outbound), purpose
- ✅ Start time (spread over last 30 days)
- ✅ Duration (5 min to 1 hour)
- ✅ Related entities (contact/lead/account/deal)
- ✅ Phone numbers (caller_id, dialled_number)
- ✅ Agenda, result, description
- ✅ Status, owner, tenant info
- ✅ Activity log entry

### Total Output:
- **500 call records** in `calls` collection
- **500 activity logs** in `activity_logs` collection

## Analysis of Call Save Functionality

### Endpoint: `/crm/calls/save`

**Location**: `app/routes/crm/calls.py` (line 867)

**Method**: POST

**Authentication**: Required (JWT token via oauth2.get_user_by_token)

### Key Fields Required:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | int | Call ID (0 for new) | 0, 1001 |
| `call_for` | string | Entity type | "contact", "lead" |
| `call_for_id` | int | Entity ID | 123 |
| `related_to` | string | Related entity | "account", "deal" |
| `related_to_id` | int | Related entity ID | 456 |
| `type` | string | Call direction | "inbound", "outbound" |
| `status_id` | string | Call status | "1", "2", "3" |
| `start_time` | string | ISO timestamp | "2024-10-10T14:30:00Z" |
| `owner_id` | int | Owner user ID | 1 |
| `subject` | string | Call subject | "Follow-up call" |
| `purpose` | string | Call purpose | "Sales", "Support" |
| `agenda` | string | Call agenda | "Discuss pricing" |
| `duration` | string | Call duration | "15 minutes" |
| `reminder` | string | Reminder info | "" |
| `closed` | int | Closed flag | 0, 1 |
| `deletable` | int | Deletable flag | 0, 1 |

### Auto-Generated Fields:

- `tenant_id` - From user token
- `add_by` - From user token (user ID)
- `ukey` - Generated as `{tenant_id}000{id}`
- `createdon` - Current UTC timestamp
- `updatedon` - Current UTC timestamp
- `active` - Default 1
- `deleted` - Default 0

### Process Flow:

1. **Receive Request** → Extract form data
2. **Determine Operation** → Check if `id == 0` (create) or `id > 0` (update)
3. **Generate Next ID** → If creating, get next available ID from collection
4. **Build Data Object** → Use CallCreate or CallUpdate model
5. **Set Metadata** → Add tenant_id, add_by, timestamps
6. **Generate ukey** → Format: `{tenant_id}000{id}`
7. **Insert/Update** → Save to `calls` collection
8. **Create Activity Log** → Log the operation in `activity_logs` collection
9. **Return Response** → JSON with success message and record data

### Database Collections Used:

1. **calls** - Main call records
   - Index: `id`, `tenant_id`
   - Filter: `deleted != 1`

2. **activity_logs** - Activity tracking
   - Links: `entity_type = "call"`, `entity_id = call.id`
   - Fields: activity_type, user_id, tenant_id, timestamp, metadata

### Example Request (curl):

```bash
curl -X POST "http://localhost:8014/crm/calls/save" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "id=0" \
  -F "call_for=contact" \
  -F "call_for_id=123" \
  -F "related_to=account" \
  -F "related_to_id=456" \
  -F "type=outbound" \
  -F "status_id=1" \
  -F "start_time=2024-10-10T14:30:00Z" \
  -F "owner_id=1" \
  -F "subject=Follow-up on product inquiry" \
  -F "purpose=Sales" \
  -F "agenda=Discuss pricing and packages" \
  -F "duration=15 minutes"
```

## Script Features

### generate_500_calls.py

✅ **Smart Features:**
- Batch insertion (50 records per batch) for performance
- Progress tracking with real-time updates
- Database connection verification
- Realistic data generation (20+ subject variations, 10+ purposes)
- Time distribution (calls spread over 30 days)
- Random but realistic phone numbers
- Automatic activity log creation
- Error handling with detailed messages
- Sample output display

✅ **Configurable:**
- Custom tenant_id
- Custom user_id
- Adjustable batch size

### cleanup_test_calls.py

✅ **Safe Cleanup:**
- Interactive menu system
- Multiple cleanup methods (by range, by count)
- Confirmation required (type "DELETE")
- Statistics display
- Both calls and activity logs removed
- Error handling

## Performance

### Generation Speed:
- **500 calls**: 10-30 seconds
- **Batch size**: 50 records per batch
- **Total batches**: 10 batches

### Database Impact:
- **Calls collection**: +500 documents
- **Activity logs collection**: +500 documents
- **Storage**: ~500KB total

## Verification Commands

### Check Call Count
```bash
docker exec -it crm-admin-api mongosh "YOUR_CONNECTION_STRING" \
  --eval "db.calls.countDocuments({tenant_id: 1, deleted: 0})"
```

### View Sample Calls
```bash
docker exec -it crm-admin-api mongosh "YOUR_CONNECTION_STRING" \
  --eval "db.calls.find({tenant_id: 1}).limit(3).pretty()"
```

### Check Activity Logs
```bash
docker exec -it crm-admin-api mongosh "YOUR_CONNECTION_STRING" \
  --eval "db.activity_logs.countDocuments({entity_type: 'call', tenant_id: 1})"
```

## Common Use Cases

### 1. Testing Call Lists
Generate 500 calls to test pagination, filtering, and sorting.

```bash
docker-compose exec core_api python generate_500_calls.py 1 1
```

### 2. Load Testing
Generate calls for performance testing.

```bash
# Generate for multiple tenants
docker-compose exec core_api python generate_500_calls.py 1 1
docker-compose exec core_api python generate_500_calls.py 2 1
docker-compose exec core_api python generate_500_calls.py 3 1
```

### 3. Demo Data
Create realistic demo data for presentations.

```bash
docker-compose exec core_api python generate_500_calls.py 5 3
```

### 4. Development Testing
Quick test data generation during development.

```bash
docker exec -it crm-admin-api python generate_500_calls.py
```

## Troubleshooting

### Error: "Database connection failed"
```bash
# Check if MongoDB is running
docker ps | grep mongo

# Test connection
docker exec -it crm-admin-api python -c "from app.networks.database import db; print(db.client.server_info())"
```

### Error: "Module not found"
```bash
# Install dependencies
docker exec -it crm-admin-api pip install -r requirements.txt
```

### Error: "Permission denied"
```bash
# Fix permissions
chmod +x generate_500_calls.py cleanup_test_calls.py
```

## Files Created

1. **generate_500_calls.py** - Main generation script
2. **cleanup_test_calls.py** - Cleanup utility script
3. **GENERATE_CALLS_README.md** - Detailed documentation
4. **QUICK_START_CALLS_GENERATION.md** - This quick start guide

## Next Steps

After generating calls:

1. ✅ Verify via API: `GET /crm/calls/list`
2. ✅ Test filtering and search
3. ✅ Test call detail view
4. ✅ Test call updates
5. ✅ Test activity logs display
6. ✅ Test custom views
7. ✅ Clean up when done

## Support

For detailed information, see **GENERATE_CALLS_README.md**

For issues:
1. Check Docker logs: `docker logs crm-admin-api`
2. Verify MongoDB connection
3. Check script output for specific errors
4. Review the detailed documentation

---

**Ready to generate 500 calls? Run:**

```bash
docker exec -it crm-admin-api python generate_500_calls.py
```

