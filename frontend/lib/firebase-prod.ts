import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
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

// Control what to use via environment variable
if (process.env.NEXT_PUBLIC_USE_EMULATORS === 'true' && typeof window !== 'undefined') {
  // Use emulators for everything except Auth (for Google Sign-In testing)
  if (!(globalThis as any).firebaseEmulatorsConnected) {
    try {
      // Only connect Firestore to emulator, not Auth
      connectFirestoreEmulator(db, 'localhost', 8080);
      
      // Optionally connect Auth emulator (but Google Sign-In won't work)
      if (process.env.NEXT_PUBLIC_EMULATE_AUTH === 'true') {
        connectAuthEmulator(auth, 'http://localhost:9098', { disableWarnings: true });
        console.log('Using Auth emulator (Google Sign-In will not work with real accounts)');
      } else {
        console.log('Using production Auth (Google Sign-In will work)');
      }
      
      (globalThis as any).firebaseEmulatorsConnected = true;
      console.log('Connected to Firebase emulators (Firestore only)');
    } catch (error) {
      console.log('Firebase emulators connection:', error);
    }
  }
}

export default app;
