import React, { useState } from "react";
import styles from "./auth.module.css";
import { auth, db, doc, setDoc, updateProfile } from "../../lib/firebase.js";
import { useNavigate } from "react-router-dom";

export default function CompleteProfile() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [msg, setMsg] = useState("");

  if (!auth.currentUser) return null;

  const save = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await updateProfile(auth.currentUser, { displayName: username });
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        { displayName: username, status: "active" },
        { merge: true }
      );
      // redirect by role later (simple default goes to /admin if admin claim exists)
      await auth.currentUser.getIdToken(true);
      const token = await auth.currentUser.getIdTokenResult();
      const claims = token.claims || {};
      if (claims.admin || claims.support || claims.superadmin) nav("/admin");
      else nav("/admin"); // in your app all roads lead to Admin portal for now
    } catch (e) {
      setMsg(e.message || "Failed to save profile");
    }
  };

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <section className={styles.left}>
          <h2>Choose a username</h2>
          <form onSubmit={save} className={styles.grid}>
            <input
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. rahul_sharma"
              required
            />
            {msg && <div className={styles.err}>{msg}</div>}
            <button className={styles.btn}>Continue</button>
          </form>
        </section>
        <aside className={styles.right}/>
      </div>
    </div>
  );
}
