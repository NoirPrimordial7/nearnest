import { useEffect, useState, useRef } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../Auth/AuthContext";
import styles from "./AdminLayout.module.css";

/** click-outside helper */
function useClickAway(onAway) {
  const ref = useRef(null);
  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) onAway?.();
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [onAway]);
  return ref;
}

/** Thin SVG icon helper */
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

/** Sidebar items */
const NAV = {
  primary: [
    { label: "Overview", to: "/admin", icon: "M3 6h18M3 12h18M3 18h18", end: true },
  ],
  platform: [
    { label: "Stores", to: "/admin/stores", icon: "M4 6h16v12H4z" },
    { label: "Verification", to: "/admin/verification", icon: "M7 7h10M7 12h10M7 17h6" },
    { label: "Support / Tickets", to: "/admin/support", icon: "M3 8l9 6 9-6M5 19h14" },
  ],
};

export default function AdminLayout() {
  const [open, setOpen] = useState(false); // mobile drawer
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const { user, signOut } = useAuth() || {};
  const navigate = useNavigate();

  // lock scroll when drawer is open (mobile)
  useEffect(() => {
    document.body.classList.toggle("body--lock", open);
    return () => document.body.classList.remove("body--lock");
  }, [open]);

  // close dropdowns on route/content click
  const closeAllMenus = () => {
    setNotifOpen(false);
    setProfileOpen(false);
  };

  const notifRef = useClickAway(() => setNotifOpen(false));
  const profileRef = useClickAway(() => setProfileOpen(false));

  const closeIfMobile = () => setOpen(false);

  // derive initials & email safely
  const displayName = user?.displayName || user?.name || user?.email?.split("@")[0] || "Admin";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("") || "A";

  // handle actions
  const onEditProfile = () => {
    setProfileOpen(false);
    navigate("/admin/profile"); // keep your route; change if your repo uses another path
  };

  const onSignOut = async () => {
    setProfileOpen(false);
    try {
      if (typeof signOut === "function") {
        await signOut();
      }
      navigate("/signin");
    } catch (e) {
      console.error("Sign out failed:", e);
    }
  };

  return (
    <div className={styles.shell} onClick={closeAllMenus}>
      {/* ===== SIDEBAR ===== */}
      <aside
        className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.brandRow}>
          <button
            className={`${styles.hamburger} ${styles.onlyMobile}`}
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <svg className={styles.hIcon} width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6L18 18M6 18L18 6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Text brand capsule */}
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
                  end={item.end}
                  onClick={closeIfMobile}
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
                <NavLink
                  to={item.to}
                  onClick={closeIfMobile}
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
      </aside>

      {/* Mobile scrim */}
      <button
        className={`${styles.scrim} ${open ? styles.scrimShow : ""}`}
        onClick={() => setOpen(false)}
        aria-label="Close menu"
      />

      {/* ===== MAIN ===== */}
      <main className={styles.main} onClick={(e) => e.stopPropagation()}>
        <div className={styles.sheen} aria-hidden />
        <header className={styles.topbar}>
          <div className={styles.leftTop}>
            <button
              className={`${styles.hamburger} ${styles.onlyMobile}`}
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <svg className={styles.hIcon} width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 6h18M3 12h18M3 18h18"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div className={styles.crumb}>Admin</div>
          </div>

          <div className={styles.topActions}>
            {/* Notifications */}
            <div className={styles.actionWrap} ref={notifRef}>
              <button
                className={`${styles.ghostBtn} ${styles.hideMobile}`}
                title="Notifications"
                onClick={(e) => {
                  e.stopPropagation();
                  setNotifOpen((v) => !v);
                  setProfileOpen(false);
                }}
              >
                <Icon path="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2zm6-6V11a6 6 0 1 0-12 0v5l-2 2h16l-2-2z" />
                <span className={styles.badge} aria-hidden>
                  {/* replace with unread count */}
                </span>
              </button>

              <div
                className={`${styles.menu} ${styles.menuRight} ${
                  notifOpen ? styles.menuOpen : ""
                }`}
                role="menu"
                aria-label="Notifications"
              >
                <div className={styles.menuHeader}>Notifications</div>
                <div className={styles.menuBody}>
                  {/* Replace these placeholders with your live notification list */}
                  <div className={styles.emptyState}>
                    <Icon
                      path="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2zm6-6V11a6 6 0 1 0-12 0v5l-2 2h16l-2-2z"
                      size={22}
                    />
                    <p>No new notifications</p>
                  </div>
                </div>
                <div className={styles.menuFooter}>
                  <button className={styles.linkBtn} onClick={() => navigate("/admin/support")}>
                    Go to Support
                  </button>
                </div>
              </div>
            </div>

            {/* Profile */}
            <div className={styles.actionWrap} ref={profileRef}>
              <button
                className={styles.avatarBtn}
                title={displayName}
                onClick={(e) => {
                  e.stopPropagation();
                  setProfileOpen((v) => !v);
                  setNotifOpen(false);
                }}
                aria-haspopup="menu"
                aria-expanded={profileOpen}
              >
                <div className={styles.avatar}>{initials}</div>
              </button>

              <div
                className={`${styles.menu} ${styles.menuRight} ${
                  profileOpen ? styles.menuOpen : ""
                }`}
                role="menu"
                aria-label="Profile menu"
              >
                <div className={styles.menuHeader}>
                  <div className={styles.menuUserRow}>
                    <div className={styles.avatarSm}>{initials}</div>
                    <div className={styles.userMeta}>
                      <div className={styles.userName}>{displayName}</div>
                      <div className={styles.userSub}>{user?.email || "—"}</div>
                    </div>
                  </div>
                </div>

                <div className={styles.menuBody}>
                  <button className={styles.menuItem} onClick={onEditProfile}>
                    <Icon path="M12 20h9" />
                    <span>Edit profile</span>
                  </button>
                  <button
                    className={styles.menuItem}
                    onClick={() => {
                      setProfileOpen(false);
                      navigate("/admin/settings");
                    }}
                  >
                    <Icon path="M12 3v3M12 18v3M3 12h3M18 12h3" />
                    <span>Admin settings</span>
                  </button>
                </div>

                <div className={styles.menuFooter}>
                  <button className={styles.dangerBtn} onClick={onSignOut}>
                    <Icon path="M16 17l5-5-5-5M21 12H9" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            </div>
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
