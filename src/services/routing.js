import { auth } from "../firebase";
import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";

// Decide where to send the user after login
export async function computeLandingRoute() {
  const user = auth.currentUser;
  if (!user) return "/signin";

  const userDoc = await getDoc(doc(db, "users", user.uid));
  const data = userDoc.exists() ? userDoc.data() : null;

  // 1) Admin goes to /admin
  if (data?.admin) return "/admin";

  // 2) If user is active member of a store, prefer their "owner" store dashboard
  // (You can adjust this to choose last-used store etc.)
  const storesQ = query(
    collection(db, "stores")
  );
  const storesSnap = await getDocs(storesQ);

  for (const store of storesSnap.docs) {
    const m = await getDoc(doc(db, "stores", store.id, "members", user.uid));
    if (m.exists() && m.data().active) {
      // Owner → priority route
      if ((m.data().roles || []).includes("owner")) return `/store/${store.id}/dashboard`;
    }
  }
  // If member but not owner, send to the first active store
  for (const store of storesSnap.docs) {
    const m = await getDoc(doc(db, "stores", store.id, "members", user.uid));
    if (m.exists() && m.data().active) {
      return `/store/${store.id}/dashboard`;
    }
  }

  // 3) Everyone else → /home
  return "/home";
}
