/* eslint-disable max-len */
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();
const REGION = "asia-south1";
const MAX_SEARCH_MEDICINES = 20;
const MAX_AVAILABILITY_PER_MEDICINE = 5;
const MAX_NEARBY_STORES = 50;
const INDIA_BBOX = {
  minLat: 6.0,
  maxLat: 37.6,
  minLng: 68.0,
  maxLng: 97.5,
};
const GEOHASH_BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

exports.helloWorld = functions.https.onRequest((req, res) => {
  res.send("Hello from Firebase Functions!");
});

exports.searchMedicines = functions
    .region(REGION)
    .https.onCall(async (data) => {
      const queryText = normalizeString(data && data.q);
      if (queryText.length < 2) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "Search query must be at least 2 characters.",
        );
      }

      const filters = normalizeFilters(data && data.filters);
      const location = normalizeLocation(data && data.location, false);
      const radiusKm = clampNumber(data && data.radiusKm, 1, 25, 5);
      const medicineDocs = await findMedicineDocs(queryText, filters);
      const items = [];

      for (const medicineDoc of medicineDocs.slice(0, MAX_SEARCH_MEDICINES)) {
        const medicine = normalizeMedicine(medicineDoc);
        const availability = await getAvailabilityForMedicine(
            medicine.id,
            location,
            radiusKm,
            MAX_AVAILABILITY_PER_MEDICINE,
        );

        items.push({
          medicine,
          availability,
        });
      }

      return {
        query: queryText,
        items,
      };
    });

exports.nearbyStores = functions
    .region(REGION)
    .https.onCall(async (data) => {
      const location = normalizeLocation(data && data.location, false);
      const radiusKm = clampNumber(data && data.radiusKm, 1, 25, 5);
      const openNow = Boolean(data && data.filters && data.filters.openNow);
      const medicineId = normalizeString(data && data.medicineId);
      const stores = await findNearbyStores(location, radiusKm, openNow);
      const enrichedStores = [];

      for (const row of stores.slice(0, MAX_NEARBY_STORES)) {
        const availableMedicines = await getInventoryPreview(
            row.doc.ref,
            medicineId,
        );

        enrichedStores.push({
          ...normalizeStore(row.doc, row.distanceKm),
          availableMedicines,
        });
      }

      return {
        stores: enrichedStores,
      };
    });

async function findMedicineDocs(queryText, filters) {
  const candidates = new Map();
  const tokens = buildQueryTokens(queryText);

  for (const token of tokens) {
    const snapshot = await db
        .collection("medicines")
        .where("searchTokens", "array-contains", token)
        .limit(30)
        .get();

    snapshot.forEach((doc) => {
      if (medicinePassesFilters(doc.data(), queryText, filters)) {
        candidates.set(doc.id, doc);
      }
    });
  }

  if (candidates.size === 0) {
    const fallback = await db.collection("medicines").limit(100).get();
    fallback.forEach((doc) => {
      if (medicinePassesFilters(doc.data(), queryText, filters)) {
        candidates.set(doc.id, doc);
      }
    });
  }

  return Array.from(candidates.values()).sort((a, b) => {
    const aName = normalizeString(a.data().name);
    const bName = normalizeString(b.data().name);
    const aExact = aName === queryText ? 0 : 1;
    const bExact = bName === queryText ? 0 : 1;
    return aExact - bExact || aName.localeCompare(bName);
  });
}

async function getAvailabilityForMedicine(medicineId, location, radiusKm, maxRows) {
  const stores = await findNearbyStores(location, radiusKm, false);
  const rows = [];

  for (const row of stores) {
    const itemDocs = await getInventoryDocsForMedicine(row.doc.ref, medicineId);

    itemDocs.forEach((itemDoc) => {
      const itemData = itemDoc.data() || {};
      if (itemData.isActive === false || itemData.active === false) {
        return;
      }

      rows.push({
        store: normalizeStore(row.doc, row.distanceKm),
        item: normalizeInventoryItem(itemDoc, row.doc.id, medicineId),
      });
    });
  }

  return rows
      .filter((row) => row.item.inStock)
      .sort(compareAvailability)
      .slice(0, maxRows);
}

async function getInventoryDocsForMedicine(storeRef, medicineId) {
  const directDoc = await storeRef.collection("inventory").doc(medicineId).get();
  if (directDoc.exists) {
    return [directDoc];
  }

  const snapshot = await storeRef
      .collection("inventory")
      .where("medicineId", "==", medicineId)
      .limit(5)
      .get();
  return snapshot.docs;
}

