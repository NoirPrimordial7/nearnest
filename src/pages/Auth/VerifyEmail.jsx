// src/pages/Auth/VerifyEmail.jsx
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import styles from "./auth.module.css";
import { auth } from "../../firebase";
import { onAuthStateChanged, reload, sendEmailVerification } from "firebase/auth";

const APP_URL = import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [user, setUser] = useState(null);
  const [sending, setSending] = useState(false);
  const email = params.get("email") || auth.currentUser?.email;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  const resend = async () => {
    if (!user) return;
    setSending(true);
    try {
      await reload(user); // refresh token so sendOobCode has a valid idToken
      await sendEmailVerification(user, {
        url: `${APP_URL}/signin`,
        handleCodeInApp: true,
      });
      alert("Verification email sent.");
    } catch (e) {
      alert(e.message || "Failed to send email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.centerWrap}>
      <div className={styles.card}>
        <h1>Verify your email</h1>
        <p>
          We sent a verification link to <b>{email || "your email"}</b>. Open it to
          continue.
        </p>
        <div className={styles.actionsRow}>
          <button
            disabled={!user || sending}
            onClick={resend}
            className={styles.primaryBtn}
          >
            {sending ? "Sending…" : "Resend email"}
          </button>
          <Link className={styles.ghostBtn} to="/signin">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
