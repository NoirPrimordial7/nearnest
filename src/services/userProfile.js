// src/services/userProfile.js
import { useEffect, useState } from "react";
import { db, storage } from "../firebase/firebase";
import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/** One-shot read of the signed-in user's profile */
export async function getProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

/** Live listener for the signed-in user's profile */
export function onProfile(uid, cb, onError) {
  if (!uid) return () => {};
  const d = doc(db, "users", uid);
  return onSnapshot(
    d,
    (snap) => cb(snap.exists() ? snap.data() : null),
    (err) => {
      console.error("onProfile() error:", err);
      onError?.(err);
      cb(null); // ensure UI doesn't freeze on loader
    }
  );
}

/** Create/merge profile; optionally upload avatar to Storage and store photoURL */
export async function saveProfile(uid, data, avatarFile) {
  if (!uid) throw new Error("saveProfile: missing uid");

  let photoURL = data?.photoURL || null;

  if (avatarFile) {
    const path = `avatars/${uid}/${Date.now()}-${avatarFile.name}`;
    const r = ref(storage, path);
    await uploadBytes(r, avatarFile);
    photoURL = await getDownloadURL(r);
  }

  const payload = {
    ...data,
    ...(photoURL ? { photoURL } : {}),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, "users", uid), payload, { merge: true });
  return payload;
}

/** Hook: tell if the user's profile doc exists (and surface rule errors) */
export function useProfileComplete(uid) {
  const [state, setState] = useState({
    loading: true,
    exists: false,
    data: null,
    error: null,
  });

  useEffect(() => {
    if (!uid) {
      setState((s) => ({ ...s, loading: false, exists: false }));
      return;
    }
    const unsub = onProfile(
      uid,
      (data) =>
        setState({
          loading: false,
          exists: !!data,
          data: data || null,
          error: null,
        }),
      (err) =>
        setState({
          loading: false,
          exists: false,
          data: null,
          error: err,
        })
    );
    return unsub;
  }, [uid]);

  return state;
}
