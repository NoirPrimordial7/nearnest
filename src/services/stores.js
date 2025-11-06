import { db, storage } from "../firebase/firebase";
import {
  addDoc, collection, doc, getDoc, onSnapshot, orderBy, query,
  serverTimestamp, setDoc, where
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

/* Create a store (must set ownerId = uid for rules) */
export async function createStore(uid, form) {
  const payload = {
    ownerId: uid,
    members: { [uid]: true },
    visibleTo: [],
    name: (form.name || "").trim() || "Untitled store",
    address: form.address || {},
    ownerResidence: form.ownerAddr || {},
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

  const colRef = collection(db, "stores");
  const refDoc = await addDoc(colRef, payload);
  return refDoc.id;
}

/* Live list of stores visible to a user (owner/member) */
export function listenUserStores(uid, cb, onErr) {
  const colRef = collection(db, "stores");
  const q = query(colRef, where("ownerId", "==", uid));
  const unsub = onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, onErr);
  return () => unsub && unsub();
}

/* Read single store */
export async function getStore(id) {
  const d = await getDoc(doc(db, "stores", id));
  return d.exists() ? { id: d.id, ...d.data() } : null;
}

/* Upload a document for verification (Storage + Firestore subcollection) */
export async function uploadStoreDocument(storeId, file, kind = "generic") {
  const safe = (file?.name || "doc").replace(/[^\w.\-]+/g, "_");
  const path = `storeDocs/${storeId}/${Date.now()}-${safe}`;
  const r = ref(storage, path);
  await uploadBytes(r, file, { contentType: file.type || "application/octet-stream" });
  const url = await getDownloadURL(r);

  const docRef = doc(collection(db, "stores", storeId, "documents"));
  await setDoc(docRef, {
    kind,
    path,
    url,
    status: "Pending",
    uploadedBy: "owner",
    uploadedAt: serverTimestamp(),
  });

  return { id: docRef.id, path, url };
}

/* Delete a document (marks Firestore doc and removes Storage object) */
export async function deleteStoreDoc(pathInBucket, storeId, docId) {
  await deleteObject(ref(storage, pathInBucket));
  await setDoc(doc(db, "stores", storeId, "documents", docId), { deleted: true }, { merge: true });
}

/* Live docs list for a store */
export function listenStoreDocs(storeId, cb, onErr) {
  const colRef = collection(db, "stores", storeId, "documents");
  const q = query(colRef, orderBy("uploadedAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, onErr);
}
