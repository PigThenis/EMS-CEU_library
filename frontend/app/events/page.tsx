'use client'

import EventCard from '@/components/EventCard'
import EventDetailModal from '@/components/EventDetailModal'
import { useEffect, useState } from 'react'
import type { EventItem } from '@/app/api/events/route'

interface Filters {
  startDate: string
  endDate: string
  modality: string
  city: string
  state: string
  courseType: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [filteredEvents, setFilteredEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    startDate: '',
    endDate: '',
    modality: 'all',
    city: '',
    state: '',
    courseType: 'all'
  })

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        setEvents(data.events || [])
        setFilteredEvents(data.events || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch events:', err)
        setEvents([])
        setFilteredEvents([])
        setLoading(false)
      })
  }, [])

  // Apply filters whenever filters or events change
  useEffect(() => {
    let filtered = [...events]

    // Date filtering
    if (filters.startDate) {
      filtered = filtered.filter(e => e.startDate >= filters.startDate)
    }
    if (filters.endDate) {
      filtered = filtered.filter(e => e.startDate <= filters.endDate)
    }

    // Modality filtering
    if (filters.modality !== 'all') {
      filtered = filtered.filter(e => e.modality === filters.modality)
    }

    // Location filtering
    if (filters.city) {
      filtered = filtered.filter(e => 
        e.city?.toLowerCase().includes(filters.city.toLowerCase())
      )
    }
    if (filters.state) {
      filtered = filtered.filter(e => 
        e.state?.toLowerCase().includes(filters.state.toLowerCase())
      )
    }

    // Course type filtering
    if (filters.courseType !== 'all') {
      filtered = filtered.filter(e => e.courseType === filters.courseType)
    }

    setFilteredEvents(filtered)
  }, [filters, events])

  const handleEventClick = (event: EventItem) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedEvent(null)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 h-screen flex flex-col">
      <div className="flex-none">
        <h1 className="text-3xl font-bold">Browse events</h1>
        <p className="mt-2 text-slate-600">
          Showing {filteredEvents.length} of {events.length} events
        </p>
      </div>
      <div className="mt-6 flex-1 grid md:grid-cols-4 gap-4 min-h-0">
        <aside className="md:col-span-1 rounded-lg border p-4 bg-white h-fit sticky top-0">
          <div className="font-semibold">Filters</div>
          <div className="mt-3 grid gap-2 text-sm">
            <input 
              type="date"
              className="border rounded-md px-3 py-2" 
              placeholder="Start date"
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
            />
            <input 
              type="date"
              className="border rounded-md px-3 py-2" 
              placeholder="End date"
              value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
            />
            <select 
              className="border rounded-md px-3 py-2"
              value={filters.modality}
              onChange={(e) => setFilters({...filters, modality: e.target.value})}
            >
              <option value="all">Any modality</option>
              <option value="in-person">In-person</option>
              <option value="virtual">Virtual</option>
              <option value="hybrid">Hybrid</option>
            </select>
            <input 
              className="border rounded-md px-3 py-2" 
              placeholder="City"
              value={filters.city}
              onChange={(e) => setFilters({...filters, city: e.target.value})}
            />
            <input 
              className="border rounded-md px-3 py-2" 
              placeholder="State (e.g., TN)"
              value={filters.state}
              onChange={(e) => setFilters({...filters, state: e.target.value})}
            />
            <select 
              className="border rounded-md px-3 py-2"
              value={filters.courseType}
              onChange={(e) => setFilters({...filters, courseType: e.target.value})}
            >
              <option value="all">All Course Types</option>
              <option value="PHTLS">PHTLS</option>
              <option value="AMLS">AMLS</option>
              <option value="GEMS">GEMS</option>
              <option value="REFRESHER">Refresher</option>
              <option value="TECC">TECC</option>
              <option value="TCCC">TCCC</option>
              <option value="ACLS">ACLS</option>
              <option value="BLS">BLS</option>
              <option value="PALS">PALS</option>
            </select>
            <button
              onClick={() => setFilters({
                startDate: '',
                endDate: '',
                modality: 'all',
                city: '',
                state: '',
                courseType: 'all'
              })}
              className="border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-50 text-sm font-medium"
            >
              Clear Filters
            </button>
          </div>
        </aside>
        <section className="md:col-span-3 overflow-y-auto pr-2">
          <div className="space-y-4">
            {loading && (
              <div className="text-sm text-slate-600">Loading events...</div>
            )}
            {!loading && filteredEvents.length === 0 && (
              <div className="text-sm text-slate-600">
                {events.length > 0 
                  ? `No events match your filters. ${events.length} total events available.`
                  : 'No events found.'
                }
              </div>
            )}
            {!loading && filteredEvents.map((e) => (
              <EventCard key={e.id} e={e} onClick={handleEventClick} />
            ))}
          </div>
        </section>
      </div>
      
      {/* Event Detail Modal */}
      <EventDetailModal 
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  )
}

