// src/services/stores.js
import { db, storage } from "../firebase/firebase";
import {
  addDoc, collection, doc, getDoc, onSnapshot, orderBy, query,
  serverTimestamp, setDoc, where
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "firebase/storage";

/* Create a store (must set ownerId = uid for rules) */
export async function createStore(uid, form) {
  const payload = {
    ownerId: uid,
    members: { [uid]: true },              // owner is a member
    visibleTo: [],                         // future use
    name: form.name.trim(),
    address: {
      line1: form.address.line1.trim(),
      city: form.address.city.trim(),
      state: form.address.state.trim(),
      pin: form.address.pin.trim(),
      country: form.address.country || "IN",
    },
    ownerResidence: {
      line1: form.ownerAddr.line1.trim(),
      city: form.ownerAddr.city.trim(),
      state: form.ownerAddr.state.trim(),
      pin: form.ownerAddr.pin.trim(),
      country: form.ownerAddr.country || "IN",
    },
    phone: form.phone || "",
    category: form.category || "Pharmacy",
    gstin: form.gstin || null,
    licenseNo: form.licenseNo || "",
    hours: form.hours || null,
    geo: form.geo ? { lat: Number(form.geo.lat), lng: Number(form.geo.lng) } : null,
    verificationStatus: "Pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const col = collection(db, "stores");
  const refDoc = await addDoc(col, payload);
  return refDoc.id;
}

/* Live list of stores visible to a user (owner/member) */
export function listenUserStores(uid, cb, onErr) {
  // simple filter by owner first (most common)
  const col = collection(db, "stores");
  const q = query(col, where("ownerId", "==", uid));
  const unsubOwner = onSnapshot(q, (snap) => {
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    cb(rows);
  }, onErr);
  return () => unsubOwner();
}

/* Read single store */
export async function getStore(id) {
  const d = await getDoc(doc(db, "stores", id));
  return d.exists() ? { id: d.id, ...d.data() } : null;
}

/* ------- Documents (Storage + Firestore subcol) ------- */
export async function uploadStoreDoc(storeId, file, kind = "generic") {
  const path = `storeDocs/${storeId}/${Date.now()}-${file.name}`;
  const r = ref(storage, path);
  await uploadBytes(r, file, { contentType: file.type || "application/octet-stream" });
  const url = await getDownloadURL(r);

  const sub = doc(collection(db, "stores", storeId, "documents"));
  await setDoc(sub, {
    kind,
    path,
    url,
    uploadedAt: serverTimestamp(),
    uploadedBy: "owner",
    status: "Pending",
  });

  return { url, path, id: sub.id };
}

export async function deleteStoreDoc(pathInBucket, storeId, docId) {
  await deleteObject(ref(storage, pathInBucket));
  await setDoc(doc(db, "stores", storeId, "documents", docId), { deleted: true }, { merge: true });
}

/* Live docs list for a store */
export function listenStoreDocs(storeId, cb, onErr) {
  const col = collection(db, "stores", storeId, "documents");
  // keeping order by uploadedAt requires an index; if not created yet, Firestore UI will offer one.
  const q = query(col, orderBy("uploadedAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, onErr);
}
