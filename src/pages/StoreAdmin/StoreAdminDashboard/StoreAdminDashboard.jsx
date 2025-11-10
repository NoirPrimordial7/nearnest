import React, { useMemo, useState, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import styles from './storeAdminDashboard.module.css';


const PIE_COLORS = ["var(--mint-500)", "var(--amber-500)", "var(--rose-500)"];

const StoreAdminDashboard = () => {
  const [range, setRange] = useState("90d");
  const fileRef = useRef(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productName, setProductName] = useState("");
  const [productImage, setProductImage] = useState(null);
  const [confirmation, setConfirmation] = useState("");

  const kpi = [
    { label: "Total Products", value: "240", tone: "mint", delta: "+5.8%", trend: "up" },
    { label: "Low Stock", value: "12", tone: "amber", delta: "−3%", trend: "down" },
    { label: "Expired Items", value: "5", tone: "indigo", delta: "+4%", trend: "up" },
    { label: "Pending Orders", value: "8", tone: "rose", delta: "−8%", trend: "down" },
    { label: "Verification", value: "Verified", tone: "sky", delta: "", trend: "up" },
  ];

  const barData = [
    { category: "Metformin", views: 320 },
    { category: "Glimepiride", views: 210 },
    { category: "Amlodipine", views: 140 },
    { category: "Ramipril", views: 280 },
  ];

  const lineData = [
    { day: "Mon", sales: 25 }, { day: "Tue", sales: 40 }, { day: "Wed", sales: 30 },
    { day: "Thu", sales: 50 }, { day: "Fri", sales: 45 }, { day: "Sat", sales: 60 },
    { day: "Sun", sales: 35 },
  ];

  const pieData = [
    { name: "Metformin", value: 4000 },
    { name: "Glimepiride", value: 3000 },
    { name: "Amlodipine", value: 2000 },
    { name: "Ramipril", value: 1000 },
  ];

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
    <div className={styles.wrap}>
      <div className={ styles.kpiRow}>
        {kpi.map((item, i) => (
          <div key={i} className={`${styles.kpiCard} ${styles[`tone-${item.tone}`]}`}>
            <div className={styles.kpiIcon}>📦</div>
            <div className={styles.kpiMeta}>
              <div className={styles.kpiValueRow}>
                <div className={styles.kpiValue}>{item.value}</div>
                {item.delta && (
                  <span
                    className={`${styles.deltaPill} ${item.trend === "down" ? styles.deltaDown : styles.deltaUp}`}
                  >
                    {item.trend === "down" ? "▼" : "▲"} {item.delta}
                  </span>
                )}
              </div>
              <div className={styles.kpiLabel}>{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        <section className={`${styles.card} ${styles.span7} ${styles.tall}`}>
          <h3 className={styles.cardTitle}>Daily Sales Overview</h3>
          <div className={styles.chartPad}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ left: 10, right: 10 }}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="var(--mint-500)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className={`${styles.card} ${styles.span5} ${styles.tall}`}>
          <h3 className={styles.cardTitle}>Product Views by Category</h3>
          <div className={styles.chartPad}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="var(--sky-500)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className={`${styles.card} ${styles.span12} ${styles.tall}`}>
          <h3 className={styles.cardTitle}>Inventory Value Summary</h3>
          <div className={styles.chartPad}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Recent Activity</h3>
        <ul>
          {recentActivities.map((activity, i) => (
            <li key={i} className={styles.activityItem}>{activity}</li>
          ))}
        </ul>
      </section>

      {showAddProduct && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupWindow}>
            <h3>Add New Product</h3>
            <input
              type="text"
              placeholder="Enter product name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className={styles.popupInput}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => setProductImage(e.target.files[0])}
              className={styles.popupFile}
            />
            <button className={styles.popupAddBtn} onClick={handleAddProduct}>Add</button>
            <button className={styles.popupCloseBtn} onClick={() => setShowAddProduct(false)}>Cancel</button>
          </div>
        </div>
      )}

      {confirmation && <div className={styles.confirmation}>{confirmation}</div>}
    </div>
  );
};

export default StoreAdminDashboard;