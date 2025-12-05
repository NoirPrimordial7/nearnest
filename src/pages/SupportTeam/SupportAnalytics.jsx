import React, { useMemo, useState } from "react";
import "./supportAnalytics.css";

/**
 * FUTUREPROOF SETUP:
 * - Replace TREND_DATA with live data from Firebase.
 * - For each range key ("7D", "1W", "1M", "1Y"),
 *   load the right time-series based on storeId or global stats.
 */

const CATEGORY_STATS = [
  { key: "payment", label: "Payment Issues", count: 42 },
  { key: "order", label: "Order / Delivery", count: 31 },
  { key: "verification", label: "Verification & KYC", count: 18 },
  { key: "technical", label: "App / Panel Issues", count: 15 },
  { key: "listing", label: "Store Listing & Details", count: 9 },
];

// Time-series for different ranges (sample values)
const TREND_DATA = {
  // Last 7 days (daily)
  "7D": [
    { label: "Day 1", count: 40 },
    { label: "Day 2", count: 52 },
    { label: "Day 3", count: 48 },
    { label: "Day 4", count: 60 },
    { label: "Day 5", count: 55 },
    { label: "Day 6", count: 44 },
    { label: "Day 7", count: 50 },
  ],

  // Last 1 week (hourly blocks or sessions, grouped here as example)
  "1W": [
    { label: "Mon", count: 42 },
    { label: "Tue", count: 46 },
    { label: "Wed", count: 40 },
    { label: "Thu", count: 53 },
    { label: "Fri", count: 58 },
    { label: "Sat", count: 47 },
    { label: "Sun", count: 33 },
  ],

  // Last 1 month (weekly totals)
  "1M": [
    { label: "W1", count: 210 },
    { label: "W2", count: 240 },
    { label: "W3", count: 230 },
    { label: "W4", count: 260 },
  ],

  // Last 1 year (monthly totals)
  "1Y": [
    { label: "Jan", count: 780 },
    { label: "Feb", count: 820 },
    { label: "Mar", count: 840 },
    { label: "Apr", count: 790 },
    { label: "May", count: 910 },
    { label: "Jun", count: 880 },
    { label: "Jul", count: 920 },
    { label: "Aug", count: 960 },
    { label: "Sep", count: 930 },
    { label: "Oct", count: 970 },
    { label: "Nov", count: 990 },
    { label: "Dec", count: 0 }, // to be filled as year progresses
  ],
};

const RANGE_OPTIONS = [
  { key: "7D", label: "7D" },
  { key: "1W", label: "1W" },
  { key: "1M", label: "1M" },
  { key: "1Y", label: "1Y" },
];

