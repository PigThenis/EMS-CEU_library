'use client'

import { Fragment } from 'react'
import type { EventItem } from '@/app/api/events/route'

interface EventDetailModalProps {
  event: EventItem | null
  isOpen: boolean
  onClose: () => void
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString(undefined, { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  })
}

export default function EventDetailModal({ event, isOpen, onClose }: EventDetailModalProps) {
  if (!isOpen || !event) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-start justify-between">
            <h2 className="text-xl font-semibold">{event.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4">
            {/* Date and Location */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Date</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDate(event.startDate)}
                  {event.endDate && event.endDate !== event.startDate && (
                    <>
                      <br />
                      to {formatDate(event.endDate)}
                    </>
                  )}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Location</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {event.venue || `${event.city}, ${event.state}`}
                </p>
              </div>
            </div>

            {/* Course Type and Modality */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Course Type</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {event.courseType || 'Not specified'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Delivery Format</h3>
                <p className="mt-1">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    event.modality === 'in-person' ? 'bg-green-100 text-green-700' :
                    event.modality === 'virtual' ? 'bg-blue-100 text-blue-700' :
                    'bg-violet-100 text-violet-700'
                  }`}>
                    {event.modality}
                  </span>
                </p>
              </div>
            </div>

            {/* CEUs */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">Continuing Education Units (CEUs)</h3>
              <p className="mt-1 text-sm text-gray-900">
                {event.ceusTotal ? (
                  `${event.ceusTotal} CEUs`
                ) : (
                  <span className="text-gray-500 italic">
                    CEU information pending verification. Please check with the provider.
                  </span>
                )}
              </p>
            </div>

            {/* Categories */}
            {event.categories && event.categories.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Categories</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {event.categories.map(cat => (
                    <span 
                      key={cat}
                      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Additional Information</h3>
                <p className="mt-1 text-sm text-gray-900">{event.description}</p>
              </div>
            )}

            {/* Price */}
            {event.price !== undefined && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Price</h3>
                <p className="mt-1 text-sm text-gray-900">
                  ${event.price.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-6 py-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Data sourced from official provider websites
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Close
                </button>
                {event.url && (
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                  >
                    View on Provider Site →
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
