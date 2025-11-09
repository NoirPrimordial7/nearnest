// src/pages/Auth/AuthContext.jsx

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db, onAuthStateChanged, doc, getDoc } from "./firebase";
import { Navigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          // Fetch user document to get roles
          const userRef = doc(db, "users", firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            const userRoles = userData.roles || [];
            setRoles(userRoles);

            // Fetch permissions for each role
            const permsSet = new Set();
            // Use Promise.all to fetch all role docs in parallel
            const permPromises = userRoles.map((roleId) =>
              getDoc(doc(db, "roles", roleId))
            );
            const roleDocs = await Promise.all(permPromises);
            roleDocs.forEach((roleDoc) => {
              if (roleDoc.exists()) {
                const roleData = roleDoc.data();
                if (Array.isArray(roleData.permissions)) {
                  roleData.permissions.forEach((p) => permsSet.add(p));
                }
              }
            });
            setPermissions(Array.from(permsSet));
          } else {
            // No user document found
            setRoles([]);
            setPermissions([]);
          }
        } catch (error) {
          console.error("Error fetching roles/permissions:", error);
          setRoles([]);
          setPermissions([]);
        }
      } else {
        // Not logged in
        setUser(null);
        setRoles([]);
        setPermissions([]);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Helper to check a permission string (exact match)
  const hasPermission = (perm) => {
    // Ensure case-sensitive match as stored in Firestore
    return permissions.includes(perm);
  };

  return (
    <AuthContext.Provider value={{ user, roles, permissions, authLoading, hasPermission }}>
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
