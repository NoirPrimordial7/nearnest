import {
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
} from "firebase/firestore";
import { db } from "../firebase/firebase";

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

// src/services/stores.js
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
    // ... your other fields ...
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
            lat: normalized.geo.lat === "" || normalized.geo.lat == null ? null : Number(normalized.geo.lat),
            lng: normalized.geo.lng === "" || normalized.geo.lng == null ? null : Number(normalized.geo.lng),
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

export async function submitStoreForVerification(storeId, status = "Pending") {
  await updateDoc(doc(db, "stores", storeId), {
    verificationStatus: status,
    updatedAt: serverTimestamp(),
  });
}

/* -------------------- listeners -------------------- */
/**
 * Returns Promise<unsubscribe>
 */
export async function listenUserStores(uid, onData, onError) {
  const admin = await isAdmin(uid);

  // Admin: simple stream (single-field orderBy is OK)
  if (admin) {
    const qAll = query(
      collection(db, "stores"),
      orderBy("createdAt", "desc"),
      limit(200)
    );
    const unsub = onSnapshot(
      qAll,
      (qs) => onData(qs.docs.map(docToStore)),
      onError
    );
    return unsub;
  }

  // Non-admins: remove orderBy to avoid composite index requirement
  const qOwned = query(
    collection(db, "stores"),
    where("ownerId", "==", uid)
  );

  const qMember = query(
    collection(db, "stores"),
    where("membersArr", "array-contains", uid)
  );

  const state = {
    owned: new Map(),
    member: new Map(),
  };

  function emit() {
    const merged = new Map([...state.member, ...state.owned]);
    onData(Array.from(merged.values()));
  }

  const unsubs = [];

  unsubs.push(
    onSnapshot(
      qOwned,
      (qs) => {
        state.owned.clear;
        state.owned = new Map();
        
        qs.docs.forEach((d) => state.owned.set(d.id, docToStore(d)));
        emit();
      },
      onError
    )
  );

  unsubs.push(
    onSnapshot(
      qMember,
      (qs) => {
        state.member = new Map();
        state.member.clear();
        qs.docs.forEach((d) => state.member.set(d.id, docToStore(d)));
        emit();
      },
      onError
    )
  );

  return () =>
    unsubs.forEach((u) => {
      try { u && u(); } catch {}
    });
}

