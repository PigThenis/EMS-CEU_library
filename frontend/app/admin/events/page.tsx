'use client'

import { useEffect, useState } from 'react'
import { ConfigStatus } from '@/components/ConfigStatus'
import type { EventItem } from '@/app/api/events/route'

interface EventStats {
  total: number
  byType: Record<string, number>
  byProvider: Record<string, number>
  byModality: Record<string, number>
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<EventStats>({
    total: 0,
    byType: {},
    byProvider: {},
    byModality: {}
  })
  const [sortField, setSortField] = useState<keyof EventItem>('startDate')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterProvider, setFilterProvider] = useState<string>('all')
  const [searchText, setSearchText] = useState<string>('')

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      // Use the dedicated admin endpoint that fetches ALL events
      const response = await fetch('/api/admin/events')
      const data = await response.json()
      const eventsList = data.events || []
      setEvents(eventsList)
      
      // Calculate stats
      const stats: EventStats = {
        total: eventsList.length,
        byType: {},
        byProvider: {},
        byModality: {}
      }

      eventsList.forEach((event: EventItem) => {
        // Count by type
        const type = event.courseType || 'Unknown'
        stats.byType[type] = (stats.byType[type] || 0) + 1

        // Count by provider
        const provider = event.provider || 'Unknown'
        stats.byProvider[provider] = (stats.byProvider[provider] || 0) + 1

        // Count by modality
        const modality = event.modality || 'Unknown'
        stats.byModality[modality] = (stats.byModality[modality] || 0) + 1
      })

      setStats(stats)
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: keyof EventItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredAndSortedEvents = events
    .filter(event => {
      if (filterType !== 'all' && event.courseType !== filterType) return false
      if (filterProvider !== 'all' && event.provider !== filterProvider) return false
      if (searchText && !event.title?.toLowerCase().includes(searchText.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      const aVal = a[sortField] || ''
      const bVal = b[sortField] || ''
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortDirection === 'asc' ? comparison : -comparison
    })

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

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold">Admin: All Events</h1>
        <p className="mt-2 text-slate-600">Loading events...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-full px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin: All Events</h1>
        <p className="mt-2 text-slate-600">
          Showing {filteredAndSortedEvents.length} of {events.length} events
        </p>
      </div>

      {/* Configuration Status */}
      <ConfigStatus />
      
      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="font-semibold text-gray-900">Total Events</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="font-semibold text-gray-900">Course Types</h3>
          <p className="text-2xl font-bold text-green-600">{Object.keys(stats.byType).length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="font-semibold text-gray-900">Providers</h3>
          <p className="text-2xl font-bold text-purple-600">{Object.keys(stats.byProvider).length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg border shadow-sm">
        <h3 className="font-semibold mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search by title..."
            className="border rounded-md px-3 py-2"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <select
            className="border rounded-md px-3 py-2"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Course Types</option>
            {Object.keys(stats.byType).sort().map(type => (
              <option key={type} value={type}>
                {type} ({stats.byType[type]})
              </option>
            ))}
          </select>
          <select
            className="border rounded-md px-3 py-2"
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
          >
            <option value="all">All Providers</option>
            {Object.keys(stats.byProvider).sort().map(provider => (
              <option key={provider} value={provider}>
                {provider} ({stats.byProvider[provider]})
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setSearchText('')
              setFilterType('all')
              setFilterProvider('all')
            }}
            className="border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('title')}
                >
                  Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('courseType')}
                >
                  Type {sortField === 'courseType' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('startDate')}
                >
                  Date {sortField === 'startDate' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('city')}
                >
                  Location {sortField === 'city' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('modality')}
                >
                  Modality {sortField === 'modality' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('provider')}
                >
                  Provider {sortField === 'provider' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CEUs
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedEvents.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate" title={event.title}>
                      {event.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {event.courseType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div>
                      <div>{formatDate(event.startDate)}</div>
                      {event.endDate && event.endDate !== event.startDate && (
                        <div className="text-xs text-gray-400">to {formatDate(event.endDate)}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatLocation(event.city, event.state)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
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
                    <div className="max-w-xs truncate" title={event.provider}>
                      {event.provider}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {event.ceuHours || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAndSortedEvents.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No events found matching your filters.
          </div>
        )}
      </div>
    </div>
  )
}
