import { useEffect, useState, useRef } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../Auth/AuthContext";
import styles from "./StoreAdminLayout.module.css";

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

/** Thin SVG icon helper (same idea as AdminLayout) */
function Icon({ d, size = 18, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`${styles.icon || ""} ${className || ""}`}
      aria-hidden="true"
    >
      <path
        d={d}
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Sidebar menu items for store admin */
const STORE_ADMIN_MENU = [
  {
    label: "Dashboard",
    path: "/store-admin/dashboard",
    icon: "M3 13h7V3H3v10Zm0 8h7v-5H3v5Zm11 0h7v-9h-7v9Zm0-11h7V3h-7v7Z",
  },
  {
    label: "Inventory",
    path: "/store-admin/inventory",
    icon: "M3 9l9-6 9 6-9 6-9-6Zm3 6.5 6 4 6-4M6 15.5V21m12-5.5V21",
  },
  {
    label: "Analytics / Reports",
    path: "/store-admin/analytics",
    icon: "M4 20v-8M10 20V4M16 20v-5M22 20v-9",
  },
  {
    label: "Advertisement",
    path: "/store-admin/advertisement",
    icon: "M3 11h3.5L17 7v10l-10.5-4H3v-3Zm3.5 6.5V19a2.5 2.5 0 0 0 2.5 2.5",
  },
  {
    label: "Store Profile / Settings",
    path: "/store-admin/settings",
    icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7-3a7 7 0 0 0-.2-1.6l2.1-1.6-2-3.4-2.5 1a7 7 0 0 0-2.4-1.4L13.8 2h-3.6L9 4.9a7 7 0 0 0-2.4 1.4l-2.5-1-2 3.4 2.1 1.6A7 7 0 0 0 4 12c0 .55.07 1.09.2 1.6l-2.1 1.6 2 3.4 2.5-1a7 7 0 0 0 2.4 1.4L10.2 22h3.6l.6-2.9a7 7 0 0 0 2.4-1.4l2.5 1 2-3.4-2.1-1.6c.13-.52.2-1.06.2-1.6Z",
  },
  {
    label: "Support & Help",
    path: "/store-admin/support",
    icon: "M5 18v-5a7 7 0 0 1 14 0v5M5 18a2 2 0 0 0 2 2h1M19 18a2 2 0 0 1-2 2h-1M5 13H3a2 2 0 0 0-2 2v1M19 13h2a2 2 0 0 1 2 2v1",
  },
];

export default function StoreAdminLayout() {
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

  const closeAllMenus = () => {
    setNotifOpen(false);
    setProfileOpen(false);
  };

  const notifRef = useClickAway(() => setNotifOpen(false));
  const profileRef = useClickAway(() => setProfileOpen(false));

  const closeIfMobile = () => setOpen(false);

  // derive name / initials
  const displayName =
    user?.displayName ||
    user?.name ||
    user?.email?.split("@")[0] ||
    "Store Admin";

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "SA";

  const onEditProfile = () => {
    setProfileOpen(false);
    navigate("/store-admin/settings");
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
            <svg
              className={styles.hIcon}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M6 6L18 18M6 18L18 6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className={styles.brandPill}>Store Console</div>
        </div>

        <div className={styles.searchWrap}>
          <input
            className={styles.search}
            placeholder="Quick search"
          />
        </div>

        <nav className={styles.section}>
          <div className={styles.groupLabel}>Navigation</div>
          <ul>
            {STORE_ADMIN_MENU.map((item) => (
              <li key={item.label} title={item.label}>
                <NavLink
                  to={item.path}
                  onClick={closeIfMobile}
                  className={({ isActive }) =>
                    isActive
                      ? `${styles.navItem} ${styles.active}`
                      : styles.navItem
                  }
                >
                  <Icon d={item.icon} />
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
      <main
        className={styles.main}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.sheen} aria-hidden />

        <header className={styles.topbar}>
          <div className={styles.leftTop}>
            <button
              className={`${styles.hamburger} ${styles.onlyMobile}`}
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <svg
                className={styles.hIcon}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M3 6h18M3 12h18M3 18h18"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div className={styles.crumb}>Store Admin</div>
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
                <Icon d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2zm6-6V11a6 6 0 1 0-12 0v5l-2 2h16l-2-2z" />
                <span className={styles.badge} aria-hidden />
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
                  <div className={styles.emptyState}>
                    <Icon
                      d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2zm6-6V11a6 6 0 1 0-12 0v5l-2 2h16l-2-2z"
                      size={22}
                    />
                    <p>No new notifications</p>
                  </div>
                </div>
                <div className={styles.menuFooter}>
                  <button
                    className={styles.linkBtn}
                    onClick={() => navigate("/store-admin/support")}
                  >
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
                      <div className={styles.userSub}>
                        {user?.email || "—"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.menuBody}>
                  <button
                    className={styles.menuItem}
                    onClick={onEditProfile}
                  >
                    <Icon
                      d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7-3a7 7 0 0 0-.2-1.6l2.1-1.6-2-3.4-2.5 1a7 7 0 0 0-2.4-1.4L13.8 2h-3.6L9 4.9a7 7 0 0 0-2.4 1.4l-2.5-1-2 3.4 2.1 1.6A7 7 0 0 0 4 12c0 .55.07 1.09.2 1.6l-2.1 1.6 2 3.4 2.5-1a7 7 0 0 0 2.4 1.4L10.2 22h3.6l.6-2.9a7 7 0 0 0 2.4-1.4l2.5 1 2-3.4-2.1-1.6c.13-.52.2-1.06.2-1.6Z"
                      size={16}
                    />
                    <span>Store settings</span>
                  </button>
                  <button
                    className={styles.menuItem}
                    onClick={() => {
                      setProfileOpen(false);
                      navigate("/store-admin/support");
                    }}
                  >
                    <Icon
                      d="M5 18v-5a7 7 0 0 1 14 0v5M5 18a2 2 0 0 0 2 2h1M19 18a2 2 0 0 1-2 2h-1M5 13H3a2 2 0 0 0-2 2v1M19 13h2a2 2 0 0 1 2 2v1"
                      size={16}
                    />
                    <span>Support & help</span>
                  </button>
                </div>

                <div className={styles.menuFooter}>
                  <button
                    className={styles.dangerBtn}
                    onClick={onSignOut}
                  >
                    <Icon
                      d="M16 17l5-5-5-5M21 12H9"
                      size={18}
                    />
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
