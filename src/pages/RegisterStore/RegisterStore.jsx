// src/pages/RegisterStore/RegisterStore.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createStore } from "../../services/stores";
import s from "./register.module.css";

/* -------------------------------------------------------
   Tiny helpers for LocationEditor (no external deps)
--------------------------------------------------------*/
function loadGoogle(key) {
  if (window.__gmapsPromise) return window.__gmapsPromise;
  window.__gmapsPromise = new Promise((resolve) => {
    if (!key) return resolve(null);
    if (window.google?.maps) return resolve(window.google);
    const el = document.createElement("script");
    el.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&v=quarterly`;
    el.async = true;
    el.defer = true;
    el.onload = () => resolve(window.google ?? null);
    el.onerror = () => resolve(null);
    document.head.appendChild(el);
  });
  return window.__gmapsPromise;
}
function extractFromPlace(place) {
  const out = {
    line1: "",
    city: "",
    state: "",
    pin: "",
    country: "",
    formatted: place?.formatted_address || place?.name || "",
    placeId: place?.place_id || "",
    lat: null,
    lng: null,
  };
  const comps = place?.address_components || [];
  for (const c of comps) {
    if (c.types.includes("street_number")) out.line1 = c.long_name + " " + out.line1;
    if (c.types.includes("route")) out.line1 = (out.line1 + c.long_name).trim();
    if (c.types.includes("locality")) out.city = c.long_name;
    if (c.types.includes("administrative_area_level_1")) out.state = c.long_name;
    if (c.types.includes("country")) out.country = c.short_name || c.long_name;
    if (c.types.includes("postal_code")) out.pin = c.long_name;
  }
  const loc = place?.geometry?.location;
  if (loc) {
    out.lat = typeof loc.lat === "function" ? loc.lat() : loc.lat;
    out.lng = typeof loc.lng === "function" ? loc.lng() : loc.lng;
  }
  return out;
}
function parseGmapsLink(url) {
  try {
    const u = new URL(url.trim());
    const at = u.pathname.match(/@(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)/);
    if (at) return { lat: Number(at[1]), lng: Number(at[3]) };
    if (u.searchParams.has("q")) {
      const parts = u.searchParams.get("q").split(",");
      if (parts.length >= 2) return { lat: Number(parts[0]), lng: Number(parts[1]) };
    }
  } catch {}
  return null;
}

/* -------------------------------------------------------
   LocationEditor (INLINE, always renders UI)
--------------------------------------------------------*/
function LocationEditor({ value, onChange }) {
  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [googleObj, setGoogleObj] = useState(null);

  const [addr, setAddr] = useState(value?.formatted || "");
  const [lat, setLat] = useState(value?.lat ?? null);
  const [lng, setLng] = useState(value?.lng ?? null);
  const [link, setLink] = useState("");

  const searchRef = useRef(null);
  const mapRef = useRef(null);
  const gmap = useRef(null);
  const gmarker = useRef(null);
  const geocoder = useRef(null);

  useEffect(() => {
    let mounted = true;
    loadGoogle(mapsKey).then((g) => mounted && setGoogleObj(g || null));
    return () => (mounted = false);
  }, [mapsKey]);

  useEffect(() => {
    if (!googleObj) return;

    // Autocomplete
    if (searchRef.current && !searchRef.current.__ac) {
      const ac = new googleObj.maps.places.Autocomplete(searchRef.current, {
        fields: ["address_components", "formatted_address", "geometry", "name", "place_id"],
      });
      searchRef.current.__ac = ac;
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        const ex = extractFromPlace(place);
        setAddr(ex.formatted || "");
        setLat(ex.lat);
        setLng(ex.lng);
        onChange?.({
          ...ex,
          line1: ex.line1 || "",
          city: ex.city || "",
          state: ex.state || "",
          pin: ex.pin || "",
          country: ex.country || "IN",
        });
        if (gmap.current && ex.lat != null && ex.lng != null) {
          const p = { lat: ex.lat, lng: ex.lng };
          gmap.current.setCenter(p);
          gmarker.current.setPosition(p);
        }
      });
    }

    // Map + marker
    if (mapRef.current && !gmap.current) {
      const center = lat != null && lng != null ? { lat, lng } : { lat: 18.5204, lng: 73.8567 }; // Pune
      gmap.current = new googleObj.maps.Map(mapRef.current, {
        center,
        zoom: 15,
        disableDefaultUI: true,
        clickableIcons: false,
      });
      gmarker.current = new googleObj.maps.Marker({ position: center, map: gmap.current, draggable: true });
      geocoder.current = new googleObj.maps.Geocoder();

      gmarker.current.addListener("dragend", async () => {
        const p = gmarker.current.getPosition();
        const nlat = p.lat();
        const nlng = p.lng();
        setLat(nlat);
        setLng(nlng);
        try {
          const { results } = await geocoder.current.geocode({ location: { lat: nlat, lng: nlng } });
          const best = results?.[0];
          const ex = extractFromPlace(best || {});
          ex.lat = nlat;
          ex.lng = nlng;
          setAddr(ex.formatted || addr);
          onChange?.({
            ...ex,
            line1: ex.line1 || "",
            city: ex.city || "",
            state: ex.state || "",
            pin: ex.pin || "",
            country: ex.country || "IN",
          });
        } catch {
          onChange?.({ formatted: addr || "Pinned location", lat: nlat, lng: nlng, placeId: "" });
        }
      });
    }
  }, [googleObj]); // eslint-disable-line

  const useGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nlat = pos.coords.latitude;
        const nlng = pos.coords.longitude;
        setLat(nlat);
        setLng(nlng);
        if (googleObj && gmap.current) {
          const p = { lat: nlat, lng: nlng };
          gmap.current.setCenter(p);
          gmarker.current.setPosition(p);
        }
        onChange?.({ formatted: addr || "Current location", lat: nlat, lng: nlng, placeId: "" });
      },
      () => {}
    );
  };

  const applyLink = () => {
    const parsed = parseGmapsLink(link);
    if (!parsed) return;
    setLat(parsed.lat);
    setLng(parsed.lng);
    if (googleObj && gmap.current) {
      const p = { lat: parsed.lat, lng: parsed.lng };
      gmap.current.setCenter(p);
      gmarker.current.setPosition(p);
    }
    onChange?.({ formatted: addr || "Pinned location", lat: parsed.lat, lng: parsed.lng, placeId: "" });
  };

  // Simple inline styles (no CSS-module issues)
  const row = { display: "flex", gap: 8, marginTop: 8 };
  const input = { flex: 1, height: 40, border: "1px solid #e5e7eb", borderRadius: 10, padding: "0 10px", background: "#f8fafc" };
  const btn = { height: 40, borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 800, padding: "0 12px", cursor: "pointer" };
  const ghost = { ...btn, background: "#fff", color: "#111" };

  return (
    <div style={{ marginTop: 10 }}>
      <label className={s.label}>Search or enter address</label>
      <input
        ref={searchRef}
        style={input}
        placeholder={googleObj ? "Type and pick from suggestions…" : "Street, City, PIN"}
        value={addr}
        onChange={(e) => {
          setAddr(e.target.value);
          onChange?.({ formatted: e.target.value, lat, lng, placeId: "" });
        }}
      />

      <div style={row}>
        <input
          style={input}
          placeholder="Paste a Google Maps link (optional)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        <button type="button" style={btn} onClick={applyLink}>Parse link</button>
        <button type="button" style={ghost} onClick={useGPS}>Use my location</button>
      </div>

      <div style={row}>
        <input
          style={input}
          placeholder="Latitude"
          value={lat ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            setLat(v === "" ? null : Number(v));
            onChange?.({ formatted: addr, lat: v === "" ? null : Number(v), lng, placeId: "" });
          }}
        />
        <input
          style={input}
          placeholder="Longitude"
          value={lng ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            setLng(v === "" ? null : Number(v));
            onChange?.({ formatted: addr, lat, lng: v === "" ? null : Number(v), placeId: "" });
          }}
        />
        {lat != null && lng != null ? (
          <a
            href={`https://maps.google.com/?q=${lat},${lng}`}
            target="_blank"
            rel="noreferrer"
            style={ghost}
          >
            Open map
          </a>
        ) : null}
      </div>

      {googleObj ? (
        <div ref={mapRef} style={{ height: 260, marginTop: 8, borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }} />
      ) : lat != null && lng != null ? (
        <div style={{ height: 260, marginTop: 8, borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <iframe
            title="map"
            width="100%"
            height="260"
            frameBorder="0"
            style={{ border: 0 }}
            src={`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`}
            allowFullScreen
          />
        </div>
      ) : null}

      {!googleObj && (
        <div style={{ marginTop: 8, color: "#475569" }}>
          ⚠️ Autocomplete & draggable pin need a valid <code>VITE_GOOGLE_MAPS_API_KEY</code>.  
          Fallback still works (paste link / GPS / manual lat-lng).
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------
   Register Store Page
--------------------------------------------------------*/
export default function RegisterStore() {
  const nav = useNavigate();
  const { user } = useAuth() || {};

  const [form, setForm] = useState({
    name: "",
    phone: "",
    licenseNo: "",
    address: { line1: "", city: "", state: "", pin: "", country: "IN" },
    geo: null,
    formatted: "",
    placeId: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  function onPick(addr) {
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
        addr.lat != null && addr.lng != null
          ? { lat: Number(addr.lat), lng: Number(addr.lng) }
          : null,
    }));
  }

  async function submit() {
    if (!user?.uid) return setErr("You must be signed in.");
    if (!form.name.trim()) return setErr("Please enter a store name.");
    if (!form.formatted && !form.address.line1 && !form.geo)
      return setErr("Pick the store location (search, pin, paste link or GPS).");

    setErr("");
    setBusy(true);
    try {
      const id = await createStore(user.uid, {
        name: form.name.trim(),
        address: {
          line1: form.address.line1 || form.formatted || "",
          city: form.address.city,
          state: form.address.state,
          pin: form.address.pin,
          country: form.address.country || "IN",
        },
        phone: form.phone || "",
        licenseNo: form.licenseNo || "",
        category: "Pharmacy",
        gstin: null,
        hours: null,
        geo: form.geo,
        ownerAddr: { line1: "", city: "", state: "", pin: "", country: "IN" },
        placeId: form.placeId || null,
        formatted: form.formatted || null,
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
            Search your address or drop the pin. You can also paste a Google Maps link or use your current location.
          </div>
          <LocationEditor
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
              onChange={(e) => setForm((f) => ({ ...f, licenseNo: e.target.value }))}
            />
          </div>
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
