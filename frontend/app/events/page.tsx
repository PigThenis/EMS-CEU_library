'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import EventDetailModal from '@/components/EventDetailModal'
import type { EventItem } from '@/app/api/events/route'

interface Filters {
  startDate: string
  endDate: string
  modality: string
  city: string
  state: string
  courseType: string
  searchText: string
  provider: string
  openToPublic: string
}

function EventsPageContent() {
  const searchParams = useSearchParams()
  const [events, setEvents] = useState<EventItem[]>([])
  const [filteredEvents, setFilteredEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [sortField, setSortField] = useState<keyof EventItem>('startDate')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  
  // Initialize filters from URL params
  const getInitialFilters = (): Filters => {
    const category = searchParams.get('category') || ''
    // Map category names to courseType values
    let courseType = 'all'
    if (category) {
      // Handle direct mappings - most categories match exactly
      courseType = category.toUpperCase()
    }
    
    return {
      startDate: searchParams.get('startDate') || '',
      endDate: searchParams.get('endDate') || '',
      modality: searchParams.get('modality') || 'all',
      city: searchParams.get('city') || '',
      state: searchParams.get('state') || '',
      courseType: courseType,
      searchText: searchParams.get('search') || '',
      provider: searchParams.get('provider') || 'all',
      openToPublic: searchParams.get('public') || 'all'
    }
  }
  
  const [filters, setFilters] = useState<Filters>(getInitialFilters())

  useEffect(() => {
    // Use admin API to get ALL events, not just 50
    fetch('/api/admin/events')
      .then(res => res.json())
      .then(data => {
        setEvents(data.events || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch events:', err)
        setEvents([])
        setLoading(false)
      })
  }, [])

  // Apply filters and sorting whenever filters or events change
  useEffect(() => {
    let filtered = [...events]

    // Search text filtering
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase()
      filtered = filtered.filter(e => 
        e.title?.toLowerCase().includes(searchLower) ||
        e.city?.toLowerCase().includes(searchLower) ||
        e.state?.toLowerCase().includes(searchLower) ||
        e.courseType?.toLowerCase().includes(searchLower)
      )
    }

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

    // Provider filtering
    if (filters.provider !== 'all') {
      filtered = filtered.filter(e => e.provider === filters.provider)
    }

    // Sort the results
    filtered.sort((a, b) => {
      const aVal = a[sortField] || ''
      const bVal = b[sortField] || ''
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortDirection === 'asc' ? comparison : -comparison
    })

    setFilteredEvents(filtered)
  }, [filters, events, sortField, sortDirection])

  const handleSort = (field: keyof EventItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleEventClick = (event: EventItem) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedEvent(null)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A'
    try {
      return new Date(dateStr).toLocaleDateString()
    } catch {
      return dateStr
    }
  }

  const formatLocation = (city?: string, state?: string) => {
    if (city && state) return `${city}, ${state}`
    if (city) return city
    if (state) return state
    return 'N/A'
  }

  // Get unique values for filter dropdowns
  const uniqueProviders = Array.from(new Set(events.map(e => e.provider).filter(Boolean))).sort()
  const uniqueCourseTypes = Array.from(new Set(events.map(e => e.courseType).filter(Boolean))).sort()

  return (
    <div className="mx-auto max-w-full px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Browse Events</h1>
        <p className="mt-2 text-slate-600">
          Showing {filteredEvents.length} of {events.length} events
        </p>
      </div>

      {/* Enhanced Filters Bar */}
      <div className="mb-6 bg-white p-4 rounded-lg border shadow-sm">
        <h3 className="font-semibold mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Search events..."
            className="border rounded-md px-3 py-2"
            value={filters.searchText}
            onChange={(e) => setFilters({...filters, searchText: e.target.value})}
          />
          <select
            className="border rounded-md px-3 py-2"
            value={filters.courseType}
            onChange={(e) => setFilters({...filters, courseType: e.target.value})}
          >
            <option value="all">All Course Types</option>
            {uniqueCourseTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select
            className="border rounded-md px-3 py-2"
            value={filters.modality}
            onChange={(e) => setFilters({...filters, modality: e.target.value})}
          >
            <option value="all">Any Modality</option>
            <option value="in-person">In-Person</option>
            <option value="virtual">Virtual</option>
            <option value="hybrid">Hybrid</option>
          </select>
          <select
            className="border rounded-md px-3 py-2"
            value={filters.provider}
            onChange={(e) => setFilters({...filters, provider: e.target.value})}
          >
            <option value="all">All Providers</option>
            {uniqueProviders.map(provider => (
              <option key={provider} value={provider}>{provider}</option>
            ))}
          </select>
          <input
            type="date"
            placeholder="Start Date"
            className="border rounded-md px-3 py-2"
            value={filters.startDate}
            onChange={(e) => setFilters({...filters, startDate: e.target.value})}
          />
          <input
            type="date"
            placeholder="End Date"
            className="border rounded-md px-3 py-2"
            value={filters.endDate}
            onChange={(e) => setFilters({...filters, endDate: e.target.value})}
          />
          <input
            placeholder="City"
            className="border rounded-md px-3 py-2"
            value={filters.city}
            onChange={(e) => setFilters({...filters, city: e.target.value})}
          />
          <input
            placeholder="State (e.g., TN)"
            className="border rounded-md px-3 py-2"
            value={filters.state}
            onChange={(e) => setFilters({...filters, state: e.target.value})}
          />
        </div>
        <div className="mt-3 flex justify-between items-center">
          <button
            onClick={() => setFilters({
              startDate: '',
              endDate: '',
              modality: 'all',
              city: '',
              state: '',
              courseType: 'all',
              searchText: '',
              provider: 'all',
              openToPublic: 'all'
            })}
            className="border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-50 text-sm font-medium"
          >
            Clear All Filters
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                viewMode === 'table' 
                  ? 'bg-blue-500 text-white' 
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                viewMode === 'cards' 
                  ? 'bg-blue-500 text-white' 
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Card View
            </button>
          </div>
        </div>
      </div>

      {/* Events Table/Cards */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading events...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No events found matching your filters.
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('title')}
                  >
                    Title {sortField === 'title' && (sortDirection === 'asc' ? '🔼' : '🔽')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('courseType')}
                  >
                    Type {sortField === 'courseType' && (sortDirection === 'asc' ? '🔼' : '🔽')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('startDate')}
                  >
                    Date {sortField === 'startDate' && (sortDirection === 'asc' ? '🔼' : '🔽')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('modality')}
                  >
                    Modality {sortField === 'modality' && (sortDirection === 'asc' ? '🔼' : '🔽')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CEUs
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={event.title}>
                        {event.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {event.courseType || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>{formatDate(event.startDate)}</div>
                      {event.endDate && event.endDate !== event.startDate && (
                        <div className="text-xs text-gray-400">to {formatDate(event.endDate)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatLocation(event.city, event.state)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        event.modality === 'in-person' ? 'bg-green-100 text-green-800' :
                        event.modality === 'virtual' ? 'bg-purple-100 text-purple-800' :
                        event.modality === 'hybrid' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {event.modality || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {event.ceuHours || event.ceusTotal || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      <button
                        onClick={() => handleEventClick(event)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => handleEventClick(event)}
              className="bg-white rounded-lg border p-4 hover:shadow-md cursor-pointer transition-shadow"
            >
              <div className="font-semibold text-gray-900">{event.title}</div>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {event.courseType || 'N/A'}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  event.modality === 'in-person' ? 'bg-green-100 text-green-800' :
                  event.modality === 'virtual' ? 'bg-purple-100 text-purple-800' :
                  event.modality === 'hybrid' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {event.modality || 'N/A'}
                </span>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                <div>📅 {formatDate(event.startDate)}</div>
                <div>📍 {formatLocation(event.city, event.state)}</div>
                {(event.ceuHours || event.ceusTotal) && (
                  <div>🎓 {event.ceuHours || event.ceusTotal} CEUs</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Event Detail Modal */}
      <EventDetailModal 
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  )
}

export default function EventsPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold">Browse events</h1>
        <p className="mt-2 text-slate-600">Loading...</p>
      </div>
    }>
      <EventsPageContent />
    </Suspense>
  )
}

