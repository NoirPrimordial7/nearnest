import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "./auth.module.css";
import {
  auth,
  createUserWithEmailAndPassword,
  setDoc,
  doc,
  db,
  serverTimestamp,
} from "../../lib/firebase.js";

export default function SignUp() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      // ensure profile exists (trigger also creates + sends code)
      await setDoc(
        doc(db, "users", cred.user.uid),
        { email, createdAt: serverTimestamp() },
        { merge: true }
      );
      nav("/verify-email");
    } catch (err) {
      setMsg(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <section className={styles.left}>
          <div className={styles.brand}>nearnest</div>
          <h2>Create your account</h2>
          <form onSubmit={submit} className={styles.grid}>
            <input
              className={styles.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <input
              className={styles.input}
              type="password"
              placeholder="Password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              minLength={6}
              required
            />
            {msg && <div className={styles.err}>{msg}</div>}
            <button className={styles.btn} disabled={loading}>
              {loading ? "Creating…" : "Sign up"}
            </button>
            <div className={styles.note}>
              Already have an account? <Link className={styles.link} to="/signin">Sign in</Link>
            </div>
          </form>
        </section>

        <aside className={styles.right}>
          <div>
            <h3>Welcome!</h3>
            <p className={styles.hint}>You’ll verify your email and then choose a username.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
