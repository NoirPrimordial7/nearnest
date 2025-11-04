// src/routes/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// roles is OPTIONAL. When omitted, any authenticated user can pass.
export default function ProtectedRoute({ roles = null }) {
  const { user, role, loading } = useAuth(); // role can be string/array/undefined
  const location = useLocation();

  if (loading) {
    return <div style={{ padding: 24 }}>Loading…</div>;
  }

  // Not signed in → go to sign-in
  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  // Normalize role value from context
  const userRole = Array.isArray(role) ? role[0] : role || "user";

  // Only check when roles was provided
  const allowed = Array.isArray(roles) ? roles.includes(userRole) : true;
  if (!allowed) {
    // Signed in but not allowed → send to /home
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
