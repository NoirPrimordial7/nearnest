// src/components/LocationPicker.jsx
import React, { useEffect, useRef, useState } from "react";

/** Load Google Maps JS once (if a key exists); else resolve null */
function loadGoogle(key) {
  if (window.__gmapsPromise) return window.__gmapsPromise;
  window.__gmapsPromise = new Promise((resolve) => {
    if (!key) return resolve(null);
    // Already loaded?
    if (window.google && window.google.maps) return resolve(window.google);

    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&v=quarterly`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve(window.google ?? null);
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
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

/** Extract lat/lng from common Google Maps URLs (…/@lat,lng… or ?q=lat,lng) */
function parseGoogleMapsLink(url) {
  try {
    const u = new URL(url.trim());
    // pattern 1: /@lat,lng,zoom
    const at = u.pathname.match(/@(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)/);
    if (at) return { lat: Number(at[1]), lng: Number(at[3]) };
    // pattern 2: ?q=lat,lng
    if (u.searchParams.has("q")) {
      const q = u.searchParams.get("q").split(",");
      if (q.length >= 2) return { lat: Number(q[0]), lng: Number(q[1]) };
    }
  } catch {}
  return null;
}

export default function LocationPicker({ value, onChange }) {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [googleObj, setGoogleObj] = useState(null);

  const [manualAddr, setManualAddr] = useState(value?.formatted || "");
  const [lat, setLat] = useState(value?.lat ?? null);
  const [lng, setLng] = useState(value?.lng ?? null);
  const [link, setLink] = useState("");

  const searchRef = useRef(null);
  const mapRef = useRef(null);
  const gmap = useRef(null);
  const gmarker = useRef(null);
  const geocoder = useRef(null);

  // Load Google (if key exists)
  useEffect(() => {
    let isMounted = true;
    loadGoogle(key).then((g) => {
      if (!isMounted) return;
      setGoogleObj(g || null);
    });
    return () => (isMounted = false);
  }, [key]);

  // Initialize autocomplete + map if Google is available
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
        const extracted = extractFromPlace(place);
        setManualAddr(extracted.formatted || "");
        setLat(extracted.lat);
        setLng(extracted.lng);
        onChange?.({
          ...extracted,
          line1: extracted.line1 || "",
          city: extracted.city || "",
          state: extracted.state || "",
          pin: extracted.pin || "",
          country: extracted.country || "IN",
        });
        // Pan map
        if (gmap.current && extracted.lat != null && extracted.lng != null) {
          const pos = { lat: extracted.lat, lng: extracted.lng };
          gmap.current.setCenter(pos);
          gmarker.current.setPosition(pos);
        }
      });
    }

    // Map + marker
    if (mapRef.current && !gmap.current) {
      const center = lat != null && lng != null ? { lat, lng } : { lat: 18.5204, lng: 73.8567 }; // Pune default
      gmap.current = new googleObj.maps.Map(mapRef.current, {
        center,
        zoom: 15,
        mapId: "nearNest-lite",
        disableDefaultUI: true,
        clickableIcons: false,
      });
      gmarker.current = new googleObj.maps.Marker({
        position: center,
        map: gmap.current,
        draggable: true,
      });
      geocoder.current = new googleObj.maps.Geocoder();

      gmarker.current.addListener("dragend", async () => {
        const p = gmarker.current.getPosition();
        const nlat = p.lat();
        const nlng = p.lng();
        setLat(nlat);
        setLng(nlng);

        // Reverse geocode to formatted address
        try {
          const { results } = await geocoder.current.geocode({ location: { lat: nlat, lng: nlng } });
          const best = results?.[0];
          const extracted = extractFromPlace(best || {});
          extracted.lat = nlat;
          extracted.lng = nlng;
          setManualAddr(extracted.formatted || manualAddr);
          onChange?.({
            ...extracted,
            line1: extracted.line1 || "",
            city: extracted.city || "",
            state: extracted.state || "",
            pin: extracted.pin || "",
            country: extracted.country || "IN",
          });
        } catch {
          onChange?.({ formatted: manualAddr, lat: nlat, lng: nlng, placeId: "" });
        }
      });
    }
  }, [googleObj]); // eslint-disable-line

  // Helpers (always available)
  const useMyLocation = () => {
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
        onChange?.({ formatted: manualAddr || "Current location", lat: nlat, lng: nlng, placeId: "" });
      },
      () => {}
    );
  };

  const applyLink = () => {
    const parsed = parseGoogleMapsLink(link);
    if (!parsed) return;
    setLat(parsed.lat);
    setLng(parsed.lng);
    if (googleObj && gmap.current) {
      const p = { lat: parsed.lat, lng: parsed.lng };
      gmap.current.setCenter(p);
      gmarker.current.setPosition(p);
    }
    onChange?.({ formatted: manualAddr || "Pinned location", lat: parsed.lat, lng: parsed.lng, placeId: "" });
  };

  return (
    <div className="lp-wrap">
      {/* Search / manual address */}
      <label className="lp-label">Search or enter address</label>
      <input
        ref={searchRef}
        className="lp-input"
        placeholder={googleObj ? "Type and pick from suggestions…" : "Street, City, PIN"}
        value={manualAddr}
        onChange={(e) => {
          setManualAddr(e.target.value);
          onChange?.({ formatted: e.target.value, lat, lng, placeId: "" });
        }}
      />

      {/* Extra helpers */}
      <div className="lp-row">
        <input
          className="lp-input"
          placeholder="Paste a Google Maps link (optional)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        <button type="button" className="lp-btn" onClick={applyLink}>
          Parse link
        </button>
        <button type="button" className="lp-btn ghost" onClick={useMyLocation}>
          Use my location
        </button>
      </div>

      {/* Lat / Lng manual edit */}
      <div className="lp-row">
        <input
          className="lp-input"
          placeholder="Latitude"
          value={lat ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            setLat(v === "" ? null : Number(v));
            onChange?.({ formatted: manualAddr, lat: v === "" ? null : Number(v), lng, placeId: "" });
          }}
        />
        <input
          className="lp-input"
          placeholder="Longitude"
          value={lng ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            setLng(v === "" ? null : Number(v));
            onChange?.({ formatted: manualAddr, lat, lng: v === "" ? null : Number(v), placeId: "" });
          }}
        />
        {lat != null && lng != null ? (
          <a
            className="lp-btn ghost"
            href={`https://maps.google.com/?q=${lat},${lng}`}
            target="_blank"
            rel="noreferrer"
          >
            Open map
          </a>
        ) : null}
      </div>

      {/* Map: Google map if available; else an iframe preview if coords exist */}
      {googleObj ? (
        <div ref={mapRef} className="lp-map" style={{ height: 260 }} />
      ) : lat != null && lng != null ? (
        <div className="lp-map" style={{ height: 260 }}>
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
        <div className="lp-meta">
          ⚠️ Autocomplete & draggable pin need a valid <code>VITE_GOOGLE_MAPS_API_KEY</code>.
          The fallback above still lets you paste a link or use your GPS.
        </div>
      )}
    </div>
  );
}
