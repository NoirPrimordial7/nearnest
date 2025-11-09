// src/pages/register-store/CreateStore.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Auth/AuthContext";
import { createStore } from "./stores";
import s from "./register.module.css";

/* --------------- Google Maps helpers --------------- */
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
  // Parses a Google Place into our address fields and coordinates
  const out = {
    line1: "", city: "", state: "", pin: "", country: "",
    formatted: place?.formatted_address || place?.name || "",
    placeId: place?.place_id || "", lat: null, lng: null,
  };
  const comps = place?.address_components || [];
  for (const c of comps) {
    if (c.types.includes("street_number")) out.line1 = c.long_name + " " + out.line1;
    if (c.types.includes("route"))         out.line1 = (out.line1 + c.long_name).trim();
    if (c.types.includes("locality"))     out.city   = c.long_name;
    if (c.types.includes("administrative_area_level_1")) out.state = c.long_name;
    if (c.types.includes("country"))      out.country = c.short_name || c.long_name;
    if (c.types.includes("postal_code"))  out.pin    = c.long_name;
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
    // Pattern ".../@lat,lng,..." 
    const at = u.pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (at) return { lat: Number(at[1]), lng: Number(at[2]) };
    // Pattern "...?q=lat,lng"
    if (u.searchParams.has("q")) {
      const parts = u.searchParams.get("q").split(",");
      if (parts.length >= 2) return { lat: Number(parts[0]), lng: Number(parts[1]) };
    }
  } catch {}
  return null;
}

