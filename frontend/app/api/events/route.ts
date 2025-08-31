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
  categories?: string[];
  courseType?: string; // ACLS, PALS, etc.
  description?: string;
  price?: number;
  url?: string;
}

// Initialize Firebase Admin SDK for server-side
if (!getApps().length) {
  // For emulator, we don't need credentials
  if (process.env.NODE_ENV === 'development') {
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    initializeApp({
      projectId: 'ems-ceu-library',
    });
  } else {
    // For production, you'd initialize with service account
    initializeApp();
  }
}

const db = getFirestore();

export async function GET() {
  try {
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
        categories: [data.course_type].filter(Boolean),
        courseType: data.course_type,
        description: data.instructor ? `Instructor: ${data.instructor}` : undefined,
        price: undefined, // Not available in scraped data yet
        url: data.source_url
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

