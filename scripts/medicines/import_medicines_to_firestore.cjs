#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_FILE = path.join(ROOT, "scripts", "medicines", "out", "medicines.openfda.sample.json");
const BATCH_LIMIT = 450;

function parseArgs(argv) {
  const args = {
    file: DEFAULT_FILE,
    limit: 100,
    apply: false,
    dryRun: true,
    overwrite: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--project") {
      args.project = argv[++i];
    } else if (arg === "--file") {
      args.file = path.resolve(argv[++i]);
    } else if (arg === "--limit") {
      args.limit = Number(argv[++i]);
    } else if (arg === "--apply") {
      args.apply = true;
      args.dryRun = false;
    } else if (arg === "--dry-run") {
      args.dryRun = true;
      args.apply = false;
    } else if (arg === "--overwrite") {
      args.overwrite = true;
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
    "  node scripts/medicines/import_medicines_to_firestore.cjs --project <projectId> --file <json> [--limit 100] [--dry-run]",
    "  node scripts/medicines/import_medicines_to_firestore.cjs --project <projectId> --file <json> --apply [--overwrite]",
    "",
    "Dry-run is the default. --apply is required to write to Firestore.",
  ].join("\n"));
}

function loadAdmin(projectId) {
  let admin;
  try {
    admin = require("firebase-admin");
  } catch (firstError) {
    try {
      admin = require(path.join(ROOT, "functions", "node_modules", "firebase-admin"));
    } catch (secondError) {
      throw firstError;
    }
  }

  if (admin.apps.length > 0) {
    return admin;
  }

  const serviceAccountPath = path.join(ROOT, "serviceAccountKey.json");
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
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

function cleanString(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.replace(/\s+/g, " ").trim();
}

function asArray(value) {
  if (!Array.isArray(value)) {
    return value ? [value] : [];
  }
  return value.filter((item) => item !== null && item !== undefined);
}

function slugToken(value) {
  return cleanString(value).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function normalizeMedicine(row) {
  const id = slugToken(row.id || row.name);
  if (!id) {
    throw new Error("Medicine row is missing id/name");
  }

  const name = cleanString(row.name || row.brandName || row.genericName);
  const genericName = cleanString(row.genericName || row.composition);
  const manufacturer = cleanString(row.manufacturer) || "Unknown manufacturer";
  const form = cleanString(row.form) || "tablet";
  const categoryIds = asArray(row.categoryIds || row.categories).map(slugToken).filter(Boolean);
  const searchTokens = asArray(row.searchTokens || row.searchKeywords)
      .map(slugToken)
      .filter((token) => token.length >= 2);
  const aliases = asArray(row.aliases)
      .map(cleanString)
      .filter(Boolean);
  const compositionName = cleanString(row.composition || genericName || name);

  return {
    id,
    data: {
      name,
      brandName: cleanString(row.brandName),
      genericName,
      manufacturer,
      manufacturerName: manufacturer,
      compositions: compositionName ? [{
        id: `${id}_composition_0`,
        name: compositionName,
        saltKey: slugToken(compositionName),
        form,
      }] : [],
      salt: compositionName ? [compositionName] : [],
      form,
      route: cleanString(row.route),
      strength: cleanString(row.strength),
      packSize: "",
      imageUrl: cleanString(row.imageUrl),
      imageSource: cleanString(row.imageSource),
      requiresPrescription: Boolean(row.requiresPrescription),
      categoryIds: categoryIds.length > 0 ? categoryIds : ["general"],
      therapeuticCategory: categoryIds[0] || "general",
      aliases,
      searchTokens: Array.from(new Set([...searchTokens, ...aliases.map(slugToken), slugToken(name)]))
          .filter((token) => token.length >= 2),
      similarMedicineIds: [],
      description: cleanString(row.description),
      warnings: asArray(row.warnings).map(cleanString).filter(Boolean).slice(0, 5),
      source: cleanString(row.source),
      sourceId: cleanString(row.sourceId),
      sourceUrl: cleanString(row.sourceUrl),
      isActive: row.isActive !== false,
    },
  };
}

async function writeMedicines(admin, rows, overwrite) {
  const db = admin.firestore();
  let batch = db.batch();
  let queued = 0;
  let written = 0;

  for (const row of rows) {
    const ref = db.collection("medicines").doc(row.id);
    const snapshot = overwrite ? null : await ref.get();
    if (snapshot && snapshot.exists) {
      console.log(`skip existing medicines/${row.id}`);
      continue;
    }

    batch.set(ref, {
      ...row.data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});
    queued += 1;

    if (queued >= BATCH_LIMIT) {
      await batch.commit();
      written += queued;
      batch = db.batch();
      queued = 0;
    }
  }

  if (queued > 0) {
    await batch.commit();
    written += queued;
  }

  return written;
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
  if (!Number.isFinite(args.limit) || args.limit <= 0) {
    throw new Error("--limit must be a positive number");
  }

  const raw = JSON.parse(fs.readFileSync(args.file, "utf8"));
  const rows = raw.slice(0, args.limit).map(normalizeMedicine);

  console.log(`Project: ${args.project}`);
  console.log(`Input: ${args.file}`);
  console.log(`Medicines selected: ${rows.length}`);
  console.log(`Mode: ${args.apply ? "apply" : "dry-run"}`);
  console.log(`Overwrite existing: ${args.overwrite ? "yes" : "no"}`);

  rows.slice(0, 10).forEach((row) => {
    console.log(`would write medicines/${row.id} - ${row.data.name}`);
  });

  if (!args.apply) {
    console.log("Dry-run complete. Pass --apply to write medicines.");
    return;
  }

  const admin = loadAdmin(args.project);
  const written = await writeMedicines(admin, rows, args.overwrite);
  console.log(`Wrote ${written} medicine documents.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
