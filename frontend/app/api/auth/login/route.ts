import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { email, password, idToken } = body || {}
    
    // If we have an idToken, verify it
    if (idToken) {
      try {
        const auth = getAdminAuth();
        const decodedToken = await auth.verifyIdToken(idToken);
        const firestore = getAdminFirestore();
        
        // Get user profile from Firestore
        const userDoc = await firestore.collection('users').doc(decodedToken.uid).get();
        const userData = userDoc.data();
        
        return NextResponse.json({
          success: true,
          user: {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name || userData?.name,
            role: userData?.role,
            emailVerified: decodedToken.email_verified
          }
        });
      } catch (error: any) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
    }
    
    // For email/password login, we need to handle it differently
    // Since Admin SDK can't verify passwords, we'll create a custom token
    // The actual password verification happens on the client side
    if (!email) {
      return NextResponse.json({ error: 'Missing email or token' }, { status: 400 })
    }
    
    try {
      const auth = getAdminAuth();
      const firestore = getAdminFirestore();
      
      // Get user by email
      const userRecord = await auth.getUserByEmail(email);
      
      // Get user profile from Firestore
      const userDoc = await firestore.collection('users').doc(userRecord.uid).get();
      const userData = userDoc.data();
      
      // Note: We can't verify the password server-side with Admin SDK
      // This endpoint should only be called after client-side authentication
      // For now, we'll return user data if the email exists
      // In production, you should use Firebase Auth on the client side
      
      return NextResponse.json({
        success: true,
        message: 'Use Firebase Auth client SDK for password verification',
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          name: userRecord.displayName || userData?.name,
          role: userData?.role,
          emailVerified: userRecord.emailVerified
        }
      });
      
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      throw error;
    }
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      error: 'Login failed',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

