// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";

// Guards
import ProtectedRoute from "./routes/ProtectedRoute";
import RequireProfile from "./components/RequireProfile";

// Auth
import SignIn from "./pages/Auth/SignIn";
import SignUp from "./pages/Auth/SignUp";
import ResetPassword from "./pages/Auth/ResetPassword";
import VerifyEmail from "./pages/Auth/VerifyEmail";

// User
import ProfileSetup from "./pages/User/ProfileSetup";
import UserHome from "./pages/User/UserHome";

// Store register
import ConfirmStart from "./pages/RegisterStore/ConfirmStart";
import StoreForm from "./pages/RegisterStore/StoreForm";

// Admin
import AdminLayout from "./pages/Admin/AdminLayout";

// smart landing
function IndexRedirect() {
  const { user, role } = useAuth?.() || {};
  if (!user) return <Navigate to="/signin" replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/home" replace />;
}

export default function App() {
  // NOTE: <BrowserRouter> must be ONLY in src/main.jsx
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<IndexRedirect />} />

        {/* auth */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* profile */}
        <Route
          path="/setup-profile"
          element={
            <ProtectedRoute>
              <ProfileSetup />
            </ProtectedRoute>
          }
        />

        {/* user home */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <RequireProfile>
                <UserHome />
              </RequireProfile>
            </ProtectedRoute>
          }
        />

        {/* store registration */}
        <Route
          path="/register-store/start"
          element={
            <ProtectedRoute>
              <RequireProfile>
                <ConfirmStart />
              </RequireProfile>
            </ProtectedRoute>
          }
        />
        <Route
          path="/register-store"
          element={
            <ProtectedRoute>
              <RequireProfile>
                <StoreForm />
              </RequireProfile>
            </ProtectedRoute>
          }
        />

        {/* admin */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
