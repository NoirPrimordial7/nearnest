// src/routes/RoleRedirect.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRedirect() {
  const { user, roles, authLoading } = useAuth();

  if (authLoading) return null; // or a spinner

  if (!user) {
    // Not signed in → send to sign-in
    return <Navigate to="/signin" replace />;
  }

  // Priority-based redirect
  if (roles.includes("admin")) return <Navigate to="/admin" replace />;
  if (roles.includes("storeAdmin")) return <Navigate to="/store-admin/home" replace />;
  if (roles.includes("storeStaff")) return <Navigate to="/store-staff/home" replace />;

  // Default user home
  return <Navigate to="/home" replace />;
}
