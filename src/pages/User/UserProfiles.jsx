// src/pages/User/ProfileSetup.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./profile.module.css";

import { useAuth } from "../Auth/AuthContext";
import { onProfile, saveProfile } from "../user/userProfile";
import { auth } from "../Auth/firebase";
import { updateProfile } from "firebase/auth";

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    fullName: "",
    age: "",
    phone: "",
    gender: "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Prefill from Firestore
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onProfile(
      user.uid,
      (data) => {
        if (!data?.profile) return;
        setForm({
          fullName: data.profile.fullName || "",
          age: data.profile.age ?? "",
          phone: data.profile.phone || "",
          gender: data.profile.gender || "",
        });
        if (data.profile.avatarUrl) {
          setAvatarPreview(data.profile.avatarUrl);
        }
      },
      (err) => {
        console.error("Profile prefill failed:", err);
        setError("Could not fetch your profile.");
      }
    );
    return unsub;
  }, [user?.uid]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onPickAvatar = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
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

      // Save to Firestore and upload avatar if provided
      const { photoURL } = await saveProfile(user.uid, form, avatarFile);

      // Update Firebase Auth profile so the top-right avatar updates instantly
      const updates = { displayName: form.fullName };
      if (photoURL) updates.photoURL = photoURL;

      try {
        await updateProfile(auth.currentUser, updates);
        // Force local user object to refresh
        await auth.currentUser.reload();
      } catch (e) {
        // Not fatal for the flow; avatar in header may refresh after next token refresh
        console.warn("Auth profile update warning:", e);
      }

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
          {/* Avatar row */}
          <div className={styles.avatarRow}>
            <div className={styles.avatar}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" className={styles.avatarImg} />
              ) : (
                <div className={styles.avatarFallback}>👤</div>
              )}
            </div>
            <div className={styles.avatarActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => fileRef.current?.click()}
              >
                {avatarPreview ? "Change photo" : "Upload photo"}
              </button>
              <div className={styles.hint}>JPG/PNG, up to ~2MB is ideal.</div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className={styles.hidden}
                onChange={onPickAvatar}
              />
            </div>
          </div>

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
              {submitting ? "Saving..." : "Save & continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
