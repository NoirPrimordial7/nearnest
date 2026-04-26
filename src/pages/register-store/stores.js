// src/pages/register-store/stores.js
import {
  db,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  orderBy,
  limit,
} from "../Auth/firebase";
import { FieldPath as FirestoreFieldPath } from "firebase/firestore";

/* -------------------- helpers -------------------- */
function toArrayMaybe(v) {
  if (Array.isArray(v)) return v;
  if (v && typeof v === "object") return Object.keys(v);
  return [];
}

function ensureAddressShape(a) {
  if (!a || typeof a !== "object") {
    return { line1: "", city: "", state: "", pin: "", country: "IN" };
  }
  return {
    line1: a.line1 || "",
    city: a.city || "",
    state: a.state || "",
    pin: a.pin || "",
    country: a.country || "IN",
  };
}

function docToStore(snap) {
  const data = snap.data() || {};
  const membersMap =
    data.members && typeof data.members === "object" ? data.members : {};
  const membersArr = Array.isArray(data.membersArr)
    ? data.membersArr
    : toArrayMaybe(membersMap);

  return {
    id: snap.id,
    ...data,
    address: ensureAddressShape(data.address),
    ownerAddr: ensureAddressShape(data.ownerAddr),
    members: membersMap,
    membersArr,
    verificationStatus: data.verificationStatus || "Pending",
  };
}

export function storeBucket(status) {
  const s = (status || "").toLowerCase();
  return s === "approved" || s === "verified" ? "verified" : "under";
}

function isDevMode() {
  return Boolean(import.meta.env?.DEV);
}

function logStoreAccessDebug(uid, email, counts) {
  if (!isDevMode()) return;
  console.info("[UserHome] store access query counts", {
    uid,
    email: email || null,
    ...counts,
  });
}

function getMembersMapFieldPath(uid) {
  try {
    return new FirestoreFieldPath("members", uid);
  } catch (error) {
    if (isDevMode()) {
      console.warn("[UserHome] skipping members map query for unsafe uid field path", {
        uid,
        error,
      });
    }
    return null;
  }
}

async function isAdmin(uid) {
  try {
    const s = await getDoc(doc(db, "users", uid));
    if (!s.exists()) return false;
    const d = s.data() || {};
    const roles = Array.isArray(d.roles) ? d.roles : [];
    return d.role === "admin" || roles.includes("admin");
  } catch {
    return false;
  }
}

/* -------------------- CRUD -------------------- */

/**
 * Create a new store.
 * Accepts either:
 *   createStore(ownerUid, data)
 * or createStore({ ownerId, ...data })
 */
