import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./auth.module.css";
import {
  auth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "../../lib/firebase.js";

export default function SignIn() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");
  const [showPhone, setShowPhone] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const recaptcha = useRef(null);

  useEffect(() => {
    if (!showPhone) return;
    if (!recaptcha.current) {
      recaptcha.current = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    }
  }, [showPhone]);

  const signInEmail = async (e) => {
    e.preventDefault();
    setMsg("");
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      nav("/admin");
    } catch (e) {
      setMsg(e.message || "Sign in failed");
    }
  };

  const requestOtp = async () => {
    setMsg("");
    try {
      const confirm = await signInWithPhoneNumber(auth, phone, recaptcha.current);
      window._confirmPhone = confirm;
      setMsg("OTP sent to phone.");
    } catch (e) {
      setMsg(e.message || "Failed to send OTP");
    }
  };

  const confirmOtp = async () => {
    try {
      await window._confirmPhone.confirm(otp);
      nav("/admin");
    } catch (e) {
      setMsg(e.message || "Invalid code");
    }
  };

  const forgot = async () => {
    if (!email) return setMsg("Enter email first");
    try {
      await sendPasswordResetEmail(auth, email);
      setMsg("Password reset email sent.");
    } catch (e) {
      setMsg(e.message || "Failed to send reset");
    }
  };

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <section className={styles.left}>
          <div className={styles.brand}>nearnest</div>
          <h2>Welcome back</h2>

          {!showPhone ? (
            <form onSubmit={signInEmail} className={styles.grid}>
              <input className={styles.input} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input className={styles.input} placeholder="Password" type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
              {msg && <div className={styles.err}>{msg}</div>}
              <button className={styles.btn}>Sign in</button>
              <div className={styles.row}>
                <button type="button" className={styles.ghost} onClick={forgot}>Forgot password</button>
                <button type="button" className={styles.ghost} onClick={() => setShowPhone(true)}>Use phone</button>
              </div>
              <div className={styles.note}>
                New here? <Link className={styles.link} to="/signup">Create account</Link>
              </div>
            </form>
          ) : (
            <div className={styles.grid}>
              <div id="recaptcha-container" />
              <input className={styles.input} placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <div className={styles.row}>
                <button className={styles.btn} onClick={requestOtp}>Send OTP</button>
                <button className={styles.ghost} onClick={() => setShowPhone(false)}>Use email</button>
              </div>
              <input className={styles.input} placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
              <button className={styles.btn} onClick={confirmOtp}>Verify</button>
              {msg && <div className={styles.err}>{msg}</div>}
            </div>
          )}
        </section>

        <aside className={styles.right}>
          <div>
            <h3>Secure portal</h3>
            <p className={styles.hint}>2 login methods. Email is recommended for admins and staff.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
