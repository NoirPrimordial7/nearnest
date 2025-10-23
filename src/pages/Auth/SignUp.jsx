// src/pages/Auth/SignUp.jsx
import React, { useState } from "react";
import { auth, db } from "../../firebase/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import authStyles from "./auth.module.css";
import styles from "./SignIn.module.css";



export default function SignUp() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: (response) => {}
      });
    }
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setEmailError("");
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCred.user);
      await setDoc(doc(db, "users", userCred.user.uid), {
        email,
        username: "",
        phone: "",
        emailVerified: false,
        role: "user",
        permissions: {},
        createdAt: Date.now()
      });
      alert(`Verification email sent to ${email}.`);
      navigate("/verify-email");
    } catch (err) {
      setEmailError(err.message);
    }
  };

  const sendOtpCode = async (e) => {
    e.preventDefault();
    setPhoneError("");
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);
      setOtpSent(true);
      window.confirmationResult = confirmationResult;
    } catch (err) {
      setPhoneError(err.message);
    }
  };

  const verifyOtpCode = async (e) => {
    e.preventDefault();
    setPhoneError("");
    try {
      const confirmationResult = window.confirmationResult;
      const cred = await confirmationResult.confirm(otp);
      const user = cred.user;
      const userDocRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        await setDoc(userDocRef, {
          phone: user.phoneNumber,
          email: user.email || "",
          username: "",
          emailVerified: user.email ? user.emailVerified : false,
          role: "user",
          permissions: {},
          createdAt: Date.now()
        });
      }

      navigate("/profile-setup");
    } catch (err) {
      setPhoneError("Invalid OTP. Try again.");
    }
  };

  return (
    <div className={styles.authShell}>
      <div className={styles.card}>
        <h2 className={styles.title}>Sign Up</h2>

        <form onSubmit={handleEmailSignUp} className={styles.form}>
          <input className={styles.input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className={styles.input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button className={styles.primary} type="submit">Sign Up with Email</button>
          {emailError && <p className={styles.error}>{emailError}</p>}
        </form>

        <form onSubmit={otpSent ? verifyOtpCode : sendOtpCode} className={styles.form}>
          {!otpSent ? (
            <>
              <input className={styles.input} type="tel" placeholder="Phone (e.g. +919012345678)" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              <div id="recaptcha-container"></div>
              <button className={styles.primary} type="submit">Send OTP</button>
            </>
          ) : (
            <>
              <input className={styles.input} type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required />
              <button className={styles.primary} type="submit">Verify OTP</button>
            </>
          )}
          {phoneError && <p className={styles.error}>{phoneError}</p>}
        </form>
      </div>
    </div>
  );
}
