import { db } from "../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

/**
 * Merge permissions of multiple role docs (store scoped).
 */
export async function computeMemberPermissions(storeId, roleNames = []) {
  const rolesCol = collection(db, "stores", storeId, "roles");
  const rolesSnap = await getDocs(rolesCol);
  const byName = {};
  rolesSnap.forEach((d) => { byName[d.data().name] = d.data(); });

  const merged = {};
  for (const r of roleNames) {
    const role = byName[r];
    if (!role?.permissions) continue;
    for (const k in role.permissions) {
      if (role.permissions[k]) merged[k] = true;
    }
  }
  // Always include "store.view" for members
  merged["store.view"] = true;
  return merged;
}
