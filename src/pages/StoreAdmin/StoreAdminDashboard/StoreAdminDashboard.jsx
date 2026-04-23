import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar, CartesianGrid,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import {
  db, collection, getDocs, doc, getDoc, query, where, orderBy, limit
} from "../../Auth/firebase";
import styles from "./storeAdminDashboard.module.css";

const PIE_COLORS = ["var(--mint-500)", "var(--amber-500)", "var(--rose-500)", "var(--sky-500)", "var(--indigo-500)"];

function KPICard({ label, value, tone = "mint", delta, trend = "up", loading }) {
  return (
    <div className={`${styles.kpiCard} ${styles[`tone-${tone}`]}`}>
      <div className={styles.kpiIcon}>📦</div>
      <div className={styles.kpiMeta}>
        <div className={styles.kpiValueRow}>
          <div className={styles.kpiValue}>{loading ? "—" : value}</div>
          {delta && !loading && (
            <span className={`${styles.deltaPill} ${trend === "down" ? styles.deltaDown : styles.deltaUp}`}>
              {trend === "down" ? "▼" : "▲"} {delta}
            </span>
          )}
        </div>
        <div className={styles.kpiLabel}>{label}</div>
      </div>
    </div>
  );
}

function buildDayBuckets(n) {
  return Array.from({ length: n }).map((_, i) => {
    const d = subDays(new Date(), n - 1 - i);
    return { day: format(d, "EEE"), date: format(d, "MM/dd"), orders: 0 };
  });
}

