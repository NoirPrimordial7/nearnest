// src/pages/Auth/VerifyEmail.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./auth.module.css";
import { auth } from "../../firebase";
import { onAuthStateChanged, sendEmailVerification, reload } from "firebase/auth";

const APP_URL = import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;

export default function VerifyEmail() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  // Get the current user’s email for display
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setEmail(user?.email || "");
    });
    return unsub;
  }, []);

  const resend = async () => {
    setOk("");
    setErr("");
    setSending(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("You are signed out. Please sign in again.");
      // refresh token before sending email
      await reload(user);
      await sendEmailVerification(user, {
        url: `${APP_URL}/signin`,
        handleCodeInApp: true,
      });
      setOk("Verification email sent.");
    } catch (e) {
      setErr(e?.message || "Could not send verification email.");
    } finally {
      setSending(false);
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
          <button onClick={resend} disabled={sending} className={styles.primaryBtn}>
            {sending ? "Sending…" : "Resend email"}
          </button>
          <Link to="/signin" className={styles.ghostLink}>
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
