import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase";
import SocialAuthButtons from "../../components/SocialAuthButtons";
import styles from "./auth.module.css";

export default function SignIn() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      setBusy(true);
      await signInWithEmailAndPassword(auth, form.email, form.password);
      if (auth.currentUser?.emailVerified) nav("/admin");
      else nav("/verify-email");
    } catch (err) {
      setMsg(err.message.replace("Firebase: ", ""));
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!form.email) return setMsg("Enter your email to receive a reset link.");
    try {
      setBusy(true);
      await sendPasswordResetEmail(auth, form.email);
      setMsg("Password reset email sent.");
    } catch (err) {
      setMsg(err.message.replace("Firebase: ", ""));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <h1 className={styles.brand}>nearnest</h1>
        <h2 className={styles.title}>Welcome back</h2>

        <form onSubmit={onSubmit} className={styles.form}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@company.com"
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </label>

          {msg && <div className={styles.note}>{msg}</div>}

          <button className={styles.primary} disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <button className={styles.linkBtn} onClick={reset} disabled={busy}>
          Forgot password?
        </button>

        <div className={styles.divider}><span>or</span></div>

        <SocialAuthButtons onBusy={setBusy} />

        <p className={styles.meta}>
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
