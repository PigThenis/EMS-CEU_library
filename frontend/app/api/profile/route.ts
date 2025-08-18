import { NextRequest, NextResponse } from 'next/server'
import { db, UserProfile, License } from '@/lib/types'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  const profile = db.profiles.get(userId)
  const license = db.licenses.get(userId)
  return NextResponse.json({ profile, license })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { userId, profile, license } = body as { userId: string, profile: UserProfile, license: License }
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  if (profile) db.profiles.set(userId, { ...profile, userId })
  if (license) db.licenses.set(userId, { ...license, userId })
  return NextResponse.json({ ok: true })
}

