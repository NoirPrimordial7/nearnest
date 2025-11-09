// src/pages/StoreAdmin/StoreAdminDashboard.jsx
import React, { useRef, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";
import Sidebar from "../../components/Sidebar";
import "./storeAdminDashboard.css";

const StoreAdminDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productName, setProductName] = useState("");
  const [productImage, setProductImage] = useState(null);
  const [confirmation, setConfirmation] = useState("");
  const fileRef = useRef(null);

  const [kpis] = useState({
    totalProducts: 240, lowStock: 12, expired: 5, pendingOrders: 8, verificationStatus: "Verified",
  });

  const barData  = [
    { category: "Metformin",  views: 320 },
    { category: "Glimepiride", views: 210 },
    { category: "Amlodipine", views: 140 },
    { category: "Ramipril",   views: 280 },
  ];
  const lineData = [
    { day: "Mon", sales: 25 }, { day: "Tue", sales: 40 }, { day: "Wed", sales: 30 },
    { day: "Thu", sales: 50 }, { day: "Fri", sales: 45 }, { day: "Sat", sales: 60 },
    { day: "Sun", sales: 35 },
  ];
  const pieData  = [
    { name: "Metformin",  value: 4000 },
    { name: "Glimepiride", value: 3000 },
    { name: "Amlodipine", value: 2000 },
    { name: "Ramipril",   value: 1000 },
  ];
  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
  const recentActivities = [
    "Product 'Ramipril' added",
    "Updated price for 'Sertraline'",
    "New order received (Order #3241)",
    "Stock adjusted for 'Losartan'",
    "Product 'Atenolol' removed",
  ];

  const handleAddProduct = () => {
    if (productName.trim() === "" || !productImage) {
      alert("Please enter a product name and upload an image.");
      return;
    }
    setConfirmation("Product added successfully.");
    setShowAddProduct(false);
    setProductName("");
    setProductImage(null);
    if (fileRef.current) fileRef.current.value = "";
    setTimeout(() => setConfirmation(""), 2000);
  };

  return (
    <div className="sa-root">
      <div className="sa-shell">
        <aside className={`sa-left ${sidebarCollapsed ? "collapsed" : ""}`}>
          <div className="sa-left-inner">
            <Sidebar
              role="store"              // ← important: show Store Admin menu
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </div>
        </aside>

        <main className={`sa-right ${sidebarCollapsed ? "shifted" : ""}`}>
          <div className="dashboard-container">
            <header className="dashboard-header">
              <h1>Store Admin Dashboard</h1>
              <p>Overview of your store’s performance and operations</p>
            </header>

            <section className="kpi-section">
              <div className="kpi-card">Total Products: {kpis.totalProducts}</div>
              <div className="kpi-card">Low Stock: {kpis.lowStock}</div>
              <div className="kpi-card">Expired Items: {kpis.expired}</div>
              <div className="kpi-card">Pending Orders: {kpis.pendingOrders}</div>
              <div className="kpi-card">Verification: {kpis.verificationStatus}</div>
            </section>

            <section className="charts-section">
              <div className="chart-card">
                <h3>Product Views by Category</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={barData}>
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="views" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>Daily Sales Overview</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={lineData}>
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3>Inventory Value Summary</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="activity-section">
              <h3>Recent Activity Feed</h3>
              <ul>
                {recentActivities.map((activity, i) => (
                  <li key={i}>{activity}</li>
                ))}
              </ul>
            </section>

            {showAddProduct && (
              <div className="popup-overlay" role="dialog" aria-modal="true" aria-label="Add Product">
                <div className="popup-window">
                  <h3>Add New Product</h3>
                  <input
                    type="text"
                    placeholder="Enter product name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="popup-input"
                  />
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProductImage(e.target.files[0])}
                    className="popup-file"
                  />
                  <button className="popup-add-btn" onClick={handleAddProduct}>Add</button>
                  <button className="popup-close-btn" onClick={() => setShowAddProduct(false)}>Cancel</button>
                </div>
              </div>
            )}

            {confirmation && <div className="confirmation">{confirmation}</div>}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StoreAdminDashboard;
