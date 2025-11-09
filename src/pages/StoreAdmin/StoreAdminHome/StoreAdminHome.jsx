// src/pages/StoreAdmin/StoreAdminHome.jsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Building2, PlusCircle } from "lucide-react";
import "./storeAdminHome.css";

/** TEMP DATA for local testing (replace with Firestore later) */
const MOCK_STORES = [
  { id: "alpha-pharma", name: "Alpha Pharma", status: "approved" },
  { id: "wellcare-medicals", name: "WellCare Medicals", status: "approved" },
  { id: "Medi-mart", name: "Medi Mart", status: "pending" },
];

export default function StoreAdminHome() {
  const navigate = useNavigate();

  const { approved, pending } = useMemo(
    () => ({
      approved: MOCK_STORES.filter((s) => s.status === "approved"),
      pending: MOCK_STORES.filter((s) => s.status === "pending"),
    }),
    []
  );

  const goToDashboard = (storeId) => {
    navigate(`/store-admin/${storeId}/dashboard`);
  };

  return (
    <div className="home-root">
      {/* Rolling marquee - now at top */}
      <div className="marquee-top" role="status" aria-live="polite">
        <div className="marquee">
          <span>Smart Inventory • Faster Approvals • Analytics • Multi-Store Dashboards • </span>
          <span> • Advertise Your Store With Us •  </span>
          <span>Smart Inventory • Faster Approvals • Analytics • Multi-Store Dashboards • </span>
        </div>
      </div>

      {/* Animated decorative background */}
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />

      {/* Hero */}
      <header className="hero section-enter">
        <div className="hero-left">
          <h1 className="hero-title">
            Welcome, <span className="accent">Rajendra Sharma</span>
          </h1>
          <p className="hero-sub">
            Your businesses at a glance — manage approvals, jump into dashboards,
            and track growth in one place.
          </p>

          <div className="hero-cta">
            <button
              className="btn btn-primary"
              onClick={() => navigate("/register-store")}
            >
              <PlusCircle size={18} />
              <span>Register Business</span>
            </button>

            <button
              className="btn btn-ghost"
              onClick={() =>
                window.scrollTo({ top: window.innerHeight, behavior: "smooth" })
              }
            >
              Explore Stores
            </button>
          </div>
        </div>

        {/* Canva-style hero card */}
        <div className="hero-card">
          <div className="hero-card-ring" />
          <div className="hero-card-core">
            <div className="hero-metric">
              <span className="metric-num">2</span>
              <span className="metric-label">Active Stores</span>
            </div>
            <div className="hero-metric">
              <span className="metric-num gold">1</span>
              <span className="metric-label">Pending</span>
            </div>
          </div>
        </div>
      </header>

      <main className="home-container">
        {/* My Stores */}
        <section className="panel section-enter">
          <div className="panel-head">
            <h2 className="panel-title">My Stores</h2>
            <span className="pill">{approved.length} Active</span>
          </div>

          {approved.length === 0 ? (
            <div className="empty">
              <Building2 size={28} />
              <p className="muted">You don’t have any stores yet.</p>
              <button
                className="btn btn-outline"
                onClick={() => navigate("/register-store")}
              >
                Register Business
              </button>
            </div>
          ) : (
            <div className="grid">
              {approved.map((s, i) => (
                <article
                  key={s.id}
                  className="card store-card anim-pop"
                  style={{ animationDelay: `${i * 60}ms` }}
                  onClick={() => goToDashboard(s.id)}
                >
                  <div className="card-top">
                    <span className="badge">Approved</span>
                  </div>
                  <h3 className="store-name">{s.name}</h3>
                  <div className="store-foot">
                    <span className="view-more">View more</span>
                    <ArrowRight size={18} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Pending Registration */}
        <section className="panel section-enter">
          <div className="panel-head">
            <h2 className="panel-title">Pending Registration</h2>
            <span className="pill warning">{pending.length} In Review</span>
          </div>

          {pending.length === 0 ? (
            <div className="empty">
              <Building2 size={28} />
              <p className="muted">No registrations pending.</p>
            </div>
          ) : (
            <div className="grid">
              {pending.map((s, i) => (
                <article
                  key={s.id}
                  className="card store-card pending anim-pop"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="card-top">
                    <span className="badge warning">Pending</span>
                  </div>
                  <h3 className="store-name">{s.name}</h3>
                  <div className="pending-note">
                    We’ll notify you once verified.
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
