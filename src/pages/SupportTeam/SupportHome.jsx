import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./supportHome.css";

export default function SupportHome() {
  const navigate = useNavigate();
  const [dateTime, setDateTime] = useState(getFormattedDateTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setDateTime(getFormattedDateTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function getFormattedDateTime() {
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

  const handleDashboardClick = () => {
    // Wire this to your support dashboard route later
    navigate("/support/dashboard");
  };

  const handleScrollDown = () => {
    const el = document.getElementById("support-intro");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="support-wrap">
      {/* Top navigation / brand */}
      <header className="support-nav">
        <div className="support-logo">MediFind Support</div>
        <div className="support-nav-right">
          <span className="support-tagline">Precision. Empathy. Uptime.</span>
          <button className="support-dashboard-btn" onClick={handleDashboardClick}>
            Go to Dashboard
          </button>
        </div>
      </header>

      {/* Hero section */}
      <main className="support-hero">
        <div className="support-hero-content">
          <p className="support-kicker">Support Operations Control Center</p>
          <h1 className="support-title">
            Empowering every ticket,
            <span className="support-title-highlight"> every response,</span>
            <span className="support-title-highlight"> every user.</span>
          </h1>
          <p className="support-subtitle">
            You are the backbone of trust. Monitor critical issues in real-time, resolve queries with confidence,
            and deliver a Netflix-level experience to every MediFind user and store partner.
          </p>

          <div className="support-actions">
            <button className="support-primary" onClick={handleDashboardClick}>
              Enter Support Dashboard
            </button>
            <button className="support-secondary" onClick={handleScrollDown}>
              View Mission Brief
            </button>
          </div>

          {/* Stats-style tiles */}
          <div className="support-metrics">
            <div className="metric-card">
              <span className="metric-label">Target First Response</span>
              <span className="metric-value">&lt; 5 min</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Resolution Accuracy</span>
              <span className="metric-value">99.2%</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">User Satisfaction</span>
              <span className="metric-value">4.9 / 5</span>
            </div>
          </div>
        </div>

        {/* Right side gradient / abstract visual */}
        <div className="support-hero-visual">
          <div className="support-orbit"></div>
          <div className="support-orbit-inner"></div>
          <div className="support-pulse"></div>
          <p className="support-visual-text">
            Live queues, escalations, SLAs and sentiment — all flowing into one command center.
          </p>
        </div>
      </main>

      {/* Scroll arrow */}
      <div className="support-scroll-arrow" onClick={handleScrollDown}>
        <span className="arrow-label">Scroll for mission brief</span>
        <span className="arrow-icon">⌄</span>
      </div>

      {/* Mission / Motivation / Info section */}
      <section id="support-intro" className="support-section">
        <div className="support-section-inner">
          <h2>Why this team matters</h2>
          <p>
            As part of the MediFind Support Team, you are not just closing tickets; you are protecting access to
            critical medicines, guiding users in moments of urgency, and keeping every store partner confident in
            our platform. Every response is an opportunity to restore trust faster than it was lost.
          </p>

          <div className="support-grid">
            <div className="support-grid-item">
              <h3>Listen with Precision</h3>
              <p>
                Decode the real problem behind every query. Use context, history, and tools to respond intelligently
                and consistently.
              </p>
            </div>
            <div className="support-grid-item">
              <h3>Act with Ownership</h3>
              <p>
                Take accountability from first touch to resolution. Escalate smartly, document clearly, and never
                leave ambiguity.
              </p>
            </div>
            <div className="support-grid-item">
              <h3>Protect the Experience</h3>
              <p>
                Maintain reliability that feels like a premium streaming platform: fast, smooth, and always on.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Time + Date footer bar */}
      <footer className="support-footer">
        <div className="support-footer-inner">
          <div className="support-footer-label">Current Session</div>
          <div className="support-footer-time">
            <span>{dateTime.time}</span>
            <span className="divider">|</span>
            <span>{dateTime.date}</span>
          </div>
          <div className="support-footer-note">
            Stay sharp. Every second you save improves a user’s day.
          </div>
        </div>
      </footer>
    </div>
  );
}
