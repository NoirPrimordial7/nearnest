// src/pages/StoreAdmin/Analytics.jsx
import React, { useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar";
import "./analytics.css";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";
import { Download, Printer } from "lucide-react";

/* ============ utils ============ */
function downloadCSV(filename, rows) {
  const csv = rows
    .map(r => r.map(x => (typeof x === "string" ? `"${x.replace(/"/g,'""')}"` : x)).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/* Shared gradient ids (must be unique in page) */
const GRADIENTS = {
  primary: ["#6aa8ff", "#6aa8ff"],
  green: ["#4b8de9ff", "#4b8de9ff"],
  amber: ["#3263adff", "#48699cff"],
  red: ["#ff9aa7", "#ef4444"],
  violet: ["#cabdff", "#8b5cf6"],
  cyan: ["#95f5ff", "#06b6d4"],
  lime: ["#d1ff7a", "#84cc16"],
  pink: ["#315b9aff", "#173f7aff"],
  teal: ["#a8fff0", "#14b8a6"],
};

const PIE_TAGS = [
  { tag: "OTC",          grad: "primary", value: 520 },
  { tag: "Prescription", grad: "green",   value: 380 },
  { tag: "Ayurveda",     grad: "amber",   value: 210 },
  { tag: "Homeopathy",   grad: "pink",    value: 120 },
  { tag: "Herbal",       grad: "violet",  value: 160 },
  { tag: "Wellness",     grad: "cyan",    value: 190 },
];

/* Nicely positioned percentage labels outside the donut */
const renderPercentLabel = ({ cx, cy, midAngle, outerRadius, percent }) => {
  const RAD = Math.PI / 180;
  const r = outerRadius + 18; // push label outside
  const x = cx + r * Math.cos(-midAngle * RAD);
  const y = cy + r * Math.sin(-midAngle * RAD);
  const pct = Math.round(percent * 100);
  return (
    <text
      x={x}
      y={y}
      fill="#e9edf3"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      style={{ fontWeight: 800, fontSize: 12, letterSpacing: .2 }}
    >
      {pct}%
    </text>
  );
};

export default function Analytics() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ===== Demo data (swap with Firestore later) =====
  const searched = [
    { name: "Paracetamol 650", count: 420 },
    { name: "Metformin 500", count: 380 },
    { name: "Amlodipine 5", count: 300 },
    { name: "Azithromycin", count: 260 },
    { name: "Dolo 650", count: 240 },
    { name: "Amoxicillin", count: 210 },
    { name: "Cough Syrup", count: 190 },
    { name: "Vitamin D3", count: 170 },
    { name: "Pantoprazole", count: 160 },
    { name: "Losartan 50", count: 150 },
  ];

  const mostViewed = [
    { label: "Metformin", views: 540 },
    { label: "Paracetamol", views: 470 },
    { label: "Amlodipine", views: 410 },
    { label: "Azithromycin", views: 360 },
    { label: "Vitamin D3", views: 320 },
  ];

  const salesTrend = [
    { m: "Jan", sales: 120 },
    { m: "Feb", sales: 160 },
    { m: "Mar", sales: 150 },
    { m: "Apr", sales: 190 },
    { m: "May", sales: 210 },
    { m: "Jun", sales: 240 },
    { m: "Jul", sales: 230 },
    { m: "Aug", sales: 260 },
    { m: "Sep", sales: 280 },
    { m: "Oct", sales: 300 },
    { m: "Nov", sales: 310 },
    { m: "Dec", sales: 350 },
  ];

  const turnover = [
    { m: "Jan", in: 300, out: 250 },
    { m: "Feb", in: 260, out: 220 },
    { m: "Mar", in: 310, out: 270 },
    { m: "Apr", in: 330, out: 300 },
    { m: "May", in: 350, out: 340 },
    { m: "Jun", in: 370, out: 360 },
  ];

  const tagSales = PIE_TAGS;

  // Filters (UI only for now)
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [category, setCategory] = useState("All");
  const categories = useMemo(
    () => ["All", "Diabetes", "Cardio", "Pain Relief", "Cold & Cough", "Supplements"],
    []
  );

  const onExportCSV = () => {
    const rows = [
      ["Metric", "Label", "Value"],
      ...searched.map(s => ["Top Searched", s.name, s.count]),
      ...mostViewed.map(v => ["Most Viewed", v.label, v.views]),
      ...tagSales.map(t => ["Sales by Tag", t.tag, t.value]),
      ...salesTrend.map(s => ["Monthly Sales", s.m, s.sales]),
      ...turnover.map(t => ["Inventory In", t.m, t.in]),
      ...turnover.map(t => ["Inventory Out", t.m, t.out]),
    ];
    downloadCSV("analytics_report.csv", rows);
  };
  const onPrintPDF = () => window.print();

  /* ============ Custom tooltip styles ============ */
  const tooltipStyle = {
    background: "#ebeef1ff",
    border: "2px solid #26d829ff",
    borderRadius: 20,
    padding: 10,
    color: "#0a0a0aff",
    boxShadow: "0 10px 30px rgba(0,0,0,.45)",
  };

  /* ============ Gradient defs for all charts ============ */
  const renderDefs = () => (
    <defs>
      {Object.entries(GRADIENTS).map(([key, [from, to]]) => (
        <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      ))}
    </defs>
  );

  return (
    <div className="ar-root dark">
      <div className="sa-shell">
        {/* Sidebar */}
        <aside className={`sa-left ${sidebarCollapsed ? "collapsed" : ""}`}>
          <div className="sa-left-inner">
            <Sidebar
              role="store"
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </div>
        </aside>

        {/* Content */}
        <main className={`sa-right ${sidebarCollapsed ? "shifted" : ""}`}>
          <div className="ar-container" id="print-area">
            {/* Header */}
            <header className="ar-head">
              <div>
                <h1>Analytics / Reports</h1>
                <p>Insights to help you understand performance.</p>
              </div>
              <div className="ar-actions">
                <button className="btn ghost" onClick={onExportCSV}>
                  <Download size={16} /> Export CSV
                </button>
                <button className="btn primary" onClick={onPrintPDF}>
                  <Printer size={16} /> Print PDF
                </button>
              </div>
            </header>

            {/* Filters */}
            <section className="ar-filters">
              <div className="filter-group">
                <label>Date From</label>
                <input type="date" className="input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div className="filter-group">
                <label>Date To</label>
                <input type="date" className="input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
              <div className="filter-group">
                <label>Filter: Category</label>
                <select className="select" value={category} onChange={e => setCategory(e.target.value)}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </section>

            {/* Grid */}
            <section className="ar-grid">
              {/* Top searched */}
              <div className="card">
                <div className="card-head">
                  <h3>Top 10 Searched Medicines</h3>
                </div>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr><th>#</th><th>Name</th><th>Search Count</th></tr>
                    </thead>
                    <tbody>
                      {searched.map((s, i) => (
                        <tr key={s.name}>
                          <td>{i + 1}</td>
                          <td className="strong">{s.name}</td>
                          <td>{s.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Most viewed (Bar with gradient) */}
              <div className="card">
                <div className="card-head">
                  <h3>Most Viewed Products</h3>
                </div>
                <div className="chart tall">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mostViewed} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      {renderDefs()}
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="views" radius={[10, 10, 0, 0]} fill="url(#grad-primary)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tag-wise sales (Pie with pro gradients + external % labels) */}
              <div className="card">
                <div className="card-head">
                  <h3>Sales by Tags</h3>
                </div>
                <div className="chart pie-pro">
                  <ResponsiveContainer width="100%" height={420}>
                    <PieChart margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                      {renderDefs()}
                      <Pie
                        data={tagSales}
                        dataKey="value"
                        nameKey="tag"
                        innerRadius={72}
                        outerRadius={128}
                        paddingAngle={2}
                        isAnimationActive={true}
                        labelLine={{ stroke: "#243042", strokeWidth: 1 }}
                        label={renderPercentLabel}
                        stroke="#0b0d12"
                        strokeWidth={2}
                      >
                        {tagSales.map((d, i) => (
                          <Cell key={i} fill={`url(#grad-${d.grad})`} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        wrapperStyle={{ paddingTop: 8 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly sales trend (Line with gradient stroke) */}
              <div className="card">
                <div className="card-head">
                  <h3>Monthly Sales Trend</h3>
                </div>
                <div className="chart tall">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      {renderDefs()}
                      <XAxis dataKey="m" />
                      <YAxis />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line
                        type="monotone"
                        dataKey="sales"
                        stroke="url(#grad-green)"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Inventory turnover (two gradient lines) */}
              <div className="card wide">
                <div className="card-head">
                  <h3>Inventory Turnover (Stock Movement)</h3>
                </div>
                <div className="chart tall">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={turnover} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      {renderDefs()}
                      <XAxis dataKey="m" />
                      <YAxis />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                      <Line type="monotone" dataKey="in"  stroke="url(#grad-cyan)" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="out" stroke="url(#grad-red)"  strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
