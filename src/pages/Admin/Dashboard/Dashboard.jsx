import { useEffect, useMemo, useState } from "react";
import styles from "./Dashboard.module.css";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid,
} from "recharts";
import { format, startOfMonth } from "date-fns";
import { db, collection, getDocs, query, where } from "../../Auth/firebase";
import { useNavigate } from "react-router-dom";

const PIE_COLORS = ["var(--mint-500)", "var(--amber-500)", "var(--rose-500)"];

function Icon({ d, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d={d} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function KPICard({ label, value, tone = "mint", delta, trend = "up", icon, loading }) {
  return (
    <div className={`${styles.kpiCard} ${styles[`tone-${tone}`]}`}>
      <div className={styles.kpiIcon}>{icon}</div>
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

function Card({ title, subtitle, toolbar, className, children }) {
  return (
    <section className={`${styles.card} ${className || ""}`}>
      <header className={styles.cardHead}>
        <div>
          <h3 className={styles.cardTitle}>{title}</h3>
          {subtitle && <p className={styles.cardSub}>{subtitle}</p>}
        </div>
        {toolbar && <div className={styles.cardTools}>{toolbar}</div>}
      </header>
      <div className={styles.cardBody}>{children}</div>
    </section>
  );
}

function RangeTabs({ value, onChange }) {
  const tabs = ["7d", "30d", "90d", "YTD"];
  return (
    <div className={styles.tabs}>
      {tabs.map((t) => (
        <button key={t} onClick={() => onChange(t)}
          className={`${styles.tab} ${value === t ? styles.tabActive : ""}`}>
          {t}
        </button>
      ))}
    </div>
  );
}

function makeMonthBuckets(n) {
  const now = new Date();
  return Array.from({ length: n }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return { month: format(d, "MMM yy"), stores: 0 };
  });
}

export default function Dashboard() {
  const [range, setRange] = useState("90d");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [kpi, setKpi] = useState({ total: 0, pending: 0, active: 0, rejected: 0, products: 0, tickets: 0 });
  const [growthData, setGrowthData] = useState(makeMonthBuckets(12));
  const [verificationData, setVerificationData] = useState([
    { name: "Approved", value: 0 },
    { name: "Pending", value: 0 },
    { name: "Rejected", value: 0 },
  ]);
  const [categoryData, setCategoryData] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        const storesSnap = await getDocs(collection(db, "stores"));
        const stores = storesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        let pendingStores = 0, activeStores = 0, rejectedStores = 0;
        let approved = 0, pendingV = 0, rejectedV = 0;
        const buckets = makeMonthBuckets(12);

        stores.forEach(s => {
          const rawStatus = (
            s.verificationStatus || s.verification?.status || s.status || ""
          ).toLowerCase();

          if (rawStatus === "pending" || rawStatus === "submitted") pendingStores++;
          else if (rawStatus === "approved" || rawStatus === "active") activeStores++;
          else if (rawStatus === "rejected") rejectedStores++;

          if (rawStatus === "approved" || rawStatus === "active") approved++;
          else if (rawStatus === "pending" || rawStatus === "submitted") pendingV++;
          else if (rawStatus === "rejected") rejectedV++;

          const createdRaw = s.createdAt || s.submittedAt;
          if (createdRaw) {
            let createdDate;
            if (createdRaw?.toMillis) createdDate = new Date(createdRaw.toMillis());
            else if (createdRaw?.seconds) createdDate = new Date(createdRaw.seconds * 1000);
            else createdDate = new Date(createdRaw);
            if (!isNaN(createdDate)) {
              const monthLabel = format(startOfMonth(createdDate), "MMM yy");
              const bucket = buckets.find(b => b.month === monthLabel);
              if (bucket) bucket.stores += 1;
            }
          }
        });

        // Make cumulative
        let cumulative = 0;
        const growthCumulative = buckets.map(b => {
          cumulative += b.stores;
          return { ...b, stores: cumulative };
        });

        setGrowthData(growthCumulative);
        setVerificationData([
          { name: "Approved", value: approved },
          { name: "Pending", value: pendingV },
          { name: "Rejected", value: rejectedV },
        ]);
        setPendingCount(pendingStores);

        // Aggregate products from store subcollections (sample first 30 stores for performance)
        let productCount = 0;
        const categoryMap = {};
        const sampleStores = stores.slice(0, 30);
        await Promise.all(sampleStores.map(async (s) => {
          try {
            const pSnap = await getDocs(collection(db, "stores", s.id, "products"));
            productCount += pSnap.size;
            pSnap.docs.forEach(pd => {
              const cat = pd.data().category || "Other";
              categoryMap[cat] = (categoryMap[cat] || 0) + 1;
            });
          } catch {
            // subcollection may not exist for this store
          }
        }));

        const catArr = Object.entries(categoryMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([name, value]) => ({ name, value }));
        if (catArr.length > 0) setCategoryData(catArr);

        let openTickets = 0;
        try {
          const ticketsSnap = await getDocs(
            query(collection(db, "supportTickets"), where("status", "==", "Open"))
          );
          openTickets = ticketsSnap.size;
        } catch { /* collection may not exist */ }

        setKpi({
          total: stores.length,
          pending: pendingStores,
          active: activeStores,
          rejected: rejectedStores,
          products: productCount,
          tickets: openTickets,
        });
      } catch (err) {
        console.error("[Dashboard] fetchDashboardData error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const growthView = useMemo(() => {
    switch (range) {
      case "7d":  return growthData.slice(-2);
      case "30d": return growthData.slice(-4);
      case "90d": return growthData.slice(-6);
      default:    return growthData;
    }
  }, [range, growthData]);

  const fmt = (n) => n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n);

  return (
    <div className={styles.wrap}>
      {pendingCount > 0 && (
        <div className={styles.alerts}>
          <div className={styles.alertPill} role="status" aria-live="polite">
            <span className={styles.alertDot} />
            <strong>{pendingCount} store{pendingCount !== 1 ? "s" : ""}</strong> awaiting verification.&nbsp;
            <a href="#" onClick={(e) => { e.preventDefault(); navigate("/admin/verification"); }}>
              Review now →
            </a>
          </div>
        </div>
      )}

      <div className={styles.kpiRow}>
        <KPICard label="Total Stores" value={fmt(kpi.total)} tone="mint" loading={loading}
          icon={<Icon d="M3 6h18M3 12h18M3 18h18" />} />
        <KPICard label="Pending Verifications" value={fmt(kpi.pending)} tone="amber" loading={loading}
          icon={<Icon d="M7 7h10M7 12h10M7 17h6" />} />
        <KPICard label="Active Stores" value={fmt(kpi.active)} tone="indigo" loading={loading}
          icon={<Icon d="M4 6h16v12H4z" />} />
        <KPICard label="Rejected Stores" value={fmt(kpi.rejected)} tone="rose" loading={loading}
          icon={<Icon d="M6 6l12 12M18 6L6 18" />} />
        <KPICard label="Total Products" value={fmt(kpi.products)} tone="sky" loading={loading}
          icon={<Icon d="M4 7h16M4 12h16M4 17h10" />} />
        <KPICard label="Open Tickets" value={fmt(kpi.tickets)} tone="slate" loading={loading}
          icon={<Icon d="M3 8l9 6 9-6M5 19h14" />} />
      </div>

      <div className={styles.grid}>
        <Card className={`${styles.span7} ${styles.tall}`}
          title="Store Growth Over Time"
          subtitle="Cumulative onboarded stores by month"
          toolbar={<RangeTabs value={range} onChange={setRange} />}>
          <div className={styles.chartPad}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthView} margin={{ left: 12, right: 12, top: 28, bottom: 10 }}>
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--mint-500)" />
                    <stop offset="100%" stopColor="var(--indigo-500)" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis tickLine={false} axisLine={false} width={36} tickMargin={10} domain={[0, "dataMax + 5"]} />
                <Tooltip cursor={{ stroke: "#D1D5DB" }} />
                <Line type="monotone" dataKey="stores" stroke="url(#lineGrad)" strokeWidth={2.6}
                  dot={{ r: 3, fill: "var(--indigo-500)", stroke: "white", strokeWidth: 1 }}
                  activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className={`${styles.span5} ${styles.tall}`}
          title="Verification Status Ratio"
          subtitle="Approved / Pending / Rejected">
          <div className={styles.pieArea}>
            <div className={styles.pieSquare}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={verificationData} cx="50%" cy="50%" outerRadius="80%"
                    paddingAngle={2} stroke="#fff" strokeWidth={2} dataKey="value">
                    {verificationData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.legendTight}>
              {verificationData.map((s, i) => (
                <div className={styles.legendItem} key={s.name}>
                  <span className={styles.legendDot} style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {s.name} <b>{s.value}</b>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {categoryData.length > 0 && (
          <Card className={`${styles.span12} ${styles.tallWide}`}
            title="Popular Product Categories"
            subtitle="Top categories across all registered stores">
            <div className={styles.barPad}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ left: 14, right: 14, top: 8, bottom: 10 }} barCategoryGap={24}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--indigo-500)" />
                      <stop offset="100%" stopColor="var(--mint-500)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis tickLine={false} axisLine={false} width={36} tickMargin={10} domain={[0, "dataMax + 5"]} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="url(#barGrad)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>

      <div className={styles.actionsRow}>
        <a href="#" onClick={(e) => { e.preventDefault(); navigate("/admin/verification"); }}
          className={`${styles.actionBtn} ${styles.accentMint}`}>
          <Icon d="M7 7h10M7 12h10M7 17h6" />
          <span>View Pending Stores</span>
        </a>
        <a href="#" onClick={(e) => { e.preventDefault(); navigate("/admin/stores"); }}
          className={`${styles.actionBtn} ${styles.accentIndigo}`}>
          <Icon d="M4 6h16v12H4z" />
          <span>Manage All Stores</span>
        </a>
        <a href="#" onClick={(e) => { e.preventDefault(); navigate("/admin/support"); }}
          className={`${styles.actionBtn} ${styles.accentSky}`}>
          <Icon d="M3 8l9 6 9-6M5 19h14" />
          <span>View Support Tickets</span>
        </a>
      </div>
    </div>
  );
}
