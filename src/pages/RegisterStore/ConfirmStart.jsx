// src/pages/RegisterStore/ConfirmStart.jsx
import React, { useState } from "react";
import styles from "../User/home.module.css";
import { useNavigate } from "react-router-dom";

export default function ConfirmStart() {
  const [ok, setOk] = useState(false);
  const nav = useNavigate();
  return (
    <div className={styles.shell}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>Register a store</h1>
        <p className={styles.subtitle}>You’ll fill owner details, upload documents, then wait for approval.</p>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" checked={ok} onChange={e=>setOk(e.target.checked)} />
          I agree to proceed and that submitted info is accurate.
        </label>
        <div style={{display:"grid", gap:12, marginTop:16}}>
          <button className={styles.primaryBtn} disabled={!ok} onClick={()=>nav("/register")}>Continue</button>
          <button className={styles.secondaryBtn} onClick={()=>nav("/home")}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
