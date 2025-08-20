#!/usr/bin/env python3
"""
Test Firebase Functions with emulators
"""

import requests
import time
import json

def test_emulators():
    """Test scraper function with emulators"""
    
    print("🧪 Testing NAEMT Scraper Function with Emulators")
    print("=" * 50)
    
    # Wait for emulators to be ready
    print("⏳ Waiting for emulators to start...")
    time.sleep(3)
    
    # Test function endpoint  
    function_url = "http://localhost:5001/ems-ceu-library/us-central1/scrapeNAEMT"
    
    try:
        print(f"🚀 Calling function: {function_url}")
        
        response = requests.post(function_url, json={}, timeout=60)
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Function executed successfully!")
            print(f"📋 Total events: {result.get('total_events', 0)}")
            print(f"🕒 Timestamp: {result.get('timestamp', 'N/A')}")
            
            sites = result.get('sites', {})
            for site, count in sites.items():
                print(f"   {site}: {count} events")
                
        else:
            print(f"❌ Function failed: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        print("\n💡 Make sure emulators are running:")
        print("   firebase emulators:start")
    
    # Test Firestore emulator
    print(f"\n🔗 Emulator UI: http://localhost:4000")
    print(f"🗄️  Firestore: http://localhost:4000/firestore")

if __name__ == "__main__":
    test_emulators()