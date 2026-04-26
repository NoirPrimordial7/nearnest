/* eslint-disable max-len */
const path = require("path");
const admin = require("firebase-admin");

const serviceAccountPath = path.resolve(__dirname, "../../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
});

const db = admin.firestore();
const {FieldValue, Timestamp} = admin.firestore;

const GEOHASH_BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
const now = Date.now();

const categories = {
  pain: {id: "cat_pain_relief", name: "Pain Relief"},
  cold: {id: "cat_cold_cough", name: "Cold & Cough"},
  digestion: {id: "cat_digestion", name: "Digestion"},
  allergy: {id: "cat_allergy", name: "Allergy"},
  firstAid: {id: "cat_first_aid", name: "First Aid"},
  diabetes: {id: "cat_diabetes", name: "Diabetes Care"},
  heart: {id: "cat_heart", name: "Heart Care"},
  vitamins: {id: "cat_vitamins", name: "Vitamins"},
};

const medicines = [
  medicine({
    id: "med_dolo_650",
    name: "Dolo 650",
    aliases: ["Dolo", "Dolo 650", "paracetamol 650", "fever"],
    manufacturerName: "Micro Labs",
    compositions: [composition("paracetamol_650", "Paracetamol 650 mg", "paracetamol", 650)],
    form: "tablet",
    packSize: "15 tablets",
    requiresPrescription: false,
    categoryIds: [categories.pain.id],
    similarMedicineIds: ["med_crocin_650", "med_crocin_advance", "med_calpol_500"],
    description: "A commonly stocked paracetamol tablet.",
  }),
  medicine({
    id: "med_crocin_advance",
    name: "Crocin Advance",
    aliases: ["Crocin", "Crocin 500", "paracetamol"],
    manufacturerName: "GSK Consumer",
    compositions: [composition("paracetamol_500", "Paracetamol 500 mg", "paracetamol", 500)],
    form: "tablet",
    packSize: "15 tablets",
    requiresPrescription: false,
    categoryIds: [categories.pain.id],
    similarMedicineIds: ["med_calpol_500", "med_dolo_650", "med_crocin_650"],
    description: "A common over-the-counter paracetamol medicine.",
  }),
  medicine({
    id: "med_crocin_650",
    name: "Crocin 650",
    aliases: ["Crocin 650", "paracetamol 650"],
    manufacturerName: "GSK Consumer",
    compositions: [composition("paracetamol_650", "Paracetamol 650 mg", "paracetamol", 650)],
    form: "tablet",
    packSize: "15 tablets",
    requiresPrescription: false,
    categoryIds: [categories.pain.id],
    similarMedicineIds: ["med_dolo_650", "med_crocin_advance", "med_calpol_500"],
    description: "A paracetamol strength variant from the Crocin range.",
  }),
  medicine({
    id: "med_cetzine_10",
    name: "Cetzine 10",
    aliases: ["cetirizine", "allergy", "cold"],
    manufacturerName: "GSK Consumer",
    compositions: [composition("cetirizine_10", "Cetirizine 10 mg", "cetirizine", 10)],
    form: "tablet",
    packSize: "10 tablets",
    requiresPrescription: false,
    categoryIds: [categories.allergy.id, categories.cold.id],
    similarMedicineIds: ["med_levocet_5", "med_benadryl_dry_cough"],
    description: "A cetirizine tablet commonly stocked for allergy searches.",
  }),
  medicine({
    id: "med_pantocid_40",
    name: "Pantocid 40",
    aliases: ["pantoprazole", "acidity", "panto"],
    manufacturerName: "Sun Pharma",
    compositions: [composition("pantoprazole_40", "Pantoprazole 40 mg", "pantoprazole", 40)],
    form: "tablet",
    packSize: "15 tablets",
    requiresPrescription: false,
    categoryIds: [categories.digestion.id],
    similarMedicineIds: ["med_gelusil_suspension", "med_loperamide_2"],
    description: "A pantoprazole tablet used in pharmacy inventory search.",
  }),
  medicine({
    id: "med_electral_ors",
    name: "Electral ORS",
    aliases: ["ORS", "oral rehydration salts", "loose motion", "diarrhea"],
    manufacturerName: "Abbott",
    compositions: [composition("ors", "Oral rehydration salts", "ors")],
    form: "sachet",
    packSize: "21.8 g sachet",
    requiresPrescription: false,
    categoryIds: [categories.digestion.id, categories.firstAid.id],
    similarMedicineIds: ["med_gelusil_suspension", "med_loperamide_2"],
    description: "An oral rehydration salts sachet stocked by many pharmacies.",
  }),
  medicine({
    id: "med_azithral_500",
    name: "Azithral 500",
    aliases: ["azithral", "azithromycin 500", "azith 500"],
    manufacturerName: "Abbott",
    compositions: [composition("azithromycin_500", "Azithromycin 500 mg", "azithromycin", 500)],
    form: "tablet",
    packSize: "3 tablets",
    requiresPrescription: true,
    categoryIds: [categories.cold.id],
    similarMedicineIds: ["med_azee_500", "med_cetzine_10"],
    description: "An azithromycin tablet listed for prescription-required discovery.",
  }),
  medicine({
    id: "med_glycomet_500",
    name: "Glycomet 500",
    aliases: ["glycomet", "metformin", "diabetes"],
    manufacturerName: "Zydus",
    compositions: [composition("metformin_500", "Metformin 500 mg", "metformin", 500)],
    form: "tablet",
    packSize: "20 tablets",
    requiresPrescription: true,
    categoryIds: [categories.diabetes.id],
    similarMedicineIds: ["med_telma_40", "med_atorva_10"],
    description: "A metformin tablet shown with prescription-required status.",
  }),
];

