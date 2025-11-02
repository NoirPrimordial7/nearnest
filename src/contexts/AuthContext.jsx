// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

const isAdmin = (roles) => Array.isArray(roles) && roles.includes("admin");
const isStoreAdmin = (roles) =>
  Array.isArray(roles) && (roles.includes("storeAdmin") || roles.some((r) => r.includes(":Owner")));
const isStoreStaff = (roles) =>
  Array.isArray(roles) && roles.some((r) => r.includes(":")) && !isStoreAdmin(roles);

export const resolveHomePath = (roles) => {
  if (isAdmin(roles)) return "/admin/dashboard";
  if (isStoreAdmin(roles)) return "/store-admin/home";
  if (isStoreStaff(roles)) return "/store-staff/home";
  return "/";
};

const AuthContext = createContext({ user: null, roles: null, loading: true });
export const useAuth = () => useContext(AuthContext);

async function fetchUserRoles(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return Array.isArray(data?.roles) ? data.roles : null;
}

export function AuthProvider({ children }) {
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
