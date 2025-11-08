// src/services/verification.js
import { db, storage } from "../Auth/firebase";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
} from "../Auth/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "../Auth/firebase";

/** Canonical set of required docs and their friendly labels/icons */
export const KIND_META = {
  aadhaar:     { label: "Aadhaar (Owner)",                 icon: "🪪" },
  pan:         { label: "PAN (Owner)",                     icon: "🧾" },
  property:    { label: "Rent Agreement / Property Proof", icon: "🏠" },
  drugLicense: { label: "Drug License",                    icon: "💊" },
  storePhoto:  { label: "Store Photo (front view)",        icon: "🏪" },
  other:       { label: "Supporting document",             icon: "📎" },
};
export const REQUIRED_KINDS = ["aadhaar","pan","property","drugLicense","storePhoto"];

/** Upload (replace for required kinds; append for "other"). */
export async function uploadVerificationDoc(uid, storeId, file, kind = "other") {
  const safeName = (file?.name || "document").replace(/[^\w.\-]+/g, "_");
  const isRequired = REQUIRED_KINDS.includes(kind);
  const docId = isRequired ? kind : `other-${Date.now()}`;
  const storagePath = `storeDocs/${storeId}/${docId}-${safeName}`;

  const r = ref(storage, storagePath);
  await uploadBytes(r, file, { contentType: file.type || "application/octet-stream" });
  const url = await getDownloadURL(r);

  const meta = KIND_META[kind] || KIND_META.other;

  await setDoc(
    doc(db, "stores", storeId, "documents", docId),
    {
      kind,
      label: meta.label,
      icon: meta.icon,
      name: safeName,
      size: file.size || null,
      mime: file.type || null,
      path: storagePath,
      url,
      status: "Pending",
      uploadedBy: uid,
      uploadedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return { id: docId, url, path: storagePath };
}

/** Live docs stream */
export function listenVerificationDocs(storeId, cb, onErr) {
  const col = collection(db, "stores", storeId, "documents");
  const q = query(col, orderBy("uploadedAt", "desc"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), onErr);
}

/** One-shot fetch of docs (used by Review page) */
export async function fetchVerificationDocsOnce(storeId) {
  const col = collection(db, "stores", storeId, "documents");
  const q = query(col, orderBy("uploadedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Helper: are all required kinds present? */
export function hasAllRequired(docs) {
  const set = new Set(docs.map((d) => d.kind));
  return REQUIRED_KINDS.every((k) => set.has(k));
}

/** Delete both Storage object and Firestore doc */
export async function deleteVerificationDoc(storeId, docId, path) {
  if (path) await deleteObject(ref(storage, path)).catch(() => {});
  await deleteDoc(doc(db, "stores", storeId, "documents", docId));
}