const stores = [
  store({
    id: "medifind_demo_greenleaf",
    name: "Greenleaf Pharmacy",
    licenseNumber: "MH-PUNE-DEMO-1287",
    address: {
      line1: "Shop 8, Lakeview Market, Baner Road",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411045",
    },
    lat: 18.559,
    lng: 73.7868,
    phone: "+919876543210",
    distanceKm: 0.8,
    closesAtLabel: "Open until 10:30 PM",
    inventoryAgeMinutes: 8,
  }),
  store({
    id: "medifind_demo_carepoint",
    name: "CarePoint Medicals",
    licenseNumber: "MH-PUNE-DEMO-2041",
    address: {
      line1: "Ground Floor, Wellness Plaza",
      line2: "Aundh",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411007",
    },
    lat: 18.5589,
    lng: 73.8078,
    phone: "+919822011445",
    distanceKm: 1.6,
    closesAtLabel: "Open until 11:00 PM",
    inventoryAgeMinutes: 18,
  }),
  store({
    id: "medifind_demo_citymed",
    name: "CityMed Plus",
    licenseNumber: "MH-PUNE-DEMO-3388",
    address: {
      line1: "Opposite Metro Pillar 42",
      line2: "Balewadi High Street",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411045",
    },
    lat: 18.5695,
    lng: 73.7747,
    phone: "+919765422331",
    distanceKm: 2.4,
    isOpenNow: false,
    closesAtLabel: "Closed now",
    inventoryAgeMinutes: 42,
  }),
  store({
    id: "medifind_demo_wellnest",
    name: "Wellnest Chemist",
    licenseNumber: "MH-PUNE-DEMO-4410",
    address: {
      line1: "Unit 3, Orchid Arcade",
      line2: "Pashan-Sus Road",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411021",
    },
    lat: 18.5439,
    lng: 73.792,
    phone: "+919890955661",
    distanceKm: 3.1,
    closesAtLabel: "Open until 9:45 PM",
    inventoryAgeMinutes: 75,
  }),
];

const inventory = [
  item("medifind_demo_greenleaf", "med_dolo_650", 24, "in_stock", 35, 8),
  item("medifind_demo_greenleaf", "med_crocin_advance", 12, "in_stock", 28, 8),
  item("medifind_demo_greenleaf", "med_cetzine_10", 3, "low", 44, 8),
  item("medifind_demo_greenleaf", "med_pantocid_40", 9, "in_stock", 110, 8),
  item("medifind_demo_greenleaf", "med_azithral_500", 2, "low", 126, 8),
  item("medifind_demo_carepoint", "med_dolo_650", 4, "low", 36, 18),
  item("medifind_demo_carepoint", "med_crocin_650", 18, "in_stock", 34, 18),
  item("medifind_demo_carepoint", "med_electral_ors", 20, "in_stock", 22, 18),
  item("medifind_demo_carepoint", "med_glycomet_500", 7, "in_stock", 72, 18),
  item("medifind_demo_citymed", "med_dolo_650", 0, "out", null, 42),
  item("medifind_demo_citymed", "med_crocin_advance", 10, "in_stock", 29, 42),
  item("medifind_demo_citymed", "med_pantocid_40", 5, "in_stock", 108, 42),
  item("medifind_demo_citymed", "med_azithral_500", 6, "in_stock", 128, 42),
  item("medifind_demo_wellnest", "med_dolo_650", 16, "in_stock", 37, 75),
  item("medifind_demo_wellnest", "med_cetzine_10", 11, "in_stock", 42, 75),
  item("medifind_demo_wellnest", "med_electral_ors", 6, "in_stock", 24, 75),
  item("medifind_demo_wellnest", "med_glycomet_500", 2, "low", 75, 75),
];

main().catch((error) => {
  console.error("Discovery seed failed:", error);
  process.exitCode = 1;
});

