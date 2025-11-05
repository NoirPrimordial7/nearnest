// src/services/stores.js
import { db } from "../firebase/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

/**
 * Listen to stores visible to a user.
 * Expects documents in "stores" to have either:
 *  - ownerId: <uid> OR
 *  - members: { <uid>: true } OR an array "memberUids" containing <uid>
 */
export function listenUserStores(uid, setStores, setError) {
  // try a permissive query (adjust to your schema)
  const storesCol = collection(db, "stores");
  const q = query(storesCol, where("visibleTo", "array-contains", uid)); // if you use array
  // If you use ownerId / members instead, change the query to match your schema.

  const unsub = onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setStores(rows);
    },
    (err) => {
      console.error("listenUserStores:", err);
      setError?.(err);
      // fall back to empty to avoid a forever loader
      setStores([]);
    }
  );

  return unsub;
}
