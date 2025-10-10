import { useEffect, useState } from "react";
import { listStores, setStoreStatus, deleteStore } from "../../../services/storeService";
import Pagination from "../../../components/Pagination";
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
      <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
  };
  return <span className={`${styles.stPill} ${map[status] || ""}`}>{status}</span>;
}

function formatDate(d) {
  const dt = new Date(d);
  return dt.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

export default function StoresPage() {
  // filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  // table + pagination
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // drawer
  const [selected, setSelected] = useState(null);

  const load = async (targetPage = 1) => {
    setLoading(true);
    const data = await listStores({
      status,
      search,
      page: targetPage,
      pageSize,
      cursor: (targetPage - 1) * pageSize, // harmless for page-based services
    });
    setLoading(false);

    const { items = [], total: t, nextCursor } = data || {};
    setRows(items);
    setPage(targetPage);

    if (typeof t === "number") setTotal(t);
    else {
      const inferred =
        nextCursor != null
          ? Math.max(targetPage * pageSize + 1, (targetPage - 1) * pageSize + items.length)
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

  /* Actions */
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

  // close drawer on ESC
  useEffect(() => {
    if (!selected) return;
    const onKey = (e) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const openDrawer = (s) => setSelected(s);

  return (
    <div className={styles.page}>
      {/* Filters */}
      <form className={styles.filters} onSubmit={onSearch}>
        <div className={styles.searchWrap}>
          <input
            className={styles.input}
            placeholder="Search by store, owner, city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className={styles.searchBtn} type="submit">Search</button>
        </div>
        <div className={styles.selectWrap}>
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All</option>
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
                <th>Owner</th>
                <th>City</th>
                <th>Status</th>
                <th>Joined</th>
                <th style={{ width: 300 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className={styles.empty}>No stores match your filters.</td>
                </tr>
              )}

              {rows.map((s) => (
                <tr
                  key={s.id}
                  className={styles.row}
                  onClick={() => openDrawer(s)}           /* click row to open */
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openDrawer(s)}
                >
                  <td>
                    <button
                      type="button"
                      className={`${styles.primaryCell} ${styles.clickable}`}
                      onClick={(e) => { e.stopPropagation(); openDrawer(s); }}  /* also click avatar/name */
                    >
                      <div className={styles.logo}>{s.name.slice(0, 2)}</div>
                      <div className={styles.nameWrap}>
                        <div className={styles.name}>{s.name}</div>
                        <div className={styles.sub}>{s.category}</div>
                      </div>
                    </button>
                  </td>

                  <td>{s.owner}</td>
                  <td>{s.city}</td>
                  <td><StatusPill status={s.status} /></td>
                  <td>{formatDate(s.joinedAt)}</td>

                  <td className={styles.actions} onClick={(e) => e.stopPropagation()}>
                    {/* tiny eye icon only for small screens (CSS hides it on desktop) */}
                    <button
                      className={styles.iconGhost}
                      title="View"
                      onClick={() => openDrawer(s)}
                      aria-label={`View ${s.name}`}
                    >
                      <Icon d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Zm11 4a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                    </button>

                    {s.status === "suspended" ? (
                      <button className={`${styles.mint} ${styles.fixedBtn}`} onClick={() => unsuspend(s.id)}>
                        Unsuspend
                      </button>
                    ) : (
                      <button className={`${styles.slate} ${styles.fixedBtn}`} onClick={() => suspend(s.id)}>
                        Suspend
                      </button>
                    )}

                    <button className={`${styles.danger} ${styles.fixedBtn}`} onClick={() => remove(s.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={styles.footer}>
          <Pagination current={page} total={totalPages} onChange={(p) => load(p)} />
        </div>
      </section>

      {/* Drawer */}
      {selected && (
        <>
          <div className={styles.backdrop} onClick={() => setSelected(null)} />
          <aside className={styles.drawer} role="dialog" aria-modal="true">
            <header className={styles.drawerHead}>
              <div>
                <div className={styles.drawerTitle}>{selected.name}</div>
                <div className={styles.drawerSub}>{selected.address}</div>
              </div>
              <button className={styles.iconBtn} onClick={() => setSelected(null)} aria-label="Close">✕</button>
            </header>

            <div className={styles.drawerBody}>
              {/* Info */}
              <section className={styles.infoCard}>
                <div className={styles.infoGrid}>
                  <div><span>Owner</span><b>{selected.owner}</b></div>
                  <div><span>City</span><b>{selected.city}</b></div>
                  <div><span>GSTIN</span><b>{selected.gstin || "—"}</b></div>
                  <div><span>License</span><b>{selected.licenseNo || "—"}</b></div>
                  <div><span>Phone</span><b>{selected.phone || "—"}</b></div>
                  <div><span>Email</span><b>{selected.email || "—"}</b></div>
                </div>
              </section>

              {/* Documents */}
              <section className={styles.docsCard}>
                <h4>Documents</h4>
                <ul className={styles.docList}>
                  {(selected.docs || []).map((d) => (
                    <li key={d.id} className={styles.docItem}>
                      <div className={styles.docThumb} />
                      <div className={styles.docMeta}>
                        <div className={styles.docName}>{d.name}</div>
                        <StatusPill status={d.status} />
                      </div>
                      <div className={styles.docBtns}>
                        <button className={styles.ghost}>View</button>
                      </div>
                    </li>
                  ))}
                  {(selected.docs || []).length === 0 && (
                    <li className={styles.empty}>No documents uploaded.</li>
                  )}
                </ul>
              </section>

              {/* Activity */}
              <section className={styles.activity}>
                <h4>Activity Log</h4>
                <ul className={styles.timeline}>
                  {(selected.activity || []).map((a, i) => (
                    <li key={i}>
                      <span>{new Date(a.ts).toLocaleString()}</span>
                      <b>{a.text}</b>
                    </li>
                  ))}
                  {(selected.activity || []).length === 0 && (
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
