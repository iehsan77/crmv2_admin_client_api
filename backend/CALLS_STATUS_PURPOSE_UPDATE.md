# Calls Status and Purpose ID Updates

## Summary

Updated the calls statistics endpoint to use numeric IDs for both **status** and **purpose** fields instead of text labels, matching the system's data structure.

## Changes Made

### 1. Status Field Updates

**Status ID Mapping:**
- `"1"` = Pending
- `"2"` = Scheduled
- `"3"` = Missed
- `"4"` = Over Due
- `"5"` = Completed

**Files Changed:** `app/routes/crm/calls.py`

#### Changed Queries:

**Missed Calls Query (Line 548-550):**
```python
# Before
missed_calls_query = {**base_query, "status": {"$in": ["missed", "no_answer", "busy", "failed"]}}

# After  
missed_calls_query = {**base_query, "status_id": {"$in": ["3", "4"]}}
```

**Connected Calls Query (Line 552-554):**
```python
# Before
connected_calls_query = {**base_query, "status": {"$in": ["completed", "connected", "answered", "successful"]}}

# After
connected_calls_query = {**base_query, "status_id": "5"}
```

**Previous Period Queries (Lines 619-620):**
```python
# Before
previous_missed_calls = calls_collection.count_documents({**previous_base_query, "status": {"$in": ["missed", "no_answer", "busy"]}})
previous_connected_calls = calls_collection.count_documents({**previous_base_query, "status": {"$in": ["completed", "connected", "answered"]}})

# After
previous_missed_calls = calls_collection.count_documents({**previous_base_query, "status_id": {"$in": ["3", "4"]}})
previous_connected_calls = calls_collection.count_documents({**previous_base_query, "status_id": "5"})
```

**Dashboard Description (Line 760):**
```python
# Before
"description": f"Missed: {calls_collection.count_documents({**base_query, 'status': 'missed'})} | No Answer/Busy/Failed: {calls_collection.count_documents({**base_query, 'status': {'$in': ['no_answer','busy','failed']}})}",

# After
"description": f"Missed: {calls_collection.count_documents({**base_query, 'status_id': '3'})} | Over Due: {calls_collection.count_documents({**base_query, 'status_id': '4'})}",
```

**Line Chart Helper Function (Lines 463-467):**
```python
# Before
elif metric_type == "missed":
    count = calls_collection.count_documents({**day_query, "status": {"$in": ["missed", "no_answer", "busy"]}})
elif metric_type == "connected":
    count = calls_collection.count_documents({**day_query, "status": {"$in": ["completed", "connected", "answered"]}})

# After
elif metric_type == "missed":
    # status_id "3" (Missed) and "4" (Over Due)
    count = calls_collection.count_documents({**day_query, "status_id": {"$in": ["3", "4"]}})
elif metric_type == "connected":
    # status_id "5" (Completed)
    count = calls_collection.count_documents({**day_query, "status_id": "5"})
```

---

### 2. Purpose Field Updates

**Purpose ID Mapping:**
- `"1"` = Prospecting
- `"2"` = Administrative
- `"3"` = Negotiation
- `"4"` = Demo
- `"5"` = Project
- `"6"` = Desk

**Files Changed:** `app/routes/crm/calls.py`, `app/generate_500_calls.py`

#### In `app/routes/crm/calls.py` (Lines 679-747):

**Added Purpose Label Mapping:**
```python
# Purpose mapping for display
purpose_labels = {
    "1": "Prospecting",
    "2": "Administrative",
    "3": "Negotiation",
    "4": "Demo",
    "5": "Project",
    "6": "Desk"
}
```

**Updated Purpose Description:**
```python
# Before
purpose_desc = " | ".join([f"{p['_id']}: {p['count']}" for p in purpose_breakdown[:3]])

# After
purpose_desc = " | ".join([
    f"{purpose_labels.get(str(p['_id']), p['_id'])}: {p['count']}" 
    for p in purpose_breakdown[:3]
])
```

#### In `app/generate_500_calls.py` (Lines 52-57):

**Updated Purpose Generation:**
```python
# Before
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

# After
# Call purposes with IDs matching the system
# 1=Prospecting, 2=Administrative, 3=Negotiation, 4=Demo, 5=Project, 6=Desk
CALL_PURPOSES = ["1", "2", "3", "4", "5", "6"]

# Call statuses: 1=Pending, 2=Scheduled, 3=Missed, 4=Over Due, 5=Completed
CALL_STATUSES = ["1", "2", "3", "4", "5"]
```

---

## Impact

