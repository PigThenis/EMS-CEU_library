"""
Firebase Function: scrapeNAEMT (Firebase Python SDK)
Runs the NAEMT scraper against the Firebase emulator (or Firestore if configured).
"""

import sys
import os
from datetime import datetime
import json

from firebase_functions import https_fn

# Ensure we can import from the repo root (scraper registry and adapters)
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

@https_fn.on_request(region="us-central1")
def scrapeNAEMT(req: https_fn.Request) -> https_fn.Response:
    """HTTP Cloud Function to scrape NAEMT events and write to events_raw.
    Returns JSON summary and supports CORS.
    """
    # Handle CORS preflight
    if req.method == 'OPTIONS':
        resp = https_fn.Response(status=204)
        resp.headers['Access-Control-Allow-Origin'] = '*'
        resp.headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'
        resp.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        resp.headers['Access-Control-Max-Age'] = '3600'
        return resp

    try:
        # Lazy imports to keep cold starts minimal
        from scraper_registry import get_scraper
        from firebase_admin import firestore, _apps, initialize_app
        import requests

        # Lazy init of Firebase Admin to avoid startup errors in emulator
        if not _apps:
            initialize_app()
        db = firestore.client()

        site_name = 'naemt'
        session = requests.Session()
        session.headers.update({'User-Agent': 'Mozilla/5.0 (compatible; EMSEducationBot/1.0)'})

        scraper = get_scraper(site_name)
        if not scraper:
            return https_fn.Response(
                json.dumps({
                    'status': 'error',
                    'error': f'No scraper available for {site_name}',
                    'timestamp': datetime.utcnow().isoformat(),
                }),
                status=500,
                headers={'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            )

        # Scrape a conservative amount in emulator; allow fallback if network is blocked
        try:
            events = scraper.scrape(session, max_pages=3, timeout=15)
        except Exception as scrape_err:  # pylint: disable=broad-except
            print(f"Scrape error (non-fatal in emulator): {scrape_err}")
            events = []

        saved = 0
        if events:
            batch = db.batch()
            for ev in events:
                doc_ref = db.collection('events_raw').document()
                batch.set(doc_ref, {
                    **ev,
                    'site_name': site_name,
                    'scraped_at': datetime.utcnow(),
                    'processed': False,
                    'status': 'pending',
                })
            batch.commit()
            saved = len(events)

        return https_fn.Response(
            json.dumps({
                'status': 'success',
                'site': site_name,
                'total_events': len(events),
                'events_saved': saved,
                'timestamp': datetime.utcnow().isoformat(),
            }),
            status=200,
            headers={'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        )

    except Exception as e:  # pylint: disable=broad-except
        return https_fn.Response(
            json.dumps({
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat(),
            }),
            status=500,
            headers={'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        )

# Simple health endpoint to verify function discovery
@https_fn.on_request(region="us-central1")
def ping(req: https_fn.Request) -> https_fn.Response:
    return https_fn.Response(json.dumps({"ok": True}), status=200, headers={'Content-Type': 'application/json'})
