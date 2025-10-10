import { useMemo, useState } from "react";
import styles from "./Dashboard.module.css";
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
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";

/* -----------------------  Mock data  ----------------------- */
const makeMonthly = (months = 12) => {
  const now = new Date();
  return Array.from({ length: months }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    return {
      month: format(d, "MMM yy"),
      stores: Math.max(40, 40 + i * 8 + Math.round(Math.random() * 30)),
    };
  });
};

const storeGrowthData = makeMonthly(12);

const verificationStatusData = [
  { name: "Approved", value: 62 },
  { name: "Pending", value: 14 },
  { name: "Rejected", value: 6 },
];

const popularCategoriesData = [
  { name: "Pain Relief", value: 120 },
  { name: "Vitamins", value: 95 },
  { name: "Cough & Cold", value: 82 },
  { name: "Diabetes", value: 70 },
  { name: "Skin Care", value: 66 },
  { name: "Cardiac", value: 48 },
];

const COLORS = ["#111111", "#9CA3AF", "#E5E7EB"]; // black, gray, light gray

const kpi = [
  { label: "Total Stores", value: "1,248" },
  { label: "Pending Verifications", value: "14" },
  { label: "Active Stores", value: "1,062" },
  { label: "Rejected Stores", value: "24" },
  { label: "Total Products", value: "92,344" },
  { label: "Open Tickets", value: "18" },
];

function Icon({ d, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d={d} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* -----------------------  UI bits  ----------------------- */
function KPICard({ label, value, icon }) {
  return (
    <div className={styles.kpiCard}>
      <div className={styles.kpiIcon}>{icon}</div>
      <div className={styles.kpiMeta}>
        <div className={styles.kpiValue}>{value}</div>
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
        <p className={styles.cardSub}>{subtitle}</p>
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
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`${styles.tab} ${value === t ? styles.tabActive : ""}`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

/* -----------------------  Dashboard  ----------------------- */
export default function Dashboard() {
  const [range, setRange] = useState("90d");

  const growthView = useMemo(() => {
    switch (range) {
      case "7d":
        return storeGrowthData.slice(-3);
      case "30d":
        return storeGrowthData.slice(-4);
      case "90d":
        return storeGrowthData.slice(-6);
      default:
        return storeGrowthData;
    }
  }, [range]);

  return (
    <div className={styles.wrap}>
      {/* Alerts */}
      <div className={styles.alerts}>
        <div className={styles.alertPill} role="status" aria-live="polite">
          <span className={styles.alertDot} />
          <strong>5 stores</strong> are awaiting verification.&nbsp;
          <a href="#" onClick={(e) => e.preventDefault()}>
            Review now →
          </a>
        </div>
      </div>

      {/* KPIs */}
      <div className={styles.kpiRow}>
        <KPICard label="Total Stores" value={kpi[0].value} icon={<Icon d="M3 6h18M3 12h18M3 18h18" />} />
        <KPICard label="Pending Verifications" value={kpi[1].value} icon={<Icon d="M7 7h10M7 12h10M7 17h6" />} />
        <KPICard label="Active Stores" value={kpi[2].value} icon={<Icon d="M4 6h16v12H4z" />} />
        <KPICard label="Rejected Stores" value={kpi[3].value} icon={<Icon d="M6 6l12 12M18 6L6 18" />} />
        <KPICard label="Total Products" value={kpi[4].value} icon={<Icon d="M4 7h16M4 12h16M4 17h10" />} />
        <KPICard label="Open Tickets" value={kpi[5].value} icon={<Icon d="M3 8l9 6 9-6M5 19h14" />} />
      </div>

      {/* Charts */}
      <div className={styles.grid}>
        <Card
          className={`${styles.span7} ${styles.tall}`}
          title="Store Growth Over Time"
          subtitle="Monthly onboarded stores"
          toolbar={<RangeTabs value={range} onChange={setRange} />}
        >
          <div className={styles.chartPad}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthView} margin={{ left: 12, right: 12, top: 8, bottom: 10 }}>
                <CartesianGrid vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis tickLine={false} axisLine={false} width={36} tickMargin={10} />
                <Tooltip cursor={{ stroke: "#D1D5DB" }} />
                <Line
                  type="monotone"
                  dataKey="stores"
                  stroke="#111"
                  strokeWidth={2.2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card
          className={`${styles.span5} ${styles.tall}`}
          title="Verification Status Ratio"
          subtitle="Approved / Pending / Rejected"
        >
          <div className={styles.pieArea}>
            <div className={styles.pieSquare}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={verificationStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    paddingAngle={2}
                    stroke="#fff"
                    strokeWidth={2}
                    dataKey="value"
                  >
                    {verificationStatusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.legendTight}>
              {verificationStatusData.map((s, i) => (
                <div className={styles.legendItem} key={s.name}>
                  <span className={styles.legendDot} style={{ background: COLORS[i % COLORS.length] }} />
                  {s.name} <b>{s.value}</b>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card
          className={`${styles.span12} ${styles.tallWide}`}
          title="Popular Categories / Most Requested Medicines"
          subtitle="Top ordered categories"
        >
          <div className={styles.barPad}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={popularCategoriesData}
                margin={{ left: 14, right: 14, top: 8, bottom: 10 }}
                barCategoryGap={22}
              >
                <CartesianGrid vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis tickLine={false} axisLine={false} width={36} tickMargin={10} domain={[0, "dataMax + 20"]} />
                <Tooltip />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#111" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <div className={styles.actionsRow}>
        <a href="#" onClick={(e) => e.preventDefault()} className={styles.actionBtn}>
          <Icon d="M7 7h10M7 12h10M7 17h6" />
          <span>View Pending Stores</span>
        </a>
        <a href="#" onClick={(e) => e.preventDefault()} className={styles.actionBtn}>
          <Icon d="M12 4v16M4 12h16" />
          <span>Create New Admin Role</span>
        </a>
        <a href="#" onClick={(e) => e.preventDefault()} className={styles.actionBtn}>
          <Icon d="M3 17h3v-6H3v6zm5 0h3V7H8v10zm5 0h3V11h-3v6zm5 0h3V5h-3v12z" />
          <span>Generate Analytics Report</span>
        </a>
      </div>
    </div>
  );
}
