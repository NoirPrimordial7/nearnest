import React, { useState, useEffect, useRef } from "react";
import "./ad.css";

/**
 * Ad.jsx - Advertisement Management (Admin)
 * Fully functional frontend (mock data). Replace/update handlers with API calls.
 *
 * Key features:
 * - Row actions in three-dot menu (⋮): View / Edit / Extend → sub-menu / Reactivate / Delete
 * - Extend submenu with days: 3d, 5d, 7d, 10d
 * - Edit modal, Delete confirmation
 * - Export CSV, Search, Filter, Sort
 */

const sampleAds = [
  {
    id: 101,
    storeName: "Vintage Corner",
    ownerName: "Anita Sharma",
    title: "Antique Lamps Sale",
    content: "Up to 30% off on selected antique lamps.",
    startDate: "2025-09-15T10:00:00Z",
    endDate: "2025-10-15T23:59:59Z",
    postedAt: "2025-09-15T09:45:00Z",
    removedAt: null,
    views: 1245,
    revenue: 320.5,
    status: "Expired", // Active | Expired | Removed
  },
  {
    id: 102,
    storeName: "HomeScape",
    ownerName: "Rohit Patil",
    title: "Diwali Home Décor",
    content: "Premium decor items for Diwali 2025.",
    startDate: "2025-10-01T00:00:00Z",
    endDate: "2025-11-01T23:59:59Z",
    postedAt: "2025-10-01T00:05:00Z",
    removedAt: null,
    views: 842,
    revenue: 740.0,
    status: "Active",
  },
  {
    id: 103,
    storeName: "Crafts N More",
    ownerName: "Sima Rao",
    title: "Handmade Cushions",
    content: "Buy 2 get 1 free on all cushions.",
    startDate: "2025-08-05T08:00:00Z",
    endDate: "2025-09-05T23:59:59Z",
    postedAt: "2025-08-05T07:55:00Z",
    removedAt: "2025-09-06T00:10:00Z",
    views: 2300,
    revenue: 1250.25,
    status: "Removed",
  },
];

const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString();
};

