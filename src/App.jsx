// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ReviewSubmit from "./pages/Stores/ReviewSubmit.jsx";

// auth pages
import SignIn from "./pages/Auth/SignIn";
import SignUp from "./pages/Auth/SignUp";

// user
import UserHome from "./pages/User/UserHome";
import ProfileSetup from "./pages/User/ProfileSetup";

// store register flow
import StoreForm from "./pages/RegisterStore/ConfirmStart";
import RegisterStore from "./pages/RegisterStore/RegisterStore";

// guards
import ProtectedRoute from "./routes/ProtectedRoute";
import RequireProfile from "./components/RequireProfile";
import VerificationStatus from "./pages/Stores/VerificationStatus";

// role landing
import RoleRedirect from "./routes/RoleRedirect";

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

      {/* store registration (ConfirmStart / Register) */}
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
      {/* remove duplicate - keep only one /register-store route */}

      {/* full register with map/address etc. */}
      <Route
        path="/register-store/details"
        element={
          <ProtectedRoute allowed={["admin", "user", "storeAdmin"]}>
            <RequireProfile>
              <RegisterStore />
            </RequireProfile>
          </ProtectedRoute>
        }
      />

      {/* verification tracking */}
      <Route
        path="/verification-status/:id"
        element={
          <ProtectedRoute allowed={["admin", "user", "storeAdmin", "storeStaff"]}>
            <RequireProfile>
              <VerificationStatus />
            </RequireProfile>
          </ProtectedRoute>
        }
      />

      {/* review & submit should be protected */}
      <Route
        path="/review-submit/:id"
        element={
          <ProtectedRoute allowed={["admin", "user", "storeAdmin"]}>
            <ReviewSubmit />
          </ProtectedRoute>
        }
      />

      {/* landing decides per-role homes */}
      <Route path="/" element={<RoleRedirect />} />

      {/* 404 */}
      <Route path="*" element={<div style={{ padding: 24 }}>Not found</div>} />
    </Routes>
  );
}
