// src/components/RequireProfile.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function RequireProfile({ children }) {
  const nav = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const u = auth.currentUser;
    if (!u) { nav("/signin", { replace: true }); return; }
    getDoc(doc(db, "users", u.uid)).then(snap => {
      if (!snap.exists() || snap.data()?.profileComplete === false) {
        nav("/setup-profile", { replace: true });
      } else {
        setChecked(true);
      }
    }).catch(() => setChecked(true));
  }, [nav]);

  if (!checked) return <div style={{padding:24}}>Loading…</div>;
  return children;
}
