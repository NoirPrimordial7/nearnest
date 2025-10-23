// src/pages/SignUp.jsx
import React, { useState } from "react";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const navigate = useNavigate();

  // State for email/password form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");

  // State for phone form
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  // Initialize reCAPTCHA when sending OTP
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: (response) => {
          // reCAPTCHA solved - will proceed with send OTP
        },
      });
    }
  };

  // Email/password sign-up handler
  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setEmailError("");
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      // Send verification email
      await sendEmailVerification(userCred.user);
      // Create a placeholder Firestore doc (with verified false and default role)
      await setDoc(doc(db, "users", userCred.user.uid), {
        email: email,
        username: "",            // will be set after verification
        phone: "",               // no phone initially
        emailVerified: false,
        role: "user",            // default role
        permissions: {},         // (optional) could leave empty or set defaults
        createdAt: Date.now()
      });
      // Prompt user to check email
      alert("Verification email sent to " + email + ". Please verify your email before continuing.");
      // Navigate to verification notice page
      navigate("/verify-email");
    } catch (err) {
      setEmailError(err.message);
    }
  };

  // Phone sign-up (OTP send)
  const sendOtpCode = async (e) => {
    e.preventDefault();
    setPhoneError("");
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      // Format phone with country code if not included, e.g., +1 or +91 etc.
      const phoneNumber = phone;
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      // SMS sent
      setOtpSent(true);
      window.confirmationResult = confirmationResult;
    } catch (err) {
      setPhoneError(err.message);
    }
  };

  // Verify OTP code and finalize phone sign-up
  const verifyOtpCode = async (e) => {
    e.preventDefault();
    setPhoneError("");
    try {
      const confirmationResult = window.confirmationResult;
      const cred = await confirmationResult.confirm(otp);
      // cred.user is now signed in with that phone number.
      const user = cred.user;
      // Check if user doc already exists (perhaps from a previous email sign-up linking same phone)
      const userDocRef = doc(db, "users", user.uid);
      const docSnap = await userDocRef.get(); // (We could use getDoc in modular API)
      if (!docSnap.exists()) {
        // New user, create user doc with default role
        await setDoc(userDocRef, {
          phone: user.phoneNumber,
          email: user.email || "",  // user.email might be empty for phone-auth-only
          username: "",
          emailVerified: user.email ? user.emailVerified : false, // likely false or not applicable
          role: "user",
          permissions: {},
          createdAt: Date.now()
        });
      }
      // Phone user doesn't need email verification, proceed to profile setup
      navigate("/profile-setup");
    } catch (err) {
      setPhoneError("Invalid OTP. Please try again.");
    }
  };

  return (
    <div className="signup-page">
      <h2>Sign Up</h2>
      {/* Email/Password Sign Up Form */}
      <form onSubmit={handleEmailSignUp}>
        <h3>Email Registration</h3>
        <input 
          type="email" placeholder="Email" value={email} required
          onChange={e => setEmail(e.target.value)} 
        />
        <input 
          type="password" placeholder="Password" value={password} required
          onChange={e => setPassword(e.target.value)} 
        />
        <button type="submit">Sign Up with Email</button>
        {emailError && <p className="error">{emailError}</p>}
      </form>

      {/* Phone OTP Sign Up Form */}
      <form onSubmit={otpSent ? verifyOtpCode : sendOtpCode}>
        <h3>Phone Registration</h3>
        {!otpSent ? (
          <>
            <input 
              type="tel" placeholder="Phone number e.g. +1234567890" value={phone} required
              onChange={e => setPhone(e.target.value)}
            />
            <div id="recaptcha-container"></div> {/* Recaptcha container */}
            <button type="submit">Send OTP</button>
          </>
        ) : (
          <>
            <input 
              type="text" placeholder="Enter OTP" value={otp} required
              onChange={e => setOtp(e.target.value)}
            />
            <button type="submit">Verify OTP</button>
          </>
        )}
        {phoneError && <p className="error">{phoneError}</p>}
      </form>
    </div>
  );
};

export default SignUp;
