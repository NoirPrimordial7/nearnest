// src/services/stores.js
import { db } from "../firebase/firebase";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

/**
 * Get a single store by id.
 * Rules will enforce whether the caller can read it (owner/member/visible/admin).
 */
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

/**
 * Listen to one store by id. Returns an unsubscribe.
 */
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
 * Listen to stores visible to a user:
 *  - ownerId == uid
 *  - members.<uid> == true (map-style membership)
 * If user is admin, read ALL stores.
 * `onData` receives the full merged array each time.
 * Returns an unsubscribe function.
 */
export async function listenUserStores(uid, onData, onError) {
  if (!uid) return () => {};

  // Check admin from users/{uid}.roles
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
    // Admin can read the whole collection per rules
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

  // Non-admin: owned stores
  const qOwned = query(collection(db, "stores"), where("ownerId", "==", uid));
  unsubs.push(
    onSnapshot(
      qOwned,
      (snap) => emitMerge(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => onError?.(err)
    )
  );

  // Non-admin: shared via members map (members.<uid> == true)
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

  // If you also store an ARRAY variant, uncomment this block and ensure rules allow it:
  // const qSharedArr = query(collection(db, "stores"), where("members", "array-contains", uid));
  // unsubs.push(onSnapshot(qSharedArr, (snap) => emitMerge(snap.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => onError?.(err)));

  return () => unsubs.forEach((u) => u && u());
}
