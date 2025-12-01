# Vehicle Statistics API Documentation

## Overview

The Vehicle Statistics API provides comprehensive analytics and insights about vehicle fleets, including total counts, new/old vehicle ratios, availability status, and performance metrics. This endpoint is designed to give fleet managers and administrators a complete overview of their vehicle operations.

## API Endpoint

```
POST /rentify/vehicles/stats/get
```

## Authentication

This endpoint requires authentication using a Bearer token in the Authorization header.

```http
Authorization: Bearer YOUR_TOKEN_HERE
```

## Request Parameters

### Form Data Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `date_range` | string | No | `"30_days"` | Date range for statistics calculation |

### Date Range Options

| Value | Description |
|-------|-------------|
| `"7_days"` | Last 7 days |
| `"30_days"` | Last 30 days (default) |
| `"90_days"` | Last 90 days |

## Response Structure

### Success Response (200 OK)

```json
{
  "status": 200,
  "message": "Vehicle statistics retrieved successfully",
  "data": {
    "stats": {
      "total_cars": {
        "counter": 340,
        "percent": 4.02,
        "size_in_range": 45,
        "cars_added": 12,
        "cars_removed": 7
      },
      "new_cars": {
        "counter": 80,
        "percent": -0.8,
        "of_total_fleet": 23.53,
        "average_age": 0.4
      },
      "old_cars": {
        "counter": 260,
        "percent": -0.4,
        "of_total_fleet": 76.47,
        "classified_to_old": 5
      },
      "available_cars": {
        "counter": 240,
        "available_fleet": 70.59,
        "available_range": 70.59
      },
      "booked_cars": {
        "counter": 100,
        "fleet_booked": 29.41,
        "peek_booking_day": "tuesday"
      },
      "active_cars": {
        "counter": 220,
        "percent": 1.4,
        "total_fleet": 64.71,
        "deactivated": 3
      }
    },
    "vehicle_status": {
      "percents": {
        "new": 23.53,
        "old": 76.47,
        "active": 64.71,
        "inactive": 35.29
      },
      "counters": {
        "new_cars": 80,
        "old_cars": 260
      }
    }
  },
  "date_range": "30_days",
  "tenant_id": 123
}
```

### Error Response (500 Internal Server Error)

```json
{
  "status": 500,
  "message": "Failed to retrieve vehicle statistics",
  "data": null
}
```

## Data Structure Details

### 1. Total Cars Statistics

| Field | Type | Description |
|-------|------|-------------|
| `counter` | integer | Total number of vehicles in the fleet |
| `percent` | float | Percentage change from previous period |
| `size_in_range` | integer | Number of vehicles in current date range |
| `cars_added` | integer | New vehicles added in the current period |
| `cars_removed` | integer | Vehicles removed in the current period |

### 2. New Cars Statistics

| Field | Type | Description |
|-------|------|-------------|
| `counter` | integer | Number of new vehicles (added in current period) |
| `percent` | float | Percentage change from previous period |
| `of_total_fleet` | float | Percentage of new cars in total fleet |
| `average_age` | float | Average age of new cars in years |

### 3. Old Cars Statistics

| Field | Type | Description |
|-------|------|-------------|
| `counter` | integer | Number of old vehicles (>1 year old) |
| `percent` | float | Percentage change from previous period |
| `of_total_fleet` | float | Percentage of old cars in total fleet |
| `classified_to_old` | integer | Vehicles that became old in current period |

### 4. Available Cars Statistics

| Field | Type | Description |
|-------|------|-------------|
| `counter` | integer | Number of available vehicles |
| `available_fleet` | float | Percentage of fleet that is available |
| `available_range` | float | Percentage of total vehicles available |

### 5. Booked Cars Statistics

| Field | Type | Description |
|-------|------|-------------|
| `counter` | integer | Number of currently booked vehicles |
| `fleet_booked` | float | Percentage of fleet that is booked |
| `peek_booking_day` | string | Day of the week with most bookings |

### 6. Active Cars Statistics

| Field | Type | Description |
|-------|------|-------------|
| `counter` | integer | Number of active vehicles |
| `percent` | float | Percentage change from previous period |
| `total_fleet` | float | Percentage of total fleet that is active |
| `deactivated` | integer | Vehicles deactivated in current period |

### 7. Vehicle Status Summary

#### Percentages
| Field | Type | Description |
|-------|------|-------------|
| `new` | float | Percentage of new vehicles in fleet |
| `old` | float | Percentage of old vehicles in fleet |
| `active` | float | Percentage of active vehicles in fleet |
| `inactive` | float | Percentage of inactive vehicles in fleet |

