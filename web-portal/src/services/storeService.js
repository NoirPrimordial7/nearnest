// Toggle this to switch between mock data and Firestore.
const USE_MOCK = true;

/* ======================= MOCK ======================= */
const MOCK_STORES = Array.from({ length: 22 }).map((_, i) => {
  const status = i % 7 === 0 ? "pending" : i % 5 === 0 ? "rejected" : "active";
  const cities = ["Pune", "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Thane"];
  const cats = ["Pharmacy", "Clinic", "Diagnostics"];
  const city = cities[i % cities.length];

  return {
    id: `MOCK_${i + 1}`,
    name: `Store #NE-${300 + i}`,
    owner: ["Dinesh", "Anita", "Sejal", "Rohit", "Kiran"][i % 5],
    city,
    category: cats[i % cats.length],
    status,
    joinedAt: Date.now() - 1000 * 60 * 60 * 24 * (i * 5 + 2),
    gstin: `27ABCDE${1000 + i}Z5`,
    licenseNo: `LIC-${10000 + i}`,
    address: `${(i % 60) + 11}, MG Road, ${city}`,
    phone: `98${(10000000 + i).toString().slice(0, 8)}`,
    email: `owner${i + 1}@example.com`,
    docs: [
      { id: "gst", name: "GST Certificate", url: "", status: "approved" },
      { id: "drug", name: "Drug License", url: "", status: i % 7 === 0 ? "pending" : "approved" },
      { id: "pan", name: "PAN", url: "", status: i % 5 === 0 ? "rejected" : "approved" },
    ],
    activity: [
      { ts: Date.now() - 7200000, text: "KYC submitted" },
      { ts: Date.now() - 3600000, text: "Document reviewed by admin" },
    ],
    _ref: null,
  };
});

function mockDelay(ms = 350) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function listStores({ status = "all", pageSize = 10, cursor = 0, search = "" } = {}) {
  if (USE_MOCK) {
    await mockDelay();
    let data = [...MOCK_STORES];

    if (status !== "all") data = data.filter((s) => s.status === status);
    if (search) {
      const q = search.trim().toLowerCase();
      data = data.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.owner.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q)
      );
    }

    const slice = data.slice(cursor, cursor + pageSize);
    const nextCursor = cursor + pageSize < data.length ? cursor + pageSize : null;
    return { items: slice, nextCursor };
  }

  /* ======================= FIRESTORE =======================
  import { getFirestore, collection, query, where, orderBy, limit, startAfter, getDocs } from "firebase/firestore";
  import { app } from "../../firebase";
  const db = getFirestore(app);
  const STORES = collection(db, "stores");

  const parts = [orderBy("createdAt", "desc")];
  if (status !== "all") parts.unshift(where("status", "==", status));
  if (search) parts.unshift(where("keywords", "array-contains", search.toLowerCase()));

  let q = query(STORES, ...parts, limit(pageSize));
  if (cursor) q = query(STORES, ...parts, startAfter(cursor), limit(pageSize));

  const snap = await getDocs(q);
  const items = snap.docs.map(d => ({ id: d.id, ...d.data(), _ref: d }));
  const nextCursor = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;
  return { items, nextCursor };
  ========================================================== */
}

export async function setStoreStatus(storeId, status) {
  if (USE_MOCK) {
    const idx = MOCK_STORES.findIndex((s) => s.id === storeId);
    if (idx >= 0) MOCK_STORES[idx].status = status;
    await mockDelay(250);
    return;
  }

  /* ======================= FIRESTORE =======================
  import { getFirestore, doc, updateDoc } from "firebase/firestore";
  import { app } from "../../firebase";
  const db = getFirestore(app);
  const ref = doc(db, "stores", storeId);
  await updateDoc(ref, { status });
  ========================================================== */
}
