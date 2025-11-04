// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

// Optional dev bypass via env OR localStorage.
// Env: VITE_AUTH_BYPASS=true and VITE_BYPASS_ROLE=admin|storeAdmin|staff
// You can also use localStorage.setItem("DEV_IMPERSONATE", JSON.stringify({ roles:["admin"], storeId:null }))
const readDevImpersonation = () => {
  try {
    if (import.meta.env.VITE_AUTH_BYPASS === "true") {
      const r = (import.meta.env.VITE_BYPASS_ROLE || "admin").trim();
      // Map simple aliases to the roles array we use everywhere:
      if (r === "admin") return { uid: "DEV", email: "dev@nearnest.com", roles: ["admin"], storeId: null, dev: true };
      if (r === "storeAdmin") return { uid: "DEV", email: "dev@nearnest.com", roles: ["storeAdmin", "demoStore:Owner"], storeId: "demoStore", dev: true };
      if (r === "staff") return { uid: "DEV", email: "dev@nearnest.com", roles: ["demoStore:Staff"], storeId: "demoStore", dev: true };
    }
    const fromLS = localStorage.getItem("DEV_IMPERSONATE");
    if (fromLS) {
      const parsed = JSON.parse(fromLS);
      return { uid: "DEV", email: "dev@nearnest.com", roles: parsed.roles || ["user"], storeId: parsed.storeId || null, dev: true };
    }
  } catch {}
  return null;
};

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null); // {roles:[], storeId}
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dev = readDevImpersonation();
    if (dev) {
      setFirebaseUser({ uid: dev.uid, email: dev.email });
      setProfile({ roles: dev.roles, storeId: dev.storeId, dev: true });
      setLoading(false);
      return () => {};
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      setFirebaseUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", u.uid));
        const data = snap.exists() ? snap.data() : {};
        setProfile({ roles: data.roles || ["user"], storeId: data.storeId || data.store || null, dev: false });
      } catch (e) {
        console.error("Failed to load user profile/roles:", e);
        setProfile({ roles: ["user"], storeId: null, dev: false });
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const value = useMemo(
    () => ({
      user: firebaseUser,
      roles: profile?.roles || [],
      storeId: profile?.storeId || null,
      loading,
      isDevImpersonating: !!profile?.dev,
      // Quick helpers:
      isAdmin: (profile?.roles || []).includes("admin"),
    }),
    [firebaseUser, profile, loading]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
