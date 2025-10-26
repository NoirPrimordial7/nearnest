import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import styles from "../pages/Auth/auth.module.css";

export default function SocialAuthButtons({ onBusy }) {
  const google = async () => {
    try {
      onBusy?.(true);
      await signInWithPopup(auth, googleProvider);
    } finally {
      onBusy?.(false);
    }
  };

  return (
    <div className={styles.socialWrap}>
      <button type="button" className={styles.socialBtn} onClick={google}>
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.627 31.91 29.223 35 24 35 16.82 35 11 29.18 11 22S16.82 9 24 9c3.293 0 6.291 1.244 8.577 3.283l5.657-5.657C34.892 3.166 29.69 1 24 1 10.745 1 0 11.745 0 25s10.745 24 24 24c12.427 0 23-9.045 23-24 0-1.611-.17-3.167-.389-4.917z"/>
          <path fill="#FF3D00" d="M6.306 14.691L12.89 19.52C14.591 15.274 18.949 12 24 12c3.294 0 6.291 1.244 8.577 3.283l5.657-5.657C34.892 3.166 29.69 1 24 1 16.318 1 9.632 5.11 6.306 11.309z"/>
          <path fill="#4CAF50" d="M24 49c5.09 0 9.73-1.948 13.241-5.134l-6.1-4.998C29.23 40.931 26.76 42 24 42c-5.199 0-9.594-3.32-11.182-7.946l-6.46 5.002C9.63 44.93 16.25 49 24 49z"/>
          <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.652 4.731-6.109 8-11.303 8-5.199 0-9.594-3.32-11.182-7.946l-6.46 5.002C9.63 44.93 16.25 49 24 49c12.427 0 23-9.045 23-24 0-1.611-.17-3.167-.389-4.917z"/>
        </svg>
        Continue with Google
      </button>
    </div>
  );
}
