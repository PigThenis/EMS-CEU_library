import type { EventItem } from '@/app/api/events/route'

export const eventSeed: EventItem[] = [
  {
    id: 'e1',
    title: 'ACLS Renewal',
    startDate: '2025-09-12T09:00:00-05:00',
    city: 'Nashville',
    state: 'TN',
    venue: 'Downtown Training Center',
    modality: 'in-person',
    ceusTotal: 8,
    categories: ['Cardiac'],
    courseType: 'ACLS',
    url: '#'
  },
  {
    id: 'e2',
    title: 'PHTLS Provider',
    startDate: '2025-10-08T08:00:00-05:00',
    endDate: '2025-10-09T17:00:00-05:00',
    city: 'Memphis',
    state: 'TN',
    venue: 'Mid-South EMS Academy',
    modality: 'hybrid',
    ceusTotal: 16,
    categories: ['Trauma'],
    courseType: 'PHTLS',
    url: '#'
  },
  {
    id: 'e3',
    title: 'PALS Initial',
    startDate: '2025-09-25T10:00:00-05:00',
    city: 'Chattanooga',
    state: 'TN',
    modality: 'virtual',
    ceusTotal: 12,
    categories: ['Pediatric'],
    courseType: 'PALS',
    url: '#'
  }
]

export function getEventsSeed() {
  return eventSeed
}

export function getEventById(id: string) {
  return eventSeed.find(e => e.id === id) || null
}

