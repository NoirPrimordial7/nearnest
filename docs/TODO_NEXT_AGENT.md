# Next-Agent TODO

The top section ("Next up") is rewritten at the end of every session by the `agent-handoff-logger` skill. The backlog below it grows over time.

---

## Next up (as of 2026-04-26, after Codex live-backend verification)

**Live discovery backend is reachable, but do not deploy again until the public-read blockers are handled or explicitly accepted.** Current verified state:
- Firebase CLI is authenticated; active project is `nearnest-platform`.
- `searchMedicines` and `nearbyStores` are deployed in `asia-south1` and returned live seeded data during direct callable checks.
- `searchMedicines` for `Dolo` returned `Dolo 650` with 3 availability rows.
- `nearbyStores` near the seeded Pune coordinate returned 4 public stores with public phone data.
- Mobile `discoveryApi.ts` calls those callables for search and nearby stores and falls back to mock data on errors.
- Static verification passed: mobile typecheck, Android export, Functions syntax check, Functions lint.
- Android dev-client launched on `emulator-5554`; route checks were partial because no verified signed-in test session was available.

**Blockers found:**
- `searchMedicines` and `nearbyStores` do not require `context.auth`; anonymous callable access is still possible.
- Mobile detail/category/store paths still use direct Firestore reads (`getDoc`/`getDocs`) for `medicines`, `stores`, and `inventory`.
- `firestore.rules` has a global signed-in read fallback: `match /{document=**} { allow read: if signedIn(); }`. This undermines field-safety assumptions for signed-in clients.
- Therefore, do **not** claim public store reads are field-safe yet. Callable responses are whitelisted, but direct reads can still expose full docs to signed-in clients.

**Current verified auth state remains unchanged:** Firebase JS SDK only. Email/password and Google sign-in work with Firestore profile persistence. Phone OTP stays deferred by D-015.

### Next steps

1. **Security hardening first:** require auth in `searchMedicines` / `nearbyStores`, add callable-only detail paths (`medicineDetail`, `storeDetail`, `categoryMedicines`), and refactor `discoveryApi.ts` away from direct public store/inventory reads.
2. **Rules cleanup after web-impact review:** remove or tighten the global signed-in read fallback and make direct `stores/{id}` / `inventory/{sku}` public reads unavailable to ordinary mobile users.
3. **Run a full authenticated Android walkthrough with a real verified account:** Home -> Search `Dolo` -> Results -> Medicine detail -> Nearby stores -> Store detail -> Call/Navigate.
4. **Deploy only after explicit approval:** preferred command remains `firebase deploy --only functions,firestore:rules,firestore:indexes --project nearnest-platform`; use explicit function targets if avoiding unrelated remote Functions.
5. **Do not run `firebase deploy --only functions` blindly.** Remote functions not present in local source still exist (`onAuthCreate`, `requestEmailCode`, `setUserRoles`, `verifyEmailCode`).
6. **Do not reseed blindly.** Existing seed data appears live; rerun `node functions/scripts/seedDiscoveryData.js` only when intentionally refreshing demo data.
7. **Review seeded store doc shape before real stores.** Seed docs are protected against key private fields, but contain `licenseNumber`, `licenseAuthority`, `seededBy`, and timestamps in public store docs.
8. **Test forced mock fallback at runtime.** Code fallback is present, but a deliberate backend-failure emulator test was not completed in the latest verification.
9. **Replace the fallback Pune coordinate** before trusting distance ranking in production.
10. **Keep Map SDK deferred** until API-key restrictions and location UX are ready.
11. **Keep Rx discovery informational.** No reserve, upload, order, delivery, buy, request, cart, checkout, medical advice, dosage, or substitution guidance.
12. **Keep Phone OTP deferred.** D-015 still blocks Phone OTP; do not add `@react-native-firebase/*` or SMS backend work here.
13. **Use Graphify before architecture/codebase answers.** Read `graphify-out/GRAPH_REPORT.md`; run `graphify update .` after code changes.

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
