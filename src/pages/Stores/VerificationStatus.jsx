// src/pages/Stores/VerificationStatus.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../../firebase/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { uploadStoreDocument } from "../../services/stores";
import { uploadVerificationDoc, listenVerificationDocs } from "../../services/verification";

export default function VerificationStatus() {
  const { id } = useParams();
  const [store, setStore] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "stores", id), (snap) => {
      if (snap.exists()) setStore({ id: snap.id, ...snap.data() });
    });
    return unsub;
  }, [id]);

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    try {
      setErr("");
      setBusy(true);
      await uploadStoreDocument(id, file);
    } catch (e2) {
      console.error(e2);
      setErr("Upload failed. Try again.");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  if (!store) {
    return (
      <div style={{ padding: 24 }}>Loading…</div>
    );
  }

  const badge = (s) => {
    const base = {
      padding: "4px 10px",
      borderRadius: 999,
      fontWeight: 800,
      fontSize: 12,
      display: "inline-block",
    };
    if (s === "Approved") return <span style={{ ...base, background: "#dcfce7", color: "#166534" }}>Approved</span>;
    if (s === "Rejected") return <span style={{ ...base, background: "#fee2e2", color: "#991B1B" }}>Rejected</span>;
    return <span style={{ ...base, background: "#e0f2fe", color: "#075985" }}>Pending</span>;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fb", padding: 24 }}>
      <div style={{
        maxWidth: 900, margin: "0 auto", background: "#fff",
        borderRadius: 18, boxShadow: "0 20px 50px rgba(0,0,0,.10)", padding: 24
      }}>
        <h1 style={{ marginTop: 0 }}>{store.name || "Untitled store"}</h1>
        <div style={{ color: "#6b7280" }}>{store.address || "—"}</div>
        <div style={{ marginTop: 10 }}>{badge(store.verificationStatus || "Pending")}</div>

        <div style={{ marginTop: 24, borderTop: "1px solid #eee", paddingTop: 16 }}>
          <h3>Documents</h3>
          <p style={{ color: "#6b7280", marginTop: 4 }}>
            Upload registration/license documents for verification.
          </p>

          {err ? <div style={{ background: "#fee2e2", color: "#991B1B", padding: 10, borderRadius: 8 }}>{err}</div> : null}

          <label style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            height: 44, padding: "0 16px", borderRadius: 12, background: "#111", color: "#fff",
            fontWeight: 800, cursor: busy ? "not-allowed" : "pointer"
          }}>
            <input type="file" accept="image/*,.pdf"
              onChange={onUpload} disabled={busy}
              style={{ display: "none" }} />
            {busy ? "Uploading…" : "Upload document"}
          </label>

          <div style={{ marginTop: 18, color: "#6b7280" }}>
            After review, status will update to <b>Approved</b> or <b>Rejected</b>.
          </div>
        </div>
      </div>
    </div>
  );
}
