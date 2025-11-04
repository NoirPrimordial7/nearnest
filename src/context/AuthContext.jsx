// src/context/AuthContext.jsx
/*import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

const Ctx = createContext({ user: null, roles: [], storeId: null, loading: true });
export const useAuth = () => useContext(Ctx);

export default function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, roles: [], storeId: null, loading: true });

  // 🔧 env-driven dev bypass
  const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS === "true";
  const DEV_ROLE   = import.meta.env.VITE_DEV_ROLE || "admin";

  useEffect(() => {
    const stop = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          if (DEV_BYPASS) {
            setState({
              user: { uid: "dev-user", email: "dev@local" },
              roles: [DEV_ROLE],
              storeId: "demoStore",
              loading: false,
            });
          } else {
            setState({ user: null, roles: [], storeId: null, loading: false });
          }
          return;
        }

        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.exists() ? snap.data() : {};
        const rolesFromDb = Array.isArray(data.roles) ? data.roles : [];

        setState({
          user,
          roles: DEV_BYPASS ? [DEV_ROLE] : rolesFromDb,
          storeId: data.storeId || data.storeIdRef || null,
          loading: false,
        });
      } catch (e) {
        console.error("Auth bootstrap failed:", e);
        setState((s) => ({ ...s, loading: false }));
      }
    });
    return () => stop();
  }, []);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
} */
// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getAuth, onAuthStateChanged, signOut as fbSignOut } from "firebase/auth";
// Make sure your Firebase app is initialized once in src/firebase/firebase.js
// and imported somewhere early (e.g., in main.jsx). This file does NOT initialize.

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const auth = getAuth(); // uses the default app
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      // DEV role logic — replace with Firestore lookup later
      const r = u?.email?.startsWith("admin") ? "admin" : "user";
      setRole(r);
      setLoading(false);
    });
  }, [auth]);

  const value = useMemo(
    () => ({
      user,
      role,
      loading,
      signOut: () => fbSignOut(auth),
    }),
    [user, role, loading, auth]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx) ?? { user: null, role: null, loading: true };
}
