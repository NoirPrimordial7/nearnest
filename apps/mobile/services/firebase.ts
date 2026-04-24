import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Placeholder config only. Replace through the approved mobile config plan before real auth.
const firebaseConfig = {
  apiKey: 'MEDIFIND_PLACEHOLDER_API_KEY',
  authDomain: 'medifind-placeholder.firebaseapp.com',
  projectId: 'medifind-placeholder',
  storageBucket: 'medifind-placeholder.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:0000000000000000000000',
};

export const firebaseApp: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
