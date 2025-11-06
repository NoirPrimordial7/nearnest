// src/services/storage.js
import { storage } from "../firebase/firebase";
import { ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";

export async function uploadAvatar(uid, file) {
  const path = `avatars/${uid}/${Date.now()}-${file.name}`;
  const r = ref(storage, path);
  await uploadBytes(r, file, { contentType: file.type || "image/*" });
  const url = await getDownloadURL(r);
  return { url, path };
}

export async function uploadStoreDoc(uid, storeId, file, kind = "misc") {
  const safe = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `storeDocs/${uid}/${storeId}/${Date.now()}-${safe}`;
  const r = ref(storage, path);
  await uploadBytes(r, file, { contentType: file.type || "application/octet-stream" });
  const url = await getDownloadURL(r);
  return { url, path, kind, name: file.name, size: file.size, contentType: file.type || null };
}

export async function listStoreDocs(uid, storeId) {
  const base = ref(storage, `storeDocs/${uid}/${storeId}`);
  const { items } = await listAll(base);
  const urls = await Promise.all(items.map(getDownloadURL));
  return urls;
}
