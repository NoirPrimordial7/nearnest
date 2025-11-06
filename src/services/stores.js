// src/services/stores.js
import { db } from "../firebase/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  serverTimestamp,
  where,
} from "firebase/firestore";

/** ---------- single-store helpers ---------- */

/** Get a single store (throws if not found). */
export async function getStore(storeId) {
  if (!storeId) throw new Error("storeId required");
  const ref = doc(db, "stores", storeId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const err = new Error("store-not-found");
    err.code = "not-found";
    throw err;
  }
  return { id: snap.id, ...snap.data() };
}

/** Live-listen to one store. Returns unsubscribe. */
export function listenStore(storeId, onData, onError) {
  if (!storeId) return () => {};
  const ref = doc(db, "stores", storeId);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onError?.(Object.assign(new Error("store-not-found"), { code: "not-found" }));
        return;
      }
      onData({ id: snap.id, ...snap.data() });
    },
    (err) => onError?.(err)
  );
}

/**
 * Submit a store for verification.
 * Sets a status and audit fields; safe to re-run (merge).
 * Status vocabulary used across the app: Pending | Approved | Rejected
 */
export async function submitStoreForVerification(storeId, uid) {
  if (!storeId || !uid) throw new Error("storeId and uid required");
  const ref = doc(db, "stores", storeId);
  await setDoc(
    ref,
    {
      verificationStatus: "Pending",
      submittedBy: uid,
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/** ---------- user-scoped listing ---------- */

/**
 * Listen to stores visible to a user:
 *  - ownerId == uid
 *  - members.<uid> == true (map-style membership)
 * If user is admin (users/{uid}.roles includes 'admin'), reads all stores.
 * onData receives either full array (admin) or merged array (non-admin).
 */
export async function listenUserStores(uid, onData, onError) {
  if (!uid) return () => {};

  // Admin check via users/{uid}.roles
  let isAdmin = false;
  try {
    const uSnap = await getDoc(doc(db, "users", uid));
    const uData = uSnap.exists() ? uSnap.data() : {};
    isAdmin = Array.isArray(uData.roles) && uData.roles.includes("admin");
  } catch {
    isAdmin = false;
  }

  const unsubs = [];
  const emitMerge = (incoming) =>
    onData((prev = []) => {
      const map = new Map(prev.map((p) => [p.id, p]));
      for (const it of incoming) map.set(it.id, it);
      return Array.from(map.values());
    });

  if (isAdmin) {
    // Admin: whole collection
    const qAll = collection(db, "stores");
    unsubs.push(
      onSnapshot(
        qAll,
        (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => onError?.(err)
      )
    );
    return () => unsubs.forEach((u) => u && u());
  }

  // Owned
  const qOwned = query(collection(db, "stores"), where("ownerId", "==", uid));
  unsubs.push(
    onSnapshot(
      qOwned,
      (snap) => emitMerge(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => onError?.(err)
    )
  );

  // Shared via map membership (members.<uid> == true)
  const qSharedMap = query(
    collection(db, "stores"),
    where(`members.${uid}`, "==", true)
  );
  unsubs.push(
    onSnapshot(
      qSharedMap,
      (snap) => emitMerge(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => onError?.(err)
    )
  );

  // If you also keep an ARRAY variant for members, you can add:
  // const qSharedArr = query(collection(db, "stores"), where("members", "array-contains", uid));
  // unsubs.push(onSnapshot(qSharedArr, (snap) => emitMerge(snap.docs.map(d => ({ id:d.id, ...d.data() }))), (err) => onError?.(err)));

  return () => unsubs.forEach((u) => u && u());
}
