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
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebase";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <AuthCtx.Provider value={{ user, authLoading }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
