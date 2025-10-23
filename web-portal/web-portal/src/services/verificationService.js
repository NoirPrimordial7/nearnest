// src/services/verificationService.js
// In-memory mock so the UI works immediately. Replace with real API calls later.

const DB = {
  applications: [
    {
      id: "st_300",
      name: "Store #NE-300",
      owner: "Dinesh",
      city: "Pune",
      address: "MG Road, Pune",
      category: "Pharmacy",
      gstin: "22ABCDE1234F1Z5",
      licenseNo: "LIC-10000",
      status: "pending", // or 'approved'
      docs: [
        doc("gstin", "GST Certificate"),
        doc("license", "Drug License"),
        doc("pan", "PAN"),
        doc("address_proof", "Address Proof"),
      ],
    },
    {
      id: "st_301",
      name: "Store #NE-301",
      owner: "Anita",
      city: "Mumbai",
      address: "Link Rd, Andheri",
      category: "Clinic",
      gstin: "27PQRSX9999K2L7",
      licenseNo: "LIC-20000",
      status: "pending",
      docs: [doc("gstin","GST Certificate", "approved"), doc("license","Drug License","pending")],
    },
    {
      id: "st_302",
      name: "Store #NE-302",
      owner: "Sejal",
      city: "Delhi",
      address: "Ring Rd, Delhi",
      category: "Diagnostics",
      status: "pending",
      docs: [doc("pan","PAN","pending"), doc("address_proof","Address Proof","flagged")],
    },
  ],
};

function doc(type, label, status = "pending") {
  const now = Date.now();
  return {
    id: `${type}_${Math.random().toString(36).slice(2, 8)}`,
    type,                       // 'gstin' | 'license' | 'pan' | 'address_proof'
    typeLabel: label,
    uploadedAt: now - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 20),
    status,                    // 'pending' | 'approved' | 'rejected' | 'flagged'
    fileName: `${label}.png`,
    url: "",                   // put a real URL once available
  };
}

export async function listVerificationRequests({ search = "", docType = "all", status = "pending", page = 1, pageSize = 10 }) {
  // flatten docs -> rows
  const rows = [];
  DB.applications.forEach((app) => {
    app.docs.forEach((d) => {
      rows.push({
        storeId: app.id,
        storeName: app.name,
        owner: app.owner,
        appStatus: app.status,
        doc: d,
      });
    });
  });

  const norm = (s) => s.toLowerCase();
  let filtered = rows.filter((r) => {
    const matchesSearch =
      !search ||
      norm(r.storeName).includes(norm(search)) ||
      norm(r.owner).includes(norm(search)) ||
      norm(r.doc.typeLabel).includes(norm(search));

    const matchesType = docType === "all" || r.doc.type === docType;
    const matchesStatus = status === "all" || r.doc.status === status;
    return matchesSearch && matchesType && matchesStatus;
  });

  // sort newest upload first
  filtered.sort((a, b) => b.doc.uploadedAt - a.doc.uploadedAt);

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return pause({ items, total });
}

export async function getApplication(storeId) {
  const app = DB.applications.find((a) => a.id === storeId);
  return pause(structuredClone(app));
}

export async function setDocumentStatus(storeId, docId, status) {
  const app = DB.applications.find((a) => a.id === storeId);
  if (!app) return pause();
  const d = app.docs.find((x) => x.id === docId);
  if (!d) return pause();
  d.status = status;

  // auto-approve store when all docs approved
  if (app.docs.length > 0 && app.docs.every((x) => x.status === "approved")) {
    app.status = "approved";
  } else if (app.status === "approved") {
    app.status = "pending";
  }
  return pause();
}

export async function approveStore(storeId) {
  const app = DB.applications.find((a) => a.id === storeId);
  if (!app) return pause();
  const allOk = app.docs.length > 0 && app.docs.every((x) => x.status === "approved");
  if (!allOk) throw new Error("All required documents must be approved.");
  app.status = "approved";
  return pause();
}

/* helper: simulate latency */
function pause(data) {
  return new Promise((res) => setTimeout(() => res(data), 250));
}
