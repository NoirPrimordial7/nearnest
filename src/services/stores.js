/*// src/services/stores.js
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase";

export async function listStoresForUser(uid) {
  // owner OR staff member
  const q1 = query(collection(db, "stores"), where("ownerId", "==", uid));
  const q2 = query(collection(db, "stores"), where("staffUids", "array-contains", uid));

  const [oSnap, sSnap] = await Promise.all([getDocs(q1), getDocs(q2)]);
  const seen = new Set();
  const rows = [];

  oSnap.forEach(d => { rows.push({ id: d.id, ...d.data() }); seen.add(d.id); });
  sSnap.forEach(d => { if (!seen.has(d.id)) rows.push({ id: d.id, ...d.data() }); });

  if (!uid) return [];
  return [
    {
      id: "s1",
      name: "Harmony Pharmacy",
      status: "Verified",
      role: "Owner",
    },
    {
      id: "s2",
      name: "CityCare Medicals",
      status: "Pending",
      role: "Staff",
    },
  ];
  return rows;
} */
// src/services/stores.js
import { db } from "../firebase/firebase";
import {
  collection, onSnapshot, query, where,
} from "firebase/firestore";

/**
 * Live list of stores the user owns OR works at.
 * Calls `cb(storesArray)` whenever anything changes.
 * Returns an unsubscribe function.
 */
export function listenStoresForUser(uid, cb) {
  const map = new Map(); // merge q1 + q2 by id
  const colRef = collection(db, "stores");

  const qOwner = query(colRef, where("ownerId", "==", uid));
  const qStaff = query(colRef, where("staffIds", "array-contains", uid));

  const apply = (snap) => {
    snap.docChanges().forEach((chg) => {
      if (chg.type === "removed") {
        map.delete(chg.doc.id);
      } else {
        map.set(chg.doc.id, { id: chg.doc.id, ...chg.doc.data() });
      }
    });
    cb(Array.from(map.values()));
  };

  const u1 = onSnapshot(qOwner, apply);
  const u2 = onSnapshot(qStaff, apply);
  return () => { u1(); u2(); };
}
