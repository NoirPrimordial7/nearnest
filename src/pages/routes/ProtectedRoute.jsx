// src/pages/routes/ProtectedRoute.jsx

import { Navigate } from "react-router-dom";
import { useAuth } from "../Auth/AuthContext";

export default function ProtectedRoute({ children, allowed = [] }) {
  const { user, roles, authLoading } = useAuth();

  if (authLoading) return null; // or a loading spinner
  if (!user) return <Navigate to="/signin" replace />;

  // If an `allowed` array is specified, check roles
  if (Array.isArray(allowed) && allowed.length > 0) {
    const hasAllowedRole = roles.some((r) => allowed.includes(r));
    if (!hasAllowedRole) {
      // Redirect unauthorized users (could customize path)
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
