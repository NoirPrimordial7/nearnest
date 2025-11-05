import { Navigate } from "react-router-dom";
import { useProfileComplete } from "../services/userProfile";

export default function RequireProfile({ children }) {
  const { isComplete, loading } = useProfileComplete();

  if (loading) return null; // or spinner
  if (!isComplete) return <Navigate to="/setup-profile" replace />;
  return children;
}
