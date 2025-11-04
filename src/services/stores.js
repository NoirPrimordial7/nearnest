// src/services/stores.js
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
}
