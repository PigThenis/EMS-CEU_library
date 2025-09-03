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

// Control emulator connections via environment variables
if (typeof window !== 'undefined') {
  // Use a flag to prevent multiple connections
  if (!(globalThis as any).firebaseEmulatorsConnected) {
    try {
      // Connect to Firestore emulator if enabled
      if (process.env.NEXT_PUBLIC_USE_FIRESTORE_EMULATOR === 'true') {
        const { connectFirestoreEmulator } = require('firebase/firestore');
        connectFirestoreEmulator(db, 'localhost', 8080);
        console.log('Connected to Firestore emulator');
      }
      
      // Connect to Auth emulator if enabled (disables real Google Sign-In)
      if (process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR === 'true') {
        const { connectAuthEmulator } = require('firebase/auth');
        connectAuthEmulator(auth, 'http://localhost:9098', { disableWarnings: true });
        console.log('Connected to Auth emulator (Google Sign-In will use mock)');
      } else {
        console.log('Using production Firebase Auth (Google Sign-In will work)');
      }
      
      (globalThis as any).firebaseEmulatorsConnected = true;
    } catch (error) {
      // Emulators may already be connected or not available
      console.log('Firebase connection:', error);
    }
  }
}

export default app;