// src/App.jsx
import React from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';

import NearnestHome from "./pages/NearnestHome";

import RequireProfile from "./pages/User/RequireProfile";
import ProtectedRoute from './pages/routes/ProtectedRoute';

// Store Admin
import StoreAdminLayout from "./pages/StoreAdmin/StoreAdminLayout";
import StoreAdminDashboard from "./pages/StoreAdmin/StoreAdminDashboard/StoreAdminDashboard";
import StoreInventory from "./pages/StoreAdmin/Inventory/Inventory";
import StoreAdvertisement from "./pages/StoreAdmin/storeadvertisement";
import StoreSettings from "./pages/StoreAdmin/storeSettings/storeSettings";
import StoreSupport from "./pages/StoreAdmin/help";

// Auth
import SignIn from './pages/Auth/SignIn';
import SignUp from './pages/Auth/SignUp';
import VerifyEmail from './pages/Auth/VerifyEmail';

// User
import UserHome from './pages/User/UserHome';
import UserProfile from './pages/User/UserProfiles';

// Store Onboarding
import CreateStore from "./pages/register-store/CreateStore";
import UploadDocuments from "./pages/register-store/UploadDocuments";
import ReviewSubmit from './pages/register-store/ReviewSubmit';
import VerificationStatus from './pages/register-store/VerificationStatus';

// Admin
import AdminLayout from './pages/Admin/AdminLayout';
import AdminDashboard from './pages/Admin/Dashboard/Dashboard';
import AdminStores from './pages/Admin/Stores/StoresPage';
import AdminVerification from './pages/Admin/Verification/DocumentVerification';
import AdminSupport from './pages/Admin/Support/SupportTickets';

function App() {
  return (
    <Routes>
        {/* 🔐 AUTH ROUTES */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* 🔁 ROOT */}
        <Route path="/" element={<NearnestHome />} />

        {/* 👤 USER ROUTES */}
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
              <UserProfile />
            </ProtectedRoute>
          }
        />

        {/* 🏪 STORE REGISTRATION FLOW */}
        <Route
          path="/register-store"
          element={
            <ProtectedRoute>
              <CreateStore />
            </ProtectedRoute>
          }
        />

        <Route
          path="/upload-docs/:id"
          element={
            <ProtectedRoute>
              <UploadDocuments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/verification-status/:id"
          element={
            <ProtectedRoute>
              <VerificationStatus />
            </ProtectedRoute>
          }
        />

        <Route
          path="/review-submit/:id"
          element={
            <ProtectedRoute>
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

        {/* 👤 STORE ADMIN ROUTES */}
        <Route
          path="/store-admin/home"
          element={
            <ProtectedRoute>
              <Navigate to="/home" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/store-admin/:storeId"
          element={
            <ProtectedRoute>
              <StoreAdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StoreAdminDashboard />} />
          <Route path="inventory" element={<StoreInventory />} />
          <Route path="settings" element={<StoreSettings />} />
          <Route path="advertisement" element={<StoreAdvertisement />} />
          <Route path="support" element={<StoreSupport />} />
        </Route>
      </Routes>
  );
}

export default App;