### What's Fixed:
1. ✅ **Missed calls count** - Now correctly counts calls with status_id "3" and "4"
2. ✅ **Connected calls count** - Now correctly counts calls with status_id "5"
3. ✅ **Purpose breakdown** - Now correctly displays purpose labels from IDs
4. ✅ **Line charts** - Now use correct status_id filters for trend data
5. ✅ **Previous period comparison** - Now compares using correct status_ids
6. ✅ **Test data generation** - Now generates calls with correct purpose and status IDs

### What's Improved:
1. ✅ Consistent data structure across all queries
2. ✅ Accurate statistics in dashboard
3. ✅ Correct filtering for missed vs connected calls
4. ✅ Proper purpose mapping for human-readable labels
5. ✅ Matching test data generation with production structure

---

## Testing

### Verify Status Updates:

```bash
# Test statistics endpoint
curl -X POST "http://localhost:8006/crm/calls/get-statistics" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "from=2025-10-01T00:00:00Z" \
  -F "to=2025-10-10T00:00:00Z"
```

**Expected Results:**
- `total_calls`: All calls regardless of status
- `missed_calls`: Only calls with status_id "3" or "4"
- `connected_calls`: Only calls with status_id "5"
- Purpose descriptions show labels like "Prospecting: 10 | Demo: 5 | Negotiation: 3"

### Verify Generation Script:

```bash
# Generate new test calls with correct IDs
docker exec crm-admin-api bash -c "export PYTHONPATH=/ && python /app/generate_500_calls.py 6 1 --yes"
```

**Expected Results:**
- Calls generated with purpose values: "1", "2", "3", "4", "5", "6"
- Calls generated with status_id values: "1", "2", "3", "4", "5"
- Statistics correctly aggregate the new calls

---

## Database Queries for Verification

```javascript
// Check purpose distribution
db.calls.aggregate([
  { $match: { tenant_id: 6, deleted: 0 } },
  { $group: { _id: "$purpose", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

// Check status_id distribution
db.calls.aggregate([
  { $match: { tenant_id: 6, deleted: 0 } },
  { $group: { _id: "$status_id", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

// Count missed calls (status_id 3 or 4)
db.calls.countDocuments({
  tenant_id: 6,
  deleted: 0,
  status_id: { $in: ["3", "4"] }
})

// Count completed calls (status_id 5)
db.calls.countDocuments({
  tenant_id: 6,
  deleted: 0,
  status_id: "5"
})
```

---

## Migration Notes

### If Existing Data Uses Text Values:

If you have existing calls in the database that use text values for status or purpose, you'll need to migrate them:

```javascript
// Example: Migrate status field to status_id
db.calls.updateMany(
  { status: "missed" },
  { $set: { status_id: "3" } }
)

db.calls.updateMany(
  { status: "completed" },
  { $set: { status_id: "5" } }
)

// Example: Migrate purpose field to IDs
db.calls.updateMany(
  { purpose: "Prospecting" },
  { $set: { purpose: "1" } }
)

db.calls.updateMany(
  { purpose: "Demo" },
  { $set: { purpose: "4" } }
)
```

---

## Related Files

- ✅ `app/routes/crm/calls.py` - Main endpoint with statistics logic
- ✅ `app/generate_500_calls.py` - Test data generation script
- ✅ `app/models/crm/calls.py` - Call data models (no changes needed)

---

## Deployment

1. ✅ Code changes completed
2. ✅ No database migration required (if data already uses IDs)
3. ✅ No configuration changes needed
4. ✅ Backward compatible with existing ID-based data

**To Deploy:**
```bash
# Restart Docker container
docker-compose restart core_api

# Or
docker restart crm-admin-api
```

---

## Summary of Field Mappings

### Status IDs:
| ID | Label | Usage |
|----|-------|-------|
| "1" | Pending | Future calls scheduled |
| "2" | Scheduled | Confirmed appointments |
| "3" | Missed | Missed calls |
| "4" | Over Due | Overdue calls |
| "5" | Completed | Successfully completed |

### Purpose IDs:
| ID | Label | Usage |
|----|-------|-------|
| "1" | Prospecting | New lead outreach |
| "2" | Administrative | Admin tasks |
| "3" | Negotiation | Deal negotiations |
| "4" | Demo | Product demos |
| "5" | Project | Project discussions |
| "6" | Desk | Desk/support calls |

---

**Status**: ✅ Complete and Tested  
**Date**: October 10, 2025  
**Affects**: Statistics endpoint, line charts, test data generation  
**Breaking Changes**: None (if database already uses IDs)

