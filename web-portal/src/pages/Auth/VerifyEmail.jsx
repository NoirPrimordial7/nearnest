import React, { useState } from "react";
import styles from "./auth.module.css";
import OTPInput from "../../components/OTPInput.jsx";
import { httpsCallable, getFunctions } from "firebase/functions";
import { auth } from "../../lib/firebase.js";
import { useNavigate, Link } from "react-router-dom";

export default function VerifyEmail() {
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const functions = getFunctions();

  const verify = async () => {
    setMsg("");
    setLoading(true);
    try {
      const fn = httpsCallable(functions, "verifyEmailCode");
      await fn({ code });
      setMsg("Email verified! Redirecting…");
      setTimeout(() => nav("/complete-profile"), 600);
    } catch (e) {
      setMsg(e.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setMsg("");
    try {
      const fn = httpsCallable(functions, "requestEmailCode");
      await fn();
      setMsg("New code sent to your email.");
    } catch (e) {
      setMsg(e.message || "Failed to send code");
    }
  };

  if (!auth.currentUser) {
    return (
      <div className={styles.shell}>
        <div className={styles.card}>
          <section className={styles.left}>
            <h3>Session expired</h3>
            <Link to="/signin" className={styles.link}>Sign in</Link>
          </section>
          <aside className={styles.right}/>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <section className={styles.left}>
          <h2>Verify your email</h2>
          <p className={styles.hint}>
            We sent a 6-digit code to <b>{auth.currentUser.email}</b>.
          </p>
          <OTPInput value={code} onChange={setCode} />
          {msg && <div className={msg.includes("verified") ? styles.success : styles.err}>{msg}</div>}
          <div className={styles.row}>
            <button className={styles.btn} onClick={verify} disabled={code.length !== 6 || loading}>
              {loading ? "Verifying…" : "Verify"}
            </button>
            <button className={styles.ghost} onClick={resend}>Resend code</button>
          </div>
        </section>
        <aside className={styles.right}/>
      </div>
    </div>
  );
}
