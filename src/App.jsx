// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

// Auth screens (keep your current components)
import SignIn from "./pages/Auth/SignIn";
import SignUp from "./pages/Auth/SignUp";
import VerifyEmail from "./pages/Auth/VerifyEmail";

// Minimal role landing pages (placeholders so redirects have a target)
import AdminDashboard from "./pages/Admin/AdminDashboard";
import StoreAdminHome from "./pages/StoreAdmin/Home";
import StoreStaffHome from "./pages/StoreStaff/Home";

// If you have a Home/Landing, swap the "/" route to it later.
export default function App() {
  return (
    <BrowserRouter>
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

          {/* Store Admin (global storeAdmin OR any :Owner of a store) */}
          <Route element={<ProtectedRoute allow={["storeAdmin", "store:Owner"]} />}>
            <Route path="/store-admin/home" element={<StoreAdminHome />} />
          </Route>

          {/* Store Staff (any store-scoped role, or restrict to Manager/Staff if you want) */}
          <Route element={<ProtectedRoute allow={["store:any"]} />}>
            <Route path="/store-staff/home" element={<StoreStaffHome />} />
          </Route>

          {/* Default: push unknowns to sign-in */}
          <Route path="/" element={<Navigate to="/signin" replace />} />
          <Route path="*" element={<Navigate to="/signin" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
