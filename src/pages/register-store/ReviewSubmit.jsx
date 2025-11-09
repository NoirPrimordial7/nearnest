// src/pages/Stores/ReviewSubmit.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../Auth/AuthContext";
import { getStore, submitStoreForVerification } from "../register-store/stores";
import {
  fetchVerificationDocsOnce,
  REQUIRED_KINDS,
  KIND_META,
  hasAllRequired,
} from "../register-store/verification";

export default function ReviewSubmit() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth() || {};

  const [store, setStore] = useState(null);
  const [docs, setDocs] = useState([]);
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const [s, d] = await Promise.all([getStore(id), fetchVerificationDocsOnce(id)]);
      setStore(s);
      setDocs(d);
    })();
  }, [id]);

  const addr = useMemo(() => {
    const a = store?.address;
    if (!a) return "—";
    return [a.line1, a.city, a.state, a.pin, a.country].filter(Boolean).join(", ");
  }, [store]);

  const requiredMap = useMemo(() => {
    const map = new Map();
    docs.forEach((d) => map.set(d.kind, d));
    return map;
  }, [docs]);

  const ready = hasAllRequired(docs) && agree;

  async function onConfirm() {
    if (!ready || !user?.uid) return;
    setSubmitting(true);
    try {
      await submitStoreForVerification(id, user.uid);
      // Important: replace = true to avoid a back/forward loop
      nav(`/verification-status/${id}`, { replace: true, state: { from: "review" } });
    } finally {
      setSubmitting(false);
    }
  }

  if (!store) return <div style={{ padding: 24 }}>Loading…</div>;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 20% -10%, rgba(0,0,0,.05), transparent 60%), radial-gradient(1400px 800px at 120% 10%, rgba(0,0,0,.05), transparent 60%), linear-gradient(#f6f7f9, #ffffff)",
        padding: 28,
      }}
    >
      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          background: "rgba(255,255,255,.92)",
          backdropFilter: "blur(6px)",
          border: "1px solid #eceff3",
          borderRadius: 24,
          boxShadow: "0 30px 60px rgba(0,0,0,.10), 0 1px 0 rgba(255,255,255,.8) inset",
          padding: 24,
          display: "grid",
          gap: 18,
        }}
      >
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => nav(`/verification-status/${id}`)}
            aria-label="Back to Status"
            style={{
              height: 36,
              padding: "0 12px",
              borderRadius: 10,
              background: "#f2f4f7",
              border: "1px solid #e6e9ef",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
          <h1 style={{ margin: 0 }}>Review & Submit</h1>
        </div>

        {/* Summary card */}
        <div
          style={{
            border: "1px solid #eceff3",
            borderRadius: 16,
            padding: 16,
            background: "#fff",
            boxShadow: "0 12px 24px rgba(0,0,0,.06)",
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Store information</div>
          <div style={{ color: "#6b7280" }}>
            <div><b>Name:</b> {store.name || "—"}</div>
            <div><b>Address:</b> {addr}</div>
            <div><b>Category:</b> {store.category || "—"}</div>
            <div><b>License No.:</b> {store.licenseNo || "—"}</div>
            {store.gstin ? <div><b>GSTIN:</b> {store.gstin}</div> : null}
          </div>
        </div>

        {/* Docs checklist */}
        <div
          style={{
            border: "1px solid #eceff3",
            borderRadius: 16,
            padding: 16,
            background: "#fff",
            boxShadow: "0 12px 24px rgba(0,0,0,.06)",
            display: "grid",
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 800 }}>Uploaded documents</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(280px, 1fr))",
              gap: 10,
            }}
          >
            {REQUIRED_KINDS.map((k) => {
              const d = requiredMap.get(k);
              return (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    border: "1px solid #eef1f5",
                    borderRadius: 12,
                    background: d ? "#f8fffb" : "#fff8f8",
                  }}
                >
                  <span style={{ fontSize: 18 }}>{KIND_META[k].icon}</span>
                  <div style={{ fontWeight: 700 }}>{KIND_META[k].label}</div>
                  <div style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280" }}>
                    {d ? (
                      <a href={d.url} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>
                        Open
                      </a>
                    ) : (
                      "Missing"
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Confirmation */}
        <label style={{ display: "flex", alignItems: "center", gap: 10, color: "#1b1e23" }}>
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          I confirm that the details and documents are correct and belong to this store.
        </label>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            onClick={() => nav(`/verification-status/${id}`)}
            style={{
              height: 44,
              padding: "0 16px",
              borderRadius: 12,
              border: "1px solid #d6dae0",
              background: "#fff",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            ← Edit info
          </button>

          <button
            onClick={onConfirm}
            disabled={!ready || submitting}
            style={{
              height: 44,
              padding: "0 18px",
              borderRadius: 12,
              border: 0,
              fontWeight: 900,
              background: ready ? "#111" : "#b9bec7",
              color: "#fff",
              cursor: ready ? "pointer" : "not-allowed",
              boxShadow: ready ? "0 16px 34px rgba(0,0,0,.18)" : "none",
            }}
          >
            {submitting ? "Submitting…" : "Confirm & Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
