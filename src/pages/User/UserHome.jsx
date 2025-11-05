// src/pages/User/UserHome.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listenUserStores } from "../../services/stores";

export default function UserHome() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [stores, setStores] = useState(null); // null = loading
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = listenUserStores(user.uid, setStores, setError);
    return () => unsub && unsub();
  }, [user?.uid]);

  const Wrapper = ({ children }) => (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#f7f7f7,#ffffff)",
        padding: "56px 20px",
        color: "#111",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>{children}</div>
    </div>
  );

  if (!user) {
    return (
      <Wrapper>
        <div style={{ display: "grid", placeItems: "center", height: "50vh", fontWeight: 600 }}>
          Redirecting to sign-in…
        </div>
      </Wrapper>
    );
  }

  if (error?.code === "permission-denied") {
    return (
      <Wrapper>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>NearNest</h1>
        <p style={{ color: "#6b7280", marginBottom: 16 }}>
          We can’t read your stores due to Firestore rules (<b>permission-denied</b>).
        </p>
        <p style={{ marginBottom: 24 }}>
          Deploy the rules below and reload. For the demo, you can use the “auth-only” dev rules.
        </p>
        <button
          onClick={() => nav("/register-store")}
          style={{ padding: "10px 16px", borderRadius: 999, background: "#111", color: "#fff", border: 0, fontWeight: 600 }}
        >
          Register Store
        </button>
      </Wrapper>
    );
  }

  if (stores === null) {
    return (
      <Wrapper>
        <div style={{ display: "grid", placeItems: "center", height: "50vh", fontWeight: 600 }}>
          Loading your workspaces…
        </div>
      </Wrapper>
    );
  }

  if (!stores.length) {
    return (
      <Wrapper>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>NearNest</h1>
        <p style={{ color: "#6b7280", marginBottom: 24 }}>
          No pharmacies/stores linked to your account yet.
        </p>
        <div
          style={{
            border: "1px dashed #d1d5db",
            borderRadius: 16,
            padding: 24,
            background: "#fafafa",
          }}
        >
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>Register your first store</h2>
          <p style={{ color: "#6b7280", marginBottom: 16 }}>Submit documents and track verification status.</p>
          <button
            onClick={() => nav("/register-store")}
            style={{ padding: "10px 16px", borderRadius: 999, background: "#111", color: "#fff", border: 0, fontWeight: 600 }}
          >
            Register Store
          </button>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Your stores</h1>
        <button
          onClick={() => nav("/register-store")}
          style={{ padding: "8px 12px", borderRadius: 999, background: "#111", color: "#fff", border: 0 }}
        >
          Register store
        </button>
      </div>

      <div
        style={{
          marginTop: 20,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
          gap: 16,
        }}
      >
        {stores.map((s) => (
          <div
            key={s.id}
            onClick={() => nav(`/verification-status/${s.id}`)}
            style={{
              cursor: "pointer",
              borderRadius: 16,
              padding: 16,
              background: "#fff",
              boxShadow: "0 10px 25px rgba(0,0,0,.06)",
              border: "1px solid #eee",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{s.name || "Untitled store"}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{s.address || "—"}</div>
            <div
              style={{
                marginTop: 12,
                fontSize: 12,
                fontWeight: 700,
                display: "inline-block",
                padding: "4px 10px",
                borderRadius: 999,
                background:
                  s.verificationStatus === "Approved"
                    ? "#DCFCE7"
                    : s.verificationStatus === "Rejected"
                    ? "#FEE2E2"
                    : "#E0F2FE",
                color:
                  s.verificationStatus === "Approved"
                    ? "#166534"
                    : s.verificationStatus === "Rejected"
                    ? "#991B1B"
                    : "#075985",
              }}
            >
              {s.verificationStatus || "Pending"}
            </div>
          </div>
        ))}
      </div>
    </Wrapper>
  );
}
