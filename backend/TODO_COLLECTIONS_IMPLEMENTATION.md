# TODO: Required Collections and Implementations

## Overview

This document lists all the required collections and implementations that need to be created to fully implement the vehicle view system and statistics functionality. Currently, these features use placeholder values and simplified logic.

## 🚗 Vehicle Views - Required Collections

### 1. **Rental System Collections**

#### `rentals` Collection
```javascript
{
  "_id": ObjectId,
  "id": Number,                    // Unique rental ID
  "vehicle_id": Number,            // Reference to vehicle
  "tenant_id": Number,             // Tenant who owns the rental
  "customer_id": Number,           // Customer renting the vehicle
  "rental_start": Date,            // Rental start date/time
  "rental_end": Date,              // Rental end date/time
  "actual_return": Date,           // Actual return date/time
  "status": String,                // "active", "completed", "cancelled"
  "total_amount": Number,          // Total rental amount
  "deposit": Number,               // Security deposit
  "createdon": Date,
  "updatedon": Date,
  "deleted": Number
}
```

#### `rental_status` Collection
```javascript
{
  "_id": ObjectId,
  "id": Number,                    // Unique status ID
  "rental_id": Number,             // Reference to rental
  "vehicle_id": Number,            // Reference to vehicle
  "status": String,                // "reserved", "active", "returned", "cancelled"
  "status_date": Date,             // When status changed
  "notes": String,                 // Status change notes
  "createdon": Date,
  "deleted": Number
}
```

#### `vehicle_rental_history` Collection
```javascript
{
  "_id": ObjectId,
  "id": Number,                    // Unique history ID
  "vehicle_id": Number,            // Reference to vehicle
  "rental_id": Number,             // Reference to rental
  "action": String,                // "rented", "returned", "cancelled"
  "action_date": Date,             // When action occurred
  "duration_days": Number,         // Rental duration
  "revenue": Number,               // Revenue from this rental
  "createdon": Date,
  "deleted": Number
}
```

### 2. **Booking System Collections**

#### `bookings` Collection
```javascript
{
  "_id": ObjectId,
  "id": Number,                    // Unique booking ID
  "vehicle_id": Number,            // Reference to vehicle
  "customer_id": Number,           // Customer making booking
  "tenant_id": Number,             // Tenant who owns the vehicle
  "booking_date": Date,            // Requested booking date
  "start_time": Date,              // Booking start time
  "end_time": Date,                // Booking end time
  "status": String,                // "pending", "confirmed", "cancelled", "completed"
  "total_amount": Number,          // Booking amount
  "createdon": Date,
  "updatedon": Date,
  "deleted": Number
}
```

#### `booking_status` Collection
```javascript
{
  "_id": ObjectId,
  "id": Number,                    // Unique status ID
  "booking_id": Number,            // Reference to booking
  "status": String,                // "pending", "confirmed", "cancelled", "completed"
  "status_date": Date,             // When status changed
  "notes": String,                 // Status change notes
  "createdon": Date,
  "deleted": Number
}
```

#### `vehicle_booking_queue` Collection
```javascript
{
  "_id": ObjectId,
  "id": Number,                    // Unique queue ID
  "vehicle_id": Number,            // Reference to vehicle
  "booking_id": Number,            // Reference to booking
  "queue_position": Number,        // Position in queue
  "priority": String,              // "low", "medium", "high", "urgent"
  "createdon": Date,
  "deleted": Number
}
```

### 3. **Favorites System Collections**

#### `user_favorites` Collection
```javascript
{
  "_id": ObjectId,
  "id": Number,                    // Unique favorite ID
  "user_id": Number,               // User who favorited
  "tenant_id": Number,             // Tenant context
  "favorite_type": String,         // "vehicle", "brand", "model"
  "favorite_id": Number,           // ID of favorited item
  "createdon": Date,
  "deleted": Number
}
```

#### `vehicle_favorites` Collection
```javascript
{
  "_id": ObjectId,
  "id": Number,                    // Unique vehicle favorite ID
  "vehicle_id": Number,            // Reference to vehicle
  "user_id": Number,               // User who favorited
  "tenant_id": Number,             // Tenant context
  "favorite_date": Date,           // When favorited
  "notes": String,                 // User notes about favorite
  "createdon": Date,
  "deleted": Number
}
```

