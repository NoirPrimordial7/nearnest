import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Auth.module.css";
import SocialAuthButtons from "../../components/SocialAuthButtons";
import { auth } from "../../lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";


export default function SignUp() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const doEmail = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (name) await updateProfile(cred.user, { displayName: name });
      try { await sendEmailVerification(cred.user); } catch {}
      nav("/admin", { replace: true });
    } catch (e) {
      setErr(e.message || "Unable to sign up");
    } finally { setLoading(false); }
  };

  const doGoogle = async () => {
    setErr(""); setLoading(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      nav("/admin", { replace: true });
    } catch (e) {
      setErr(e.message || "Google sign-in failed");
    } finally { setLoading(false); }
  };

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <aside className={styles.brandSide}>
          <div className={styles.brand}>nearnest</div>
          <div className={styles.hero}>Create your admin account ✨</div>
          <p className={styles.sub}>You’ll use this to review stores, verify documents and resolve tickets.</p>
        </aside>

        <section className={styles.formSide}>
          <div className={styles.h}>Sign up</div>
          <div className={styles.note}>Use your work email. We’ll verify it.</div>

          {err && <div className={styles.err}>{err}</div>}

          <form onSubmit={doEmail}>
            <div className={styles.group}>
              <label>Full Name</label>
              <input className={styles.input} value={name} onChange={(e)=>setName(e.target.value)} />
            </div>
            <div className={styles.group}>
              <label>Email</label>
              <input className={styles.input} type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
            </div>
            <div className={styles.group}>
              <label>Password</label>
              <input className={styles.input} type="password" value={pass} onChange={(e)=>setPass(e.target.value)} />
            </div>
            <div className={styles.actions}>
              <button className={styles.primary} disabled={loading}>{loading ? "Creating…" : "Create account"}</button>
            </div>
          </form>

          <div className={styles.hr} />

          <SocialAuthButtons onGoogle={doGoogle} />

          <div className={styles.note} style={{marginTop:10}}>
            Already have an account? <Link className={styles.link} to="/signin">Sign in</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
