import { useEffect, useMemo, useState } from "react";
import styles from "./DocumentVerification.module.css";

// --- tiny inline icon helper (no react-icons) ---
const Icon = ({ d, size = 18, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// status pill
const Pill = ({ value }) => {
  const cls =
    value === "approved" ? styles.pApproved :
    value === "rejected" ? styles.pRejected :
    styles.pPending;
  return <span className={`${styles.pill} ${cls}`}>{value}</span>;
};

// canned reject reasons (edit freely)
const CANNED = [
  "Document unreadable",
  "Name / details mismatch",
  "Expired / invalid",
  "Wrong document type",
  "Please re-upload clearer copy",
];

// ---- Fake service stubs (replace with your real API) ----
/* Expected shapes:
   queue item: { id, store: {...}, docType, uploadedAt, status, docUrl }
   store: { id, name, owner, category, address, gstin, licenseNo, city, pincode, lat, lng, activity: [] , docs: []}
*/
async function fetchVerificationQueue({ q = "", status = "all", page = 1, pageSize = 10 }) {
  // hook up to your backend; here we reuse stores mock if you have it
  const seed = (i) => ({
    id: `row-${page}-${i}`,
    store: {
      id: `store-${i}`,
      name: `Store #NE-${300 + i}`,
      owner: ["Dinesh", "Anita", "Sejal", "Rohit", "Kiran"][i % 5],
      category: ["Pharmacy", "Clinic", "Diagnostics"][i % 3],
      address: "MG Road, Pune",
      city: "Pune",
      pincode: "411001",
      gstin: "22ABCDE1234F1Z5",
      licenseNo: "LIC-10000",
      lat: 18.5167,
      lng: 73.8563,
      activity: [
        { ts: Date.now() - 86400000 * 2, text: "KYC submitted" },
        { ts: Date.now() - 86400000, text: "Document reviewed by admin" },
      ],
      docs: [
        { id: "gst", name: "GST Certificate", status: "pending", url: "", uploadedAt: Date.now() - 86400000 * 4 },
        { id: "drug", name: "Drug License", status: i % 2 ? "approved" : "pending", url: "", uploadedAt: Date.now() - 86400000 * 5 },
        { id: "pan", name: "PAN", status: "pending", url: "", uploadedAt: Date.now() - 86400000 * 6 },
        { id: "addr", name: "Address Proof", status: "pending", url: "", uploadedAt: Date.now() - 86400000 * 3 },
      ],
    },
    docType: ["Address Proof", "Drug License", "PAN", "GST Certificate"][i % 4],
    uploadedAt: Date.now() - 86400000 * (i + 1),
    status: ["pending", "approved", "pending", "pending"][i % 4],
    docUrl: "",
  });

  const items = Array.from({ length: pageSize }, (_, i) => seed(i));
  return { items, total: 42 };
}
async function approveDocument(storeId, docId) { return { ok: true }; }
async function rejectDocument(storeId, docId, reason) { return { ok: true }; }
async function approveStore(storeId) { return { ok: true }; }
// --------------------------------------------------------

export default function DocumentVerification() {
  // filters
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  // table data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  // modal
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("documents");

  const load = async (p = 1) => {
    setLoading(true);
    const { items, total } = await fetchVerificationQueue({ q: query, status, page: p, pageSize });
    setLoading(false);
    setRows(items);
    setTotal(total || items.length);
    setPage(p);
  };

  useEffect(() => { load(1); /* eslint-disable-next-line */ }, [status]);

  const onSearch = (e) => { e.preventDefault(); load(1); };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const openModal = (row) => {
    setSelected(row.store);
    setTab("documents");
    setOpen(true);
  };

  const closeModal = () => setOpen(false);

  // store-level computed
  const allApproved = useMemo(() => {
    if (!selected?.docs?.length) return false;
    return selected.docs.every((d) => d.status === "approved");
  }, [selected]);

  // doc actions (update local UI optimistically)
  const onApproveDoc = async (docId) => {
    if (!selected) return;
    await approveDocument(selected.id, docId);
    setSelected((s) => ({
      ...s,
      docs: s.docs.map((d) => (d.id === docId ? { ...d, status: "approved", _reason: undefined } : d)),
    }));
  };

  const onRejectDoc = async (docId, reason) => {
    if (!selected) return;
    await rejectDocument(selected.id, docId, reason || "");
    setSelected((s) => ({
      ...s,
      docs: s.docs.map((d) => (d.id === docId ? { ...d, status: "rejected", _reason: reason || "" } : d)),
    }));
  };

  const onApproveStore = async () => {
    if (!selected) return;
    await approveStore(selected.id);
    closeModal();
    load(page);
  };

  return (
    <div className={styles.page}>
      {/* Filters */}
      <form className={styles.filters} onSubmit={onSearch}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>
            <Icon d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
          </span>
          <input
            className={styles.input}
            placeholder="Search by store, owner, doc type…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className={styles.searchBtn} type="submit">Search</button>
        </div>

        <div className={styles.selectWrap}>
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
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
                <th>Doc</th>
                <th>Uploaded</th>
                <th>Preview</th>
                <th>Status</th>
                <th style={{ width: 90 }}></th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 && !loading && (
                <tr><td colSpan="6" className={styles.empty}>No results.</td></tr>
              )}

              {rows.map((r) => (
                <tr key={r.id} className={styles.row} onClick={() => openModal(r)}>
                  <td>
                    <div className={styles.primary}>
                      <div className={styles.logo}>St</div>
                      <div>
                        <div className={styles.name}>{r.store.name}</div>
                        <div className={styles.sub}>{r.store.owner}</div>
                      </div>
                    </div>
                  </td>
                  <td>{r.docType}</td>
                  <td>{new Date(r.uploadedAt).toLocaleDateString()}</td>
                  <td className={styles.previewCell}>
                    <span className={styles.eye}>
                      <Icon d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Zm11 4a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                      Preview
                    </span>
                  </td>
                  <td><Pill value={r.status} /></td>
                  <td className={styles.chev}><Icon d="M9 6l6 6-6 6" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* simple pagination */}
        <div className={styles.pager}>
          <button
            className={styles.pageBtn}
            disabled={page <= 1}
            onClick={() => load(page - 1)}
          >‹</button>
          <span className={styles.pageBadge}>{page} / {totalPages}</span>
          <button
            className={styles.pageBtn}
            disabled={page >= totalPages}
            onClick={() => load(page + 1)}
          >›</button>
        </div>
      </section>

      {/* ===== Modal Sheet ===== */}
      {open && selected && (
        <>
          <div className={styles.backdrop} onClick={closeModal} />
          <section className={styles.sheet} role="dialog" aria-modal="true">
            {/* header */}
            <header className={styles.sheetHead}>
              <div className={styles.sheetTitle}>
                <div className={styles.logo}>St</div>
                <div>
                  <h3>{selected.name}</h3>
                  <div className={styles.smallMuted}>{selected.category} • {selected.owner}</div>
                </div>
              </div>

              <button className={styles.iconBtn} onClick={closeModal} aria-label="Close">
                <Icon d="M6 6l12 12M6 18L18 6" />
              </button>
            </header>

            {/* tabs */}
            <nav className={styles.tabs}>
              {["documents", "store", "activity", "location"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
                >
                  {t === "store" ? "Store Info" : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </nav>

            {/* body */}
            <div className={styles.sheetBody}>
              {tab === "store" && (
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}><span>Owner</span><b>{selected.owner}</b></div>
                  <div className={styles.infoItem}><span>Category</span><b>{selected.category}</b></div>
                  <div className={styles.infoItem}><span>GSTIN</span><b>{selected.gstin || "—"}</b></div>
                  <div className={styles.infoItem}><span>License No.</span><b>{selected.licenseNo || "—"}</b></div>
                  <div className={styles.infoItemWide}><span>Address</span><b>{selected.address} • {selected.city} {selected.pincode}</b></div>
                </div>
              )}

              {tab === "documents" && (
                <DocList
                  docs={selected.docs}
                  onApprove={onApproveDoc}
                  onReject={onRejectDoc}
                />
              )}

              {tab === "activity" && (
                <ul className={styles.timeline}>
                  {(selected.activity || []).map((a, i) => (
                    <li key={i}>
                      <span>{new Date(a.ts).toLocaleString()}</span>
                      <b>{a.text}</b>
                    </li>
                  ))}
                </ul>
              )}

              {tab === "location" && (
                <div className={styles.mapCard}>
                  <div className={styles.mapPlaceholder}>Map Preview</div>
                  <div className={styles.mapMeta}>
                    <span>Lat: <b>{selected.lat}</b></span>
                    <span>Lng: <b>{selected.lng}</b></span>
                    <a
                      className={styles.openMaps}
                      href={`https://www.google.com/maps?q=${selected.lat},${selected.lng}`}
                      target="_blank" rel="noreferrer"
                    >
                      Open in Maps
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* footer */}
            <footer className={styles.sheetFoot}>
              <div className={styles.footNote}>
                Approve all required documents to enable final approval.
              </div>
              <button
                className={styles.approveStore}
                disabled={!allApproved}
                onClick={onApproveStore}
              >
                Approve Store
              </button>
            </footer>
          </section>
        </>
      )}
    </div>
  );
}

/* ====== Documents list (with inline reject reason UI) ====== */
function DocList({ docs = [], onApprove, onReject }) {
  const [openReason, setOpenReason] = useState(null);
  const [text, setText] = useState("");

  const startReject = (id) => { setOpenReason(id); setText(""); };
  const cancelReject = () => { setOpenReason(null); setText(""); };
  const confirmReject = (id, reason) => { onReject(id, (reason ?? text).trim()); cancelReject(); };

  return (
    <div className={styles.docList}>
      {docs.map((d) => (
        <div key={d.id} className={styles.docRow}>
          <div className={styles.docMeta}>
            <div className={styles.docThumb} />
            <div className={styles.docText}>
              <b>{d.name}</b>
              <span className={styles.smallMuted}>
                Uploaded {new Date(d.uploadedAt || Date.now()).toLocaleString()}
              </span>
            </div>
          </div>

          <Pill value={d.status} />

          <div className={styles.docActions}>
            <button className={styles.ghostBtn} title="Preview">
              <Icon d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Zm11 4a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
              Preview
            </button>

            {d.status !== "approved" && (
              <button className={styles.mintBtn} onClick={() => onApprove(d.id)}>
                <Icon d="M5 12l4 4L19 6" /> Approve
              </button>
            )}

            {d.status !== "rejected" && (
              <button className={styles.roseBtn} onClick={() => startReject(d.id)}>
                <Icon d="M6 18L18 6M6 6l12 12" /> Reject
              </button>
            )}
          </div>

          {/* inline reject reason */}
          {openReason === d.id && (
            <div className={styles.rejectBox}>
              <div className={styles.chips}>
                {CANNED.map((c) => (
                  <button key={c} className={styles.chip} onClick={() => confirmReject(d.id, c)}>
                    {c}
                  </button>
                ))}
              </div>
              <textarea
                className={styles.reason}
                placeholder="Add a note (optional)…"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className={styles.rejectActions}>
                <button className={styles.roseBtn} onClick={() => confirmReject(d.id)}>
                  Confirm Reject
                </button>
                <button className={styles.ghostBtn} onClick={cancelReject}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
