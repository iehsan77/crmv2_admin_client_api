#!/usr/bin/env python3
"""
Test script for Vehicle Statistics Endpoint
This script demonstrates how to use the new /rentify/vehicles/stats/get endpoint
"""

import requests
import json
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:8000"  # Adjust to your server URL
ENDPOINT = f"{BASE_URL}/rentify/vehicles/stats/get"

# Test token (you'll need to get a valid token from your auth system)
TEST_TOKEN = "your_test_token_here"

def test_vehicle_statistics():
    """Test the vehicle statistics endpoint with different date ranges"""
    
    # Test cases
    test_cases = [
        {
            "name": "Default Statistics (30 days)",
            "params": {},
            "description": "Should return statistics for the last 30 days"
        },
        {
            "name": "7 Days Statistics",
            "params": {"date_range": "7_days"},
            "description": "Should return statistics for the last 7 days"
        },
        {
            "name": "30 Days Statistics",
            "params": {"date_range": "30_days"},
            "description": "Should return statistics for the last 30 days"
        },
        {
            "name": "90 Days Statistics",
            "params": {"date_range": "90_days"},
            "description": "Should return statistics for the last 90 days"
        },
        {
            "name": "Invalid Date Range (should default to 30 days)",
            "params": {"date_range": "invalid_range"},
            "description": "Should default to 30 days for invalid date range"
        }
    ]
    
    print("📊 Vehicle Statistics Endpoint Test Suite")
    print("=" * 60)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. {test_case['name']}")
        print(f"   Description: {test_case['description']}")
        print(f"   Parameters: {test_case['params']}")
        
        try:
            # Make the request
            response = make_request(test_case['params'])
            
            if response:
                print(f"   ✅ Success: HTTP {response.get('status', 'unknown')}")
                print(f"   Message: {response.get('message', 'No message')}")
                
                # Show data structure
                data = response.get('data', {})
                if data:
                    print(f"   📈 Data Structure:")
                    
                    # Show stats summary
                    stats = data.get('stats', {})
                    if stats:
                        print(f"      Stats Available:")
                        for stat_key in stats.keys():
                            print(f"        - {stat_key}")
                    
                    # Show vehicle status
                    vehicle_status = data.get('vehicle_status', {})
                    if vehicle_status:
                        print(f"      Vehicle Status Available:")
                        for status_key in vehicle_status.keys():
                            print(f"        - {status_key}")
                    
                    # Show sample values
                    if stats and 'total_cars' in stats:
                        total_cars = stats['total_cars']
                        print(f"      Sample Values:")
                        print(f"        Total Cars: {total_cars.get('counter', 'N/A')}")
                        print(f"        Percent Change: {total_cars.get('percent', 'N/A')}%")
                        print(f"        Cars Added: {total_cars.get('cars_added', 'N/A')}")
                
                # Show additional response info
                print(f"   📅 Date Range: {response.get('date_range', 'N/A')}")
                print(f"   🏢 Tenant ID: {response.get('tenant_id', 'N/A')}")
                
            else:
                print("   ❌ Failed: No response received")
                
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        print("-" * 60)

def make_request(params: Dict[str, Any]) -> Dict[str, Any]:
    """Make a request to the vehicle statistics endpoint"""
    
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

def show_expected_response_structure():
    """Show the expected response structure"""
    
    print("\n📋 Expected Response Structure")
    print("=" * 60)
    
    expected_structure = {
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
    
    print("The endpoint should return data in this structure:")
    print(json.dumps(expected_structure, indent=2))

def show_usage_examples():
    """Show usage examples for the statistics endpoint"""
    
    print("\n📚 Usage Examples")
    print("=" * 60)
    
    examples = [
        {
            "title": "Get Default Statistics (30 days)",
            "curl": 'curl -X POST "http://localhost:8000/rentify/vehicles/stats/get" \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -d ""'
        },
        {
            "title": "Get 7 Days Statistics",
            "curl": 'curl -X POST "http://localhost:8000/rentify/vehicles/stats/get" \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -d "date_range=7_days"'
        },
        {
            "title": "Get 90 Days Statistics",
            "curl": 'curl -X POST "http://localhost:8000/rentify/vehicles/stats/get" \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -d "date_range=90_days"'
        }
    ]
    
    for example in examples:
        print(f"\n{example['title']}:")
        print(example['curl'])

def show_statistics_explanation():
    """Show explanation of what each statistic means"""
    
    print("\n📊 Statistics Explanation")
    print("=" * 60)
    
    explanations = [
        {
            "category": "Total Cars",
            "metrics": [
                "counter - Total number of vehicles",
                "percent - Percentage change from previous period",
                "size_in_range - Vehicles in current date range",
                "cars_added - New vehicles added in period",
                "cars_removed - Vehicles removed in period"
            ]
        },
        {
            "category": "New Cars",
            "metrics": [
                "counter - Number of new vehicles",
                "percent - Percentage change from previous period",
                "of_total_fleet - Percentage of total fleet",
                "average_age - Average age in years"
            ]
        },
        {
            "category": "Old Cars",
            "metrics": [
                "counter - Number of old vehicles (>1 year)",
                "percent - Percentage change from previous period",
                "of_total_fleet - Percentage of total fleet",
                "classified_to_old - Vehicles that became old in period"
            ]
        },
        {
            "category": "Available Cars",
            "metrics": [
                "counter - Number of available vehicles",
                "available_fleet - Percentage of fleet available",
                "available_range - Percentage of total vehicles"
            ]
        },
        {
            "category": "Booked Cars",
            "metrics": [
                "counter - Number of booked vehicles",
                "fleet_booked - Percentage of fleet booked",
                "peek_booking_day - Day with most bookings"
            ]
        },
        {
            "category": "Active Cars",
            "metrics": [
                "counter - Number of active vehicles",
                "percent - Percentage change from previous period",
                "total_fleet - Percentage of total fleet",
                "deactivated - Vehicles deactivated in period"
            ]
        }
    ]
    
    for explanation in explanations:
        print(f"\n{explanation['category']}:")
        for metric in explanation['metrics']:
            print(f"  • {metric}")

if __name__ == "__main__":
    print("Vehicle Statistics Endpoint Test Suite")
    print("=" * 60)
    print("Note: You need to set a valid TEST_TOKEN before running tests")
    print()
    
    # Show expected response structure
    show_expected_response_structure()
    
    # Show statistics explanation
    show_statistics_explanation()
    
    # Show usage examples
    show_usage_examples()
    
    # Run tests if token is set
    if TEST_TOKEN != "your_test_token_here":
        print("\n" + "=" * 60)
        test_vehicle_statistics()
    else:
        print("\n⚠️  Please set TEST_TOKEN to run the test suite")
        print("You can get a token by authenticating with your system")
