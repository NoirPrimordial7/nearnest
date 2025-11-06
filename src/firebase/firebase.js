// src/firebase/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey:             import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:         import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:          import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:      import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, // e.g. nearnest-platform.appspot.com
  messagingSenderId:  import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:              import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:      import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Avoid duplicate app during HMR
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

// Use the bucket from firebaseConfig.storageBucket
const storage = getStorage(app);

export { app, auth, googleProvider, db, storage };
