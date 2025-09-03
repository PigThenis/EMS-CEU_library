import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { EventItem } from '@/app/api/events/route';

// Initialize Firebase Admin SDK for server-side
if (!getApps().length) {
  const useFirestoreEmulator = process.env.NEXT_PUBLIC_USE_FIRESTORE_EMULATOR === 'true';
  
  if (useFirestoreEmulator) {
    console.log('🔧 Using Firestore emulator for admin events');
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    initializeApp({
      projectId: 'demo-ems-ceu-library',
    });
  } else {
    console.log('🚀 Using production Firestore for admin events');
    initializeApp({
      projectId: 'ems-ceu-library',
    });
  }
}

const db = getFirestore();

export async function GET() {
  try {
    // Fetch ALL events from Firestore (no limit for admin view)
    const eventsSnapshot = await db.collection('events_raw')
      .orderBy('scraped_at', 'desc')
      .get();
    
    const events: EventItem[] = eventsSnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Transform scraped data to match EventItem interface
      return {
        id: doc.id,
        title: data.title || 'Untitled Event',
        startDate: data.date || new Date().toISOString(),
        endDate: data.end_date,
        city: extractCity(data.location),
        state: extractState(data.location),
        venue: data.location,
        modality: determineModality(data.title, data.location),
        ceusTotal: extractCEUs(data.title),
        ceuHours: extractCEUs(data.title),
        categories: [data.course_type].filter(Boolean),
        courseType: data.course_type,
        description: data.instructor ? `Instructor: ${data.instructor}` : undefined,
        price: undefined,
        url: data.source_url,
        provider: data.site_name || 'NAEMT',
        instructor: data.instructor,
        scrapedAt: data.scraped_at?.toDate?.()?.toISOString?.() || data.scraped_at,
        siteName: data.site_name
      };
    });
    
    return Response.json({ 
      events,
      total: events.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching all events for admin:', error);
    return Response.json({ 
      events: [],
      total: 0,
      error: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Helper functions
function extractCity(location?: string): string | undefined {
  if (!location) return undefined;
  const parts = location.split(',');
  return parts[0]?.trim();
}

function extractState(location?: string): string | undefined {
  if (!location) return undefined;
  const parts = location.split(',');
  return parts[1]?.trim();
}

function determineModality(title?: string, location?: string): 'in-person' | 'virtual' | 'hybrid' {
  const text = `${title} ${location}`.toLowerCase();
  if (text.includes('virtual') || text.includes('online')) return 'virtual';
  if (text.includes('hybrid')) return 'hybrid';
  return 'in-person';
}

function extractCEUs(title?: string): number | undefined {
  if (!title) return undefined;
  const match = title.match(/(\d+)\s*(?:CEU|CE|Hour)/i);
  return match ? parseInt(match[1]) : undefined;
}
