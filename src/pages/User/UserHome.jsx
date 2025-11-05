// src/pages/User/UserHome.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase/firebase";
import {
  collection, doc, getDoc, onSnapshot, query, where,
} from "firebase/firestore";
import styles from "./home.module.css";

export default function UserHome() {
  const nav = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load minimal profile (for welcome text)
  useEffect(() => {
    const u = auth.currentUser;
    if (!u) { nav("/signin", { replace: true }); return; }

    getDoc(doc(db, "users", u.uid)).then(s => {
      setProfile(s.exists() ? s.data() : { name: u.displayName || "User" });
    });
  }, [nav]);

  // Live list of owned & member stores
  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;

    const col = collection(db, "stores");
    const qOwned  = query(col, where("ownerId", "==", u.uid));
    const qMember = query(col, where("memberIds", "array-contains", u.uid));

    const unsubOwned = onSnapshot(qOwned, ss => {
      const owned = ss.docs.map(d => ({ id: d.id, ...d.data() }));
      setStores(prev => {
        // replace previous owned results, keep others
        const others = prev.filter(x => x._src !== "owned");
        return mergeById([...others, ...owned.map(x => ({ ...x, _src: "owned" }))]);
      });
      setLoading(false);
    });

    const unsubMember = onSnapshot(qMember, ss => {
      const mem = ss.docs.map(d => ({ id: d.id, ...d.data() }));
      setStores(prev => {
        const others = prev.filter(x => x._src !== "member");
        return mergeById([...others, ...mem.map(x => ({ ...x, _src: "member" }))]);
      });
      setLoading(false);
    });

    return () => { unsubOwned(); unsubMember(); };
  }, []);

  const mergeById = (arr) => {
    const m = new Map();
    arr.forEach(x => m.set(x.id, { ...m.get(x.id), ...x }));
    return Array.from(m.values());
  };

  const badge = (status = "Pending") => {
    const norm = { Approved: "Verified", Verified: "Verified", Rejected: "Rejected", Pending: "Pending" }[status] || "Pending";
    const cls =
      norm === "Verified" ? styles.badgeApproved :
      norm === "Rejected" ? styles.badgeRejected : styles.badgePending;
    return <span className={`${styles.badge} ${cls}`}>{norm}</span>;
  };

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>NearNest</div>
        <div className={styles.headerActions}>
          <Link to="/register-store" className={styles.primaryBtn}>Register your store</Link>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <h1>Welcome{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}</h1>
          <p className={styles.sub}>
            Your pharmacies & workplaces appear below. Click one to open its status.
          </p>
        </section>

        {loading ? (
          <div className={styles.empty}>Loading…</div>
        ) : stores.length === 0 ? (
          <div className={styles.empty}>
            <p>You don’t belong to any store yet.</p>
            <Link to="/register-store" className={styles.linkBtn}>Register a store</Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {stores.map(s => (
              <button
                key={s.id}
                className={styles.storeCard}
                onClick={() => nav(`/verification-status/${s.id}`)}
              >
                <div className={styles.storeTop}>
                  <h3 className={styles.storeName}>
                    {s.details?.name || s.name || "Untitled Store"}
                  </h3>
                  {badge(s.verificationStatus || s.status)}
                </div>
                <div className={styles.storeMeta}>
                  <span>{s.details?.address || s.address || "Address not set"}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
