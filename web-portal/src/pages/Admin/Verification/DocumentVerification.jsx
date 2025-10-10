import React, { useMemo, useState } from "react";
import {
  FaSearch, FaFilter, FaEye, FaCheck, FaTimes, FaFlag, FaArrowRight,
} from "react-icons/fa";
import Pagination from "../../../components/Pagination"; // already used in Stores
import styles from "./DocumentVerification.module.css";

/* ---------- helpers ---------- */
const prettyStatus = (s) =>
  ({ Accepted: "Approved", Pending: "Pending", Rejected: "Rejected", Flagged: "Flagged" }[s] || s);

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ---------- page ---------- */
export default function DocumentVerification() {
  // mock data (replace with API later)
  const [docs, setDocs] = useState([
    { id: 1,  storeName: "Health Plus Pharma", ownerName: "Rahul Sharma",  contact: "9876543210", email: "rahul@example.com",  storeType: "Pharmacy",            uploadDate: "2025-01-10", documentUrl: "https://via.placeholder.com/800x1100", status: "Pending"  },
    { id: 2,  storeName: "CareMed Clinic",     ownerName: "Priya Verma",   contact: "9876501234", email: "priya@example.com",  storeType: "Clinic + Medicals",   uploadDate: "2025-01-15", documentUrl: "https://via.placeholder.com/800x1100", status: "Accepted" },
    { id: 3,  storeName: "MediQuick",          ownerName: "Amit Joshi",    contact: "9876549870", email: "amit@example.com",   storeType: "Pharmacy",            uploadDate: "2025-02-05", documentUrl: "https://via.placeholder.com/800x1100", status: "Rejected" },
    { id: 4,  storeName: "WellCare Pharmacy",  ownerName: "Sneha Patil",   contact: "9876504321", email: "sneha@example.com",  storeType: "Pharmacy",            uploadDate: "2025-02-18", documentUrl: "https://via.placeholder.com/800x1100", status: "Pending"  },
    { id: 5,  storeName: "HealWell Pharma",    ownerName: "Vikram Singh",  contact: "9876512345", email: "vikram@example.com", storeType: "Ayurvedic Medicals",  uploadDate: "2025-03-02", documentUrl: "https://via.placeholder.com/800x1100", status: "Accepted" },
    { id: 6,  storeName: "MediTrust",          ownerName: "Anjali Rao",    contact: "9876540001", email: "anjali@example.com", storeType: "Clinic + Medicals",   uploadDate: "2025-03-20", documentUrl: "https://via.placeholder.com/800x1100", status: "Flagged"  },
    { id: 7,  storeName: "LifeCare Pharmacy",  ownerName: "Rohan Mehta",   contact: "9876541111", email: "rohan@example.com",  storeType: "Pharmacy",            uploadDate: "2025-04-08", documentUrl: "https://via.placeholder.com/800x1100", status: "Pending"  },
    { id: 8,  storeName: "PharmaHub",          ownerName: "Kavita Desai",  contact: "9876542222", email: "kavita@example.com", storeType: "Clinic + Medicals",   uploadDate: "2025-04-25", documentUrl: "https://via.placeholder.com/800x1100", status: "Accepted" },
    { id: 9,  storeName: "QuickMeds",          ownerName: "Saurabh Jain",  contact: "9876543333", email: "saurabh@example.com",storeType: "Pharmacy",            uploadDate: "2025-05-11", documentUrl: "https://via.placeholder.com/800x1100", status: "Rejected" },
    { id: 10, storeName: "TotalCare Pharma",   ownerName: "Neha Kapoor",   contact: "9876544444", email: "neha@example.com",   storeType: "Ayurvedic Medicals",  uploadDate: "2025-05-30", documentUrl: "https://via.placeholder.com/800x1100", status: "Pending"  },
  ]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");   // Pending/Approved/Rejected/Flagged
  const [typeFilter, setTypeFilter]     = useState("");
  const [monthFilter, setMonthFilter]   = useState("");

  const [selectedIds, setSelectedIds]   = useState(new Set());
  const [selectedDoc, setSelectedDoc]   = useState(null);
  const [showDrawer, setShowDrawer]     = useState(false);
  const [tab, setTab]                   = useState("owner");

  // paging (client-side for now)
  const pageSize = 8;
  const [page, setPage] = useState(1);

  /* ---------- filtering ---------- */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return docs.filter((d) => {
      const month = months[new Date(d.uploadDate).getMonth()];
      const matchesQ =
        !q ||
        d.storeName.toLowerCase().includes(q) ||
        d.ownerName.toLowerCase().includes(q) ||
        prettyStatus(d.status).toLowerCase().includes(q) ||
        d.uploadDate.includes(q);
      const matchesStatus = statusFilter ? prettyStatus(d.status) === statusFilter : true;
      const matchesType   = typeFilter ? d.storeType === typeFilter : true;
      const matchesMonth  = monthFilter ? month === monthFilter : true;
      return matchesQ && matchesStatus && matchesType && matchesMonth;
    });
  }, [docs, search, statusFilter, typeFilter, monthFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows   = filtered.slice((page - 1) * pageSize, page * pageSize);

  /* ---------- actions ---------- */
  const openDrawer = (doc) => { setSelectedDoc(doc); setTab("owner"); setShowDrawer(true); };
  const closeDrawer = () => { setShowDrawer(false); setSelectedDoc(null); };

  const approve = (id, withComment = false) => {
    let comment = "";
    if (withComment) comment = window.prompt("Optional comment for approval:", "") || "";
    setDocs((arr) => arr.map((d) => (d.id === id ? { ...d, status: "Accepted", comment } : d)));
  };
  const reject = (id) => {
    const comment = window.prompt("Reason for rejection:", "") || "";
    setDocs((arr) => arr.map((d) => (d.id === id ? { ...d, status: "Rejected", comment } : d)));
  };
  const flag = (id) => setDocs((arr) => arr.map((d) => (d.id === id ? { ...d, status: "Flagged" } : d)));

  // bulk
  const bulkApprove = () => { selectedIds.forEach((id) => approve(id)); setSelectedIds(new Set()); };
  const bulkReject  = () => { selectedIds.forEach((id) => reject(id));  setSelectedIds(new Set()); };
  const bulkFlag    = () => { selectedIds.forEach((id) => flag(id));    setSelectedIds(new Set()); };

  const toggleRow = (id) => {
    setSelectedIds((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const togglePage = (checked) => {
    const idsOnPage = pageRows.map((d) => d.id);
    setSelectedIds((s) => {
      const next = new Set(s);
      idsOnPage.forEach((id) => (checked ? next.add(id) : next.delete(id)));
      return next;
    });
  };

  return (
    <div className={styles.container}>
      <h2>Document Verification</h2>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <FaSearch className={styles.searchIcon} />
          <input
            className={styles.searchBar}
            placeholder="Search by store, owner, status or date…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className={styles.filterWrapper}>
          <FaFilter className={styles.filterIcon} />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Flagged">Flagged</option>
          </select>
        </div>

        <div className={styles.filterWrapper}>
          <FaFilter className={styles.filterIcon} />
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            <option>Pharmacy</option>
            <option>Clinic + Medicals</option>
            <option>Ayurvedic Medicals</option>
          </select>
        </div>

        <div className={styles.filterWrapper}>
          <FaFilter className={styles.filterIcon} />
          <select value={monthFilter} onChange={(e) => { setMonthFilter(e.target.value); setPage(1); }}>
            <option value="">All Months</option>
            {months.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Bulk bar */}
      {selectedIds.size > 0 && (
        <div className={styles.bulkBar}>
          <span>{selectedIds.size} selected</span>
          <div className={styles.bulkActions}>
            <button onClick={bulkApprove} className={styles.approveBtn}><FaCheck /> Approve</button>
            <button onClick={bulkReject}  className={styles.rejectBtn}><FaTimes /> Reject</button>
            <button onClick={bulkFlag}    className={styles.flagBtn}><FaFlag /> Flag</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: 46 }}>
                <input
                  type="checkbox"
                  aria-label="Select page"
                  checked={pageRows.every(r => selectedIds.has(r.id)) && pageRows.length > 0}
                  onChange={(e) => togglePage(e.target.checked)}
                />
              </th>
              <th>Store</th>
              <th>Owner</th>
              <th>Type</th>
              <th>Uploaded</th>
              <th>Status</th>
              <th style={{ width: 170 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: "center", padding: 18 }}>No matching records.</td></tr>
            )}

            {pageRows.map((d) => (
              <tr key={d.id} className={styles.row}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(d.id)}
                    onChange={() => toggleRow(d.id)}
                    aria-label={`Select ${d.storeName}`}
                  />
                </td>
                <td>
                  <button className={styles.storeCell} onClick={() => openDrawer(d)}>
                    <span className={styles.avatar}>{d.storeName.slice(0,2)}</span>
                    <span className={styles.storeName}>{d.storeName}</span>
                  </button>
                </td>
                <td>{d.ownerName}</td>
                <td>{d.storeType}</td>
                <td>{d.uploadDate}</td>
                <td>
                  <span className={`${styles.pill} ${styles[prettyStatus(d.status).toLowerCase()]}`}>
                    {prettyStatus(d.status)}
                  </span>
                </td>
                <td className={styles.actions}>
                  <button className={styles.viewBtn} title="Preview" onClick={() => openDrawer(d)}><FaEye /></button>
                  <button className={styles.approveBtn} title="Approve" onClick={() => approve(d.id, true)}><FaCheck /></button>
                  <button className={styles.rejectBtn}  title="Reject"  onClick={() => reject(d.id)}><FaTimes /></button>
                  <button className={styles.flagBtn}    title="Flag"    onClick={() => flag(d.id)}><FaFlag /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className={styles.pager}>
        <Pagination current={page} total={totalPages} onChange={setPage} />
      </div>

      {/* Drawer */}
      {showDrawer && <div className={styles.overlay} onClick={closeDrawer} />}
      <aside className={`${styles.drawer} ${showDrawer ? styles.open : ""}`} role="dialog" aria-modal="true">
        <div className={styles.drawerHeader}>
          <h3>Store Details</h3>
          <button className={styles.closeDrawerBtn} onClick={closeDrawer} aria-label="Close drawer"><FaArrowRight /></button>
        </div>

        {selectedDoc && (
          <>
            <div className={styles.drawerTabs}>
              <button className={`${styles.tabBtn} ${tab === "owner" ? styles.activeTab : ""}`} onClick={() => setTab("owner")}>Owner Info</button>
              <button className={`${styles.tabBtn} ${tab === "store" ? styles.activeTab : ""}`} onClick={() => setTab("store")}>Store Info</button>
              <button className={`${styles.tabBtn} ${tab === "doc"   ? styles.activeTab : ""}`} onClick={() => setTab("doc")}>Document</button>
            </div>

            <div className={styles.tabContent}>
              {tab === "owner" && (
                <>
                  <p><strong>Name:</strong> {selectedDoc.ownerName}</p>
                  <p><strong>Contact:</strong> {selectedDoc.contact}</p>
                  <p><strong>Email:</strong> {selectedDoc.email}</p>
                  <div className={styles.actionButtonsDrawer}>
                    <button className={styles.approveBtn} onClick={() => approve(selectedDoc.id)}><FaCheck /> Approve</button>
                    <button className={styles.rejectBtn}  onClick={() => reject(selectedDoc.id)}><FaTimes /> Reject</button>
                  </div>
                </>
              )}

              {tab === "store" && (
                <>
                  <p><strong>Store:</strong> {selectedDoc.storeName}</p>
                  <p><strong>Type:</strong> {selectedDoc.storeType}</p>
                  <p><strong>Address:</strong> 123 Medical Street, Pune 411001</p>
                  <p><strong>GSTIN:</strong> 27ABCDE1234F1Z5</p>
                  <p><strong>Drug License:</strong> MED123456</p>
                  <p><strong>Uploaded:</strong> {selectedDoc.uploadDate}</p>
                  <div className={styles.actionButtonsDrawer}>
                    <button className={styles.approveBtn} onClick={() => approve(selectedDoc.id)}><FaCheck /> Approve</button>
                    <button className={styles.rejectBtn}  onClick={() => reject(selectedDoc.id)}><FaTimes /> Reject</button>
                  </div>
                </>
              )}

              {tab === "doc" && (
                <>
                  <img className={styles.drawerDoc} src={selectedDoc.documentUrl} alt="Uploaded document preview" />
                  <div className={styles.actionButtonsDrawer}>
                    <button className={styles.approveBtn} onClick={() => approve(selectedDoc.id)}><FaCheck /> Approve</button>
                    <button className={styles.rejectBtn}  onClick={() => reject(selectedDoc.id)}><FaTimes /> Reject</button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
