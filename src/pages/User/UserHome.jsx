import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listenUserStores } from "../../services/stores";
import { useProfileComplete } from "../../services/userProfile";
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

function initials(name) {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function prettyAddress(addr) {
  if (!addr || typeof addr !== "object") return "—";
  const { line1, city, state, pin, country } = addr;
  return [line1, city, state, pin, country].filter(Boolean).join(", ");
}

export default function UserHome() {
  const nav = useNavigate();
  const { user, signOut } = useAuth?.() || {};

  const [stores, setStores] = useState(null);
  const { open, setOpen, ref } = useAvatarMenu();

  // Modal state (confirm before going to /register-store)
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Pull latest profile for avatar + greeting
  const { data: prof } = useProfileComplete(user?.uid);

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

  const displayName =
    prof?.profile?.fullName || user?.displayName || user?.email?.split("@")[0];

  const avatarSrc =
    prof?.profile?.avatarUrl || prof?.photoURL || user?.photoURL || null;

  // Close modal via ESC
  useEffect(() => {
    if (!confirmOpen) return;
    const onKey = (e) => e.key === "Escape" && setConfirmOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmOpen]);

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
              {hello}, <strong>{displayName}</strong>
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
              {avatarSrc ? (
                <img src={avatarSrc} alt="Profile" className={s.avatarImg} />
              ) : (
                <div className={s.avatarFallback}>{initials(displayName)}</div>
              )}
            </button>

            {open && (
              <div className={s.menu} role="menu">
                <div className={s.menuHeader}>
                  <div className={s.menuAvatar}>
                    {avatarSrc ? (
                      <img src={avatarSrc} alt="Profile" />
                    ) : (
                      <span>{initials(displayName)}</span>
                    )}
                  </div>
                  <div className={s.menuName}>
                    <div className={s.name}>{displayName || "User"}</div>
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

            {/* Open confirm modal instead of direct redirect */}
            <button className={s.primaryCta} onClick={() => setConfirmOpen(true)}>
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
                        <div className={s.storeName}>
                          {st.name || "Untitled store"}
                        </div>
                        <span className={`${s.badge} ${statusClass}`}>
                          {st.verificationStatus || "Pending"}
                        </span>
                      </div>
                      <div className={s.storeAddr}>
                        {prettyAddress(st.address)}
                      </div>
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

      {/* Lightweight modal (inline styles to avoid CSS edits if you prefer) */}
      {confirmOpen && (
        <div
          onClick={() => setConfirmOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.45)",
            backdropFilter: "blur(3px)",
            display: "grid",
            placeItems: "center",
            zIndex: 50,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(560px,92vw)",
              background: "#fff",
              borderRadius: 20,
              boxShadow: "0 50px 120px rgba(0,0,0,.25), 0 2px 0 rgba(255,255,255,.8) inset",
              padding: "22px 22px 18px",
            }}
          >
            <h3 style={{ margin: "6px 0 2px", fontWeight: 800, fontSize: 20 }}>
              Register a new store?
            </h3>
            <p style={{ margin: "8px 0 18px", color: "#6a7079" }}>
              We’ll collect your store details and verification documents. You can
              save progress and return anytime.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setConfirmOpen(false)}
                style={{
                  height: 42,
                  padding: "0 16px",
                  borderRadius: 10,
                  background: "#f2f4f7",
                  border: "1px solid #e6e9ef",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setConfirmOpen(false);
                  nav("/register-store");
                }}
                style={{
                  height: 42,
                  padding: "0 18px",
                  borderRadius: 10,
                  background: "#111",
                  color: "#fff",
                  border: 0,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
