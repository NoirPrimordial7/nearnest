// src/components/SocialAuthButtons.jsx
import React from "react";
import { FcGoogle } from "react-icons/fc";
import styles from "../pages/Auth/auth.module.css";

export default function SocialAuthButtons({ onGoogle, loading }) {
  return (
    <div className={styles.socialRow}>
      <button
        type="button"
        className={styles.socialBtn}
        onClick={onGoogle}
        disabled={loading}
        title="Continue with Google"
      >
        <FcGoogle size={20} />
        <span>Continue with Google</span>
      </button>
    </div>
  );
}
