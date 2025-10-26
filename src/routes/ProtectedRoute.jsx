import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../firebase";

export default function ProtectedRoute({ children }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      setAuthed(!!user);
      setVerified(!!user?.emailVerified);
      setReady(true);
    });
    return () => unsub();
  }, []);

  if (!ready) return null; // or a spinner

  if (!authed) return <Navigate to="/signin" replace />;
  if (!verified) return <Navigate to="/verify-email" replace />;

  return children;
}
