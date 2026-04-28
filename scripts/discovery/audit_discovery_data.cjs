#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--project") {
      args.project = argv[++i];
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function printHelp() {
  console.log("Usage: node scripts/discovery/audit_discovery_data.cjs --project <projectId>");
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

function hasValidCoordinates(data) {
  const location = data.location || {};
  const geopoint = data.geopoint || data.geoPoint || {};
  const lat = Number(location.lat ?? location.latitude ?? data.lat ?? geopoint.latitude);
  const lng = Number(location.lng ?? location.longitude ?? data.lng ?? geopoint.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;
}

function hasPublicPhone(data) {
  return Boolean(
      data.publicPhone ||
      data.publicPhoneE164 ||
      data.phone ||
      data.contact?.publicPhoneE164 ||
      data.contact?.publicPhone ||
      data.contact?.phone,
  );
}

function isPublicVerifiedStore(data) {
  const verified = data.isVerified === true || data.verified === true || data.verificationStatus === "approved";
  const publicStore = data.isPublic === true || data.publicDiscovery === true || data.status === "approved";
  return verified || publicStore;
}

function isActiveMedicine(data) {
  return data.isActive !== false;
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
  const [medicineSnapshot, storeSnapshot] = await Promise.all([
    db.collection("medicines").get(),
    db.collection("stores").get(),
  ]);

  const medicineIds = new Set();
  let activeMedicines = 0;
  let medicinesMissingTokens = 0;
  medicineSnapshot.forEach((doc) => {
    const data = doc.data() || {};
    medicineIds.add(doc.id);
    if (isActiveMedicine(data)) {
      activeMedicines += 1;
    }
    if (!Array.isArray(data.searchTokens) || data.searchTokens.length === 0) {
      medicinesMissingTokens += 1;
    }
  });

  let publicVerifiedStores = 0;
  let storesWithCoordinates = 0;
  let storesWithPublicPhone = 0;
  let storesWithInventory = 0;
  let totalInventoryDocs = 0;
  const inventoryMedicineIds = new Set();
  const missingProblems = [];

  for (const storeDoc of storeSnapshot.docs) {
    const data = storeDoc.data() || {};
    const publicVerified = isPublicVerifiedStore(data);
    const validCoordinates = hasValidCoordinates(data);
    const publicPhone = hasPublicPhone(data);

    if (publicVerified) {
      publicVerifiedStores += 1;
    }
    if (validCoordinates) {
      storesWithCoordinates += 1;
    }
    if (publicPhone) {
      storesWithPublicPhone += 1;
    }

    if (publicVerified && !validCoordinates) {
      missingProblems.push(`stores/${storeDoc.id}: public/verified but missing valid coordinates`);
    }
    if (publicVerified && !publicPhone) {
      missingProblems.push(`stores/${storeDoc.id}: public/verified but missing public phone`);
    }

    const inventorySnapshot = await storeDoc.ref.collection("inventory").get();
    if (!inventorySnapshot.empty) {
      storesWithInventory += 1;
    } else if (publicVerified) {
      missingProblems.push(`stores/${storeDoc.id}: public/verified but has no discovery inventory`);
    }

    totalInventoryDocs += inventorySnapshot.size;
    inventorySnapshot.forEach((inventoryDoc) => {
      const item = inventoryDoc.data() || {};
      inventoryMedicineIds.add(item.medicineId || inventoryDoc.id);
    });
  }

  const orphanInventoryMedicines = Array.from(inventoryMedicineIds).filter((id) => !medicineIds.has(id));
  const report = {
    project: args.project,
    medicinesCount: medicineSnapshot.size,
    activeMedicinesCount: activeMedicines,
    medicinesMissingSearchTokens: medicinesMissingTokens,
    storesCount: storeSnapshot.size,
    publicVerifiedStoresCount: publicVerifiedStores,
    storesWithValidCoordinatesCount: storesWithCoordinates,
    storesWithPublicPhoneCount: storesWithPublicPhone,
    storesWithInventorySubcollectionCount: storesWithInventory,
    totalInventoryDocsCount: totalInventoryDocs,
    medicinesWithAtLeastOneAvailabilityRow: inventoryMedicineIds.size,
    orphanInventoryMedicineIdsCount: orphanInventoryMedicines.length,
    topMissingProblems: missingProblems.slice(0, 20),
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
