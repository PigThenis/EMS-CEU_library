"use client"
import { useEffect, useState } from 'react'
import Button from '@/components/Button'

export default function ProfilePage() {
  const [userId, setUserId] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [license, setLicense] = useState<any>(null)

  async function load() {
    if (!userId) return
    const res = await fetch(`/api/profile?userId=${encodeURIComponent(userId)}`)
    const data = await res.json()
    setProfile(data.profile ?? {})
    setLicense(data.license ?? { jurisdiction: 'TN', level: 'EMT' })
    setLoaded(true)
  }

  async function save() {
    if (!userId) return
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, profile: { ...profile, userId }, license: { ...license, userId } })
    })
    alert('Saved')
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Your profile</h1>
      <p className="mt-2 text-slate-600">Enter your User ID to load and edit your saved details.</p>

      <div className="mt-6 flex gap-2">
        <input className="border rounded-md px-3 py-2 w-full" placeholder="User ID" value={userId} onChange={e => setUserId(e.target.value)} />
        <Button onClick={load}>Load</Button>
      </div>

      {loaded && (
        <div className="mt-8 grid gap-8">
          <section className="rounded-lg border p-4 bg-white">
            <div className="font-semibold">Profile</div>
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm">Home ZIP</label>
                <input className="mt-1 w-full border rounded-md px-3 py-2" value={profile?.homeZip ?? ''} onChange={e => setProfile({ ...(profile ?? {}), homeZip: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm">Max distance (miles)</label>
                <input type="number" className="mt-1 w-full border rounded-md px-3 py-2" value={profile?.preferences?.maxDistanceMiles ?? 50} onChange={e => setProfile({ ...(profile ?? {}), preferences: { ...(profile?.preferences ?? {}), maxDistanceMiles: Number(e.target.value) } })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm">Preferred modality</label>
                <div className="mt-2 flex gap-6 text-sm">
                  {['in-person','virtual','hybrid'].map(m => (
                    <label key={m} className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={Boolean(profile?.preferences?.modality?.includes(m))} onChange={(e) => {
                        const current = new Set(profile?.preferences?.modality ?? [])
                        if (e.target.checked) current.add(m); else current.delete(m)
                        setProfile({ ...(profile ?? {}), preferences: { ...(profile?.preferences ?? {}), modality: Array.from(current) } })
                      }} /> {m}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border p-4 bg-white">
            <div className="font-semibold">License</div>
            <div className="mt-4 grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm">Level</label>
                <select className="mt-1 w-full border rounded-md px-3 py-2" value={license?.level ?? 'EMT'} onChange={e => setLicense({ ...(license ?? {}), level: e.target.value })}>
                  {['EMR','EMT','AEMT','Paramedic'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm">License number (optional)</label>
                <input className="mt-1 w-full border rounded-md px-3 py-2" value={license?.licenseNumber ?? ''} onChange={e => setLicense({ ...(license ?? {}), licenseNumber: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm">Renewal cycle (months)</label>
                <input type="number" className="mt-1 w-full border rounded-md px-3 py-2" value={license?.renewalCycleMonths ?? 24} onChange={e => setLicense({ ...(license ?? {}), renewalCycleMonths: Number(e.target.value) })} />
              </div>
              <div>
                <label className="block text-sm">Issue date</label>
                <input type="date" className="mt-1 w-full border rounded-md px-3 py-2" value={license?.issueDate ?? ''} onChange={e => setLicense({ ...(license ?? {}), issueDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm">Expiration date</label>
                <input type="date" className="mt-1 w-full border rounded-md px-3 py-2" value={license?.expirationDate ?? ''} onChange={e => setLicense({ ...(license ?? {}), expirationDate: e.target.value })} />
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <Button onClick={save}>Save changes</Button>
          </div>
        </div>
      )}
    </div>
  )
}

