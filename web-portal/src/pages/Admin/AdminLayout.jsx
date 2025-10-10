import { useEffect, useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import styles from "./AdminLayout.module.css";

/** Simple SVG icon helper (stroke-based) */
function Icon({ path, size = 18, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`${styles.icon} ${className || ""}`}
      aria-hidden="true"
    >
      <path
        d={path}
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Sidebar items (rename freely later) */
const NAV = {
  primary: [{ label: "Overview", to: "/admin", icon: "M3 6h18M3 12h18M3 18h18" }],
  platform: [
    { label: "Stores", icon: "M4 6h16v12H4z" },
    { label: "Verification", icon: "M7 7h10M7 12h10M7 17h6" },
    { label: "Roles & Permissions", icon: "M12 3v18M3 12h18" },
    { label: "Admins", icon: "M16 11a4 4 0 1 0-8 0v6h8v-6zM4 21h16" },
    { label: "Support / Tickets", icon: "M3 8l9 6 9-6M5 19h14" },
    { label: "Analytics", icon: "M3 17h3v-6H3v6zm5 0h3V7H8v10zm5 0h3V11h-3v6zm5 0h3V5h-3v12z" },
    { label: "Settings", icon: "M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" },
    { label: "Schema", icon: "M4 7h16M4 12h16M4 17h10" },
  ],
};

export default function AdminLayout() {
  const [open, setOpen] = useState(false);

  // lock scroll when drawer is open
  useEffect(() => {
    document.body.classList.toggle("body--lock", open);
    return () => document.body.classList.remove("body--lock");
  }, [open]);

  return (
    <div className={styles.shell}>
      {/* ===== SIDEBAR ===== */}
      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        {/* Brand / close button (mobile) */}
        <div className={styles.brandRow}>
          <button
            className={`${styles.hamburger} ${styles.onlyMobile}`}
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            {/* Force black lines */}
            <svg className={styles.hIcon} width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Text-only brand pill */}
          <div className={styles.brandPill}>nearnest</div>
        </div>

        <div className={styles.searchWrap}>
          <input className={styles.search} placeholder="Search" />
        </div>

        <nav className={styles.section}>
          <div className={styles.groupLabel}>Navigation</div>
          <ul>
            {NAV.primary.map((item) => (
              <li key={item.label} title={item.label}>
                <NavLink
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    isActive ? `${styles.navItem} ${styles.active}` : styles.navItem
                  }
                >
                  <Icon path={item.icon} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <nav className={styles.section}>
          <div className={styles.groupLabel}>Platform</div>
          <ul>
            {NAV.platform.map((item) => (
              <li key={item.label} title={item.label}>
                <a href="#" onClick={(e) => e.preventDefault()} className={styles.navItem}>
                  <Icon path={item.icon} />
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* scrim for mobile */}
      <button
        className={`${styles.scrim} ${open ? styles.scrimShow : ""}`}
        onClick={() => setOpen(false)}
        aria-label="Close menu"
      />

      {/* ===== MAIN ===== */}
      <main className={styles.main}>
        <div className={styles.sheen} aria-hidden />
        <header className={styles.topbar}>
          <div className={styles.leftTop}>
            <button
              className={`${styles.hamburger} ${styles.onlyMobile}`}
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              {/* Force black lines */}
              <svg className={styles.hIcon} width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className={styles.crumb}>Admin</div>
          </div>

          <div className={styles.topActions}>
            <button className={`${styles.ghostBtn} ${styles.hideMobile}`} title="Notifications">
              <Icon path="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2zm6-6V11a6 6 0 1 0-12 0v5l-2 2h16l-2-2z" />
            </button>
            <div className={styles.avatar} />
          </div>
        </header>

        <section className={styles.content}>
          <div className="container">
            <Outlet />
          </div>
        </section>
      </main>
    </div>
  );
}
