// src/routes/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Role selector helpers
function hasAccess(userRoles, allowed) {
  // Admin can access everything
  if (userRoles.includes("admin")) return true;

  // Normalize allowed into array
  const allowList = Array.isArray(allowed) ? allowed : [allowed];

  return allowList.some((rule) => {
    if (rule === "any") return true;
    if (rule === "store:any") return userRoles.some((r) => r.includes(":"));
    if (rule.startsWith("store:")) {
      // store:Owner, store:Manager, store:Staff -> check suffix
      const wanted = rule.split(":")[1];
      return userRoles.some((r) => r.endsWith(`:${wanted}`));
    }
    // Plain role ("storeAdmin", "support", etc.)
    return userRoles.includes(rule);
  });
}

export default function ProtectedRoute({ allow = "any", redirectTo = "/signin" }) {
  const { user, roles, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!user) return <Navigate to={redirectTo} state={{ from: loc }} replace />;

  return hasAccess(roles, allow) ? <Outlet /> : <Navigate to={redirectTo} replace />;
}