export async function createStore(ownerOrObj, maybeData = {}) {
  const normalized =
    typeof ownerOrObj === "string"
      ? { ownerId: ownerOrObj, ...(maybeData || {}) }
      : { ...(ownerOrObj || {}) };

  const ownerId = normalized.ownerId;
  if (!ownerId) throw new Error("ownerId is required");

  // always include owner in both structures
  const membersMapBase =
    normalized.members && typeof normalized.members === "object"
      ? normalized.members
      : {};
  const membersMap = { ...membersMapBase, [ownerId]: true };

  const rawArr = Array.isArray(normalized.membersArr)
    ? normalized.membersArr
    : Object.keys(membersMap);
  const membersArr = Array.from(new Set([ownerId, ...rawArr]));

  const payload = {
    name: normalized.name || "",
    phone: normalized.phone || "",
    licenseNo: normalized.licenseNo || "",
    address: ensureAddressShape(normalized.address),
    ownerAddr: ensureAddressShape(normalized.ownerAddr),
    formatted: normalized.formatted || null,
    placeId: normalized.placeId || null,
    geo:
      normalized.geo && typeof normalized.geo === "object"
        ? {
            lat:
              normalized.geo.lat === "" || normalized.geo.lat == null
                ? null
                : Number(normalized.geo.lat),
            lng:
              normalized.geo.lng === "" || normalized.geo.lng == null
                ? null
                : Number(normalized.geo.lng),
          }
        : null,

    ownerId,
    members: membersMap,
    membersArr,

    visibleTo: normalized.visibleTo || null,
    verificationStatus: normalized.verificationStatus || "Pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, "stores"), payload);
  return ref.id;
}

export async function deleteStore(storeId) {
  await deleteDoc(doc(db, "stores", storeId));
}

export async function getStore(storeId) {
  const s = await getDoc(doc(db, "stores", storeId));
  return s.exists() ? docToStore(s) : null;
}

/**
 * Mark a store as submitted for verification.
 * Call as: submitStoreForVerification(storeId, user.uid)
 */
// src/pages/register-store/stores.js (or your stores service)
// Make sure this is in the same stores.js that Review/Status import from
export async function submitStoreForVerification(storeId, submittedBy) {
  await updateDoc(doc(db, "stores", storeId), {
    verificationStatus: "Submitted",
    submittedBy: submittedBy || null,
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}



/* -------------------- listeners -------------------- */
/**
 * Live list of stores visible to a user.
 * Returns an unsubscribe function.
 */
export async function listenUserStores(uid, onData, onError, options = {}) {
  const admin = await isAdmin(uid);

  // Admin: stream most recent stores
  if (admin) {
    const qAll = query(
      collection(db, "stores"),
      orderBy("createdAt", "desc"),
      limit(200)
    );
    return onSnapshot(qAll, (qs) => onData(qs.docs.map(docToStore)), onError);
  }

  // Non-admin: mirror the store-access fields allowed by firestore.rules.
  const qOwned = query(collection(db, "stores"), where("ownerId", "==", uid));
  const qMemberArr = query(
    collection(db, "stores"),
    where("membersArr", "array-contains", uid)
  );
  const qVisibleTo = query(
    collection(db, "stores"),
    where("visibleTo", "array-contains", uid)
  );
  const membersMapFieldPath = getMembersMapFieldPath(uid);
  const qMemberMap = membersMapFieldPath
    ? query(collection(db, "stores"), where(membersMapFieldPath, "==", true))
    : null;

  const state = {
    owned: new Map(),
    memberArr: new Map(),
    visibleTo: new Map(),
    memberMap: new Map(),
  };

  function emit() {
    const merged = new Map([
      ...state.owned,
      ...state.memberArr,
      ...state.visibleTo,
      ...state.memberMap,
    ]);
    logStoreAccessDebug(uid, options.email, {
      owned: state.owned.size,
      memberArr: state.memberArr.size,
      visibleTo: state.visibleTo.size,
      memberMap: state.memberMap.size,
      merged: merged.size,
    });
    onData(Array.from(merged.values()));
  }

  const unsubOwned = onSnapshot(
    qOwned,
    (qs) => {
      state.owned = new Map(qs.docs.map((d) => [d.id, docToStore(d)]));
      emit();
    },
    onError
  );

  const unsubMemberArr = onSnapshot(
    qMemberArr,
    (qs) => {
      state.memberArr = new Map(qs.docs.map((d) => [d.id, docToStore(d)]));
      emit();
    },
    onError
  );

  const unsubVisibleTo = onSnapshot(
    qVisibleTo,
    (qs) => {
      state.visibleTo = new Map(qs.docs.map((d) => [d.id, docToStore(d)]));
      emit();
    },
    onError
  );

  const unsubMemberMap = qMemberMap
    ? onSnapshot(
        qMemberMap,
        (qs) => {
          state.memberMap = new Map(qs.docs.map((d) => [d.id, docToStore(d)]));
          emit();
        },
        onError
      )
    : null;

  return () => {
    try { unsubOwned && unsubOwned(); } catch {}
    try { unsubMemberArr && unsubMemberArr(); } catch {}
    try { unsubVisibleTo && unsubVisibleTo(); } catch {}
    try { unsubMemberMap && unsubMemberMap(); } catch {}
  };
  
}
