// seedFirestore.js
import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
const serviceAccount = JSON.parse(
  await readFile(new URL('../serviceAccountKey.json', import.meta.url))
);


// Initialize Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

// ... rest of your seeding logic exactly as-is

(async () => {
  try {
    console.log("Seeding roles...");

    const rolesData = [
      {
        id: "admin",
        name: "Admin",
        scope: "global",
        permissions: [
          "MANAGE_STORES",
          "MANAGE_ROLES",
          "VERIFY_DOCS",
          "ACCESS_ANALYTICS",
          "HANDLE_ORDERS",
          "HANDLE_SUPPORT"
        ]
      },
      {
        id: "user",
        name: "User",
        scope: "global",
        permissions: [
          "CREATE_ORDER",
          "VIEW_OWN_ORDERS"
        ]
      },
      {
        id: "storeAdmin",
        name: "Store Admin",
        scope: "global",
        permissions: ["OWN_STORE"]
      },
      {
        id: "support",
        name: "Support",
        scope: "global",
        permissions: ["HANDLE_SUPPORT", "VIEW_ORDERS"]
      },
      {
        id: "verifier",
        name: "Verifier",
        scope: "global",
        permissions: ["VERIFY_DOCS", "VIEW_STORES"]
      }
    ];

    for (const role of rolesData) {
      await db.collection("roles").doc(role.id).set(role, { merge: true });
      console.log(`Added role: ${role.id}`);
    }

    const demoStoreId = "demoStore";
    await db.collection("stores").doc(demoStoreId).set({
      name: "Demo Store",
      createdAt: Date.now()
    });
    console.log("Created store:", demoStoreId);

    const storeRolesData = [
      {
        id: `${demoStoreId}:Owner`,
        name: "Owner",
        scope: "store",
        storeId: demoStoreId,
        permissions: [
          "MANAGE_STORE",
          "MANAGE_PRODUCTS",
          "MANAGE_ORDERS",
          "MANAGE_STAFF",
          "ACCESS_ANALYTICS",
          "HANDLE_SUPPORT"
        ]
      },
      {
        id: `${demoStoreId}:Manager`,
        name: "Manager",
        scope: "store",
        storeId: demoStoreId,
        permissions: [
          "MANAGE_PRODUCTS",
          "MANAGE_ORDERS",
          "ACCESS_ANALYTICS",
          "HANDLE_SUPPORT"
        ]
      },
      {
        id: `${demoStoreId}:Staff`,
        name: "Staff",
        scope: "store",
        storeId: demoStoreId,
        permissions: ["MANAGE_ORDERS", "HANDLE_SUPPORT"]
      }
    ];
    for (const role of storeRolesData) {
      await db.collection("roles").doc(role.id).set(role, { merge: true });
      console.log(`Added store role: ${role.id}`);
    }

    console.log("Creating demo users...");

    const users = [
      {
        email: "admin@nearnest.com",
        password: "Password123!",
        displayName: "Global Admin",
        roles: ["admin", "user"],
        emailVerified: true
      },
      {
        email: "owner@nearnest.com",
        password: "Password123!",
        displayName: "Store Owner",
        roles: ["storeAdmin", `${demoStoreId}:Owner`, "user`"],
        storeId: demoStoreId,
        setOwnerOnStore: true,
        emailVerified: true
      },
      {
        email: "manager@nearnest.com",
        password: "Password123!",
        displayName: "Store Manager",
        roles: [`${demoStoreId}:Manager`, "user"],
        emailVerified: true
      },
      {
        email: "staff@nearnest.com",
        password: "Password123!",
        displayName: "Store Staff",
        roles: [`${demoStoreId}:Staff`, "user"],
        emailVerified: true
      },
      {
        email: "support@nearnest.com",
        password: "Password123!",
        displayName: "Support Agent",
        roles: ["support", "user"],
        emailVerified: true
      },
      {
        email: "verifier@nearnest.com",
        password: "Password123!",
        displayName: "Document Verifier",
        roles: ["verifier", "user"],
        emailVerified: true
      }
    ];

    for (const userData of users) {
      let user = await auth.getUserByEmail(userData.email).catch(() => null);
      if (!user) {
        user = await auth.createUser({
          email: userData.email,
          password: userData.password,
          displayName: userData.displayName,
          emailVerified: userData.emailVerified || false
        });
        console.log(`Created user: ${userData.email}`);
      } else {
        console.log(`User already exists: ${userData.email}`);
        if (userData.emailVerified && !user.emailVerified) {
          await auth.updateUser(user.uid, { emailVerified: true });
          console.log(`Marked ${user.email} as email verified`);
        }
      }

      await db.collection("users").doc(user.uid).set({
        name: user.displayName || userData.displayName,
        email: user.email,
        roles: userData.roles,
        storeId: userData.storeId || null,
        createdAt: Date.now()
      }, { merge: true });

      if (userData.setOwnerOnStore) {
        await db.collection("stores").doc(userData.storeId).update({ ownerId: user.uid });
      }
    }

    console.log("Firestore seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
})();
