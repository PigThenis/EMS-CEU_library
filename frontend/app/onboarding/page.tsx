"use client"

import Button from '@/components/Button'
import { useState } from 'react'
import { GoogleSignInButton } from '@/components/GoogleSignInButton'
import { useRouter } from 'next/navigation'
import { signInWithGoogle } from '@/lib/auth'

export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold">Create your profile</h1>
      <p className="mt-2 text-slate-600">We’ll use this to personalize CEU recommendations and track renewal needs later.</p>
      <Stepper />
    </div>
  )
}

function Stepper() {
  const [step, setStep] = useState(1)
  const [userId, setUserId] = useState<string | null>(null)

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 text-sm">
        <Step n={1} current={step} label="Account" />
        <span className="text-slate-400">—</span>
        <Step n={2} current={step} label="License" />
        <span className="text-slate-400">—</span>
        <Step n={3} current={step} label="Preferences" />
        <span className="text-slate-400">—</span>
        <Step n={4} current={step} label="Done" />
      </div>

      <div className="mt-6 rounded-lg border p-6 bg-white">
        {step === 1 && <AccountForm onNext={(uid) => { setUserId(uid); setStep(2) }} />}
        {step === 2 && <LicenseForm userId={userId} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <PreferencesForm userId={userId} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
        {step === 4 && <Done />}
      </div>
    </div>
  )
}

function Step({ n, current, label }: { n: number, current: number, label: string }) {
  const active = n <= current
  return (
    <div className={`inline-flex items-center gap-2 ${active ? 'text-brand-700' : 'text-slate-400'}`}>
      <span className={`w-6 h-6 rounded-full text-center text-xs leading-6 ${active ? 'bg-brand-100 text-brand-700' : 'bg-slate-100'}`}>{n}</span>
      <span>{label}</span>
    </div>
  )
}

function AccountForm({ onNext }: { onNext: (userId: string) => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  
  async function handleGoogleSignUp() {
    setLoading(true)
    setError('')
    
    try {
      const user = await signInWithGoogle()
      // For Google sign-ups, skip to step 2 with the user ID
      onNext(user.uid)
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled')
      } else if (err.code === 'auth/popup-blocked') {
        setError('Please allow popups for this site')
      } else {
        setError(err.message || 'Google sign-in failed')
      }
    } finally {
      setLoading(false)
    }
  }
  
  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    
    const email = String(formData.get('email') || '')
    const name = String(formData.get('name') || '')
    const password = String(formData.get('password') || '')
    const role = String(formData.get('role') || 'EMT')
    
    try {
      const res = await fetch('/api/auth/register', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password, role }) 
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed')
      }
      
      // Success! Pass the user ID to the next step
      onNext(data.user.uid)
    } catch (err: any) {
      setError(err.message || 'Registration failed')
      console.error('Registration error:', err)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}
      
      {/* Google Sign-In Option */}
      <div>
        <GoogleSignInButton
          onSuccess={() => handleGoogleSignUp()}
          onError={(errorMessage) => setError(errorMessage)}
          disabled={loading}
          text="Sign up with Google"
        />
      </div>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or sign up with email</span>
        </div>
      </div>
      
      {/* Email/Password Form */}
      <form action={handleSubmit} className="grid gap-4">
        <div>
          <label className="block text-sm">Full name</label>
          <input name="name" required className="mt-1 w-full border rounded-md px-3 py-2" disabled={loading} />
        </div>
      <div>
        <label className="block text-sm">Email</label>
        <input type="email" name="email" required className="mt-1 w-full border rounded-md px-3 py-2" disabled={loading} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm">Password</label>
          <input type="password" name="password" required minLength={6} className="mt-1 w-full border rounded-md px-3 py-2" disabled={loading} />
          <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
        </div>
        <div>
          <label className="block text-sm">Role</label>
          <select name="role" className="mt-1 w-full border rounded-md px-3 py-2" disabled={loading}>
            {['EMR','EMT','AEMT','Paramedic'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Continue'}
        </Button>
      </div>
      </form>
    </div>
  )
}

function LicenseForm({ userId, onNext, onBack }: { userId: string | null, onNext: () => void, onBack: () => void }) {
  async function handleSubmit(formData: FormData) {
    if (!userId) { alert('Missing userId'); return }
    const level = String(formData.get('level') || 'EMT') as any
    const licenseNumber = String(formData.get('licenseNumber') || '')
    const issueDate = String(formData.get('issueDate') || '')
    const expirationDate = String(formData.get('expirationDate') || '')
    const renewalCycleMonths = Number(formData.get('renewalCycleMonths') || 24)
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        license: { userId, jurisdiction: 'TN', level, licenseNumber, issueDate, expirationDate, renewalCycleMonths },
      })
    })
    onNext()
  }
  return (
    <form action={handleSubmit} className="grid gap-4">
      <div>
        <label className="block text-sm">License level</label>
        <select name="level" className="mt-1 w-full border rounded-md px-3 py-2">
          {['EMR','EMT','AEMT','Paramedic'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm">License number (optional)</label>
        <input name="licenseNumber" className="mt-1 w-full border rounded-md px-3 py-2" placeholder="e.g., 123456" />
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm">Issue date</label>
          <input type="date" name="issueDate" className="mt-1 w-full border rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm">Expiration date</label>
          <input type="date" name="expirationDate" className="mt-1 w-full border rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm">Renewal cycle (months)</label>
          <input type="number" name="renewalCycleMonths" defaultValue={24} className="mt-1 w-full border rounded-md px-3 py-2" />
        </div>
      </div>
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button type="submit">Continue</Button>
      </div>
    </form>
  )
}

function PreferencesForm({ userId, onNext, onBack }: { userId: string | null, onNext: () => void, onBack: () => void }) {
  async function handleSubmit(formData: FormData) {
    if (!userId) { alert('Missing userId'); return }
    const homeZip = String(formData.get('homeZip') || '')
    const modality = Array.from(formData.getAll('modality')) as string[]
    const maxDistanceMiles = Number(formData.get('maxDistance') || 50)
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        profile: { userId, homeZip, preferences: { modality, maxDistanceMiles } },
      })
    })
    onNext()
  }
  return (
    <form action={handleSubmit} className="grid gap-4">
      <div>
        <label className="block text-sm">Home ZIP</label>
        <input name="homeZip" className="mt-1 w-full border rounded-md px-3 py-2" placeholder="e.g., 37203" />
      </div>
      <fieldset>
        <legend className="block text-sm">Preferred modality</legend>
        <div className="mt-2 flex gap-6 text-sm">
          {['in-person','virtual','hybrid'].map(m => (
            <label key={m} className="inline-flex items-center gap-2">
              <input type="checkbox" name="modality" value={m} /> {m}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="block text-sm">Max distance (miles)</label>
        <input type="number" name="maxDistance" defaultValue={50} className="mt-1 w-full border rounded-md px-3 py-2" />
      </div>
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button type="submit">Finish</Button>
      </div>
    </form>
  )
}

function Done() {
  return (
    <div className="text-center">
      <div className="text-2xl font-semibold">You’re all set</div>
      <p className="mt-2 text-slate-600">Your profile is saved. We’ll add CEU requirement tracking and recommendations next.</p>
      <a href="/events" className="inline-block mt-6">
        <Button>Browse events</Button>
      </a>
    </div>
  )
}

