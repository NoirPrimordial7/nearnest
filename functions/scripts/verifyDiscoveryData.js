const path = require("path");
const admin = require("firebase-admin");

const serviceAccountPath = path.resolve(__dirname, "../../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
});

const db = admin.firestore();

main().catch((error) => {
  console.error("Discovery verification failed:", error);
  process.exitCode = 1;
});

async function main() {
  console.log("Verifying Medifind discovery data...");

  const medicineSnapshot = await db
      .collection("medicines")
      .where("searchTokens", "array-contains", "dolo")
      .limit(30)
      .get();
  console.log("medicine search count:", medicineSnapshot.size);

  const storeSnapshot = await db
      .collection("stores")
      .orderBy("location.geohash")
      .startAt("tek3")
      .endAt("tek3\uf8ff")
      .limit(100)
      .get();
  console.log("nearby store geohash count:", storeSnapshot.size);

  let availabilityCount = 0;
  for (const storeDoc of storeSnapshot.docs) {
    const inventoryDoc = await storeDoc.ref.collection("inventory").doc("med_dolo_650").get();
    if (inventoryDoc.exists && inventoryDoc.data().inStock !== false) {
      availabilityCount += 1;
    }
  }
  console.log("dolo availability count:", availabilityCount);
}
