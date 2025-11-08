import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AuthProvider, RoleRedirect } from "./pages/Auth/AuthContext";
import RequireProfile from "./pages/user/RequireProfile";
import ProtectedRoute from './pages/routes/ProtectedRoute';

// Auth
import SignIn from './pages/Auth/SignIn';
import SignUp from './pages/Auth/SignUp';
import VerifyEmail from './pages/Auth/VerifyEmail';

// User
import UserHome from './pages/User/UserHome';
import UserProfile from './pages/user/UserProfiles';

// Store Onboarding
import RegisterStore from './pages/register-store/RegisterStore';
import ReviewSubmit from './pages/register-store/ReviewSubmit';
import VerificationStatus from './pages/register-store/VerificationStatus';

// Admin
import AdminLayout from './pages/Admin/AdminLayout';
import DocumentVerification from './pages/Admin/Verification/DocumentVerification';
import SupportTickets from './pages/Admin/Support/SupportTickets';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 🔐 AUTH ROUTES */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* 🔁 ROOT REDIRECTS BASED ON ROLE */}
          <Route path="/" element={<RoleRedirect />} />

          {/* 👤 USER ROUTES */}
          <Route
            path="/home"
            element={
              <ProtectedRoute allowed={['user', 'storeAdmin', 'admin']}>
                <RequireProfile>
                  <UserHome />
                </RequireProfile>
              </ProtectedRoute>
            }
          />

          <Route
            path="/setup-profile"
            element={
              <ProtectedRoute allowed={['user', 'storeAdmin', 'admin']}>
                <UserProfile />
              </ProtectedRoute>
            }
          />

          {/* 🏪 STORE REGISTRATION FLOW */}
          <Route
            path="/register-store"
            element={
              <ProtectedRoute allowed={['user', 'storeAdmin']}>
                <RegisterStore />
              </ProtectedRoute>
            }
          />

          <Route
            path="/verification-status/:id"
            element={
              <ProtectedRoute allowed={['user', 'storeAdmin']}>
                <VerificationStatus />
              </ProtectedRoute>
            }
          />

          <Route
            path="/review-submit/:id"
            element={
              <ProtectedRoute allowed={['user', 'storeAdmin']}>
                <ReviewSubmit />
              </ProtectedRoute>
            }
          />

          {/* 🛠️ ADMIN ROUTES */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowed={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/verification"
            element={
              <ProtectedRoute allowed={['admin']}>
                <DocumentVerification />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/support"
            element={
              <ProtectedRoute allowed={['admin']}>
                <SupportTickets />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
