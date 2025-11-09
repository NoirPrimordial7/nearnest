// src/pages/register-store/UploadDocuments.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../Auth/AuthContext";
import {
  uploadVerificationDoc,
  listenVerificationDocs,
  deleteVerificationDoc,
  REQUIRED_KINDS,
  hasAllRequired,
} from "./verification";
import { getStore } from "./stores";
import s from "./register.module.css";

const REQUIRED_FIELDS = [
  { key: "aadhaar", label: "Aadhaar (Owner)" },
  { key: "pan", label: "PAN (Owner)" },
  { key: "property", label: "Rent Agreement / Property Proof" },
  { key: "drugLicense", label: "Drug License" },
  { key: "storePhoto", label: "Store Photo (front view)" },
];

export default function UploadDocuments() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth() || {};

  const [store, setStore] = useState(null);
  const [files, setFiles] = useState({
    aadhaar: null,
    pan: null,
    property: null,
    drugLicense: null,
    storePhoto: null,
    others: [],
  });
  const [docs, setDocs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      const sdata = await getStore(id).catch(() => null);
      setStore(sdata);
      unsub = listenVerificationDocs(
        id,
        (items) => setDocs(items),
        (e) => console.error(e)
      );
    })();
    return () => unsub && unsub();
  }, [id]);

  const requiredMap = useMemo(() => {
    const m = new Map();
    docs.forEach((d) => m.set(d.kind, d));
    return m;
  }, [docs]);

  const ready = hasAllRequired(docs);

  // Back: prefer history(-1); if none, go to status page for this store
  const goBack = () => {
    if (window.history.length > 1) nav(-1);
    else nav(`/verification-status/${id}`);
  };

  const pick = (key) => (e) => {
    const file = e.target.files?.[0] || null;
    setFiles((f) => ({ ...f, [key]: file }));
  };

  const pickOthers = (e) => {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;
    setFiles((f) => ({ ...f, others: [...(f.others || []), ...list] }));
  };

  async function uploadAll() {
    if (!user?.uid) {
      setErr("You must be signed in.");
      return;
    }
    setErr("");
    setBusy(true);
    try {
      const tasks = [];
      for (const { key } of REQUIRED_FIELDS) {
        const file = files[key];
        if (file) tasks.push(uploadVerificationDoc(user.uid, id, file, key));
      }
      for (const f of files.others || []) {
        tasks.push(uploadVerificationDoc(user.uid, id, f, "other"));
      }
      await Promise.all(tasks);
      setFiles({
        aadhaar: null,
        pan: null,
        property: null,
        drugLicense: null,
        storePhoto: null,
        others: [],
      });
    } catch (e) {
      console.error(e);
      setErr("Failed to upload one or more files. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function removeDoc(docId, path) {
    setBusy(true);
    try {
      await deleteVerificationDoc(id, docId, path);
    } finally {
      setBusy(false);
    }
  }

  if (!store) {
    return <div style={{ padding: 24 }}>Loading…</div>;
  }

  return (
    <div className={s.wrap}>
      <div className={s.card}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
          <button
            onClick={goBack}
            aria-label="Go back"
            style={{
              height: 36,
              padding: "0 12px",
              borderRadius: 10,
              background: "#f2f4f7",
              border: "1px solid #e6e9ef",
              fontWeight: 700,
              cursor: "pointer",
              marginRight: 8,
            }}
          >
            ← Back
          </button>
          <h2 className={s.h1} style={{ margin: 0 }}>
            Upload Documents
          </h2>
        </div>

        <div className={s.sub}>Store: {store?.name || "—"}</div>

        {/* Required Uploaders */}
        <div className={s.section}>
          <div className={s.label}>Required documents</div>
          <div className={s.grid2}>
            {REQUIRED_FIELDS.map(({ key, label }) => {
              const existing = requiredMap.get(key);
              return (
                <div key={key} style={{ display: "grid", gap: 8 }}>
                  <div className={s.hint} style={{ fontWeight: 700 }}>
                    {label}
                  </div>
                  <input
                    className={s.input}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={pick(key)}
                  />
                  <div className={s.hint}>
                    {existing ? (
                      <span>
                        Already uploaded —{" "}
                        <a
                          href={existing.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#2563eb" }}
                        >
                          open
                        </a>{" "}
                        <button
                          type="button"
                          onClick={() => removeDoc(existing.id, existing.path)}
                          style={{
                            marginLeft: 8,
                            height: 28,
                            padding: "0 10px",
                            borderRadius: 8,
                            background: "#fff",
                            border: "1px solid #d6dae0",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Remove
                        </button>
                      </span>
                    ) : (
                      "Not uploaded"
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Others */}
        <div className={s.section}>
          <div className={s.label}>Other supporting documents (optional)</div>
          <input
            className={s.input}
            type="file"
            accept="image/*,.pdf"
            multiple
            onChange={pickOthers}
          />
          {files.others?.length ? (
            <div className={s.hint} style={{ marginTop: 8 }}>
              Selected: {files.others.map((f) => f.name).join(", ")}
            </div>
          ) : null}
        </div>

        {err && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 12px",
              border: "1px solid #fecaca",
              background: "#fee2e2",
              color: "#991B1B",
              borderRadius: 12,
              fontWeight: 600,
            }}
          >
            {err}
          </div>
        )}

        <div className={s.btnRow}>
          <button className={s.ghost} onClick={goBack}>← Back</button>
          <button
            className={s.ghost}
            onClick={() => nav(`/verification-status/${id}`)}
            title="Go to the store’s verification status"
          >
            Back to Status
          </button>
          <button className={s.primary} onClick={uploadAll} disabled={busy}>
            {busy ? "Uploading…" : "Upload All"}
          </button>
        </div>

        {/* Live list */}
        <div className={s.section}>
          <div className={s.label}>Current uploaded documents</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #eef1f5" }}>
                  <th style={{ padding: "10px 8px" }}>Kind</th>
                  <th style={{ padding: "10px 8px" }}>Name</th>
                  <th style={{ padding: "10px 8px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "10px 8px", fontWeight: 600 }}>{d.kind}</td>
                    <td style={{ padding: "10px 8px" }}>
                      <a href={d.url} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>
                        {d.name || d.id}
                      </a>
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      <button
                        onClick={() => removeDoc(d.id, d.path)}
                        style={{
                          height: 32,
                          padding: "0 12px",
                          borderRadius: 8,
                          background: "#fff",
                          border: "1px solid #d6dae0",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {!docs.length && (
                  <tr>
                    <td colSpan="3" style={{ padding: "10px 8px", color: "#6b7280" }}>
                      No documents yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Continue */}
        <div className={s.btnRow}>
          <button
            className={s.primary}
            onClick={() => nav(`/review-submit/${id}`)}
            disabled={!ready}
            title={!ready ? "Please upload all required documents first." : ""}
          >
            Continue to Review
          </button>
        </div>
      </div>
    </div>
  );
}
