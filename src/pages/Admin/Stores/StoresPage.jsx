// src/pages/Admin/Stores/StoresPage.jsx

import { useEffect, useState } from "react";
import {
  listStores,
  setStoreStatus,
  deleteStore,
  getStoreDocuments,
  getStoreVerificationLogs,
} from "./storeService";
import styles from "./stores.module.css";

/* Small stroke icon */
function Icon({ d, size = 18, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
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

/* Pills */
function StatusPill({ status }) {
  const map = {
    active: styles.stActive,
    approved: styles.stActive,
    pending: styles.stPending,
    rejected: styles.stRejected,
    suspended: styles.stSuspended,
    flagged: styles.stPending,
  };
  return (
    <span className={`${styles.stPill} ${map[status] || ""}`}>{status}</span>
  );
}

function formatDate(d) {
  const dt = new Date(d);
  return dt.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ========= Pagination helpers inlined here ========= */

/** Build page list with ellipses: [1, '…', 4, 5, 6, '…', 20] */
function buildRange(current, total, siblingCount = 1) {
  const totalNumbers = siblingCount * 2 + 5; // first,last,current, 2*siblings
  if (total <= totalNumbers)
    return Array.from({ length: total }, (_, i) => i + 1);

  const left = Math.max(current - siblingCount, 1);
  const right = Math.min(current + siblingCount, total);

  const showLeftDots = left > 2;
  const showRightDots = right < total - 1;

  const out = [];
  if (!showLeftDots && showRightDots) {
    const rangeEnd = 1 + 2 * siblingCount + 2;
    for (let i = 1; i <= rangeEnd; i++) out.push(i);
    out.push("…", total);
  } else if (showLeftDots && !showRightDots) {
    out.push(1, "…");
    const start = total - (2 * siblingCount + 2);
    for (let i = start; i <= total; i++) out.push(i);
  } else {
    out.push(1, "…");
    for (let i = left; i <= right; i++) out.push(i);
    out.push("…", total);
  }
  return out;
}

function Pagination({
  current,
  total, // total pages
  onChange,
  siblingCount = 1,
  className = "",
}) {
  const range = buildRange(current, total, siblingCount);
  const go = (p) => p !== current && p >= 1 && p <= total && onChange?.(p);

  return (
    <nav
      className={`${styles.pager} ${className}`}
      role="navigation"
      aria-label="Pagination"
    >
      <button
        className={styles.ctrl}
        onClick={() => go(current - 1)}
        disabled={current === 1}
        aria-label="Previous page"
      >
        ‹
      </button>

      {range.map((it, i) =>
        it === "…" ? (
          <span key={`dots-${i}`} className={styles.dots} aria-hidden>
            …
          </span>
        ) : (
          <button
            key={it}
            className={`${styles.page} ${
              it === current ? styles.active : ""
            }`}
            onClick={() => go(it)}
            aria-current={it === current ? "page" : undefined}
          >
            {it}
          </button>
        )
      )}

      <button
        className={styles.ctrl}
        onClick={() => go(current + 1)}
        disabled={current === total}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  );
}

/* ========= Stores page ========= */

export default function StoresPage() {
  const [search, setSearch] = useState("");
  // default to approved stores
  const [status, setStatus] = useState("approved");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [selected, setSelected] = useState(null);

  // docs & activity for selected store
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const load = async (targetPage = 1) => {
    setLoading(true);
    const data = await listStores({
      status,
      search,
      page: targetPage,
      pageSize,
      cursor: (targetPage - 1) * pageSize,
    });
    setLoading(false);

    const { items = [], total: t, nextCursor } = data || {};
    setRows(items);
    setPage(targetPage);

    if (typeof t === "number") setTotal(t);
    else {
      const inferred =
        nextCursor != null
          ? Math.max(
              targetPage * pageSize + 1,
              (targetPage - 1) * pageSize + items.length
            )
          : (targetPage - 1) * pageSize + items.length;
      setTotal(inferred);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const onSearch = (e) => {
    e.preventDefault();
    load(1);
  };

  const suspend = async (id) => {
    await setStoreStatus(id, "suspended");
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status: "suspended" } : x)));
  };
  const unsuspend = async (id) => {
    await setStoreStatus(id, "active");
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status: "active" } : x)));
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this store? This cannot be undone.")) return;
    await deleteStore(id);
    setRows((r) => r.filter((x) => x.id !== id));
  };

  // Close drawer with Esc
  useEffect(() => {
    if (!selected) return;
    const onKey = (e) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  // Load documents from /stores/{id}/documents
  useEffect(() => {
    if (!selected?.id) {
      setDocs([]);
      setDocsLoading(false);
      return;
    }

    let cancelled = false;
    setDocsLoading(true);

    (async () => {
      try {
        const list = await getStoreDocuments(selected.id);
        if (!cancelled) setDocs(list);
      } catch (e) {
        console.error("[StoresPage] getStoreDocuments error:", e);
        if (!cancelled) setDocs([]);
      } finally {
        if (!cancelled) setDocsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selected?.id]);

  // Load verification logs from /stores/{id}/verificationLogs
  useEffect(() => {
    if (!selected?.id) {
      setLogs([]);
      setLogsLoading(false);
      return;
    }

    let cancelled = false;
    setLogsLoading(true);

    (async () => {
      try {
        const list = await getStoreVerificationLogs(selected.id);
        if (!cancelled) setLogs(list);
      } catch (e) {
        console.error("[StoresPage] getStoreVerificationLogs error:", e);
        if (!cancelled) setLogs([]);
      } finally {
        if (!cancelled) setLogsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selected?.id]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const openDrawer = (s) => setSelected(s);

  const handleViewDoc = (doc) => {
    if (!doc.url) {
      alert("No file URL found for this document.");
      return;
    }
    window.open(doc.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={styles.page}>
      {/* Filters */}
      <form className={styles.filters} onSubmit={onSearch}>
        <div className={styles.searchWrap}>
          {/* input with leading search icon */}
          <div className={styles.searchField}>
            <Icon
              d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"
              size={18}
              className={styles.searchIcon}
            />
            <input
              className={styles.input}
              placeholder="Search by store, owner, city…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* button with search icon */}
          <button className={styles.searchBtn} type="submit">
            <Icon
              d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"
              size={16}
              className={styles.btnIcon}
            />
            <span className={styles.btnText}>Search</span>
          </button>
        </div>

        <div className={styles.selectWrap}>
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="approved">Approved</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </form>

      {/* Table */}
      <section className={styles.card}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Store</th>
                <th className={styles.colOwner}>Owner</th>
                <th className={styles.colCity}>City</th>
                <th>Status</th>
                <th className={styles.colJoined}>Joined</th>
                <th style={{ width: 300 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className={styles.empty}>
                    No stores match your filters.
                  </td>
                </tr>
              )}
              {rows.map((s) => (
                <tr
                  key={s.id}
                  className={styles.row}
                  onClick={() => openDrawer(s)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") && openDrawer(s)
                  }
                >
                  <td>
                    <button
                      type="button"
                      className={`${styles.primaryCell} ${styles.clickable}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openDrawer(s);
                      }}
                    >
                      <div className={styles.logo}>{s.name.slice(0, 2)}</div>
                      <div className={styles.nameWrap}>
                        <div className={styles.name}>{s.name}</div>
                        <div className={styles.sub}>{s.category}</div>
                      </div>
                    </button>
                  </td>
                  <td className={styles.colOwner}>{s.owner}</td>
                  <td className={styles.colCity}>{s.city}</td>
                  <td>
                    <StatusPill status={s.status} />
                  </td>
                  <td className={styles.colJoined}>
                    {formatDate(s.joinedAt)}
                  </td>
                  <td
                    className={styles.actions}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className={styles.iconGhost}
                      title="View"
                      onClick={() => openDrawer(s)}
                      aria-label={`View ${s.name}`}
                    >
                      <Icon d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Zm11 4a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                    </button>
                    {s.status === "suspended" ? (
                      <button
                        className={`${styles.mint} ${styles.fixedBtn}`}
                        onClick={() => unsuspend(s.id)}
                      >
                        Unsuspend
                      </button>
                    ) : (
                      <button
                        className={`${styles.slate} ${styles.fixedBtn}`}
                        onClick={() => suspend(s.id)}
                      >
                        Suspend
                      </button>
                    )}
                    <button
                      className={`${styles.danger} ${styles.fixedBtn}`}
                      onClick={() => remove(s.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.footer}>
          <Pagination
            current={page}
            total={totalPages}
            onChange={(p) => load(p)}
          />
        </div>
      </section>

      {selected && (
        <>
          <div
            className={styles.backdrop}
            onClick={() => setSelected(null)}
          />
          <aside
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
          >
            <header className={styles.drawerHead}>
              <div>
                <div className={styles.drawerTitle}>{selected.name}</div>
                <div className={styles.drawerSub}>{selected.address}</div>
              </div>
              <button
                className={styles.iconBtn}
                onClick={() => setSelected(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </header>

            <div className={styles.drawerBody}>
              {/* Store info */}
              <section className={styles.infoCard}>
                <div className={styles.infoGrid}>
                  <div>
                    <span>Owner</span>
                    <b>{selected.owner}</b>
                  </div>
                  <div>
                    <span>City</span>
                    <b>{selected.city}</b>
                  </div>
                  <div>
                    <span>GSTIN</span>
                    <b>{selected.gstin || "—"}</b>
                  </div>
                  <div>
                    <span>License</span>
                    <b>{selected.licenseNo || "—"}</b>
                  </div>
                  <div>
                    <span>Phone</span>
                    <b>{selected.phone || "—"}</b>
                  </div>
                  <div>
                    <span>Email</span>
                    <b>{selected.email || "—"}</b>
                  </div>
                </div>
              </section>

              {/* Documents */}
              <section className={styles.docsCard}>
                <h4>Documents</h4>
                <ul className={styles.docList}>
                  {docsLoading && (
                    <li className={styles.empty}>Loading documents…</li>
                  )}

                  {!docsLoading &&
                    docs.map((d) => (
                      <li key={d.id} className={styles.docItem}>
                        <div className={styles.docThumb} />
                        <div className={styles.docMeta}>
                          <div className={styles.docName}>{d.name}</div>
                          <StatusPill status={d.status} />
                        </div>
                        <div className={styles.docBtns}>
                          <button
                            className={styles.ghost}
                            type="button"
                            onClick={() => handleViewDoc(d)}
                          >
                            View
                          </button>
                        </div>
                      </li>
                    ))}

                  {!docsLoading && docs.length === 0 && (
                    <li className={styles.empty}>No documents uploaded.</li>
                  )}
                </ul>
              </section>

              {/* Activity log from verificationLogs */}
              <section className={styles.activity}>
                <h4>Activity Log</h4>
                <ul className={styles.timeline}>
                  {logsLoading && (
                    <li className={styles.empty}>Loading activity…</li>
                  )}

                  {!logsLoading &&
                    logs.map((a) => (
                      <li key={a.id}>
                        <span>
                          {a.ts ? new Date(a.ts).toLocaleString() : "—"}
                        </span>
                        <b>{a.text || "—"}</b>
                      </li>
                    ))}

                  {!logsLoading && logs.length === 0 && (
                    <li className={styles.empty}>No activity yet.</li>
                  )}
                </ul>
              </section>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
