// src/components/RequireProfile.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProfileComplete } from "../services/userProfile";

export default function RequireProfile({ children }) {
  const { user } = useAuth();
  const { loading, exists, error } = useProfileComplete(user?.uid);

  if (!user) return <Navigate to="/signin" replace />;

  if (loading) return <div style={{ padding: 24 }}>Loading profile…</div>;

  if (error?.code === "permission-denied") {
    return (
      <div style={{ padding: 24 }}>
        Can’t read your profile due to Firestore rules (<b>permission-denied</b>).
        Deploy the rules below and reload.
      </div>
    );
  }

  if (!exists) return <Navigate to="/setup-profile" replace />;

  return children;
}
