// src/pages/User/ProfileSetup.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./profile.module.css";
import { useAuth } from "../../context/AuthContext";
import { saveProfile } from "../../services/userProfile";

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { user } = useAuth(); // expects { user } from your context
  const [form, setForm] = useState({
    fullName: "",
    age: "",
    phone: "",
    gender: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.fullName || !form.age) {
      setError("Full name and age are required.");
      return;
    }
    if (!user?.uid) {
      setError("You must be signed in.");
      return;
    }
    try {
      setSubmitting(true);
      await saveProfile(user.uid, {
        fullName: form.fullName.trim(),
        age: Number(form.age),
        phone: form.phone.trim(),
        gender: form.gender,
      });
      navigate("/home");
    } catch (err) {
      console.error(err);
      setError("Could not save your profile. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>Set up your profile</h1>
          <p className={styles.subtitle}>
            Tell us a bit about you. You can edit this later.
          </p>
        </header>

        {error ? <div className={styles.err}>{error}</div> : null}

        <form className={styles.form} onSubmit={onSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="fullName">
              Full name <span className={styles.req}>*</span>
            </label>
            <input
              id="fullName"
              name="fullName"
              className={styles.input}
              placeholder="e.g., Aditya Gholap"
              value={form.fullName}
              onChange={onChange}
              autoComplete="name"
            />
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="age">
                Age <span className={styles.req}>*</span>
              </label>
              <input
                id="age"
                name="age"
                type="number"
                className={styles.input}
                placeholder="e.g., 22"
                value={form.age}
                onChange={onChange}
                min={1}
                max={120}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="phone">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                className={styles.input}
                placeholder="+91 98xxxxxx"
                value={form.phone}
                onChange={onChange}
                autoComplete="tel"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="gender">
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              className={styles.select}
              value={form.gender}
              onChange={onChange}
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="prefer_not">Prefer not to say</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={submitting}
              aria-busy={submitting ? "true" : "false"}
            >
              {submitting ? "Saving…" : "Save & continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
