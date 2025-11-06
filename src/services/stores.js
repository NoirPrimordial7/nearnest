// src/services/stores.js
import { db } from "../firebase/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

/**
 * Create a store (owner = uid).
 * We also write `allMemberIds: [uid]` so we can query "owner OR member" with a single array-contains filter.
 */
export async function createStore(uid, form) {
  const payload = {
    ownerId: uid,
    members: { [uid]: true },            // owner is a member
    visibleTo: [],                       // future use
    allMemberIds: [uid],                 // <— important for querying

    // Basic info
    name: (form.name || "").trim(),
    phone: form.phone || "",
    category: form.category || "Pharmacy",
    gstin: form.gstin || null,
    licenseNo: form.licenseNo || "",
    hours: form.hours || null,

    // Store address
    address: {
      line1: (form.address?.line1 || "").trim(),
      city: (form.address?.city || "").trim(),
      state: (form.address?.state || "").trim(),
      pin: (form.address?.pin || "").trim(),
      country: form.address?.country || "IN",
    },

    // Owner residence (often required in KYC)
    ownerResidence: {
      line1: (form.ownerAddr?.line1 || "").trim(),
      city: (form.ownerAddr?.city || "").trim(),
      state: (form.ownerAddr?.state || "").trim(),
      pin: (form.ownerAddr?.pin || "").trim(),
      country: form.ownerAddr?.country || "IN",
    },

    // Map location (optional)
    geo: form.geo
      ? { lat: Number(form.geo.lat), lng: Number(form.geo.lng) }
      : null,

    verificationStatus: "Pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, "stores"), payload);
  return ref.id;
}

/**
 * Live list of stores visible to a user (owner or member).
 * Uses `allMemberIds` for a single efficient query.
 */
export function listenUserStores(uid, cb, onErr) {
  const q = query(
    collection(db, "stores"),
    where("allMemberIds", "array-contains", uid),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onErr
  );
}

/** Read a single store by id */
export async function getStore(id) {
  const s = await getDoc(doc(db, "stores", id));
  return s.exists() ? { id: s.id, ...s.data() } : null;
}
