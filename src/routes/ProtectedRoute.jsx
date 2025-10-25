import React from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../lib/firebase.js";

export default function ProtectedRoute({ children, requireRole }) {
  const user = auth.currentUser;
  if (!user) return <Navigate to="/signin" replace />;

  // if no role requirement, allow
  if (!requireRole) return children;

  // read custom claims
  return (
    <ClaimsGate requireRole={requireRole}>
      {children}
    </ClaimsGate>
  );
}

function ClaimsGate({ children, requireRole }) {
  const [ok, setOk] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;
    auth.currentUser.getIdToken(true).then(() =>
      auth.currentUser.getIdTokenResult().then((res) => {
        const claims = res.claims || {};
        if (mounted) setOk(!!claims[requireRole] || !!claims.admin);
      })
    );
    return () => (mounted = false);
  }, [requireRole]);

  if (ok === null) return null;
  if (!ok) return <Navigate to="/admin" replace />;
  return children;
}
