import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getStore, uploadStoreDocument, listenStoreDocs } from "../../services/stores";

export default function VerificationStatus() {
  const { id } = useParams();      // /verification-status/:id
  const storeId = id;
  const { user } = useAuth() || {};
  const [store, setStore] = useState(null);
  const [docs, setDocs] = useState([]);
  const [busyKind, setBusyKind] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!storeId) return;
    (async () => setStore(await getStore(storeId)))();
    const unsub = listenStoreDocs(
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

  const badge = (s) => {
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
      await uploadStoreDocument(storeId, file, kind);
    } catch (e) {
      setErr("Upload failed. Try again.");
    } finally {
      setBusyKind(null);
    }
  }

  function makeInput(kind, label, accept = "image/*,.pdf") {
    const inputId = `file-${kind}`;
    return (
      <div key={kind} style={{ display: "grid", gap: 6 }}>
        <label
          htmlFor={inputId}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            height: 44,
            padding: "0 16px",
            borderRadius: 12,
            background: "#111",
            color: "#fff",
            fontWeight: 800,
            cursor: busyKind ? "not-allowed" : "pointer",
            opacity: busyKind && busyKind !== kind ? 0.6 : 1,
          }}
        >
          <input
            id={inputId}
            type="file"
            accept={accept}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) doUpload(kind, f);
            }}
            disabled={!!busyKind}
            style={{ display: "none" }}
          />
          {busyKind === kind ? `Uploading ${label}…` : `Upload ${label}`}
        </label>
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          Accepted: PDF or image. Max ~10MB recommended.
        </div>
      </div>
    );
  }

  if (!store) return <div style={{ padding: 24 }}>Loading…</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fb", padding: 24 }}>
      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 20px 50px rgba(0,0,0,.10)",
          padding: 24,
        }}
      >
        <header style={{ display: "grid", gap: 4 }}>
          <h1 style={{ margin: 0 }}>{store.name || "Untitled store"}</h1>
          <div style={{ color: "#6b7280" }}>{prettyAddress}</div>
          <div style={{ marginTop: 8 }}>{badge(store.verificationStatus || "Pending")}</div>
        </header>

        <section
          style={{
            marginTop: 24,
            borderTop: "1px solid #eee",
            paddingTop: 16,
            display: "grid",
            gap: 16,
          }}
        >
          <h3 style={{ margin: 0 }}>Documents</h3>
          <p style={{ color: "#6b7280", margin: 0 }}>
            Upload the required documents for verification. You can re-upload if something is rejected.
          </p>

          {err && (
            <div style={{ background: "#fee2e2", color: "#991B1B", padding: 10, borderRadius: 8 }}>
              {err}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 14,
            }}
          >
            {makeInput("aadhaar", "Aadhaar (Owner)")}
            {makeInput("pan", "PAN (Owner)")}
            {makeInput("property", "Rent Agreement / Property Proof")}
            {makeInput("drugLicense", "Drug License")}
            {makeInput("storePhoto", "Store Photo (front view)")}
            {makeInput("other", "Any other")}
          </div>

          <div
            style={{
              marginTop: 18,
              color: "#6b7280",
              background: "#f7f8fb",
              border: "1px dashed #e1e5ea",
              borderRadius: 12,
              padding: 14,
            }}
          >
            After review, admin will mark each file as <b>Approved</b> or <b>Rejected</b>. Rejected files can be uploaded again.
          </div>

          <div style={{ marginTop: 16 }}>
            <h4 style={{ margin: "6px 0" }}>Uploaded</h4>
            {docs.length === 0 ? (
              <div style={{ color: "#6b7280" }}>No documents yet.</div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {docs.map((d) => (
                  <li
                    key={d.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 0",
                      borderBottom: "1px solid #f0f2f5",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{d.name || d.kind || "Document"}</div>
                      <a href={d.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#2563eb" }}>
                        Open
                      </a>
                    </div>
                    <div style={{ justifySelf: "end" }}>{badge(d.status || "Pending")}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
