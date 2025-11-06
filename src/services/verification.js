// src/services/verification.js
import { db } from "../firebase/firebase";
import { collection, addDoc, serverTimestamp, onSnapshot, orderBy, query } from "firebase/firestore";
import { uploadStoreDoc } from "./storage";

export async function uploadVerificationDoc(uid, storeId, file, kind) {
  const { url, path, name, size, contentType } = await uploadStoreDoc(uid, storeId, file, kind);
  await addDoc(collection(db, "stores", storeId, "docs"), {
    kind,
    url,
    path,
    name,
    size,
    contentType,
    status: "Pending",         // Admin can flip to Approved/Rejected
    uploadedBy: uid,
    createdAt: serverTimestamp(),
  });
  return { url, path };
}

export function listenVerificationDocs(storeId, cb, onError) {
  const q = query(collection(db, "stores", storeId, "docs"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, onError);
}
