// src/pages/Auth/SignIn.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./auth.module.css";
import { auth, googleProvider } from "../../firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
} from "firebase/auth";

export default function SignIn() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");
    setLoading(true);
    try {
      const methods = await fetchSignInMethodsForEmail(auth, form.email);
      if (!methods?.length) {
        throw new Error("No account found for this email.");
      }
      await signInWithEmailAndPassword(auth, form.email, form.password);
      nav("/admin");
    } catch (e) {
      setErr(e?.message || "Sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setErr("");
    setOk("");
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      nav("/admin");
    } catch (e) {
      setErr(e?.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const forgot = async () => {
    setErr("");
    setOk("");
    if (!form.email) {
      setErr("Enter your email first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, form.email);
      setOk("Reset link sent. Check your inbox.");
    } catch (e) {
      setErr(e?.message || "Couldn't send reset email.");
    }
  };

  return (
    <div className={styles.shell}>
      <div className={styles.panel}>
        <div className={styles.brand}>
          <span className={styles.logoDot} />
          NearNest
        </div>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Sign in to continue</p>

        {ok && <div className={styles.ok} role="status">{ok}</div>}
        {err && <div className={styles.err} role="alert">{err}</div>}

        <form className={styles.form} onSubmit={onSubmit}>
          <label className={styles.label}>
            Email
            <input
              className={styles.input}
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={onChange}
              required
            />
          </label>

          <label className={styles.label}>
            Password
            <div className={styles.pwdWrap}>
              <input
                className={styles.input}
                name="password"
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={onChange}
                required
              />
              <button
                type="button"
                className={styles.pwdToggle}
                onClick={() => setShowPwd((s) => !s)}
              >
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <div className={styles.rowBetween}>
            <span />
            <button type="button" className={styles.link} onClick={forgot}>
              Forgot password?
            </button>
          </div>

          <button className={styles.primaryBtn} disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <div className={styles.divider}>or</div>

          <button type="button" onClick={google} className={styles.googleBtn}>
            Continue with Google
          </button>

          <p className={styles.meta}>
            Don’t have an account? <Link to="/signup" className={styles.link}>Create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
