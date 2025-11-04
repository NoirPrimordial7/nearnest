// src/pages/Auth/ResetPassword.jsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "../../firebase";
import styles from "./auth.module.css";

export default function ResetPassword() {
  const location = useLocation();
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [oobCode, setOobCode] = useState("");
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("oobCode");
    if (code) {
      setOobCode(code);
    } else {
      setErr("Invalid or missing reset code.");
    }
  }, [location]);

  const handleReset = async (e) => {
    e.preventDefault();
    setOk("");
    setErr("");

    if (!oobCode) return setErr("Missing reset code.");
    if (!password) return setErr("Password cannot be empty.");

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setOk("Password updated. Redirecting to sign in…");
      setTimeout(() => nav("/signin"), 3000);
    } catch (e) {
      console.error(e);
      setErr("Failed to reset password. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authShell}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>Reset Password</h1>
        <p className={styles.subtitle}>Set your new password below</p>

        {ok && <div className={styles.ok}>{ok}</div>}
        {err && <div className={styles.err}>{err}</div>}

        <form className={styles.authForm} onSubmit={handleReset}>
          <label className={styles.label}>
            New Password
            <div className={styles.pwdWrap}>
              <input
                className={styles.input}
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.pwdToggle}
                onClick={() => setShowPwd((s) => !s)}
              >
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <button className={styles.primaryBtn} disabled={loading}>
            {loading ? "Saving…" : "Save Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
