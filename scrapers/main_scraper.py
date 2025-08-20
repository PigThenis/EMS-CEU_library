#!/usr/bin/env python3
"""
Main EMS Event Scraper
Production-ready scraper with Firestore integration
"""

import os
import sys
import json
import requests
from datetime import datetime
from scraper_registry import get_scraper, get_working_sites

class EMSEventScraper:
    """Main scraper class with optional Firestore integration"""
    
    def __init__(self, use_firestore=False, output_dir="scraped_data"):
        self.use_firestore = use_firestore
        self.output_dir = output_dir
        
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        
        # Setup HTTP session
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (compatible; EMSEducationBot/1.0)'
        })
        
        # Initialize Firestore if requested
        self.db = None
        if use_firestore:
            self._init_firestore()
    
    def _init_firestore(self):
        """Initialize Firestore connection"""
        try:
            import firebase_admin
            from firebase_admin import firestore
            
            if not firebase_admin._apps:
                firebase_admin.initialize_app()
            
            self.db = firestore.client()
            print("✅ Connected to Firestore")
            
        except Exception as e:
            print(f"❌ Failed to connect to Firestore: {e}")
            print("💡 Falling back to JSON file output")
            self.use_firestore = False
    
    def scrape_site(self, site_name: str, max_pages: int = 5):
        """Scrape a specific site"""
        
        print(f"🕷️  Scraping {site_name}...")
        
        # Get scraper
        scraper = get_scraper(site_name)
        if not scraper:
            print(f"❌ No scraper available for {site_name}")
            return []
        
        # Scrape events
        try:
            events = scraper.scrape(self.session, max_pages, timeout=15)
            print(f"✅ Found {len(events)} events from {site_name}")
            
            # Save results
            if self.use_firestore and self.db:
                self._save_to_firestore(events, site_name)
            else:
                self._save_to_json(events, site_name)
            
            return events
            
        except Exception as e:
            print(f"❌ Error scraping {site_name}: {e}")
            return []
    
    def _save_to_firestore(self, events: list, site_name: str):
        """Save events to Firestore"""
        try:
            batch = self.db.batch()
            
            for event in events:
                # Save to events_raw collection for processing
                doc_ref = self.db.collection('events_raw').document()
                batch.set(doc_ref, {
                    **event,
                    'site_name': site_name,
                    'scraped_at': datetime.utcnow(),
                    'processed': False,
                    'status': 'pending'
                })
            
            batch.commit()
            print(f"💾 Saved {len(events)} events to Firestore")
            
        except Exception as e:
            print(f"❌ Error saving to Firestore: {e}")
            # Fallback to JSON
            self._save_to_json(events, site_name)
    
    def _save_to_json(self, events: list, site_name: str):
        """Save events to JSON file"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{site_name}_{timestamp}.json"
        filepath = os.path.join(self.output_dir, filename)
        
        result = {
            'site': site_name,
            'scraped_at': datetime.utcnow().isoformat(),
            'event_count': len(events),
            'events': events
        }
        
        with open(filepath, 'w') as f:
            json.dump(result, f, indent=2, default=str)
        
        print(f"💾 Saved to: {filepath}")
    
    def scrape_all_sites(self, max_pages: int = 3):
        """Scrape all working sites"""
        
        print("🚀 EMS Event Scraper - Production Mode")
        print("=" * 50)
        
        working_sites = get_working_sites()
        print(f"📋 Working sites: {', '.join(working_sites)}")
        
        if self.use_firestore:
            print("💾 Storage: Firestore (production)")
        else:
            print("💾 Storage: JSON files (development)")
        
        print()
        
        total_events = 0
        results = {}
        
        for site in working_sites:
            print(f"\n{'='*20} {site.upper()} {'='*20}")
            events = self.scrape_site(site, max_pages)
            total_events += len(events)
            results[site] = len(events)
            
            # Show sample events
            if events:
                print("📋 Sample events:")
                for i, event in enumerate(events[:3]):
                    print(f"  {i+1}. {event['title']}")
                    print(f"     📅 {event['date']} | 📍 {event['location']}")
        
        # Summary
        print(f"\n{'='*50}")
        print("📊 SCRAPING SUMMARY")
        print("=" * 50)
        
        for site, count in results.items():
            print(f"✅ {site.upper()}: {count} events")
        
        print(f"\n🎉 Total events collected: {total_events}")
        
        if self.use_firestore:
            print("💡 Events saved to Firestore for processing")
        else:
            print(f"💡 Events saved to {self.output_dir}/ folder")
        
        return results

def main():
    """Main entry point"""
    
    # Check for Firestore flag
    use_firestore = '--firestore' in sys.argv
    
    scraper = EMSEventScraper(use_firestore=use_firestore)
    results = scraper.scrape_all_sites(max_pages=3)
    
    return results

if __name__ == "__main__":
    main()