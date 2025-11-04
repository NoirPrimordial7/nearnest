// src/pages/StoreStaff/Home.jsx
import React from "react";
import { useAuth } from "../../contexts/AuthContext";
export default function StoreStaffHome() {
  const { user, roles, storeId } = useAuth();
  return (
    <div style={{ padding: 24 }}>
      <h1>Store Staff Home</h1>
      <p>Welcome {user?.email}</p>
      <p>Store: {storeId || "N/A"}</p>
      <p>Roles: {roles.join(", ")}</p>
    </div>
  );
}
