// src/auth/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "./firebase";
import { auth, db } from "./firebase";
import { doc, getDoc } from "./firebase";
import { Navigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const docRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setRoles(userData.roles || []);
          } else {
            setRoles([]);
          }
        } catch (error) {
          console.error("Error fetching user roles:", error);
          setRoles([]);
        }
      } else {
        setUser(null);
        setRoles([]);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, roles, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const RoleRedirect = () => {
  const { user, roles, authLoading } = useAuth();

  if (authLoading) return null;

  if (!user) return <Navigate to="/signin" replace />;
  if (roles.includes("admin")) return <Navigate to="/admin" replace />;
  if (roles.includes("storeAdmin")) return <Navigate to="/store-admin/home" replace />;
  if (roles.includes("storeStaff")) return <Navigate to="/store-staff/home" replace />;

  return <Navigate to="/home" replace />;
};
