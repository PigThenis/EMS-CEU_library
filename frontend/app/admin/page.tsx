export default function AdminPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold">Admin</h1>
      <p className="mt-2 text-slate-600">Placeholder for moderation queue and source health.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border p-4 bg-white">
          <div className="font-semibold">Moderation queue</div>
          <p className="text-sm text-slate-600">No items yet.</p>
        </section>
        <section className="rounded-lg border p-4 bg-white">
          <div className="font-semibold">Source health</div>
          <p className="text-sm text-slate-600">All scrapers are placeholders.</p>
        </section>
      </div>
    </div>
  )
}

