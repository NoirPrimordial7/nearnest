// src/pages/VerifyEmail.jsx
import React, { useState } from "react";
import { auth } from "../firebaseConfig";
import { sendEmailVerification } from "firebase/auth";
import { useAuth } from "../contexts/AuthContext";

const VerifyEmail = () => {
  const { firebaseUser } = useAuth();
  const [message, setMessage] = useState("");

  const handleResend = async () => {
    if (firebaseUser) {
      try {
        await sendEmailVerification(firebaseUser);
        setMessage("Verification email resent. Please check your inbox.");
      } catch (err) {
        setMessage("Error sending verification email: " + err.message);
      }
    }
  };

  return (
    <div className="verify-email-page">
      <h2>Please Verify Your Email</h2>
      <p>We've sent a verification link to your email address. Please click that link to verify your account.</p>
      <p>After verification, you can continue to complete your profile.</p>
      <button onClick={handleResend}>Resend Verification Email</button>
      {message && <p>{message}</p>}
      <p><em>Once verified, please refresh or log in again to continue.</em></p>
    </div>
  );
};

export default VerifyEmail;
