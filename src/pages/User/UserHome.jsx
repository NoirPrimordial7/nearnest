// src/pages/User/UserHome.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useProfileComplete } from "../../services/userProfile";
import {
  listenUserStores,
  deleteStore,
  storeBucket,
} from "../../services/stores";
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
  const { user } = useAuth();
  const [stores, setStores] = useState(null);
  const [errMsg, setErrMsg] = useState("");

  const { open, setOpen, ref } = useAvatarMenu();
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Tabs
  const [tab, setTab] = useState("verified"); // 'verified' | 'under'

  // kebab
  const [menuFor, setMenuFor] = useState(null);
  const menuRef = useRef(null);
  useEffect(() => {
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuFor(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const { data: prof } = useProfileComplete(user?.uid);

  // await listener to get a real unsubscribe
  useEffect(() => {
    if (!user?.uid) return;

    setErrMsg("");
    setStores(null);

    let mounted = true;
    let stop = () => {};

    (async () => {
      try {
        const unsub = await listenUserStores(
          user.uid,
          (arrOrUpdater) =>
            setStores((prev) =>
              typeof arrOrUpdater === "function" ? arrOrUpdater(prev) : arrOrUpdater
            ),
          (e) => {
            console.error("[stores] listener:", e);
            if (!mounted) return;
            setErrMsg("Could not load your stores.");
            setStores([]);
          }
        );
        if (mounted && typeof unsub === "function") stop = unsub;
      } catch (e) {
        console.error("[stores] bootstrap failed:", e);
        if (mounted) {
          setErrMsg("Could not start store listener.");
          setStores([]);
        }
      }
    })();

    return () => {
      mounted = false;
      try {
        stop && stop();
      } catch {}
    };
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

  const verified = (stores || []).filter(
    (x) => storeBucket(x.verificationStatus) === "verified"
  );
  const under = (stores || []).filter(
    (x) => storeBucket(x.verificationStatus) !== "verified"
  );

  const openStore = (st) => {
    const bucket = storeBucket(st.verificationStatus);
    if (bucket === "verified") {
      nav(`/store-admin/home?storeId=${encodeURIComponent(st.id)}`);
    } else {
      nav(`/verification-status/${st.id}`);
    }
  };

  return (
    <div className={s.screen} style={{ minHeight: "100vh" }}>
      <div className={s.container} style={{ maxWidth: "1400px" }}>
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
                <a className={s.menuItem} href="mailto:support@nearnest.app">
                  Help & support
                </a>
              </div>
            )}
          </div>
        </header>

        {/* Full-width main */}
        <main
          className={s.layout}
          style={{
            display: "grid",
            gridTemplateColumns: "420px 1fr",
            gap: 20,
            alignItems: "start",
          }}
        >
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

            <button className={s.primaryCta} onClick={() => setConfirmOpen(true)}>
              <span className={s.ctaIcon} />
              Register a Store
              <span className={s.ctaArrow}>→</span>
            </button>
          </section>

          {/* Right: Tabs */}
          <section className={s.cardRight} style={{ height: "100%" }}>
            <div className={s.rightHeader}>
              <h3>Projects & workspaces</h3>
              <div className={s.legend}>
                <span className={`${s.dot} ${s.dotGreen}`} /> Verified
                <span className={`${s.dot} ${s.dotBlue}`} /> Pending
                <span className={`${s.dot} ${s.dotRed}`} /> Rejected
              </div>
            </div>

            {errMsg && (
              <div className={s.errBanner} style={{ marginBottom: 10 }}>
                {errMsg}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: 8,
                borderBottom: "1px solid #eee",
                marginBottom: 12,
              }}
            >
              <button
                onClick={() => setTab("verified")}
                style={{
                  padding: "10px 14px",
                  border: 0,
                  background: tab === "verified" ? "#111" : "transparent",
                  color: tab === "verified" ? "#fff" : "#111",
                  borderRadius: 10,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Verified stores ({verified.length})
              </button>
              <button
                onClick={() => setTab("under")}
                style={{
                  padding: "10px 14px",
                  border: 0,
                  background: tab === "under" ? "#111" : "transparent",
                  color: tab === "under" ? "#fff" : "#111",
                  borderRadius: 10,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Under verification ({under.length})
              </button>
            </div>

            {stores === null ? (
              <SkeletonGrid />
            ) : tab === "verified" ? (
              verified.length === 0 ? (
                <Empty text="No verified stores yet." />
              ) : (
                <div className={s.grid}>
                  {verified.map((st) => (
                    <StoreCard
                      key={st.id}
                      s={st}
                      badgeClass={s.badgeGreen}
                      onOpen={() => openStore(st)}
                      onKebab={() => setMenuFor(st.id)}
                      menuOpen={menuFor === st.id}
                      menuRef={menuRef}
                      onDelete={async () => {
                        if (!window.confirm("Delete this store? This can’t be undone.")) return;
                        await deleteStore(st.id);
                        setMenuFor(null);
                      }}
                    />
                  ))}
                </div>
              )
            ) : under.length === 0 ? (
              <Empty text="No applications in progress." />
            ) : (
              <div className={s.grid}>
                {under.map((st) => {
                  const status = (st.verificationStatus || "Pending").toLowerCase();
                  const badge =
                    status === "rejected" ? s.badgeRed :
                    status === "draft"    ? s.badgeBlue :
                                            s.badgeBlue;
                  return (
                    <StoreCard
                      key={st.id}
                      s={st}
                      badgeClass={badge}
                      onOpen={() => openStore(st)}
                      onKebab={() => setMenuFor(st.id)}
                      menuOpen={menuFor === st.id}
                      menuRef={menuRef}
                      onDelete={async () => {
                        if (!window.confirm("Delete this application?")) return;
                        await deleteStore(st.id);
                        setMenuFor(null);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Confirm modal */}
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

/* ---------- small UI bits ---------- */

function SkeletonGrid() {
  return (
    <div className={s.grid}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={`${s.storeCard} ${s.skel}`} />
      ))}
    </div>
  );
}
function Empty({ text }) {
  return <div className={s.empty}>{text}</div>;
}

function StoreCard({ s, badgeClass, onOpen, onKebab, menuOpen, menuRef, onDelete }) {
  return (
    <div className={s.storeCard} style={{ position: "relative" }}>
      <button className={s.cardClickLayer} onClick={onOpen} title="Open" />
      <div className={s.storeTopRow}>
        <div className={s.storeName}>{s.name || "Untitled store"}</div>
        <span className={`${s.badge} ${badgeClass}`}>
          {s.verificationStatus || "Pending"}
        </span>
      </div>
      <div className={s.storeAddr}>{prettyAddress(s.address)}</div>
      <div className={s.storeMeta}>
        <span>ID: {String(s.id).slice(0, 8)}…</span>
      </div>

      {/* kebab */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onKebab?.();
        }}
        title="More"
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 32,
          height: 32,
          borderRadius: 8,
          border: "1px solid #eee",
          background: "#fff",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
        }}
      >
        ⋮
      </button>

      {menuOpen && (
        <div
          ref={menuRef}
          style={{
            position: "absolute",
            top: 40,
            right: 8,
            background: "#fff",
            border: "1px solid #eee",
            borderRadius: 10,
            boxShadow: "0 10px 30px rgba(0,0,0,.08)",
            minWidth: 160,
            zIndex: 10,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onDelete}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "10px 12px",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              color: "#c22",
              fontWeight: 700,
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
