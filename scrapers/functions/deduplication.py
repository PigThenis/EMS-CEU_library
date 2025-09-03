"""
Event Deduplication Utilities
Prevents duplicate events from being stored in Firestore
"""

import hashlib
import json
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from firebase_admin import firestore

def generate_event_hash(event: Dict) -> str:
    """
    Generate a unique hash for an event based on key identifying fields.
    This helps detect duplicates even if scraped on different days.
    
    Args:
        event: Event dictionary
    
    Returns:
        SHA-256 hash string that uniquely identifies the event
    """
    # Key fields that uniquely identify an event
    # We use title, date, location to create a unique signature
    # Normalize text fields for better matching
    def normalize_text(text):
        if not text:
            return ''
        return ' '.join(text.lower().strip().split())
    
    def normalize_date(date_str):
        if not date_str:
            return ''
        # Handle both YYYY-MM-DD and other date formats
        try:
            from datetime import datetime
            # Try to parse and normalize the date
            if len(date_str) == 10 and date_str[4] == '-':  # YYYY-MM-DD
                return date_str
            else:
                # Try to parse other formats and convert to YYYY-MM-DD
                parsed = datetime.strptime(date_str, '%Y-%m-%d')
                return parsed.strftime('%Y-%m-%d')
        except:
            return date_str.strip()
    
    key_fields = {
        'title': normalize_text(event.get('title', '')),
        'date': normalize_date(event.get('date', '')),
        'city': normalize_text(event.get('city', '')),
        'state': normalize_text(event.get('state', '')),
        'course_type': normalize_text(event.get('course_type', '')),
        # Only include provider if it's meaningful (not empty/null)
        'provider': normalize_text(event.get('provider', '')) if event.get('provider') else ''
    }
    
    # Create a stable JSON string (sorted keys for consistency)
    event_string = json.dumps(key_fields, sort_keys=True)
    
    # Generate SHA-256 hash
    return hashlib.sha256(event_string.encode()).hexdigest()

def check_existing_events(db: firestore.Client, event_hashes: List[str], site_name: str) -> Dict[str, bool]:
    """
    Check which events already exist in the database.
    
    Args:
        db: Firestore client
        event_hashes: List of event hashes to check
        site_name: Name of the scraper site
    
    Returns:
        Dictionary mapping hash to existence (True if exists)
    """
    existing = {}
    
    # Query events_raw collection for existing hashes
    # We'll do this in batches of 10 to comply with Firestore 'in' query limits
    for i in range(0, len(event_hashes), 10):
        batch_hashes = event_hashes[i:i+10]
        
        # Query for existing events with these hashes
        query = db.collection('events_raw').where('event_hash', 'in', batch_hashes)
        docs = query.get()
        
        for doc in docs:
            data = doc.to_dict()
            if 'event_hash' in data:
                existing[data['event_hash']] = True
    
    return existing

def deduplicate_events(db: firestore.Client, events: List[Dict], site_name: str) -> Tuple[List[Dict], List[Dict], Dict]:
    """
    Filter out duplicate events and prepare unique ones for storage.
    
    Args:
        db: Firestore client
        events: List of scraped events
        site_name: Name of the scraper site
    
    Returns:
        Tuple of (unique_events, duplicate_events, stats)
    """
    if not events:
        return [], [], {'total': 0, 'unique': 0, 'duplicates': 0}
    
    # Generate hashes for all events
    events_with_hashes = []
    for event in events:
        event_hash = generate_event_hash(event)
        events_with_hashes.append({
            **event,
            'event_hash': event_hash,
            'site_name': site_name,
            'scraped_at': datetime.utcnow(),
            'processed': False,
            'status': 'pending'
        })
    
    # Get all hashes
    all_hashes = [e['event_hash'] for e in events_with_hashes]
    
    # Check which events already exist
    existing_hashes = check_existing_events(db, all_hashes, site_name)
    
    # Separate unique and duplicate events
    unique_events = []
    duplicate_events = []
    
    for event in events_with_hashes:
        if event['event_hash'] in existing_hashes:
            duplicate_events.append(event)
        else:
            unique_events.append(event)
    
    stats = {
        'total': len(events),
        'unique': len(unique_events),
        'duplicates': len(duplicate_events),
        'duplicate_rate': f"{(len(duplicate_events) / len(events) * 100):.1f}%" if events else "0%"
    }
    
    return unique_events, duplicate_events, stats

