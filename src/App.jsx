// src/App.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase/firebase";

// === Pages (adjust paths if yours differ) ===
import SignIn from "./pages/Auth/SignIn";
import Landing from "./pages/Landing"; // public landing (or replace with your page)
import NotFound from "./pages/NotFound"; // 404

// Admin area (layout + dashboard)
import AdminLayout from "./pages/Admin/AdminLayout";
import AdminDashboard from "./pages/Admin/AdminDashboard";

// Store Admin
import StoreAdminHome from "./pages/StoreAdmin/Home";

// Store Staff
import StoreStaffHome from "./pages/StoreStaff/Home";

// ============== Role helpers ==============
const isAdmin = (roles) => Array.isArray(roles) && roles.includes("admin");
const isStoreAdmin = (roles) =>
  Array.isArray(roles) && (roles.includes("storeAdmin") || roles.some((r) => r.includes(":Owner")));
const isStoreStaff = (roles) =>
  Array.isArray(roles) && roles.some((r) => r.includes(":")) && !isStoreAdmin(roles);

// Centralized home-resolver so App & SignIn agree on targets
export const resolveHomePath = (roles) => {
  if (isAdmin(roles)) return "/admin/dashboard";
  if (isStoreAdmin(roles)) return "/store-admin/home";
  if (isStoreStaff(roles)) return "/store-staff/home";
  return "/"; // generic users/guests
};

// ============== Auth Context ==============
const AuthContext = createContext({ user: null, roles: null, loading: true });
export const useAuth = () => useContext(AuthContext);

async function fetchUserRoles(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  // Your seed script created an array field "roles" (e.g., ["admin"] or ["storeAdmin"] or ["storeId:Staff"])
  return Array.isArray(data?.roles) ? data.roles : null;
}

function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, roles: null, loading: true });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setState({ user: null, roles: null, loading: false });
        return;
      }
      try {
        const roles = await fetchUserRoles(u.uid);
        setState({ user: u, roles, loading: false });
      } catch (err) {
        console.error("Role fetch failed:", err);
        setState({ user: u, roles: null, loading: false });
      }
    });
    return () => unsub();
  }, []);

  const value = useMemo(() => state, [state.user, state.roles, state.loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============== Guards ==============
function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return null; // you can render a spinner here if you want
  if (!user) return <Navigate to="/signin" replace />;
  return <Outlet />;
}

/**
 * RequireRole:
 *  - Admin bypasses everything (developer-friendly)
 *  - allow: string | string[] | "staff" (meaning any "storeId:Role")
 */
function RequireRole({ allow }) {
  const { roles, loading } = useAuth();
  if (loading) return null;

  // Admin always allowed
  if (isAdmin(roles)) return <Outlet />;

  // Normalize allow to an array of strings or a special "staff"
  const allowList = Array.isArray(allow) ? allow : allow ? [allow] : [];

  let ok = false;
  if (allowList.includes("storeAdmin") && isStoreAdmin(roles)) ok = true;
  if (allowList.includes("staff") && isStoreStaff(roles)) ok = true;
  if (allowList.includes("user") && !isStoreAdmin(roles) && !isStoreStaff(roles) && !isAdmin(roles)) ok = true;
  if (allowList.includes("admin") && isAdmin(roles)) ok = true;
  if (allowList.length === 0) ok = true; // route doesn't care about roles

  if (ok) return <Outlet />;

  // Not allowed → send them to their own home
  return <Navigate to={resolveHomePath(roles)} replace />;
}

function AdminIndexRedirect() {
  return <Navigate to="/admin/dashboard" replace />;
}

// ============== App ==============
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/signin" element={<SignIn />} />

          {/* Admin: admin can access EVERYTHING during development */}
          <Route element={<RequireAuth />}>
            <Route element={<RequireRole allow={["admin"]} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminIndexRedirect />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                {/* Add more admin routes here (admin can see them all) */}
              </Route>
            </Route>
          </Route>

          {/* Store Admin */}
          <Route element={<RequireAuth />}>
            <Route element={<RequireRole allow={["storeAdmin"]} />}>
              <Route path="/store-admin">
                <Route path="home" element={<StoreAdminHome />} />
                {/* Add more store-admin routes here */}
              </Route>
            </Route>
          </Route>

          {/* Store Staff (any role that looks like storeId:Role and isn't Owner) */}
          <Route element={<RequireAuth />}>
            <Route element={<RequireRole allow={"staff"} />}>
              <Route path="/store-staff">
                <Route path="home" element={<StoreStaffHome />} />
                {/* Add more store-staff routes here */}
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
