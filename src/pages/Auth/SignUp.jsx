// src/pages/Auth/SignUp.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./auth.module.css";
import SocialAuthButtons from "../../components/SocialAuthButtons";
import {
  auth,
  googleProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "../../lib/firebase.js";

export default function SignUp() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const onCreate = async (e) => {
    e.preventDefault();
    if (pass !== pass2) return setMsg("Passwords do not match.");
    if (pass.length < 6) return setMsg("Use at least 6 characters.");

    try {
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (name) await updateProfile(cred.user, { displayName: name.trim() });
      await sendEmailVerification(cred.user);
      nav("/admin", { replace: true });
    } catch (err) {
      setMsg(err.message || "Could not create account.");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      nav("/admin", { replace: true });
    } catch (err) {
      setMsg(err.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <div className={styles.brandSide}>
          <div className={styles.logoDot}>nearnest</div>
          <h1>Create your account ✨</h1>
          <p className={styles.muted}>
            One account for stores, verification, analytics and support.
          </p>
        </div>

        <div className={styles.formSide}>
          <h2>Sign up</h2>

          {msg && <div className={styles.alert}>{msg}</div>}

          <form className={styles.form} onSubmit={onCreate}>
            <label>
              <span>Full name</span>
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Montana"
                required
              />
            </label>

            <label>
              <span>Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </label>

            <label>
              <span>Password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="At least 6 characters"
                required
              />
            </label>

            <label>
              <span>Confirm password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={pass2}
                onChange={(e) => setPass2(e.target.value)}
                placeholder="Repeat your password"
                required
              />
            </label>

            <button className={styles.primary} type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create account"}
            </button>
          </form>

          <div className={styles.row}>
            <span className={styles.muted}>Already have an account?</span>
            <Link to="/signin" className={styles.linkBtn}>Sign in</Link>
          </div>

          <div className={styles.divider}><span>or continue with</span></div>

          <SocialAuthButtons onGoogle={onGoogle} loading={loading} />
        </div>
      </div>
    </div>
  );
}
