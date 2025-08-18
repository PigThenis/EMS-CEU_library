export default function SubmitEventPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Submit an event (placeholder)</h1>
      <p className="mt-2 text-slate-600">Providers can submit EMS CE events here. Submissions will go to manual review.</p>
      <form className="mt-6 grid gap-4">
        <input className="border rounded-md px-3 py-2" placeholder="Event title" />
        <div className="grid md:grid-cols-3 gap-3">
          <input className="border rounded-md px-3 py-2" placeholder="City" />
          <input className="border rounded-md px-3 py-2" placeholder="State" defaultValue="TN" />
          <input className="border rounded-md px-3 py-2" type="date" />
        </div>
        <select className="border rounded-md px-3 py-2">
          <option>Modality</option>
          <option>In-person</option>
          <option>Virtual</option>
          <option>Hybrid</option>
        </select>
        <button className="rounded-md bg-brand-600 px-3 py-2 text-white hover:bg-brand-700">Submit</button>
      </form>
    </div>
  )
}

