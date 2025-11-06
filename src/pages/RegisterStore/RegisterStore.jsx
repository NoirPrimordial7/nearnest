// src/pages/RegisterStore/RegisterStore.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createStore } from "../../services/stores";
import LocationPicker from "../../components/LocationPicker";
import s from "./register.module.css";

export default function RegisterStore() {
  const nav = useNavigate();
  const { user } = useAuth() || {};

  const [form, setForm] = useState({
    name: "",
    phone: "",
    licenseNo: "",
    // address object will be filled from LocationPicker/extraction
    address: { line1: "", city: "", state: "", pin: "", country: "IN" },
    geo: null,
    formatted: "",
    placeId: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const onPick = (addr) => {
    setForm((f) => ({
      ...f,
      address: {
        line1: addr.line1 || "",
        city: addr.city || "",
        state: addr.state || "",
        pin: addr.pin || "",
        country: addr.country || "IN",
      },
      formatted: addr.formatted || "",
      placeId: addr.placeId || "",
      geo:
        addr.lat && addr.lng
          ? { lat: Number(addr.lat), lng: Number(addr.lng) }
          : null,
    }));
  };

  async function submit() {
    if (!user?.uid) {
      setErr("You must be signed in.");
      return;
    }
    if (!form.name.trim()) {
      setErr("Please enter a store name.");
      return;
    }
    if (!form.address.line1 && !form.formatted) {
      setErr("Please choose the store address (use the search or pin on the map).");
      return;
    }
    setErr("");
    setBusy(true);
    try {
      const id = await createStore(user.uid, {
        name: form.name,
        address: {
          line1: form.address.line1 || form.formatted || "",
          city: form.address.city,
          state: form.address.state,
          pin: form.address.pin,
          country: form.address.country || "IN",
        },
        phone: form.phone,
        licenseNo: form.licenseNo,
        category: "Pharmacy",
        gstin: null,
        hours: null,
        geo: form.geo,
        ownerAddr: {
          line1: "",
          city: "",
          state: "",
          pin: "",
          country: "IN",
        },
      });
      nav(`/verification-status/${id}`);
    } catch (e) {
      console.error(e);
      setErr("Failed to create store. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={s.wrap}>
      <div className={s.card}>
        <h2 className={s.h1}>Register a Store</h2>
        <div className={s.sub}>Basic details for onboarding & verification.</div>

        <label className={s.label}>Store name*</label>
        <input
          className={s.input}
          placeholder="e.g., Gholap Pharmacy"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />

        <div className={s.section}>
          <label className={s.label}>Address*</label>
          <div className={s.hint}>
            Search your address or drop the pin. You can also paste a Google Maps
            link or use your current location.
          </div>
          <LocationPicker
            value={
              form.geo
                ? { ...form.address, formatted: form.formatted, ...form.geo }
                : { ...form.address, formatted: form.formatted }
            }
            onChange={onPick}
          />
          {form.formatted ? (
            <div className={s.hint} style={{ marginTop: 6 }}>
              Selected: {form.formatted}
            </div>
          ) : null}
        </div>

        <div className={`${s.section} ${s.grid2}`}>
          <div>
            <label className={s.label}>Phone</label>
            <input
              className={s.input}
              placeholder="+91-9xxxxxxxxx"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div>
            <label className={s.label}>License No.</label>
            <input
              className={s.input}
              placeholder="DL/XX/XXXX"
              value={form.licenseNo}
              onChange={(e) =>
                setForm((f) => ({ ...f, licenseNo: e.target.value }))
              }
            />
          </div>
        </div>

        {err ? (
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
        ) : null}

        <div className={s.btnRow}>
          <button className={s.primary} disabled={busy} onClick={submit}>
            {busy ? "Creating…" : "Create store"}
          </button>
          <button className={s.ghost} onClick={() => history.back()}>
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