async function main() {
  console.log("Seeding Medifind discovery data...");
  await assertStoreDocsSafe(stores.map((row) => row.id));

  const batch = db.batch();

  medicines.forEach((row) => {
    batch.set(db.collection("medicines").doc(row.id), row, {merge: true});
  });

  stores.forEach((row) => {
    batch.set(db.collection("stores").doc(row.id), row);
  });

  inventory.forEach((row) => {
    batch.set(
        db.collection("stores").doc(row.storeId).collection("inventory").doc(row.medicineId),
        row,
    );
  });

  await batch.commit();

  const summary = {
    medicines: medicines.length,
    stores: stores.length,
    inventory: inventory.length,
  };
  console.log("Medifind discovery seed complete:", summary);
}

async function assertStoreDocsSafe(storeIds) {
  const privateFields = [
    "ownerId",
    "members",
    "membersArr",
    "visibleTo",
    "adminNotes",
    "internal",
    "private",
  ];

  for (const storeId of storeIds) {
    const snapshot = await db.collection("stores").doc(storeId).get();
    if (!snapshot.exists) {
      continue;
    }

    const data = snapshot.data() || {};
    const presentPrivateFields = privateFields.filter((field) => Object.prototype.hasOwnProperty.call(data, field));
    if (presentPrivateFields.length > 0) {
      throw new Error(
          `Refusing to overwrite ${storeId}; private fields found: ${presentPrivateFields.join(", ")}`,
      );
    }
  }
}

function medicine(base) {
  const categoryNames = base.categoryIds.map((id) => {
    const category = Object.values(categories).find((candidate) => candidate.id === id);
    return category ? category.name : id;
  });
  return {
    ...base,
    manufacturer: base.manufacturerName,
    isActive: true,
    searchTokens: buildSearchTokens([
      base.name,
      base.aliases,
      base.manufacturerName,
      categoryNames,
      base.compositions.map((row) => row.name),
      base.compositions.map((row) => row.saltKey),
    ]),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

function composition(id, name, saltKey, strengthMg) {
  return {
    id: `comp_${id}`,
    name,
    saltKey,
    strengthMg: strengthMg || null,
    form: "tablet",
  };
}

function store(base) {
  const inventoryUpdatedAt = Timestamp.fromMillis(now - base.inventoryAgeMinutes * 60 * 1000);
  return {
    id: base.id,
    name: base.name,
    publicDiscovery: true,
    isActive: true,
    isVerified: true,
    verified: true,
    verification: {status: "approved"},
    licenseNumber: base.licenseNumber,
    licenseAuthority: "Maharashtra Food and Drug Administration",
    address: base.address,
    location: {
      lat: base.lat,
      lng: base.lng,
      geohash: encodeGeohash(base.lat, base.lng, 7),
    },
    contact: {
      publicPhoneE164: base.phone,
      whatsapp: base.phone,
    },
    hours: {
      0: [{open: "09:00", close: "22:00"}],
      1: [{open: "08:30", close: "22:30"}],
      2: [{open: "08:30", close: "22:30"}],
      3: [{open: "08:30", close: "22:30"}],
      4: [{open: "08:30", close: "22:30"}],
      5: [{open: "08:30", close: "22:30"}],
      6: [{open: "09:00", close: "22:00"}],
    },
    distanceKm: base.distanceKm,
    isOpenNow: base.isOpenNow !== false,
    closesAtLabel: base.closesAtLabel,
    freshnessUpdatedAt: inventoryUpdatedAt,
    inventoryUpdatedAt,
    freshnessLabel: freshnessLabel(base.inventoryAgeMinutes),
    seededBy: "medifind-discovery-seed",
    updatedAt: FieldValue.serverTimestamp(),
  };
}

function item(storeId, medicineId, stock, stockLabel, priceInr, ageMinutes) {
  return {
    storeId,
    medicineId,
    isActive: true,
    active: true,
    inStock: stockLabel !== "out",
    stock,
    quantity: stock,
    stockLabel,
    priceInr,
    updatedAt: Timestamp.fromMillis(now - ageMinutes * 60 * 1000),
    searchTokens: buildSearchTokens([medicineId.replace(/^med_/, "").replace(/_/g, " ")]),
    seededBy: "medifind-discovery-seed",
  };
}

function buildSearchTokens(values) {
  const tokens = new Set();
  const phrases = values
      .flat(Infinity)
      .filter(Boolean)
      .map((value) => String(value).trim().toLowerCase())
      .filter(Boolean);

  phrases.forEach((phrase) => {
    tokens.add(phrase);
    tokens.add(phrase.replace(/\s+/g, ""));
    phrase.split(/[^a-z0-9]+/).filter(Boolean).forEach((part) => {
      tokens.add(part);
      for (let index = 2; index <= Math.min(part.length, 20); index += 1) {
        tokens.add(part.slice(0, index));
      }
    });
  });

  return Array.from(tokens).slice(0, 180);
}

function freshnessLabel(ageMinutes) {
  if (ageMinutes < 60) {
    return `Inventory updated ${ageMinutes} min ago`;
  }
  return `Inventory updated ${Math.round(ageMinutes / 60)} hr ago`;
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
