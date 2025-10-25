// firebase.js

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDHJBcjD8WNH8w40TqOy2gupSMpmhR6KMc",
  authDomain: "nearnest-platform.firebaseapp.com",
  databaseURL: "https://nearnest-platform-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nearnest-platform",
  storageBucket: "nearnest-platform.appspot.com", // ❗fix typo from .firebasestorage.app
  messagingSenderId: "548114014175",
  appId: "1:548114014175:web:09233010d591a27a612e6a",
  measurementId: "G-PB1NW3J8GM"
};

// 🛡 Only initialize once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
