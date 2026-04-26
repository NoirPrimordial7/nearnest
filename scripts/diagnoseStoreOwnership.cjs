#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function loadFirebaseAdmin() {
  try {
    return require("firebase-admin");
  } catch (error) {
    const fallback = path.resolve(__dirname, "../functions/node_modules/firebase-admin");
    return require(fallback);
  }
}

const admin = loadFirebaseAdmin();
const serviceAccountPath = path.resolve(__dirname, "../serviceAccountKey.json");

function initializeAdmin() {
  if (admin.apps.length) {
    return;
  }

  if (fs.existsSync(serviceAccountPath)) {
    admin.initializeApp({
      credential: admin.credential.cert(require(serviceAccountPath)),
    });
    return;
  }

  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const apply = args.includes("--apply");
  const email = args.find((arg) => arg !== "--apply");

  if (!email) {
    console.error("Usage: node scripts/diagnoseStoreOwnership.cjs <email> [--apply]");
    process.exit(1);
  }

  return {email: email.trim().toLowerCase(), apply};
}

function addDocs(target, source, snapshot) {
  snapshot.docs.forEach((docSnap) => {
    const existing = target.get(docSnap.id) || {
      id: docSnap.id,
      ref: docSnap.ref,
      data: docSnap.data() || {},
      sources: new Set(),
    };
    existing.sources.add(source);
    target.set(docSnap.id, existing);
  });
}

function fieldValueContainsUid(value, uid) {
  return Array.isArray(value) && value.includes(uid);
}

function dataHasUidLink(data, uid) {
  return data.ownerId === uid ||
    fieldValueContainsUid(data.membersArr, uid) ||
    fieldValueContainsUid(data.visibleTo, uid) ||
    (data.members && typeof data.members === "object" && data.members[uid] === true);
}

function getMembersMapFieldPath(adminSdk, uid) {
  try {
    return new adminSdk.firestore.FieldPath("members", uid);
  } catch {
    return null;
  }
}

function storeLabel(store) {
  const data = store.data || {};
  return `${store.id} | ${data.name || "Unnamed store"} | sources=${Array.from(store.sources).sort().join(",")}`;
}

async function queryStoresByEmail(db, emailCandidates) {
  const emailMatches = new Map();
  const ownerEmailPath = new admin.firestore.FieldPath("owner", "email");
  const emailQueries = [
    ["ownerEmail", "ownerEmail"],
    ["email", "email"],
    ["owner.email", ownerEmailPath],
  ];

  for (const candidate of emailCandidates) {
    for (const [label, field] of emailQueries) {
      const snapshot = await db.collection("stores").where(field, "==", candidate).get();
      addDocs(emailMatches, `${label}:${candidate}`, snapshot);
    }
  }

  return emailMatches;
}

async function main() {
  const {email, apply} = parseArgs(process.argv);
  initializeAdmin();

  const auth = admin.auth();
  const db = admin.firestore();
  const {FieldPath, FieldValue} = admin.firestore;

  const user = await auth.getUserByEmail(email);
  const uid = user.uid;
  const membersMapFieldPath = getMembersMapFieldPath(admin, uid);
  const emailCandidates = Array.from(new Set([email, user.email, user.email?.toLowerCase()].filter(Boolean)));

  console.log("Nearnest store ownership diagnostic");
  console.log(`Email: ${email}`);
  console.log(`Auth UID: ${uid}`);
  console.log(`Apply mode: ${apply ? "YES" : "NO - read only"}`);
  console.log("");

  const uidMatches = new Map();
  const uidQueries = [
    ["ownerId", "ownerId", "==", uid],
    ["membersArr", "membersArr", "array-contains", uid],
    ["visibleTo", "visibleTo", "array-contains", uid],
  ];

  if (membersMapFieldPath) {
    uidQueries.push(["membersMap", membersMapFieldPath, "==", true]);
  } else {
    console.warn("Skipping members map query because the UID is not valid as a FieldPath segment.");
  }

  for (const [label, field, op, value] of uidQueries) {
    const snapshot = await db.collection("stores").where(field, op, value).get();
    addDocs(uidMatches, label, snapshot);
  }

  const emailMatches = await queryStoresByEmail(db, emailCandidates);
  const emailOnly = Array.from(emailMatches.values()).filter((store) => !uidMatches.has(store.id));
  const linkedByUid = Array.from(uidMatches.values());
  const missingUidLinkage = emailOnly.filter((store) => !dataHasUidLink(store.data, uid));

  console.log(`Stores already linked by UID: ${linkedByUid.length}`);
  linkedByUid.forEach((store) => console.log(`  - ${storeLabel(store)}`));
  console.log("");

  console.log(`Stores matched only by email fields: ${emailOnly.length}`);
  emailOnly.forEach((store) => console.log(`  - ${storeLabel(store)}`));
  console.log("");

  console.log(`Stores missing UID linkage: ${missingUidLinkage.length}`);
  missingUidLinkage.forEach((store) => {
    const data = store.data || {};
    console.log(`  - ${store.id} | ${data.name || "Unnamed store"} | ownerId=${data.ownerId || "<missing>"}`);
  });
  console.log("");

  if (!apply) {
    console.log("No updates written. Re-run with --apply to link email-matched stores safely.");
    return;
  }

  for (const store of missingUidLinkage) {
    const updateArgs = [
      "membersArr",
      FieldValue.arrayUnion(uid),
      new FieldPath("members", uid),
      true,
    ];

    if (!store.data.ownerId) {
      updateArgs.push("ownerId", uid);
    }

    console.log(`Updating store ${store.id} before write`);
    await store.ref.update(...updateArgs);
  }

  console.log(`Updated ${missingUidLinkage.length} store(s). Existing ownerId values were not overwritten.`);
}

main().catch((error) => {
  console.error("Store ownership diagnostic failed:", error);
  process.exitCode = 1;
});
