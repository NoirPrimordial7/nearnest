import { db } from "../firebase/firebase";
import {
  collection, doc, getDoc, onSnapshot, query, where,
} from "firebase/firestore";

/**
 * Listen to stores visible to a user:
 *  - ownerId == uid
 *  - members.<uid> == true (map-style membership)
 * If user is admin (users/{uid}.roles includes 'admin'), read all stores.
 * Returns unsubscribe.
 */
export async function listenUserStores(uid, onData, onError) {
  if (!uid) return () => {};

  // Admin check
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

  // Shared via map membership
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

  // If you also keep an ARRAY variant, uncomment:
  // const qSharedArr = query(collection(db, "stores"), where("members", "array-contains", uid));
  // unsubs.push(onSnapshot(qSharedArr, snap => emitMerge(snap.docs.map(d => ({ id:d.id, ...d.data()}))), err => onError?.(err)));

  return () => unsubs.forEach((u) => u && u());
}
