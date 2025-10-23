// src/contexts/AuthContext.jsx
import React, { useState, useEffect, useContext } from "react";
import { auth, db } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// Create Context
const AuthContext = React.createContext(null);

// Custom hook for easy context consumption
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);    // raw Firebase Auth user object
  const [userData, setUserData] = useState(null);            // profile data from Firestore
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // User is logged in, fetch their profile from Firestore
        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          setUserData(null);
        }
      } else {
        // Not logged in
        setUserData(null);
      }
      setLoading(false);
    });
    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Helper: Check if current user has a certain role or permission
  const hasRole = (role) => userData?.role === role;
  const hasPermission = (permKey) => {
    if (!userData?.role || !userData?.permissions) return false;
    return userData.permissions[permKey] === true;
  };

  const value = { firebaseUser, userData, loading, hasRole, hasPermission };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
