import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children, allow = "any" }) {
  const { user, authLoading } = useAuth();

  if (authLoading) return null; // or a spinner
  if (!user) return <Navigate to="/login" replace />;

  // optional extra checks could go here (claims/roles) if you add them later
  return children;
}