async function findNearbyStores(location, radiusKm, openNow) {
  const docs = await fetchStoreDocsByGeohash(location);
  const rows = [];

  for (const doc of docs) {
    const data = doc.data() || {};
    if (!isPublicStoreData(data)) {
      continue;
    }
    if (openNow && !getOpenState(data)) {
      continue;
    }

    const distanceKm = distanceForStore(data, location);
    if (location && distanceKm > radiusKm) {
      continue;
    }

    rows.push({doc, distanceKm});
  }

  return rows.sort((a, b) => a.distanceKm - b.distanceKm);
}

async function fetchStoreDocsByGeohash(location) {
  if (location) {
    const geohash = encodeGeohash(location.lat, location.lng, 5);
    const prefix = geohash.slice(0, 4);

    try {
      const snapshot = await db
          .collection("stores")
          .orderBy("location.geohash")
          .startAt(prefix)
          .endAt(`${prefix}\uf8ff`)
          .limit(100)
          .get();

      if (!snapshot.empty) {
        return snapshot.docs;
      }
    } catch (error) {
      functions.logger.warn("nearbyStores geohash query fallback", {
        message: error.message,
      });
    }
  }

  const fallback = await db.collection("stores").limit(100).get();
  return fallback.docs;
}

async function getInventoryPreview(storeRef, medicineId) {
  let query = storeRef.collection("inventory").limit(20);

  if (medicineId) {
    query = storeRef
        .collection("inventory")
        .where("medicineId", "==", medicineId)
        .limit(20);
  }

  const snapshot = await query.get();
  return snapshot.docs
      .map((doc) => normalizeInventoryItem(doc, storeRef.id))
      .filter((item) => item.inStock);
}

function normalizeMedicine(doc) {
  const data = doc.data() || {};
  const manufacturerName =
    data.manufacturerName ||
    data.manufacturer ||
    data.brand ||
    "Unknown manufacturer";
  const saltValues = asStringArray(data.salt);
  const compositions =
    Array.isArray(data.compositions) && data.compositions.length > 0 ?
      data.compositions.map((composition, index) => normalizeComposition(composition, index)) :
      saltValues.map((salt, index) => ({
        id: `${doc.id}_composition_${index}`,
        name: salt,
        saltKey: normalizeString(salt).replace(/\s+/g, "_"),
        form: data.form || "tablet",
      }));
  const categoryIds = asStringArray(data.categoryIds);
  const therapeuticCategory = normalizeString(data.therapeuticCategory);

  return {
    id: doc.id,
    name: data.name || data.brand || "Unnamed medicine",
    nameLocalised: data.nameLocalised || null,
    aliases: asStringArray(data.aliases),
    hindiAliases: asStringArray(data.hindiAliases),
    manufacturer: {
      id: normalizeString(manufacturerName).replace(/\s+/g, "_") || "unknown",
      name: manufacturerName,
    },
    compositions,
    form: data.form || "tablet",
    packSize: data.packSize || "",
    imageUrl: data.imageUrl || "",
    requiresPrescription: Boolean(data.requiresPrescription),
    categoryIds: categoryIds.length > 0 ? categoryIds : [therapeuticCategory].filter(Boolean),
    searchTokens: asStringArray(data.searchTokens),
    similarMedicineIds: asStringArray(data.similarMedicineIds),
    variantOfMedicineId: data.variantOfMedicineId || null,
    description: data.description || null,
  };
}

function normalizeComposition(value, index) {
  if (typeof value === "string") {
    return {
      id: `composition_${index}`,
      name: value,
      saltKey: normalizeString(value).replace(/\s+/g, "_"),
      form: "tablet",
    };
  }

  const data = value || {};
  return {
    id: data.id || `composition_${index}`,
    name: data.name || data.salt || "Composition",
    saltKey: data.saltKey || normalizeString(data.name || data.salt).replace(/\s+/g, "_"),
    strengthMg: data.strengthMg || null,
    form: data.form || "tablet",
  };
}

