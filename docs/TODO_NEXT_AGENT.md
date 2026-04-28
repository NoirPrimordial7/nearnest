# Next-Agent TODO

The top section ("Next up") is rewritten at the end of every session by the `agent-handoff-logger` skill. The backlog below it grows over time.

---

## Next up (as of 2026-04-28, after route preview demo-store fallback hotfix)

**Current local state:** Route preview now falls back to local demo store details when the live `getStoreDetail` callable cleanly returns no store for a mock/demo store ID. This fixes `/navigation/[storeId]` showing `store_not_found` for demo stores such as `store_greenleaf`. No web app files were touched, no Firebase deploy was run, and no production data was mutated.

**What changed locally:**
- `apps/mobile/services/discoveryApi.ts` now returns mock store details and inventory groups when backend store detail returns `null` but `getStoreById(storeId)` has a demo store.
- `apps/mobile/app/navigation/[storeId].tsx` logs fallback telemetry context when a route uses the demo-store fallback.
- `apps/mobile/services/telemetry.ts` includes `medifind.navigation.store_fallback_used`.

**Verification passed:**
- `apps/mobile npm run typecheck`.
- `apps/mobile npx expo export --platform android --output-dir .expo/route-fallback-hotfix-export --no-bytecode`.
- `git diff --check`.
- `graphify update .`.
- Note: Expo export needed an escalated rerun because Node hit Windows `EPERM` resolving `C:\Users\Aditya`; the rerun passed.

### Next steps

1. Commit and push:
   `git add apps/mobile docs/AGENT_LOG.md docs/TODO_NEXT_AGENT.md docs/SESSION_STATE.md graphify-out && git commit -m "fix(mobile): fall back to demo store details for route preview"`.
2. Do not stage `.claude/settings.local.json`, `.codex/*.png`, `.env*`, `apps/mobile/.env`, or `serviceAccountKey.json`.
3. Restart Metro on the current APK and test: Search -> Medicine detail -> Nearby stores -> Route for `store_greenleaf` or another demo store.
4. Expected result: route preview opens inside Medifind, shows demo fallback note if live details are unavailable, and does not show `Route unavailable`.
5. The current APK may still show `[RealMapView] Android Maps SDK key missing; using fallback map preview`; that is separate and expected until a rebuilt APK with the Android Maps key is installed.

---

## Backlog (in rough priority order)

### Architecture + planning
- Discovery MVP backend readiness: confirm `searchMedicines`, `nearbyStores`, Places/geocode proxy functions, store public contact fields, store coordinates, and inventory freshness metadata.
- Phase 2 commerce backlog only: `orders/`, `prescriptions/`, `payments/`, `deliveries/` schemas, rules, indexes, and functions.
- Do not treat Razorpay, Rx approval, cart, checkout, or delivery as blockers for the discovery MVP.

### Mobile app
- Scaffold exists in `apps/mobile/` with placeholder Splash, Welcome, Sign In, Sign Up, Profile Setup, and Home.
- Splash, Welcome, Sign In, and Sign Up have polished implementations.
- Sign In and Sign Up now call Firebase Auth email/password methods through `apps/mobile/services/auth.ts` with Expo public env config from `apps/mobile/services/firebase.ts`.
- `apps/mobile/.env.example` documents the required mobile Firebase env keys; real `.env` files are ignored.
- Google Auth is wired through `expo-auth-session` / `expo-web-browser` and Firebase JS SDK; Android live testing now needs a manual credentialed pass in the installed development build.
- Successful Google and email/password sign-in now write basic Firestore profile data to `users/{uid}` without writing roles/permissions.
- Phone auth remains disabled and marked coming soon.
- Email Verification and Forgot Password routes are present.
- Profile setup persistence is present; saved search area/address remains next.
- Location permission + address/search-area picker
- Home list + Home map
- Medicine search + search results
- Store detail + medicine detail
- Contact store + native navigation handoff
- Optional: stale availability report / notify-me if backend exists
- Phase 2 only: cart, checkout, payment, prescription approval, orders, delivery, store-admin mobile surface

### Shared design
- Build theme token file from `docs/DESIGN_SYSTEM.md` - but only inside `apps/mobile/theme/`, never overwrite web styles.
- Pick an icon set that matches `lucide-react` on web (candidate: `lucide-react-native`).

