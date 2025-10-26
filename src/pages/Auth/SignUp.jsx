import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./auth.module.css";
import { auth, googleProvider } from "../../firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  reload,
} from "firebase/auth";

const APP_URL = import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;

export default function SignUp() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const actionCodeSettings = {
    url: `${APP_URL}/signin`,
    handleCodeInApp: true,
  };

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      // If email already exists, suggest signin
      const methods = await fetchSignInMethodsForEmail(auth, form.email);
      if (methods.length) {
        setErr("This email is already registered. Please sign in instead.");
        setLoading(false);
        return;
      }

      const cred = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      if (form.name.trim()) {
        await updateProfile(cred.user, { displayName: form.name.trim() });
      }

      await reload(cred.user); // fresh token before sending OOB
      await sendEmailVerification(cred.user, actionCodeSettings);

      nav(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (e) {
      setErr(readableAuthError(e));
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    setErr("");
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      await reload(res.user);
      if (!res.user.emailVerified) {
        await sendEmailVerification(res.user, actionCodeSettings);
        nav(`/verify-email?email=${encodeURIComponent(res.user.email || "")}`);
      } else {
        nav("/admin");
      }
    } catch (e) {
      setErr(readableAuthError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <section className={styles.card}>
        {/* right visual */}
        <aside className={styles.right}>
          <div className={styles.hero}>
            <h2>Welcome to NearNest</h2>
            <p>Fast onboarding for partners. Verify once, manage forever.</p>
          </div>
        </aside>

        {/* form */}
        <div className={styles.left}>
          <h1>Create your account</h1>
          <div className={styles.sub}>Use your work email.</div>

          {err && <div className={styles.err}>{err}</div>}

          <form onSubmit={onSubmit}>
            <label>
              Full name
              <input
                name="name"
                autoComplete="name"
                value={form.name}
                onChange={onChange}
                required
              />
            </label>
            <label>
              Email
              <input
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={onChange}
                required
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={onChange}
                required
              />
            </label>

            <div className={styles.row}>
              <button disabled={loading} className={styles.primary}>
                {loading ? "Creating…" : "Create account"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={google}
                className={`${styles.ghost} ${styles.google}`}
                aria-label="Continue with Google"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M21.35 11.1h-9.2v2.92h5.33c-.23 1.46-1.6 4.27-5.33 4.27-3.21 0-5.83-2.66-5.83-5.94s2.62-5.94 5.83-5.94c1.83 0 3.07.78 3.77 1.45l2.57-2.5C17.52 3.79 15.63 3 13.48 3 8.7 3 4.86 6.86 4.86 11.65S8.7 20.3 13.48 20.3c6.41 0 7.96-5.43 7.96-8.2 0-.7-.09-1.13-.09-1.13z" fill="currentColor"/>
                </svg>
                Continue with Google
              </button>
            </div>
          </form>

          <div className={styles.note}>
            Already have an account?{" "}
            <Link to="/signin" className={styles.link}>
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function readableAuthError(e) {
  const code = e?.code || "";
  switch (code) {
    case "auth/weak-password": return "Password is too weak.";
    case "auth/email-already-in-use": return "This email is already registered. Please sign in.";
    case "auth/invalid-email": return "Enter a valid email address.";
    case "auth/too-many-requests": return "Too many attempts. Please wait a minute and try again.";
    default: return e?.message || "Something went wrong.";
  }
}
