// src/services/stores.js
import { db, storage } from "../firebase/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

/** -----------------------------------------------------------------------
 * Helpers
 * --------------------------------------------------------------------- */
function trimOrEmpty(v) {
  return typeof v === "string" ? v.trim() : "";
}

function normalizeAddress(addr = {}) {
  return {
    line1: trimOrEmpty(addr.line1),
    city: trimOrEmpty(addr.city),
    state: trimOrEmpty(addr.state),
    pin: trimOrEmpty(addr.pin),
    country: addr.country || "IN",
    // Optional richer fields (filled when using the LocationPicker)
    formatted: addr.formatted || null,
    placeId: addr.placeId || null,
  };
}

/** Build a quick Google Maps link for a lat/lng pair (handy in admin). */
function mapsLink(geo) {
  if (!geo?.lat || !geo?.lng) return null;
  return `https://www.google.com/maps/search/?api=1&query=${geo.lat},${geo.lng}`;
}

/** -----------------------------------------------------------------------
 * Create / Read / Update store
 * --------------------------------------------------------------------- */

/**
 * Create a store document in Draft state.
 * - Owner is added as a member and to membersList for array-contains queries.
 * - Address may include formatted/placeId if using LocationPicker.
 * - Geo saves lat/lng if provided; mapsLink is stored for convenience.
 */
export async function createStore(uid, form) {
  const addr = normalizeAddress(form.address);
  const residence = normalizeAddress(form.ownerAddr || form.ownerResidence);

  const geo =
    form.geo && form.geo.lat != null && form.geo.lng != null
      ? { lat: Number(form.geo.lat), lng: Number(form.geo.lng) }
      : null;

  const payload = {
    ownerId: uid,
    members: { [uid]: true },
    membersList: [uid], // enables array-contains membership queries
    visibleTo: [],

    // Basic store info
    name: trimOrEmpty(form.name),
    category: form.category || "Pharmacy",
    phone: trimOrEmpty(form.phone),
    gstin: trimOrEmpty(form.gstin) || null,
    licenseNo: trimOrEmpty(form.licenseNo),
    hours: trimOrEmpty(form.hours) || null,

    // Addresses
    address: addr,
    ownerResidence: residence,

    // Location
    geo,
    mapsLink: mapsLink(geo),

    // Workflow
    verificationStatus: "Draft", // becomes "Pending" on submit
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const refDoc = await addDoc(collection(db, "stores"), payload);
  return refDoc.id;
}

/** Read a single store by id. */
export async function getStore(id) {
  const d = await getDoc(doc(db, "stores", id));
  return d.exists() ? { id: d.id, ...d.data() } : null;
}

/**
 * Update a store (merge patch).
 * Useful for "Back & Edit" flow on the form or for saving drafts.
 */
export async function updateStore(storeId, patch) {
  const refStore = doc(db, "stores", storeId);

  const toUpdate = { ...patch, updatedAt: serverTimestamp() };

  // Normalize nested chunks when present
  if (patch?.address) toUpdate.address = normalizeAddress(patch.address);
  if (patch?.ownerAddr || patch?.ownerResidence) {
    toUpdate.ownerResidence = normalizeAddress(
      patch.ownerAddr || patch.ownerResidence
    );
  }
  if (patch?.geo && patch.geo.lat != null && patch.geo.lng != null) {
    const geo = { lat: Number(patch.geo.lat), lng: Number(patch.geo.lng) };
    toUpdate.geo = geo;
    toUpdate.mapsLink = mapsLink(geo);
  }

  await updateDoc(refStore, toUpdate);
}

/** Mark store as submitted for verification (transitions Draft -> Pending). */
export async function submitStoreForVerification(storeId, uid) {
  const refStore = doc(db, "stores", storeId);
  await updateDoc(refStore, {
    verificationStatus: "Pending",
    submittedBy: uid,
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/** Optional helper to revert back to Draft (e.g., after admin requests changes). */
export async function reopenDraft(storeId) {
  await updateDoc(doc(db, "stores", storeId), {
    verificationStatus: "Draft",
    updatedAt: serverTimestamp(),
  });
}

/** -----------------------------------------------------------------------
 * Lists / listeners
 * --------------------------------------------------------------------- */

/**
 * Listen to stores the user can access.
 * We combine:
 *  - ownerId == uid
 *  - membersList array-contains uid   (requires membersList field)
 */
export function listenUserStores(uid, cb, onErr) {
  const colRef = collection(db, "stores");

  const qOwner = query(colRef, where("ownerId", "==", uid), orderBy("createdAt", "desc"));
  const qMember = query(colRef, where("membersList", "array-contains", uid), orderBy("createdAt", "desc"));

  let current = new Map();

  function emit() {
    cb(Array.from(current.values()).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
  }

  const unsubOwner = onSnapshot(
    qOwner,
    (snap) => {
      snap.docChanges().forEach((chg) => {
        const v = { id: chg.doc.id, ...chg.doc.data() };
        if (chg.type === "removed") current.delete(chg.doc.id);
        else current.set(chg.doc.id, v);
      });
      emit();
    },
    onErr
  );

  const unsubMember = onSnapshot(
    qMember,
    (snap) => {
      snap.docChanges().forEach((chg) => {
        const v = { id: chg.doc.id, ...chg.doc.data() };
        if (chg.type === "removed") current.delete(chg.doc.id);
        else current.set(chg.doc.id, v);
      });
      emit();
    },
    onErr
  );

  return () => {
    unsubOwner();
    unsubMember();
  };
}

/** -----------------------------------------------------------------------
 * Documents (legacy generic upload still used in a few places)
 * For the new verification flow, prefer src/services/verification.js
 * --------------------------------------------------------------------- */

/** Upload a document into stores/{storeId}/documents with a generated id. */
export async function uploadStoreDocument(storeId, file, kind = "generic") {
  const safeName = (file?.name || "document").replace(/[^\w.\-]+/g, "_");
  const path = `storeDocs/${storeId}/${Date.now()}-${safeName}`;

  const r = ref(storage, path);
  await uploadBytes(r, file, {
    contentType: file.type || "application/octet-stream",
  });
  const url = await getDownloadURL(r);

  const sub = doc(collection(db, "stores", storeId, "documents"));
  await setDoc(sub, {
    kind,
    name: safeName,
    path,
    url,
    status: "Pending",
    uploadedAt: serverTimestamp(),
    uploadedBy: "owner",
  });

  return { url, path, id: sub.id };
}

/** Delete a previously uploaded document (both storage object and Firestore). */
export async function deleteStoreDocument(storeId, docId, pathInBucket) {
  if (pathInBucket) {
    await deleteObject(ref(storage, pathInBucket)).catch(() => {});
  }
  await deleteDoc(doc(db, "stores", storeId, "documents", docId));
}
