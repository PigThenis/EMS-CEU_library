'use client'

import classNames from 'classnames'
import type { EventItem } from '@/app/api/events/route'

interface EventCardProps {
  e: EventItem
  onClick?: (event: EventItem) => void
}

function formatDateRange(startISO: string, endISO?: string) {
  const start = new Date(startISO)
  if (!endISO) return start.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  const end = new Date(endISO)
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
  const startStr = start.toLocaleString(undefined, { month: 'short', day: 'numeric' })
  const endStr = end.toLocaleString(undefined, sameMonth ? { day: 'numeric', year: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' })
  return `${startStr} – ${endStr}`
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
            {e.city ? `${e.city}, ${e.state ?? 'TN'} · ` : ''}{formatDateRange(e.startDate, e.endDate)}
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

