// src/components/RequireProfile.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../Auth/AuthContext";
import { useProfileComplete } from "../user/userProfile";

export default function RequireProfile({ children }) {
  const { user } = useAuth();
  const { loading, exists, error } = useProfileComplete(user?.uid);

  if (!user) return <Navigate to="/signin" replace />;

  if (loading) {
    // Minimal, Denqid-style calm loader (no extra CSS file needed)
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "grid",
          placeItems: "center",
          background:
            "radial-gradient(1000px 600px at 10% -5%, rgba(17,17,17,.05), transparent 60%), #f7f8fb",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,.9)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(0,0,0,.06)",
            boxShadow: "0 30px 60px rgba(0,0,0,.10), 0 1px 0 rgba(255,255,255,.8) inset",
            borderRadius: 18,
            padding: "24px 22px",
            fontWeight: 800,
            letterSpacing: ".2px",
            color: "#0f1012",
          }}
        >
          Loading profile…
        </div>
      </div>
    );
  }

  if (error?.code === "permission-denied") {
    return (
      <div
        style={{
          maxWidth: 720,
          margin: "40px auto",
          padding: 18,
          borderRadius: 16,
          border: "1px solid #fde4e4",
          background: "#fef2f2",
          color: "#b91c1c",
          fontWeight: 700,
        }}
      >
        Can’t read your profile due to Firestore rules (<b>permission-denied</b>).
        Deploy the correct rules and reload.
      </div>
    );
  }

  if (!exists) return <Navigate to="/setup-profile" replace />;

  return children;
}
