// src/components/RequireProfile.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";         // <- singular "context"
import { useProfileComplete } from "../services/userProfile";

export default function RequireProfile({ children }) {
  const { user } = useAuth();                // { user } shape from your AuthContext
  if (!user) return <Navigate to="/signin" replace />;

  const { loading, complete } = useProfileComplete(user.uid);
  if (loading) return null;                  // or a loader/spinner
  if (!complete) return <Navigate to="/setup-profile" replace />;

  return children;
}
