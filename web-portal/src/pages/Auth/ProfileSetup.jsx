// src/pages/ProfileSetup.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { auth, db } from "../firebaseConfig";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const ProfileSetup = () => {
  const { firebaseUser, userData } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(userData?.username || "");
  const [fullName, setFullName] = useState(userData?.fullName || "");
  const [error, setError] = useState("");

  useEffect(() => {
    // Redirect if user is not logged in or email not verified (in case an email user sneaks in without verification)
    if (!firebaseUser) {
      navigate("/login");
    } else if (firebaseUser.providerData.some(p => p.providerId === "password") && !firebaseUser.emailVerified) {
      // If the user signed up with email (password provider) and hasn't verified yet
      navigate("/verify-email");
    }
    // If phone user or already verified email user, allow to proceed.
  }, [firebaseUser, navigate]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setError("");
    if (!firebaseUser) return;
    try {
      // Update Firebase Auth display name (optional)
      if (username) {
        await updateProfile(firebaseUser, { displayName: username });
      }
      // Update Firestore user document
      const userDocRef = doc(db, "users", firebaseUser.uid);
      await updateDoc(userDocRef, {
        username: username,
        fullName: fullName,
        emailVerified: firebaseUser.emailVerified,
        // Ensure role is set (should already be 'user'), and possibly default permissions 
      });
      // Navigate to main dashboard/home
      navigate("/");
    } catch (err) {
      setError("Failed to save profile: " + err.message);
    }
  };

  return (
    <div className="profile-setup-page">
      <h2>Complete Your Profile</h2>
      <form onSubmit={handleProfileSave}>
        <label>
          Username:
          <input 
            type="text" value={username} required 
            onChange={e => setUsername(e.target.value)} 
          />
        </label>
        <label>
          Full Name: (optional)
          <input 
            type="text" value={fullName}
            onChange={e => setFullName(e.target.value)} 
          />
        </label>
        <button type="submit">Save Profile</button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
};

export default ProfileSetup;