const exportToCSV = (rows, filename = "ads_report.csv") => {
  if (!rows || !rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [
    keys.join(","),
    ...rows.map((r) =>
      keys
        .map((k) => {
          const v = r[k] === null || r[k] === undefined ? "" : String(r[k]);
          const escaped = v.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const Ad = () => {
  const [ads, setAds] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("postedDesc"); // postedDesc | viewsDesc | revenueDesc
  const [openMenuId, setOpenMenuId] = useState(null);
  const [openExtendFor, setOpenExtendFor] = useState(null); // id of ad showing submenu
  const [editingAd, setEditingAd] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const menuRef = useRef();

  useEffect(() => {
    setAds(sampleAds);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
        setOpenExtendFor(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Derived totals
  const totalRevenue = ads.reduce((s, a) => s + (a.revenue || 0), 0);
  const totalViews = ads.reduce((s, a) => s + (a.views || 0), 0);

  // Filtering + searching + sorting
  const filtered = ads
    .filter((ad) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        ad.storeName.toLowerCase().includes(q) ||
        ad.ownerName.toLowerCase().includes(q) ||
        ad.title.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" ? true : ad.status.toLowerCase() === statusFilter;
      return matchesQuery && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "postedDesc") return new Date(b.postedAt) - new Date(a.postedAt);
      if (sortBy === "viewsDesc") return (b.views || 0) - (a.views || 0);
      if (sortBy === "revenueDesc") return (b.revenue || 0) - (a.revenue || 0);
      return 0;
    });

  // Actions (replace these with API calls as necessary)

  const handleDelete = (id) => {
    // optimistic remove
    setAds((prev) => prev.filter((a) => a.id !== id));
    setShowDeleteConfirm(null);
    setOpenMenuId(null);
    // TODO: call API to delete => if fail, revert or show error
  };

  const handleOpenEdit = (ad) => {
    setEditingAd({ ...ad });
    setShowEditModal(true);
    setOpenMenuId(null);
    setOpenExtendFor(null);
  };

  const handleSaveEdit = () => {
    setAds((prev) => prev.map((a) => (a.id === editingAd.id ? editingAd : a)));
    setShowEditModal(false);
    setEditingAd(null);
    // TODO: call API to save
  };

  const handleExtend = (id, extraDays = 7) => {
    setAds((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const currentEnd = a.endDate ? new Date(a.endDate) : new Date();
          const extended = new Date(currentEnd);
          extended.setDate(extended.getDate() + extraDays);
          // If previously removed, clear removedAt
          return { ...a, endDate: extended.toISOString(), status: "Active", removedAt: null };
        }
        return a;
      })
    );
    setOpenMenuId(null);
    setOpenExtendFor(null);
    // TODO: API call to extend on the server
  };

  const handleReactivate = (id) => {
    setAds((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "Active", removedAt: null } : a))
    );
    setOpenMenuId(null);
    // TODO: API call
  };

  const handleViewDetails = (ad) => {
    setEditingAd({ ...ad });
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const generateReport = () => {
    const rows = ads.map((a) => ({
      id: a.id,
      storeName: a.storeName,
      ownerName: a.ownerName,
      title: a.title,
      postedAt: a.postedAt,
      startDate: a.startDate,
      endDate: a.endDate,
      removedAt: a.removedAt || "",
      status: a.status,
      views: a.views,
      revenue: a.revenue,
      content: a.content,
    }));
    exportToCSV(rows, `ads_report_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="ad-page-container">
      <header className="ad-header">
        <div className="ad-header-left">
          <h1>Advertisement Management</h1>
          <p className="ad-sub">Full ad reports, revenue & control center</p>
        </div>

        <div className="ad-header-right">
          <div className="stat-card">
            <div className="stat-title">Total Revenue</div>
            <div className="stat-value">₹ {totalRevenue.toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Total Views</div>
            <div className="stat-value">{totalViews}</div>
          </div>
          <button className="btn export" onClick={generateReport}>
            Export CSV
          </button>
        </div>
      </header>

      <section className="ad-controls">
        <input
          type="text"
          placeholder="Search by store, owner or title..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />

        <div className="filters">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="removed">Removed</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="postedDesc">Newest first</option>
            <option value="viewsDesc">Most views</option>
            <option value="revenueDesc">Most revenue</option>
          </select>
        </div>
      </section>

      <section className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>Ad ID</th>
              <th>Store</th>
              <th>Owner</th>
              <th>Title</th>
              <th>Posted</th>
              <th>Period</th>
              <th>Views</th>
              <th>Revenue (₹)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="10" className="empty">No advertisements found.</td>
              </tr>
            ) : (
              filtered.map((ad) => (
                <tr key={ad.id}>
                  <td>{ad.id}</td>
                  <td>{ad.storeName}</td>
                  <td>{ad.ownerName}</td>
                  <td className="ad-title">{ad.title}</td>
                  <td>{formatDate(ad.postedAt)}</td>
                  <td>
                    {formatDate(ad.startDate)} <br /> — <br /> {formatDate(ad.endDate)}
                  </td>
                  <td>{ad.views}</td>
                  <td>{ad.revenue?.toFixed(2) || "0.00"}</td>
                  <td>
                    <span className={`status-pill ${ad.status.toLowerCase()}`}>{ad.status}</span>
                  </td>
                  <td className="actions-cell" ref={menuRef}>
                    <button
                      className="menu-trigger"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === ad.id ? null : ad.id);
                        setOpenExtendFor(null);
                      }}
                    >
                      ⋮
                    </button>

                    {openMenuId === ad.id && (
                      <div className="row-menu">
                        <div className="row-menu-item" onClick={() => handleViewDetails(ad)}>View</div>
                        <div className="row-menu-item" onClick={() => handleOpenEdit(ad)}>Edit</div>

                        {/* Extend item opens submenu */}
                        <div
                          className="row-menu-item has-sub"
                          onMouseEnter={() => setOpenExtendFor(ad.id)}
                          onMouseLeave={() => setOpenExtendFor(null)}
                          onClick={() => setOpenExtendFor(ad.id)}
                        >
                          Extend
                          <div className={`extend-submenu ${openExtendFor === ad.id ? "open" : ""}`}>
                            <div className="extend-option" onClick={() => handleExtend(ad.id, 3)}>3 days</div>
                            <div className="extend-option" onClick={() => handleExtend(ad.id, 5)}>5 days</div>
                            <div className="extend-option" onClick={() => handleExtend(ad.id, 7)}>7 days</div>
                            <div className="extend-option" onClick={() => handleExtend(ad.id, 10)}>10 days</div>
                          </div>
                        </div>

                        {ad.status !== "Active" && (
                          <div className="row-menu-item" onClick={() => handleReactivate(ad.id)}>Reactivate</div>
                        )}

                        <div className="row-menu-item danger" onClick={() => setShowDeleteConfirm(ad.id)}>Delete</div>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* Edit Modal */}
      {showEditModal && editingAd && (
        <div className="modal-backdrop" onMouseDown={() => { setShowEditModal(false); setEditingAd(null); }}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <h3>Edit Advertisement #{editingAd.id}</h3>
            <div className="modal-grid">
              <label>
                Store Name
                <input value={editingAd.storeName} onChange={(e) => setEditingAd({ ...editingAd, storeName: e.target.value })} />
              </label>
              <label>
                Owner Name
                <input value={editingAd.ownerName} onChange={(e) => setEditingAd({ ...editingAd, ownerName: e.target.value })} />
              </label>
              <label>
                Title
                <input value={editingAd.title} onChange={(e) => setEditingAd({ ...editingAd, title: e.target.value })} />
              </label>
              <label>
                Start Date
                <input type="datetime-local" value={editingAd.startDate ? new Date(editingAd.startDate).toISOString().slice(0,16) : ""} onChange={(e) => {
                  const val = e.target.value ? new Date(e.target.value).toISOString() : null;
                  setEditingAd({ ...editingAd, startDate: val });
                }} />
              </label>
              <label>
                End Date
                <input type="datetime-local" value={editingAd.endDate ? new Date(editingAd.endDate).toISOString().slice(0,16) : ""} onChange={(e) => {
                  const val = e.target.value ? new Date(e.target.value).toISOString() : null;
                  setEditingAd({ ...editingAd, endDate: val });
                }} />
              </label>
              <label>
               (₹) Pricing 
                <input type="number" step="0.01" value={editingAd.revenue || 0} onChange={(e) => setEditingAd({ ...editingAd, revenue: parseFloat(e.target.value || 0) })} />
              </label>
              <label style={{ gridColumn: "1 / -1" }}>
                Content
                <textarea value={editingAd.content} onChange={(e) => setEditingAd({ ...editingAd, content: e.target.value })} />
              </label>
            </div>

            <div className="modal-actions">
              <button className="btn" onClick={() => { setShowEditModal(false); setEditingAd(null); }}>Cancel</button>
              <button className="btn primary" onClick={handleSaveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="modal-backdrop" onMouseDown={() => setShowDeleteConfirm(null)}>
          <div className="modal small" onMouseDown={(e) => e.stopPropagation()}>
            <h3>Delete Advertisement</h3>
            <p>Are you sure you want to permanently delete ad #{showDeleteConfirm}? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
              <button className="btn danger" onClick={() => handleDelete(showDeleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ad;
