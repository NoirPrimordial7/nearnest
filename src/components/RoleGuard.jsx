// src/components/RoleGuard.jsx
import { useAuth } from "../contexts/AuthContext";

const RoleGuard = ({ requiredPermission, children }) => {
  const { userData, hasPermission } = useAuth();
  if (!userData) return null; // not logged in or data not loaded
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return null; // user lacks the required permission, render nothing
  }
  return children;
};

export default RoleGuard;
