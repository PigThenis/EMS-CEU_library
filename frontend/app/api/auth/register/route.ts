import { NextRequest, NextResponse } from 'next/server'
import { db, User } from '@/lib/types'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { email, password, name, role } = body || {}
  if (!email || !password || !name || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const id = crypto.randomUUID()
  const passwordHash = `placeholder-hash:${Buffer.from(password).toString('base64')}`
  const user: User = {
    id,
    email,
    passwordHash,
    name,
    role,
    createdAt: new Date().toISOString(),
  }
  db.users.set(id, user)
  return NextResponse.json({ id, email, name, role })
}

