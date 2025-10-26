// src/pages/Auth/SignUp.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./auth.module.css";
import { auth, googleProvider } from "../../firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signInWithPopup,
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
    url: `${APP_URL}/signin`,   // user is returned here after clicking the email link
    handleCodeInApp: true,      // ok for SPA
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
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

      // Ensure the user's token is fresh before sending OOB email
      await reload(cred.user);

      await sendEmailVerification(cred.user, actionCodeSettings);

      nav(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (e) {
      setErr(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (!res.user.emailVerified) {
        await reload(res.user);
        await sendEmailVerification(res.user, actionCodeSettings);
        nav(`/verify-email?email=${encodeURIComponent(res.user.email || "")}`);
      } else {
        nav("/admin");
      }
    } catch (e) {
      setErr(e.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.centerWrap}>
      <form className={styles.card} onSubmit={onSubmit}>
        <h1>Create your account</h1>
        {err && <div className={styles.err}>{err}</div>}
        <label>
          Full name
          <input name="name" value={form.name} onChange={onChange} />
        </label>
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={onChange} />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
          />
        </label>
        <button disabled={loading} className={styles.primaryBtn}>
          {loading ? "Creating…" : "Create account"}
        </button>
        <button type="button" onClick={google} className={styles.ghostBtn}>
          Continue with Google
        </button>
        <p className={styles.meta}>
          Already have an account? <Link to="/signin">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