const SupportAnalytics = () => {
  const [activeRange, setActiveRange] = useState("7D");

  const trendData = useMemo(
    () => TREND_DATA[activeRange] || [],
    [activeRange]
  );

  const summary = useMemo(() => {
    if (!trendData.length) {
      return {
        totalQueries: 0,
        last: 0,
        diff: 0,
        diffPct: 0,
        topCategory: { label: "-", count: 0 },
      };
    }

    const totalQueries = trendData.reduce(
      (sum, d) => sum + (d.count || 0),
      0
    );
    const last = trendData[trendData.length - 1]?.count || 0;
    const prev =
      trendData[trendData.length - 2]?.count || trendData[0]?.count || last;
    const diff = last - prev;
    const diffPct = prev ? (diff / prev) * 100 : 0;

    const topCategory = CATEGORY_STATS.reduce(
      (top, c) => (c.count > top.count ? c : top),
      { label: "-", count: 0 }
    );

    return {
      totalQueries,
      last,
      diff,
      diffPct,
      topCategory,
    };
  }, [trendData]);

  const maxCategory = Math.max(
    ...CATEGORY_STATS.map((c) => c.count),
    1
  );
  const maxTrend = Math.max(...trendData.map((d) => d.count || 0), 1);

  return (
    <div className="sa-wrapper">
      {/* Header */}
      <div className="sa-header-card">
        <div>
          <h1>Support Analytics</h1>
          <p>
            Simple, clean view of tickets and trends. All numbers below are
            sample values and ready to be replaced with your live Firebase
            data per store ID.
          </p>
        </div>
        <div className="sa-header-metrics">
          <div className="sa-metric">
            <div className="sa-metric-label">
              Total Queries ({activeRange})
            </div>
            <div className="sa-metric-value">
              {summary.totalQueries}
            </div>
          </div>
          <div className="sa-metric">
            <div className="sa-metric-label">Top Category</div>
            <div className="sa-metric-value">
              {summary.topCategory.label}
            </div>
          </div>
          <div className="sa-metric">
            <div className="sa-metric-label">Last vs Prev Point</div>
            <div
              className={
                "sa-metric-diff " +
                (summary.diff >= 0 ? "sa-up" : "sa-down")
              }
            >
              {summary.diff >= 0 ? "▲" : "▼"}{" "}
              {Math.abs(summary.diffPct).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="sa-grid">
        {/* Categories bar chart */}
        <div className="sa-card">
          <div className="sa-card-header">
            <h2>Queries by Category</h2>
            <p>
              See which issues are raised most often. Link this with your
              ticket type or tags.
            </p>
          </div>
          <div className="sa-bar-chart">
            {CATEGORY_STATS.map((cat) => {
              const width = (cat.count / maxCategory) * 100;
              return (
                <div className="sa-bar-row" key={cat.key}>
                  <div className="sa-bar-label">{cat.label}</div>
                  <div className="sa-bar-track">
                    <div
                      className="sa-bar-fill"
                      style={{ width: `${width || 4}%` }}
                    />
                  </div>
                  <div className="sa-bar-value">{cat.count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trend line chart */}
        <div className="sa-card">
          <div className="sa-card-header sa-card-header-inline">
            <div>
              <h2>Incoming Queries Trend</h2>
              <p>
                Track how many queries are coming in over your selected
                period. Works like a stock chart, but for support.
              </p>
            </div>
            <div className="sa-range-toggle">
              {RANGE_OPTIONS.map((range) => (
                <button
                  key={range.key}
                  className={
                    "sa-range-btn" +
                    (activeRange === range.key
                      ? " sa-range-btn-active"
                      : "")
                  }
                  onClick={() => setActiveRange(range.key)}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sa-line-chart">
            <svg
              viewBox="0 0 100 40"
              preserveAspectRatio="none"
              className="sa-line-svg"
            >
              <defs>
                <linearGradient
                  id="saLineGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#6366f1"
                    stopOpacity="0.42"
                  />
                  <stop
                    offset="100%"
                    stopColor="#111827"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>

              {trendData.length > 0 && (() => {
                const stepX =
                  trendData.length > 1
                    ? 100 / (trendData.length - 1)
                    : 0;

                const points = trendData.map((d, i) => {
                  const x = i * stepX;
                  const ratio = (d.count || 0) / maxTrend;
                  const y = 40 - ratio * 30 - 5; // top padding
                  return { x, y };
                });

                const lineD =
                  "M " +
                  points
                    .map(
                      (p) =>
                        `${p.x.toFixed(2)} ${p.y.toFixed(2)}`
                    )
                    .join(" L ");

                const areaD =
                  lineD +
                  ` L ${points[points.length - 1].x.toFixed(
                    2
                  )} 40 L 0 40 Z`;

                return (
                  <>
                    <path
                      d={areaD}
                      fill="url(#saLineGradient)"
                      stroke="none"
                    />
                    <path
                      d={lineD}
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {points.map((p, idx) => (
                      <circle
                        key={idx}
                        cx={p.x}
                        cy={p.y}
                        r="1.3"
                        fill="#a5b4fc"
                      />
                    ))}
                  </>
                );
              })()}
            </svg>

            <div className="sa-line-labels">
              {trendData.map((d) => (
                <div key={d.label} className="sa-line-label">
                  {d.label}
                </div>
              ))}
            </div>

            <div className="sa-line-legend">
              <span className="sa-dot" />
              Incoming queries for{" "}
              <span className="sa-legend-range">
                {activeRange}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SupportAnalytics;
