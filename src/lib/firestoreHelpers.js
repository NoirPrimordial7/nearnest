import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../pages/Auth/firebase";

/**
 * Subscribes to a top-level collection filtered by ownerId == uid.
 */
export function onOwnedCollection(colName, uid, next, error, extraWhere = []) {
  const base = [where("ownerId", "==", uid)];
  const q = query(collection(db, colName), ...(extraWhere.length ? extraWhere : base));
  return onSnapshot(q, next, error);
}

/**
 * Subscribes to docs where visibleTo array contains the user's uid.
 */
export function onVisibleToCollection(colName, uid, next, error, extraWhere = []) {
  const q = query(
    collection(db, colName),
    where("visibleTo", "array-contains", uid),
    ...(extraWhere || [])
  );
  return onSnapshot(q, next, error);
}
