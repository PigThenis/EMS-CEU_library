import Button from '@/components/Button'

export default function HomePage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
              Tennessee EMS Continuing Education, Simplified
            </h1>
            <p className="mt-4 text-lg text-slate-700">
              Search live, virtual, and hybrid courses with CEU details and categories—ACLS, PALS, NRP, PHTLS and more.
            </p>
            <div className="mt-6 flex gap-3">
              <a href="/events"><Button>Find CEUs</Button></a>
              <a href="/onboarding"><Button variant="outline" className="">Create free profile</Button></a>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-slate-600">
              <div>• Tennessee-focused sources</div>
              <div>• In-person, virtual, hybrid</div>
              <div>• Filter by CEU category</div>
              <div>• Border-region events included</div>
            </div>
          </div>
          <div>
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900">Quick search (placeholder)</h3>
              <form className="mt-4 grid gap-3">
                <input className="border rounded-md px-3 py-2" placeholder="City or ZIP" />
                <input className="border rounded-md px-3 py-2" placeholder="Date range" />
                <select className="border rounded-md px-3 py-2">
                  <option>Any modality</option>
                  <option>In-person</option>
                  <option>Virtual</option>
                  <option>Hybrid</option>
                </select>
                <Button type="button">Search</Button>
              </form>
              <p className="mt-3 text-xs text-slate-500">Search is a placeholder; wired to API in a later phase.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="text-2xl font-semibold">Featured categories</h2>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {['ACLS','PALS','NRP','PHTLS','AMLS','BLS','Trauma','Pediatric'].map((c) => (
            <a key={c} href={`/events?category=${encodeURIComponent(c)}`}
               className="rounded-lg border p-4 hover:border-brand-500 hover:shadow-sm">
              <div className="font-medium">{c}</div>
              <div className="text-sm text-slate-600">Explore {c} courses</div>
            </a>
          ))}
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <h2 className="text-2xl font-semibold">Upcoming highlights (placeholder)</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[1,2,3].map((i) => (
              <div key={i} className="rounded-lg border bg-white p-4">
                <div className="text-sm text-slate-500">Nashville, TN · Sep {10+i}, 2025</div>
                <div className="mt-1 font-semibold">ACLS Renewal</div>
                <div className="mt-1 text-sm">8 CEUs · In-person</div>
                <a href="#" className="mt-3 inline-block text-brand-700 text-sm">Details</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="text-2xl font-semibold">How it works</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {t:'We find events', d:'We aggregate from official TN-focused and national providers.'},
            {t:'We enrich details', d:'CEU counts, categories, modality, distance, and more.'},
            {t:'You filter and register', d:'Find what you need fast; register on the provider site.'}
          ].map((s, idx) => (
            <li key={idx} className="rounded-lg border p-4 bg-white">
              <div className="text-sm text-slate-500">Step {idx+1}</div>
              <div className="mt-1 font-semibold">{s.t}</div>
              <div className="mt-1 text-sm text-slate-600">{s.d}</div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

