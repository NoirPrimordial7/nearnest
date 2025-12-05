// src/pages/Admin/Dashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className={styles.dashboard}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>MediFind</div>
        <div className={styles.links}>
          <span>About</span>
          <span>Contact</span>
        </div>
      </nav>

      {/* Cards */}
      <div className={styles.cardContainer}>
        <div
          className={styles.card}
         onClick={() => navigate("/platform-admin-signup")}
        >
          <h2>Platform Admin Login</h2>
        </div>

        <div
          className={styles.card}
          onClick={() => navigate("/platform-admin-signup")}
        >
          <h2>Store Admin Login</h2>
        </div>
      </div>
    </div>
  );
}
  