// src/pages/Admin/Verification/DocumentVerification.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../Auth/AuthContext";

/**
 * NOTE: You asked to keep these paths. This assumes your "../../Auth/firebase"
 * re-exports initialized `auth`, `db`, and Firestore helpers.
 */
import {
  auth, db,
  collection, query, where, getDoc, getDocs, doc,
  updateDoc, addDoc, serverTimestamp,
  orderBy, limit
} from "../../Auth/firebase";

import styles from "./DocumentVerification.module.css";

/* ------------------------- small UI helpers ------------------------- */
function Icon({ d, size = 18, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Pill({ value }) {
  const v = (value || "").toLowerCase();
  const cls =
    v === "approved" ? styles.pApproved :
    v === "rejected" ? styles.pRejected :
    styles.pPending;
  return <span className={`${styles.pill} ${cls}`}>{v ? v[0].toUpperCase()+v.slice(1) : "Pending"}</span>;
}

/* ---------------------------- constants ---------------------------- */
const PAGE_SIZE = 10;

/** fallback pretty label from doc id/kind */
const prettyLabel = (idOrKind) => {
  switch ((idOrKind || "").toLowerCase()) {
    case "aadhaar": return "Aadhaar";
    case "pan": return "PAN";
    case "druglicense":
    case "drug_license": return "Drug License";
    case "rentagreement":
    case "rent_agreement": return "Rent Agreement";
    case "storefrontphoto":
    case "store_front_photo": return "Store Front Photo";
    default: return idOrKind || "Document";
  }
};

/** tolerant read of Timestamp/number/string into Date */
const toDate = (ts) => {
  if (!ts) return null;
  if (typeof ts?.toMillis === "function") return new Date(ts.toMillis());
  if (typeof ts === "number") return new Date(ts);
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
};

/* ------------------------------ main ------------------------------- */
export default function DocumentVerification() {
  const { hasPermission, authLoading } = useAuth();
  const currentUser = auth.currentUser;

  const [statusFilter, setStatusFilter] = useState("all");
  const [queryText, setQueryText] = useState("");
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page] = useState(1); // placeholder for future pagination

  const [selectedStore, setSelectedStore] = useState(null);
  const [docs, setDocs] = useState([]);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("documents");

  const normalizeStatus = (s) => (s || "pending").toLowerCase();
  const cap = (s) => s ? s[0].toUpperCase()+s.slice(1).toLowerCase() : s;

  /* ------------------------- load stores list ------------------------- */
  async function loadStores() {
    setLoading(true);
    try {
      const filters = [];

      // If status filter chosen, we normalize against *top-level* verificationStatus
      if (statusFilter !== "all") {
        filters.push(where("verificationStatus", "==", cap(statusFilter)));
      }

      // Build base collection
      const base = collection(db, "stores");

      let q;

      // For name search we must orderBy("name") when using range on name
      const text = queryText.trim();
      if (text) {
        // Use range with \uf8ff and orderBy name; secondary order for stability
        q = query(
          base,
          where("name", ">=", text),
          where("name", "<=", text + "\uf8ff"),
          ...filters,
          orderBy("name"),
          orderBy("createdAt", "desc"),
          limit(PAGE_SIZE)
        );
      } else {
        // No text filter: order by createdAt desc
        q = query(
          base,
          ...filters,
          orderBy("createdAt", "desc"),
          limit(PAGE_SIZE)
        );
      }

      const snap = await getDocs(q);
      const items = [];

      for (const d of snap.docs) {
        const data = d.data();
        const store = {
          id: d.id,
          ...data,
          verificationStatus: (data.verificationStatus || data?.verification?.status || "pending")
        };

        // Owner lookup by doc id (faster/cheaper than where "__name__" ==)
        if (data.ownerId) {
          try {
            const uSnap = await getDoc(doc(db, "users", data.ownerId));
            if (uSnap.exists()) {
              const u = uSnap.data();
              store.ownerName = u.name || "";
              store.ownerEmail = u.email || "";
            }
          } catch (_) {}
        }

        items.push(store);
      }

      setStores(items);
    } catch (err) {
      console.error("[DocumentVerification] loadStores error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStores(); /* eslint-disable-next-line */ }, [statusFilter]);

  /* -------------------- open / close slide-over -------------------- */
  const openModal = async (store) => {
    setSelectedStore(store);
    setOpen(true);
    setTab("documents");

    try {
      const ds = await getDocs(
        query(
          collection(db, "stores", store.id, "documents"),
          orderBy("uploadedAt", "desc")
        )
      );
      const list = ds.docs.map((d) => {
        const v = d.data();
        return {
          id: d.id,
          label: v.label || prettyLabel(d.id),
          status: normalizeStatus(v.status),
          url: v.url || null,
          uploadedAt: v.uploadedAt || v.createdAt || v.timestamp
        };
      });
      setDocs(list);
    } catch (e) {
      console.error("[DocumentVerification] fetch docs error:", e);
    }
  };

  const closeModal = () => {
    setOpen(false);
    setSelectedStore(null);
    setDocs([]);
  };

  /* ---------------------- approve / reject doc ---------------------- */
  const onApproveDoc = async (docId) => {
    if (!selectedStore) return;
    try {
      await updateDoc(doc(db, "stores", selectedStore.id, "documents", docId), {
        status: "approved",
        updatedAt: serverTimestamp(),
        updatedBy: currentUser?.uid || null
      });

      setDocs((prev) => prev.map((d) => d.id === docId ? { ...d, status: "approved" } : d));

      await addDoc(collection(db, "stores", selectedStore.id, "verificationLogs"), {
        action: `Document ${docId} approved`,
        timestamp: serverTimestamp(),
        performedBy: currentUser?.uid || null
      });
    } catch (e) {
      console.error("Approve doc error:", e);
    }
  };

  const onRejectDoc = async (docId, reason = "") => {
    if (!selectedStore) return;
    const txt = reason || prompt("Enter rejection reason (optional):", "") || "";
    try {
      await updateDoc(doc(db, "stores", selectedStore.id, "documents", docId), {
        status: "rejected",
        rejectionReason: txt,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser?.uid || null
      });

      setDocs((prev) => prev.map((d) => d.id === docId ? { ...d, status: "rejected" } : d));

      await addDoc(collection(db, "stores", selectedStore.id, "verificationLogs"), {
        action: `Document ${docId} rejected${txt ? `. Reason: ${txt}` : ""}`,
        timestamp: serverTimestamp(),
        performedBy: currentUser?.uid || null
      });
    } catch (e) {
      console.error("Reject doc error:", e);
    }
  };

  /* --------------------- approve / reject store --------------------- */
  const allDocsApproved = useMemo(() => docs.length > 0 && docs.every(d => d.status === "approved"), [docs]);

  const onApproveStore = async () => {
    if (!selectedStore || !allDocsApproved) return;
    try {
      const sref = doc(db, "stores", selectedStore.id);
      await updateDoc(sref, {
        verificationStatus: "Approved",           // top-level for list/table
        "verification.status": "approved",        // nested for compatibility
        "verification.approvedAt": serverTimestamp(),
        "verification.approvedBy": currentUser?.uid || null,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser?.uid || null
      });

      await addDoc(collection(db, "stores", selectedStore.id, "verificationLogs"), {
        action: `Store approved`,
        timestamp: serverTimestamp(),
        performedBy: currentUser?.uid || null
      });

      closeModal();
      loadStores();
    } catch (e) {
      console.error("Approve store error:", e);
    }
  };

  const onRejectStore = async () => {
    if (!selectedStore) return;
    const reason = prompt("Reason for rejecting this store:") || "";
    if (reason === null) return;
    try {
      const sref = doc(db, "stores", selectedStore.id);
      await updateDoc(sref, {
        verificationStatus: "Rejected",
        "verification.status": "rejected",
        "verification.reason": reason,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser?.uid || null
      });

      await addDoc(collection(db, "stores", selectedStore.id, "verificationLogs"), {
        action: `Store rejected${reason ? `. Reason: ${reason}` : ""}`,
        timestamp: serverTimestamp(),
        performedBy: currentUser?.uid || null
      });

      closeModal();
      loadStores();
    } catch (e) {
      console.error("Reject store error:", e);
    }
  };

  /* ------------------------------ guard ----------------------------- */
  if (authLoading) return null;
  if (!hasPermission("VERIFY_DOCS")) return <div className={styles.page}>Access Denied</div>;

  /* ------------------------------ UI ------------------------------- */
  return (
    <div className={styles.page}>
      {/* Search and filter */}
      <form className={styles.filters} onSubmit={(e) => { e.preventDefault(); loadStores(); }}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>
            <Icon d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
          </span>
          <input
            className={styles.input}
            placeholder="Search by store name…"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
          />
          <button className={styles.searchBtn} type="submit">Search</button>
        </div>
        <div className={styles.selectWrap}>
          <label>Status</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </form>

      {/* Stores Table */}
      <section className={styles.card}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Store</th>
                <th>Owner</th>
                <th>Email</th>
                <th>Category</th>
                <th>Created</th>
                <th>Status</th>
                <th style={{ width: 90 }}></th>
              </tr>
            </thead>
            <tbody>
              {!loading && stores.length === 0 && (
                <tr><td colSpan="7" className={styles.empty}>No stores found.</td></tr>
              )}
              {stores.map((s) => {
                const created = toDate(s.createdAt);
                return (
                  <tr key={s.id} className={styles.row} onClick={() => openModal(s)}>
                    <td>
                      <div className={styles.primary}>
                        <div className={styles.logo}>{(s.name || "NN").slice(0, 2)}</div>
                        <div>
                          <div className={styles.name}>{s.name || "—"}</div>
                          {s.address?.city && <div className={styles.sub}>{s.address.city}</div>}
                        </div>
                      </div>
                    </td>
                    <td>{s.ownerName || "—"}</td>
                    <td>{s.ownerEmail || "—"}</td>
                    <td>{s.category || "—"}</td>
                    <td>{created ? created.toLocaleDateString() : "—"}</td>
                    <td><Pill value={s.verificationStatus || "pending"} /></td>
                    <td className={styles.chev}><Icon d="M9 6l6 6-6 6" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* pagination controls can be added later */}
      </section>

      {/* Slide-over Details */}
      {open && selectedStore && (
        <>
          <div className={styles.backdrop} onClick={closeModal} />
          <section className={styles.sheet} role="dialog" aria-modal="true">
            {/* Header */}
            <header className={styles.sheetHead}>
              <div className={styles.sheetTitle}>
                <div className={styles.logo}>{(selectedStore.name || "NN").slice(0, 2)}</div>
                <div>
                  <h3>{selectedStore.name || "—"}</h3>
                  <div className={styles.smallMuted}>
                    {selectedStore.category || "—"} • {selectedStore.ownerName || "—"}
                  </div>
                </div>
              </div>
              <button className={styles.iconBtn} onClick={closeModal} aria-label="Close">
                <Icon d="M6 6l12 12M6 18L18 6" />
              </button>
            </header>

            {/* Tabs */}
            <nav className={styles.tabs}>
              {["documents", "store", "activity", "location"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
                >
                  {t === "store" ? "Store Info" : t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </nav>

            <div className={styles.sheetBody}>
              {tab === "store" && (
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}><span>Category</span><b>{selectedStore.category || "—"}</b></div>
                  <div className={styles.infoItem}><span>Phone</span><b>{selectedStore.phone || "—"}</b></div>
                  <div className={styles.infoItem}><span>License No.</span><b>{selectedStore.licenseNo || "—"}</b></div>
                  <div className={styles.infoItemWide}>
                    <span>Address</span>
                    <b>
                      {selectedStore.address?.line1 || "—"}
                      {selectedStore.address?.city ? `, ${selectedStore.address.city}` : ""}
                      {selectedStore.address?.pin ? ` ${selectedStore.address.pin}` : ""}
                    </b>
                  </div>
                </div>
              )}

              {tab === "documents" && (
                <div className={styles.docList}>
                  {docs.map((d) => {
                    const up = toDate(d.uploadedAt);
                    return (
                      <div key={d.id} className={styles.docRow}>
                        <div className={styles.docMeta}>
                          <div className={styles.docThumb} />
                          <div className={styles.docText}>
                            <b>{d.label || prettyLabel(d.id)}</b>
                            <span className={styles.smallMuted}>
                              {up ? `Uploaded ${up.toLocaleString()}` : "—"}
                            </span>
                          </div>
                        </div>
                        <Pill value={d.status} />
                        <div className={styles.docActions}>
                          {d.url ? (
                            <a className={styles.ghostBtn} href={d.url} target="_blank" rel="noreferrer">
                              <Icon d="M15 10l4.553-4.553a3.182 3.182 0 00-4.5-4.5L10.5 6" /> Preview
                            </a>
                          ) : (
                            <button className={styles.ghostBtn} disabled title="No file">Preview</button>
                          )}
                          {d.status !== "approved" && (
                            <button className={styles.mintBtn} onClick={() => onApproveDoc(d.id)}>
                              <Icon d="M5 12l4 4L19 6" /> Approve
                            </button>
                          )}
                          {d.status !== "rejected" && (
                            <button className={styles.roseBtn} onClick={() => onRejectDoc(d.id)}>
                              <Icon d="M6 18L18 6M6 6l12 12" /> Reject
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {tab === "activity" && (
                <ul className={styles.timeline}>
                  {(selectedStore.verificationLogs || []).map((a, i) => {
                    const t = toDate(a.timestamp);
                    return (
                      <li key={i}>
                        <span>{t ? t.toLocaleString() : "—"}</span>
                        <b>{a.action}</b>
                      </li>
                    );
                  })}
                </ul>
              )}

              {tab === "location" && (
                <div className={styles.mapCard}>
                  <div className={styles.mapPlaceholder}>Map Preview</div>
                  <div className={styles.mapMeta}>
                    <span>Lat: <b>{selectedStore.geo?.lat ?? "—"}</b></span>
                    <span>Lng: <b>{selectedStore.geo?.lng ?? "—"}</b></span>
                    {(selectedStore.geo?.lat && selectedStore.geo?.lng) && (
                      <a
                        className={styles.openMaps}
                        href={`https://www.google.com/maps?q=${selectedStore.geo.lat},${selectedStore.geo.lng}`}
                        target="_blank" rel="noreferrer"
                      >
                        Open in Maps
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with approve/reject */}
            <footer className={styles.sheetFoot}>
              <div className={styles.footNote}>
                Approve all required documents to enable final approval.
              </div>
              <button
                className={styles.approveStore}
                disabled={!allDocsApproved}
                onClick={onApproveStore}
              >
                Approve Store
              </button>
              <button className={styles.roseBtn} onClick={onRejectStore}>
                Reject Store
              </button>
            </footer>
          </section>
        </>
      )}
    </div>
  );
}
