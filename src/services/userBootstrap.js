import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase"; // make sure you export db from your firebase.js

export async function ensureUserDoc(user) {
  if (!user) return;
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email || "",
      displayName: user.displayName || "",
      defaultRole: "user",
      admin: false,
      status: "active",
      createdAt: serverTimestamp(),
    });
  }
}
