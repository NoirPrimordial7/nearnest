// src/components/LocationPicker.jsx
import React, { useEffect, useRef, useState } from "react";
import { getGoogle, parseLatLngFromUrl, extractAddr } from "../utils/places";

const mapStyles = {
  wrap: { display: "grid", gap: 10 },
  row: { display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8 },
  input: {
    height: 44,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    padding: "0 14px",
    outline: "none",
    fontSize: 14,
  },
  btn: {
    height: 44,
    padding: "0 14px",
    borderRadius: 12,
    fontWeight: 800,
    background: "#111",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
  map: { width: "100%", height: 260, borderRadius: 14, overflow: "hidden" },
  hint: { fontSize: 12, color: "#6b7280" },
};

export default function LocationPicker({ value, onChange }) {
  const [google, setGoogle] = useState(null);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef(null);
  const mapRef = useRef(null);
  const gmap = useRef(null);
  const marker = useRef(null);

  // Load Google once
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const g = await getGoogle();
        if (!alive) return;
        setGoogle(g);
        initMap(g);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function initMap(g) {
    const center = {
      lat: value?.lat || 18.5204, // Pune as a neutral default
      lng: value?.lng || 73.8567,
    };

    gmap.current = new g.maps.Map(mapRef.current, {
      center,
      zoom: 15,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
    });

    marker.current = new g.maps.Marker({
      position: center,
      map: gmap.current,
      draggable: true,
    });

    // Drag marker → update
    g.maps.event.addListener(marker.current, "dragend", () => {
      const pos = marker.current.getPosition();
      const lat = pos.lat();
      const lng = pos.lng();
      onChange &&
        onChange({
          ...value,
          lat,
          lng,
        });
    });

    // Places Autocomplete on the input
    const ac = new g.maps.places.Autocomplete(inputRef.current, {
      fields: [
        "address_components",
        "formatted_address",
        "geometry.location",
        "place_id",
        "name",
      ],
      types: ["geocode", "establishment"],
    });
    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (!place || !place.geometry?.location) return;
      const addr = extractAddr(place);
      marker.current.setPosition({ lat: addr.lat, lng: addr.lng });
      gmap.current.setCenter({ lat: addr.lat, lng: addr.lng });
      onChange && onChange(addr);
    });
  }

  function geolocate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (google && gmap.current && marker.current) {
          gmap.current.setCenter({ lat, lng });
          marker.current.setPosition({ lat, lng });
        }
        onChange && onChange({ ...value, lat, lng });
      },
      () => {}
    );
  }

  function pasteLink() {
    navigator.clipboard
      .readText()
      .then((txt) => {
        const hit = parseLatLngFromUrl(txt);
        if (hit && google && gmap.current && marker.current) {
          gmap.current.setCenter(hit);
          marker.current.setPosition(hit);
          onChange &&
            onChange({
              ...value,
              lat: hit.lat,
              lng: hit.lng,
            });
        }
      })
      .catch(() => {});
  }

  return (
    <div style={mapStyles.wrap}>
      <div style={mapStyles.row}>
        <input
          ref={inputRef}
          placeholder="Search address or place"
          style={mapStyles.input}
          defaultValue={value?.formatted || ""}
        />
        <button type="button" style={mapStyles.btn} onClick={geolocate}>
          Use my location
        </button>
        <button type="button" style={mapStyles.btn} onClick={pasteLink}>
          Paste link
        </button>
      </div>

      <div ref={mapRef} style={mapStyles.map}>
        {loading ? "Loading map…" : null}
      </div>

      <div style={mapStyles.hint}>
        Tip: You can drag the pin to fine-tune your exact storefront location.
      </div>
    </div>
  );
}
