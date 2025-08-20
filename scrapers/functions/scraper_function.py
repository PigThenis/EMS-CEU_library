"""
Firebase Function version of the scraper
Deploy with: firebase deploy --only functions:scraperFunction
"""

import functions_framework
import sys
import os

# Add paths for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

@functions_framework.http
def scrapeNAEMT(request):
    """HTTP Cloud Function to scrape NAEMT events"""
    
    try:
        # Import here to avoid cold start issues
        from scraper_registry import get_scraper, get_working_sites
        import firebase_admin
        from firebase_admin import firestore
        import requests
        from datetime import datetime
        
        # Initialize Firebase (if not already done)
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        
        db = firestore.client()
        
        # Setup HTTP session
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (compatible; EMSEducationBot/1.0)'
        })
        
        results = {}
        total_events = 0
        
        # Focus on NAEMT only for this function
        site_name = 'naemt'
        
        try:
            print(f"Scraping {site_name}...")
            
            # Get scraper
            scraper = get_scraper(site_name)
            if not scraper:
                return {
                    'status': 'error',
                    'error': f'No scraper found for {site_name}',
                    'timestamp': datetime.utcnow().isoformat()
                }, 500
            
            # Scrape events
            events = scraper.scrape(session, max_pages=3, timeout=15)
            
            # Save to Firestore in batch
            if events:
                batch = db.batch()
                
                for event in events:
                    doc_ref = db.collection('events_raw').document()
                    batch.set(doc_ref, {
                        **event,
                        'site_name': site_name,
                        'scraped_at': datetime.utcnow(),
                        'processed': False,
                        'status': 'pending'
                    })
                
                batch.commit()
                
            results[site_name] = len(events)
            total_events = len(events)
            
            print(f"✅ {site_name}: {len(events)} events")
            
        except Exception as e:
            print(f"❌ Error scraping {site_name}: {e}")
            results[site_name] = f"Error: {str(e)}"
        
        return {
            'status': 'success',
            'total_events': total_events,
            'sites': results,
            'timestamp': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        print(f"❌ Function error: {e}")
        return {
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }, 500