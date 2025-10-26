import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const cfg = {
  apiKey:             import.meta.env.VITE_FB_API_KEY,
  authDomain:         import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId:          import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket:      import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId:  import.meta.env.VITE_FB_MSG_SENDER_ID,
  appId:              import.meta.env.VITE_FB_APP_ID,
  measurementId:      import.meta.env.VITE_FB_MEASUREMENT_ID,
};

export const app  = getApps().length ? getApp() : initializeApp(cfg);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// Optional: analytics (no blocking)
let analytics;
if (typeof window !== "undefined" && cfg.measurementId) {
  import("firebase/analytics").then(async ({ getAnalytics, isSupported }) => {
    if (await isSupported()) analytics = getAnalytics(app);
  }).catch(() => {});
}
export { analytics };
