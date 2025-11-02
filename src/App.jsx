// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";

import { AuthProvider, useAuth, resolveHomePath } from "./contexts/AuthContext";

// Pages (adjust paths if different)
import SignIn from "./pages/Auth/SignIn";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

import AdminLayout from "./pages/Admin/AdminLayout";
import AdminDashboard from "./pages/Admin/AdminDashboard";

import StoreAdminHome from "./pages/StoreAdmin/Home";
import StoreStaffHome from "./pages/StoreStaff/Home";

const Loader = () => (
  <div style={{ display: "grid", placeItems: "center", height: "100vh" }}>
    <div>Loading…</div>
  </div>
);

const isAdmin = (roles) => Array.isArray(roles) && roles.includes("admin");
const isStoreAdmin = (roles) =>
  Array.isArray(roles) && (roles.includes("storeAdmin") || roles.some((r) => r.includes(":Owner")));
const isStoreStaff = (roles) =>
  Array.isArray(roles) && roles.some((r) => r.includes(":")) && !isStoreAdmin(roles);

function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/signin" replace />;
  return <Outlet />;
}

function RequireRole({ allow }) {
  const { roles, loading } = useAuth();
  if (loading) return <Loader />;

  if (isAdmin(roles)) return <Outlet />; // admin sees everything

  const allowList = Array.isArray(allow) ? allow : allow ? [allow] : [];
  let ok = false;
  if (allowList.includes("storeAdmin") && isStoreAdmin(roles)) ok = true;
  if (allowList.includes("staff") && isStoreStaff(roles)) ok = true;
  if (allowList.includes("user") && !isStoreAdmin(roles) && !isStoreStaff(roles) && !isAdmin(roles)) ok = true;
  if (allowList.includes("admin") && isAdmin(roles)) ok = true;
  if (allowList.length === 0) ok = true;

  if (ok) return <Outlet />;
  return <Navigate to={resolveHomePath(roles)} replace />;
}

function AdminIndexRedirect() {
  return <Navigate to="/admin/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/signin" element={<SignIn />} />

          {/* Admin */}
          <Route element={<RequireAuth />}>
            <Route element={<RequireRole allow={["admin"]} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminIndexRedirect />} />
                <Route path="dashboard" element={<AdminDashboard />} />
              </Route>
            </Route>
          </Route>

          {/* Store Admin */}
          <Route element={<RequireAuth />}>
            <Route element={<RequireRole allow={["storeAdmin"]} />}>
              <Route path="/store-admin">
                <Route path="home" element={<StoreAdminHome />} />
              </Route>
            </Route>
          </Route>

          {/* Store Staff */}
          <Route element={<RequireAuth />}>
            <Route element={<RequireRole allow={"staff"} />}>
              <Route path="/store-staff">
                <Route path="home" element={<StoreStaffHome />} />
              </Route>
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