### Security + compliance
- Security review of the committed `serviceAccountKey.json`, `.env`, `.env.local` (flag to website team - do not remove yourself).
- Plan App Check rollout for prod.
- Plan test framework adoption only after scaffold is approved.
- Run security/compliance review before any Phase 2 Rx, payment, order, or delivery implementation.

### Housekeeping
- Confirm jezweb / expo external skills register with Claude Code's plugin system after `/reload-plugins`. If not, decide whether to author proper `plugin.json` wrappers or read them directly from `.claude/external/*/` on demand.

---

## Discovery security follow-up (appended 2026-04-26)

This session hardened `firestore.rules` to require `signedIn()` on the three public discovery read paths (medicines, public stores, public inventory). The deeper field-level fix is **not** done. Next agent's options:

**Option A (recommended) — callable-only public reads.**
- Add three new callables in `functions/index.js`: `medicineDetail(medicineId)`, `storeDetail(storeId, q?, filter?)`, `categoryMedicines(categoryId, filter?)`. Each returns whitelisted fields only (mirror the existing `normalizeMedicine` / `normalizeStore` / `normalizeInventoryItem` from `searchMedicines` and `nearbyStores`).
- Refactor `apps/mobile/services/discoveryApi.ts` to remove direct `getDoc`/`getDocs` calls on `stores/{id}`, `stores/{id}/inventory`, and `medicines/{id}`/`medicines`. Use the new callables only. Keep the mock fallback path (`source: 'backend' | 'mock'`) intact.
- Tighten `firestore.rules` so `stores/{id}` direct client reads require `canAccessStore` (no `isPublicStoreData` branch). Same for `inventory/{sku}`. Medicines can stay `signedIn()` since they carry no PII.

**Option B — sanitized mirror collection.**
- Introduce `publicStores/{id}` collection. A Cloud Function trigger on `stores/{id}` writes a whitelisted subset to `publicStores/{id}` whenever the store is public+verified+active. Mobile reads `publicStores/{id}` only. Tighten `stores/{id}` rules to deny public reads entirely.

**Other queued items:**
- **Global rules fallback** `match /{document=**} { allow read: if signedIn(); }` is too permissive for Phase 2 collections (orders, payments, prescriptions). Add explicit strict rules for each before any Phase 2 collection writes go live. Currently no Phase 2 collections exist, so non-blocking today.
- **Seed script credentials**: `functions/scripts/seedDiscoveryData.js` requires `serviceAccountKey.json` at repo root. Cleaner: switch to `GOOGLE_APPLICATION_CREDENTIALS` env-var. Untracked file currently — adjust before first commit if you want.
- **Live emulator test** of the discovery backend integration. The dev build is already installed on the user's emulator. Walk: Splash → sign in → Home → search "dolo" → Results → Medicine detail → Find nearby stores → Store detail → Call/Navigate. Confirm `source: 'backend'` banner shows when reachable, `source: 'mock'` fallback works in flight mode.
- **Deploy** when (and only when) the user explicitly says **YES DEPLOY FIREBASE**:
  ```
  firebase deploy --only functions,firestore:rules,firestore:indexes
  ```

**Suggested git add (do NOT `git add .`) for this session's hardening only:**
```
git add firestore.rules docs/AGENT_LOG.md docs/SESSION_STATE.md docs/TODO_NEXT_AGENT.md
```

**Suggested commit message:**
```
fix(firebase): harden public discovery reads to require signed-in
```

For Codex's already-staged backend integration (functions/index.js, firestore.indexes.json, mobile/services/discoveryApi.ts, mobile screens, seed script), the user should review and commit those in a separate commit or with the user's chosen scope.

---

## Auth polish handoff (appended 2026-04-26)

This is a small append-only handoff to track the live-test items the user must run after the 2026-04-26 auth-polish session. The locked discovery design sections above are unchanged. Do not move or rewrite them.

**Session rollback tag:** `pre-auth-polish-20260426-1323`. To revert: `git reset --hard pre-auth-polish-20260426-1323`.

