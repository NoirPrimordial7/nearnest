/*// src/services/userProfile.js
import { db, storage, auth } from "../firebase/firebase";
import {
  doc, getDoc, setDoc, serverTimestamp,
} from "firebase/firestore";
import {
  ref, uploadBytes, getDownloadURL,
} from "firebase/storage";
import { useEffect, useState } from "react";
import { updateProfile as updateAuthProfile } from "firebase/auth";

const userDocRef = (uid) => doc(db, "users", uid);
const genUserId = () =>
  "NRN-" + Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);

export async function uploadAvatar(uid, file) {
  const ext = (file.name?.split(".").pop() || "jpg").toLowerCase();
  const path = `users/${uid}/avatar.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const url = await getDownloadURL(storageRef);
  return { url, path };
}

/**
 * saveProfile(uid, data, avatarFile?)
 * - Ensures stable userId is set once
 * - Uploads avatar if provided
 * - Stores profile in /users/{uid}
 * - Mirrors displayName/photoURL to Firebase Auth user
 *//*
export async function saveProfile(uid, data, avatarFile) {
  const snap = await getDoc(userDocRef(uid));
  let existing = snap.exists() ? snap.data() : {};
  let userId = existing.userId || genUserId();
  let photoURL = existing.photoURL || null;

  if (avatarFile) {
    const uploaded = await uploadAvatar(uid, avatarFile);
    photoURL = uploaded.url;
  }

  const payload = {
    ...existing,
    ...data,
    userId,
    photoURL,
    updatedAt: serverTimestamp(),
    createdAt: existing.createdAt || serverTimestamp(),
  };

  await setDoc(userDocRef(uid), payload, { merge: true });

  // Mirror to Firebase Auth profile
  if (auth.currentUser) {
    try {
      await updateAuthProfile(auth.currentUser, {
        displayName: data.fullName || auth.currentUser.displayName || "",
        photoURL: photoURL || auth.currentUser.photoURL || null,
      });
    } catch (e) {
      // don't block on this
      console.warn("Auth profile update skipped:", e?.message);
    }
  }

  return payload;
}

export async function getProfile(uid) {
  const snap = await getDoc(userDocRef(uid));
  return snap.exists() ? snap.data() : null;
}

export function useProfileComplete(uid) {
  const [loading, setLoading] = useState(true);
  const [complete, setComplete] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!uid) {
        setLoading(false);
        setComplete(false);
        return;
      }
      const p = await getProfile(uid);
      if (cancelled) return;
      setProfile(p);
      setComplete(Boolean(p?.fullName && p?.age));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [uid]);

  return { loading, complete, profile };
} */

  // src/services/userProfile.js
import { db, storage } from "../firebase/firebase";
import {
  doc, getDoc, setDoc, serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useEffect, useState } from "react";

export async function getProfile(uid) {
  const d = await getDoc(doc(db, "users", uid));
  return d.exists() ? d.data() : null;
}

export async function saveUserProfile(uid, values, file) {
  let photoURL = values.photoURL || null;

  if (file) {
    const r = ref(storage, `users/${uid}/avatar_${Date.now()}`);
    const snap = await uploadBytes(r, file);
    photoURL = await getDownloadURL(snap.ref);
  }

  const body = {
    fullName: values.fullName || "",
    age: values.age || "",
    phone: values.phone || "",
    gender: values.gender || "",
    photoURL: photoURL || null,
    profileComplete: Boolean(values.fullName && values.age),
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(), // first write only; Firestore keeps last one
  };

  await setDoc(doc(db, "users", uid), body, { merge: true });
  return body;
}

/** small hook to gate pages on profile completion */
export function useProfileComplete(uid) {
  const [state, setState] = useState({ loading: true, complete: false });

  useEffect(() => {
    if (!uid) { setState({ loading: false, complete: false }); return; }
    const unsub = onSnapshot(doc(db, "users", uid), (d) => {
      const data = d.exists() ? d.data() : null;
      setState({ loading: false, complete: !!(data && data.profileComplete) });
    });
    return unsub;
  }, [uid]);

  return state; // {loading, complete}
}
