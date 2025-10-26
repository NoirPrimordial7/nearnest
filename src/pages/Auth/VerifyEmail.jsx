// src/pages/Auth/VerifyEmail.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./auth.module.css";
import { auth } from "../../firebase";
import { onAuthStateChanged, sendEmailVerification, reload } from "firebase/auth";

const APP_URL = import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;

export default function VerifyEmail() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setEmail(user?.email || "");
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!cooldown) return;
    const t = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const resend = async () => {
    if (cooldown) return;
    setOk(""); setErr(""); setSending(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("You are signed out. Please sign in again.");
      await reload(user);
      await sendEmailVerification(user, {
        url: `${APP_URL}/signin`,
        handleCodeInApp: true,
      });
      setOk("Verification email sent.");
      setCooldown(60);
    } catch (e) {
      setErr(e?.message || "Could not send verification email.");
    } finally {
      setSending(false);
    }
  };

  const iveVerified = async () => {
    setOk(""); setErr("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("You are signed out. Please sign in again.");
      await reload(user);
      if (user.emailVerified) {
        nav("/admin");
      } else {
        setErr("Not verified yet. Open the link in your email and try again.");
      }
    } catch (e) {
      setErr(e?.message || "Could not refresh verification status.");
    }
  };

  return (
    <div className={styles.shell}>
      <div className={styles.panel}>
        <div className={styles.brand}>
          <span className={styles.logoDot} />
          NearNest
        </div>
        <h1 className={styles.title}>Verify your email</h1>
        <p className={styles.subtitle}>
          We sent a verification link to <b>{email}</b>. Open it to continue.
        </p>

        {ok && <div className={styles.ok}>{ok}</div>}
        {err && <div className={styles.err}>{err}</div>}

        <div className={styles.row}>
          <button
            onClick={resend}
            disabled={sending || cooldown > 0}
            className={styles.primaryBtn}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : (sending ? "Sending…" : "Resend email")}
          </button>

          <button onClick={iveVerified} className={styles.ghostBtn}>
            I’ve verified
          </button>

          <Link to="/signin" className={styles.ghostBtn}>
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
