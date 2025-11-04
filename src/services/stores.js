import { db } from "../firebase/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export async function getStoresForUser(uid) {
  const storesCol = collection(db, "stores");

  // 1) Owned by user
  const qOwner = query(storesCol, where("ownerId", "==", uid));
  const owned = await getDocs(qOwner);

  // 2) Staff membership (array-contains)
  const qStaff = query(storesCol, where("staffIds", "array-contains", uid));
  const staffed = await getDocs(qStaff);

  const map = new Map();
  owned.forEach((d) => map.set(d.id, { id: d.id, ...d.data() }));
  staffed.forEach((d) => map.set(d.id, { id: d.id, ...d.data() }));

  // Normalize status field name
  return Array.from(map.values()).map((s) => ({
    ...s,
    verificationStatus: s.verificationStatus || s.status || "Pending",
  }));
}
