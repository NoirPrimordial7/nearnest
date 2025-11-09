// src/pages/Admin/Verification/DocumentVerification.jsx

import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../Auth/AuthContext";
import {
  auth, db, collection, query, where, getDocs,
  updateDoc, addDoc, doc, serverTimestamp,
  orderBy, limit
} from "../../Auth/firebase";
import styles from "./DocumentVerification.module.css";

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
  return <span className={`${styles.pill} ${cls}`}>{v.charAt(0).toUpperCase() + v.slice(1)}</span>;
}

export default function DocumentVerification() {
  const { hasPermission, authLoading } = useAuth();

  const [statusFilter, setStatusFilter] = useState("all");
  const [queryText, setQueryText] = useState("");
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [selectedStore, setSelectedStore] = useState(null);
  const [docs, setDocs] = useState([]);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("documents");

  const currentUser = auth.currentUser;

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  async function loadStores() {
    setLoading(true);
    try {
      const filters = [];
      if (statusFilter !== "all") {
        filters.push(where("verificationStatus", "==", capitalize(statusFilter)));
      }
      if (queryText.trim()) {
        filters.push(where("name", ">=", queryText));
        filters.push(where("name", "<=", queryText + "\uf8ff"));
      }
      const q = query(collection(db, "stores"), ...filters, orderBy("createdAt", "desc"), limit(pageSize));
      const snap = await getDocs(q);
      const items = [];
      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const store = { id: docSnap.id, ...data };
        if (data.ownerId) {
          const userSnap = await getDocs(query(collection(db, "users"), where("__name__", "==", data.ownerId)));
          if (!userSnap.empty) {
            const userData = userSnap.docs[0].data();
            store.ownerName = userData.name || "";
            store.ownerEmail = userData.email || "";
          }
        }
        items.push(store);
      }
      setStores(items);
      setPage(1);
    } catch (err) {
      console.error("Error loading stores:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStores(); }, [statusFilter]);

  const openModal = async (store) => {
    setSelectedStore(store);
    setOpen(true);
    setTab("documents");
    try {
      const docsSnap = await getDocs(query(
        collection(db, "stores", store.id, "documents"),
        orderBy("uploadedAt", "desc")
      ));
      const docsList = docsSnap.docs.map(d => {
        const docData = d.data();
        return { id: d.id, status: docData.status.toLowerCase(), ...docData };
      });
      setDocs(docsList);
    } catch (e) {
      console.error("Error fetching docs:", e);
    }
  };

  const closeModal = () => {
    setOpen(false);
    setSelectedStore(null);
    setDocs([]);
  };

  const onApproveDoc = async (docId) => {
    if (!selectedStore) return;
    try {
      await updateDoc(doc(db, "stores", selectedStore.id, "documents", docId), {
        status: "Approved",
        updatedAt: serverTimestamp()
      });
      setDocs(docs.map(d => d.id === docId ? { ...d, status: "approved" } : d));
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
    const txt = reason || prompt("Enter rejection reason (optional):", "");
    try {
      await updateDoc(doc(db, "stores", selectedStore.id, "documents", docId), {
        status: "Rejected",
        rejectionReason: txt,
        updatedAt: serverTimestamp()
      });
      setDocs(docs.map(d => d.id === docId ? { ...d, status: "rejected" } : d));
      await addDoc(collection(db, "stores", selectedStore.id, "verificationLogs"), {
        action: `Document ${docId} rejected. Reason: ${txt}`,
        timestamp: serverTimestamp(),
        performedBy: currentUser?.uid || null
      });
    } catch (e) {
      console.error("Reject doc error:", e);
    }
  };

  const allDocsApproved = useMemo(() => docs.every(d => d.status === "approved"), [docs]);

  const onApproveStore = async () => {
    if (!selectedStore || !allDocsApproved) return;
    try {
      await updateDoc(doc(db, "stores", selectedStore.id), {
        "verification.status": "approved",
        "verification.approvedAt": serverTimestamp(),
        "verification.approvedBy": currentUser?.uid || null
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
    const reason = prompt("Reason for rejecting this store:");
    if (!reason) return;
    try {
      await updateDoc(doc(db, "stores", selectedStore.id), {
        "verification.status": "rejected",
        "verification.reason": reason,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser?.uid || null
      });
      await addDoc(collection(db, "stores", selectedStore.id, "verificationLogs"), {
        action: `Store rejected. Reason: ${reason}`,
        timestamp: serverTimestamp(),
        performedBy: currentUser?.uid || null
      });
      closeModal();
      loadStores();
    } catch (e) {
      console.error("Reject store error:", e);
    }
  };

  if (authLoading) return null;
  if (!hasPermission("VERIFY_DOCS")) return <div className={styles.page}>Access Denied</div>;

  return (
    <div className={styles.page}>
      {/* Search and filter */}
      <form className={styles.filters} onSubmit={e => { e.preventDefault(); loadStores(); }}>
        <div className={styles.searchWrap}>
          <Icon d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
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
              {stores.map(s => (
                <tr key={s.id} className={styles.row} onClick={() => openModal(s)}>
                  <td>
                    <div className={styles.primary}>
                      <div className={styles.logo}>{s.name.slice(0, 2)}</div>
                      <div>
                        <div className={styles.name}>{s.name}</div>
                      </div>
                    </div>
                  </td>
                  <td>{s.ownerName || "—"}</td>
                  <td>{s.ownerEmail || "—"}</td>
                  <td>{s.category || "—"}</td>
                  <td>{new Date(s.createdAt?.toMillis() || s.createdAt).toLocaleDateString()}</td>
                  <td><Pill value={s.verificationStatus || "pending"} /></td>
                  <td className={styles.chev}><Icon d="M9 6l6 6-6 6" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* (Pagination controls could go here) */}
      </section>

      {/* Slide-over Details */}
      {open && selectedStore && (
        <>
          <div className={styles.backdrop} onClick={closeModal} />
          <section className={styles.sheet} role="dialog" aria-modal="true">
            {/* Header */}
            <header className={styles.sheetHead}>
              <div className={styles.sheetTitle}>
                <div className={styles.logo}>{selectedStore.name.slice(0, 2)}</div>
                <div>
                  <h3>{selectedStore.name}</h3>
                  <div className={styles.smallMuted}>{selectedStore.category} • {selectedStore.ownerName}</div>
                </div>
              </div>
              <button className={styles.iconBtn} onClick={closeModal} aria-label="Close">
                <Icon d="M6 6l12 12M6 18L18 6" />
              </button>
            </header>

            {/* Tabs */}
            <nav className={styles.tabs}>
              {["documents", "store", "activity", "location"].map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
                >
                  {t === "store" ? "Store Info" : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </nav>

            <div className={styles.sheetBody}>
              {tab === "store" && (
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}><span>Category</span><b>{selectedStore.category}</b></div>
                  <div className={styles.infoItem}><span>Phone</span><b>{selectedStore.phone || "—"}</b></div>
                  <div className={styles.infoItem}><span>License No.</span><b>{selectedStore.licenseNo || "—"}</b></div>
                  <div className={styles.infoItemWide}>
                    <span>Address</span>
                    <b>{selectedStore.address?.line1}, {selectedStore.address?.city} {selectedStore.address?.pin}</b>
                  </div>
                </div>
              )}

              {tab === "documents" && (
                <div className={styles.docList}>
                  {docs.map((d) => (
                    <div key={d.id} className={styles.docRow}>
                      <div className={styles.docMeta}>
                        <div className={styles.docThumb} /* could display thumbnail */ />
                        <div className={styles.docText}>
                          <b>{d.label}</b>
                          <span className={styles.smallMuted}>
                            Uploaded {new Date(d.uploadedAt?.toMillis() || d.uploadedAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <Pill value={d.status} />
                      <div className={styles.docActions}>
                        <button className={styles.ghostBtn} title="Preview">Preview</button>
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
                  ))}
                </div>
              )}

              {tab === "activity" && (
                <ul className={styles.timeline}>
                  {(selectedStore.verificationLogs || []).map((a, i) => (
                    <li key={i}>
                      <span>{new Date(a.timestamp?.toMillis() || a.timestamp).toLocaleString()}</span>
                      <b>{a.action}</b>
                    </li>
                  ))}
                </ul>
              )}

              {tab === "location" && (
                <div className={styles.mapCard}>
                  <div className={styles.mapPlaceholder}>Map Preview</div>
                  <div className={styles.mapMeta}>
                    <span>Lat: <b>{selectedStore.geo?.lat || "—"}</b></span>
                    <span>Lng: <b>{selectedStore.geo?.lng || "—"}</b></span>
                    {selectedStore.formatted && (
                      <a
                        className={styles.openMaps}
                        href={`https://www.google.com/maps?q=${selectedStore.geo?.lat},${selectedStore.geo?.lng}`}
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
              <button
                className={styles.roseBtn}
                onClick={onRejectStore}
              >
                Reject Store
              </button>
            </footer>
          </section>
        </>
      )}
    </div>
  );
}
