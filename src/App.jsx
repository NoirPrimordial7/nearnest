import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AuthProvider, RoleRedirect } from "./pages/Auth/AuthContext";
import RequireProfile from "./pages/user/RequireProfile";
import ProtectedRoute from './pages/routes/ProtectedRoute';
import storemange from './pages/Admin/Stores/StoresPage';
// Auth
import SignIn from './pages/Auth/SignIn';
import SignUp from './pages/Auth/SignUp';
import VerifyEmail from './pages/Auth/VerifyEmail';

// User
import UserHome from './pages/user/UserHome';
import UserProfile from './pages/user/UserProfiles';

// Store Onboarding
import CreateStore from "./pages/register-store/CreateStore";
import UploadDocuments from "./pages/register-store/UploadDocuments";
import ReviewSubmit from './pages/register-store/ReviewSubmit';
import VerificationStatus from './pages/register-store/VerificationStatus';

// Admin
// Admin components
import AdminLayout from './pages/Admin/AdminLayout';
import AdminDashboard from './pages/Admin/Dashboard/Dashboard';
import AdminStores from './pages/Admin/Stores/StoresPage';
import AdminVerification from './pages/Admin/Verification/DocumentVerification';
import AdminSupport from './pages/Admin/Support/SupportTickets';

function App() {
  return (
    <AuthProvider>

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
              <CreateStore />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload-docs/:id"
          element={
            <ProtectedRoute allowed={['user', 'storeAdmin']}>
              <UploadDocuments />
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
            path="/admin"
            element={
              <ProtectedRoute allowed={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="stores" element={<AdminStores />} />
            <Route path="verification" element={<AdminVerification />} />
            <Route path="support" element={<AdminSupport />} />
          </Route>
      </Routes>

    </AuthProvider>
  );
}

export default App;