#### `favorite_categories` Collection
```javascript
{
  "_id": ObjectId,
  "id": Number,                    // Unique category ID
  "name": String,                  // Category name
  "description": String,           // Category description
  "tenant_id": Number,             // Tenant context
  "active": Number,                // 1 = active, 0 = inactive
  "createdon": Date,
  "deleted": Number
}
```

### 4. **Vehicle Status Tracking Collections**

#### `vehicle_status_history` Collection
```javascript
{
  "_id": ObjectId,
  "id": Number,                    // Unique history ID
  "vehicle_id": Number,            // Reference to vehicle
  "status": String,                // "active", "inactive", "maintenance", "cancelled"
  "status_date": Date,             // When status changed
  "reason": String,                // Reason for status change
  "changed_by": Number,            // User who changed status
  "tenant_id": Number,             // Tenant context
  "createdon": Date,
  "deleted": Number
}
```

#### `vehicle_events` Collection
```javascript
{
  "_id": ObjectId,
  "id": Number,                    // Unique event ID
  "vehicle_id": Number,            // Reference to vehicle
  "event_type": String,            // "activation", "deactivation", "maintenance", "cancellation"
  "event_date": Date,              // When event occurred
  "description": String,           // Event description
  "user_id": Number,               // User who triggered event
  "tenant_id": Number,             // Tenant context
  "metadata": Object,              // Additional event data
  "createdon": Date,
  "deleted": Number
}
```

#### `cancellation_reasons` Collection
```javascript
{
  "_id": ObjectId,
  "id": Number,                    // Unique reason ID
  "reason": String,                // Cancellation reason
  "description": String,           // Detailed description
  "category": String,              // "maintenance", "damage", "business", "other"
  "tenant_id": Number,             // Tenant context
  "active": Number,                // 1 = active, 0 = inactive
  "createdon": Date,
  "deleted": Number
}
```

### 5. **Vehicle Availability Collections**

#### `vehicle_availability` Collection
```javascript
{
  "_id": ObjectId,
  "id": Number,                    // Unique availability ID
  "vehicle_id": Number,            // Reference to vehicle
  "date": Date,                    // Date of availability
  "status": String,                // "available", "booked", "maintenance", "unavailable"
  "time_slots": Array,             // Available time slots
  "notes": String,                 // Availability notes
  "tenant_id": Number,             // Tenant context
  "createdon": Date,
  "updatedon": Date,
  "deleted": Number
}
```

## 📊 Statistics System - Required Implementations

### 1. **Age Calculation Logic**

```python
def calculate_vehicle_age(createdon: str) -> float:
    """
    Calculate vehicle age in years based on creation date
    """
    try:
        creation_date = datetime.fromisoformat(createdon.replace('Z', '+00:00'))
        current_time = datetime.now(timezone.utc)
        age_delta = current_time - creation_date
        age_years = age_delta.days / 365.25
        return round(age_years, 2)
    except Exception as e:
        print(f"Error calculating vehicle age: {e}")
        return 0.0
```

### 2. **Peak Booking Day Analysis**

```python
def get_peak_booking_day(tenant_id: int, date_range: str) -> str:
    """
    Analyze booking data to determine peak booking day
    """
    try:
        # TODO: Implement actual booking analysis
        # Query bookings collection for the date range
        # Group by day of week and count bookings
        # Return day with highest count
        
        # Placeholder implementation
        return "tuesday"
    except Exception as e:
        print(f"Error getting peak booking day: {e}")
        return "unknown"
```

### 3. **Vehicle Classification Tracking**

```python
def track_vehicle_classification(vehicle_id: int, tenant_id: int) -> dict:
    """
    Track when vehicles cross age thresholds
    """
    try:
        # TODO: Implement vehicle age tracking
        # Query vehicle creation dates
        # Check if vehicles crossed 1-year threshold in current period
        # Update classification status
        
        return {
            "classified_to_old": 0,
            "classification_date": None,
            "previous_age": None,
            "current_age": None
        }
    except Exception as e:
        print(f"Error tracking vehicle classification: {e}")
        return {}
```

### 4. **Deactivation Tracking**

