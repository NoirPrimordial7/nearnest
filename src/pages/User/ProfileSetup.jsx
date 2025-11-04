// src/pages/User/ProfileSetup.jsx
import React, { useEffect, useState } from "react";
import styles from "./home.module.css";
import { useAuth } from "../../context/AuthContext";
// src/pages/User/ProfileSetup.jsx
import { upsertProfile } from "../../services/userProfile";

import { useNavigate } from "react-router-dom";

export default function ProfileSetup() {
  const { currentUser } = useAuth();
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      const p = await getUserProfile(currentUser.uid);
      if (p?.fullName && p?.userId) {
        nav("/home", { replace: true });
      } else {
        setLoading(false);
      }
    })();
  }, [currentUser, nav]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!currentUser) return;
    setSaving(true);
    await upsertUserProfile(currentUser.uid, {
      fullName: fullName.trim(),
      phone: phone.trim(),
      age: age ? Number(age) : null,
      email: currentUser.email || "",
    });
    setSaving(false);
    nav("/home", { replace: true });
  }

  if (loading) return <div className={styles.shell}><div className={styles.authCard}>Loading…</div></div>;

  return (
    <div className={styles.shell}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>Complete your profile</h1>
        <p className={styles.subtitle}>This helps with roles, hiring and store access. A unique User ID will be issued.</p>
        <form className={styles.authForm} onSubmit={onSubmit}>
          <label className={styles.label}>Full name
            <input className={styles.input} value={fullName} onChange={e=>setFullName(e.target.value)} required />
          </label>
          <label className={styles.label}>Phone
            <input className={styles.input} value={phone} onChange={e=>setPhone(e.target.value)} />
          </label>
          <label className={styles.label}>Age
            <input className={styles.input} type="number" min="0" value={age} onChange={e=>setAge(e.target.value)} />
          </label>
          <button className={styles.primaryBtn} disabled={saving}>
            {saving ? "Saving…" : "Save & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
