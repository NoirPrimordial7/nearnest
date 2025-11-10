// src/pages/store-admin/Inventory.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  doc,
} from "firebase/firestore";
import { db } from "../../Auth/firebase";

import { Plus, Upload, Download } from "lucide-react";

import "./inventory.css";

export default function Inventory() {
  const { storeId } = useParams();

  const [products, setProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [q, setQ] = useState("");
  const [fCategory, setFCategory] = useState("All");
  const [fStatus, setFStatus] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [stockModal, setStockModal] = useState({
    open: false,
    id: null,
    delta: 0,
  });
  const [busy, setBusy] = useState(false);

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

  const csvRef = useRef(null);
  const fileRef = useRef(null);

  const fetchProducts = async () => {
    if (!storeId) return;
    setBusy(true);
    try {
      const snap = await getDocs(collection(db, "stores", storeId, "products"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProducts(list);
    } catch (err) {
      console.error("[Inventory] fetchProducts error:", err);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const categories = useMemo(() => {
    const s = new Set(products.map((p) => p.category).filter(Boolean));
    return ["All", ...Array.from(s).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const t = q.trim().toLowerCase();
      const byQ =
        t === "" ||
        p.name?.toLowerCase().includes(t) ||
        (p.category || "").toLowerCase().includes(t) ||
        (p.brand || "").toLowerCase().includes(t) ||
        (p.batch || "").toLowerCase().includes(t);
      const byC = fCategory === "All" || p.category === fCategory;
      const byS = fStatus === "All" || p.status === fStatus;
      return byQ && byC && byS;
    });
  }, [products, q, fCategory, fStatus]);

  const allFilteredIds = filtered.map((p) => p.id);
  const allSelectedInFiltered =
    allFilteredIds.length > 0 &&
    allFilteredIds.every((id) => selectedIds.has(id));

  const selectionMode = selectedIds.size > 0;

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
        filtered.forEach((p) => next.delete(p.id));
      } else {
        filtered.forEach((p) => next.add(p.id));
      }
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

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
    setModalOpen(true);
  };

  const openAdjustStock = (p) => {
    setStockModal({ open: true, id: p.id, delta: 0 });
  };

  const onSave = async () => {
    if (!storeId) return;
    if (!form.name || !form.category || form.price === "") {
      alert("Please fill at least Name, Category and Price.");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock || 0),
        tags: form.tags || [],
      };

      if (editingId) {
        await updateDoc(
          doc(db, "stores", storeId, "products", editingId),
          payload
        );
      } else {
        await addDoc(collection(db, "stores", storeId, "products"), payload);
      }

      setModalOpen(false);
      await fetchProducts();
    } catch (err) {
      console.error("[Inventory] onSave error:", err);
      alert("Could not save product. Check console for details.");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id) => {
    if (!storeId) return;
    if (!window.confirm("Delete this product?")) return;

    setBusy(true);
    try {
      await deleteDoc(doc(db, "stores", storeId, "products", id));
      await fetchProducts();
    } catch (err) {
      console.error("[Inventory] onDelete error:", err);
      alert("Could not delete product.");
    } finally {
      setBusy(false);
    }
  };

  const deleteSelected = async () => {
    if (!storeId) return;
    if (selectedIds.size === 0) return;
    if (
      !window.confirm(
        `Delete ${selectedIds.size} selected product(s)? This cannot be undone.`
      )
    )
      return;

    setBusy(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach((id) => {
        const prodRef = doc(db, "stores", storeId, "products", id);
        batch.delete(prodRef);
      });
      await batch.commit();
      setSelectedIds(new Set());
      await fetchProducts();
    } catch (err) {
      console.error("[Inventory] deleteSelected error:", err);
      alert("Could not delete selected products.");
    } finally {
      setBusy(false);
    }
  };

  const onDuplicate = async (p) => {
    if (!storeId) return;
    setBusy(true);
    try {
      const copy = { ...p, name: `${p.name} (Copy)` };
      delete copy.id;
      await addDoc(collection(db, "stores", storeId, "products"), copy);
      await fetchProducts();
    } catch (err) {
      console.error("[Inventory] onDuplicate error:", err);
    } finally {
      setBusy(false);
    }
  };

  const applyStock = async () => {
    if (!storeId || !stockModal.id) return;

    const p = products.find((prod) => prod.id === stockModal.id);
    if (!p) return;

    const nextStock = Math.max(
      0,
      (Number(p.stock) || 0) + Number(stockModal.delta || 0)
    );

    let status = "Available";
    if (nextStock === 0) status = "Out of stock";
    else if (nextStock < 10) status = "Few left";

    setBusy(true);
    try {
      await updateDoc(
        doc(db, "stores", storeId, "products", p.id),
        { stock: nextStock, status }
      );
      setStockModal({ open: false, id: null, delta: 0 });
      await fetchProducts();
    } catch (err) {
      console.error("[Inventory] applyStock error:", err);
      alert("Could not update stock.");
    } finally {
      setBusy(false);
    }
  };

  const handleCSV = async (file) => {
    if (!file || !storeId) return;
    try {
      setBusy(true);
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length <= 1) return;

      const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const indexOf = (key) => header.indexOf(key);

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",");
        const get = (key) =>
          cols[indexOf(key)]?.replace(/^"|"$/g, "").trim() || "";

        const tags = get("tags")
          ? get("tags")
              .split("|")
              .map((t) => t.trim())
              .filter(Boolean)
          : [];

        await addDoc(collection(db, "stores", storeId, "products"), {
          name: get("name"),
          brand: get("brand"),
          category: get("category"),
          tags,
          price: Number(get("price") || 0),
          stock: Number(get("stock") || 0),
          batch: get("batch"),
          status: get("status") || "Available",
        });
      }

      await fetchProducts();
      alert("CSV imported successfully.");
    } catch (err) {
      console.error("[Inventory] handleCSV error:", err);
      alert("Could not import CSV. Check file format.");
    } finally {
      setBusy(false);
      if (csvRef.current) csvRef.current.value = "";
    }
  };

  const triggerCSV = () => csvRef.current?.click();

  const downloadCSV = () => {
    if (products.length === 0) {
      alert("No products to export.");
      return;
    }
    const rows = products;
    const csv = [
      "Name,Brand,Category,Tags,Price,Stock,Batch,Status",
      ...rows.map((r) =>
        [
          `"${r.name || ""}"`,
          `"${r.brand || ""}"`,
          `"${r.category || ""}"`,
          `"${(r.tags || []).join("|")}"`,
          r.price ?? "",
          r.stock ?? "",
          `"${r.batch || ""}"`,
          `"${r.status || ""}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `inventory_${storeId || "store"}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const toggleTag = (tag) => {
    setForm((f) => {
      const set = new Set(f.tags || []);
      if (set.has(tag)) set.delete(tag);
      else set.add(tag);
      return { ...f, tags: Array.from(set) };
    });
  };

  return (
    <div className="inv-root">
      <div className="inv-container">
        {/* Header */}
        <header className="inv-head">
          <div className="inv-head-text">
            <h1>Inventory / Products</h1>
            <p>
              Professional-grade control over your products, stock and pricing.
            </p>
          </div>

          <div className="inv-head-actions">
            {!selectionMode ? (
              <>
                <button className="btn primary" onClick={openAdd}>
                  <Plus size={16} /> <span>Add Product</span>
                </button>

                <input
                  ref={csvRef}
                  type="file"
                  accept=".csv,text/csv"
                  style={{ display: "none" }}
                  onChange={(e) => handleCSV(e.target.files?.[0])}
                />
                <button className="btn ghost" onClick={triggerCSV}>
                  <Upload size={16} /> <span>Upload CSV</span>
                </button>

                <button className="btn ghost" onClick={downloadCSV}>
                  <Download size={16} /> <span>Export CSV</span>
                </button>
              </>
            ) : (
              <>
                <button className="btn danger-only" onClick={deleteSelected}>
                  Delete ({selectedIds.size})
                </button>
                <button
                  className="btn ghost"
                  onClick={clearSelection}
                  title="Clear selection"
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </header>

        {busy && <div className="inv-busy-hint">Syncing with inventory…</div>}

        {/* Filters */}
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
            <label className="filter-label">Category</label>
            <select
              className="select"
              value={fCategory}
              onChange={(e) => setFCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Availability</label>
            <select
              className="select"
              value={fStatus}
              onChange={(e) => setFStatus(e.target.value)}
            >
              {["All", "Available", "Few left", "Out of stock"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
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
                    No products found. Try different filters or add a new
                    product.
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
                        <span key={t} className="chip">
                          {t}
                        </span>
                      ))}
                    </td>
                    <td>₹{Number(p.price || 0).toFixed(2)}</td>
                    <td
                      className={
                        p.stock === 0
                          ? "danger"
                          : p.stock < 10
                          ? "warn"
                          : ""
                      }
                    >
                      {p.stock ?? 0}
                    </td>
                    <td>{p.batch}</td>
                    <td>
                      <span
                        className={
                          "status nowrap " +
                          (p.status === "Available"
                            ? "ok"
                            : p.status === "Few left"
                            ? "mid"
                            : "off")
                        }
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="actions">
                      {!selectionMode && (
                        <div className="actions-inner">
                          <button
                            className="label-btn edit"
                            onClick={() => openEdit(p)}
                          >
                            Edit
                          </button>
                          <button
                            className="label-btn duplicate"
                            onClick={() => onDuplicate(p)}
                          >
                            Duplicate
                          </button>
                          <button
                            className="label-btn stock"
                            onClick={() => openAdjustStock(p)}
                          >
                            Stock +/–
                          </button>
                          <button
                            className="label-btn delete"
                            onClick={() => onDelete(p.id)}
                          >
                            Delete
                          </button>
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

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-head">
              <h3>{editingId ? "Edit Product" : "Add Product"}</h3>
              <button
                className="close"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="modal-body grid">
              <div className="col">
                <label>Name *</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="e.g., Metformin 500mg"
                />
              </div>

              <div className="col">
                <label>Brand</label>
                <input
                  className="input"
                  value={form.brand}
                  onChange={(e) =>
                    setForm({ ...form, brand: e.target.value })
                  }
                  placeholder="Brand name"
                />
              </div>

              <div className="col col-span-2">
                <label>Description</label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Short description..."
                />
              </div>

              <div className="col">
                <label>Category *</label>
                <input
                  className="input"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  placeholder="e.g., Diabetes"
                />
              </div>

              <div className="col">
                <label>Tags</label>
                <div className="tags-row">
                  {[
                    "OTC",
                    "Prescription",
                    "Cold",
                    "Pain",
                    "Antibiotic",
                    "Ayurveda",
                    "Homeopathy",
                    "Herbal",
                    "Wellness",
                  ].map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={
                        "tag-pill " +
                        (form.tags?.includes(t) ? "active" : "")
                      }
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
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                />
              </div>

              <div className="col">
                <label>Stock Qty</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={form.stock}
                  onChange={(e) =>
                    setForm({ ...form, stock: e.target.value })
                  }
                />
              </div>

              <div className="col">
                <label>Batch</label>
                <input
                  className="input"
                  value={form.batch}
                  onChange={(e) =>
                    setForm({ ...form, batch: e.target.value })
                  }
                  placeholder="e.g., MF-500-A1"
                />
              </div>

              <div className="col">
                <label>Status</label>
                <select
                  className="select"
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value })
                  }
                >
                  <option>Available</option>
                  <option>Few left</option>
                  <option>Out of stock</option>
                </select>
              </div>

              {/* Hidden image input for future phase */}
              <div className="col col-span-2" style={{ display: "none" }}>
                <label>Upload Image</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="file"
                />
              </div>
            </div>

            <div className="modal-foot">
              <button
                className="btn ghost"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button className="btn primary" onClick={onSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {stockModal.open && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-card small">
            <div className="modal-head">
              <h3>Adjust Stock</h3>
              <button
                className="close"
                onClick={() =>
                  setStockModal({ open: false, id: null, delta: 0 })
                }
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <label>Change (+/−)</label>
              <input
                type="number"
                className="input"
                value={stockModal.delta}
                onChange={(e) =>
                  setStockModal({
                    ...stockModal,
                    delta: e.target.value,
                  })
                }
              />
            </div>

            <div className="modal-foot">
              <button
                className="btn ghost"
                onClick={() =>
                  setStockModal({ open: false, id: null, delta: 0 })
                }
              >
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
