// Import the necessary functions from the SDK
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration (use your Firebase config)
const firebaseConfig = {
  apiKey: "AIzaSyDHJBcjD8WNH8w40TqOy2gupSMpmhR6KMc",
  authDomain: "nearnest-platform.firebaseapp.com",
  databaseURL: "https://nearnest-platform-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nearnest-platform",
  storageBucket: "nearnest-platform.firebasestorage.app",
  messagingSenderId: "548114014175",
  appId: "1:548114014175:web:09233010d591a27a612e6a",
  measurementId: "G-PB1NW3J8GM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Authentication
export const auth = getAuth(app);

// Firebase Firestore (for storing data)
export const db = getFirestore(app);

// Firebase Storage (for file upload)
export const storage = getStorage(app);
