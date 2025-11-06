// src/pages/RegisterStore/ConfirmStart.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createStore } from "../../services/stores";

export default function ConfirmStart() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    licenseNumber: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e?.preventDefault?.();
    setErr("");

    if (!user?.uid) return setErr("Sign in required.");
    if (!form.name.trim() || !form.address.trim()) {
      return setErr("Name and address are required.");
    }

    try {
      setBusy(true);

      // Map simple address string -> minimal structure allowed by rules
      const addrLine = form.address.trim();
      const storeId = await createStore(user.uid, {
        name: form.name.trim(),
        phone: form.phone || "",
        licenseNo: form.licenseNumber || "",
        address: { line1: addrLine, city: "", state: "", pin: "", country: "IN" },
        formatted: addrLine,
        placeId: null,
        geo: null,
      });

      // Go to status page (under-verification list routes here)
      nav(`/verification-status/${storeId}`, { replace: true });
    } catch (e2) {
      console.error(e2);
      setErr("Could not create the store. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fb", padding: "40px 16px" }}>
      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 20px 50px rgba(0,0,0,.10)",
          padding: 24,
        }}
      >
        {/* Header + Back / Next */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => nav(-1)}
            style={{
              height: 38,
              padding: "0 14px",
              borderRadius: 10,
              background: "#f2f4f7",
              border: "1px solid #e6e9ef",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={onSubmit}
            style={{
              height: 38,
              padding: "0 16px",
              borderRadius: 10,
              background: "#111",
              color: "#fff",
              border: 0,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Save & Continue →
          </button>
        </div>

        <h1 style={{ margin: 0, fontSize: 26 }}>Register a Store</h1>
        <p style={{ color: "#6b7280", marginTop: 6 }}>
          Basic details for onboarding & verification.
        </p>

        {err ? (
          <div
            style={{
              background: "#fee2e2",
              color: "#991B1B",
              padding: 10,
              borderRadius: 8,
              marginTop: 8,
            }}
          >
            {err}
          </div>
        ) : null}

        <form onSubmit={onSubmit} style={{ marginTop: 18, display: "grid", gap: 12 }}>
          <div>
            <label style={{ fontWeight: 700 }}>Store name*</label>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="e.g., Gholap Pharmacy"
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                borderRadius: 10,
                border: "1px solid #e5e7eb",
              }}
            />
          </div>

          <div>
            <label style={{ fontWeight: 700 }}>Address*</label>
            <input
              name="address"
              value={form.address}
              onChange={onChange}
              placeholder="Street, City, PIN"
              style={{
                width: "100%",
                marginTop: 6,
                padding: 10,
                borderRadius: 10,
                border: "1px solid #e5e7eb",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontWeight: 700 }}>Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={onChange}
                placeholder="+91-9xxxxxxxxx"
                style={{
                  width: "100%",
                  marginTop: 6,
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 700 }}>License No.</label>
              <input
                name="licenseNumber"
                value={form.licenseNumber}
                onChange={onChange}
                placeholder="DL/XX/XXXX"
                style={{
                  width: "100%",
                  marginTop: 6,
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <button
              disabled={busy}
              style={{
                height: 46,
                padding: "0 18px",
                fontWeight: 800,
                color: "#fff",
                borderRadius: 999,
                border: 0,
                background: "#111",
                cursor: "pointer",
              }}
            >
              {busy ? "Creating…" : "Create store"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
