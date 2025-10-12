import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "./Auth.module.css";
import SocialAuthButtons from "../../components/SocialAuthButtons";
import { auth } from "../../lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
} from "firebase/auth";


export default function SignIn() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // phone bits
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const confResultRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) nav("/admin", { replace: true });
    });
    return unsub;
  }, [nav]);

  const doEmail = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      nav("/admin", { replace: true });
    } catch (e) {
      setErr(e.message || "Unable to sign in");
    } finally { setLoading(false); }
  };

  const doGoogle = async () => {
    setErr(""); setLoading(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      nav("/admin", { replace: true });
    } catch (e) {
      setErr(e.message || "Google sign-in failed");
    } finally { setLoading(false); }
  };

  const doReset = async () => {
    if (!email) return setErr("Enter your email to reset.");
    setErr("");
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent.");
    } catch (e) {
      setErr(e.message || "Could not send reset email");
    }
  };

  // Phone flow
  const sendOTP = async () => {
    setErr("");
    try {
      // invisible reCAPTCHA
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
        });
      }
      const confirmation = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      confResultRef.current = confirmation;
      setOtpSent(true);
    } catch (e) {
      setErr(e.message || "Failed sending OTP");
    }
  };

  const verifyOTP = async () => {
    try {
      await confResultRef.current.confirm(otp);
      nav("/admin", { replace: true });
    } catch (e) {
      setErr(e.message || "Invalid OTP");
    }
  };

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <aside className={styles.brandSide}>
          <div className={styles.brand}>nearnest</div>
          <div className={styles.hero}>Welcome back 👋</div>
          <p className={styles.sub}>Sign in to manage stores, verifications and support tickets.</p>
          <div style={{marginTop:16}}>
            <span className={styles.badge}>Admin Console</span>
          </div>
        </aside>

        <section className={styles.formSide}>
          <div className={styles.h}>Sign in</div>
          <div className={styles.note}>Use your work email. You can also use Google or Phone.</div>

          {err && <div className={styles.err}>{err}</div>}

          <form className="stack" onSubmit={doEmail}>
            <div className={styles.group}>
              <label>Email</label>
              <input className={styles.input} type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
            </div>
            <div className={styles.group}>
              <label>Password</label>
              <input className={styles.input} type="password" value={pass} onChange={(e)=>setPass(e.target.value)} />
            </div>
            <div className={styles.actions}>
              <button className={styles.primary} disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
              <button type="button" className={styles.ghost} onClick={doReset}>Forgot password?</button>
            </div>
          </form>

          <div className={styles.hr} />

          <SocialAuthButtons onGoogle={doGoogle} />

          <div className={styles.hr} />

          {/* Phone login */}
          <div className={styles.group}>
            <label>Phone (with country code, e.g. +91…)</label>
            <div className={styles.row}>
              <input className={styles.input} placeholder="+91…" value={phone} onChange={(e)=>setPhone(e.target.value)} />
              {!otpSent ? (
                <button className={styles.ghost} onClick={sendOTP}>Send OTP</button>
              ) : (
                <>
                  <input className={styles.input} placeholder="Enter OTP" value={otp} onChange={(e)=>setOtp(e.target.value)} />
                  <button className={styles.primary} onClick={verifyOTP}>Verify</button>
                </>
              )}
            </div>
            <div id="recaptcha-container" />
          </div>

          <div className={styles.note}>
            New here? <Link className={styles.link} to="/signup">Create account</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
