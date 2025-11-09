// src/services/userProfile.js
import { useEffect, useState } from "react";
import {
  db,
  storage,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  serverTimestamp,
  ref,
  uploadBytes,
  getDownloadURL,
} from "../Auth/firebase";

/** One-shot read of the signed-in user's profile (Firestore) */
export async function getProfile(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

/** Live listener for the signed-in user's profile (Firestore) */
export function onProfile(uid, cb, onError) {
  if (!uid) return () => {};
  const d = doc(db, "users", uid);
  return onSnapshot(
    d,
    (snap) => cb(snap.exists() ? snap.data() : null),
    (err) => {
      console.error("onProfile() error:", err);
      onError?.(err);
      cb(null);
    }
  );
}

/**
 * Create/merge profile; optionally upload avatar to Storage and store URLs.
 * - Saves both profile.avatarUrl and top-level photoURL for convenience.
 * - Sets createdAt on first write; always updates updatedAt.
 * Returns: { photoURL, data } (data = merged user doc)
 */
export async function saveProfile(uid, profile, avatarFile) {
  if (!uid) throw new Error("saveProfile: missing uid");

  const userRef = doc(db, "users", uid);
  const prev = await getDoc(userRef);
  const now = serverTimestamp();

  // 1) Upload avatar if provided
  let uploadedPhotoURL = null;
  if (avatarFile) {
    const safeName = (avatarFile.name || "avatar.png").replace(/[^\w.\-]+/g, "_");
    const path = `avatars/${uid}/${Date.now()}-${safeName}`;
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, avatarFile, {
      contentType: avatarFile.type || "image/*",
    });
    uploadedPhotoURL = await getDownloadURL(fileRef);
  }

  // 2) Build merged document
  const ageNum =
    typeof profile?.age === "number"
      ? profile.age
      : Number.parseInt(profile?.age || "0", 10) || null;

  const baseUpdate = {
    role: "user",
    roles: ["user"],
    hasProfile: true,
    profile: {
      fullName: (profile?.fullName || "").trim(),
      age: ageNum,
      phone: (profile?.phone || "").trim(),
      gender: profile?.gender || null,
      ...(uploadedPhotoURL ? { avatarUrl: uploadedPhotoURL } : {}),
    },
    ...(uploadedPhotoURL ? { photoURL: uploadedPhotoURL } : {}),
    updatedAt: now,
  };

  // 3) Write doc (set createdAt on first creation)
  if (prev.exists()) {
    await updateDoc(userRef, baseUpdate);
  } else {
    await setDoc(userRef, { ...baseUpdate, createdAt: now });
  }

  // 4) Return the fresh doc
  const fresh = await getDoc(userRef);
  return {
    photoURL: uploadedPhotoURL || fresh.data()?.photoURL || null,
    data: fresh.data(),
  };
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
      setState((s) => ({ ...s, loading: false, exists: false, data: null }));
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
