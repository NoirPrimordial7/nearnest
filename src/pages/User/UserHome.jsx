import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Auth/AuthContext";
import { useProfileComplete } from "../user/userProfile";
import {
  listenUserStores,
  deleteStore,
  storeBucket,
} from "../register-store/stores";
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

  const profState = useProfileComplete(user?.uid);
  const prof = profState.data;
  const profileLoading = profState.loading;

  const [stores, setStores] = useState(null);
  const [errMsg, setErrMsg] = useState("");

  const { open, setOpen, ref } = useAvatarMenu();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [tab, setTab] = useState("verified"); // 'verified' | 'under'

  const [menuFor, setMenuFor] = useState(null);
  const menuRef = useRef(null);
  useEffect(() => {
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuFor(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Start store listener
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
            setErrMsg(
              e?.code === "permission-denied"
                ? "Missing or insufficient permissions for one or more stores."
                : "Could not load your stores."
            );
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
      try { stop && stop(); } catch {}
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
  const allStores = stores || [];
  const noStores = stores !== null && allStores.length === 0;

  const profileMissing =
    !profileLoading &&
    (!prof ||
      !prof.profile ||
      !prof.profile.fullName ||
      !String(prof.profile.phone || "").trim());

  const openStore = (st) => {
    const bucket = storeBucket(st.verificationStatus);
    if (bucket === "verified") {
      nav(`/store-admin/home?storeId=${encodeURIComponent(st.id)}`);
    } else {
      nav(`/verification-status/${st.id}`);
    }
  };

  // search (for State B)
  const [q, setQ] = useState("");
  const qlc = q.trim().toLowerCase();
  const filtered = (tab === "verified" ? verified : under).filter((st) =>
    (st.name || "Untitled store").toLowerCase().includes(qlc)
  );

  return (
    <div className={s.screen}>
      {/* sheen */}
      <div className={s.sheen} aria-hidden="true" />

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
                <a className={s.menuItem} href="mailto:support@nearnest.app">
                  Help & support
                </a>
                <button
                  className={s.menuItemDanger}
                  onClick={async () => {
                    try {
                      await (typeof signOut === "function" ? signOut() : Promise.resolve());
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

        {/* Profile reminder */}
        {!profileLoading && profileMissing && (
          <div className={s.profileCallout}>
            <div className={s.pcText}>
              <strong>Complete your personal information</strong>
              <span className={s.pcMuted}>
                Add your name and phone to proceed smoothly with store verification.
              </span>
            </div>
            <button className={s.pcBtn} onClick={() => nav("/setup-profile")}>
              Complete Profile →
            </button>
          </div>
        )}

        {/* ======================= STATE A: NO STORES ======================= */}
        {stores === null ? (
          <section className={s.loadingWrap}>
            <SkeletonGrid />
          </section>
        ) : noStores ? (
          <main className={s.firstTime}>
            <div className={s.firstBox}>
              <div className={s.ftBadge}>Onboarding • Step 1</div>
              <h1 className={s.ftHello}>Hello, {displayName}</h1>
              <h2 className={s.ftTitle}>Launch your pharmacy on NearNest.</h2>
              <p className={s.ftSub}>
                Register your first store to start managing inventory, orders, and access.
              </p>
              <button className={s.heroCTA} onClick={() => setConfirmOpen(true)}>
                Register a Store <span className={s.ctaArrow}>→</span>
              </button>
            </div>
          </main>
        ) : (
          /* ======================= STATE B: HAS STORES ======================= */
          <main className={s.shell}>
            {/* Left panel = Get started */}
            <aside className={s.sidebar}>
              <div className={s.sidebarHead}>
                <div className={s.sidebarBrand}>
                  <span className={s.logoDot} />
                  Get started
                </div>
              </div>

              <div className={s.startCard}>
                <h3 className={s.startTitle}>Create a new store</h3>
                <p className={s.startSub}>
                  Add another pharmacy to your workspace and invite staff later.
                </p>
                <button className={s.addBtn} onClick={() => setConfirmOpen(true)}>
                  + Register New Store
                </button>
              </div>

              {under.length > 0 && (
                <div className={s.startCard}>
                  <h4 className={s.startSmall}>Pending verification</h4>
                  <p className={s.startSubSmall}>
                    {under.length} store{under.length > 1 ? "s" : ""} need your attention.
                  </p>
                  <button className={s.linkGhost} onClick={() => setTab("under")}>
                    Review now →
                  </button>
                </div>
              )}
            </aside>

            {/* Right panel = Stores list */}
            <section className={s.main}>
              <div className={s.mainTopRow}>
                <div>
                  <h2 className={s.h2}>Your stores</h2>
                  <p className={s.subh}>Browse your verified and in-review stores.</p>
                </div>
                <div className={s.roleBadge}>
                  {(prof?.role || prof?.roles?.[0] || "User")
                    .toString()
                    .replace(/^\w/, (c) => c.toUpperCase())}
                </div>
              </div>

              {errMsg && <div className={s.errBanner}>{errMsg}</div>}

              <div className={s.searchRow}>
                <input
                  className={s.searchInput}
                  placeholder="Search stores…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <div className={s.legend}>
                  <span className={`${s.dot} ${s.dotGreen}`} /> Verified
                  <span className={`${s.dot} ${s.dotBlue}`} /> Pending
                  <span className={`${s.dot} ${s.dotRed}`} /> Rejected
                </div>
              </div>

              <div className={s.tabRow}>
                <button
                  onClick={() => setTab("verified")}
                  className={`${s.tabBtn} ${tab === "verified" ? s.tabActive : ""}`}
                >
                  Verified ({verified.length})
                </button>
                <button
                  onClick={() => setTab("under")}
                  className={`${s.tabBtn} ${tab === "under" ? s.tabActive : ""}`}
                >
                  Pending/Review ({under.length})
                </button>
              </div>

              {(tab === "verified" ? filtered : filtered).length === 0 ? (
                <Empty
                  text={
                    tab === "verified"
                      ? "No verified stores yet."
                      : "No applications in progress."
                  }
                />
              ) : (
                <div className={s.grid}>
                  {filtered.map((st) => {
                    const status = (st.verificationStatus || "Pending").toLowerCase();
                    const badge =
                      storeBucket(st.verificationStatus) === "verified"
                        ? s.badgeGreen
                        : status === "rejected"
                        ? s.badgeRed
                        : s.badgeBlue;
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
                          if (!window.confirm("Delete this store? This can’t be undone.")) return;
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
        )}

        {/* Confirm modal */}
        {confirmOpen && (
          <div onClick={() => setConfirmOpen(false)} className={s.modalOverlay}>
            <div
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              className={s.modal}
            >
              <h3 className={s.modalTitle}>Register a new store?</h3>
              <p className={s.modalText}>
                We’ll collect your store details and verification documents. You can
                save progress and return anytime.
              </p>
              <div className={s.modalActions}>
                <button onClick={() => setConfirmOpen(false)} className={s.btnGhost}>
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setConfirmOpen(false);
                    nav("/register-store");
                  }}
                  className={s.btnPrimary}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
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

function StoreCard({ s: store, badgeClass, onOpen, onKebab, menuOpen, menuRef, onDelete }) {
  return (
    <div className={s.storeCard} style={{ position: "relative" }}>
      <button className={s.cardClickLayer} onClick={onOpen} title="Open" />
      <div className={s.storeTopRow}>
        <div className={s.storeName}>{store.name || "Untitled store"}</div>
        <span className={`${s.badge} ${badgeClass}`}>
          {store.verificationStatus || "Pending"}
        </span>
      </div>
      <div className={s.storeAddr}>{prettyAddress(store.address)}</div>
      <div className={s.storeMeta}>
        <span>ID: {String(store.id).slice(0, 8)}…</span>
      </div>

      {/* kebab */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onKebab?.();
        }}
        title="More"
        className={s.kebabBtn}
      >
        ⋮
      </button>

      {menuOpen && (
        <div ref={menuRef} className={s.kebabMenu} onClick={(e) => e.stopPropagation()}>
          <button onClick={onDelete} className={s.kebabDanger}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
