# Vehicle View System Documentation

## Overview

The vehicle view system provides predefined filtering views that can be combined with additional filters to create powerful vehicle search and filtering capabilities. Each view applies specific base filters, and then all other filters are applied on top of the view results.

## Available Views

### 1. **all_cars** (Default)
- **Description**: Shows all vehicles accessible to the tenant (global + tenant-specific)
- **Base Filters**: None (shows all accessible vehicles)
- **Use Case**: General browsing, comprehensive vehicle listing

### 2. **my_cars**
- **Description**: Shows only vehicles assigned to the current tenant
- **Base Filters**: `tenant_id = current_tenant_id`
- **Use Case**: Tenant-specific vehicle management

### 3. **affiliate_cars**
- **Description**: Shows vehicles from other tenants (affiliate vehicles)
- **Base Filters**: `tenant_id != current_tenant_id AND is_global != 1`
- **Use Case**: Viewing vehicles from partner/affiliate tenants

### 4. **active_cars**
- **Description**: Shows only active vehicles
- **Base Filters**: `active = 1`
- **Use Case**: Viewing only operational vehicles

### 5. **inactive_cars**
- **Description**: Shows only inactive vehicles
- **Base Filters**: `active = 0`
- **Use Case**: Viewing disabled/suspended vehicles

### 6. **available_for_rent**
- **Description**: Shows vehicles available for rental
- **Base Filters**: `active = 1`
- **Note**: Currently a placeholder - may need rental status logic
- **Use Case**: Viewing vehicles ready for booking

### 7. **rented**
- **Description**: Shows currently rented vehicles
- **Base Filters**: `active = 1`
- **Note**: Currently a placeholder - needs rental system integration
- **Use Case**: Viewing vehicles currently in use

### 8. **cancelled**
- **Description**: Shows cancelled vehicles
- **Base Filters**: `active = 0`
- **Note**: May need specific cancelled status field
- **Use Case**: Viewing cancelled/voided vehicles

### 9. **pending_bookings**
- **Description**: Shows vehicles with pending bookings
- **Base Filters**: `active = 1`
- **Note**: Currently a placeholder - needs booking system integration
- **Use Case**: Viewing vehicles with pending reservations

### 10. **favourit_cars**
- **Description**: Shows favorite vehicles
- **Base Filters**: `active = 1`
- **Note**: Currently a placeholder - needs favorites system integration
- **Use Case**: Viewing user's favorite vehicles

### 11. **recently_updated**
- **Description**: Shows vehicles updated in the last 7 days
- **Base Filters**: `createdon >= 7_days_ago OR updatedon >= 7_days_ago`
- **Use Case**: Viewing recently modified vehicles

### 12. **no_recent_activity**
- **Description**: Shows vehicles with no activity in the last 30 days
- **Base Filters**: `createdon < 30_days_ago AND updatedon < 30_days_ago`
- **Use Case**: Identifying inactive/neglected vehicles

## How It Works

### 1. **View Application (First)**
The system first applies the view-specific base filters to create the initial result set.

### 2. **Additional Filters (Second)**
All other filters (brand_id, title, rent_price, etc.) are then applied on top of the view results.

### 3. **Filter Combination**
- Views use `$and` and `$or` operators to combine multiple conditions
- Additional filters are merged with view filters using MongoDB query operators
- Complex queries are properly structured to avoid conflicts

## API Usage

### Request Format
```http
POST /rentify/vehicles/get
Content-Type: application/x-www-form-urlencoded

view=my_cars&brand_id=5&rent_price_min=50&active=1
```

### Response Structure
```json
{
  "status": 200,
  "message": "Records retrieved successfully",
  "data": [...],
  "total_count": 25,
  "view_statistics": {
    "all_cars": 100,
    "my_cars": 25,
    "affiliate_cars": 15,
    "active_cars": 80,
    "inactive_cars": 20,
    "available_for_rent": 80,
    "rented": 0,
    "cancelled": 5,
    "pending_bookings": 0,
    "favourit_cars": 0,
    "recently_updated": 12,
    "no_recent_activity": 8
  },
  "filters_summary": {
    "view": "my_cars",
    "brand_id": "5",
    "rent_price_min": "50",
    "active": "1"
  },
  "filters_applied": {...},
  "warnings": []
}
```

## Filter Combinations

### Example 1: My Active Cars
```
view=my_cars&active=1
```
- First applies: `tenant_id = current_tenant_id`
- Then applies: `active = 1`
- Result: Only active vehicles belonging to current tenant

### Example 2: Recently Updated Available Cars
```
view=available_for_rent&last_activity=last_7_days
```
- First applies: `active = 1`
- Then applies: date filter for last 7 days
- Result: Active vehicles updated in last 7 days

### Example 3: Affiliate Cars with Brand Filter
```
view=affiliate_cars&brand_id=5&rent_price_min=100
```
- First applies: `tenant_id != current_tenant_id AND is_global != 1`
- Then applies: `brand_id = 5 AND rent_price >= 100`
- Result: Affiliate vehicles from brand 5 with rent price >= 100

## Implementation Notes

### 1. **Placeholder Views**
Some views (rented, pending_bookings, favourit_cars) are currently placeholders and may need:
- Rental system integration
- Booking system integration
- Favorites system integration
- Additional database fields

### 2. **Performance Considerations**
- Views are applied first to reduce the initial dataset
- Additional filters are then applied for further refinement
- Statistics are calculated separately to avoid performance impact

### 3. **Tenant Isolation**
- All views respect tenant access controls
- Global vehicles are accessible to all tenants
- Tenant-specific vehicles are isolated per tenant

### 4. **Error Handling**
- Invalid view values default to "all_cars"
- Filter errors are logged and included in warnings
- Invalid filters are skipped without breaking the query

## Future Enhancements

### 1. **Rental System Integration**
- Add rental status field to vehicles
- Implement proper rented/available logic
- Add rental history tracking

### 2. **Booking System Integration**
- Add booking status fields
- Implement pending bookings logic
- Add booking workflow states

### 3. **Favorites System**
- Add user favorites table
- Implement favorites filtering
- Add favorites management endpoints

### 4. **Advanced Views**
- Add date range views
- Add location-based views
- Add performance-based views
- Add maintenance-based views

## Testing

### Test Cases
1. **View Isolation**: Ensure each view returns correct data subset
2. **Filter Combination**: Test view + filter combinations
3. **Tenant Isolation**: Verify tenant access controls
4. **Performance**: Test with large datasets
5. **Error Handling**: Test invalid inputs and edge cases

### Sample Test Queries
```bash
# Test basic views
curl -X POST "http://localhost:8000/rentify/vehicles/get" \
  -d "view=my_cars"

# Test view + filters
curl -X POST "http://localhost:8000/rentify/vehicles/get" \
  -d "view=active_cars&brand_id=5&rent_price_min=100"

# Test complex combinations
curl -X POST "http://localhost:8000/rentify/vehicles/get" \
  -d "view=recently_updated&body_type_id=2&seats_min=5&fuel_type_id=1"
```

## Conclusion

The vehicle view system provides a powerful and flexible way to filter vehicles based on predefined business logic while maintaining the ability to apply additional filters. The system is designed to be extensible and can easily accommodate new views and filter combinations as business requirements evolve.
