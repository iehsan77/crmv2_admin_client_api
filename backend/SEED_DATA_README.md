# CRM Data Seeding Script

This script generates 200 sample CRM records with proper relationships for tenant_id = 7.

## What It Creates

- **30 Leads** - Sample lead records
- **30 Accounts** - Company accounts
- **35 Contacts** - Linked to accounts
- **30 Deals** - Linked to accounts, contacts, and leads
- **30 Tasks** - Linked to various entities (leads, contacts, accounts, deals)
- **25 Meetings** - Linked to contacts and accounts
- **20 Calls** - Linked to contacts, accounts, leads, and deals

**Total: 200 records** with proper relationships

## Configuration

The script is configured for:
- **Tenant ID**: 7
- **User ID**: 1 (default)
- **Owner ID**: 1 (default)

You can modify these values in the script at the top of `seed_crm_data.py`:

```python
TENANT_ID = 7
USER_ID = 1
OWNER_ID = 1
```

## Running the Script

### Option 1: Run in Docker Container (Recommended)

1. Make sure your Docker container is running:
   ```bash
   docker ps
   ```

2. Check the container name (should be `crm-admin-api`):
   ```bash
   docker ps | grep crm-admin-api
   ```

3. Copy the script to the container (if needed):
   ```bash
   docker cp seed_crm_data.py crm-admin-api:/app/
   ```

4. Execute the script inside the container:
   ```bash
   docker exec -it crm-admin-api python seed_crm_data.py
   ```

### Option 2: Run Directly (Local)

If you have the environment set up locally:

```bash
python seed_crm_data.py
```

### Option 3: Run via Docker Compose

```bash
docker-compose exec core_api python seed_crm_data.py
```

## Output

The script will show progress as it creates records:

```
============================================================
CRM Data Seeding Script
============================================================
Tenant ID: 7
Total Records Target: 200
============================================================

📊 Distribution:
  Leads: 30
  Accounts: 30
  Contacts: 35
  Deals: 30
  Tasks: 30
  Meetings: 25
  Calls: 20
  Total: 200

📋 Creating 30 leads...
  ✓ Created 20/30 leads
  ✅ Created 30 leads

🏢 Creating 30 accounts...
  ...
```

## Relationships Created

- **Contacts** → Linked to **Accounts**
- **Deals** → Linked to **Accounts**, **Contacts**, and **Leads**
- **Tasks** → Linked to **Leads**, **Contacts**, **Accounts**, **Deals**
- **Meetings** → Linked to **Contacts** and **Accounts**
- **Calls** → Linked to **Contacts**, **Accounts**, **Leads**, and **Deals**

## Data Quality

All generated data includes:
- Realistic names, emails, phone numbers
- Proper date ranges (past dates for creation, future dates for deadlines)
- Random but valid status IDs, source IDs, type IDs
- Proper relationships between entities
- All required fields populated
- Proper tenant isolation (tenant_id = 7)

## Troubleshooting

### Database Connection Error

If you see a connection error:
1. Verify your MongoDB connection string in `app/networks/database.py`
2. Check if the Docker container has network access to MongoDB
3. Verify MongoDB credentials are correct

### Duplicate Key Error

If you see duplicate key errors:
1. The script uses `get_next_id()` which counts existing documents
2. If documents were deleted, there might be ID conflicts
3. Check existing data for tenant_id = 7

### Missing Collections

If collections don't exist:
- MongoDB will create them automatically on first insert
- No manual setup required

## Customization

You can modify the script to:
- Change the number of records per entity type
- Adjust date ranges
- Add more sample data options
- Change tenant_id, user_id, or owner_id

## Verification

After running the script, verify the data:

1. Check counts in your CRM application
2. Verify relationships are properly linked
3. Check that all records show tenant_id = 7

## Notes

- The script uses `get_next_id()` which may have ID conflicts if documents were deleted
- All dates are generated in UTC timezone
- Email addresses are generated based on names
- Phone numbers follow US format (+1XXXXXXXXXX)
- The script handles errors gracefully and continues creating remaining records

