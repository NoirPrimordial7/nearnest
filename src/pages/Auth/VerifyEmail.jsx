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

  // resend cooldown (seconds)
  const [cooldown, setCooldown] = useState(0);

  // show current signed-in user's email
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setEmail(user?.email || "");
    });
    return unsub;
  }, []);

  // tick down cooldown every second
  useEffect(() => {
    if (!cooldown) return;
    const t = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const resend = async () => {
    if (cooldown) return; // guard
    setOk("");
    setErr("");
    setSending(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("You are signed out. Please sign in again.");

      // refresh token before sending email
      await reload(user);

      await sendEmailVerification(user, {
        url: `${APP_URL}/signin`, // user returns here after verifying
        handleCodeInApp: true,
      });

      setOk("Verification email sent.");
      setCooldown(60); // prevent spamming for 60s
    } catch (e) {
      setErr(e?.message || "Could not send verification email.");
    } finally {
      setSending(false);
    }
  };

  const iveVerified = async () => {
    setOk("");
    setErr("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("You are signed out. Please sign in again.");
      await reload(user);
      if (user.emailVerified) {
        // go wherever you want next:
        nav("/admin"); // or "/profile-setup"
      } else {
        setErr("Not verified yet. Open the link in your email and try again.");
      }
    } catch (e) {
      setErr(e?.message || "Could not refresh verification status.");
    }
  };

  return (
    <div className={styles.centerWrap}>
      <div className={styles.card}>
        <h1>Verify your email</h1>
        <p>
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
            {cooldown > 0 ? `Resend in ${cooldown}s` : sending ? "Sending…" : "Resend email"}
          </button>

          <button onClick={iveVerified} className={styles.ghostLink}>
            I’ve verified
          </button>

          <Link to="/signin" className={styles.ghostLink}>
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
