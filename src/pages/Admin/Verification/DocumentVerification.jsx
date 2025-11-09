// src/pages/Admin/Verification/DocumentVerification.jsx
import React, { useEffect, useState, useMemo } from "react";
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
  const v = (value || "").toLowerCase();
  const cls =
    v === "approved"
      ? styles.pApproved
      : v === "rejected"
      ? styles.pRejected
      : v === "flagged"
      ? styles.pFlagged
      : styles.pPending;
  return (
    <span className={`${styles.pill} ${cls}`}>
      {v ? v[0].toUpperCase() + v.slice(1) : "Pending"}
    </span>
  );
}

const prettyLabel = (id) => {
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
};

const toDate = (ts) => {
  if (!ts) return null;
  if (typeof ts?.toMillis === "function") return new Date(ts.toMillis());
  if (typeof ts?.toDate === "function") return ts.toDate();
  if (typeof ts === "number") return new Date(ts);
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
};

export default function DocumentVerification() {
  const { hasPermission, authLoading } = useAuth();
  const currentUser = auth.currentUser;

  const [statusFilter, setStatusFilter] = useState("submitted");
  const [queryText, setQueryText] = useState("");
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedStore, setSelectedStore] = useState(null);
  const [docs, setDocs] = useState([]);
  const [activity, setActivity] = useState([]); // 🔹 verification logs
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("documents");

  const normalizeStatus = (s) => (s || "").toLowerCase();
  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s);

  async function loadStores() {
    setLoading(true);
    try {
      const filters = [];
      if (statusFilter !== "all") {
        filters.push(where("verificationStatus", "==", cap(statusFilter)));
      }
      const base = collection(db, "stores");
      let qRef;
      const text = queryText.trim();
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
      const items = [];
      for (const d of snap.docs) {
        const data = d.data();
        const store = {
          id: d.id,
          ...data,
          verificationStatus:
            data.verificationStatus || data?.verification?.status || "pending",
        };

        // attach owner details
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
            /* ignore */
          }
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

  useEffect(() => {
    loadStores();
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const openModal = async (store) => {
    setSelectedStore(store);
    setOpen(true);
    setTab("documents");
    setDocs([]);
    setActivity([]);

    try {
      // 🔹 Fetch documents
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
          uploadedAt: v.uploadedAt || v.createdAt || v.timestamp,
          rejectionReason: v.rejectionReason || "",
          flaggedReason: v.flaggedReason || "",
        };
      });
      setDocs(list);
    } catch (e) {
      console.error("[DocumentVerification] fetch docs error:", e);
    }

    try {
      // 🔹 Fetch verification logs (activity)
      const logSnap = await getDocs(
        query(
          collection(db, "stores", store.id, "verificationLogs"),
          orderBy("timestamp", "desc")
        )
      );
      const logs = logSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() || {}),
      }));
      setActivity(logs);
    } catch (e) {
      console.error("[DocumentVerification] fetch logs error:", e);
    }
  };

  const closeModal = () => {
    setOpen(false);
    setSelectedStore(null);
    setDocs([]);
    setActivity([]);
  };

  // ---------- Document actions ----------
  const onApproveDoc = async (docId) => {
    if (!selectedStore) return;
    try {
      await updateDoc(
        doc(db, "stores", selectedStore.id, "documents", docId),
        {
          status: "approved",
          updatedAt: serverTimestamp(),
          updatedBy: currentUser?.uid || null,
        }
      );
      setDocs((prev) =>
        prev.map((d) =>
          d.id === docId ? { ...d, status: "approved" } : d
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
      // refresh activity in UI
      setActivity((prev) => [
        {
          id: `local-${Date.now()}`,
          action: `Document ${docId} approved`,
          timestamp: serverTimestamp(),
          performedBy: currentUser?.uid || null,
        },
        ...prev,
      ]);
    } catch (e) {
      console.error("Approve doc error:", e);
    }
  };

  const onRejectDoc = async (docId) => {
    if (!selectedStore) return;
    const reason = window.prompt("Enter rejection reason (optional):", "");
    if (reason === null) return;
    try {
      await updateDoc(
        doc(db, "stores", selectedStore.id, "documents", docId),
        {
          status: "rejected",
          rejectionReason: reason || "",
          updatedAt: serverTimestamp(),
          updatedBy: currentUser?.uid || null,
        }
      );
      setDocs((prev) =>
        prev.map((d) =>
          d.id === docId
            ? { ...d, status: "rejected", rejectionReason: reason || "" }
            : d
        )
      );

      await updateDoc(doc(db, "stores", selectedStore.id), {
        verificationStatus: "Rejected",
        "verification.status": "rejected",
        "verification.reason": reason || "",
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
          action: `Store rejected due to document ${docId} rejection${
            reason ? `. Reason: ${reason}` : ""
          }`,
          timestamp: serverTimestamp(),
          performedBy: currentUser?.uid || null,
        }
      );

      closeModal();
      loadStores();
    } catch (e) {
      console.error("Reject doc error:", e);
    }
  };

  const onFlagDoc = async (docId) => {
    if (!selectedStore) return;
    const reason = window.prompt("Flag reason (optional):", "");
    if (reason === null) return;
    try {
      await updateDoc(
        doc(db, "stores", selectedStore.id, "documents", docId),
        {
          status: "flagged",
          flaggedReason: reason || "",
          updatedAt: serverTimestamp(),
          updatedBy: currentUser?.uid || null,
        }
      );
      setDocs((prev) =>
        prev.map((d) =>
          d.id === docId
            ? { ...d, status: "flagged", flaggedReason: reason || "" }
            : d
        )
      );
      await addDoc(
        collection(db, "stores", selectedStore.id, "verificationLogs"),
        {
          action: `Document ${docId} flagged for re-check${
            reason ? `. Reason: ${reason}` : ""
          }`,
          timestamp: serverTimestamp(),
          performedBy: currentUser?.uid || null,
        }
      );
    } catch (e) {
      console.error("Flag doc error:", e);
    }
  };

  // ---------- Store actions ----------
  const allDocsApproved = useMemo(
    () => docs.length > 0 && docs.every((d) => d.status === "approved"),
    [docs]
  );

  const onApproveStore = async () => {
    if (!selectedStore || !allDocsApproved) return;
    try {
      await updateDoc(doc(db, "stores", selectedStore.id), {
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
          action: `Store approved`,
          timestamp: serverTimestamp(),
          performedBy: currentUser?.uid || null,
        }
      );
      closeModal();
      loadStores();
    } catch (e) {
      console.error("Approve store error:", e);
    }
  };

  const onRejectStore = async () => {
    if (!selectedStore) return;
    const reason = window.prompt(
      "Reason for rejecting this store:",
      ""
    );
    if (reason === null) return;
    try {
      await updateDoc(doc(db, "stores", selectedStore.id), {
        verificationStatus: "Rejected",
        "verification.status": "rejected",
        "verification.reason": reason || "",
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
          action: `Store rejected${reason ? `. Reason: ${reason}` : ""}`,
          timestamp: serverTimestamp(),
          performedBy: currentUser?.uid || null,
        }
      );
      closeModal();
      loadStores();
    } catch (e) {
      console.error("Reject store error:", e);
    }
  };

  const onFlagStore = async () => {
    if (!selectedStore) return;
    const reason = window.prompt(
      "Reason to flag this store for re-check:",
      ""
    );
    if (reason === null) return;
    try {
      await updateDoc(doc(db, "stores", selectedStore.id), {
        verificationStatus: "Flagged",
        "verification.status": "flagged",
        "verification.reason": reason || "",
        updatedAt: serverTimestamp(),
        updatedBy: currentUser?.uid || null,
      });
      await addDoc(
        collection(db, "stores", selectedStore.id, "verificationLogs"),
        {
          action: `Store flagged for re-check${
            reason ? `. Reason: ${reason}` : ""
          }`,
          timestamp: serverTimestamp(),
          performedBy: currentUser?.uid || null,
        }
      );
      closeModal();
      loadStores();
    } catch (e) {
      console.error("Flag store error:", e);
    }
  };

  if (authLoading) return null;
  if (!hasPermission("VERIFY_DOCS"))
    return <div className={styles.page}>Access Denied</div>;

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
            <option value="flagged">Flagged</option>
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
                          {(s.name || "NN").slice(0, 2)}
                        </div>
                        <div>
                          <div className={styles.name}>{s.name || "—"}</div>
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
                    <td>
                      {created ? created.toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <Pill value={s.verificationStatus || "pending"} />
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

      {/* Slide-over */}
      {open && selectedStore && (
        <>
          <div className={styles.backdrop} onClick={closeModal} />
          <section className={styles.sheet}>
            <header className={styles.sheetHead}>
              <h3>
                Store: {selectedStore.name || selectedStore.id}
              </h3>
              <button
                className={styles.iconBtn}
                onClick={closeModal}
                title="Close"
              >
                <Icon size={20} d="M18 6L6 18M6 6l12 12" />
              </button>
            </header>

            <nav className={styles.tabs}>
              <button
                className={`${styles.tab} ${
                  tab === "documents" ? styles.tabActive : ""
                }`}
                onClick={() => setTab("documents")}
              >
                Documents
              </button>
              <button
                className={`${styles.tab} ${
                  tab === "activity" ? styles.tabActive : ""
                }`}
                onClick={() => setTab("activity")}
              >
                Activity
              </button>
              <button
                className={`${styles.tab} ${
                  tab === "location" ? styles.tabActive : ""
                }`}
                onClick={() => setTab("location")}
              >
                Location
              </button>
              <button
                className={`${styles.tab} ${
                  tab === "info" ? styles.tabActive : ""
                }`}
                onClick={() => setTab("info")}
              >
                Store Info
              </button>
            </nav>

            {/* Documents */}
            {tab === "documents" && (
              <div className={styles.sheetBody}>
                <div className={styles.docList}>
                  {docs.map((d) => {
                    const uploaded = toDate(d.uploadedAt);
                    return (
                      <div key={d.id} className={styles.docRow}>
                        <div className={styles.docMeta}>
                          <div className={styles.docThumb} />
                          <div className={styles.docText}>
                            <b>{d.label || prettyLabel(d.id)}</b>
                            <span className={styles.smallMuted}>
                              {uploaded
                                ? `Uploaded ${uploaded.toLocaleString()}`
                                : "—"}
                            </span>
                            {d.status === "rejected" &&
                              d.rejectionReason && (
                                <span className={styles.smallMuted}>
                                  Reason: {d.rejectionReason}
                                </span>
                              )}
                            {d.status === "flagged" &&
                              d.flaggedReason && (
                                <span className={styles.smallMuted}>
                                  Flagged: {d.flaggedReason}
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
                            >
                              <Icon d="M15 10l4.553-4.553M12 5l-4.5 4.5" />{" "}
                              Preview
                            </a>
                          ) : (
                            <button
                              className={styles.ghostBtn}
                              disabled
                              title="No file"
                            >
                              Preview
                            </button>
                          )}
                          {d.status !== "approved" && (
                            <button
                              className={styles.mintBtn}
                              onClick={() => onApproveDoc(d.id)}
                            >
                              <Icon d="M5 12l4 4L19 6" /> Approve
                            </button>
                          )}
                          {d.status !== "rejected" && (
                            <button
                              className={styles.roseBtn}
                              onClick={() => onRejectDoc(d.id)}
                            >
                              <Icon d="M6 18L18 6M6 6l12 12" /> Reject
                            </button>
                          )}
                          {d.status !== "flagged" && (
                            <button
                              className={styles.warnBtn}
                              onClick={() => onFlagDoc(d.id)}
                            >
                              <Icon d="M12 9v4m0 4h.01M12 3l9 18H3L12 3z" />{" "}
                              Flag
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Activity */}
            {tab === "activity" && (
              <div className={styles.sheetBody}>
                {activity.length === 0 ? (
                  <div className={styles.empty}>No activity yet.</div>
                ) : (
                  <ul className={styles.timeline}>
                    {activity.map((a) => {
                      const t = toDate(a.timestamp);
                      return (
                        <li key={a.id}>
                          <span>
                            {t ? t.toLocaleString() : "—"}
                          </span>
                          <b>{a.action || "—"}</b>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {/* Location */}
            {tab === "location" && (
              <div className={styles.sheetBody}>
                {(() => {
                  const lat = selectedStore.geo?.lat ?? null;
                  const lng = selectedStore.geo?.lng ?? null;
                  return (
                    <div className={styles.mapCard}>
                      <div className={styles.mapPlaceholder}>
                        {lat != null && lng != null ? (
                          <iframe
                            title="Store location map"
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            style={{ border: 0, borderRadius: 14 }}
                            src={`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`}
                            allowFullScreen
                          />
                        ) : (
                          "Map Preview"
                        )}
                      </div>
                      <div className={styles.mapMeta}>
                        <span>
                          Lat: <b>{lat ?? "—"}</b>
                        </span>
                        <span>
                          Lng: <b>{lng ?? "—"}</b>
                        </span>
                        {lat != null && lng != null && (
                          <a
                            className={styles.openMaps}
                            href={`https://www.google.com/maps?q=${lat},${lng}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open in Maps
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Store Info */}
            {tab === "info" && (
              <div className={styles.sheetBody}>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span>Store Name</span>
                    <b>{selectedStore.name || "—"}</b>
                  </div>
                  <div className={styles.infoItem}>
                    <span>Category</span>
                    <b>{selectedStore.category || "—"}</b>
                  </div>
                  <div className={styles.infoItem}>
                    <span>Owner</span>
                    <b>{selectedStore.ownerName || "—"}</b>
                  </div>
                  <div className={styles.infoItem}>
                    <span>Owner Email</span>
                    <b>{selectedStore.ownerEmail || "—"}</b>
                  </div>
                  <div className={styles.infoItemWide}>
                    <span>Address</span>
                    <b>
                      {selectedStore.address?.line1 || ""}{" "}
                      {selectedStore.address?.line2 || ""}{" "}
                      {selectedStore.address?.city || ""}{" "}
                      {selectedStore.address?.state || ""}{" "}
                      {selectedStore.address?.pin || ""}
                    </b>
                  </div>
                  <div className={styles.infoItem}>
                    <span>Phone</span>
                    <b>
                      {selectedStore.phone ||
                        selectedStore.mobile ||
                        "—"}
                    </b>
                  </div>
                  <div className={styles.infoItem}>
                    <span>Verification Status</span>
                    <b>
                      {selectedStore.verificationStatus || "Pending"}
                    </b>
                  </div>
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
                className={styles.warnBtn}
                onClick={onFlagStore}
              >
                Flag Store
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
