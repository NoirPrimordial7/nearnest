# Next-Agent TODO

The top section ("Next up") is rewritten at the end of every session by the `agent-handoff-logger` skill. The backlog below it grows over time.

---

## Next up (as of 2026-04-26, after discovery redesign implementation)

**Discovery redesign is now implemented with mock data.** The Expo app has the locked dual-mode Medifind discovery surfaces:
- `app/home.tsx` dual-mode Medicine / Medical Stores entry.
- `app/search.tsx` live suggestions.
- `app/results.tsx` grouped medicine results.
- `app/medicine/[medicineId].tsx` medicine detail.
- `app/medicine/[medicineId]/stores.tsx` nearby stores with map placeholder and bottom-sheet list.
- `app/stores/index.tsx` stores-mode landing.
- `app/store/[storeId].tsx` store detail with grouped inventory and in-store search.
- `app/category/[categoryId].tsx` category browse.
- `app/profile.tsx` larger-text toggle.

**Current verified auth state remains unchanged:** Firebase JS SDK only. Email/password and Google sign-in save or refresh `users/{uid}` in Firestore, then route through email verification, profile completion, and `/home`. Phone OTP stays deferred by D-015.

**What is still mock:** all medicine, store, inventory, freshness, search suggestion, category, map, and availability data. No backend calls, real Maps SDK, cart, delivery, payment, checkout, order tracking, or Phone OTP were added.

### Next steps

1. **Commit this implementation.** Suggested message: `feat(mobile): implement discovery redesign with dual-mode home and mock data`.
2. **Manual dev-build smoke test.** From `apps/mobile`, run `npx expo start -c --dev-client --android --port 8081`; if emulator LAN hangs, open the dev-client URL with `10.0.2.2:8081`. Test: Home mode toggle -> Search -> Results -> Medicine detail -> Nearby stores -> Store detail -> Call/Navigate fallback -> Category browse -> Profile larger-text toggle.
3. **Backend readiness before replacing mocks.** Required: `searchMedicines`, `nearbyStores`, store coordinates/geohash, verified/open state, public store contact fields, inventory availability/freshness timestamps, rules, and indexes.
4. **Location/search-area gate next.** The auth gate still routes complete profiles directly to Home. Add location permission and manual search-area selection before real ranking.
5. **Telemetry sink decision.** `medifindTelemetry.emit` is console-only because this task explicitly prohibited backend calls. Add the Firestore ring buffer or Cloud Functions sink only after client-write policy is approved.
6. **Profile larger-text persistence decision.** The toggle is local AsyncStorage only for the same no-backend-call reason. Sync to `users/{uid}.preferences.largeType` only when backend/profile-write policy is approved.
7. **Map rendering decision later.** Current UI uses `MapPlaceholder` and opens Google Maps URLs. Add `react-native-maps` or `expo-maps` deliberately after data contracts and key restrictions are ready.
8. **Keep Rx discovery informational.** Continue showing Rx badges and the canonical warning; do not add reserve, upload, order, delivery, buy, request, cart, or checkout behavior.
9. **Use Graphify before architecture/codebase answers.** Read `graphify-out/GRAPH_REPORT.md`; run `graphify update .` after code changes when `graphify-out/**` is in scope.
10. **Do not edit protected areas.** No edits to root `src/**`, `functions/**`, `dataconnect/**`, Firebase rules/config, root package files, root env files, or `serviceAccountKey.json` without explicit authorization.

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
