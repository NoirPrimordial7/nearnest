import { useEffect, useMemo, useState } from "react";
import { listStores, setStoreStatus } from "../../../services/storeService";
import styles from "./stores.module.css";

function StatusPill({ status }) {
  const map = {
    active: styles.stActive,
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
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = async ({ reset = false } = {}) => {
    setLoading(true);
    const { items, nextCursor } = await listStores({
      status,
      pageSize: 10,
      cursor: reset ? 0 : cursor ?? 0,
      search,
    });
    setLoading(false);

    if (reset) setRows(items);
    else setRows((r) => [...r, ...items]);

    setCursor(nextCursor);
  };

  useEffect(() => {
    load({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const onSearch = (e) => {
    e.preventDefault();
    load({ reset: true });
  };

  const approve = async (id) => {
    await setStoreStatus(id, "active");
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status: "active" } : x)));
  };
  const reject = async (id) => {
    await setStoreStatus(id, "rejected");
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status: "rejected" } : x)));
  };
  const suspend = async (id) => {
    await setStoreStatus(id, "suspended");
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status: "suspended" } : x)));
  };

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
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
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
                <th style={{ width: 260 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className={styles.empty}>No stores match your filters.</td>
                </tr>
              )}
              {rows.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className={styles.primaryCell}>
                      <div className={styles.logo}>{s.name.slice(0, 2)}</div>
                      <div>
                        <div className={styles.name}>{s.name}</div>
                        <div className={styles.sub}>{s.category}</div>
                      </div>
                    </div>
                  </td>
                  <td>{s.owner}</td>
                  <td>{s.city}</td>
                  <td><StatusPill status={s.status} /></td>
                  <td>{formatDate(s.joinedAt)}</td>
                  <td className={styles.actions}>
                    <button className={styles.ghost} onClick={() => setSelected(s)}>View</button>
                    {s.status !== "active" && (
                      <button className={styles.mint} onClick={() => approve(s.id)}>Approve</button>
                    )}
                    {s.status !== "rejected" && (
                      <button className={styles.rose} onClick={() => reject(s.id)}>Reject</button>
                    )}
                    {s.status === "active" && (
                      <button className={styles.slate} onClick={() => suspend(s.id)}>Suspend</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.footer}>
          <button
            className={styles.loadMore}
            onClick={() => load({ reset: false })}
            disabled={!cursor || loading}
          >
            {cursor ? (loading ? "Loading…" : "Load more") : "No more results"}
          </button>
        </div>
      </section>

      {/* Drawer */}
      {selected && (
        <>
          <div className={styles.backdrop} onClick={() => setSelected(null)} />
          <aside className={styles.drawer}>
            <header className={styles.drawerHead}>
              <div>
                <div className={styles.drawerTitle}>{selected.name}</div>
                <div className={styles.drawerSub}>{selected.address}</div>
              </div>
              <button className={styles.iconBtn} onClick={() => setSelected(null)}>✕</button>
            </header>

            <div className={styles.drawerBody}>
              <section className={styles.infoCard}>
                <div className={styles.infoGrid}>
                  <div><span>Owner</span><b>{selected.owner}</b></div>
                  <div><span>City</span><b>{selected.city}</b></div>
                  <div><span>GSTIN</span><b>{selected.gstin}</b></div>
                  <div><span>License</span><b>{selected.licenseNo}</b></div>
                  <div><span>Phone</span><b>{selected.phone}</b></div>
                  <div><span>Email</span><b>{selected.email}</b></div>
                </div>
              </section>

              <section className={styles.docsCard}>
                <h4>Documents</h4>
                <ul className={styles.docList}>
                  {selected.docs.map((d) => (
                    <li key={d.id} className={styles.docItem}>
                      <div className={styles.docThumb} />
                      <div className={styles.docMeta}>
                        <div className={styles.docName}>{d.name}</div>
                        <StatusPill status={d.status} />
                      </div>
                      <div className={styles.docBtns}>
                        <button className={styles.ghost}>View</button>
                        {d.status !== "approved" && <button className={styles.mint}>Approve</button>}
                        {d.status !== "rejected" && <button className={styles.rose}>Reject</button>}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <section className={styles.activity}>
                <h4>Activity Log</h4>
                <ul className={styles.timeline}>
                  {selected.activity.map((a, i) => (
                    <li key={i}>
                      <span>{new Date(a.ts).toLocaleString()}</span>
                      <b>{a.text}</b>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
