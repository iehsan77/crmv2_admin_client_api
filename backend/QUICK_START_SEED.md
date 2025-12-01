# Quick Start: Seed CRM Data

## 🚀 Fastest Way to Run

### Using the Shell Script (Easiest)

```bash
./run_seed.sh
```

### Manual Docker Command

```bash
docker exec -it crm-admin-api python seed_crm_data.py
```

### Using Docker Compose

```bash
docker-compose exec core_api python seed_crm_data.py
```

## 📋 What Gets Created

- **30 Leads** → Sample lead records
- **30 Accounts** → Company accounts  
- **35 Contacts** → Linked to accounts
- **30 Deals** → Linked to accounts/contacts/leads
- **30 Tasks** → Linked to various entities
- **25 Meetings** → Linked to contacts/accounts
- **20 Calls** → Linked to contacts/accounts/leads/deals

**Total: 200 records** with proper relationships for **tenant_id = 7**

## ⚙️ Configuration

Edit these values at the top of `seed_crm_data.py` if needed:

```python
TENANT_ID = 7      # Change if needed
USER_ID = 1        # Default user
OWNER_ID = 1       # Default owner
```

## 🔍 Verify Results

After running, check your CRM application:
1. Navigate to each entity type (Leads, Accounts, Contacts, etc.)
2. Filter by tenant_id = 7
3. Verify relationships are properly linked

## ❓ Troubleshooting

**Container not found?**
```bash
docker ps  # Check container name
docker ps | grep crm  # Find CRM containers
```

**Script not found in container?**
```bash
docker cp seed_crm_data.py crm-admin-api:/app/
```

**Database connection error?**
- Check MongoDB connection in `app/networks/database.py`
- Verify network access from Docker container

## 📚 More Info

See `SEED_DATA_README.md` for detailed documentation.

