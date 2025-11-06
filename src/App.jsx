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
      <Route
        path="/register-store"
        element={
          <ProtectedRoute allowed={["admin", "user", "storeAdmin"]}>
            <RequireProfile>
              <RegisterStore />
            </RequireProfile>
          </ProtectedRoute>
        }
      />
       <Route path="/review-submit/:id" element={<ReviewSubmit />} /> 

      {/* default */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<div style={{ padding: 24 }}>Not found</div>} />
    </Routes>
  );
}
