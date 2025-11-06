import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase";

/**
 * Subscribes to a top-level collection for the current user.
 * Reads docs where ownerId == uid OR visibleTo contains uid.
 * Pass `extraWhere` if you want to add more filters.
 */
export function onOwnedCollection(colName, uid, next, error, extraWhere = []) {
  const base = [where("ownerId", "==", uid)];
  // You can’t OR in Firestore rules; do a second listener if you need visibleTo too.
  const q = query(collection(db, colName), ...(extraWhere.length ? extraWhere : base));
  return onSnapshot(q, next, error);
}

/**
 * Optional: a second listener to also get docs where visibleTo contains the user.
 * Merge the results client-side if you need both.
 */
export function onVisibleToCollection(colName, uid, next, error, extraWhere = []) {
  const q = query(
    collection(db, colName),
    where("visibleTo", "array-contains", uid),
    ...(extraWhere || [])
  );
  return onSnapshot(q, next, error);
}
