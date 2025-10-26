import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { auth } from "../../firebase";
import SocialAuthButtons from "../../components/SocialAuthButtons";
import styles from "./auth.module.css";

export default function SignUp() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (form.password !== form.confirm) {
      setMsg("Passwords do not match.");
      return;
    }
    try {
      setBusy(true);
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      if (form.name) await updateProfile(cred.user, { displayName: form.name });
      await sendEmailVerification(cred.user);
      nav("/verify-email");
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
        <h2 className={styles.title}>Create your account</h2>

        <form onSubmit={onSubmit} className={styles.form}>
          <label>
            <span>Full name</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Dinesh Kumar"
            />
          </label>

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
              minLength={6}
            />
          </label>

          <label>
            <span>Confirm password</span>
            <input
              type="password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </label>

          {msg && <div className={styles.note}>{msg}</div>}

          <button className={styles.primary} disabled={busy}>
            {busy ? "Creating…" : "Create account"}
          </button>
        </form>

        <div className={styles.divider}><span>or</span></div>
        <SocialAuthButtons onBusy={setBusy} />

        <p className={styles.meta}>
          Already have an account? <Link to="/signin">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
