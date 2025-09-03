import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;

export function initAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // For development - can mix production and emulator services
  if (process.env.NODE_ENV === 'development') {
    // Only set emulator hosts if explicitly enabled
    if (process.env.NEXT_PUBLIC_USE_AUTH_EMULATOR === 'true') {
      process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9098';
    }
    if (process.env.NEXT_PUBLIC_USE_FIRESTORE_EMULATOR === 'true') {
      process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    }
    
    adminApp = initializeApp({
      projectId: 'ems-ceu-library',
    });
  } else {
    // For production, use service account
    // You'll need to add service account credentials
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccount) {
      adminApp = initializeApp({
        credential: cert(JSON.parse(serviceAccount))
      });
    } else {
      // Fallback to default credentials (works in Google Cloud environments)
      adminApp = initializeApp();
    }
  }

  return adminApp;
}

export function getAdminAuth() {
  const app = initAdmin();
  return getAuth(app);
}

export function getAdminFirestore() {
  const app = initAdmin();
  return getFirestore(app);
}
