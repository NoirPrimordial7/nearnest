// src/pages/Auth/SignIn.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./auth.module.css";

import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";

import { auth, googleProvider, db } from "../../firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// --- keep logic consistent with App.jsx ---
const isAdmin = (roles) => Array.isArray(roles) && roles.includes("admin");
const isStoreAdmin = (roles) =>
  Array.isArray(roles) && (roles.includes("storeAdmin") || roles.some((r) => r.includes(":Owner")));
const isStoreStaff = (roles) =>
  Array.isArray(roles) && roles.some((r) => r.includes(":")) && !isStoreAdmin(roles);
const resolveHomePath = (roles) => {
  if (isAdmin(roles)) return "/admin/dashboard";
  if (isStoreAdmin(roles)) return "/store-admin/home";
  if (isStoreStaff(roles)) return "/store-staff/home";
  return "/";
};

export default function SignIn() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    email: localStorage.getItem("rememberEmail") || "",
    password: "",
    remember: !!localStorage.getItem("rememberEmail"),
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const onChange = (e) =>
    setForm((f) => ({
      ...f,
      [e.target.name]:
        e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  // ===== ROLE-BASED REDIRECT =====
  const handleRedirectByRole = async (user) => {
    try {
      const userDocSnap = await getDoc(doc(db, "users", user.uid));
      if (!userDocSnap.exists()) return nav("/signin", { replace: true });

      const data = userDocSnap.data();
      const roles = Array.isArray(data?.roles) ? data.roles : [];

      const target = resolveHomePath(roles);
      return nav(target, { replace: true });
    } catch (e) {
      console.error("Error in handleRedirectByRole:", e);
      nav("/signin", { replace: true });
    }
  };

  // ===== EMAIL/PASSWORD LOGIN =====
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

      if (user && user.emailVerified === false) {
        setOk("Email not verified. Redirecting...");
        setTimeout(() => nav("/verify-email"), 1200);
        return;
      }

      form.remember
        ? localStorage.setItem("rememberEmail", form.email)
        : localStorage.removeItem("rememberEmail");

      await handleRedirectByRole(user);
      return;
    } catch (e) {
      console.error("Login failed:", e);
      setErr("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  // ===== GOOGLE LOGIN =====
  const google = async () => {
    setErr("");
    setOk("");
    setLoading(true);

    try {
      const userCred = await signInWithPopup(auth, googleProvider);
      const user = userCred.user;

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          name: user.displayName || "New User",
          email: user.email,
          roles: ["user"], // default
          createdAt: Date.now(),
        });
      }

      await handleRedirectByRole(user);
    } catch (e) {
      console.error("Google login failed:", e);
      setErr("Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  // ===== FORGOT PASSWORD =====
  const forgot = async () => {
    setErr("");
    setOk("");
    if (!form.email) return setErr("Enter your email first.");
    try {
      await sendPasswordResetEmail(auth, form.email);
      setOk("Reset link sent. Check your inbox.");
    } catch (e) {
      console.error(e);
      setErr("Couldn't send reset email.");
    }
  };

  // ===== RENDER (unchanged design) =====
  return (
    <div className={styles.authShell}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>Welcome back</h1>
        <p className={styles.subtitle}>Please enter your details to sign in</p>

        {ok && <div className={styles.ok}>{ok}</div>}
        {err && <div className={styles.err}>{err}</div>}

        <form className={styles.authForm} onSubmit={onSubmit}>
          <div className={styles.rowBetween}>
            <button type="button" className={styles.googleBtn} onClick={google}>
              <img
                src="/google-icon.png"
                alt="Google"
                className={styles.googleIcon}
              />
              Continue with Google
            </button>
          </div>

          <div className={styles.divider}>or</div>

          <label className={styles.label}>
            Your Email Address
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
              Remember me
            </label>
            <button type="button" className={styles.link} onClick={forgot}>
              Forgot password?
            </button>
          </div>

          <button className={styles.primaryBtn} disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <p className={styles.meta}>
            Don’t have an account?{" "}
            <Link to="/signup" className={styles.link}>
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
