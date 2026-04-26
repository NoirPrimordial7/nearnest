# Next-Agent TODO

The top section ("Next up") is rewritten at the end of every session by the `agent-handoff-logger` skill. The backlog below it grows over time.

---

## Next up (as of 2026-04-26, after discovery redesign 2026-04-25)

**Discovery redesign — DOCS LOCKED.** A full Phase 0 product strategy + screen specs + design tokens + data model live in:
- `docs/MOBILE_APP_PLAN.md` § "Discovery Redesign 2026-04-25"
- `docs/MOBILE_UI_SCREEN_SPECS.md` § "Discovery Redesign 2026-04-25"
- `docs/DESIGN_SYSTEM.md` § "Discovery Redesign 2026-04-25"

These supersede the older single-mode discovery screens. Auth, Rx doctrine, splash/welcome/sign-in/sign-up/verify-email/forgot-password/profile-setup specs are unchanged.

**Current verified auth state:** Medifind mobile uses Firebase JS SDK only. Email/password and Google sign-in both save or refresh `users/{uid}` in Firestore, then route through: unverified password user -> `/verify-email`; incomplete profile -> `/profile-setup`; complete profile -> `/home`. Google dev-build flow passed on emulator via `10.0.2.2:8081`.

**Phone OTP direction:** D-015 defers Phone OTP until after the medicine discovery MVP. The `/phone-otp` route remains a disabled "coming soon" UI.

**Canonical MVP remains:** find a medicine, show nearby stores with availability, show store detail, guide/navigation, and call/contact store. Delivery, cart, checkout, payment, orders, and prescription delivery are Phase 2.

### Next Codex implementation prompt (paste verbatim)

```
You are implementing the Medifind discovery redesign defined in:
- docs/MOBILE_APP_PLAN.md           §"Discovery Redesign 2026-04-25"
- docs/MOBILE_UI_SCREEN_SPECS.md    §"Discovery Redesign 2026-04-25"
- docs/DESIGN_SYSTEM.md             §"Discovery Redesign 2026-04-25"

Build under apps/mobile/ ONLY. Do NOT edit src/, functions/, dataconnect/,
Firebase rules/config, root package files, root env files, or
serviceAccountKey.json.

Mock data only. No live backend, no Maps SDK, no Phone OTP, no cart, no
checkout, no payment, no delivery, no medical advice or dosage copy.

Build the routes named in the screen specs route map:
  app/home.tsx                       (REDESIGN — dual-mode)
  app/search.tsx                     (REDESIGN — live suggestions)
  app/results.tsx                    (NEW — grouped results)
  app/medicine/[medicineId].tsx      (REDESIGN — medicine detail)
  app/medicine/[medicineId]/stores.tsx  (NEW — nearby stores sheet)
  app/stores/index.tsx               (NEW — Stores mode landing)
  app/store/[storeId].tsx            (REDESIGN — inventory + in-store search)
  app/category/[categoryId].tsx      (NEW — category browse)
  app/profile.tsx                    (small redesign — add Larger text toggle)

Build (or extract) these components, naming them exactly per
DESIGN_SYSTEM §R8:
  ProductCard, StoreCard, CategoryCard, SearchBar, ModeToggle,
  BottomSheet, Chip, Badge (rx | verified | availableNearby |
  callToConfirm), EmptyState, ErrorState, OfflineBanner,
  StaleDataBanner, MapPlaceholder.

Replace apps/mobile/services/mockDiscovery.ts with a mock-data layer that
matches the data model in MOBILE_APP_PLAN.md §"Data Model" exactly:
Medicine, MedicineVariant, Composition, Manufacturer, Category, Store,
StoreInventoryItem, SearchSuggestion, RecentSearch. Seed at least:
  20 Medicines (across 8 categories, 5 Rx, 15 OTC, including the
    symptom-mapped compositions in §0.4.1)
  6 Compositions
  6 Manufacturers
  8 Categories matching the home grid
  10 Stores (8 verified, 2 not)
  90 StoreInventoryItems with mixed freshness (≥ 1 stale > 24h, ≥ 1
    very stale > 72h)
  10 RecentSearch placeholders
  12 popular SearchSuggestions

Ship telemetry as no-op functions today: medifindTelemetry.emit(name,
payload) writes to console + a Firestore ring buffer at
telemetry/{uid}/events (cap 200, drop oldest). Wire every event listed
in MOBILE_APP_PLAN.md §0.10.

Implement the Larger-text accessibility toggle: persist to
users/{uid}.preferences.largeType and apply the 1.15× scale via a
useFontScale() hook.

Hard rules:
- NO medical advice strings beyond the canonical Rx warning.
- NO add-to-cart / reserve / order / buy / request CTAs anywhere.
- NO Phone OTP work.
- NO real Maps SDK; render the MapPlaceholder.
- NO new package dependencies without explicit user approval.

After the build:
  cd apps/mobile && npm run typecheck
  npx expo export --platform android --output-dir .expo/discovery-redesign-export
  graphify update . (if in scope)
  git diff --check

Suggested commit message:
  feat(mobile): implement discovery redesign with dual-mode home and mock data
```

