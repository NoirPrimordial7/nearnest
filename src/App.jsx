import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

// Auth screens (your existing components / design)
import SignIn from "./pages/Auth/SignIn";
import SignUp from "./pages/Auth/SignUp";
import VerifyEmail from "./pages/Auth/VerifyEmail";

// Minimal role landing pages
import AdminDashboard from "./pages/Admin/AdminDashboard";
import StoreAdminHome from "./pages/StoreAdmin/Home";
import StoreStaffHome from "./pages/StoreStaff/Home";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Admin: full access */}
        <Route element={<ProtectedRoute allow={["admin"]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>

        {/* Store Admin (global storeAdmin OR any :Owner) */}
        <Route element={<ProtectedRoute allow={["storeAdmin", "store:Owner"]} />}>
          <Route path="/store-admin/home" element={<StoreAdminHome />} />
        </Route>

        {/* Store Staff (any store-scoped role) */}
        <Route element={<ProtectedRoute allow={["store:any"]} />}>
          <Route path="/store-staff/home" element={<StoreStaffHome />} />
        </Route>

        {/* Default / 404 */}
        <Route path="/" element={<Navigate to="/signin" replace />} />
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </AuthProvider>
  );
}
