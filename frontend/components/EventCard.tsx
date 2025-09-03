'use client'

import classNames from 'classnames'
import type { EventItem } from '@/app/api/events/route'

interface EventCardProps {
  e: EventItem
  onClick?: (event: EventItem) => void
}

function formatDateRange(startISO: string, endISO?: string) {
  const start = new Date(startISO)
  const end = endISO ? new Date(endISO) : null
  
  // Single day or no end date
  if (!end || start.toDateString() === end.toDateString()) {
    return start.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  
  const sameYear = start.getFullYear() === end.getFullYear()
  const sameMonth = start.getMonth() === end.getMonth() && sameYear
  
  if (sameMonth) {
    // Same month and year: "Oct 6 - 7, 2025"
    return `${start.toLocaleString('en-US', { month: 'short', day: 'numeric' })} - ${end.getDate()}, ${end.getFullYear()}`
  } else if (sameYear) {
    // Different months, same year: "Oct 6 - Nov 7, 2025"
    return `${start.toLocaleString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleString('en-US', { month: 'short', day: 'numeric' })}, ${end.getFullYear()}`
  } else {
    // Different years: "Dec 30, 2025 - Jan 2, 2026"
    return `${start.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }
}

export default function EventCard({ e, onClick }: EventCardProps) {
  return (
    <div 
      className="rounded-lg border p-4 bg-white hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
      onClick={() => onClick?.(e)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-sm text-slate-500">
            {e.city ? `${e.city}${e.state ? `, ${e.state}` : ''} · ` : ''}
            {formatDateRange(e.startDate, e.endDate)}
          </div>
          <div className="mt-1 font-semibold">{e.title}</div>
          <div className="mt-1 text-sm text-slate-600">
            {e.courseType ? `${e.courseType}` : ''}
            {e.description && ` · ${e.description}`}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            CEUs: <span className="text-slate-400">TBD (pending verification)</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={classNames('inline-flex items-center rounded-full px-2 py-0.5 text-xs border', {
              'bg-green-50 border-green-200 text-green-700': e.modality === 'in-person',
              'bg-blue-50 border-blue-200 text-blue-700': e.modality === 'virtual',
              'bg-violet-50 border-violet-200 text-violet-700': e.modality === 'hybrid',
            })}>
              {e.modality}
            </span>
            {(e.categories ?? []).map(c => (
              <span key={c} className="inline-flex items-center rounded-full px-2 py-0.5 text-xs border bg-slate-50 border-slate-200 text-slate-700">
                {c}
              </span>
            ))}
          </div>
        </div>
        <button 
          onClick={(evt) => {
            evt.stopPropagation()
            onClick?.(e)
          }}
          className="text-blue-600 hover:text-blue-700 text-sm shrink-0 font-medium"
        >
          View Details →
        </button>
      </div>
    </div>
  )
}

