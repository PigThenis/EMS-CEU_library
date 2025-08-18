import EventCard from '@/components/EventCard'

async function getEvents() {
  try {
    const res = await fetch('/api/events', { cache: 'no-store' })
    if (!res.ok) return { events: [] }
    return res.json()
  } catch (_) {
    return { events: [] }
  }
}

export default async function EventsPage() {
  const { events } = await getEvents()
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-3xl font-bold">Browse events</h1>
      <p className="mt-2 text-slate-600">
        Filter by date, modality, and CEU categories (filters are placeholders; API wiring coming next).
      </p>
      <div className="mt-6 grid md:grid-cols-4 gap-4">
        <aside className="md:col-span-1 rounded-lg border p-4 bg-white">
          <div className="font-semibold">Filters (placeholder)</div>
          <div className="mt-3 grid gap-2 text-sm">
            <input className="border rounded-md px-3 py-2" placeholder="Start date" />
            <input className="border rounded-md px-3 py-2" placeholder="End date" />
            <select className="border rounded-md px-3 py-2">
              <option>Any modality</option>
              <option>In-person</option>
              <option>Virtual</option>
              <option>Hybrid</option>
            </select>
            <input className="border rounded-md px-3 py-2" placeholder="ZIP or city" />
            <input className="border rounded-md px-3 py-2" placeholder="Radius (miles)" />
          </div>
        </aside>
        <section className="md:col-span-3 grid gap-4">
          {events.length === 0 && (
            <div className="text-sm text-slate-600">No events found.</div>
          )}
          {events.map((e: any) => (
            <EventCard key={e.id} e={e} />
          ))}
        </section>
      </div>
    </div>
  )
}

