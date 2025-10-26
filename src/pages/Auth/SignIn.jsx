// Example (SignIn.jsx)
import styles from "./auth.module.css";
import SocialAuthButtons from "../../components/SocialAuthButtons";
import {
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from "../../lib/firebase";


export default function SignIn() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    setMsg(null);
  }, [email, pass]);

  const onEmailLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      nav("/admin", { replace: true });
    } catch (err) {
      setMsg(err.message || "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      nav("/admin", { replace: true });
    } catch (err) {
      setMsg(err.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const onReset = async () => {
    if (!email) return setMsg("Enter your email to reset the password.");
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email.trim());
      setMsg("Reset link sent to your email.");
    } catch (err) {
      setMsg(err.message || "Could not send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <div className={styles.brandSide}>
          <div className={styles.logoDot}>nearnest</div>
          <h1>Welcome back 👋</h1>
          <p className={styles.muted}>
            Sign in to manage stores, verifications, and support — all in one dashboard.
          </p>
        </div>

        <div className={styles.formSide}>
          <h2>Sign in</h2>

          {msg && <div className={styles.alert}>{msg}</div>}

          <form className={styles.form} onSubmit={onEmailLogin}>
            <label>
              <span>Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </label>

            <label>
              <span>Password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="Your password"
                required
              />
            </label>

            <button className={styles.primary} type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className={styles.row}>
            <button className={styles.linkBtn} onClick={onReset} disabled={loading}>
              Forgot password?
            </button>
            <div className={styles.spacer} />
            <Link to="/signup" className={styles.linkBtn}>
              Create account
            </Link>
          </div>

          <div className={styles.divider}><span>or continue with</span></div>

          <SocialAuthButtons onGoogle={onGoogle} loading={loading} />
        </div>
      </div>
    </div>
  );
}
