import { useEffect, useState } from "react";
import { auth, db, storage } from "../firebase/firebase"; // << correct path
import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// read once
export async function getProfile(uid) {
  const snap = await getDoc(doc(db, "profiles", uid));
  return snap.exists() ? snap.data() : null;
}

// live hook
export function useProfile(uid) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "profiles", uid), (d) => {
      setData(d.exists() ? d.data() : null);
      setLoading(false);
    });
    return () => unsub && unsub();
  }, [uid]);
  return { data, loading };
}

// used by RequireProfile
export function useProfileComplete() {
  const u = auth.currentUser;
  const { data, loading } = useProfile(u?.uid || null);
  const isComplete =
    !!data &&
    !!data.fullName &&
    !!data.age &&
    !!data.gender &&
    !!data.phone; // adjust to your rules
  return { isComplete, loading };
}

// save profile with optional photo upload
export async function saveProfile({ fullName, age, phone, gender, file }) {
  const u = auth.currentUser;
  if (!u) throw new Error("Not signed in");

  let photoURL = null;
  if (file) {
    const r = ref(storage, `profilePhotos/${u.uid}.jpg`);
    await uploadBytes(r, file);
    photoURL = await getDownloadURL(r);
  }

  await setDoc(
    doc(db, "profiles", u.uid),
    {
      fullName: fullName?.trim() || "",
      age: Number(age) || null,
      phone: phone?.trim() || "",
      gender: gender || "",
      photoURL: photoURL ?? null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
