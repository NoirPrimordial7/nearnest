import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./auth.module.css";
import {
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from "../../lib/firebase";

function EyeIcon({ on }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      {on ? (
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Zm11 4a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2"/>
      ) : (
        <path d="M3 3l18 18M10.6 10.6A4 4 0 0 0 12 16a4 4 0 0 0 4-4c0-1-.4-1.9-1-2.6M21 12s-4-7-9-7c-1.5 0-2.9.4-4.1 1" stroke="currentColor" strokeWidth="2" />
      )}
    </svg>
  );
}

export default function SignIn() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState({ t: "", ok: false });

  const handleEmail = async (e) => {
    e.preventDefault();
    setMsg({ t: "", ok: false });
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      setMsg({ t: "Welcome back!", ok: true });
      setTimeout(() => nav("/admin"), 500);
    } catch (err) {
      const map = {
        "auth/invalid-credential": "Invalid email or password.",
        "auth/user-not-found": "No user found with this email.",
        "auth/wrong-password": "Incorrect password.",
      };
      setMsg({ t: map[err.code] || err.message, ok: false });
    }
  };

  const handleGoogle = async () => {
    setMsg({ t: "", ok: false });
    try {
      await signInWithPopup(auth, googleProvider);
      setMsg({ t: "Signed in with Google!", ok: true });
      setTimeout(() => nav("/admin"), 400);
    } catch (err) {
      setMsg({ t: err.message, ok: false });
    }
  };

  const forgot = async () => {
    if (!email) return setMsg({ t: "Enter your email first.", ok: false });
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMsg({ t: "Password reset email sent.", ok: true });
    } catch (err) {
      setMsg({ t: err.message, ok: false });
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        {/* Brand / copy */}
        <section className={styles.brandCard}>
          <div className={styles.brandPill}>nearnest</div>
          <div className={styles.kicker}>Admin Console</div>
          <div className={styles.hero}>Sign in to continue</div>
          <ul className={styles.points}>
            <li>Review store applications</li>
            <li>Verify documents & manage tickets</li>
            <li>Role-based access built-in</li>
          </ul>
        </section>

        {/* Form */}
        <section className={styles.formCard}>
          <div className={styles.title}>Welcome back</div>
          <div className={styles.sub}>Use your admin credentials.</div>

          <form className={styles.form} onSubmit={handleEmail}>
            <div className={styles.row}>
              <label>Email</label>
              <input className={styles.input} type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required placeholder="you@company.com"/>
            </div>

            <div className={`${styles.row} ${styles.passWrap}`}>
              <label>Password</label>
              <input className={styles.input} type={show ? "text":"password"} value={pass} onChange={(e)=>setPass(e.target.value)} required placeholder="••••••••"/>
              <button className={styles.eye} type="button" onClick={()=>setShow(s=>!s)}><EyeIcon on={show}/></button>
            </div>

            <div className={styles.actions}>
              <span className={styles.hint}><button onClick={forgot} type="button" className={styles.link}>Forgot password?</button></span>
              <button className={styles.btn} type="submit">Sign In</button>
            </div>
          </form>

          <div className={styles.divider}>or continue with</div>
          <button className={styles.btnGoogle} onClick={handleGoogle}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 10h10v4H12z"/><path fill="#4285F4" d="M12 2a10 10 0 1 1-9.45 13.4l3.9-1.6A6 6 0 1 0 12 6"/></svg>
            Google
          </button>

          <div className={styles.hint} style={{marginTop:12}}>
            Don’t have an account? <Link to="/signup" className={styles.link}>Create one</Link>
          </div>

          {msg.t && <div className={msg.ok ? styles.good : styles.bad}>{msg.t}</div>}
        </section>
      </div>

      {msg.ok && <div className={styles.toast}>{msg.t}</div>}
    </div>
  );
}
