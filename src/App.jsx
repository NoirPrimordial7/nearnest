// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";

// Auth pages
import SignIn from "./pages/Auth/SignIn";
import SignUp from "./pages/Auth/SignUp";

// Protected route wrapper
import ProtectedRoute from "./routes/ProtectedRoute";

// Admin layout & pages
import AdminLayout from "./pages/Admin/AdminLayout";
import AdminDashboard from "./pages/Admin/Dashboard";
import StoresPage from "./pages/Admin/Stores/StoresPage";
import DocumentVerification from "./pages/Admin/Verification/DocumentVerification";
import SupportTickets from "./pages/Admin/Support/SupportTickets";

export default function App() {
  return (
    <Routes>
      {/* Default redirect to Sign In */}
      <Route path="/" element={<Navigate to="/signin" replace />} />

      {/* Public Auth Routes */}
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />

      {/* Protected Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="stores" element={<StoresPage />} />
        <Route path="verification" element={<DocumentVerification />} />
        <Route path="support" element={<SupportTickets />} />
      </Route>

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
