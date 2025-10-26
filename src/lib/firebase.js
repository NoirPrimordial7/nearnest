// src/lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
  GoogleAuthProvider,
  // Re-exported helpers your pages can import from this file
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// Prefer env vars (Vite exposes only VITE_*). Falls back to your pasted config
// so you can get unblocked immediately. Move these to .env.local ASAP.
const cfg = {
  apiKey:              import.meta.env.VITE_FIREBASE_API_KEY              || "AIzaSyDHJBcjD8WNH8w40TqOy2gupSMpmhR6KMc",
  authDomain:          import.meta.env.VITE_FIREBASE_AUTH_DOMAIN          || "nearnest-platform.firebaseapp.com",
  databaseURL:         import.meta.env.VITE_FIREBASE_DATABASE_URL         || "https://nearnest-platform-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:           import.meta.env.VITE_FIREBASE_PROJECT_ID           || "nearnest-platform",
  storageBucket:       import.meta.env.VITE_FIREBASE_STORAGE_BUCKET       || "nearnest-platform.firebasestorage.app",
  messagingSenderId:   import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID  || "548114014175",
  appId:               import.meta.env.VITE_FIREBASE_APP_ID               || "1:548114014175:web:09233010d591a27a612e6a",
  measurementId:       import.meta.env.VITE_FIREBASE_MEASUREMENT_ID       || "G-PB1NW3J8GM",
};

// Initialize once (hot reload safe)
const app = getApps().length ? getApp() : initializeApp(cfg);

// Auth
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence); // keep user logged in
const googleProvider = new GoogleAuthProvider();

// Analytics (guarded so it won’t break in unsupported envs)
let analytics = null;
isSupported().then((ok) => { if (ok) analytics = getAnalytics(app); }).catch(() => {});

export {
  app,
  auth,
  googleProvider,
  analytics,

  // Re-export auth helpers so your pages can do:
  // import { auth, signInWithEmailAndPassword } from "../../lib/firebase";
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
};
