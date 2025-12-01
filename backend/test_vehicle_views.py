#!/usr/bin/env python3
"""
Test script for Vehicle View System
This script demonstrates how the view system works with different filter combinations
"""

import requests
import json
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:8000"  # Adjust to your server URL
ENDPOINT = f"{BASE_URL}/rentify/vehicles/get"

# Test token (you'll need to get a valid token from your auth system)
TEST_TOKEN = "your_test_token_here"

def test_view_system():
    """Test the vehicle view system with different combinations"""
    
    # Test cases
    test_cases = [
        {
            "name": "All Cars (Default View)",
            "params": {},
            "description": "Should return all accessible vehicles"
        },
        {
            "name": "My Cars Only",
            "params": {"view": "my_cars"},
            "description": "Should return only tenant-specific vehicles"
        },
        {
            "name": "Active Cars",
            "params": {"view": "active_cars"},
            "description": "Should return only active vehicles"
        },
        {
            "name": "Recently Updated",
            "params": {"view": "recently_updated"},
            "description": "Should return vehicles updated in last 7 days"
        },
        {
            "name": "My Cars + Brand Filter",
            "params": {"view": "my_cars", "brand_id": "5"},
            "description": "Should return my cars from brand ID 5"
        },
        {
            "name": "Active Cars + Price Range",
            "params": {
                "view": "active_cars",
                "rent_price_min": "50",
                "rent_price_max": "200"
            },
            "description": "Should return active cars with rent price between 50-200"
        },
        {
            "name": "Recently Updated + Body Type + Seats",
            "params": {
                "view": "recently_updated",
                "body_type_id": "2",
                "seats_min": "5"
            },
            "description": "Should return recently updated SUVs with 5+ seats"
        },
        {
            "name": "Affiliate Cars + Model Filter",
            "params": {
                "view": "affiliate_cars",
                "model_id": "12"
            },
            "description": "Should return affiliate cars from model ID 12"
        },
        {
            "name": "Available for Rent + Fuel Type",
            "params": {
                "view": "available_for_rent",
                "fuel_type_id": "1"
            },
            "description": "Should return available petrol vehicles"
        },
        {
            "name": "Complex Filter Combination",
            "params": {
                "view": "my_cars",
                "brand_id": "5",
                "body_type_id": "2",
                "rent_price_min": "100",
                "seats_min": "5",
                "transmission_type_id": "2"
            },
            "description": "Should return my automatic SUVs from brand 5 with 5+ seats and rent price >= 100"
        }
    ]
    
    print("🚗 Vehicle View System Test Suite")
    print("=" * 50)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. {test_case['name']}")
        print(f"   Description: {test_case['description']}")
        print(f"   Parameters: {test_case['params']}")
        
        try:
            # Make the request
            response = make_request(test_case['params'])
            
            if response:
                print(f"   ✅ Success: {response.get('total_count', 0)} vehicles found")
                print(f"   View Applied: {response.get('filters_summary', {}).get('view', 'unknown')}")
                
                # Show view statistics if available
                if 'view_statistics' in response:
                    stats = response['view_statistics']
                    print(f"   View Stats: all_cars={stats.get('all_cars', 0)}, "
                          f"my_cars={stats.get('my_cars', 0)}, "
                          f"active_cars={stats.get('active_cars', 0)}")
                
                # Show warnings if any
                warnings = response.get('warnings', [])
                if warnings:
                    print(f"   ⚠️  Warnings: {len(warnings)} warnings")
                    for warning in warnings[:2]:  # Show first 2 warnings
                        print(f"      - {warning}")
            else:
                print("   ❌ Failed: No response received")
                
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        print("-" * 50)

def make_request(params: Dict[str, Any]) -> Dict[str, Any]:
    """Make a request to the vehicles endpoint"""
    
    headers = {
        "Authorization": f"Bearer {TEST_TOKEN}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    try:
        response = requests.post(ENDPOINT, data=params, headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"   HTTP {response.status_code}: {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"   Request Error: {str(e)}")
        return None

def show_usage_examples():
    """Show usage examples for the view system"""
    
    print("\n📚 Usage Examples")
    print("=" * 50)
    
    examples = [
        {
            "title": "Get All My Cars",
            "curl": 'curl -X POST "http://localhost:8000/rentify/vehicles/get" \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -d "view=my_cars"'
        },
        {
            "title": "Get Active Cars with Brand Filter",
            "curl": 'curl -X POST "http://localhost:8000/rentify/vehicles/get" \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -d "view=active_cars&brand_id=5"'
        },
        {
            "title": "Get Recently Updated SUVs",
            "curl": 'curl -X POST "http://localhost:8000/rentify/vehicles/get" \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -d "view=recently_updated&body_type_id=2"'
        },
        {
            "title": "Get Available Cars with Price Range",
            "curl": 'curl -X POST "http://localhost:8000/rentify/vehicles/get" \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -d "view=available_for_rent&rent_price_min=50&rent_price_max=200"'
        }
    ]
    
    for example in examples:
        print(f"\n{example['title']}:")
        print(example['curl'])

def show_view_statistics():
    """Show what view statistics are available"""
    
    print("\n📊 View Statistics Available")
    print("=" * 50)
    
    stats = [
        "all_cars - Total accessible vehicles",
        "my_cars - Tenant-specific vehicles", 
        "affiliate_cars - Other tenants' vehicles",
        "active_cars - Active vehicles",
        "inactive_cars - Inactive vehicles",
        "available_for_rent - Available vehicles",
        "rented - Currently rented vehicles",
        "cancelled - Cancelled vehicles",
        "pending_bookings - Vehicles with pending bookings",
        "favourit_cars - Favorite vehicles",
        "recently_updated - Updated in last 7 days",
        "no_recent_activity - No activity in last 30 days"
    ]
    
    for stat in stats:
        print(f"• {stat}")

if __name__ == "__main__":
    print("Vehicle View System Test Suite")
    print("=" * 50)
    print("Note: You need to set a valid TEST_TOKEN before running tests")
    print()
    
    # Show available views and statistics
    show_view_statistics()
    
    # Show usage examples
    show_usage_examples()
    
    # Run tests if token is set
    if TEST_TOKEN != "your_test_token_here":
        print("\n" + "=" * 50)
        test_view_system()
    else:
        print("\n⚠️  Please set TEST_TOKEN to run the test suite")
        print("You can get a token by authenticating with your system")
