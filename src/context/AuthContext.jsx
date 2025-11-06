// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

const AuthCtx = createContext({
  user: null,
  roles: [],
  storeId: null,
  authLoading: true,
  hasRole: () => false,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [storeId, setStoreId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ⚙️ Dev bypass flags (optional, convenient for local)
  const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS === "true";
  const DEV_ROLE = import.meta.env.VITE_DEV_ROLE || "admin";
  const DEV_STORE = import.meta.env.VITE_DEV_STORE || "demoStore";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        if (!u) {
          if (DEV_BYPASS) {
            setUser({ uid: "dev-user", email: "dev@local" });
            setRoles([DEV_ROLE]);
            setStoreId(DEV_STORE);
            setAuthLoading(false);
          } else {
            setUser(null);
            setRoles([]);
            setStoreId(null);
            setAuthLoading(false);
          }
          return;
        }

        // fetch user doc for roles/store linkage
        const snap = await getDoc(doc(db, "users", u.uid));
        const data = snap.exists() ? snap.data() : {};
        const rolesFromDb = Array.isArray(data.roles) ? data.roles : [];

        setUser(u);
        setRoles(DEV_BYPASS ? [DEV_ROLE] : rolesFromDb);
        setStoreId(data.storeId || data.storeIdRef || null);
        setAuthLoading(false);
      } catch (err) {
        console.error("Auth bootstrap failed:", err);
        setUser(u || null);
        setRoles([]);
        setStoreId(null);
        setAuthLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const hasRole = useMemo(
    () => (r) => (Array.isArray(r) ? r : [r]).some((x) => roles.includes(x)),
    [roles]
  );

  const value = useMemo(
    () => ({ user, roles, storeId, authLoading, hasRole }),
    [user, roles, storeId, authLoading, hasRole]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}
