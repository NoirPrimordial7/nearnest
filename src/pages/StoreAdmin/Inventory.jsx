import React, { useMemo, useRef, useState } from "react";
import Sidebar from "../../components/Sidebar";
import "./inventory.css";
import {
  Plus, Upload, Download,
} from "lucide-react";

// Export a CSV file for current rows
function downloadCSV(filename, rows) {
  const csv = [
    ["Name","Brand","Category","Tags","Price","Stock","Batch","Status"].join(","),
    ...rows.map((p) =>
      [
        `"${p.name}"`,
        `"${p.brand || ""}"`,
        `"${p.category || ""}"`,
        `"${(p.tags || []).join("|")}"`,
        p.price ?? "",
        p.stock ?? "",
        `"${p.batch || ""}"`,
        `"${p.status}"`,
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

const seedProducts = [
  { id: "p1", name: "Metformin 500mg", brand: "Healix", category: "Diabetes", tags: ["OTC"], price: 120.0, stock: 42, batch: "MF-500-A1", status: "Available" },
  { id: "p2", name: "Amlodipine 5mg", brand: "CardioLabs", category: "Cardio", tags: ["Prescription"], price: 180.0, stock: 6, batch: "AM-5-B7", status: "Few left" },
  { id: "p3", name: "Paracetamol 650mg", brand: "HealthPlus", category: "Pain Relief", tags: ["OTC"], price: 75.0, stock: 0, batch: "PCM-650-C3", status: "Out of stock" },
];

export default function Inventory() {
  // Layout
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Data
  const [products, setProducts] = useState(seedProducts);

  // Selection (multi-select)
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Filters
  const [q, setQ] = useState("");
  const [fCategory, setFCategory] = useState("All");
  const [fStatus, setFStatus] = useState("All");

  const categories = useMemo(() => {
    const s = new Set(products.map((p) => p.category).filter(Boolean));
    return ["All", ...Array.from(s)];
  }, [products]);

  // Add/Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const fileRef = useRef(null); // reserved for future (image)
  const [form, setForm] = useState({
    name: "",
    brand: "",
    description: "",
    category: "",
    tags: [],
    price: "",
    stock: "",
    batch: "",
    status: "Available",
  });

  // Stock adjust
  const [stockModal, setStockModal] = useState({ open: false, id: null, delta: 0 });

  // CSV upload
  const csvRef = useRef(null);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const t = q.trim().toLowerCase();
      const byQ =
        t === "" ||
        p.name.toLowerCase().includes(t) ||
        (p.category || "").toLowerCase().includes(t) ||
        (p.brand || "").toLowerCase().includes(t) ||
        (p.batch || "").toLowerCase().includes(t);
      const byC = fCategory === "All" || p.category === fCategory;
      const byS = fStatus === "All" || p.status === fStatus;
      return byQ && byC && byS;
    });
  }, [products, q, fCategory, fStatus]);

  // Selection helpers (operate on filtered view)
  const allFilteredIds = filtered.map((p) => p.id);
  const allSelectedInFiltered = allFilteredIds.every((id) => selectedIds.has(id)) && allFilteredIds.length > 0;

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelectedInFiltered) {
        // deselect all in filtered
        allFilteredIds.forEach((id) => next.delete(id));
      } else {
        // select all in filtered
        allFilteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Handlers
  const openAdd = () => {
    setEditingId(null);
    setForm({
      name: "",
      brand: "",
      description: "",
      category: "",
      tags: [],
      price: "",
      stock: "",
      batch: "",
      status: "Available",
    });
    if (fileRef.current) fileRef.current.value = "";
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name || "",
      brand: p.brand || "",
      description: p.description || "",
      category: p.category || "",
      tags: p.tags || [],
      price: p.price ?? "",
      stock: p.stock ?? "",
      batch: p.batch || "",
      status: p.status || "Available",
    });
    if (fileRef.current) fileRef.current.value = "";
    setModalOpen(true);
  };

  const onSave = () => {
    if (!form.name || !form.category || form.price === "") {
      alert("Please fill at least Name, Category and Price.");
      return;
    }
    if (editingId) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, ...form, price: Number(form.price), stock: Number(form.stock || 0) } : p))
      );
    } else {
      const id = "p" + Math.random().toString(36).slice(2, 8);
      setProducts((prev) => [
        { id, ...form, price: Number(form.price), stock: Number(form.stock || 0) },
        ...prev,
      ]);
    }
    setModalOpen(false);
  };

  const onDuplicate = (p) => {
    const id = "p" + Math.random().toString(36).slice(2, 8);
    const clone = { ...p, id, name: p.name + " (Copy)" };
    setProducts((prev) => [clone, ...prev]);
  };

  const onDelete = (id) => {
    if (!confirm("Delete this product?")) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const deleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected product(s)?`)) return;
    setProducts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
    clearSelection();
  };

  const openAdjustStock = (p) =>
    setStockModal({ open: true, id: p.id, delta: 0 });

  const applyStock = () => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== stockModal.id) return p;
        const nextStock = Math.max(0, (p.stock || 0) + Number(stockModal.delta || 0));
        let nextStatus = p.status;
        if (nextStock === 0) nextStatus = "Out of stock";
        else if (nextStock < 10) nextStatus = "Few left";
        else nextStatus = "Available";
        return { ...p, stock: nextStock, status: nextStatus };
      })
    );
    setStockModal({ open: false, id: null, delta: 0 });
  };

  // CSV parsing: Name,Brand,Category,Tags,Price,Stock,Batch,Status
  const handleCSV = async (file) => {
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length <= 1) return;
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const out = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      const get = (key) => cols[header.indexOf(key)]?.replace(/^"|"$/g, "").trim() || "";
      const name = get("name");
      if (!name) continue;
      const tags = get("tags") ? get("tags").split("|").map((t) => t.trim()) : [];
      out.push({
        id: "p" + Math.random().toString(36).slice(2, 8),
        name,
        brand: get("brand"),
        category: get("category"),
        tags,
        price: Number(get("price") || 0),
        stock: Number(get("stock") || 0),
        batch: get("batch"),
        status: get("status") || "Available",
      });
    }
    if (out.length) setProducts((prev) => [...out, ...prev]);
  };

  const triggerCSV = () => csvRef.current?.click();

  const toggleTag = (tag) => {
    setForm((f) => {
      const set = new Set(f.tags || []);
      if (set.has(tag)) set.delete(tag); else set.add(tag);
      return { ...f, tags: Array.from(set) };
    });
  };

  const selectionMode = selectedIds.size > 0;

  return (
    <div className="inv-root dark">
      <div className="sa-shell">
        {/* Sidebar */}
        <aside className={`sa-left ${sidebarCollapsed ? "collapsed" : ""}`}>
          <div className="sa-left-inner">
            <Sidebar
              role="store"
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed((s) => !s)}
            />
          </div>
        </aside>

        {/* Content */}
        <main className={`sa-right ${sidebarCollapsed ? "shifted" : ""}`}>
          <div className="inv-container">
            <header className="inv-head">
              <div>
                <h1>Inventory / Products</h1>
                <p>Professional-grade control over products, stock and pricing.</p>
              </div>

              {/* Header actions — switch when selection active */}
              <div className="inv-head-actions">
                {!selectionMode ? (
                  <>
                    <button className="btn primary cta-visible" onClick={openAdd}>
                      <Plus size={16} /> Add Product
                    </button>

                    {/* CSV Upload */}
                    <input
                      ref={csvRef}
                      type="file"
                      accept=".csv,text/csv"
                      style={{ display: "none" }}
                      onChange={(e) => handleCSV(e.target.files?.[0])}
                    />
                    <button className="btn ghost" onClick={triggerCSV}>
                      <Upload size={16} /> Upload CSV
                    </button>

                    {/* Export CSV */}
                    <button className="btn ghost" onClick={() => downloadCSV("inventory_export.csv", products)}>
                      <Download size={16} /> Export CSV
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn danger-only" onClick={deleteSelected}>
                      Delete ({selectedIds.size})
                    </button>
                    <button className="btn ghost" onClick={clearSelection} title="Clear selection">
                      Clear
                    </button>
                  </>
                )}
              </div>
            </header>

            {/* Search & Filters */}
            <section className="inv-filters">
              <div className="filter-group">
                <label className="filter-label">Search</label>
                <input
                  className="input"
                  placeholder="Name, brand, category, batch…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">Filter: Category</label>
                <select
                  className="select"
                  value={fCategory}
                  onChange={(e) => setFCategory(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Filter: Availability</label>
                <select
                  className="select"
                  value={fStatus}
                  onChange={(e) => setFStatus(e.target.value)}
                >
                  {["All","Available","Few left","Out of stock"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </section>

            {/* Table */}
            <section className="inv-table-wrap">
              <table className="inv-table">
                <thead>
                  <tr>
                    <th className="col-select">
                      <input
                        type="checkbox"
                        className="row-check"
                        checked={allSelectedInFiltered}
                        onChange={toggleSelectAllFiltered}
                        aria-label="Select all in view"
                      />
                    </th>
                    <th>Name</th>
                    <th>Brand</th>
                    <th>Category</th>
                    <th>Tags</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Batch</th>
                    <th>Status</th>
                    <th className="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="10" className="empty">
                        No products found. Try different filters or add a new one.
                      </td>
                    </tr>
                  )}

                  {filtered.map((p) => {
                    const checked = selectedIds.has(p.id);
                    return (
                      <tr key={p.id} className={checked ? "row-selected" : ""}>
                        <td>
                          <input
                            type="checkbox"
                            className="row-check"
                            checked={checked}
                            onChange={() => toggleRow(p.id)}
                            aria-label={`Select ${p.name}`}
                          />
                        </td>
                        <td className="cell-strong">{p.name}</td>
                        <td>{p.brand}</td>
                        <td>{p.category}</td>
                        <td>
                          {(p.tags || []).map((t) => (
                            <span key={t} className="chip">{t}</span>
                          ))}
                        </td>
                        <td>₹{Number(p.price).toFixed(2)}</td>
                        <td className={p.stock === 0 ? "danger" : p.stock < 10 ? "warn" : ""}>
                          {p.stock}
                        </td>
                        <td>{p.batch}</td>
                        <td>
                          <span
                            className={
                              "status nowrap " +
                              (p.status === "Available" ? "ok" : p.status === "Few left" ? "mid" : "off")
                            }
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="actions">
                          {/* Hide row-level actions during selection mode */}
                          {!selectionMode && (
                            <div className="actions-inner">
                              <button className="label-btn edit" onClick={() => openEdit(p)}>Edit</button>
                              <button className="label-btn duplicate" onClick={() => onDuplicate(p)}>Duplicate</button>
                              <button className="label-btn stock" onClick={() => openAdjustStock(p)}>Stock +/–</button>
                              <button className="label-btn delete" onClick={() => onDelete(p.id)}>Delete</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          </div>
        </main>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Add/Edit Product">
          <div className="modal-card">
            <div className="modal-head">
              <h3>{editingId ? "Edit Product" : "Add Product"}</h3>
              <button className="close" onClick={() => setModalOpen(false)} aria-label="Close">×</button>
            </div>
            <div className="modal-body grid">
              <div className="col">
                <label>Name *</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Metformin 500mg"
                />
              </div>
              <div className="col">
                <label>Brand</label>
                <input
                  className="input"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="Brand name"
                />
              </div>
              <div className="col col-span-2">
                <label>Description</label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description..."
                />
              </div>
              <div className="col">
                <label>Category *</label>
                <input
                  className="input"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g., Diabetes"
                />
              </div>
              <div className="col">
                <label>Tags</label>
                <div className="tags-row">
                  {["OTC","Prescription","Cold","Pain","Antibiotic","Ayurveda","Homeopathy","Herbal","Wellness"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`tag-pill ${form.tags?.includes(t) ? "active" : ""}`}
                      onClick={() => toggleTag(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col">
                <label>Price (₹) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="col">
                <label>Stock Qty</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </div>
              <div className="col">
                <label>Batch</label>
                <input
                  className="input"
                  value={form.batch}
                  onChange={(e) => setForm({ ...form, batch: e.target.value })}
                  placeholder="e.g., MF-500-A1"
                />
              </div>
              <div className="col">
                <label>Status</label>
                <select
                  className="select"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option>Available</option>
                  <option>Few left</option>
                  <option>Out of stock</option>
                </select>
              </div>
              {/* (hidden) file input kept for future */}
              <div className="col col-span-2" style={{ display:"none" }}>
                <label>Upload Image (hidden)</label>
                <input ref={fileRef} type="file" accept="image/*" className="file" />
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn primary" onClick={onSave}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {stockModal.open && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Adjust Stock">
          <div className="modal-card small">
            <div className="modal-head">
              <h3>Adjust Stock</h3>
              <button className="close" onClick={() => setStockModal({ open: false, id: null, delta: 0 })} aria-label="Close">×</button>
            </div>
            <div className="modal-body">
              <label>Change (+/−)</label>
              <input
                type="number"
                className="input"
                value={stockModal.delta}
                onChange={(e) => setStockModal({ ...stockModal, delta: e.target.value })}
              />
            </div>
            <div className="modal-foot">
              <button className="btn ghost" onClick={() => setStockModal({ open: false, id: null, delta: 0 })}>
                Cancel
              </button>
              <button className="btn primary" onClick={applyStock}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