/* --------------- LocationEditor Component --------------- */
function LocationEditor({ value, onChange }) {
  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [googleObj, setGoogleObj] = useState(null);
  const [addr, setAddr] = useState(value?.formatted || "");
  const [lat, setLat] = useState(value?.lat ?? null);
  const [lng, setLng] = useState(value?.lng ?? null);
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState("");

  const searchRef = useRef(null);
  const mapRef = useRef(null);
  const gmap = useRef(null);
  const gmarker = useRef(null);
  const geocoder = useRef(null);

  // Load Google Maps API
  useEffect(() => {
    let mounted = true;
    loadGoogle(mapsKey).then((g) => mounted && setGoogleObj(g || null));
    return () => { mounted = false; };
  }, [mapsKey]);

  // Initialize Autocomplete and Map
  useEffect(() => {
    if (!googleObj) return;
    // Autocomplete input
    if (searchRef.current && !searchRef.current.__ac) {
      const ac = new googleObj.maps.places.Autocomplete(searchRef.current, {
        fields: ["address_components", "formatted_address", "geometry", "place_id"],
      });
      searchRef.current.__ac = ac;
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        const ex = extractFromPlace(place);
        setAddr(ex.formatted);
        setLat(ex.lat);
        setLng(ex.lng);
        onChange?.({
          ...ex,
          line1: ex.line1 || "", city: ex.city || "",
          state: ex.state || "", pin: ex.pin || "", country: ex.country || "IN",
        });
        // Move map to the selection
        if (gmap.current && ex.lat != null && ex.lng != null) {
          const p = { lat: ex.lat, lng: ex.lng };
          gmap.current.setCenter(p);
          gmarker.current.setPosition(p);
        }
      });
    }
    // Initialize map and marker
    if (mapRef.current && !gmap.current) {
      const center = (lat != null && lng != null)
        ? { lat, lng }
        : { lat: 18.5204, lng: 73.8567 }; // default to Pune
      gmap.current = new googleObj.maps.Map(mapRef.current, {
        center, zoom: 15, disableDefaultUI: true, clickableIcons: false,
      });
      gmarker.current = new googleObj.maps.Marker({
        position: center, map: gmap.current, draggable: true,
      });
      geocoder.current = new googleObj.maps.Geocoder();
      // On pin drag end: reverse geocode
      gmarker.current.addListener("dragend", async () => {
        const p = gmarker.current.getPosition();
        const nlat = p.lat();
        const nlng = p.lng();
        setLat(nlat);
        setLng(nlng);
        try {
          const { results } = await geocoder.current.geocode({ location: { lat: nlat, lng: nlng } });
          if (results && results[0]) {
            const ex = extractFromPlace(results[0]);
            ex.lat = nlat; ex.lng = nlng;
            setAddr(ex.formatted);
            onChange?.({
              ...ex,
              line1: ex.line1 || "", city: ex.city || "",
              state: ex.state || "", pin: ex.pin || "", country: ex.country || "IN",
            });
          } else {
            onChange?.({
              formatted: addr || "Pinned location",
              lat: nlat, lng: nlng, placeId: "",
            });
          }
        } catch {
          onChange?.({
            formatted: addr || "Pinned location",
            lat: nlat, lng: nlng, placeId: "",
          });
        }
      });
    }
  }, [googleObj]); // run once after googleObj loads

  const useGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nlat = pos.coords.latitude;
        const nlng = pos.coords.longitude;
        setLat(nlat); setLng(nlng);
        if (googleObj && gmap.current) {
          const p = { lat: nlat, lng: nlng };
          gmap.current.setCenter(p);
          gmarker.current.setPosition(p);
        }
        onChange?.({
          formatted: addr || "Current location",
          lat: nlat, lng: nlng, placeId: "",
        });
      },
      () => {}
    );
  };

  // Parse pasted link or address and geocode
  const applyLink = async () => {
    setLinkError("");
    const trimmed = link.trim();
    // Try parsing as Google Maps URL
    const parsed = parseGmapsLink(trimmed);
    if (parsed) {
      const nlat = parsed.lat, nlng = parsed.lng;
      setLat(nlat); setLng(nlng);
      if (googleObj && gmap.current) {
        const p = { lat: nlat, lng: nlng };
        gmap.current.setCenter(p);
        gmarker.current.setPosition(p);
      }
      // Try reverse geocoding to get address
      if (geocoder.current) {
        try {
          const { results } = await geocoder.current.geocode({ location: { lat: nlat, lng: nlng } });
          if (results && results[0]) {
            const ex = extractFromPlace(results[0]);
            ex.lat = nlat; ex.lng = nlng;
            setAddr(ex.formatted);
            onChange?.({
              ...ex,
              line1: ex.line1 || "", city: ex.city || "",
              state: ex.state || "", pin: ex.pin || "", country: ex.country || "IN",
            });
            return;
          }
        } catch {
          // fall through to fallback
        }
      }
      // Fallback if geocoder not available or no results
      onChange?.({
        formatted: addr || "Pinned location",
        lat: nlat, lng: nlng, placeId: "",
      });
      return;
    }
    // Otherwise treat input as an address to geocode
    if (geocoder.current) {
      try {
        const { results } = await geocoder.current.geocode({ address: trimmed });
        if (results && results[0]) {
          const ex = extractFromPlace(results[0]);
          setAddr(ex.formatted);
          setLat(ex.lat);
          setLng(ex.lng);
          onChange?.({
            ...ex,
            line1: ex.line1 || "", city: ex.city || "",
            state: ex.state || "", pin: ex.pin || "", country: ex.country || "IN",
          });
          if (gmap.current) {
            const p = { lat: ex.lat, lng: ex.lng };
            gmap.current.setCenter(p);
            gmarker.current.setPosition(p);
          }
          return;
        }
      } catch {
        // ignore
      }
    }
    setLinkError("Unable to parse address or link.");
  };

  return (
    <div className={s["lp-wrap"]}>
      <label className={s["lp-label"]}>Search or enter address</label>
      <div className={s["lp-row"]}>
        <input
          ref={searchRef}
          className={s["lp-input"]}
          placeholder={googleObj ? "Type and pick from suggestions…" : "Street, City, PIN"}
          autoComplete="off"
          value={addr}
          onChange={(e) => {
            setAddr(e.target.value);
            onChange?.({ formatted: e.target.value, lat, lng, placeId: "" });
          }}
        />
      </div>
      <div className={s["lp-row"]}>
        <input
          className={s["lp-input"]}
          placeholder="Paste Google Maps link or address (optional)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        <button type="button" className={s["lp-btn"]} onClick={applyLink}>
          Parse link
        </button>
        <button type="button" className={`${s["lp-btn"]} ${s.ghost}`} onClick={useGPS}>
          Use my location
        </button>
      </div>
      {linkError && (
        <div style={{ color: 'red', fontSize: 12, marginTop: 4 }}>
          {linkError}
        </div>
      )}
      {googleObj ? (
        <div ref={mapRef} className={s["lp-map"]} style={{ height: 260 }} />
      ) : lat != null && lng != null ? (
        <div className={s["lp-map"]} style={{ height: 260 }}>
          <iframe
            title="map"
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0 }}
            src={`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`}
            allowFullScreen
          />
        </div>
      ) : null}
      {lat != null && lng != null && (
        <div className={s["lp-meta"]}>
          Coordinates: {lat.toFixed(6)}, {lng.toFixed(6)}
        </div>
      )}
    </div>
  );
}

