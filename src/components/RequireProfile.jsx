import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProfileComplete } from "../services/userProfile";

export default function RequireProfile({ children }) {
  const { user } = useAuth();
  const { complete, loading } = useProfileComplete(user?.uid);

  if (loading) return null; // or a small spinner if you want
  if (!complete) return <Navigate to="/setup-profile" replace />;
  return children;
}
