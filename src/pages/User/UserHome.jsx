// src/pages/User/UserHome.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listenUserStores } from "../../services/stores";
import s from "./home.module.css";

function useAvatarMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return { open, setOpen, ref };
}

function initials(fullName) {
  if (!fullName) return "U";
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function UserHome() {
  const nav = useNavigate();
  const { user, signOut } = useAuth?.() || {};
  const [stores, setStores] = useState(null); // null = loading, [] = empty
  const { open, setOpen, ref } = useAvatarMenu();

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = listenUserStores(user.uid, setStores);
    return () => unsub && unsub();
  }, [user?.uid]);

  const hello = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <div className={s.screen}>
      <div className={s.container}>
        {/* Topbar */}
        <header className={s.topbar}>
          <div className={s.brandWrap}>
            <div className={s.brand}>
              <span className={s.logoDot} />
              NearNest
            </div>
            <div className={s.greet}>
              {hello}, <strong>{user?.displayName || user?.email?.split("@")[0]}</strong>
            </div>
          </div>

          <div className={s.actions} ref={ref}>
            <button
              className={s.avatarBtn}
              onClick={() => setOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={open}
              title="Account"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className={s.avatarImg} />
              ) : (
                <div className={s.avatarFallback}>{initials(user?.displayName)}</div>
              )}
            </button>

            {open && (
              <div className={s.menu} role="menu">
                <div className={s.menuHeader}>
                  <div className={s.menuAvatar}>
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="Profile" />
                    ) : (
                      <span>{initials(user?.displayName)}</span>
                    )}
                  </div>
                  <div className={s.menuName}>
                    <div className={s.name}>{user?.displayName || "User"}</div>
                    <div className={s.email}>{user?.email}</div>
                  </div>
                </div>
                <button
                  className={s.menuItem}
                  onClick={() => {
                    setOpen(false);
                    nav("/setup-profile");
                  }}
                >
                  Personal information
                </button>
                <button
                  className={s.menuItem}
                  onClick={() => {
                    setOpen(false);
                    nav("/setup-profile");
                  }}
                >
                  Edit profile
                </button>
                <div className={s.menuLine} />
                <button
                  className={s.menuItemDanger}
                  onClick={async () => {
                    setOpen(false);
                    try {
                      await signOut?.();
                    } finally {
                      nav("/signin", { replace: true });
                    }
                  }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Two-column */}
        <main className={s.layout}>
          {/* Left CTA */}
          <section className={s.cardLeft}>
            <div className={s.switchRow}>
              <span className={s.switchActive}>Stores</span>
              <span className={s.switchMuted}>Branding</span>
            </div>

            <h1 className={s.heroPrice}>
              <span className={s.heroEm}>Register</span> a Store
            </h1>

            <div className={s.leftFooterRow}>
              <div className={s.availDot} />
              <span>Ready to onboard</span>
            </div>

            <button
              className={s.primaryCta}
              onClick={() => nav("/register-store")}
            >
              <span className={s.ctaIcon} />
              Register a Store
              <span className={s.ctaArrow}>→</span>
            </button>
          </section>

          {/* Right list */}
          <section className={s.cardRight}>
            <div className={s.rightHeader}>
              <h3>Projects & workspaces</h3>
              <div className={s.legend}>
                <span className={`${s.dot} ${s.dotGreen}`} /> Verified
                <span className={`${s.dot} ${s.dotBlue}`} /> Pending
                <span className={`${s.dot} ${s.dotRed}`} /> Rejected
              </div>
            </div>

            {stores === null ? (
              <div className={s.grid}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`${s.storeCard} ${s.skel}`} />
                ))}
              </div>
            ) : stores.length === 0 ? (
              <div className={s.empty}>
                No stores yet. Use “Register a Store” on the left to get started.
              </div>
            ) : (
              <div className={s.grid}>
                {stores.map((st) => {
                  const status = (st.verificationStatus || "Pending")?.toLowerCase();
                  const statusClass =
                    status === "approved"
                      ? s.badgeGreen
                      : status === "rejected"
                      ? s.badgeRed
                      : s.badgeBlue;

                  return (
                    <button
                      key={st.id}
                      className={s.storeCard}
                      onClick={() => nav(`/verification-status/${st.id}`)}
                      title="Open status"
                    >
                      <div className={s.storeTopRow}>
                        <div className={s.storeName}>{st.name || "Untitled store"}</div>
                        <span className={`${s.badge} ${statusClass}`}>
                          {st.verificationStatus || "Pending"}
                        </span>
                      </div>
                      <div className={s.storeAddr}>{st.address || "—"}</div>
                      <div className={s.storeMeta}>
                        <span>ID: {st.id.slice(0, 8)}…</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
