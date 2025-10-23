// src/pages/Login.jsx
import React, { useState } from "react";
import { auth } from "../firebaseConfig";
import { signInWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { useNavigate } from "react-router-dom";

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
      // If successful, onAuthStateChanged will handle navigation in our App or context.
      // We can optionally navigate to dashboard:
      navigate("/");
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
      const phoneNumber = phone;
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
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
      // User is now signed in (if phone was registered). If phone was not yet registered,
      // this will create a new user - but in login context, it means it's a first-time use of phone.
      // You might want to prevent that or handle it as sign-up.
      navigate("/");
    } catch (err) {
      setPhoneError("Failed to verify code. Please try again.");
    }
  };

  return (
    <div className="login-page">
      <h2>Login</h2>
      {/* Email Login Form */}
      <form onSubmit={handleEmailLogin}>
        <h3>Email Login</h3>
        <input 
          type="email" placeholder="Email" value={email} required 
          onChange={e => setEmail(e.target.value)} 
        />
        <input 
          type="password" placeholder="Password" value={password} required 
          onChange={e => setPassword(e.target.value)} 
        />
        <button type="submit">Login</button>
        {emailError && <p className="error">{emailError}</p>}
      </form>

      {/* Phone Login Form */}
      <form onSubmit={otpSent ? verifyOtpCode : sendOtpCode}>
        <h3>Phone Login</h3>
        {!otpSent ? (
          <>
            <input 
              type="tel" placeholder="Phone number e.g. +1234567890" value={phone} required
              onChange={e => setPhone(e.target.value)}
            />
            <div id="recaptcha-container-login"></div>
            <button type="submit">Send OTP</button>
          </>
        ) : (
          <>
            <input 
              type="text" placeholder="Enter OTP" value={otp} required
              onChange={e => setOtp(e.target.value)}
            />
            <button type="submit">Verify & Login</button>
          </>
        )}
        {phoneError && <p className="error">{phoneError}</p>}
      </form>
    </div>
  );
};

export default Login;
