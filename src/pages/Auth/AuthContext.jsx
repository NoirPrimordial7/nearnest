import { createContext, useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged, auth, db, doc, getDoc } from "./firebase";

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
          const userRef = doc(db, "users", firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            const userRoles = userData.roles || [];
            setRoles(userRoles);

            // Fetch permissions from each role in roles/{role}
            let mergedPerms = [];
            for (const role of userRoles) {
              const roleSnap = await getDoc(doc(db, "roles", role));
              if (roleSnap.exists()) {
                const roleData = roleSnap.data();
                mergedPerms = [...mergedPerms, ...(roleData.permissions || [])];
              }
            }

            setPermissions(mergedPerms);
          } else {
            setRoles([]);
            setPermissions([]);
          }
        } catch (err) {
          console.error("Error loading user/role info:", err);
          setRoles([]);
          setPermissions([]);
        }
      } else {
        setUser(null);
        setRoles([]);
        setPermissions([]);
      }

      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const hasPermission = (perm) => permissions.includes(perm);

  return (
    <AuthContext.Provider
      value={{ user, roles, permissions, authLoading, hasPermission }}
    >
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
