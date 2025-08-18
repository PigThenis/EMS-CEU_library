import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/types'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { email, password } = body || {}
  if (!email || !password) {
    return NextResponse.json({ error: 'Missing email or password' }, { status: 400 })
  }
  const user = Array.from(db.users.values()).find(u => u.email === email)
  if (!user || user.passwordHash !== `placeholder-hash:${Buffer.from(password).toString('base64')}`) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }
  // Return a placeholder token (do NOT use in production)
  const token = `placeholder-token:${user.id}`
  return NextResponse.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } })
}

