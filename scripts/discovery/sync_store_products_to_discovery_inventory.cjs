#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const GEOHASH_BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

function parseArgs(argv) {
  const args = {
    apply: false,
    overwrite: false,
    applyPublicDiscovery: false,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--project") {
      args.project = argv[++i];
    } else if (arg === "--apply") {
      args.apply = true;
    } else if (arg === "--dry-run") {
      args.apply = false;
    } else if (arg === "--overwrite") {
      args.overwrite = true;
    } else if (arg === "--apply-public-discovery") {
      args.applyPublicDiscovery = true;
    } else if (arg === "--limit-stores") {
      args.limitStores = Number(argv[++i]);
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function printHelp() {
  console.log([
    "Usage:",
    "  node scripts/discovery/sync_store_products_to_discovery_inventory.cjs --project <projectId> [--dry-run]",
    "  node scripts/discovery/sync_store_products_to_discovery_inventory.cjs --project <projectId> --apply [--overwrite] [--apply-public-discovery]",
  ].join("\n"));
}

function loadAdmin(projectId) {
  let admin;
  try {
    admin = require("firebase-admin");
  } catch (firstError) {
    try {
      admin = require(path.join(ROOT, "functions", "node_modules", "firebase-admin"));
    } catch {
      throw firstError;
    }
  }
  if (admin.apps.length > 0) {
    return admin;
  }
  const serviceAccountPath = path.join(ROOT, "serviceAccountKey.json");
  if (fs.existsSync(serviceAccountPath)) {
    admin.initializeApp({
      credential: admin.credential.cert(require(serviceAccountPath)),
      projectId,
    });
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId,
    });
  }
  return admin;
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function compact(value) {
  return normalize(value).replace(/\s+/g, "");
}

function asArray(value) {
  if (!Array.isArray(value)) {
    return value ? [value] : [];
  }
  return value.filter((item) => item !== null && item !== undefined);
}

function textFromProduct(data) {
  return [
    data.name,
    data.productName,
    data.title,
    data.brand,
    data.brandName,
    data.genericName,
    data.composition,
    data.salt,
    data.description,
  ].map((value) => asArray(value).join(" ")).join(" ");
}

function textFromMedicine(data) {
  return [
    data.name,
    data.brandName,
    data.genericName,
    data.manufacturer,
    data.manufacturerName,
    data.composition,
    data.salt,
    data.searchTokens,
    data.aliases,
  ].map((value) => asArray(value).join(" ")).join(" ");
}

function isVerifiedStore(data) {
  return data.isVerified === true || data.verified === true || data.verificationStatus === "approved";
}

function extractCoordinates(data) {
  const location = data.location || {};
  const geopoint = data.geopoint || data.geoPoint || {};
  const lat = Number(location.lat ?? location.latitude ?? data.lat ?? geopoint.latitude);
  const lng = Number(location.lng ?? location.longitude ?? data.lng ?? geopoint.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) {
    return null;
  }
  return {lat, lng};
}

function geohashEncode(lat, lng, precision = 9) {
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
      const mid = (lngMin + lngMax) / 2;
      if (lng >= mid) {
        idx = idx * 2 + 1;
        lngMin = mid;
      } else {
        idx *= 2;
        lngMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) {
        idx = idx * 2 + 1;
        latMin = mid;
      } else {
        idx *= 2;
        latMax = mid;
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

function normalizeStockLabel(data) {
  const explicit = normalize(data.stockLabel || data.availabilityStatus || data.status).replace(/\s+/g, "_");
  const quantity = Number(data.stock ?? data.quantity ?? data.quantityAvailable ?? data.inventory ?? 0);
  if (["in_stock", "low", "out"].includes(explicit)) {
    return explicit;
  }
  if (data.inStock === false || explicit === "out_of_stock" || quantity <= 0) {
    return "out";
  }
  if (quantity <= 3 || explicit === "low_stock") {
    return "low";
  }
  return "in_stock";
}

function normalizePriceInr(data) {
  const candidates = [
    data.priceInr,
    data.sellingPriceInr,
    data.mrpInr,
    data.price,
    data.mrp,
    data.price?.sellingPrice,
    data.price?.mrp,
  ];
  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isFinite(value) && value > 0) {
      return value > 10000 ? Math.round(value / 100) : Math.round(value);
    }
  }
  return null;
}

function buildMedicineIndex(medicineDocs) {
  const rows = medicineDocs
      .filter((doc) => doc.data().isActive !== false)
      .map((doc) => {
        const data = doc.data() || {};
        const tokens = new Set(asArray(data.searchTokens).map(normalize).filter(Boolean));
        const text = normalize(textFromMedicine(data));
        return {
          id: doc.id,
          name: normalize(data.name || data.brandName || data.genericName),
          nameCompact: compact(data.name || data.brandName || data.genericName),
          genericCompact: compact(data.genericName || data.composition || asArray(data.salt).join(" ")),
          tokens,
          text,
        };
      });
  const exact = new Map(rows.map((row) => [row.nameCompact, row]));
  return {rows, exact};
}

function matchMedicine(productData, medicineIndex) {
  const productText = normalize(textFromProduct(productData));
  const productCompact = compact(productText);
  const productNameCompact = compact(productData.name || productData.productName || productData.title);

  if (medicineIndex.exact.has(productNameCompact)) {
    return {medicine: medicineIndex.exact.get(productNameCompact), reason: "exact_name", score: 100};
  }

  let best = null;
  for (const medicine of medicineIndex.rows) {
    let score = 0;
    if (medicine.nameCompact.length >= 4 && productCompact.includes(medicine.nameCompact)) {
      score += 70;
    }
    if (medicine.genericCompact.length >= 4 && productCompact.includes(medicine.genericCompact)) {
      score += 45;
    }
    for (const token of medicine.tokens) {
      if (token.length >= 4 && productText.includes(token)) {
        score += 8;
      }
    }
    if (score > (best?.score || 0)) {
      best = {medicine, reason: "token_or_composition", score};
    }
  }

  return best && best.score >= 24 ? best : null;
}

function buildInventoryDoc(storeId, medicineId, productData, admin) {
  const stockLabel = normalizeStockLabel(productData);
  const stock = Number(productData.stock ?? productData.quantity ?? productData.quantityAvailable ?? 10);
  return {
    medicineId,
    storeId,
    stock: Number.isFinite(stock) ? Math.max(0, Math.round(stock)) : 10,
    quantity: Number.isFinite(stock) ? Math.max(0, Math.round(stock)) : 10,
    stockLabel,
    inStock: stockLabel !== "out",
    priceInr: normalizePriceInr(productData),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    isActive: true,
  };
}

async function maybeApplyPublicDiscovery(storeDoc, admin, apply) {
  const data = storeDoc.data() || {};
  if (!isVerifiedStore(data)) {
    return null;
  }
  const coordinates = extractCoordinates(data);
  const update = {
    publicDiscovery: true,
    inventoryUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (coordinates && !(data.location && data.location.geohash)) {
    update["location.geohash"] = geohashEncode(coordinates.lat, coordinates.lng);
  }
  if (apply) {
    await storeDoc.ref.update(update);
  }
  return update;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    return;
  }
  if (!args.project) {
    throw new Error("--project is required");
  }

  const admin = loadAdmin(args.project);
  const db = admin.firestore();
  const medicineSnapshot = await db.collection("medicines").get();
  const medicineIndex = buildMedicineIndex(medicineSnapshot.docs);
  const storeSnapshot = await db.collection("stores").get();
  const stores = args.limitStores ? storeSnapshot.docs.slice(0, args.limitStores) : storeSnapshot.docs;
  const report = {
    project: args.project,
    mode: args.apply ? "apply" : "dry-run",
    storesScanned: 0,
    storesWithProducts: 0,
    productsScanned: 0,
    matches: 0,
    skippedExisting: 0,
    writesPlannedOrApplied: 0,
    publicDiscoveryUpdates: 0,
    sampleMatches: [],
  };

  for (const storeDoc of stores) {
    report.storesScanned += 1;
    const collections = await storeDoc.ref.listCollections();
    if (!collections.some((collection) => collection.id === "products")) {
      continue;
    }

    const productsSnapshot = await storeDoc.ref.collection("products").get();
    if (productsSnapshot.empty) {
      continue;
    }
    report.storesWithProducts += 1;

    for (const productDoc of productsSnapshot.docs) {
      report.productsScanned += 1;
      const productData = productDoc.data() || {};
      const match = matchMedicine(productData, medicineIndex);
      if (!match) {
        continue;
      }
      report.matches += 1;
      const inventoryRef = storeDoc.ref.collection("inventory").doc(match.medicine.id);
      const existing = await inventoryRef.get();
      if (existing.exists && !args.overwrite) {
        report.skippedExisting += 1;
        continue;
      }
      const inventoryDoc = buildInventoryDoc(storeDoc.id, match.medicine.id, productData, admin);
      report.writesPlannedOrApplied += 1;
      if (report.sampleMatches.length < 15) {
        report.sampleMatches.push({
          storeId: storeDoc.id,
          productId: productDoc.id,
          medicineId: match.medicine.id,
          reason: match.reason,
          score: match.score,
          stockLabel: inventoryDoc.stockLabel,
          priceInr: inventoryDoc.priceInr,
        });
      }
      if (args.apply) {
        await inventoryRef.set(inventoryDoc, {merge: true});
      }
    }

    if (args.applyPublicDiscovery) {
      const update = await maybeApplyPublicDiscovery(storeDoc, admin, args.apply);
      if (update) {
        report.publicDiscoveryUpdates += 1;
      }
    }
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