### Standing items

1. **Commit the discovery redesign docs.** Suggested message: `docs(mobile): redesign discovery UX for medicine and store modes`.
2. **Resolve the 5 open questions** in `MOBILE_APP_PLAN.md` § "Open Questions" — especially Open Question 1 (mode toggle visibility for low-tech users) before public launch.
3. **Backend readiness for replacing mocks.** Required when the redesign UI is shipped: `searchMedicines`, `nearbyStores`, store coordinates/geohash, public store phone/contact fields, verified/open state, inventory availability + freshness timestamps, rules, and indexes.
4. **Inventory freshness SLA with website team.** Open Question 4 — needs a policy ask: hide a store after 7 days without inventory writes; amber warning after 24 hours.
5. **Map rendering decision** later. Current `Navigate` opens the OS maps URL only. Add `react-native-maps` or `expo-maps` deliberately after data contract is ready and rebuild the dev client.
6. **Use Graphify before architecture/codebase answers.** Read `graphify-out/GRAPH_REPORT.md`; run `graphify update .` after code changes when `graphify-out/**` is in scope.
7. **Do not edit protected areas.** No edits to root `src/**`, `functions/**`, `dataconnect/**`, Firebase rules/config, root package files, root env files, or `serviceAccountKey.json` without explicit authorization.

1. **Commit the current discovery UI and D-015 changes.** Suggested message: `feat(mobile): add mock medicine discovery flow`.
2. **Test the mock UI in the development build.** Start Metro from `apps/mobile` with `npx expo start -c --dev-client --android --port 8081`; if emulator LAN hangs, open the dev-client URL with `10.0.2.2:8081`.
3. **Prepare real backend contracts before replacing mock data.** Required: `searchMedicines`, `nearbyStores`, store coordinates/geohash, public store phone/contact fields, verified/open state, inventory availability/freshness timestamps, rules, and indexes.
4. **Replace mocks with mobile service wrappers only after backend readiness.** Add `services/search.ts`, `services/stores.ts`, and `services/location.ts`; keep clients calling Cloud Functions instead of direct inventory joins.
5. **Add location/search-area gate next.** The current auth gate stops at profile completion; discovery still needs a saved search area or permission/manual-location flow before real ranking.
6. **Choose and configure map rendering later.** Current Navigate actions use native Google Maps URLs only. Add `react-native-maps` or `expo-maps` deliberately after the data contract is ready and rebuild the dev client.
7. **Keep Rx discovery informational.** Show "Prescription required" and tell users to carry/call with a valid prescription; do not add reserve/order/upload/delivery behavior to MVP.
8. **Directly verify the Google Firestore doc if needed.** Use Firebase Console or a token-safe read of `users/{uid}`; do not print ID tokens or secrets.
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