function normalizeStore(doc, distanceKm) {
  const data = doc.data() || {};
  const address = normalizeAddress(data.address || data);
  const location = normalizeStoreLocation(data);
  const freshnessUpdatedAt = timestampToMillis(
      data.inventoryUpdatedAt ||
      data.freshnessUpdatedAt ||
      data.updatedAt ||
      data.createdAt,
  );

  return {
    id: doc.id,
    name: data.name || data.storeName || "Unnamed pharmacy",
    ownerName: data.ownerName || null,
    verified: isPublicStoreData(data),
    licenseNumber: data.licenseNumber || getNested(data, ["license", "number"]) || null,
    licenseAuthority: data.licenseAuthority || getNested(data, ["license", "issuingAuthority"]) || null,
    address,
    location,
    contact: {
      publicPhoneE164:
        getNested(data, ["contact", "publicPhoneE164"]) ||
        data.publicPhoneE164 ||
        data.publicPhone ||
        data.phone ||
        "",
      whatsapp: getNested(data, ["contact", "whatsapp"]) || data.whatsapp || null,
    },
    hours: data.hours || {},
    distanceKm: roundNumber(distanceKm || data.distanceKm || 0, 1),
    isOpenNow: getOpenState(data),
    closesAtLabel: data.closesAtLabel || data.openStatusLabel || null,
    freshnessLabel: data.freshnessLabel || formatFreshness(freshnessUpdatedAt),
    freshnessUpdatedAt,
  };
}

function normalizeInventoryItem(doc, fallbackStoreId, fallbackMedicineId) {
  const data = doc.data() || {};
  const stock = Number(data.stock || data.quantity || 0);
  const stockLabel = normalizeStockLabel(data, stock);
  const updatedAt = timestampToMillis(data.updatedAt || data.inventoryUpdatedAt);

  return {
    storeId: data.storeId || fallbackStoreId,
    medicineId: data.medicineId || fallbackMedicineId || doc.id,
    inStock: stockLabel !== "out",
    stockLabel,
    priceInr: normalizePriceInr(data),
    updatedAt,
    sku: doc.id,
  };
}

function normalizeAddress(value) {
  return {
    line1: value.line1 || value.addressLine1 || value.address || "",
    line2: value.line2 || value.area || "",
    city: value.city || "",
    state: value.state || "",
    pincode: value.pincode || value.pinCode || "",
  };
}

function normalizeStoreLocation(data) {
  const location = data.location || {};
  return {
    lat: Number(location.lat || data.lat || 0),
    lng: Number(location.lng || data.lng || 0),
    geohash: location.geohash || data.geohash || "",
  };
}

function normalizeStockLabel(data, stock) {
  const explicit = normalizeString(data.stockLabel || data.availabilityStatus);
  if (["in_stock", "low", "out"].includes(explicit)) {
    return explicit;
  }
  if (data.inStock === false || stock <= 0) {
    return "out";
  }
  if (stock <= 3 || explicit === "low_stock") {
    return "low";
  }
  return "in_stock";
}

function normalizePriceInr(data) {
  if (typeof data.priceInr === "number") {
    return data.priceInr;
  }
  if (data.price && typeof data.price.sellingPrice === "number") {
    return Math.round(data.price.sellingPrice / 100);
  }
  if (data.price && typeof data.price.mrp === "number") {
    return Math.round(data.price.mrp / 100);
  }
  return null;
}

function normalizeFilters(filters) {
  const source = filters || {};
  return {
    rxOnly: Boolean(source.rxOnly),
    otcOnly: Boolean(source.otcOnly),
    categoryId: normalizeString(source.categoryId),
  };
}

function normalizeLocation(value, required) {
  if (!value && !required) {
    return null;
  }
  const lat = Number(value && value.lat);
  const lng = Number(value && value.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !inIndiaBounds(lat, lng)) {
    if (required) {
      throw new functions.https.HttpsError(
          "invalid-argument",
          "Location must include valid lat/lng coordinates in India.",
      );
    }
    return null;
  }

  return {lat, lng};
}

function medicinePassesFilters(data, queryText, filters) {
  if (!data || data.isActive === false) {
    return false;
  }
  if (filters.rxOnly && !data.requiresPrescription) {
    return false;
  }
  if (filters.otcOnly && data.requiresPrescription) {
    return false;
  }
  if (filters.categoryId) {
    const categoryIds = asStringArray(data.categoryIds);
    if (!categoryIds.includes(filters.categoryId)) {
      return false;
    }
  }

  return medicineMatchesQuery(data, queryText);
}

function medicineMatchesQuery(data, queryText) {
  const haystack = [
    data.name,
    data.brand,
    data.manufacturer,
    data.manufacturerName,
    data.therapeuticCategory,
    asStringArray(data.categoryIds).join(" "),
    asStringArray(data.aliases).join(" "),
    asStringArray(data.hindiAliases).join(" "),
    asStringArray(data.salt).join(" "),
    asStringArray(data.searchTokens).join(" "),
    Array.isArray(data.compositions) ?
      data.compositions.map((composition) => {
        if (typeof composition === "string") {
          return composition;
        }
        if (!composition || typeof composition !== "object") {
          return "";
        }
        return composition.name || composition.salt || "";
      }).join(" ") :
      "",
  ].join(" ").toLowerCase();

  return haystack.includes(queryText);
}