const StoreAdminDashboard = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [storeInfo, setStoreInfo] = useState(null);
  const [kpi, setKpi] = useState({ total: 0, lowStock: 0, expired: 0, pending: 0, verified: "—" });
  const [categoryBar, setCategoryBar] = useState([]);
  const [inventoryPie, setInventoryPie] = useState([]);
  const [orderLine, setOrderLine] = useState(buildDayBuckets(7));
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    if (!storeId) return;

    async function fetchData() {
      setLoading(true);
      try {
        // Fetch store metadata
        const storeSnap = await getDoc(doc(db, "stores", storeId));
        if (storeSnap.exists()) {
          const sd = storeSnap.data();
          const verStatus = (sd.verificationStatus || sd.verification?.status || sd.status || "").toLowerCase();
          setStoreInfo(sd);
          // Store verification status for KPI
          const verLabel = verStatus === "approved" || verStatus === "active" ? "Verified"
            : verStatus === "pending" || verStatus === "submitted" ? "Pending"
            : verStatus === "rejected" ? "Rejected" : "—";
          setKpi(prev => ({ ...prev, verified: verLabel }));
        }

        // Fetch products
        const productsSnap = await getDocs(collection(db, "stores", storeId, "products"));
        const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const today = new Date();
        let lowStock = 0, expired = 0;
        const categoryMap = {};
        const catValueMap = {};

        products.forEach(p => {
          const stock = Number(p.stock || p.quantity || 0);
          if (stock > 0 && stock <= 10) lowStock++;

          // Expiry check
          if (p.expiryDate || p.expiry) {
            const expDate = new Date(p.expiryDate || p.expiry);
            if (!isNaN(expDate) && expDate < today) expired++;
          }

          // Category for bar chart
          const cat = p.category || "Other";
          categoryMap[cat] = (categoryMap[cat] || 0) + 1;

          // Inventory value for pie
          const price = Number(p.price || 0);
          catValueMap[cat] = (catValueMap[cat] || 0) + (price * stock);
        });

        const catArr = Object.entries(categoryMap)
          .sort((a, b) => b[1] - a[1]).slice(0, 5)
          .map(([category, views]) => ({ category, views }));
        setCategoryBar(catArr);

        const pieArr = Object.entries(catValueMap)
          .sort((a, b) => b[1] - a[1]).slice(0, 5)
          .map(([name, value]) => ({ name, value: Math.round(value) }));
        setInventoryPie(pieArr);

        setKpi(prev => ({
          ...prev,
          total: products.length,
          lowStock,
          expired,
        }));

        // Fetch recent orders (last 7 days)
        try {
          const ordersSnap = await getDocs(
            query(collection(db, "stores", storeId, "orders"), orderBy("createdAt", "desc"), limit(100))
          );
          const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

          const pending = orders.filter(o =>
            (o.status || "").toLowerCase() === "pending"
          ).length;
          setKpi(prev => ({ ...prev, pending }));

          // Map orders to day buckets
          const buckets = buildDayBuckets(7);
          orders.forEach(o => {
            const createdRaw = o.createdAt;
            if (!createdRaw) return;
            let created;
            if (createdRaw?.toMillis) created = new Date(createdRaw.toMillis());
            else if (createdRaw?.seconds) created = new Date(createdRaw.seconds * 1000);
            else created = new Date(createdRaw);
            if (isNaN(created)) return;
            const dayLabel = format(created, "EEE");
            const bucket = buckets.find(b => b.day === dayLabel);
            if (bucket) bucket.orders += 1;
          });
          setOrderLine(buckets);
        } catch { /* orders subcollection may not exist */ }

        // Fetch verification logs as recent activity
        try {
          const logsSnap = await getDocs(
            query(collection(db, "stores", storeId, "verificationLogs"), orderBy("timestamp", "desc"), limit(5))
          );
          const logs = logsSnap.docs.map(d => {
            const v = d.data();
            const ts = v.timestamp;
            let tsMs = null;
            if (ts?.toMillis) tsMs = ts.toMillis();
            else if (ts?.seconds) tsMs = ts.seconds * 1000;
            return v.action || v.text || "—";
          });
          if (logs.length > 0) setRecentActivity(logs);
        } catch { /* logs may not exist */ }

      } catch (err) {
        console.error("[StoreAdminDashboard] error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [storeId]);

  const kpiItems = [
    { label: "Total Products", value: kpi.total, tone: "mint" },
    { label: "Low Stock", value: kpi.lowStock, tone: "amber" },
    { label: "Expired Items", value: kpi.expired, tone: "indigo" },
    { label: "Pending Orders", value: kpi.pending, tone: "rose" },
    { label: "Verification", value: kpi.verified, tone: "sky" },
  ];

  return (
    <div className={styles.wrap}>
      <div className={styles.kpiRow}>
        {kpiItems.map((item, i) => (
          <KPICard key={i} label={item.label} value={String(item.value)} tone={item.tone} loading={loading} />
        ))}
      </div>

      <div className={styles.grid}>
        <section className={`${styles.card} ${styles.span7} ${styles.tall}`}>
          <h3 className={styles.cardTitle}>Orders This Week</h3>
          <div className={styles.chartPad}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={orderLine} margin={{ left: 10, right: 10 }}>
                <CartesianGrid vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={30} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="orders" stroke="var(--mint-500)" strokeWidth={2.4}
                  dot={{ r: 3, fill: "var(--mint-500)" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className={`${styles.card} ${styles.span5} ${styles.tall}`}>
          <h3 className={styles.cardTitle}>Products by Category</h3>
          <div className={styles.chartPad}>
            {categoryBar.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBar}>
                  <CartesianGrid vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="category" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} width={30} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="views" fill="var(--sky-500)" radius={[6, 6, 0, 0]} name="Products" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyChart}>No products yet</div>
            )}
          </div>
        </section>

        {inventoryPie.length > 0 && (
          <section className={`${styles.card} ${styles.span12} ${styles.tall}`}>
            <h3 className={styles.cardTitle}>Inventory Value by Category (₹)</h3>
            <div className={styles.chartPad}>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={inventoryPie} dataKey="value" nameKey="name" outerRadius={90} label>
                    {inventoryPie.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}
      </div>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Recent Activity</h3>
        {recentActivity.length > 0 ? (
          <ul>
            {recentActivity.map((activity, i) => (
              <li key={i} className={styles.activityItem}>{activity}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyState}>No recent activity recorded.</p>
        )}
      </section>
    </div>
  );
};

export default StoreAdminDashboard;