#### Counters
| Field | Type | Description |
|-------|------|-------------|
| `new_cars` | integer | Count of new vehicles |
| `old_cars` | integer | Count of old vehicles |

## Usage Examples

### 1. Get Default Statistics (30 days)

```bash
curl -X POST "http://localhost:8000/rentify/vehicles/stats/get" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d ""
```

### 2. Get 7 Days Statistics

```bash
curl -X POST "http://localhost:8000/rentify/vehicles/stats/get" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "date_range=7_days"
```

### 3. Get 90 Days Statistics

```bash
curl -X POST "http://localhost:8000/rentify/vehicles/stats/get" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "date_range=90_days"
```

### 4. Python Example

```python
import requests

url = "http://localhost:8000/rentify/vehicles/stats/get"
headers = {
    "Authorization": "Bearer YOUR_TOKEN"
}
data = {
    "date_range": "30_days"
}

response = requests.post(url, data=data, headers=headers)
if response.status_code == 200:
    stats = response.json()
    total_cars = stats['data']['stats']['total_cars']['counter']
    print(f"Total cars: {total_cars}")
```

## Business Logic

### 1. Date Range Calculation

- **7 Days**: Current time - 7 days to current time
- **30 Days**: Current time - 30 days to current time  
- **90 Days**: Current time - 90 days to current time

### 2. Period Comparison

- Current period statistics are compared with the previous equivalent period
- Percentage changes show growth/decline trends
- Previous period is calculated as: `start_date - period_length` to `start_date`

### 3. Vehicle Classification

- **New Cars**: Vehicles created in the current period
- **Old Cars**: Vehicles older than 1 year (365 days)
- **Active Cars**: Vehicles with `active = 1`
- **Available Cars**: Active vehicles (simplified logic)
- **Booked Cars**: Total vehicles minus available vehicles

### 4. Percentage Calculations

- **Fleet Percentages**: (Category Count / Total Fleet) × 100
- **Period Changes**: ((Current - Previous) / Previous) × 100
- **Availability Ratios**: (Available / Total) × 100

## Implementation Notes

### 1. Placeholder Values

Some statistics currently use placeholder values and may need enhancement:

- **Average Age**: Currently hardcoded to 0.4 years
- **Peak Booking Day**: Currently hardcoded to "tuesday"
- **Classified to Old**: Currently hardcoded to 0
- **Deactivated Count**: Currently hardcoded to 0

### 2. Future Enhancements

The following features could be added for more accurate statistics:

- **Rental System Integration**: Real-time booking status
- **Age Calculation**: Actual vehicle age based on creation date
- **Booking Analytics**: Real peak booking day calculation
- **Maintenance Tracking**: Vehicle maintenance status
- **Financial Metrics**: Revenue per vehicle, cost analysis

### 3. Performance Considerations

- Statistics are calculated using MongoDB aggregation
- Date range filtering is applied at the database level
- Tenant isolation ensures data security
- Caching could be implemented for frequently accessed statistics

## Error Handling

### 1. Invalid Date Range

If an invalid `date_range` is provided, the system defaults to `"30_days"`.

### 2. Database Errors

Database connection issues or query errors return a 500 status with an error message.

### 3. Authentication Errors

Invalid or missing authentication tokens return appropriate HTTP status codes.

## Security Considerations

### 1. Tenant Isolation

- All statistics are filtered by tenant ID
- Global vehicles are accessible to all tenants
- Tenant-specific vehicles are isolated per tenant

### 2. Authentication Required

- All requests must include a valid Bearer token
- Token validation is performed before data access

### 3. Data Privacy

- Vehicle details are not exposed in statistics
- Only aggregated counts and percentages are returned
- Personal information is not included in responses

## Testing

### 1. Test Cases

- Valid date ranges (7, 30, 90 days)
- Invalid date range handling
- Authentication validation
- Error handling scenarios
- Data accuracy verification

### 2. Test Data

Ensure test environment has:
- Multiple vehicles with different creation dates
- Active and inactive vehicles
- Vehicles from different tenants
- Various vehicle ages and statuses

## Monitoring and Logging

### 1. Performance Metrics

- Response time monitoring
- Database query performance
- Error rate tracking
- Usage statistics

### 2. Logging

- All requests are logged with tenant ID and date range
- Errors are logged with detailed stack traces
- Performance metrics are recorded

## Conclusion

The Vehicle Statistics API provides comprehensive fleet analytics that help fleet managers make informed decisions about vehicle operations, maintenance schedules, and fleet expansion. The endpoint is designed to be scalable, secure, and easily extensible for future enhancements.

For questions or support, please refer to the main API documentation or contact the development team.
