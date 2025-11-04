// src/components/RequireProfile.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProfileComplete } from "../services/userProfile";

export default function RequireProfile({ children }) {
  const { user } = useAuth();
  const { loading, complete } = useProfileComplete(user?.uid);

  if (!user) return <Navigate to="/signin" replace />;
  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!complete) return <Navigate to="/setup-profile" replace />;

  return children;
}
