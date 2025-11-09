// src/pages/Admin/Stores/storeService.js

import {
  collection,
  doc,
  getDocs,
  getDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../../Auth/firebase"; // keep this path as in your project

// Reference to the stores collection
const STORES = collection(db, "stores");

/** Nice labels for document kinds (mirrors DocumentVerification) */
function prettyLabel(id) {
  switch ((id || "").toLowerCase()) {
    case "aadhaar":
      return "Aadhaar";
    case "pan":
      return "PAN";
    case "druglicense":
    case "drug_license":
      return "Drug License";
    case "rentagreement":
    case "rent_agreement":
    case "property":
      return "Rent Agreement / Property Proof";
    case "storefrontphoto":
    case "store_front_photo":
    case "storephoto":
      return "Store Photo (front view)";
    default:
      return id || "Document";
  }
}

/**
 * Convert a Firestore store document into the shape expected by StoresPage.
 * (Only uses fields from the store doc itself; owner details are added later.)
 */
function normalizeStore(docSnap) {
  const data = docSnap.data() || {};

  // createdAt / submittedAt → timestamp in ms
  const createdRaw = data.createdAt || data.submittedAt;
  let createdAtMs = Date.now();
  if (createdRaw?.toMillis) createdAtMs = createdRaw.toMillis();
  else if (createdRaw?.seconds) createdAtMs = createdRaw.seconds * 1000;
  else if (typeof createdRaw === "number") createdAtMs = createdRaw;

  const addressObj = data.address || {};
  const addressLine =
    addressObj.formatted ||
    addressObj.line1 ||
    data.formatted ||
    data.addressText ||
    [addressObj.city, addressObj.state].filter(Boolean).join(", ");

  const docsArr = Array.isArray(data.documents)
    ? data.documents
    : data.documents && typeof data.documents === "object"
    ? Object.entries(data.documents).map(([id, v]) => ({
        id,
        name: v.name || id,
        status: v.status || v.verificationStatus || "pending",
        url: v.url || v.downloadUrl || "",
      }))
    : [];

  const verificationStatus =
    data.verification?.status || data.verificationStatus; // e.g. "approved", "Approved"

  return {
    id: docSnap.id,
    name: data.name || "Unnamed store",

    // will be overridden with user doc if available
    owner: data.ownerName || "—",
    city: addressObj.city || data.city || "—",
    category: data.category || "Pharmacy",

    status:
      (typeof verificationStatus === "string"
        ? verificationStatus.toLowerCase()
        : undefined) || data.status || "pending",

    joinedAt: createdAtMs,

    gstin: data.gstin || "",
    licenseNo: data.licenseNo || "",
    address: addressLine,
    phone: data.phone || "",
    email: data.email || "",

    docs: docsArr,
    activity: [], // activity is loaded from verificationLogs subcollection
    ownerId: data.ownerId || null,
  };
}

/**
 * List stores from Firestore.
 * - status: "all" | "approved" | "pending" | "rejected" | "suspended" | etc.
 * - pageSize, cursor, search: as before.
 */
export async function listStores({
  status = "all",
  pageSize = 10,
  cursor = 0,
  search = "",
} = {}) {
  const constraints = [];

  // filter by verification.status for approved
  if (status !== "all") {
    if (status === "approved") {
      constraints.push(where("verification.status", "==", "approved"));
    } else {
      constraints.push(where("status", "==", status));
    }
  }

  const qRef = constraints.length ? query(STORES, ...constraints) : STORES;
  const snap = await getDocs(qRef);
  let docs = snap.docs;

  // Optional search (client-side) by store name, owner name (from store doc), or city
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    docs = docs.filter((docSnap) => {
      const d = docSnap.data() || {};
      const addr = d.address || {};
      const name = (d.name || "").toLowerCase();
      const owner = (d.ownerName || "").toLowerCase();
      const city = (addr.city || "").toLowerCase();
      return (
        name.includes(q) ||
        owner.includes(q) ||
        city.includes(q)
      );
    });
  }

  // Sort newest first by createdAt/submittedAt
  docs.sort((a, b) => {
    const da = a.data() || {};
    const dbData = b.data() || {};

    const ra = da.createdAt || da.submittedAt;
    const rb = dbData.createdAt || dbData.submittedAt;

    const ta =
      ra?.toMillis?.() ?? (ra?.seconds ? ra.seconds * 1000 : 0);
    const tb =
      rb?.toMillis?.() ?? (rb?.seconds ? rb.seconds * 1000 : 0);
    return tb - ta;
  });

  const total = docs.length;

  // Pagination using numeric cursor as offset
  const start = cursor || 0;
  const pageDocs = docs.slice(start, start + pageSize);
  const nextCursor = start + pageSize < total ? start + pageSize : null;

  // Normalize and then enrich with owner info from /users/{ownerId}
  const items = [];
  for (const dSnap of pageDocs) {
    const base = normalizeStore(dSnap);
    const data = dSnap.data() || {};

    if (data.ownerId) {
      try {
        const uSnap = await getDoc(doc(db, "users", data.ownerId));
        if (uSnap.exists()) {
          const u = uSnap.data() || {};
          base.owner = u.name || base.owner || "—";
          base.email = u.email || base.email || "—";
        }
      } catch (e) {
        console.error("[storeService] fetch owner user error:", e);
      }
    }

    items.push(base);
  }

  return { items, nextCursor, total };
}

/**
 * Update a store's status (e.g., active / suspended / pending / rejected)
 */
export async function setStoreStatus(storeId, status) {
  const ref = doc(STORES, storeId);
  await updateDoc(ref, { status });
}

/**
 * Permanently delete a store document.
 */
export async function deleteStore(id) {
  const ref = doc(STORES, id);
  await deleteDoc(ref);
  return { ok: true };
}

/**
 * Fetch verification documents for a store from /stores/{storeId}/documents
 */
export async function getStoreDocuments(storeId) {
  if (!storeId) return [];
  const docsCol = collection(db, "stores", storeId, "documents");
  const snap = await getDocs(query(docsCol, orderBy("uploadedAt", "desc")));

  return snap.docs.map((d) => {
    const v = d.data() || {};
    const status = (v.status || v.verificationStatus || "pending").toLowerCase();

    return {
      id: d.id,
      name: v.label || prettyLabel(d.id),
      status,
      url: v.url || v.downloadURL || v.downloadUrl || "",
      uploadedAt: v.uploadedAt || v.createdAt || v.timestamp || null,
    };
  });
}

/**
 * Fetch verification logs for a store from /stores/{storeId}/verificationLogs
 */
export async function getStoreVerificationLogs(storeId) {
  if (!storeId) return [];
  const logsCol = collection(db, "stores", storeId, "verificationLogs");
  const snap = await getDocs(query(logsCol, orderBy("timestamp", "desc")));

  return snap.docs.map((d) => {
    const v = d.data() || {};
    const ts = v.timestamp;
    let tsMs = null;
    if (ts?.toMillis) tsMs = ts.toMillis();
    else if (ts?.seconds) tsMs = ts.seconds * 1000;
    else if (typeof ts === "number") tsMs = ts;

    return {
      id: d.id,
      ts: tsMs,
      text: v.action || "",
      performedBy: v.performedBy || null,
    };
  });
}
