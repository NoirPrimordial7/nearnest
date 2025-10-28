// src/pages/Auth/SignIn.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./auth.module.css";
import { auth, googleProvider } from "../../firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";

export default function SignIn() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const onChange = (e) =>
    setForm((f) => ({
      ...f,
      [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");
    setLoading(true);

    try {
      const userCred = await signInWithEmailAndPassword(
        auth,
        form.email.trim(),
        form.password
      );
      const user = userCred.user;

      if (!user.emailVerified) {
        setOk("Email not verified. Redirecting...");
        setTimeout(() => nav("/verify-email"), 1500);
        return;
      }

      // ✅ If "Remember Me" checked, store session
      if (form.remember) localStorage.setItem("rememberEmail", form.email);
      else localStorage.removeItem("rememberEmail");

      nav("/admin");
    } catch (e) {
      setErr("Invalid email or password.");
      console.error(e);
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
    <div className={styles.authShell}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>Login</h1>

        {ok && <div className={styles.ok}>{ok}</div>}
        {err && <div className={styles.err}>{err}</div>}

        <form className={styles.authForm} onSubmit={onSubmit}>
          <label className={styles.label}>
            Email Address
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
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={onChange}
              />
              Remember Me
            </label>
            <button type="button" className={styles.link} onClick={forgot}>
              Forgot Password?
            </button>
          </div>

          <button className={styles.primaryBtn} disabled={loading}>
            {loading ? "Signing in…" : "Login"}
          </button>

          <div className={styles.divider}>or</div>

          <button type="button" onClick={google} className={styles.googleBtn}>
            Continue with Google
          </button>

          <p className={styles.meta}>
            Don’t have an account?{" "}
            <Link to="/signup" className={styles.link}>
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
