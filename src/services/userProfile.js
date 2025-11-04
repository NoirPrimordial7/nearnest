// src/services/userProfile.js
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";

const COLL = "users";

export async function getUserProfile(uid) {
  if (!uid) throw new Error("getUserProfile: uid is required");
  const ref = doc(db, COLL, uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function saveUserProfile(uid, data) {
  if (!uid) throw new Error("saveUserProfile: uid is required");
  const ref = doc(db, COLL, uid);
  const payload = {
    ...data,
    displayName:
      data?.displayName ||
      [data?.firstName, data?.lastName].filter(Boolean).join(" ") ||
      data?.name ||
      "",
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, payload, { merge: true });
  return true;
}

/* --- Aliases so existing imports don't break --- */
export { getUserProfile as getProfile };
export { saveUserProfile as setProfile };
