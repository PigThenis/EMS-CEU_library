import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export interface EventItem {
  id: string;
  title: string;
  startDate: string; // ISO
  endDate?: string; // ISO
  city?: string;
  state?: string;
  venue?: string;
  modality: 'in-person' | 'virtual' | 'hybrid';
  ceusTotal?: number;
  ceuHours?: number; // Alternative name for CEUs
  categories?: string[];
  courseType?: string; // ACLS, PALS, etc.
  description?: string;
  price?: number;
  url?: string;
  provider?: string; // Overall organization (e.g., NAEMT, AHA)
  instructor?: string; // Instructor name
  scrapedAt?: string; // When scraped
  siteName?: string; // Source site
}

// Initialize Firebase Admin SDK for server-side
if (!getApps().length) {
  // Check if we should use Firestore emulator based on environment variable
  const useFirestoreEmulator = process.env.NEXT_PUBLIC_USE_FIRESTORE_EMULATOR === 'true';
  
  if (useFirestoreEmulator) {
    console.log('🔧 Using Firestore emulator for server-side operations');
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    initializeApp({
      projectId: 'demo-ems-ceu-library',
    });
  } else {
    console.log('🚀 Using production Firestore for server-side operations');
    // For production, initialize with default credentials
    initializeApp({
      projectId: 'ems-ceu-library',
    });
  }
}

const db = getFirestore();

export async function GET(request: Request) {
  try {
    // Check if we just want a count
    const url = new URL(request.url);
    if (url.searchParams.get('count') === 'true') {
      const countSnapshot = await db.collection('events_raw').get();
      return Response.json({ count: countSnapshot.size });
    }
    
    // Fetch events from Firestore emulator
    const eventsSnapshot = await db.collection('events_raw')
      .orderBy('scraped_at', 'desc')
      .limit(50)
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
        price: undefined, // Not available in scraped data yet
        url: data.source_url,
        provider: data.site_name || 'NAEMT', // Site name represents the overall organization
        instructor: data.instructor,
        scrapedAt: data.scraped_at?.toDate?.()?.toISOString?.() || data.scraped_at,
        siteName: data.site_name
      };
    });
    
    return Response.json({ events });
  } catch (error) {
    console.error('Error fetching events from Firestore:', error);
    // Fall back to seed data if Firestore fails
    const { getEventsSeed } = await import('@/lib/events');
    return Response.json({ events: getEventsSeed() });
  }
}

// Helper functions to extract data
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

