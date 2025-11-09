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

            // ⛏️ Load permissions from roles/{role}/{role} format
            let mergedPerms = [];
            for (const role of userRoles) {
              try {
                const roleDoc = doc(db, `roles/${role}/${role}`);
                const roleSnap = await getDoc(roleDoc);
                if (roleSnap.exists()) {
                  const roleData = roleSnap.data();
                  mergedPerms = [...mergedPerms, ...(roleData.permissions || [])];
                } else {
                  console.warn(`Role '${role}' not found at roles/${role}/${role}`);
                }
              } catch (err) {
                console.error(`Error fetching role '${role}':`, err);
              }
            }

            setPermissions(mergedPerms);
          } else {
            console.warn("User document not found");
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
