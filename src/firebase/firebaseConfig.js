// src/firebase/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";

// Your Firebase config (from your second block, corrected storageBucket)
const firebaseConfig = {
  apiKey: "AIzaSyDHJBcjD8WNH8w40TqOy2gupSMpmhR6KMc",
  authDomain: "nearnest-platform.firebaseapp.com",
  databaseURL: "https://nearnest-platform-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nearnest-platform",
  storageBucket: "nearnest-platform.appspot.com", // fixed typo
  messagingSenderId: "548114014175",
  appId: "1:548114014175:web:09233010d591a27a612e6a",
  measurementId: "G-PB1NW3J8GM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export core services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Optional: Analytics only if supported (browser only, not Node.js)
isAnalyticsSupported().then((supported) => {
  if (supported) {
    getAnalytics(app);
  }
});

// Connect to emulators during local dev
if (import.meta.env.DEV) {
  console.log("🔌 Connecting to Firebase Emulators...");
  connectAuthEmulator(auth, "http://localhost:9099");
  connectFirestoreEmulator(db, "localhost", 8081); // port match from your emulator config
}
