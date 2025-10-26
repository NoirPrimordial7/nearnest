import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./auth.module.css";
import {
  auth,
  googleProvider,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signInWithPopup,
} from "../../lib/firebase";

export default function SignUp() {
  const nav = useNavigate();
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [pass, setPass]     = useState("");
  const [show, setShow]     = useState(false);
  const [msg, setMsg]       = useState({ t: "", ok: false });

  const go = async (e) => {
    e.preventDefault();
    setMsg({ t: "", ok: false });
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      await updateProfile(cred.user, { displayName: name.trim() });
      // optional email verification (kept but non-blocking)
      try { await sendEmailVerification(cred.user); } catch {}
      setMsg({ t: "Account created!", ok: true });
      setTimeout(()=>nav("/admin"), 600);
    } catch (err) {
      const map = {
        "auth/email-already-in-use": "Email already in use.",
        "auth/weak-password": "Password should be at least 6 characters.",
        "auth/invalid-email": "Enter a valid email.",
      };
      setMsg({ t: map[err.code] || err.message, ok: false });
    }
  };

  const withGoogle = async () => {
    setMsg({ t: "", ok: false });
    try {
      await signInWithPopup(auth, googleProvider);
      setMsg({ t: "Signed in with Google!", ok: true });
      setTimeout(()=>nav("/admin"), 400);
    } catch (err) {
      setMsg({ t: err.message, ok: false });
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.brandCard}>
          <div className={styles.brandPill}>nearnest</div>
          <div className={styles.kicker}>Create admin account</div>
          <div className={styles.hero}>Let’s get you set up</div>
          <ul className={styles.points}>
            <li>Access store verification tools</li>
            <li>Manage tickets & permissions</li>
            <li>Beautiful, fast UI</li>
          </ul>
        </section>

        <section className={styles.formCard}>
          <div className={styles.title}>Create your account</div>
          <div className={styles.sub}>Use work email whenever possible.</div>

          <form className={styles.form} onSubmit={go}>
            <div className={styles.row}>
              <label>Full name</label>
              <input className={styles.input} value={name} onChange={(e)=>setName(e.target.value)} required placeholder="Alex Doe"/>
            </div>

            <div className={styles.row}>
              <label>Email</label>
              <input className={styles.input} type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required placeholder="you@company.com"/>
            </div>

            <div className={`${styles.row} ${styles.passWrap}`}>
              <label>Password</label>
              <input className={styles.input} type={show?"text":"password"} value={pass} onChange={(e)=>setPass(e.target.value)} required placeholder="••••••••"/>
              <button className={styles.eye} type="button" onClick={()=>setShow(s=>!s)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Zm11 4a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2"/></svg>
              </button>
            </div>

            <div className={styles.actions}>
              <span className={styles.hint}>
                By continuing, you agree to our <a className={styles.link} href="#">Terms</a>.
              </span>
              <button className={styles.btn} type="submit">Create account</button>
            </div>
          </form>

          <div className={styles.divider}>or</div>
          <button className={styles.btnGoogle} onClick={withGoogle}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 10h10v4H12z"/><path fill="#4285F4" d="M12 2a10 10 0 1 1-9.45 13.4l3.9-1.6A6 6 0 1 0 12 6"/></svg>
            Sign up with Google
          </button>

          <div className={styles.hint} style={{marginTop:12}}>
            Already have an account? <Link to="/signin" className={styles.link}>Sign in</Link>
          </div>

          {msg.t && <div className={msg.ok ? styles.good : styles.bad}>{msg.t}</div>}
        </section>
      </div>

      {msg.ok && <div className={styles.toast}>{msg.t}</div>}
    </div>
  );
}
