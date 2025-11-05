// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// auth pages
import SignIn from "./pages/Auth/SignIn";
import SignUp from "./pages/Auth/SignUp";

// user
import UserHome from "./pages/User/UserHome";
import ProfileSetup from "./pages/User/ProfileSetup";

// store register flow
import StoreForm from "./pages/RegisterStore/ConfirmStart";

// guards
import ProtectedRoute from "./routes/ProtectedRoute";
import RequireProfile from "./components/RequireProfile";

export default function App() {
  return (
    <Routes>
      {/* auth */}
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />

      {/* first-run profile setup */}
      <Route
        path="/setup-profile"
        element={
          <ProtectedRoute allowed={["admin", "user", "storeAdmin", "storeStaff"]}>
            <ProfileSetup />
          </ProtectedRoute>
        }
      />

      {/* user home */}
      <Route
        path="/home"
        element={
          <ProtectedRoute allowed={["admin", "user", "storeAdmin", "storeStaff"]}>
            <RequireProfile>
              <UserHome />
            </RequireProfile>
          </ProtectedRoute>
        }
      />

      {/* store registration */}
      <Route
        path="/register-store"
        element={
          <ProtectedRoute allowed={["admin", "user", "storeAdmin"]}>
            <RequireProfile>
              <StoreForm />
            </RequireProfile>
          </ProtectedRoute>
        }
      />

      {/* default */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<div style={{ padding: 24 }}>Not found</div>} />
    </Routes>
  );
}
