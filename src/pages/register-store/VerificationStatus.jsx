// src/pages/Stores/VerificationStatus.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../Auth/AuthContext";
import { getStore } from "../register-store/stores";
import {
  uploadVerificationDoc,
  listenVerificationDocs,
  KIND_META,
  REQUIRED_KINDS,
} from "../register-store/verification";
import "./verification-status.css";


/* ----------------------- small helpers ----------------------- */
function statusClass(s) {
  if (s === "Approved") return "chip chipGreen";
  if (s === "Rejected") return "chip chipRed";
  return "chip chipBlue"; // Pending / Under Review
}
function StatusBadge({ value }) {
  return <span className={statusClass(value || "Pending")}>{value || "Pending"}</span>;
}
function fmtBytes(n = 0) {
  if (!n) return "—";
  const kb = n / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}
function tsToDate(ts) {
  if (!ts) return "—";
  try {
    if (typeof ts === "number") return new Date(ts).toLocaleString();
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
    return new Date(ts).toLocaleString();
  } catch {
    return "—";
  }
}

/* ============================================================ */

export default function VerificationStatus() {
  const { id } = useParams();
  const storeId = id;
  const nav = useNavigate();
  const { user } = useAuth() || {};

  const [store, setStore] = useState(null);
  const [docs, setDocs] = useState([]); // [{id, status, url, size, mime, remark, updatedAt, uploadedAt}]
  const [busyKind, setBusyKind] = useState(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("documents");

  useEffect(() => {
    if (!storeId) return;
    (async () => setStore(await getStore(storeId)))();
    const unsub = listenVerificationDocs(
      storeId,
      (rows) => setDocs(rows || []),
      () => setErr("Missing or insufficient permissions.")
    );
    return () => unsub && unsub();
  }, [storeId]);

  const prettyAddress = useMemo(() => {
    const a = store?.address;
    if (!a) return "—";
    return [a.line1, a.city, a.state, a.pin, a.country].filter(Boolean).join(", ");
  }, [store]);

  const anyUploaded = docs && docs.length > 0;
  const allRequiredPresent = REQUIRED_KINDS.every((k) => docs.find((d) => d.id === k));

  // derive page-level status (purely for the header stepper)
  const headerStatus =
    store?.verificationStatus ||
    (allRequiredPresent ? "Under Review" : anyUploaded ? "Submitted" : "Pending");

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

  function DocumentTile({ kind }) {
    const meta = KIND_META[kind] || { label: kind.toUpperCase(), icon: "📄" };
    const existing = docs.find((d) => d.id === kind);
    const locked = existing && existing.status !== "Rejected"; // lock on Pending / Approved
    const inputId = `file-${kind}`;

    return (
      <div className="tile">
        <div className="tileHead">
          <div className="tileIcon">{meta.icon || "📄"}</div>
          <div className="tileMeta">
            <div className="tileTitle">{meta.label || kind}</div>
            <StatusBadge value={existing?.status || "Pending"} />
          </div>
        </div>

        {/* body */}
        <div className="tileBody">
          {!existing && (
            <p className="hint">Accepted: PDF or image (≤ ~10MB recommended). Upload once, then it locks for review.</p>
          )}
          {existing && (
            <div className="docInfoRow">
              <div className="docInfo">
                <span className="docTag">{existing.mime || "document"}</span>
                <span className="docTag">{fmtBytes(existing.size)}</span>
                {existing.uploadedAt && <span className="docTag">Uploaded: {tsToDate(existing.uploadedAt)}</span>}
                {existing.updatedAt && <span className="docTag">Updated: {tsToDate(existing.updatedAt)}</span>}
              </div>
            </div>
          )}
        </div>

        {/* footer actions */}
        <div className="tileFooter">
          {existing?.url && (
            <a className="btn btnGhost" href={existing.url} target="_blank" rel="noreferrer">
              Preview
            </a>
          )}

          {/* Upload/Replace logic */}
          {(!existing || existing.status === "Rejected") && (
            <label htmlFor={inputId} className="btn btnDark" title="Upload document">
              <input
                id={inputId}
                type="file"
                accept="image/*,.pdf"
                disabled={!!busyKind}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) doUpload(kind, f);
                }}
                style={{ display: "none" }}
              />
              {busyKind === kind ? "Uploading…" : existing ? "Re-upload" : "Upload"}
            </label>
          )}

          {locked && (
            <span className="lockPill" title="Locked until admin reviews">
              <span className="lockIcon" aria-hidden>🔒</span> Locked by system
            </span>
          )}
        </div>

        {/* Rejection note */}
        {existing?.status === "Rejected" && existing?.remark && (
          <div className="rejectionNote">
            <strong>Admin Note:</strong> {existing.remark}
          </div>
        )}
      </div>
    );
  }

  if (!store) return <div className="loading">Loading…</div>;

  return (
    <div className="screen">
      <div className="card">
        {/* header */}
        <div className="header">
          <div className="headerLeft">
            <h1 className="title">{store.name || "Untitled Store"}</h1>
            <div className="subtle">{prettyAddress}</div>
          </div>
          <div className="headerRight">
            <StatusBadge value={headerStatus} />
          </div>
        </div>

        {/* stepper */}
        <div className="stepper">
          {["Submitted", "Under Review", "Verified"].map((s, i) => {
            const active =
              (headerStatus === "Approved" && s === "Verified") ||
              (headerStatus === "Under Review" && (s === "Submitted" || s === "Under Review")) ||
              (headerStatus === "Submitted" && s === "Submitted") ||
              (headerStatus === "Pending" && i === 0);
            return (
              <div key={s} className={`step ${active ? "stepActive" : ""}`}>
                <div className="dot" />
                <div className="stepLabel">{s}</div>
              </div>
            );
          })}
        </div>

        {/* tabs */}
        <div className="tabs">
          {[
            ["documents", "Documents"],
            ["info", "Store Info"],
            ["activity", "Activity"],
            ["location", "Location"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`tab ${tab === key ? "tabActive" : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {err && <div className="error">{err}</div>}

        {/* ======= TAB: DOCUMENTS ======= */}
        <section className={`section ${tab === "documents" ? "" : "hidden"}`}>
          <h3 className="h3">Verification Documents</h3>
          <p className="hint">
            Upload each required document once. After upload, it’s <strong>locked</strong> until the admin approves or
            rejects it. You can only re-upload when the status becomes <strong>Rejected</strong>.
          </p>

          <div className="grid">
            {REQUIRED_KINDS.map((k) => (
              <DocumentTile key={k} kind={k} />
            ))}
          </div>

          {/* Additional / optional docs (if your backend adds more kinds) */}
          {docs.filter((d) => !REQUIRED_KINDS.includes(d.id)).length > 0 && (
            <>
              <div className="rowBetween" style={{ marginTop: 12 }}>
                <h4 className="h4">Additional Files</h4>
              </div>
              <ul className="list">
                {docs
                  .filter((d) => !REQUIRED_KINDS.includes(d.id))
                  .map((d) => (
                    <li className="listItem" key={d.id}>
                      <div className="listMain">
                        <div className="fileName">{KIND_META[d.id]?.label || d.id}</div>
                        <div className="fileMeta">
                          {d.mime || "document"} • {fmtBytes(d.size)} • Uploaded: {tsToDate(d.uploadedAt)}
                        </div>
                      </div>
                      <div className="listRight">
                        {d.url && (
                          <a className="btn btnGhost" href={d.url} target="_blank" rel="noreferrer">
                            Preview
                          </a>
                        )}
                        <StatusBadge value={d.status || "Pending"} />
                      </div>
                    </li>
                  ))}
              </ul>
            </>
          )}

          <div className="note">
            Once your documents are approved, your store will be marked as <b>Verified</b>. If any file is rejected,
            you’ll see the admin note and a <b>Re-upload</b> button for that specific file.
          </div>

          <div className="footerCtas">
            <button className="btn btnGhost" onClick={() => nav("/support/raise")}>
              Contact Support
            </button>
            {store?.verificationStatus === "Approved" && (
              <button className="btn btnDark" onClick={() => nav(`/store/${storeId}/dashboard`)}>
                Go to Store Dashboard
              </button>
            )}
          </div>
        </section>

        {/* ======= TAB: INFO ======= */}
        <section className={`section ${tab === "info" ? "" : "hidden"}`}>
          <h3 className="h3">Store Information</h3>
          <div className="infoGrid">
            <div className="infoCard">
              <div className="infoLabel">Store Name</div>
              <div className="infoValue">{store.name || "—"}</div>
            </div>
            <div className="infoCard">
              <div className="infoLabel">Phone</div>
              <div className="infoValue">{store.phone || "—"}</div>
            </div>
            <div className="infoCard wide">
              <div className="infoLabel">Address</div>
              <div className="infoValue">{prettyAddress}</div>
            </div>
            <div className="infoCard">
              <div className="infoLabel">License No.</div>
              <div className="infoValue">{store.licenseNo || "—"}</div>
            </div>
            <div className="infoCard">
              <div className="infoLabel">GSTIN</div>
              <div className="infoValue">{store.gstin || "—"}</div>
            </div>
            <div className="infoCard">
              <div className="infoLabel">Owner (UID)</div>
              <div className="infoValue">{store.ownerId || "—"}</div>
            </div>
            <div className="infoCard">
              <div className="infoLabel">Verification</div>
              <div className="infoValue">
                <StatusBadge value={store.verificationStatus || "Pending"} />
              </div>
            </div>
          </div>
          <div className="note" style={{ marginTop: 16 }}>
            If something is incorrect, raise a request from <b>Support</b>. Store details are locked while verification
            is in progress.
          </div>
        </section>

        {/* ======= TAB: ACTIVITY ======= */}
        <section className={`section ${tab === "activity" ? "" : "hidden"}`}>
          <h3 className="h3">Activity</h3>
          <ul className="timeline">
            {docs.length === 0 && <li className="timelineItem subtle">No activity yet.</li>}
            {docs
              .slice()
              .sort((a, b) => (a.updatedAt?.seconds || 0) < (b.updatedAt?.seconds || 0) ? 1 : -1)
              .map((d) => (
                <li key={d.id} className="timelineItem">
                  <div className="tlDot" />
                  <div className="tlContent">
                    <div className="tlTitle">
                      {KIND_META[d.id]?.label || d.id} – <StatusBadge value={d.status || "Pending"} />
                    </div>
                    <div className="tlMeta">
                      {d.updatedAt ? `Updated: ${tsToDate(d.updatedAt)}` : `Uploaded: ${tsToDate(d.uploadedAt)}`}
                      {d.remark ? ` • Note: ${d.remark}` : ""}
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        </section>

        {/* ======= TAB: LOCATION ======= */}
        <section className={`section ${tab === "location" ? "" : "hidden"}`}>
          <h3 className="h3">Location</h3>
          {!store?.geo ? (
            <div className="note">No geolocation saved for this store.</div>
          ) : (
            <div className="mapCard">
              <div className="mapHeader">
                <div>
                  <div className="infoLabel">Coordinates</div>
                  <div className="infoValue">
                    {store.geo.lat}, {store.geo.lng}
                  </div>
                </div>
                {store.placeId && (
                  <a
                    className="btn btnGhost"
                    href={`https://www.google.com/maps/search/?api=1&query=${store.geo.lat},${store.geo.lng}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in Maps
                  </a>
                )}
              </div>
              <div className="mapPlaceholder">Map preview</div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
