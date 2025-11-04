// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import SignIn from "./pages/Auth/SignIn";
import SignUp from "./pages/Auth/SignUp";
import VerifyEmail from "./pages/Auth/VerifyEmail";

import UserHome from "./pages/User/UserHome";
import ProfileSetup from "./pages/User/ProfileSetup";

import AdminLayout from "./pages/Admin/AdminLayout";
import AdminDashboard from "./pages/Admin/AdminDashboard";

import ProtectedRoute from "./routes/ProtectedRoute";
import RequireProfile from "./components/RequireProfile";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />

      {/* Auth */}
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/verify" element={<VerifyEmail />} />

      {/* User area (any authenticated user) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RequireProfile />}>
          <Route path="/home" element={<UserHome />} />
        </Route>
        <Route path="/setup-profile" element={<ProfileSetup />} />
      </Route>

      {/* Admin area (role-gated) */}
      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route path="/admin/*" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<div style={{ padding: 24 }}>404 • Not found</div>} />
    </Routes>
  );
}
