import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  // @ts-expect-error RN bundle export; missing from default web auth types
  getReactNativePersistence,
  type Auth,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  type Firestore,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}

// Cached singletons — each is only initialized once to avoid
// "already initialized / settings can no longer be changed" errors
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;
  if (!app) {
    app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth | null {
  if (auth) return auth;

  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;

  if (Platform.OS === 'web') {
    auth = getAuth(firebaseApp);
    return auth;
  }

  try {
    auth = initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Already initialized — grab the existing instance
    auth = getAuth(firebaseApp);
  }
  return auth;
}

export function getFirebaseDb(): Firestore | null {
  if (db) return db;

  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) {
    return null;
  }

  try {
    db = initializeFirestore(firebaseApp, {
      localCache:
        Platform.OS === 'web' ? persistentLocalCache() : memoryLocalCache(),
    });
  } catch {
    try {
      db = getFirestore(firebaseApp);
    } catch {
      return null;
    }
  }
  return db;
}
