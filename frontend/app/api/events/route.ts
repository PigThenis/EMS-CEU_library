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

import { getEventsSeed } from '@/lib/events'

export async function GET() {
  // In the future this will read from DB and apply filters via query params.
  return Response.json({ events: getEventsSeed() })
}

