// src/pages/User/ProfileSetup.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getUserProfile, saveUserProfile } from "../../services/userProfile";
import styles from "./home.module.css";

export default function ProfileSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = React.useState({
    fullName: "",
    age: "",
    phone: "",
    gender: "",
    photoURL: "",
  });
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (user) {
          const data = await getUserProfile(user.uid);
          if (alive && data) setForm((f) => ({ ...f, ...data }));
        }
      } catch (_) {
        // ignore for dev; show empty form
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  if (!user) return <div className={styles.centerNote}>Please sign in again.</div>;
  if (loading) return <div className={styles.centerNote}>Loading…</div>;

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await saveUserProfile(user.uid, { ...form, email: user.email });
      navigate("/home", { replace: true });
    } catch (e2) {
      setErr(e2?.message || "Failed to save profile");
    }
  };

  return (
    <div className={styles.shell}>
      <div className={styles.cardWide}>
        <h2 className={styles.title}>Set up your profile</h2>
        <p className={styles.subtitle}>Tell us a bit about you. You can edit this later.</p>
        {err && <div className={styles.err}>{err}</div>}

        <form className={styles.form} onSubmit={onSubmit}>
          <label className={styles.label}>
            Full name
            <input className={styles.input} name="fullName" value={form.fullName} onChange={update} />
          </label>

          <div className={styles.twoCol}>
            <label className={styles.label}>
              Age
              <input className={styles.input} name="age" value={form.age} onChange={update} />
            </label>
            <label className={styles.label}>
              Phone
              <input className={styles.input} name="phone" value={form.phone} onChange={update} />
            </label>
          </div>

          <label className={styles.label}>
            Gender
            <input className={styles.input} name="gender" value={form.gender} onChange={update} />
          </label>

          <button className={styles.primaryBtn} type="submit">Save & continue</button>
        </form>
      </div>
    </div>
  );
}
