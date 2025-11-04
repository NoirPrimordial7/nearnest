import React, { useEffect, useState } from "react";
import styles from "./home.module.css";
import { useAuth } from "../../context/AuthContext";
import { listStoresForUser } from "../../services/stores";
import { getProfile } from "../../services/userProfile";
import { Link, useNavigate } from "react-router-dom";

export default function UserHome() {
  const { user } = useAuth();
  const [stores, setStores] = useState([]);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [s, p] = await Promise.all([
        listStoresForUser(user?.uid),
        getProfile(user?.uid),
      ]);
      if (!mounted) return;
      setStores(s);
      setProfile(p);
    })();
    return () => (mounted = false);
  }, [user?.uid]);

  const avatarLetter = (profile?.fullName || user?.email || "?").charAt(0).toUpperCase();

  return (
    <div className={styles.screen}>
      {/* top bar */}
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.dot} />
          <span>NearNest</span>
        </div>
        <div className={styles.actions}>
          <button className={styles.ghost} onClick={() => navigate("/register/confirm")}>
            Register your store
          </button>
          <div className={styles.avatar} title={profile?.fullName || user?.email}>
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="you" />
            ) : (
              avatarLetter
            )}
          </div>
        </div>
      </header>

      {/* hero */}
      <div className={styles.hero}>
        <h1 className={styles.h1}>Welcome, {profile?.fullName || "there"} 👋</h1>
        <p className={styles.sub}>Pick a store to continue or register a new one.</p>
      </div>

      {/* store grid */}
      <main className={styles.gridWrap}>
        {stores.length === 0 ? (
          <div className={styles.empty}>
            <p>No stores yet.</p>
            <button className={styles.primary} onClick={() => navigate("/register/confirm")}>
              Register your store
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {stores.map((s) => (
              <button
                key={s.id}
                className={styles.card}
                onClick={() => navigate("/status")} // you can swap to /store/:id later
              >
                <div className={styles.cardTop}>
                  <span className={styles.badge + " " + styles[s.status.toLowerCase()]}>
                    {s.status}
                  </span>
                </div>
                <h3 className={styles.cardTitle}>{s.name}</h3>
                <div className={styles.cardMeta}>Role: {s.role}</div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* footer */}
      <footer className={styles.foot}>
        <span>Already verified?</span>{" "}
        <Link to="/signin" className={styles.link}>Sign in</Link>
      </footer>
    </div>
  );
}
