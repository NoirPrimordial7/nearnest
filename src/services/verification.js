// src/services/verification.js
import { db, storage } from "../firebase/firebase";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

/** Canonical set of required docs and their friendly labels/icons */
export const KIND_META = {
  aadhaar:     { label: "Aadhaar (Owner)",                 icon: "🪪" },
  pan:         { label: "PAN (Owner)",                     icon: "🧾" },
  property:    { label: "Rent Agreement / Property Proof", icon: "🏠" },
  drugLicense: { label: "Drug License",                    icon: "💊" },
  storePhoto:  { label: "Store Photo (front view)",        icon: "🏪" },
  other:       { label: "Supporting document",             icon: "📎" },
};

export const REQUIRED_KINDS = [
  "aadhaar",
  "pan",
  "property",
  "drugLicense",
  "storePhoto",
];

/** Best-effort MIME inference for when the browser doesn’t give file.type */
function inferContentType(safeName, file) {
  if (file?.type) return file.type;
  const lower = (safeName || "").toLowerCase();
  if (lower.endsWith(".pdf"))  return "application/pdf";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png"))  return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif"))  return "image/gif";
  return "image/png"; // last resort to satisfy rules expecting image/* or pdf
}

/**
 * Upload a verification document.
 * - Required kinds use stable docId == kind (so re-uploads overwrite).
 * - "other" uses unique id to allow multiple uploads.
 */
export async function uploadVerificationDoc(uid, storeId, file, kind = "other") {
  const safeName = (file?.name || "document").replace(/[^\w.\-]+/g, "_");
  const isRequired = REQUIRED_KINDS.includes(kind);

  const docId = isRequired ? kind : `other-${Date.now()}`;
  const storagePath = `storeDocs/${storeId}/${docId}-${safeName}`;

  const r = ref(storage, storagePath);
  const contentType = inferContentType(safeName, file);

  await uploadBytes(r, file, { contentType });
  const url = await getDownloadURL(r);

  const meta = KIND_META[kind] || KIND_META.other;

  await setDoc(
    doc(db, "stores", storeId, "documents", docId),
    {
      kind,
      label: meta.label,
      icon: meta.icon,
      name: safeName,
      size: file?.size ?? null,
      mime: contentType,
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

/** Live stream of docs under stores/{storeId}/documents ordered by time */
export function listenVerificationDocs(storeId, cb, onErr) {
  const col = collection(db, "stores", storeId, "documents");
  const q = query(col, orderBy("uploadedAt", "desc"));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onErr
  );
}

/** Delete both Storage object and Firestore doc */
export async function deleteVerificationDoc(storeId, docId, path) {
  if (path) {
    try { await deleteObject(ref(storage, path)); } catch {}
  }
  await deleteDoc(doc(db, "stores", storeId, "documents", docId));
}
