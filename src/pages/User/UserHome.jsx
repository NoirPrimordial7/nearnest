// src/pages/User/UserHome.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listenStoresForUser } from "../../services/stores";
import styles from "./home.module.css";

const StatusChip = ({ s }) => {
  const classes = {
    Pending: styles.chipPending,
    Approved: styles.chipApproved,
    Rejected: styles.chipRejected,
  };
  return <span className={classes[s] || styles.chipPending}>{s || "Pending"}</span>;
};

export default function UserHome() {
  const { user } = useAuth();
  const [stores, setStores] = useState(null);

  useEffect(() => {
    if (!user) return;
    return listenStoresForUser(user.uid, setStores);
  }, [user]);

  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <h1 className={styles.title}>Your workspaces</h1>
        <p className={styles.sub}>Stores you own or work at.</p>
      </div>

      <div className={styles.grid}>
        {stores && stores.length > 0 ? (
          stores.map((s) => (
            <Link
              key={s.id}
              to={`/verification-status/${s.id}`}
              className={styles.card}
            >
              <div className={styles.cardTop}>
                <span className={styles.name}>{s.details?.name || s.name || "Store"}</span>
                <StatusChip s={s.verificationStatus || "Pending"} />
              </div>
              <div className={styles.meta}>
                {s.details?.address || "—"}
              </div>
              <div className={styles.open}>View status</div>
            </Link>
          ))
        ) : (
          <div className={styles.empty}>
            <h3>No stores yet</h3>
            <p>You can register your first store to get started.</p>
            <Link to="/register-store/start" className={styles.primaryBtn}>
              Register your store
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
