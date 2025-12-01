#!/usr/bin/env python3
"""
Test script for Payment Save Endpoint
This script demonstrates how to use the new /rentify/bookings/payments/save endpoint
"""

import requests
import json
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:8000"  # Adjust to your server URL
ENDPOINT = f"{BASE_URL}/rentify/bookings/payments/save"

# Test token (you'll need to get a valid token from your auth system)
TEST_TOKEN = "your_test_token_here"

def test_payment_save():
    """Test the payment save endpoint with the provided payload"""
    
    # Test payload as provided by user
    test_payload = {
        "customer_id": "1",
        "amount": "2000",
        "payment_date": "2025-09-26T13:12:04.761Z",
        "transaction_id": "454353",
        "terminal_id": "84545",
        "receipt_no": "6465464",
        "payment_note": "fdgfdgdf",
        "customer_note": "dfgdfgfdg",
        "receipt_image": {},
        "old_receipt_image": "",
        "payment_purpose": "security"
    }
    
    # Headers
    headers = {
        "Authorization": f"Bearer {TEST_TOKEN}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    print("💳 Payment Save Endpoint Test")
    print("=" * 50)
    print(f"Endpoint: {ENDPOINT}")
    print(f"Payload: {json.dumps(test_payload, indent=2)}")
    print()
    
    try:
        # Make the request
        response = requests.post(ENDPOINT, data=test_payload, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print()
        
        if response.status_code == 200:
            response_data = response.json()
            print("✅ SUCCESS!")
            print(f"Message: {response_data.get('message', 'N/A')}")
            print(f"Data: {json.dumps(response_data.get('data', {}), indent=2)}")
        else:
            print("❌ FAILED!")
            print(f"Error: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ REQUEST ERROR: {e}")
    except json.JSONDecodeError as e:
        print(f"❌ JSON DECODE ERROR: {e}")
        print(f"Raw Response: {response.text}")
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {e}")

def test_payment_save_with_image():
    """Test the payment save endpoint with receipt image upload"""
    
    # Test payload with file upload
    test_payload = {
        "customer_id": "1",
        "amount": "1500",
        "payment_date": "2025-09-26T13:12:04.761Z",
        "transaction_id": "454354",
        "terminal_id": "84546",
        "receipt_no": "6465465",
        "payment_note": "Test payment with image",
        "customer_note": "Customer note for image test",
        "old_receipt_image": "",
        "payment_purpose": "rent"
    }
    
    # Headers for multipart form data
    headers = {
        "Authorization": f"Bearer {TEST_TOKEN}"
    }
    
    print("\n📸 Payment Save with Image Upload Test")
    print("=" * 50)
    print(f"Endpoint: {ENDPOINT}")
    print(f"Payload: {json.dumps(test_payload, indent=2)}")
    print("Note: This test requires a valid image file to be uploaded")
    print()
    
    try:
        # Make the request (without file for now, just testing the structure)
        response = requests.post(ENDPOINT, data=test_payload, headers=headers)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            response_data = response.json()
            print("✅ SUCCESS!")
            print(f"Message: {response_data.get('message', 'N/A')}")
            print(f"Data: {json.dumps(response_data.get('data', {}), indent=2)}")
        else:
            print("❌ FAILED!")
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    print("🚀 Starting Payment Save Endpoint Tests")
    print("=" * 60)
    print("Note: Make sure to update TEST_TOKEN with a valid authentication token")
    print("=" * 60)
    print()
    
    # Run tests
    test_payment_save()
    test_payment_save_with_image()
    
    print("\n" + "=" * 60)
    print("🏁 Test Suite Complete")
    print("=" * 60)
