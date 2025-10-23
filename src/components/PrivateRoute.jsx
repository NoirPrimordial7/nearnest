// src/components/PrivateRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const PrivateRoute = ({ children, requiredRole }) => {
  const { firebaseUser, userData, loading } = useAuth();

  if (loading) {
    // While auth state is loading, we can render nothing or a spinner
    return <div>Loading...</div>;
  }

  if (!firebaseUser) {
    // Not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }

  // If a specific role is required and the user's role doesn't match, block access
  if (requiredRole && userData?.role !== requiredRole) {
    // Optionally, redirect to a "Not Authorized" page or dashboard
    return <Navigate to="/" replace />;
  }

  // Authenticated (and role authorized if required), allow access
  return children;
};

export default PrivateRoute;
