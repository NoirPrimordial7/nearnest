// File: src/components/RequireRole.jsx
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

function RequireRole({ allowedRoles, children }) {
  const { authUser, userData, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // Not logged in
  if (!authUser) {
    return <Navigate to="/signin" replace />; // ✅ fixed path
  }

  const userRoles = userData?.roles || [];
  const hasRole = allowedRoles.some(role => userRoles.includes(role));

  if (!hasRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default RequireRole;