```python
def track_vehicle_deactivations(tenant_id: int, date_range: str) -> int:
    """
    Track vehicles deactivated in current period
    """
    try:
        # TODO: Implement deactivation tracking
        # Query vehicle_events collection for deactivation events
        # Filter by date range and tenant
        # Count deactivated vehicles
        
        return 0
    except Exception as e:
        print(f"Error tracking vehicle deactivations: {e}")
        return 0
```

## 🔧 Implementation Priority

### **Phase 1: Core Rental System**
1. `rentals` collection
2. `rental_status` collection
3. Basic rental logic integration

### **Phase 2: Booking System**
1. `bookings` collection
2. `booking_status` collection
3. Basic booking logic integration

### **Phase 3: Status Tracking**
1. `vehicle_status_history` collection
2. `vehicle_events` collection
3. Status change tracking logic

### **Phase 4: Advanced Features**
1. `vehicle_favorites` collection
2. `vehicle_availability` collection
3. Advanced analytics and reporting

### **Phase 5: Optimization**
1. Performance optimization
2. Caching implementation
3. Advanced query optimization

## 📝 Database Indexes Required

```javascript
// rentals collection
db.rentals.createIndex({"vehicle_id": 1, "status": 1})
db.rentals.createIndex({"tenant_id": 1, "status": 1})
db.rentals.createIndex({"rental_start": 1, "rental_end": 1})

// bookings collection
db.bookings.createIndex({"vehicle_id": 1, "status": 1})
db.bookings.createIndex({"tenant_id": 1, "status": 1})
db.bookings.createIndex({"booking_date": 1})

// vehicle_status_history collection
db.vehicle_status_history.createIndex({"vehicle_id": 1, "status_date": -1})
db.vehicle_status_history.createIndex({"tenant_id": 1, "status": 1})

// user_favorites collection
db.user_favorites.createIndex({"user_id": 1, "favorite_type": 1})
db.user_favorites.createIndex({"tenant_id": 1, "favorite_id": 1})
```

## 🚀 Migration Strategy

### 1. **Backward Compatibility**
- Keep existing placeholder logic
- Add new collections alongside existing ones
- Gradually migrate functionality

### 2. **Data Migration**
- Create new collections with sample data
- Test functionality with new collections
- Migrate existing data if applicable

### 3. **Feature Flags**
- Implement feature flags for new functionality
- Allow gradual rollout of new features
- Easy rollback if issues arise

## 📋 Testing Requirements

### 1. **Unit Tests**
- Test each collection structure
- Test data validation rules
- Test business logic functions

### 2. **Integration Tests**
- Test view system with new collections
- Test statistics calculation
- Test tenant isolation

### 3. **Performance Tests**
- Test query performance with large datasets
- Test concurrent access patterns
- Test memory usage

## 🔍 Monitoring and Alerting

### 1. **Performance Metrics**
- Query response times
- Collection sizes
- Index usage statistics

### 2. **Error Tracking**
- Failed queries
- Data validation errors
- Business logic failures

### 3. **Usage Analytics**
- Most used views
- Popular statistics
- User behavior patterns

## 📚 Documentation Updates

### 1. **API Documentation**
- Update endpoint documentation
- Add new parameter descriptions
- Include example responses

### 2. **Database Schema**
- Document new collections
- Update relationship diagrams
- Include index information

### 3. **User Guides**
- Update view system documentation
- Add statistics interpretation guide
- Include troubleshooting section

## 🎯 Success Criteria

### 1. **Functionality**
- All views work with real data
- Statistics are accurate and real-time
- Performance meets requirements

### 2. **Reliability**
- 99.9% uptime for statistics
- Data consistency across collections
- Proper error handling

### 3. **Scalability**
- Handles large vehicle fleets
- Supports multiple tenants
- Efficient resource usage

## 📞 Support and Maintenance

### 1. **Development Team**
- Primary contact for implementation
- Code review and testing
- Performance optimization

### 2. **Database Team**
- Collection design and optimization
- Index management
- Backup and recovery

### 3. **Operations Team**
- Monitoring and alerting
- Performance tuning
- Incident response

---

**Note**: This document should be updated as implementation progresses and new requirements are identified. All TODO items should be tracked in the project management system with appropriate priorities and timelines.
