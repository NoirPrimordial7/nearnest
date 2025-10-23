import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase"; // adjust path if your config is elsewhere
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  if (!authChecked) {
    return <div>Loading...</div>; // Optional: replace with a spinner or skeleton
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return children;
}
