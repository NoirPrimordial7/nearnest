// src/services/stores.js
import { db, storage } from "../firebase/firebase";
import {
  addDoc, collection, doc, getDoc, onSnapshot, orderBy, query,
  serverTimestamp, setDoc, updateDoc, where
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

/* Create a store */
export async function createStore(uid, form) {
  const payload = {
    ownerId: uid,
    members: { [uid]: true },
    visibleTo: [],
    name: (form.name || "").trim(),
    address: {
      line1: form.address?.line1?.trim() || "",
      city:  form.address?.city?.trim()  || "",
      state: form.address?.state?.trim() || "",
      pin:   form.address?.pin?.trim()   || "",
      country: form.address?.country || "IN",
    },
    ownerResidence: {
      line1: form.ownerAddr?.line1?.trim() || "",
      city:  form.ownerAddr?.city?.trim()  || "",
      state: form.ownerAddr?.state?.trim() || "",
      pin:   form.ownerAddr?.pin?.trim()   || "",
      country: form.ownerAddr?.country || "IN",
    },
    phone: form.phone || "",
    category: form.category || "Pharmacy",
    gstin: form.gstin || null,
    licenseNo: form.licenseNo || "",
    hours: form.hours || null,
    geo: form.geo ? { lat: Number(form.geo.lat), lng: Number(form.geo.lng) } : null,
    verificationStatus: "Draft",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const col = collection(db, "stores");
  const refDoc = await addDoc(col, payload);
  return refDoc.id;
}

/* Live list of a user's stores (owner) */
export function listenUserStores(uid, cb, onErr) {
  const col = collection(db, "stores");
  const q = query(col, where("ownerId", "==", uid));
  const unsub = onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, onErr);
  return () => unsub();
}

/* Read one store */
export async function getStore(id) {
  const d = await getDoc(doc(db, "stores", id));
  return d.exists() ? { id: d.id, ...d.data() } : null;
}

/* Upload a generic doc (older API still used elsewhere) */
export async function uploadStoreDocument(storeId, file, kind = "generic") {
  const path = `storeDocs/${storeId}/${Date.now()}-${file.name}`;
  const r = ref(storage, path);
  await uploadBytes(r, file, { contentType: file.type || "application/octet-stream" });
  const url = await getDownloadURL(r);

  const sub = doc(collection(db, "stores", storeId, "documents"));
  await setDoc(sub, {
    kind, path, url,
    uploadedAt: serverTimestamp(),
    uploadedBy: "owner",
    status: "Pending",
  });

  return { url, path, id: sub.id };
}

/* Mark store as submitted for verification */
export async function submitStoreForVerification(storeId, uid) {
  const refStore = doc(db, "stores", storeId);
  await updateDoc(refStore, {
    verificationStatus: "Pending",
    submittedBy: uid,
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
