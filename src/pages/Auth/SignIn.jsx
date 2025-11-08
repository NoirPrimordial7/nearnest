// src/pages/Auth/SignIn.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./auth.module.css";

import { auth, db, signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail, googleProvider,doc, getDoc, setDoc } 
  from "./firebase";

/* ---------------------- role helpers ---------------------- */
async function fetchRoles(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    const data = snap.exists() ? snap.data() || {} : {};
    return {
      role: data.role || "user",
      roles: Array.isArray(data.roles) && data.roles.length ? data.roles : ["user"],
    };
  } catch (e) {
    console.error("fetchRoles error:", e);
    return { role: "user", roles: ["user"] };
  }
}

async function redirectByRole(navigate, uid) {
  const { role, roles } = await fetchRoles(uid);

  if (role === "admin" || roles.includes("admin")) {
    return navigate("/admin", { replace: true });
  }
  if (roles.includes("storeAdmin") || roles.some((r) => r.endsWith(":Owner"))) {
    return navigate("/store-admin/home", { replace: true });
  }
  if (roles.some((r) => r.includes(":"))) {
    return navigate("/store-staff/home", { replace: true });
  }
  return navigate("/home", { replace: true });
}

/* ---------------------- component ---------------------- */
export default function SignIn() {
  const navigate = useNavigate();
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

  /* ---------------- email/password login ---------------- */
  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        form.email.trim(),
        form.password
      );
      const user = cred.user;

      // Ensure user doc exists (first login or migrated users)
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          name: user.displayName || "New User",
          email: user.email,
          role: "user",
          roles: ["user"],
          createdAt: Date.now(),
        });
      }

      // Make sure email verification state is fresh
      await user.reload();
      if (!user.emailVerified) {
        setOk("Email not verified. Redirecting…");
        setTimeout(() => navigate("/verify-email", { replace: true }), 900);
        return;
      }

      // remember email if requested
      if (form.remember) localStorage.setItem("rememberEmail", form.email);
      else localStorage.removeItem("rememberEmail");

      await redirectByRole(navigate, user.uid);
    } catch (e) {
      console.error("Login failed:", e);
      const code = e?.code || "";
      if (
        code === "auth/invalid-credential" ||
        code === "auth/wrong-password" ||
        code === "auth/user-not-found"
      ) {
        setErr("Invalid email or password.");
      } else if (code === "auth/too-many-requests") {
        setErr("Too many attempts. Try again later.");
      } else {
        setErr("Couldn’t sign you in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------- Google login ----------------------- */
  const google = async () => {
    setErr("");
    setOk("");
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const user = cred.user;

      // Ensure user doc exists
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          name: user.displayName || "New User",
          email: user.email,
          role: "user",
          roles: ["user"],
          createdAt: Date.now(),
        });
      }

      await redirectByRole(navigate, user.uid);
    } catch (e) {
      console.error("Google sign-in failed:", e);
      setErr("Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  /* --------------------- Forgot password --------------------- */
  const forgot = async () => {
    setErr("");
    setOk("");
    if (!form.email) return setErr("Enter your email first.");
    try {
      await sendPasswordResetEmail(auth, form.email.trim());
      setOk("Reset link sent. Check your inbox.");
    } catch (e) {
      console.error(e);
      setErr("Couldn't send reset email.");
    }
  };

  /* -------------------------- UI -------------------------- */
  return (
    <div className={styles.authShell}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>Welcome back</h1>
        <p className={styles.subtitle}>Please enter your details to sign in</p>

        {ok && <div className={styles.ok}>{ok}</div>}
        {err && <div className={styles.err}>{err}</div>}

        <form className={styles.authForm} onSubmit={onSubmit}>
          <div className={styles.rowBetween}>
            <button
              type="button"
              className={styles.googleBtn}
              onClick={google}
              disabled={loading}
            >
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
