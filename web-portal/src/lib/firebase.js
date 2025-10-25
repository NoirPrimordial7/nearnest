// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPopup,
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
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


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export {
  app,
  auth,
  db,
  googleProvider,
  RecaptchaVerifier,
  signInWithPopup,
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  
};

