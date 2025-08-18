import EventCard from '@/components/EventCard'
import { notFound } from 'next/navigation'
import { getEventById } from '@/lib/events'

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const event = getEventById(params.id)
  if (!event) return notFound()
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">{event.title}</h1>
      <p className="mt-2 text-slate-600">{event.city ? `${event.city}, ${event.state ?? 'TN'}` : ''}</p>
      <div className="mt-6">
        <EventCard e={event} />
      </div>
      <div className="mt-6 prose prose-slate max-w-none">
        <p>This is a placeholder event detail page. We will add a full description, CEU breakdown, schedule, map, and a register link.</p>
      </div>
    </div>
  )
}

