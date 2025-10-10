import { Outlet, NavLink } from "react-router-dom";
import styles from "./AdminLayout.module.css";

function Icon({ path, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={styles.icon}>
      <path d={path} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function AdminLayout() {
  return (
    <div className={styles.shell}>
      {/* LEFT SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.brandRow}>
          <div className={styles.logoOutline} aria-label="logo" />
          <span className={styles.brand}>nearnest</span>
        </div>

        <div className={styles.searchWrap}>
          <input className={styles.search} placeholder="Search" />
        </div>

        <nav className={styles.section}>
          <div className={styles.sectionTitle}>Customization</div>
          <ul>
            <li>
              <NavLink to="/admin" end className={({isActive}) => isActive ? styles.active : undefined}>
                <Icon path="M3 12h18M3 6h18M3 18h18" /> <span>Dashboard</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className={styles.sectionSub}>REPORTS</div>
        <nav className={styles.section}>
          <ul>
            <li><a><Icon path="M4 4h16v16H4z" /> <span>Realtime</span></a></li>
            <li><a><Icon path="M3 12l6 6L21 6" /> <span>Acquisition</span></a></li>
            <li><a><Icon path="M12 3v18M3 12h18" /> <span>Audience</span></a></li>
            <li><a><Icon path="M4 20h16M8 16l8-8" /> <span>Behaviour</span></a></li>
          </ul>
        </nav>

        <nav className={styles.section}>
          <ul>
            <li><a><Icon path="M4 6h16M4 12h16M4 18h16" /> <span>Docs</span></a></li>
            <li><a><Icon path="M12 2l3 7h7l-5.5 4 2 7-6.5-4.5L5 20l2-7L2 9h7z" /> <span>Components</span></a></li>
            <li><a><Icon path="M8 8h8v8H8z" /> <span>Help</span></a></li>
          </ul>
        </nav>
      </aside>

      {/* MAIN */}
      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.crumb}>Admin</div>
          <div className={styles.topActions}>
            <button className={styles.ghostBtn} title="Notifications">
              <Icon path="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2zm6-6V11a6 6 0 1 0-12 0v5l-2 2h16l-2-2z" />
            </button>
            <div className={styles.avatar} />
          </div>
        </header>

        <section className={styles.content}>
          <Outlet />
        </section>
      </main>

      {/* RIGHT RAIL */}
      <aside className={styles.rail}>
        {[
          "M3 12h18",                   // line
          "M5 12l5 5L19 8",             // check
          "M12 5v14M5 12h14",           // plus
          "M4 4h16v16H4z",              // square
          "M12 2l3 7h7l-5.5 4 2 7-6.5-4.5L5 20l2-7L2 9h7z", // star
        ].map((p, i) => (
          <button key={i} className={styles.railBtn}><Icon path={p} /></button>
        ))}
      </aside>
    </div>
  );
}
