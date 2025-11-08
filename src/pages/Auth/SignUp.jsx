import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./auth.module.css";
import { auth, googleProvider, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signInWithPopup,
  reload,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

const APP_URL = import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;

export default function SignUp() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const actionCodeSettings = {
    url: `${APP_URL}/signin`,
    handleCodeInApp: true,
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      if (form.name.trim()) {
        await updateProfile(cred.user, { displayName: form.name.trim() });
      }

      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        email: form.email,
        name: form.name.trim(),
        roles: ["user"], // ✅ unified format
        createdAt: Date.now(),
      });

      await reload(cred.user);
      await sendEmailVerification(cred.user, actionCodeSettings);
      setOk("Verification email sent.");
      nav("/verify-email");
    } catch (e) {
      setErr(e?.message || "Sign up failed.");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setErr("");
    setOk("");
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const { user } = res;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          name: user.displayName || "",
          roles: ["user"], // ✅ fixed field name
          createdAt: Date.now(),
        });
      }

      if (!user.emailVerified) {
        await reload(user);
        await sendEmailVerification(user, actionCodeSettings);
        nav("/verify-email");
      } else {
        nav("/home");
      }
    } catch (e) {
      setErr(e?.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authShell}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>Create Account</h1>
        <p className={styles.subtitle}>It’s quick and free</p>

        {ok && <div className={styles.ok}>{ok}</div>}
        {err && <div className={styles.err}>{err}</div>}

        <form className={styles.authForm} onSubmit={onSubmit}>
          <label className={styles.label}>
            Full Name
            <input
              className={styles.input}
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={onChange}
              required
            />
          </label>

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

          <button className={styles.primaryBtn} disabled={loading}>
            {loading ? "Creating…" : "Create Account"}
          </button>

          <div className={styles.divider}>or</div>

          <button type="button" onClick={google} className={styles.googleBtn}>
            <img
              src="/google-icon.png"
              alt="Google"
              className={styles.googleIcon}
            />
            <span>Continue with Google</span>
          </button>

          <p className={styles.meta}>
            Already have an account?{" "}
            <Link to="/signin" className={styles.link}>
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
