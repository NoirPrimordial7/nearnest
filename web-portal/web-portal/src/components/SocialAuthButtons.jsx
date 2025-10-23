// src/components/SocialAuthButtons.jsx
import React from "react";
import styles from "../pages/Auth/auth.module.css";

const GoogleIcon = () => (
  <svg className={styles.glogo} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.8 32.5 29.4 36 24 36 16.8 36 11 30.2 11 23S16.8 10 24 10c4.1 0 7.8 1.7 10.4 4.5l5.7-5.7C36.7 4.1 30.7 2 24 2 11.9 2 2 11.9 2 24s9.9 22 22 22c11 0 21-8 21-22 0-1.2-.1-2.3-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c4.1 0 7.8 1.7 10.4 4.5l5.7-5.7C36.7 4.1 30.7 2 24 2 15.3 2 7.7 6.5 3.4 13.1l2.9 1.6z"/>
    <path fill="#4CAF50" d="M24 46c6.3 0 12-2.2 16.4-5.9l-7.6-6.2C30.9 36.8 27.6 38 24 38c-5.4 0-9.8-3.6-11.4-8.5l-6.7 5.2C9.8 41.5 16.4 46 24 46z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.8-4.7 6.5-8.3 6.5-5.4 0-9.8-3.6-11.4-8.5l-6.7 5.2C9.8 41.5 16.4 46 24 46c11 0 21-8 21-22 0-1.2-.1-2.3-.4-3.5z"/>
  </svg>
);

export default function SocialAuthButtons({ onGoogle }) {
  return (
    <div className={styles.oauth}>
      <button className={styles.gbtn} onClick={onGoogle}>
        <GoogleIcon /> Continue with Google
      </button>
    </div>
  );
}
