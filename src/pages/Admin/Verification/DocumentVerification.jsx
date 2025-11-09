// src/pages/Admin/Verification/DocumentVerification.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../Auth/AuthContext";
import {
  auth,
  db,
  collection,
  query,
  where,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
} from "../../Auth/firebase";
import styles from "./DocumentVerification.module.css";

const PAGE_SIZE = 50;

/* ============ UI HELPERS ============ */

function Icon({ d, size = 18, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d={d}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Pill({ value }) {
  const v = (value || "").toString().toLowerCase();
  const cls =
    v === "approved"
      ? styles.pApproved
      : v === "rejected"
      ? styles.pRejected
      : styles.pPending;

  const label = v ? v.charAt(0).toUpperCase() + v.slice(1) : "Pending";

  return <span className={`${styles.pill} ${cls}`}>{label}</span>;
}

function prettyLabel(id) {
  const v = (id || "").toLowerCase();
  if (v === "aadhaar") return "Aadhaar";
  if (v === "pan") return "PAN";
  if (v === "druglicense" || v === "drug_license") return "Drug License";
  if (v === "rentagreement" || v === "rent_agreement" || v === "property")
    return "Rent Agreement / Property Proof";
  if (
    v === "storefrontphoto" ||
    v === "store_front_photo" ||
    v === "storephoto"
  )
    return "Store Photo (front view)";
  return id || "Document";
}

function toDate(ts) {
  if (!ts) return null;
  if (typeof ts?.toMillis === "function") return new Date(ts.toMillis());
  if (typeof ts === "number") return new Date(ts);
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
}

function capFirst(s) {
  if (!s) return s;
  const v = String(s).toLowerCase();
  return v.charAt(0).toUpperCase() + v.slice(1);
}

/* ============ MAIN COMPONENT ============ */

export default function DocumentVerification() {
  const { hasPermission, authLoading } = useAuth();
  const currentUser = auth.currentUser;

  const [statusFilter, setStatusFilter] = useState("submitted");
  const [queryText, setQueryText] = useState("");
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedStore, setSelectedStore] = useState(null);
  const [docs, setDocs] = useState([]); // [{id,label,status,url,uploadedAt,updatedAt,reason}]
  const [activity, setActivity] = useState([]);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("documents");

  /* ------------ LOAD STORES TABLE ------------ */

  async function loadStores() {
    setLoading(true);
    try {
      const filters = [];

      if (statusFilter !== "all") {
        // "Submitted" | "Approved" | "Rejected"
        filters.push(
          where("verificationStatus", "==", capFirst(statusFilter))
        );
      }

      const base = collection(db, "stores");
      const text = queryText.trim();
      let qRef;

      if (text) {
        qRef = query(
          base,
          where("name", ">=", text),
          where("name", "<=", text + "\uf8ff"),
          ...filters,
          orderBy("name"),
          orderBy("createdAt", "desc"),
          limit(PAGE_SIZE)
        );
      } else {
        qRef = query(
          base,
          ...filters,
          orderBy("createdAt", "desc"),
          limit(PAGE_SIZE)
        );
      }

      const snap = await getDocs(qRef);
      const list = [];

      for (const dSnap of snap.docs) {
        const data = dSnap.data();
        const store = {
          id: dSnap.id,
          ...data,
          verificationStatus:
            data.verificationStatus ||
            data?.verification?.status ||
            "Submitted",
        };

        if (data.ownerId) {
          try {
            const uSnap = await getDoc(doc(db, "users", data.ownerId));
            if (uSnap.exists()) {
              const u = uSnap.data();
              store.ownerName = u.name || "";
              store.ownerEmail = u.email || "";
              store.ownerId = data.ownerId;
            }
          } catch {
            // ignore
          }
        }

        list.push(store);
      }

      setStores(list);
    } catch (err) {
      console.error("loadStores error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  /* ------------ OPEN MODAL (LOAD DOCS + LOGS) ------------ */

  const openModal = async (store) => {
    setSelectedStore(store);
    setOpen(true);
    setTab("documents");

    try {
      const docsRef = collection(db, "stores", store.id, "documents");
      const logsRef = collection(db, "stores", store.id, "verificationLogs");

      const [docsSnap, logsSnap] = await Promise.all([
        getDocs(query(docsRef, orderBy("uploadedAt", "desc"))).catch(() => ({
          docs: [],
        })),
        getDocs(query(logsRef, orderBy("timestamp", "desc"))).catch(() => ({
          docs: [],
        })),
      ]);

      const docList = docsSnap.docs.map((d) => {
        const v = d.data();
        const raw =
          typeof v.status === "string" ? v.status.toLowerCase() : "pending";
        const status =
          raw === "approved"
            ? "Approved"
            : raw === "rejected"
            ? "Rejected"
            : "Pending";
        return {
          id: d.id,
          label: v.label || prettyLabel(d.id),
          status,
          url: v.url || null,
          uploadedAt: v.uploadedAt || v.createdAt || v.timestamp || null,
          updatedAt: v.updatedAt || null,
          reason: v.remark || v.rejectionReason || "",
        };
      });

      const logList = logsSnap.docs.map((l) => {
        const v = l.data();
        return {
          id: l.id,
          action: v.action || "",
          timestamp: v.timestamp || null,
        };
      });

      setDocs(docList);
      setActivity(logList);
    } catch (err) {
      console.error("openModal error:", err);
      setDocs([]);
      setActivity([]);
    }
  };

  const closeModal = () => {
    setOpen(false);
    setSelectedStore(null);
    setDocs([]);
    setActivity([]);
    setTab("documents");
  };

  /* ========== DOCUMENT-LEVEL ACTIONS ========== */

  // Approve a single document: change Pending -> Approved (UI + Firestore)
  const onApproveDoc = async (docId, e) => {
    e?.stopPropagation();
    if (!selectedStore) return;

    try {
      await updateDoc(
        doc(db, "stores", selectedStore.id, "documents", docId),
        {
          status: "Approved",
          updatedAt: serverTimestamp(),
          updatedBy: currentUser?.uid || null,
        }
      );

      // Update UI immediately
      setDocs((prev) =>
        prev.map((d) =>
          d.id === docId ? { ...d, status: "Approved", reason: "" } : d
        )
      );

      await addDoc(
        collection(db, "stores", selectedStore.id, "verificationLogs"),
        {
          action: `Document ${docId} approved`,
          timestamp: serverTimestamp(),
          performedBy: currentUser?.uid || null,
        }
      );
    } catch (err) {
      console.error("Approve doc error:", err);
    }
  };

  // Reject a single document: change Pending -> Rejected (UI + Firestore)
  const onRejectDoc = async (docId, e) => {
    e?.stopPropagation();
    if (!selectedStore) return;

    const reason =
      window.prompt(
        "Enter rejection reason (shown to the store owner):",
        ""
      ) || "";

    try {
      await updateDoc(
        doc(db, "stores", selectedStore.id, "documents", docId),
        {
          status: "Rejected",
          remark: reason,
          rejectionReason: reason,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser?.uid || null,
        }
      );

      setDocs((prev) =>
        prev.map((d) =>
          d.id === docId
            ? { ...d, status: "Rejected", reason }
            : d
        )
      );

      await addDoc(
        collection(db, "stores", selectedStore.id, "verificationLogs"),
        {
          action: `Document ${docId} rejected${
            reason ? `: ${reason}` : ""
          }`,
          timestamp: serverTimestamp(),
          performedBy: currentUser?.uid || null,
        }
      );
    } catch (err) {
      console.error("Reject doc error:", err);
    }
  };

  /* ========== STORE-LEVEL ACTIONS ========== */

  const allDocsApproved = useMemo(
    () =>
      docs.length > 0 &&
      docs.every((d) => d.status === "Approved"),
    [docs]
  );

  const onApproveStore = async () => {
    if (!selectedStore || !allDocsApproved) return;

    try {
      const sref = doc(db, "stores", selectedStore.id);

      await updateDoc(sref, {
        verificationStatus: "Approved",
        "verification.status": "approved",
        "verification.approvedAt": serverTimestamp(),
        "verification.approvedBy": currentUser?.uid || null,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser?.uid || null,
      });

      if (selectedStore.ownerId) {
        await updateDoc(doc(db, "users", selectedStore.ownerId), {
          verificationStatus: "Approved",
          updatedAt: serverTimestamp(),
        });
      }

      await addDoc(
        collection(db, "stores", selectedStore.id, "verificationLogs"),
        {
          action: "Store approved",
          timestamp: serverTimestamp(),
          performedBy: currentUser?.uid || null,
        }
      );

      // Reflect in table
      setStores((prev) =>
        prev.map((s) =>
          s.id === selectedStore.id
            ? { ...s, verificationStatus: "Approved" }
            : s
        )
      );

      closeModal();
    } catch (err) {
      console.error("Approve store error:", err);
    }
  };

  const onRejectStore = async () => {
    if (!selectedStore) return;

    const reason =
      window.prompt(
        "Reason for rejecting this store (shown to owner):",
        ""
      ) || "";

    try {
      const sref = doc(db, "stores", selectedStore.id);

      await updateDoc(sref, {
        verificationStatus: "Rejected",
        "verification.status": "rejected",
        "verification.reason": reason,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser?.uid || null,
      });

      if (selectedStore.ownerId) {
        await updateDoc(doc(db, "users", selectedStore.ownerId), {
          verificationStatus: "Rejected",
          updatedAt: serverTimestamp(),
        });
      }

      await addDoc(
        collection(db, "stores", selectedStore.id, "verificationLogs"),
        {
          action: `Store rejected${reason ? `: ${reason}` : ""}`,
          timestamp: serverTimestamp(),
          performedBy: currentUser?.uid || null,
        }
      );

      setStores((prev) =>
        prev.map((s) =>
          s.id === selectedStore.id
            ? { ...s, verificationStatus: "Rejected" }
            : s
        )
      );

      closeModal();
    } catch (err) {
      console.error("Reject store error:", err);
    }
  };

  /* ========== GUARDS ========== */

  if (authLoading) return null;

  if (!hasPermission("VERIFY_DOCS")) {
    return (
      <div className={styles.page}>
        <div className={styles.denied}>Access Denied</div>
      </div>
    );
  }

  /* ========== RENDER ========== */

  return (
    <div className={styles.page}>
      {/* Filters */}
      <form
        className={styles.filters}
        onSubmit={(e) => {
          e.preventDefault();
          loadStores();
        }}
      >
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
          <button className={styles.searchBtn} type="submit">
            Search
          </button>
        </div>

        <div className={styles.selectWrap}>
          <label>Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="submitted">Submitted</option>
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
                <tr>
                  <td colSpan="7" className={styles.empty}>
                    No stores found.
                  </td>
                </tr>
              )}

              {stores.map((s) => {
                const created = toDate(s.createdAt);
                return (
                  <tr
                    key={s.id}
                    className={styles.row}
                    onClick={() => openModal(s)}
                  >
                    <td>
                      <div className={styles.primary}>
                        <div className={styles.logo}>
                          {(s.name || "NN").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className={styles.name}>
                            {s.name || "—"}
                          </div>
                          {s.address?.city && (
                            <div className={styles.sub}>
                              {s.address.city}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{s.ownerName || "—"}</td>
                    <td>{s.ownerEmail || "—"}</td>
                    <td>{s.category || "—"}</td>
                    <td>{created ? created.toLocaleDateString() : "—"}</td>
                    <td>
                      <Pill value={s.verificationStatus} />
                    </td>
                    <td className={styles.chev}>
                      <Icon d="M9 6l6 6-6 6" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal */}
      {open && selectedStore && (
        <>
          <div className={styles.backdrop} onClick={closeModal} />

          <section className={styles.sheet}>
            {/* Header */}
            <header className={styles.sheetHead}>
              <div>
                <h3>Store: {selectedStore.name || selectedStore.id}</h3>
              </div>
              <button className={styles.closeBtn} onClick={closeModal}>
                <Icon size={24} d="M18 6L6 18M6 6l12 12" />
              </button>
            </header>

            {/* Tabs */}
            <nav className={styles.tabs}>
              <button
                className={tab === "documents" ? styles.active : ""}
                onClick={() => setTab("documents")}
              >
                Documents
              </button>
              <button
                className={tab === "activity" ? styles.active : ""}
                onClick={() => setTab("activity")}
              >
                Activity
              </button>
              <button
                className={tab === "location" ? styles.active : ""}
                onClick={() => setTab("location")}
              >
                Location
              </button>
              <button
                className={tab === "info" ? styles.active : ""}
                onClick={() => setTab("info")}
              >
                Store Info
              </button>
            </nav>

            {/* Documents Tab */}
            {tab === "documents" && (
              <div className={styles.docList}>
                {docs.length === 0 && (
                  <div className={styles.empty}>
                    No documents uploaded yet.
                  </div>
                )}

                {docs.map((d) => {
                  const uploaded = toDate(d.uploadedAt);

                  return (
                    <div
                      key={d.id}
                      className={styles.docRow}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className={styles.docMeta}>
                        <div className={styles.docThumb} />
                        <div className={styles.docText}>
                          <b>{d.label || prettyLabel(d.id)}</b>
                          <span className={styles.smallMuted}>
                            {uploaded
                              ? `Uploaded ${uploaded.toLocaleString()}`
                              : "—"}
                          </span>
                          {d.status === "Rejected" && d.reason && (
                            <span className={styles.smallMuted}>
                              Reason: {d.reason}
                            </span>
                          )}
                        </div>
                      </div>

                      <Pill value={d.status} />

                      <div className={styles.docActions}>
                        {d.url ? (
                          <a
                            className={styles.ghostBtn}
                            href={d.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Preview
                          </a>
                        ) : (
                          <button
                            className={styles.ghostBtn}
                            disabled
                            onClick={(e) => e.stopPropagation()}
                          >
                            Preview
                          </button>
                        )}

                        {d.status !== "Approved" && (
                          <button
                            className={styles.mintBtn}
                            onClick={(e) => onApproveDoc(d.id, e)}
                          >
                            <Icon d="M5 12l4 4L19 6" /> Approve
                          </button>
                        )}

                        {d.status !== "Rejected" && (
                          <button
                            className={styles.roseBtn}
                            onClick={(e) => onRejectDoc(d.id, e)}
                          >
                            <Icon d="M6 18L18 6M6 6l12 12" /> Reject
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Activity Tab */}
            {tab === "activity" && (
              <ul className={styles.timeline}>
                {activity.length === 0 && (
                  <li>No verification activity yet.</li>
                )}
                {activity.map((a) => {
                  const t = toDate(a.timestamp);
                  return (
                    <li key={a.id}>
                      <span>{t ? t.toLocaleString() : "—"}</span>
                      <b>{a.action}</b>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Location Tab */}
            {tab === "location" && (
              <div className={styles.mapCard}>
                <div className={styles.mapPlaceholder}>Map Preview</div>
                <div className={styles.mapMeta}>
                  <span>
                    Lat: <b>{selectedStore?.geo?.lat ?? "—"}</b>
                  </span>
                  <span>
                    Lng: <b>{selectedStore?.geo?.lng ?? "—"}</b>
                  </span>
                  {selectedStore?.geo?.lat &&
                    selectedStore?.geo?.lng && (
                      <a
                        className={styles.openMaps}
                        href={`https://www.google.com/maps?q=${selectedStore.geo.lat},${selectedStore.geo.lng}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open in Maps
                      </a>
                    )}
                </div>
              </div>
            )}

            {/* Store Info Tab */}
            {tab === "info" && (
              <div className={styles.infoGrid}>
                <div className={styles.infoRow}>
                  <span>Store Name</span>
                  <b>{selectedStore.name || "—"}</b>
                </div>
                <div className={styles.infoRow}>
                  <span>Owner ID</span>
                  <b>{selectedStore.ownerId || "—"}</b>
                </div>
                <div className={styles.infoRow}>
                  <span>Status</span>
                  <Pill value={selectedStore.verificationStatus} />
                </div>
              </div>
            )}

            {/* Footer */}
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
