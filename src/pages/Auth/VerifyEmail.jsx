import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import { sendEmailVerification } from "firebase/auth";
import styles from "./auth.module.css";

export default function VerifyEmail() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (u?.emailVerified) nav("/admin", { replace: true });
    });
    return () => unsub();
  }, [nav]);

  const resend = async () => {
    try {
      setBusy(true);
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setMsg("Verification email sent again.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <h2 className={styles.title}>Verify your email</h2>
        <p className={styles.meta}>
          We sent a verification link to <b>{auth.currentUser?.email}</b>. Open it to continue.
        </p>
        {msg && <div className={styles.note}>{msg}</div>}
        <div className={styles.actionsRow}>
          <button className={styles.primary} onClick={resend} disabled={busy}>
            {busy ? "Sending…" : "Resend email"}
          </button>
          <Link to="/signin" className={styles.linkBtn}>Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
