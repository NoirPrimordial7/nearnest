// src/pages/Stores/VerificationStatus.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getStore } from "../../services/stores";
import {
  uploadVerificationDoc,
  listenVerificationDocs,
  KIND_META,
  REQUIRED_KINDS,
  hasAllRequired,
} from "../../services/verification";

export default function VerificationStatus() {
  const { id } = useParams();
  const storeId = id;
  const nav = useNavigate();
  const { user } = useAuth() || {};

  const [store, setStore] = useState(null);
  const [docs, setDocs] = useState([]);
  const [busyKind, setBusyKind] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!storeId) return;
    (async () => setStore(await getStore(storeId)))();
    const unsub = listenVerificationDocs(
      storeId,
      (rows) => setDocs(rows),
      () => setErr("Missing or insufficient permissions.")
    );
    return () => unsub && unsub();
  }, [storeId]);

  const prettyAddress = useMemo(() => {
    const a = store?.address;
    if (!a) return "—";
    return [a.line1, a.city, a.state, a.pin, a.country].filter(Boolean).join(", ");
  }, [store]);

  const readyForReview = hasAllRequired(docs);

  const statusBadge = (s) => {
    const base = { padding: "4px 10px", borderRadius: 999, fontWeight: 800, fontSize: 12, display: "inline-block" };
    if (s === "Approved") return <span style={{ ...base, background: "#dcfce7", color: "#166534" }}>Approved</span>;
    if (s === "Rejected") return <span style={{ ...base, background: "#fee2e2", color: "#991B1B" }}>Rejected</span>;
    return <span style={{ ...base, background: "#e0f2fe", color: "#075985" }}>Pending</span>;
  };

  async function doUpload(kind, file) {
    if (!file || !user?.uid || !storeId) return;
    try {
      setErr("");
      setBusyKind(kind);
      await uploadVerificationDoc(user.uid, storeId, file, kind);
    } catch (e) {
      console.error(e);
      setErr("Upload failed. Try again.");
    } finally {
      setBusyKind(null);
    }
  }

  function UploaderCard({ kind }) {
    const meta = KIND_META[kind];
    const existing = docs.find((d) => d.id === kind); // for required kinds, docId === kind
    const inputId = `file-${kind}`;
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #eceff3",
          borderRadius: 16,
          padding: 16,
          boxShadow: "0 12px 24px rgba(0,0,0,.06)",
          display: "grid",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800 }}>
          <span style={{ fontSize: 18 }}>{meta.icon}</span>
          <span>{meta.label}</span>
          <span style={{ marginLeft: "auto" }}>{statusBadge(existing?.status || "Pending")}</span>
        </div>

        {!existing ? (
          <>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Accepted: PDF or image. Max ~10MB recommended.</div>
            <label
              htmlFor={inputId}
              style={{
                alignSelf: "start",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                height: 40,
                padding: "0 16px",
                borderRadius: 12,
                background: "#111",
                color: "#fff",
                fontWeight: 800,
                cursor: busyKind ? "not-allowed" : "pointer",
                boxShadow: "0 12px 24px rgba(0,0,0,.18)",
                opacity: busyKind && busyKind !== kind ? 0.6 : 1,
              }}
            >
              <input
                id={inputId}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) doUpload(kind, f);
                }}
                disabled={!!busyKind}
                style={{ display: "none" }}
              />
              {busyKind === kind ? "Uploading…" : "Upload"}
            </label>
          </>
        ) : (
          <div style={{ fontSize: 12, color: "#6b7280", display: "grid", gap: 6 }}>
            <div>
              {existing.mime || "document"} • {Math.round((existing.size || 0) / 1024)} KB •{" "}
              <a href={existing.url} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>
                Open
              </a>
            </div>
            <label
              htmlFor={inputId}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 34,
                padding: "0 12px",
                borderRadius: 10,
                background: "#111",
                color: "#fff",
                fontWeight: 800,
                cursor: busyKind ? "not-allowed" : "pointer",
                width: "fit-content",
              }}
            >
              <input
                id={inputId}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) doUpload(kind, f);
                }}
                disabled={!!busyKind}
                style={{ display: "none" }}
              />
              Replace
            </label>
          </div>
        )}
      </div>
    );
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
          maxWidth: 1100,
          margin: "0 auto",
          background: "rgba(255,255,255,.9)",
          backdropFilter: "blur(6px)",
          border: "1px solid #eceff3",
          borderRadius: 24,
          boxShadow: "0 30px 60px rgba(0,0,0,.10), 0 1px 0 rgba(255,255,255,.8) inset",
          padding: 28,
        }}
      >
        <header style={{ display: "grid", gap: 6, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 28, letterSpacing: 0.2 }}>{store.name || "Untitled store"}</h1>
            <div style={{ marginLeft: "auto" }}>{statusBadge(store.verificationStatus || "Pending")}</div>
          </div>
          <div style={{ color: "#6b7280" }}>{prettyAddress}</div>
        </header>

        <section style={{ display: "grid", gap: 14 }}>
          <h3 style={{ margin: 0 }}>Documents</h3>
          <p style={{ color: "#6b7280", margin: 0 }}>
            Upload the required documents for verification. You can re-upload if something is rejected.
          </p>

          {err && (
            <div
              style={{
                background: "#fee2e2",
                color: "#991B1B",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #fecaca",
                fontWeight: 600,
              }}
            >
              {err}
            </div>
          )}

          {/* Grid – spaced & aligned */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {REQUIRED_KINDS.map((k) => (
              <UploaderCard key={k} kind={k} />
            ))}
          </div>

          <div
            style={{
              marginTop: 4,
              color: "#6b7280",
              background: "#f7f8fb",
              border: "1px dashed #e1e5ea",
              borderRadius: 14,
              padding: 14,
            }}
          >
            After review, admin will mark each file as <b>Approved</b> or <b>Rejected</b>. Rejected files can be
            uploaded again.
          </div>

          {/* Footer actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <button
              onClick={() => nav(`/review-submit/${storeId}`)}
              disabled={!readyForReview}
              style={{
                height: 46,
                padding: "0 18px",
                border: "0",
                borderRadius: 14,
                fontWeight: 900,
                background: readyForReview ? "#111" : "#b9bec7",
                color: "#fff",
                cursor: readyForReview ? "pointer" : "not-allowed",
                boxShadow: readyForReview ? "0 16px 34px rgba(0,0,0,.18)" : "none",
              }}
              title={readyForReview ? "Review & Submit" : "Upload all required documents to continue"}
            >
              Review & Submit →
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
