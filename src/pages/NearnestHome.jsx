// src/pages/NearNestHome.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./NearnestHome.module.css";

export default function NearNestHome() {
  const navigate = useNavigate();

  const handleSignup = () => {
    navigate("/signup"); // change path if your signup route differs
  };

  return (
    <div className={styles.root}>
      <div className={styles.overlay}></div>

      <div className={styles.centerBox}>
        <h1 className={styles.title}>MediFind</h1>
        <p className={styles.tagline}>
          Register & Groww your store in minutes.<br></br>
          Let users find the medicines they need & what you provide.
        </p>
        <button className={styles.signupButton} onClick={handleSignup}>
          Get Started
        </button>
      </div>

      <footer className={styles.footer}>
        © {new Date().getFullYear()} MediFind • All rights reserved
      </footer>
    </div>
  );
}
