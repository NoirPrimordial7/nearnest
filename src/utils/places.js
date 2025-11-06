// src/utils/places.js
import { Loader } from "@googlemaps/js-api-loader";

let loader;
/** Load Google Maps JS API (Places included) once and reuse. */
export async function getGoogle() {
  if (!loader) {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) throw new Error("Missing VITE_GOOGLE_MAPS_API_KEY in .env");
    loader = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["places"],
    });
  }
  return loader.load(); // resolves to window.google
}

/** Extract lat/lng if user pastes a Google Maps link. Handles common formats. */
export function parseLatLngFromUrl(url) {
  try {
    const u = new URL(url);

    // 1) New style: ".../@18.5204,73.8567,15z"
    const at = u.pathname.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (at) return { lat: Number(at[1]), lng: Number(at[2]) };

    // 2) Query params: q=18.5204,73.8567  OR ll=  OR center=
    const keys = ["q", "ll", "center"];
    for (const k of keys) {
      const v = u.searchParams.get(k);
      if (v && v.includes(",")) {
        const [lat, lng] = v.split(",").map(Number);
        if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
      }
    }
  } catch (_) {}
  return null;
}

/** Pulls a few useful address fields from PlaceResult */
export function extractAddr(place) {
  const out = {
    formatted: place.formatted_address || "",
    placeId: place.place_id || "",
    lat: null,
    lng: null,
    line1: "",
    city: "",
    state: "",
    pin: "",
    country: "",
  };

  if (place.geometry?.location) {
    out.lat = place.geometry.location.lat();
    out.lng = place.geometry.location.lng();
  }

  const byType = (t) =>
    (place.address_components || []).find((c) => c.types.includes(t)) || null;

  out.line1 =
    (byType("street_number")?.long_name || "") +
    (byType("route") ? " " + byType("route").long_name : "");

  out.city =
    byType("locality")?.long_name ||
    byType("sublocality")?.long_name ||
    byType("administrative_area_level_2")?.long_name ||
    "";

  out.state = byType("administrative_area_level_1")?.short_name || "";
  out.pin = byType("postal_code")?.long_name || "";
  out.country = byType("country")?.short_name || "";

  return out;
}
