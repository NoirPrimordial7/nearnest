import { useEffect, useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import styles from "./AdminLayout.module.css";

/** Stroke SVG icon (lines now thick/visible) */
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

export default function AdminLayout() {
  const [open, setOpen] = useState(false);

  // Lock body scroll when the drawer is open
  useEffect(() => {
    if (open) document.body.classList.add("body--lock");
    else document.body.classList.remove("body--lock");
    return () => document.body.classList.remove("body--lock");
  }, [open]);

  return (
    <div className={styles.shell}>
      {/* ===== SIDEBAR ===== */}
      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        <div className={styles.brandRow}>
          {/* Close button (mobile only) */}
          <button
            className={`${styles.hamburger} ${styles.onlyMobile}`}
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <Icon path="M6 6L18 18M6 18L18 6" />
          </button>

          <div className={styles.brandChip}>
            <span className={styles.logoDot} />
            <span className={styles.brandText}>nearnest</span>
          </div>
        </div>

        <div className={styles.searchWrap}>
          <input className={styles.search} placeholder="Search" />
        </div>

        {/* === MAIN NAV FROM WIREFRAME === */}
        <nav className={styles.section}>
          <div className={styles.sectionTitle}>Customization</div>
          <ul>
            <li>
              <NavLink to="/admin" end className={({isActive}) => isActive ? styles.active : undefined}>
                <Icon path="M3 6h18M3 12h18M3 18h18" />
                <span className={styles.badge}>1</span>
                <span>Dashboard</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className={styles.sectionSub}>REPORTS</div>
        <nav className={styles.section}>
          <ul>
            <li>
              <a role="button" href="#" onClick={(e)=>e.preventDefault()}>
                <Icon path="M4 6h16v12H4z" />
                <span className={styles.badge}>2</span>
                <span>Store Management</span>
              </a>
            </li>
            <li>
              <a role="button" href="#" onClick={(e)=>e.preventDefault()}>
                <Icon path="M7 7h10M7 12h10M7 17h6" />
                <span className={styles.badge}>3</span>
                <span>Document Verification</span>
              </a>
            </li>
            <li>
              <a role="button" href="#" onClick={(e)=>e.preventDefault()}>
                <Icon path="M12 3v18M3 12h18" />
                <span className={styles.badge}>4</span>
                <span>Role &amp; Permission Management</span>
              </a>
            </li>
            <li>
              <a role="button" href="#" onClick={(e)=>e.preventDefault()}>
                <Icon path="M16 11a4 4 0 1 0-8 0v6h8v-6zM4 21h16" />
                <span className={styles.badge}>5</span>
                <span>Admin User Management</span>
              </a>
            </li>
            <li>
              <a role="button" href="#" onClick={(e)=>e.preventDefault()}>
                <Icon path="M3 8l9 6 9-6M5 19h14" />
                <span className={styles.badge}>6</span>
                <span>Support / Tickets Panel</span>
              </a>
            </li>
            <li>
              <a role="button" href="#" onClick={(e)=>e.preventDefault()}>
                <Icon path="M4 19V5l16 7-16 7z" />
                <span className={styles.badge}>7</span>
                <span>Global Analytics / Reports</span>
              </a>
            </li>
            <li>
              <a role="button" href="#" onClick={(e)=>e.preventDefault()}>
                <Icon path="M4 12h16M12 4v16M6 20h12" />
                <span className={styles.badge}>8</span>
                <span>Audit Logs / System Settings</span>
              </a>
            </li>
            <li>
              <a role="button" href="#" onClick={(e)=>e.preventDefault()}>
                <Icon path="M4 7h16M4 12h16M4 17h10" />
                <span className={styles.badge}>9</span>
                <span>Shared Backend Schema (Simplified)</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      {/* SCRIM (mobile) */}
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
            {/* Open button (mobile only) */}
            <button
              className={`${styles.hamburger} ${styles.onlyMobile}`}
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Icon path="M3 6h18M3 12h18M3 18h18" />
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
