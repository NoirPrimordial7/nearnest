// src/services/userProfile.js
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase"; // <- keep this path (you deleted the old src/firebase.js)

const COLL = "users";

/**
 * Read minimal user profile stored at /users/{uid}
 * Returns null if doc doesn't exist.
 */
export async function getUserProfile(uid) {
  if (!uid) throw new Error("getUserProfile: uid is required");
  const ref = doc(db, COLL, uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

/**
 * Create or update profile at /users/{uid}.
 * Uses merge so you can save partial updates.
 */
export async function saveUserProfile(uid, data) {
  if (!uid) throw new Error("saveUserProfile: uid is required");
  const ref = doc(db, COLL, uid);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
    // you can stamp a minimal displayName for header/avatar fallback
    displayName:
      data?.displayName ||
      [data?.firstName, data?.lastName].filter(Boolean).join(" ") ||
      data?.name ||
      "",
  };
  await setDoc(ref, payload, { merge: true });
  return true;
}
