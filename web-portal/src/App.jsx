// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";

import SignIn from "./pages/Auth/SignIn";
import SignUp from "./pages/Auth/SignUp";

import ProtectedRoute from "./routes/ProtectedRoute";
import AdminLayout from "./pages/Admin/AdminLayout";
import AdminDashboard from "./pages/Admin/Dashboard";
import StoresPage from "./pages/Admin/Stores/StoresPage";
import DocumentVerification from "./pages/Admin/Verification/DocumentVerification";
import SupportTickets from "./pages/Admin/Support/SupportTickets"; // ← NEW

export default function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/" element={<Navigate to="/signin" replace />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />

      {/* Admin (nested inside AdminLayout) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />                 {/* /admin */}
        <Route path="stores" element={<StoresPage />} />             {/* /admin/stores */}
        <Route path="verification" element={<DocumentVerification />} /> {/* /admin/verification */}
        <Route path="support" element={<SupportTickets />} />        {/* /admin/support */}
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
