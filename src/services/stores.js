// src/services/stores.js
import { db } from "../firebase/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

export function listenUserStores(uid, cb) {
  const q = query(collection(db, "stores"), where("members", "array-contains", uid));
  const unsub = onSnapshot(q, (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    cb(items);
  });
  return unsub;
}
