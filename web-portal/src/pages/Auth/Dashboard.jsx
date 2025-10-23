// src/pages/Dashboard.jsx
import React from "react";
import { useAuth } from "../contexts/AuthContext";
import RoleGuard from "../components/RoleGuard";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { userData, firebaseUser } = useAuth();

  if (!firebaseUser) return null; // should be protected by PrivateRoute anyway

  return (
    <div className="dashboard-page">
      <h2>Welcome, {userData?.username || firebaseUser.phoneNumber || firebaseUser.email}!</h2>
      <p>Your role: <strong>{userData?.role}</strong></p>
      {/* Example: Only show admin panel link if user is super-admin */}
      {userData?.role === "super-admin" && (
        <p><Link to="/admin/manage-roles">Go to Admin Panel (Manage Roles)</Link></p>
      )}
      {/* Alternatively, using RoleGuard for a permission: */}
      <RoleGuard requiredPermission="canManageRoles">
        <p><Link to="/admin/manage-roles">Manage Roles (Admin Only)</Link></p>
      </RoleGuard>
      <p>This is a protected dashboard visible after login.</p>
    </div>
  );
};

export default Dashboard;