**Files added / changed in the session:**
- `apps/mobile/app/sign-up.tsx` (rewritten form layer: confirm password, show/hide toggles, stronger validation, tappable T&C links, per-field errors, silent Google cancel)
- `apps/mobile/app/sign-in.tsx` (password show/hide; silent Google cancel)
- `apps/mobile/services/googleAuth.ts` (`getGoogleAuthResultMessage` returns empty string on cancel/dismiss; tightened error copy)
- `apps/mobile/app/terms.tsx` **(new)** with medical disclaimer + emergency line + `[LEGAL REVIEW NEEDED]` markers
- `apps/mobile/app/privacy.tsx` **(new)** with what-we-collect / what-we-don't, Firebase mention, children's notice
- `docs/AGENT_LOG.md`, `docs/SESSION_STATE.md`, `docs/TODO_NEXT_AGENT.md` (this section)

**Phone OTP outcome:** [DEFER]. D-015 already documents this with today's date. No `@react-native-firebase` was added, no Cloud Function path was opened. The `/phone-otp` route remains a disabled "coming soon" surface.

**Live tests to run on the Android Studio dev build (T1–T12, full table in AGENT_LOG):**
1. Cold launch → Welcome.
2. Google sign-in still works.
3. Email signup with mismatched passwords → Create button stays disabled, inline error visible.
4. Email signup with terms unchecked → Create button stays disabled.
5. Email signup all valid → routes to /verify-email.
6. Email sign-in with wrong password → friendly error: "Email or password is incorrect."
7. Forgot password sends reset email.
8. Tap Terms → /terms opens with medical disclaimer + emergency line.
9. Tap Privacy → /privacy opens.
10. Phone OTP entry → button is disabled with "Phone login coming soon".
11. Sign out from Home → Welcome.
12. Kill app, reopen → if profile complete, lands on Home without re-login.

**Manual Firebase Console / one-time items (none new vs prior session):**
- Email/Password and Google providers enabled.
- OAuth Web Client ID matches `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
- Android dev SHA-1 registered against the Android OAuth client.

**Suggested next Codex task** (paste verbatim to Codex when ready):

```
Implement the Medifind discovery redesign per the locked specs in
docs/MOBILE_APP_PLAN.md, docs/MOBILE_UI_SCREEN_SPECS.md, and
docs/DESIGN_SYSTEM.md (all "Discovery Redesign 2026-04-25" sections).
Auth polish from 2026-04-26 has already landed; do not regress it.
Mock data only. No backend, no Maps SDK, no Phone OTP, no commerce.
After build run: cd apps/mobile && npm run typecheck;
npx expo export --platform android --output-dir .expo/discovery-redesign-export;
git diff --check.
Suggested commit: feat(mobile): implement discovery redesign with dual-mode home and mock data.
```

---

## Verification follow-up 2026-04-27 (Claude)

The deployed discovery backend was verified statically this session — all 6 callables live in `asia-south1`, lint + typecheck clean, supportTickets rules give the right least-privilege answers, callable responses confirmed PII-free by grep + `normalizeStore` projection. See `docs/AGENT_LOG.md` 2026-04-27 entry for the full report.

**Live tests still pending** (user must drive):
1. **Android dev-build discovery walk:**
   ```
   cd apps/mobile
   npx expo start -c --dev-client --android --port 8081
   ```
   Walk: Splash → sign in → Home → search "Dolo" → Results → Medicine detail → Find nearby stores → Store detail → Call/Navigate. Confirm `source: 'backend'` and the `source: 'mock'` fallback in flight mode.
2. **Web admin supportTickets UI:** confirm dashboard count loads, list page renders, reply / close / reassign all succeed under an admin/support sign-in. Confirm a non-support user CANNOT list `supportTickets`.

**Cleanup queue (low-priority, non-blocking):**
- Resolve **`setUserRoles` (plural, deployed) vs `setUserRole` (singular, in `BACKEND_FUNCTIONS_CONTRACT.md` D-009)**. Pick one and update the other.
- Audit `firestore.rules` for now-unused helpers (`isPublicStoreData`, `isPublicStore` may be dead after the callable-only switch). Remove if confirmed unused.
- Bump `firebase-functions` from `^6.0.1` to current; review v6 changelog before bump.
- Plan migration off `functions.config()` before its March 2027 deprecation cutoff (move to environment-based / parameterised secrets).
- Decide whether to gitignore `.codex/*.png` debug screenshots or move them out of the repo.

**Suggested git add for this session's docs:**
```
git add docs/AGENT_LOG.md docs/SESSION_STATE.md docs/TODO_NEXT_AGENT.md
```

**Suggested commit message:**
```
test(discovery): verify deployed hardened backend
```

**Do NOT deploy again** unless a real production bug is found.
