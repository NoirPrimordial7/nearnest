import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { ensureUserDoc } from "./services/userBootstrap";

onAuthStateChanged(auth, async (user) => {
  if (user) await ensureUserDoc(user);
});
