import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

// AUTH screens you already have
import SignIn from "./pages/Auth/SignIn";
import SignUp from "./pages/Auth/SignUp";
import VerifyEmail from "./pages/Auth/VerifyEmail";

// ADMIN
import AdminLayout from "./pages/Admin/AdminLayout"; // you said: redirect to layout, not dashboard

// USER
import UserHome from "./pages/User/UserHome";
import ProfileSetup from "./pages/User/ProfileSetup";
import ConfirmStart from "./pages/RegisterStore/ConfirmStart";
import RequireProfile from "./components/RequireProfile";

function PostLoginRedirect() {
  const { user, role } = useAuth();

  if (!user) return <Navigate to="/signin" replace />;

  if (role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/home" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* entry */}
          <Route path="/" element={<PostLoginRedirect />} />
          <Route path="/Home" element={<Navigate to="/home" replace />} /> {/* case alias */}

          {/* auth */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* admin area */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          />

          {/* user area */}
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
          <Route
            path="/setup-profile"
            element={
              <ProtectedRoute>
                <ProfileSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register/confirm"
            element={
              <ProtectedRoute>
                <ConfirmStart />
              </ProtectedRoute>
            }
          />

          {/* fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
