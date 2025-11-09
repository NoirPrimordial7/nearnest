
// Import Firebase modules (v9 modular SDK)
import { initializeApp, getApp, getApps } from "firebase/app";
import { 
  getAuth, onAuthStateChanged, GoogleAuthProvider,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, sendPasswordResetEmail, updateProfile,
  signInWithPopup, sendEmailVerification, reload 
} from "firebase/auth";
import { 
  getFirestore, collection, doc, getDoc, setDoc, updateDoc, 
  addDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, getDocs, serverTimestamp 
} from "firebase/firestore";
import { 
  getStorage, ref, uploadBytes, getDownloadURL, deleteObject 
} from "firebase/storage";

// Your Firebase project configuration (from Vite env variables)
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, // optional
};

// Initialize Firebase app (use existing app if already initialized to avoid duplicates)
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app, "gs://nearnest-platform.firebasestorage.app");

// Set up Google sign-in provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });  // always prompt account selection

// Export Firebase utilities for convenient import in other modules
export {
  // Auth functions:
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  sendEmailVerification,
  reload,
  // Firestore functions:
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  // Storage functions:
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  
};