function isPublicStoreData(data) {
  return Boolean(
      data &&
      data.publicDiscovery === true &&
      (
        data.isVerified === true ||
        data.verified === true ||
        getNested(data, ["verification", "status"]) === "approved"
      ) &&
      data.isActive !== false,
  );
}

function getOpenState(data) {
  if (typeof data.isOpenNow === "boolean") {
    return data.isOpenNow;
  }
  if (typeof data.isOpen === "boolean") {
    return data.isOpen;
  }
  return true;
}

function buildQueryTokens(queryText) {
  const compact = queryText.replace(/\s+/g, "");
  const first = queryText.split(/\s+/)[0];
  return Array.from(new Set([queryText, compact, first].filter(Boolean)));
}

function distanceForStore(storeData, location) {
  if (!location) {
    return Number(storeData.distanceKm || 0);
  }
  const storeLocation = normalizeStoreLocation(storeData);
  if (!storeLocation.lat || !storeLocation.lng) {
    return Number.POSITIVE_INFINITY;
  }
  return haversineKm(location, storeLocation);
}

function compareAvailability(a, b) {
  return stockRank(a.item.stockLabel) - stockRank(b.item.stockLabel) ||
    a.store.distanceKm - b.store.distanceKm ||
    b.item.updatedAt - a.item.updatedAt;
}

function stockRank(stockLabel) {
  if (stockLabel === "in_stock") {
    return 0;
  }
  if (stockLabel === "low") {
    return 1;
  }
  return 2;
}

function haversineKm(a, b) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const value =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) *
      Math.cos(lat1) * Math.cos(lat2);

  return roundNumber(
      earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)),
      2,
  );
}

function encodeGeohash(lat, lng, precision) {
  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let geohash = "";
  let latMin = -90;
  let latMax = 90;
  let lngMin = -180;
  let lngMax = 180;

  while (geohash.length < precision) {
    if (evenBit) {
      const lngMid = (lngMin + lngMax) / 2;
      if (lng >= lngMid) {
        idx = idx * 2 + 1;
        lngMin = lngMid;
      } else {
        idx = idx * 2;
        lngMax = lngMid;
      }
    } else {
      const latMid = (latMin + latMax) / 2;
      if (lat >= latMid) {
        idx = idx * 2 + 1;
        latMin = latMid;
      } else {
        idx = idx * 2;
        latMax = latMid;
      }
    }

    evenBit = !evenBit;
    if (++bit === 5) {
      geohash += GEOHASH_BASE32.charAt(idx);
      bit = 0;
      idx = 0;
    }
  }

  return geohash;
}

function timestampToMillis(value) {
  if (!value) {
    return Date.now();
  }
  if (typeof value.toMillis === "function") {
    return value.toMillis();
  }
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : Date.now();
  }
  return Date.now();
}

function formatFreshness(updatedAt) {
  const ageMinutes = Math.max(1, Math.round((Date.now() - updatedAt) / 60000));
  if (ageMinutes < 60) {
    return `Inventory updated ${ageMinutes} min ago`;
  }
  const ageHours = Math.round(ageMinutes / 60);
  if (ageHours <= 24) {
    return `Inventory updated ${ageHours} hr ago`;
  }
  return `Inventory updated ${Math.round(ageHours / 24)} days ago`;
}

function asStringArray(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
        .map((item) => String(item || "").trim())
        .filter(Boolean);
  }
  return [String(value).trim()].filter(Boolean);
}

function normalizeString(value) {
  return String(value || "").trim().toLowerCase();
}

function getNested(source, path) {
  return path.reduce((current, key) => {
    if (!current || typeof current !== "object") {
      return null;
    }
    return current[key];
  }, source);
}

function clampNumber(value, min, max, fallback) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, numberValue));
}

function roundNumber(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function toRadians(value) {
  return value * Math.PI / 180;
}

function inIndiaBounds(lat, lng) {
  return lat >= INDIA_BBOX.minLat &&
    lat <= INDIA_BBOX.maxLat &&
    lng >= INDIA_BBOX.minLng &&
    lng <= INDIA_BBOX.maxLng;
}
