// src/pages/SupportTeam/SupportDashboard.jsx

import { useEffect, useState } from "react";
import "./supportDashboard.css";
import AllTickets from "./AllTickets.jsx";
import SupportAnalytics from "./SupportAnalytics";
import Internal from "./Internal";


function getNow() {
  const now = new Date();
  const time = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const date = now.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return { time, date };
}

function StatCard({ label, value, sub }) {
  return (
    <div className="sd-stat-card">
      <div className="sd-stat-label">{label}</div>
      <div className="sd-stat-value">{value}</div>
      {sub && <div className="sd-stat-sub">{sub}</div>}
    </div>
  );
}

function SidebarIcon({ d }) {
  return (
    <svg className="sd-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default function SupportDashboard() {
  const [dateTime, setDateTime] = useState(getNow());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeMenu, setActiveMenu] = useState("liveQueue"); // "liveQueue" | "allTickets" | "analytics" | "internalDiscussions" | "internalQueries"

  useEffect(() => {
    const id = setInterval(() => setDateTime(getNow()), 1000);
    return () => clearInterval(id);
  }, []);

  const sidebarItems = [
    {
      key: "liveQueue",
      label: "Live Queue",
      d: "M4 5h16v3H4zm0 5h11v3H4zm0 5h8v3H4z",
    },
    {
      key: "allTickets",
      label: "All Tickets",
      d: "M4 6h16v3l-2 2 2 2v3H4v-3l2-2-2-2z",
    },
    {
      key: "analytics",
      label: "Analytics",
      d: "M5 19V9h3v10H5zm5 0V5h3v14h-3zm5 0v-7h3v7h-3z",
    },
    {
      key: "internalDiscussions",
      label: "Internal Discussions",
      d: "M4 5h16v8H7l-3 3V5zm5 10h8l3 3v1H9z",
    },
  ];

  const mockTickets = [
    {
      id: "#MF-1024",
      issue: "Payment failed at checkout",
      priority: "High",
      state: "Waiting for agent",
      sla: "< 10 min",
    },
    {
      id: "#MF-1021",
      issue: "Prescription not visible",
      priority: "Medium",
      state: "In progress",
      sla: "< 20 min",
    },
    {
      id: "#MF-1019",
      issue: "Store verification follow-up",
      priority: "High",
      state: "Escalated",
      sla: "< 5 min",
    },
    {
      id: "#MF-1013",
      issue: "Order tracking delay",
      priority: "Low",
      state: "Resolved",
      sla: "Met",
    },
  ];

  const recent = [
    "High priority queue cleared within target time.",
    "Store onboarding issue resolved with clear steps shared.",
    "Duplicate tickets merged to keep queue clean.",
    "Short outage handled with quick user updates.",
  ];

  return (
    <div className="sd-shell">
      {/* Sidebar */}
      <aside className="sd-sidebar">
        <div className="sd-brand">
          <div className="sd-brand-mark">MF</div>
          <div className="sd-brand-text">
            <div className="sd-brand-title">MediFind</div>
            <div className="sd-brand-sub">Support</div>
          </div>
        </div>

        <div className="sd-sidebar-label">Menu</div>
        <nav className="sd-nav">
          {sidebarItems.map((item) => (
            <div
              key={item.key}
              className={
                "sd-nav-item" +
                (activeMenu === item.key ? " sd-nav-item-active" : "")
              }
              onClick={() => setActiveMenu(item.key)}
            >
              <SidebarIcon d={item.d} />
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <div className="sd-sidebar-label">Session</div>
        <div className="sd-session">
          <div className="sd-session-time">{dateTime.time}</div>
          <div className="sd-session-date">{dateTime.date}</div>
          <div className="sd-session-note">
            Monitoring tickets and SLAs in real time.
          </div>
        </div>
      </aside>

      {/* Main container */}
      <main className="sd-main">
        {/* Top header */}
        <header className="sd-header">
          <div>
            <h1 className="sd-title">Support Dashboard</h1>
            <p className="sd-subtitle">
              Clear, simple control panel for support operations.
            </p>
          </div>
          <div className="sd-header-right">
            <div className="sd-pill sd-pill-live">Live: Stable</div>
            <div className="sd-pill">Data synced</div>
            <button
              className="sd-pill sd-logout-btn"
              onClick={() => setShowLogoutConfirm(true)}
            >
              Logout
            </button>
          </div>
        </header>

        {/* CONTENT: One-page "routing" via activeMenu */}

        {activeMenu === "liveQueue" && (
          <>
            {/* Stats */}
            <section className="sd-stats-row">
              <StatCard
                label="Open Tickets"
                value="42"
                sub="12 High · 18 Medium · 12 Low"
              />
              <StatCard
                label="Avg First Response"
                value="3m 18s"
                sub="Target under 5m"
              />
              <StatCard
                label="SLA Compliance"
                value="98.4%"
                sub="Last 24 hours"
              />
              <StatCard
                label="Agents Online"
                value="9"
                sub="Support team active"
              />
            </section>

            {/* Live Queue + SLA */}
            <section className="sd-grid-2">
              {/* Live Ticket Queue */}
              <div className="sd-card">
                <div className="sd-card-header">
                  <div>
                    <h2>Live Ticket Queue</h2>
                    <p>Active issues sorted by priority.</p>
                  </div>
                  <div className="sd-filter-pill">Sample data</div>
                </div>
                <div className="sd-table">
                  <div className="sd-table-head">
                    <span>ID</span>
                    <span>Issue</span>
                    <span>Priority</span>
                    <span>Status</span>
                    <span>SLA</span>
                  </div>
                  {mockTickets.map((t) => (
                    <div key={t.id} className="sd-table-row">
                      <span className="sd-mono">{t.id}</span>
                      <span>{t.issue}</span>
                      <span
                        className={`sd-priority sd-${t.priority.toLowerCase()}`}
                      >
                        {t.priority}
                      </span>
                      <span className="sd-state">{t.state}</span>
                      <span className="sd-sla">{t.sla}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SLA Overview */}
              <div className="sd-card">
                <div className="sd-card-header">
                  <div>
                    <h2>SLA Overview</h2>
                    <p>Performance against response and resolution targets.</p>
                  </div>
                </div>

                <div className="sd-load-block">
                  <div className="sd-load-label">
                    High Priority Tickets
                    <span className="sd-load-value">91% within SLA</span>
                  </div>
                  <div className="sd-bar">
                    <div className="sd-bar-fill sd-bar-fill-high" />
                  </div>
                </div>

                <div className="sd-load-block">
                  <div className="sd-load-label">
                    Overall Queue Health
                    <span className="sd-load-value">Healthy</span>
                  </div>
                  <div className="sd-bar">
                    <div className="sd-bar-fill sd-bar-fill-ok" />
                  </div>
                </div>

                <div className="sd-load-block">
                  <div className="sd-load-label">
                    At-Risk Tickets
                    <span className="sd-load-value">3 near breach</span>
                  </div>
                  <div className="sd-bar">
                    <div className="sd-bar-fill sd-bar-fill-mid" />
                  </div>
                </div>

                <div className="sd-divider" />

                <div className="sd-mini-grid">
                  <div>
                    <div className="sd-mini-label">Peak Hours</div>
                    <div className="sd-mini-value">09:00 – 11:30</div>
                  </div>
                  <div>
                    <div className="sd-mini-label">Escalation Rate</div>
                    <div className="sd-mini-value">3.8%</div>
                  </div>
                  <div>
                    <div className="sd-mini-label">CSAT (last 500)</div>
                    <div className="sd-mini-value">4.9 / 5</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Recent Activity */}
            <section className="sd-card sd-activity">
              <div className="sd-card-header">
                <div>
                  <h2>Recent Activity</h2>
                  <p>Key updates from the last few hours.</p>
                </div>
              </div>
              <div className="sd-activity-list">
                {recent.map((item, i) => (
                  <div key={i} className="sd-activity-item">
                    <div className="sd-activity-dot" />
                    <div className="sd-activity-text">{item}</div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activeMenu === "allTickets" && <AllTickets />}

        {activeMenu === "analytics" && <SupportAnalytics />}

        {activeMenu === "internalDiscussions" && <Internal />}


    

        {/* Logout Confirm Modal */}
        {showLogoutConfirm && (
          <div className="sd-modal-backdrop">
            <div className="sd-modal">
              <h3 className="sd-modal-title">Logout</h3>
              <p className="sd-modal-text">
                Are you sure you want to logout?
              </p>
              <div className="sd-modal-actions">
                <button
                  className="sd-modal-btn sd-modal-yes"
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    // Add real logout logic here later (e.g. auth signOut, redirect)
                  }}
                >
                  Yes
                </button>
                <button
                  className="sd-modal-btn sd-modal-no"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
