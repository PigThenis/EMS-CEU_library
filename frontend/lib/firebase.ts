import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // These will be populated with your actual Firebase config
  // For development, you can use the emulator
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// For development with emulators
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Use a flag to prevent multiple connections
  if (!(globalThis as any).firebaseEmulatorsConnected) {
    try {
      const { connectAuthEmulator } = require('firebase/auth');
      const { connectFirestoreEmulator } = require('firebase/firestore');
      
      connectAuthEmulator(auth, 'http://localhost:9098', { disableWarnings: true });
      connectFirestoreEmulator(db, 'localhost', 8081);
      
      (globalThis as any).firebaseEmulatorsConnected = true;
      console.log('Connected to Firebase emulators');
    } catch (error) {
      // Emulators may already be connected or not available
      console.log('Firebase emulators connection:', error);
    }
  }
}

export default app;