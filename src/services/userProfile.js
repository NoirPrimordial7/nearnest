// src/services/userProfile.js
import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";

// We'll store profile on the same /users/{uid} doc
const COLL = "users";

/** Read full profile */
export async function getProfile(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, COLL, uid));
  return snap.exists() ? snap.data() : null;
}

/** Minimal completeness check — tune required fields as you like */
export function isProfileComplete(profile) {
  const required = ["fullName", "age"]; // add more: "phone", "gender", etc.
  return required.every((k) => profile?.[k]);
}

/** Upsert profile fields */
export async function saveProfile(uid, data) {
  if (!uid) throw new Error("saveProfile: missing uid");
  const ref = doc(db, COLL, uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { ...data });
  } else {
    await setDoc(ref, { ...data, createdAt: Date.now() });
  }
  return true;
}

// Aliases (for older imports you might have used earlier)
export const getUserProfile = getProfile;
export const saveUserProfile = saveProfile;

/** React hook: live completeness status + profile */
export function useProfileComplete(uid) {
  const [state, setState] = useState({
    loading: true,
    complete: false,
    profile: null,
    exists: false,
  });

  useEffect(() => {
    if (!uid) {
      setState({ loading: false, complete: false, profile: null, exists: false });
      return;
    }
    const ref = doc(db, COLL, uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data() || null;
        setState({
          loading: false,
          complete: isProfileComplete(data),
          profile: data,
          exists: snap.exists(),
        });
      },
      (err) => {
        console.error("useProfileComplete onSnapshot error:", err);
        setState((s) => ({ ...s, loading: false }));
      }
    );
    return () => unsub();
  }, [uid]);

  return state;
}