def update_existing_event(db: firestore.Client, event_hash: str, updates: Dict) -> bool:
    """
    Update an existing event with new information (like last_seen timestamp).
    
    Args:
        db: Firestore client
        event_hash: Hash of the event to update
        updates: Dictionary of fields to update
    
    Returns:
        True if updated successfully
    """
    try:
        # Find the event by hash
        query = db.collection('events_raw').where('event_hash', '==', event_hash).limit(1)
        docs = query.get()
        
        if docs:
            doc_ref = docs[0].reference
            doc_ref.update({
                **updates,
                'last_seen': datetime.utcnow(),
                'times_seen': firestore.Increment(1)
            })
            return True
    except Exception as e:
        print(f"Error updating event: {e}")
    
    return False

def analyze_potential_duplicates(events: List[Dict]) -> Dict:
    """
    Analyze events for potential duplicates without database interaction.
    Useful for debugging deduplication logic.
    
    Args:
        events: List of events to analyze
    
    Returns:
        Analysis results showing potential duplicates
    """
    if not events:
        return {'potential_duplicates': [], 'similar_events': []}
    
    # Generate hashes for analysis
    events_with_hashes = []
    for event in events:
        event_hash = generate_event_hash(event)
        events_with_hashes.append({
            'hash': event_hash,
            'title': event.get('title', ''),
            'date': event.get('date', ''),
            'city': event.get('city', ''),
            'state': event.get('state', ''),
            'provider': event.get('provider', ''),
            'course_type': event.get('course_type', '')
        })
    
    # Group by hash to find exact duplicates
    hash_groups = {}
    for event in events_with_hashes:
        hash_key = event['hash']
        if hash_key not in hash_groups:
            hash_groups[hash_key] = []
        hash_groups[hash_key].append(event)
    
    # Find exact duplicates (same hash)
    exact_duplicates = {k: v for k, v in hash_groups.items() if len(v) > 1}
    
    # Find similar events (same title, different dates/locations)
    title_groups = {}
    for event in events_with_hashes:
        title = event['title'].lower().strip()
        if title not in title_groups:
            title_groups[title] = []
        title_groups[title].append(event)
    
    similar_events = {k: v for k, v in title_groups.items() if len(v) > 1}
    
    return {
        'total_events': len(events),
        'unique_hashes': len(hash_groups),
        'exact_duplicates': exact_duplicates,
        'similar_events': similar_events,
        'duplicate_count': sum(len(v) - 1 for v in exact_duplicates.values())
    }

def cleanup_old_events(db: firestore.Client, days: int = 30) -> int:
    """
    Remove events that haven't been seen in the specified number of days.
    This helps clean up events that are no longer being listed.
    
    Args:
        db: Firestore client
        days: Number of days before considering an event stale
    
    Returns:
        Number of events deleted
    """
    from datetime import timedelta
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    deleted_count = 0
    
    try:
        # Query for old events
        query = db.collection('events_raw').where('last_seen', '<', cutoff_date)
        old_events = query.get()
        
        # Delete in batches
        batch = db.batch()
        batch_count = 0
        
        for doc in old_events:
            batch.delete(doc.reference)
            batch_count += 1
            deleted_count += 1
            
            # Commit every 500 deletes (Firestore limit)
            if batch_count >= 500:
                batch.commit()
                batch = db.batch()
                batch_count = 0
        
        # Commit remaining deletes
        if batch_count > 0:
            batch.commit()
            
    except Exception as e:
        print(f"Error cleaning up old events: {e}")
    
    return deleted_count
