import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import styles from "./auth.module.css";
import { auth } from "../../firebase";
import { onAuthStateChanged, reload, sendEmailVerification } from "firebase/auth";

const APP_URL = import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;

export default function VerifyEmail() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [email] = useState(params.get("email") || "");
  const [user, setUser] = useState(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  async function resend() {
    if (!user) { setErr("Please sign in again."); return nav("/signin"); }
    setErr(""); setMsg(""); setLoading(true);
    try {
      await reload(user);
      await sendEmailVerification(user, {
        url: `${APP_URL}/signin`,
        handleCodeInApp: true,
      });
      setMsg("Verification email sent. Check your inbox.");
    } catch (e) {
      const code = e?.code || "";
      if (code === "auth/too-many-requests") setErr("Too many attempts. Please try again later.");
      else if (code === "auth/user-disabled") setErr("This account is disabled.");
      else setErr(e?.message || "Could not resend email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <section className={styles.card} style={{maxWidth: 720, gridTemplateColumns: "1fr"}}>
        <div className={styles.left}>
          <h1>Verify your email</h1>
          <div className={styles.sub}>
            We sent a verification link to <b>{email}</b>. Open it to continue.
          </div>

          {msg && <div className={styles.note}>{msg}</div>}
          {err && <div className={styles.err}>{err}</div>}

          <div className={styles.row}>
            <button onClick={resend} disabled={loading} className={styles.primary}>
              {loading ? "Sending…" : "Resend email"}
            </button>
            <Link to="/signin" className={`${styles.ghost}`} style={{textDecoration:'none', display:'inline-flex', alignItems:'center'}}>
              Back to sign in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
