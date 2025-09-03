import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { email, password, name, role } = body || {}
    
    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }
    
    // Create user in Firebase Auth
    const auth = getAdminAuth();
    const firestore = getAdminFirestore();
    
    try {
      // Create the Firebase Auth user
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
        emailVerified: false
      });
      
      // Create user profile in Firestore
      await firestore.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email,
        name,
        role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emailVerified: false,
        profile: {
          level: role,
          jurisdiction: 'TN',
          preferences: {
            notifications: true,
            newsletter: false
          }
        }
      });
      
      // Generate custom token for immediate login
      const customToken = await auth.createCustomToken(userRecord.uid);
      
      return NextResponse.json({
        success: true,
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          name: userRecord.displayName,
          role
        },
        customToken // Client can use this to sign in immediately
      });
      
    } catch (error: any) {
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/email-already-exists') {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
      }
      if (error.code === 'auth/invalid-email') {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
      }
      if (error.code === 'auth/weak-password') {
        return NextResponse.json({ error: 'Password is too weak' }, { status: 400 })
      }
      throw error;
    }
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ 
      error: 'Registration failed',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

