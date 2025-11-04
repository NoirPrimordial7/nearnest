// File: src/components/RequireStoreRole.jsx
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

function RequireStoreRole({ children }) {
  const { authUser, userData, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!authUser) {
    return <Navigate to="/signin" replace />; // ✅ fixed path
  }

  const roles = userData?.roles || [];

  // Check for any store-scoped role (like "demoStore:Owner")
  const hasStoreRole = roles.some(r => r.includes(":"));
  const isOwner = roles.includes("storeAdmin");

  if (!hasStoreRole || isOwner) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default RequireStoreRole;
