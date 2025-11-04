import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "./home.module.css";
import { auth } from "../../firebase/firebase";
import { getStoresForUser } from "../../services/stores";

export default function UserHome() {
  const nav = useNavigate();
  const user = useMemo(() => auth.currentUser, [auth?.currentUser]);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function run() {
      try {
        if (!user) return; // ProtectedRoute should already ensure auth
        const list = await getStoresForUser(user.uid);
        if (mounted) setStores(list);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    run();
    return () => (mounted = false);
  }, [user]);

  const gotoCard = (s) => {
    if (s.verificationStatus === "Pending" || s.verificationStatus === "Rejected") {
      nav(`/verification-status/${s.id}`);
    } else {
      // Adjust later to your actual store dashboard route if different
      nav(`/store-admin/home?store=${s.id}`);
    }
  };

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.dot} />
          <span className={styles.logoText}>NearNest</span>
        </div>

        <div className={styles.topActions}>
          <Link className={styles.ghostBtn} to="/register-store">
            + Register a store
          </Link>
          <div
            className={styles.avatar}
            title={user?.displayName || user?.email || "Profile"}
            onClick={() => nav("/account")}
          >
            {(user?.photoURL && <img src={user.photoURL} alt="me" />) ||
              (user?.email?.[0] || "U").toUpperCase()}
          </div>
        </div>
      </header>

      <main className={styles.container}>
        <section className={styles.hero}>
          <h1 className={styles.h1}>
            Welcome back{user?.displayName ? `, ${user.displayName}` : ""}.
          </h1>
          <p className={styles.sub}>
            Your workspaces & memberships live here. Pick a store to continue.
          </p>
        </section>

        {loading ? (
          <div className={styles.loader}>Loading…</div>
        ) : stores.length === 0 ? (
          <div className={styles.empty}>
            <h3>No stores yet</h3>
            <p>You can own multiple pharmacies or join as staff on others.</p>
            <Link to="/register-store" className={styles.primaryBtn}>
              Register your first store
            </Link>
          </div>
        ) : (
          <section className={styles.grid}>
            {stores.map((s) => (
              <button key={s.id} className={styles.card} onClick={() => gotoCard(s)}>
                <div className={styles.cardTop}>
                  <span className={`${styles.badge} ${styles[s.verificationStatus || "Pending"]}`}>
                    {s.verificationStatus || "Pending"}
                  </span>
                </div>
                <h3 className={styles.title}>{s.name || "Untitled Store"}</h3>
                <p className={styles.meta}>
                  {s.category || "Pharmacy"}
                  {s.city ? ` • ${s.city}` : ""}
                </p>
                <div className={styles.cardFoot}>
                  <span className={styles.linkLike}>Open</span>
                </div>
              </button>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
