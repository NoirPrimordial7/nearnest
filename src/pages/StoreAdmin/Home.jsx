// src/pages/StoreAdmin/Home.jsx
import React from "react";
import { useAuth } from "../../context/AuthContext.jsx";
export default function StoreAdminHome() {
  const { user, roles, storeId } = useAuth();
  return (
    <div style={{ padding: 24 }}>
      <h1>Store Admin Home</h1>
      <p>Welcome {user?.email}</p>
      <p>Store: {storeId || "N/A"}</p>
      <p>Roles: {roles.join(", ")}</p>
    </div>
  );
}
