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
    limitMedicines: 150,
    maxPerStore: 45,
    applyPublicDiscovery: false,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--project") {
      args.project = argv[++i];
    } else if (arg === "--limit-medicines") {
      args.limitMedicines = Number(argv[++i]);
    } else if (arg === "--max-per-store") {
      args.maxPerStore = Number(argv[++i]);
    } else if (arg === "--apply") {
      args.apply = true;
    } else if (arg === "--dry-run") {
      args.apply = false;
    } else if (arg === "--overwrite") {
      args.overwrite = true;
    } else if (arg === "--apply-public-discovery") {
      args.applyPublicDiscovery = true;
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
    "  node scripts/discovery/seed_demo_discovery_inventory.cjs --project <projectId> --limit-medicines 150 --dry-run",
    "  node scripts/discovery/seed_demo_discovery_inventory.cjs --project <projectId> --limit-medicines 150 --apply [--overwrite] [--apply-public-discovery]",
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

function isPublicVerifiedStore(data) {
  const verified = data.isVerified === true || data.verified === true || data.verificationStatus === "approved";
  const publicStore = data.isPublic === true || data.publicDiscovery === true || data.status === "approved";
  return verified || publicStore;
}

function coordinatesForStore(data) {
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

function hashNumber(value) {
  let hash = 0;
  const source = String(value);
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function stockLabelFor(seed) {
  if (seed % 11 === 0) {
    return "low";
  }
  return "in_stock";
}

function priceFor(seed) {
  return 18 + (seed % 420);
}

function stockFor(seed, stockLabel) {
  if (stockLabel === "low") {
    return 1 + (seed % 3);
  }
  return 8 + (seed % 38);
}

async function maybeApplyPublicDiscovery(storeDoc, admin, apply) {
  const data = storeDoc.data() || {};
  if (!isPublicVerifiedStore(data)) {
    return null;
  }
  const coords = coordinatesForStore(data);
  const update = {
    publicDiscovery: true,
    inventoryUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (coords && !(data.location && data.location.geohash)) {
    update["location.geohash"] = geohashEncode(coords.lat, coords.lng);
  }
  if (apply) {
    await storeDoc.ref.update(update);
  }
  return update;
}

function buildInventoryDoc(storeId, medicineId, admin) {
  const seed = hashNumber(`${storeId}:${medicineId}`);
  const stockLabel = stockLabelFor(seed);
  const stock = stockFor(seed, stockLabel);
  return {
    medicineId,
    storeId,
    stock,
    quantity: stock,
    stockLabel,
    inStock: true,
    priceInr: priceFor(seed),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    isActive: true,
  };
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
  if (!Number.isFinite(args.limitMedicines) || args.limitMedicines <= 0) {
    throw new Error("--limit-medicines must be a positive number");
  }

  const admin = loadAdmin(args.project);
  const db = admin.firestore();
  const [medicineSnapshot, storeSnapshot] = await Promise.all([
    db.collection("medicines").limit(args.limitMedicines).get(),
    db.collection("stores").get(),
  ]);
  const medicines = medicineSnapshot.docs.filter((doc) => doc.data().isActive !== false);
  const stores = storeSnapshot.docs.filter((doc) => isPublicVerifiedStore(doc.data() || {}));
  const report = {
    project: args.project,
    mode: args.apply ? "apply" : "dry-run",
    medicinesSelected: medicines.length,
    storesSelected: stores.length,
    writesPlannedOrApplied: 0,
    skippedExisting: 0,
    publicDiscoveryUpdates: 0,
    sampleWrites: [],
  };

  for (let storeIndex = 0; storeIndex < stores.length; storeIndex += 1) {
    const storeDoc = stores[storeIndex];
    let writtenForStore = 0;

    for (let medicineIndex = 0; medicineIndex < medicines.length; medicineIndex += 1) {
      if (writtenForStore >= args.maxPerStore) {
        break;
      }
      if ((medicineIndex + storeIndex * 7) % 3 !== 0) {
        continue;
      }

      const medicineDoc = medicines[medicineIndex];
      const inventoryRef = storeDoc.ref.collection("inventory").doc(medicineDoc.id);
      const existing = await inventoryRef.get();
      if (existing.exists && !args.overwrite) {
        report.skippedExisting += 1;
        continue;
      }

      const inventoryDoc = buildInventoryDoc(storeDoc.id, medicineDoc.id, admin);
      report.writesPlannedOrApplied += 1;
      writtenForStore += 1;

      if (report.sampleWrites.length < 15) {
        report.sampleWrites.push({
          storeId: storeDoc.id,
          medicineId: medicineDoc.id,
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