/* --------------- CreateStore Component --------------- */
export default function CreateStore() {
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
    category: "",
    tagsInput: ""
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  function onPick(addr) {
    // Update form state when LocationEditor gives a new address object
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
      geo: addr.lat != null && addr.lng != null
        ? { lat: Number(addr.lat), lng: Number(addr.lng) }
        : null,
    }));
  }

  async function submit() {
    if (!user?.uid) return setErr("You must be signed in.");
    if (!form.name.trim()) return setErr("Please enter a store name.");
    // Validate location has formatted address, coordinates, and city
    if (!form.formatted || !form.geo || form.geo.lat == null || form.geo.lng == null || !form.address.city) {
      return setErr("Please select a valid location using the map or search.");
    }
    if (!form.category) return setErr("Please select a store category.");

    setErr("");
    setBusy(true);
    try {
      const tagsArray = form.tagsInput
        ? form.tagsInput.split(",").map((t) => t.trim()).filter((t) => t)
        : [];
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
        category: form.category,
        tags: tagsArray,
        gstin: null,
        hours: null,
        geo: form.geo,
        ownerAddr: { line1: "", city: "", state: "", pin: "", country: "IN" },
        placeId: form.placeId || null,
        formatted: form.formatted || null,
      });
      nav(`/upload-docs/${id}`); // proceed to next step
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
        <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
          <button onClick={() => nav(-1)} aria-label="Go back"
                  style={{ height: 36, padding: "0 12px", borderRadius: 10,
                           background: "#f2f4f7", border: "1px solid #e6e9ef",
                           fontWeight: 700, cursor: "pointer", marginRight: 8 }}>
            ← Back
          </button>
          <h2 className={s.h1} style={{ margin: 0 }}>Register a Store</h2>
        </div>

        <div className={s.sub}>Basic details for onboarding & verification.</div>

        <label className={s.label}>Store name</label>
        <input
          className={s.input}
          placeholder="e.g., Gholap Pharmacy"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />

        <div className={s.section}>
          <label className={s.label}>Address</label>
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
            <div className={s.hint} style={{ marginTop: 6, color: form.geo && form.address.city ? "green" : undefined }}>
              {form.geo && form.address.city ? "✅ Location saved: " : "Selected: "}
              {form.formatted}
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

        <div className={`${s.section} ${s.grid2}`}>
          <div>
            <label className={s.label}>Category</label>
            <select
              className={s.input}
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              <option value="">Select category</option>
              <option>Pharmacy</option>
              <option>Medical Store</option>
              <option>Clinic</option>
              <option>Diagnostic / Lab</option>
              <option>Pet Pharmacy</option>
              <option>Wellness & Essentials</option>
            </select>
          </div>
          <div>
            <label className={s.label}>Tags (optional)</label>
            <input
              className={s.input}
              placeholder="e.g. 24x7, Prescription"
              value={form.tagsInput}
              onChange={(e) => setForm((f) => ({ ...f, tagsInput: e.target.value }))}
            />
          </div>
        </div>

        {err && (
          <div style={{
            marginTop: 12, padding: "10px 12px", border: "1px solid #fecaca",
            background: "#fee2e2", color: "#991B1B", borderRadius: 12, fontWeight: 600
          }}>
            {err}
          </div>
        )}

        <div className={s.btnRow}>
          <button className={s.ghost} onClick={() => nav(-1)}>← Back</button>
          <button className={s.primary} disabled={busy} onClick={submit}>
            {busy ? "Creating…" : "Create store"}
          </button>
        </div>
      </div>
    </div>
  );
}
