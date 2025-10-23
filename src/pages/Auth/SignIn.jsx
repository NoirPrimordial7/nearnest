// src/pages/Auth/Login.jsx
import React, { useState } from "react";
import { auth } from "../../firebase/firebaseConfig";
import { signInWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import authStyles from "./auth.module.css";
import styles from "./SignIn.module.css"; // keep the main one as styles


const Login = () => {
  const navigate = useNavigate();

  // Email login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");

  // Phone login state
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container-login", {
        size: "invisible",
        callback: () => {}
      });
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setEmailError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/"); // redirect to homepage or dashboard
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
      await confirmationResult.confirm(otp);
      navigate("/");
    } catch (err) {
      setPhoneError("Failed to verify code. Please try again.");
    }
  };

  return (
    <div className={styles.authContainer}>
      <h2>Login</h2>

      {/* Email Login Form */}
      <form onSubmit={handleEmailLogin} className={styles.authForm}>
        <h3>Email Login</h3>
        <input type="email" placeholder="Email" value={email} required onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} required onChange={e => setPassword(e.target.value)} />
        <button type="submit">Login</button>
        {emailError && <p className={styles.error}>{emailError}</p>}
      </form>

      {/* Phone Login Form */}
      <form onSubmit={otpSent ? verifyOtpCode : sendOtpCode} className={styles.authForm}>
        <h3>Phone Login</h3>
        {!otpSent ? (
          <>
            <input type="tel" placeholder="Phone number e.g. +919123456789" value={phone} required onChange={e => setPhone(e.target.value)} />
            <div id="recaptcha-container-login"></div>
            <button type="submit">Send OTP</button>
          </>
        ) : (
          <>
            <input type="text" placeholder="Enter OTP" value={otp} required onChange={e => setOtp(e.target.value)} />
            <button type="submit">Verify & Login</button>
          </>
        )}
        {phoneError && <p className={styles.error}>{phoneError}</p>}
      </form>
    </div>
  );
};

export default Login;
