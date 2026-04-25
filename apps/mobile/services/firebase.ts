import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FirebaseError,
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

type FirebaseEnv = {
  EXPO_PUBLIC_FIREBASE_API_KEY?: string;
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
  EXPO_PUBLIC_FIREBASE_PROJECT_ID?: string;
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
  EXPO_PUBLIC_FIREBASE_APP_ID?: string;
};

declare const process: {
  env: FirebaseEnv;
};

function readRequiredEnv(key: keyof FirebaseEnv) {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(
      `Missing required mobile Firebase env var: ${key}. Add it to apps/mobile/.env and restart Expo.`,
    );
  }

  return value;
}

const firebaseConfig: FirebaseOptions = {
  apiKey: readRequiredEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: readRequiredEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: readRequiredEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: readRequiredEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readRequiredEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: readRequiredEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
};

export const firebaseApp: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

function initializeMobileAuth(app: FirebaseApp): Auth {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'auth/already-initialized') {
      return getAuth(app);
    }

    throw error;
  }
}

export const auth = initializeMobileAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
