# Nearnest Session State

Last updated: 2026-04-26 (Codex re-verified live discovery backend; no deploy/seed this session; security blockers remain before next deploy)

## Live discovery backend verification 2026-04-26 (Codex follow-on)
- Re-read local repo files first. Current `git status --short` before edits showed only unrelated/protected local files: modified `.claude/settings.local.json` and untracked `.codex/medifind-*.png`; these were not touched.
- Verified `functions/index.js` exports `searchMedicines` and `nearbyStores` callables in `asia-south1`.
- Verified `apps/mobile/services/firebase.ts` exports regional `firebaseFunctions`, and `apps/mobile/services/discoveryApi.ts` calls `searchMedicines` / `nearbyStores` with mock fallback on errors.
- Verified mobile discovery screens call `discoveryApi`: `/home`, `/results`, `/medicine/[medicineId]`, `/medicine/[medicineId]/stores`, `/stores`, `/store/[storeId]`, and `/category/[categoryId]`.
- Firebase CLI is authenticated and active project is `nearnest-platform`; `.firebaserc` points default to `nearnest-platform`; `firebase target` shows no resource targets.
- Live direct callable verification passed again: `searchMedicines` for `Dolo` returned `Dolo 650` with 3 availability rows; `nearbyStores` returned 4 stores with public phone data.
- Static verification passed: `apps/mobile npm run typecheck`, `apps/mobile npx expo export --platform android --output-dir .expo/live-discovery-export`, `functions node --check index.js`, and `functions npm run lint`.
- Android dev-client launched on `emulator-5554` via `npx expo start -c --dev-client --android --port 8081`. Deep-link route checks rendered Home, Results, Medicine detail, Nearby stores, Stores mode, Store detail, and Category screens where auth/rules permitted. A full signed-in walkthrough was not completed because no verified test credential/session was available in the emulator.
- Call/Navigate fallback was exercised from a medicine-stores route. The emulator had no usable external handler, so the app emitted `external_link_failed`; this verifies the fallback error path, not a successful dialer/maps handoff.
- **No deploy was run.** Prepared command only: `firebase deploy --only functions,firestore:rules,firestore:indexes --project nearnest-platform`. Use explicit targets `functions:searchMedicines,functions:nearbyStores` if avoiding unrelated remote Functions.
- **No seed was run.** Existing seed scripts are present and previous seed data still responds through live callables.
- **Security blockers remain:** callables do not require `context.auth`; mobile detail/category/store APIs still use direct Firestore reads; `firestore.rules` still has a global `allow read: if signedIn()` fallback. Because of this, do not claim public store reads are field-safe end to end yet.
- Graphify was not run because this session changed documentation only, not code files.

## Discovery rules incremental hardening 2026-04-26 (Claude follow-on)
- Verified Codex's deployed backend by inspection: `searchMedicines` + `nearbyStores` callables in `asia-south1`, indexes in place, mobile `discoveryApi.ts` uses callables with mock fallback, seed script seeded 8 medicines + 4 stores + 17 inventory rows in `nearnest-platform`, `@react-native-firebase/*` NOT added.
- **Security pre-fix:** `firestore.rules` allowed unauthenticated reads of `medicines/{id}`, public-verified `stores/{id}`, and public-store `inventory/{sku}` — anonymous catalog and pharmacy scraping was possible. The seed script's `assertStoreDocsSafe` keeps seeded stores clean, but rules cannot field-filter on doc reads, so any future store doc that gains private fields would leak them.
- **Fix this session (`firestore.rules`):** `medicines/{id}`, public `stores/{id}`, and public `inventory/{sku}` reads all now require `signedIn()`. Web-portal owner/member/admin paths via `canAccessStore` are unchanged. Mobile users are always signed in by the time they hit discovery, so no functional regression.
- **Deeper risk DOCUMENTED, not fixed:** signed-in users can still read full `stores/{id}` docs through mobile's direct `getDoc` calls in `discoveryApi.ts` (medicine-detail / store-detail / category-browse paths). Proper fix is to add `medicineDetail` / `storeDetail` / `categoryMedicines` callables and refactor `discoveryApi.ts` to call them only — see `docs/TODO_NEXT_AGENT.md`.
- **NOT deployed.** User has not said "YES DEPLOY FIREBASE" for this incremental change. Production currently runs the looser rules Codex shipped earlier today. Prepared (not run): `firebase deploy --only firestore:rules`.
- **Verification:** `apps/mobile npx tsc --noEmit` passes. `functions node --check` on `index.js` + both seed scripts parse OK. `git diff --check` clean.

## Firebase discovery backend live deployment 2026-04-26
- Medifind discovery is now Firebase-backed at the code boundary and has live seeded data for testing. `functions/index.js` exports `searchMedicines` and `nearbyStores` callables in `asia-south1`.
- `searchMedicines` searches `medicines` by `searchTokens` plus fallback matching across name/brand/manufacturer/category/salt/compositions, applies Rx/OTC/category filters, reads medicine availability from public verified stores, sorts by stock/distance/freshness, and returns mobile-shaped medicine + availability rows.
- The availability path intentionally avoids client or function collection-group inventory reads for `medicineId` after production returned `FAILED_PRECONDITION`; it now checks each nearby public store's `stores/{storeId}/inventory/{medicineId}` doc and falls back to a store-local `where("medicineId", "==", ...)` query.
- `nearbyStores` accepts a user/search-area location and radius, uses a geohash-prefix query with fallback scan, filters to `publicDiscovery: true` verified active stores, sorts by distance, and returns public store details with inventory preview rows.
- `firestore.rules` allows public reads for `medicines/{medicineId}`, public discovery verified stores, and `stores/{storeId}/inventory/{sku}` under public stores. Store inventory writes remain limited to store owner/member/verifier/admin paths.
- `firestore.indexes.json` includes medicine search/category, store geohash, inventory query indexes, and a collection-group single-field override for `inventory.medicineId`.
- `apps/mobile/services/firebase.ts` exports regional `firebaseFunctions`.
- `apps/mobile/services/discoveryApi.ts` calls the backend and maps documents into existing mobile discovery types. It falls back to `mockDiscovery` if callables, rules, network, or seeded data are unavailable.
- Mobile discovery screens call the service layer: `/home`, `/results`, `/medicine/[medicineId]`, `/medicine/[medicineId]/stores`, `/stores`, `/store/[storeId]`, and `/category/[categoryId]`.
- Production deploy passed for Firestore rules/indexes and explicit Functions targets `searchMedicines` / `nearbyStores`. Existing remote functions not present in local source were left untouched.
- Seed data was written to `nearnest-platform`: 8 medicines, 4 public discovery stores, and 17 inventory rows. Demo public store ids: `medifind_demo_greenleaf`, `medifind_demo_carepoint`, `medifind_demo_citymed`, and `medifind_demo_wellnest`.
- Live callable verification passed: `searchMedicines` for `Dolo` returned `Dolo 650` with 3 availability rows; `nearbyStores` for the seeded Pune coordinate returned 4 stores, with public phone data present.
- Static verification passed: `apps/mobile npm run typecheck`, Android Expo export to `.expo/backend-live-verification-export`, `functions node --check index.js`, script syntax checks, and `functions npm run lint`.
- Firestore emulator validation was not completed because the local Firebase CLI requires Java 21+ on this machine. Production rules compile/deploy succeeded.
- Manual Android dev-build discovery walkthrough against live seeded data is still needed before calling the UI runtime-verified.
- Important security note: public store reads are now gated by `publicDiscovery: true`, but real production store docs should still avoid private owner/member/internal fields in public documents.

## Discovery redesign implementation 2026-04-26
- Medifind discovery redesign is now implemented in `apps/mobile/**` with mock data only.
- Routes added or redesigned: `/home` dual-mode Medicine / Medical Stores, `/search` live suggestions, `/results` grouped results, `/medicine/[medicineId]`, `/medicine/[medicineId]/stores`, `/stores`, `/store/[storeId]`, `/category/[categoryId]`, and `/profile`.
- New shared discovery components: `ProductCard`, `StoreCard`, `CategoryCard`, `SearchBar`, `ModeToggle`, `BottomSheet`, `Chip`, `Badge`, `EmptyState`, `ErrorState`, `OfflineBanner`, `StaleDataBanner`, and `MapPlaceholder`.
- `apps/mobile/services/mockDiscovery.ts` now seeds 20 medicines, 17 compositions, 6 manufacturers, 8 categories, 10 stores, 90 inventory items, 10 recent searches, and 12 popular suggestions.
- `medifindTelemetry.emit` is console-only for now because this task explicitly prohibited backend calls. The Firestore ring buffer sink remains deferred until client-write policy is approved.
- Profile `Larger text` uses local AsyncStorage and a `useFontScale()` hook. Firestore sync to `users/{uid}.preferences.largeType` remains deferred for the same no-backend-call reason.
- No backend Functions, Firestore inventory reads, Firebase rules/config, real Maps SDK, Phone OTP, cart, checkout, payment, delivery, or order tracking were added.
- Verification passed: `npm run typecheck`, `npx expo export --platform android --output-dir .expo\discovery-redesign-export`, `graphify update .`, and `git diff --check`.

## Auth polish 2026-04-26 (this session)
- Sign Up now has a Confirm Password field, password show/hide, stronger password rule (≥ 8 chars, ≥ 1 letter, ≥ 1 number), per-field inline errors, and tappable Terms / Privacy Policy links.
- New screens: `apps/mobile/app/terms.tsx` and `apps/mobile/app/privacy.tsx` with substantive MVP-but-correct legal copy. Both carry the medical disclaimer (Medifind does not provide medical advice, diagnosis, dosage, prescriptions, delivery, or emergency services), an emergency-line callout, and explicit `[LEGAL REVIEW NEEDED]` markers where local legal counsel is required.
- Sign In gained a password show/hide toggle.
- Google sign-in `cancel` / `dismiss` is now silent (no error toast on user back-press).
- **Phone OTP outcome:** [DEFER] — D-015 already documents the rationale (no `@react-native-firebase` migration; no Cloud-Functions OTP path; `expo-firebase-recaptcha` archived). No new dependencies. No `package.json` change. No EAS rebuild required.
- `npx tsc --noEmit` from `apps/mobile/`: passes.
- Rollback tag for this session: `pre-auth-polish-20260426-1323`.
- Manual confirmation needed: T1–T12 in `docs/AGENT_LOG.md` 2026-04-26 entry must be run on the Android Studio dev build by the user.

## Discovery redesign 2026-04-25 (docs-only this session)
A full Phase 0 product strategy + screen specs + design tokens + data model are now in:
- `docs/MOBILE_APP_PLAN.md` § "Discovery Redesign 2026-04-25" — product thesis, three concrete personas, sharp wedge, competitive teardown, seven search cases, symptom map, trust signals, accessibility rules, state matrix, non-goals, success metrics, telemetry events, data model (TS-style), open questions, self-critique.
- `docs/MOBILE_UI_SCREEN_SPECS.md` § "Discovery Redesign 2026-04-25" — route map, shared empty/error/offline/stale/no-match templates, and full specs for: Home (dual-mode), Search (live suggestions), Search results (grouped), Medicine detail, Nearby stores for medicine (map + bottom sheet), Stores mode landing, Store detail, In-store search overlay, Category browse, Profile small-redesign.
- `docs/DESIGN_SYSTEM.md` § "Discovery Redesign 2026-04-25" — palette rationale, large-type variant, motion rules, dark-mode policy (deferred), component tokens for ProductCard / StoreCard / CategoryCard / SearchBar / ModeToggle / BottomSheet / Chip / Badge / EmptyState / ErrorState, iconography rules, image asset rules, and a name-to-file mapping for Codex.

These appendices supersede the older single-mode discovery flow. Auth, Rx doctrine, splash/welcome/sign-in/sign-up/verify-email/forgot-password/profile-setup specs are unchanged.

The next Codex task — verbatim implementation prompt — lives in `docs/TODO_NEXT_AGENT.md` § "Next up".



## Current phase
Mobile development has started. Graphify coordination is installed and indexed. The customer-facing mobile app is **Medifind**, with Nearnest remaining the parent/store/admin platform brand.

**Scaffold status (2026-04-24):** `apps/mobile/` contains an Expo managed workflow app using TypeScript and expo-router. Firebase JS SDK is installed and `apps/mobile/services/firebase.ts` initializes the Firebase app, Auth instance, and Firestore instance from Expo public env variables. `apps/mobile/.env.example` lists the required keys, while `apps/mobile/.env` and `.env.local` are ignored. There is still no committed real Firebase config, no callable Functions, no discovery backend wiring, and no backend changes. Placeholder routes exist for Splash, Welcome, Sign In, Sign Up, Profile Setup, and Home.

**Implementation progress (2026-04-25):** Splash, Welcome, Sign In, Sign Up, Verify Email, Forgot Password, Profile Setup, and Home exist in the Expo app. `apps/mobile/services/firebase.ts` uses Firebase JS SDK only, initializes Auth with React Native AsyncStorage persistence, reads required Expo public Firebase env vars, exports Firestore `db`, and does not initialize analytics. Email/password sign-in and sign-up now save or refresh the Firestore profile under `users/{uid}`. Sign-up sends a verification email when possible. Google AuthSession/Firebase credential sign-in saves the same profile shape. Splash, Sign In, Sign Up, Verify Email, and Profile Setup now route through a shared gate: signed-out -> `/welcome`; unverified password user -> `/verify-email`; incomplete profile -> `/profile-setup`; complete profile -> `/home`. Phone login remains disabled and labelled coming soon.

**Verification progress (2026-04-25):** `docs/MOBILE_AUTH_VERIFICATION_REPORT_2026-04-25.md` records the earlier auth verification pass. Current static verification passes: `npm run typecheck`, Android Expo export, dependency checks with Firebase JS SDK and no React Native Firebase, and Graphify update. An EAS Android development build was created successfully after downgrading AsyncStorage to the Expo-pinned `2.2.0` and changing Auth persistence to the default AsyncStorage object. Successful build: `51fcfd40-9e66-44c4-99f6-f0090b1b21e3`; install URL: `https://expo.dev/accounts/noir7777/projects/medifind/builds/51fcfd40-9e66-44c4-99f6-f0090b1b21e3`. The APK installed successfully on emulator `emulator-5554`, and the app reached the Welcome and Sign In screens in the Medifind development client.

**Live verification update (2026-04-26):** A live Firebase JS SDK smoke test passed for email/password auth and Firestore profile persistence against the configured Firebase project. Generated test user: `codex.medifind.20260425191445@example.com`, uid `q0yxtSRkSoSCSxa9r1QXgPUTX0V2`. The test created the Firebase Auth user, wrote `users/{uid}`, confirmed no client-written `roles` or `permissions`, marked the profile complete, signed out, signed back in, and re-read the profile successfully. Because the generated email is not inbox-verifiable, `emailVerified` is `false`; the app should route that account to `/verify-email`. Google OAuth still needs an interactive development-build pass with a real Google account. During the latest emulator check, ADB initially saw `emulator-5554`, then the emulator became offline and later no devices were connected, so no new on-device UI screenshots or Google login could be completed.

**Google dev-build verification update (2026-04-26):** Google OAuth was tested in the installed Medifind development build on emulator `emulator-5554`. The normal LAN dev-client URL stayed on `Reloading...`, but opening the development client with Android emulator host URL `10.0.2.2:8081` loaded the app. Test path: Sign In -> Continue with Google -> Profile Setup with `Aditya Gholap` prefilled -> Continue -> Home with `Welcome, Aditya Gholap`. This verifies the development-build Google flow, post-auth profile gate, and profile-completion route. Direct REST/console inspection of the Google user's Firestore doc was not completed before the user moved to the Phone OTP/map phase, so only the app-flow persistence is verified for Google. Phone OTP remains disabled because the requested Firebase Phone Auth + Expo reCAPTCHA path is not safe/current under Expo SDK 54 + Firebase JS SDK 12 without a new architecture decision.

**Next-phase planning update (2026-04-26):** Phone OTP is now an explicit architecture decision point, not an implementation task. Email/password stays enabled. Current official Expo/Firebase guidance still presents Firebase JS SDK and React Native Firebase as separate integration paths; React Native Firebase requires custom native code / development builds and cannot run in Expo Go. Firebase JS phone auth still depends on web-style `RecaptchaVerifier` / `ApplicationVerifier`, so the old Expo reCAPTCHA route should not be revived without current official support. Store locator/map work is also gated: real nearby inventory requires backend functions and data readiness first (`nearbyStores`, `searchMedicines`, store coordinates, inventory freshness, public contact fields, rules, indexes). `react-native-maps` is the recommended default map library unless the team deliberately chooses `expo-maps`.

**Discovery UI update (2026-04-26):** `docs/DECISIONS.md` now includes `D-015`, which defers Phone OTP until after the medicine discovery MVP. The Expo app has a mock-only discovery flow: Home is the entry page with a medicine search field, popular/recent chips, and nearby verified store previews; `/search` shows mock medicine results with availability badges, Rx warnings, store distance/open state, call, navigate, and detail actions; `/store/[storeId]` shows public store contact, address, open state, and mock available medicines; `/medicine/[medicineId]` shows medicine facts, Rx warnings where required, and nearby stores that carry it. Data comes only from `apps/mobile/services/mockDiscovery.ts` and typed models in `apps/mobile/types/discovery.ts`. No backend functions, Firestore inventory reads, Maps SDK, cart, payment, order, delivery, or Phone OTP code was added.

**Independent static review (2026-04-25, Claude follow-on):** Re-read auth services + auth screens; `tsc --noEmit` clean; the Google sign-in chain (`useIdTokenAuthRequest` -> `signInWithCredential` -> `upsertUserProfileFromAuthUser`) writes the four required Firestore fields (`uid`, `email`, `displayName`, `photoURL`) plus `emailVerified`, `authProvider`, `authProviders`, timestamps, and (on first create) `preferences` / `profileComplete:false` / `hasProfile:false` / `createdAt`. Phone OTP UI and entry buttons are correctly disabled with deferred-message copy in the Rx warning palette. Two gaps confirmed: (a) `signInWithEmail` / `signUpWithEmail` did not call `upsertUserProfileFromAuthUser`; (b) `app/index.tsx` did not gate on `profileComplete`. **Both fixed in the 2026-04-25 auth wiring pass below.**

**Auth wiring pass (2026-04-25, Claude):** Added complete email auth path with Firestore profile write, email verification flow (`app/verify-email.tsx` with auto-poll + resend cooldown), forgot password flow (`app/forgot-password.tsx`), and a profile-completion gate at splash (`app/index.tsx`) and after every sign-in/up. `app/profile-setup.tsx` rewritten to actually save via `markProfileComplete`. `app/home.tsx` now shows the user's display name and exposes Sign out. `services/auth.ts` extended with `sendVerificationEmailToCurrentUser`, `reloadCurrentUser`, `sendPasswordReset`. `services/userProfile.ts` extended with `loadUserProfile`, `markProfileComplete`, `refreshEmailVerifiedField`, exported `UserProfile` type. `tsc --noEmit` clean. No new dependencies, no `package.json` change, no `expo prebuild`. **Phone OTP intentionally NOT enabled** — needs user decision between (A) `@react-native-firebase/auth` migration or (B) Cloud Function + SMS provider + Firebase custom token. Full runbook for Android Studio emulator testing lives in `docs/AGENT_LOG.md` 2026-04-25 entry.

**Google/Phone auth update (2026-04-25):** Google auth code uses `expo-auth-session`, `expo-web-browser`, and Firebase JS SDK `GoogleAuthProvider` credential sign-in. Sign In and Sign Up show active Google buttons in a development build; Expo Go still blocks Google with a clear message. Local `apps/mobile/.env` now has Google Web, iOS, and Android client IDs present (values were not printed or committed). After a successful Google credential sign-in, the app upserts `users/{uid}` with identity fields, provider fields, timestamps, and default discovery preferences on first create. The mobile client deliberately does **not** write `roles` or `permissions`; those remain server-owned per D-009. Phone OTP entry points are disabled and labelled coming soon. The `/phone-otp` route still exists as a disabled/stub screen; real Firebase Phone Auth remains deferred.

**Design progress (2026-04-24):** Splash, Welcome/onboarding, Sign In, Sign Up, and the future Phone OTP flow now have detailed screen specs covering layout, hierarchy, exact copy, button styles, spacing, loading/error states, interactions, and transitions. Phone OTP remains Phase 2 and must not be enabled or scaffolded for MVP unless explicitly approved.

**Canonical MVP (reconfirmed 2026-04-24):**
- Find a medicine.
- Show nearby stores that have it.
- Show store details and availability.
- Guide / navigate the user to the store.
- Let the user call / contact the store.

**Phase 2 / optional (not MVP):** delivery, cart, checkout, payment, order tracking, prescription delivery flow.

**Auth (MVP, clarified 2026-04-25):** Firebase Authentication is required. Current code wires **email/password** and **Google** through the Firebase JS SDK for Expo managed workflow. Both providers write or refresh the minimal `users/{uid}` profile before routing. Email/password users must verify email before continuing. Every signed-in user is routed through the profile-completion gate before Home. **Phone OTP is Phase 2 and disabled in the UI.**

**Rx doctrine (MVP, clarified 2026-04-24):** Rx-required medicines are shown during discovery with a strong "Prescription required" badge and warning. Discovery and navigation are NOT blocked. No reserve/order/delivery path exists in MVP. No medical advice, dosage, usage, side-effects, or substitution guidance is shown anywhere in MVP — even if the canonical `medicines/{id}` doc carries those fields, mobile does not render them.

No root app source, Cloud Functions, Firebase rules, root package files, env files, or secrets should be edited from mobile work. Mobile edits are currently scoped to `apps/mobile/**`.

## Graphify status
- Python package installed: `graphifyy==0.4.23`.
- Global Windows/Claude skill install completed via `graphify install --platform windows`.
- Repo Claude instructions created: `CLAUDE.md`.
- Repo Codex instructions created: `AGENTS.md`.
- Codex hook created: `.codex/hooks.json`.
- Knowledge graph generated under `graphify-out/`.
- Current graph summary from `graphify-out/GRAPH_REPORT.md`: 448 nodes, 560 edges, 80 communities.
- `.graphifyignore` exists and excludes env/secrets, generated build outputs, Graphify cache/cost/manifest files, and AI config folders.

## Command notes
- `graphify .` failed because this CLI version does not support `.` as a command.
- `graphify update .` is the working replacement and was used to create/update the graph.
- `graphify claude install` created `.claude/settings.json`; that file was removed because it was outside the allowed edit list for this session.
- `graphify update .` was not run during the Firebase Auth wiring pass because that session's allowed edit scope did not include `graphify-out/**`.
- `graphify update .` was also not run during the Firebase env-config pass because that session's allowed edit scope did not include `graphify-out/**`.
- Expo LAN mode was started with `npx expo start -c --lan`. Metro is listening on `0.0.0.0:8081`; laptop access to `http://192.168.1.149:8081` returned HTTP 200.
- Windows firewall rule creation for Node.js and ports `8081`/`8082` failed from this session because Administrator elevation is required.
- Google Auth implementation was removed on 2026-04-25 to fix the SDK mismatch and return to Firebase JS SDK-only mobile auth. `expo-auth-session` and `expo-web-browser` were removed from mobile dependencies.
- React Native Firebase must not be used in the Expo managed MVP. `npm ls firebase @react-native-firebase/auth @react-native-firebase/app --depth=0` now reports only `firebase@12.12.1`.
- `npm run typecheck` passed after the Firebase Auth SDK cleanup.
- `graphify update .` passed after the Firebase Auth SDK cleanup and rebuilt the graph at 236 nodes, 226 edges, and 61 communities.
- `npx expo export --platform android --output-dir .expo\verification-export` passed during the auth verification pass. The generated `.expo/verification-export` output is local-only and should remain uncommitted.
- `npx expo export --platform android --output-dir .expo\google-auth-verification-export` passed after Google AuthSession wiring and Phone OTP UI stub work. The generated `.expo/google-auth-verification-export` output is local-only and should remain uncommitted.
- `graphify update .` passed after Google AuthSession wiring and rebuilt the graph at 252 nodes, 253 edges, and 62 communities.
- `npm run typecheck` passed after adding Firestore profile persistence for Google sign-in.
- `npm ls firebase @react-native-firebase/auth @react-native-firebase/app expo-auth-session expo-web-browser --depth=0` passed after escalation and reported only `firebase@12.12.1`, `expo-auth-session@7.0.10`, and `expo-web-browser@15.0.10`; no React Native Firebase packages are installed.
- `npx expo export --platform android --output-dir .expo\google-firestore-verification-export` passed after Firestore profile persistence. The generated output is local-only and should remain uncommitted.
- `graphify update .` passed after Firestore profile persistence and rebuilt the graph at 257 nodes, 261 edges, and 62 communities.
- First EAS Android development build `54f87dfb-3dcf-4bb7-aac8-ffe263907e11` failed in the cloud Gradle phase because `@react-native-async-storage/async-storage@3.0.2` required unresolved artifact `org.asyncstorage.shared_storage:storage-android:1.0.0`.
- `npx expo install @react-native-async-storage/async-storage` changed mobile AsyncStorage to the Expo SDK-compatible `2.2.0`.
- `apps/mobile/services/firebase.ts` now passes the default AsyncStorage object to `getReactNativePersistence(AsyncStorage)`; the removed `createAsyncStorage` v3 API is no longer used.
- Successful EAS Android development build: `51fcfd40-9e66-44c4-99f6-f0090b1b21e3`.
- APK artifact `https://expo.dev/artifacts/eas/b8d16xe1sNKYJc1rE7Akze.apk` installed on emulator `emulator-5554` with adb `install -r` and launched as `com.nearnest.medifind`.
- `npm run typecheck` passed after the auth profile gate changes.
- `npm ls firebase @react-native-firebase/auth @react-native-firebase/app expo-auth-session expo-web-browser @react-native-async-storage/async-storage --depth=0` passed and reports Firebase JS SDK, Expo auth/web-browser, and AsyncStorage only; no React Native Firebase packages are installed.
- `npx expo export --platform android --output-dir .expo\profile-gate-verification-export` passed after the auth profile gate changes. The generated output is local-only and should remain uncommitted.
- `graphify update .` initially failed because `graphify` was not on PATH; rerun with the installed Scripts path succeeded and rebuilt the graph at 273 nodes, 298 edges, and 63 communities.
- Live Firebase JS SDK smoke test passed on 2026-04-26 for email/password auth and Firestore profile persistence. Test user: `codex.medifind.20260425191445@example.com`, uid `q0yxtSRkSoSCSxa9r1QXgPUTX0V2`.
- `npm run typecheck` passed again on 2026-04-26.
- `npm ls firebase @react-native-firebase/auth @react-native-firebase/app expo-auth-session expo-web-browser @react-native-async-storage/async-storage --depth=0` passed again on 2026-04-26; no React Native Firebase packages are installed.
- `adb devices` first showed `emulator-5554 device`, but the emulator became offline during `adb shell` package checks and later no devices were connected. Restart the emulator or use a physical device before the next UI/Google OAuth test.
- Google dev-build test passed on 2026-04-26 after reopening the dev client with `10.0.2.2:8081`. LAN URL `192.168.1.150:8081` stayed on `Reloading...`; emulator host URL worked.
- Profile Setup Continue routed to Home on 2026-04-26, confirming the app-flow save path for `profileComplete` and search radius preferences.
- No code was changed in the next-phase planning pass. No runtime test was required for that docs-only update.
- Official docs checked in the next-phase planning pass: Expo Using Firebase, Firebase Web Phone Auth / `RecaptchaVerifier`, and Expo map docs for `react-native-maps` / `expo-maps`.
- `npm run typecheck` passed after adding the mock medicine discovery UI.
- `npx expo export --platform android --output-dir .expo\discovery-ui-export` passed after sandbox escalation for Windows user-profile access. The generated export is local-only and should remain uncommitted.
- `graphify update .` passed after the mock discovery UI changes and rebuilt the graph at 301 nodes, 324 edges, and 66 communities.
- `git diff --check` passed after trimming generated trailing whitespace from `graphify-out/GRAPH_REPORT.md`.
- `functions npm run lint` initially inherited the root browser/Vite flat ESLint config. A Functions-local `functions/eslint.config.js` was added so backend lint runs as Node/CommonJS.
- `npx expo export --platform android --output-dir .expo\backend-discovery-export` passed after wiring discovery screens to backend calls with mock fallback.
- `graphify update .` passed after backend discovery integration when invoked via `C:\Users\Aditya\AppData\Roaming\Python\Python314\Scripts\graphify.exe update .` and rebuilt the graph at 448 nodes, 560 edges, and 80 communities.
- `firebase deploy --only firestore:rules,firestore:indexes --project nearnest-platform` passed during live discovery deployment.
- All-functions deploy was not used because Firebase CLI detected existing remote functions outside local source (`onAuthCreate`, `requestEmailCode`, `setUserRoles`, `verifyEmailCode`). Explicit deploy of `functions:searchMedicines,functions:nearbyStores` passed and left those remote functions untouched.
- `firebase functions:artifacts:setpolicy --location asia-south1 --days 7 --force --project nearnest-platform` passed after the Functions artifact cleanup warning.
- `node functions/scripts/seedDiscoveryData.js` passed and seeded 8 medicines, 4 public discovery stores, and 17 inventory rows.
- `node functions/scripts/verifyDiscoveryData.js` passed with medicine search count 1, nearby store geohash count 4, and Dolo availability count 3.
- Direct callable verification passed for `searchMedicines` (`Dolo` -> `Dolo 650`, 3 availability rows) and `nearbyStores` (4 stores, public phone present).
- `npx expo export --platform android --output-dir .expo\backend-live-verification-export` passed after live-backend service changes. The generated export is local-only and should remain uncommitted.

## Current allowed next work
1. Commit the current backend/mobile discovery integration when ready.
2. Test Home -> Search -> Results -> Medicine detail -> Nearby stores -> Store detail in the installed development build against live backend data. Prefer `10.0.2.2:8081` for Android emulator dev-client reloads if LAN hangs.
3. Review public store document shape before onboarding real stores. Public docs must not contain private owner/member/internal fields.
4. Replace `DEFAULT_DISCOVERY_LOCATION` with real location/search-area state before trusting distance ranking.
5. Add edge-case QA for no results, Rx warnings, low stock, stale stock, closed stores, unavailable phone, and unavailable navigation URL handlers.
6. Optimize discovery backend for scale before large catalogs; current availability lookup is per-public-store rather than a denormalized search summary.
7. Keep Phone OTP deferred per `D-015`. Do not install React Native Firebase, disable email/password, or build SMS/custom-token backend before discovery MVP.
8. Choose the map library before rendering maps. Current UI still opens Google Maps URLs and uses `MapPlaceholder`.
9. Keep implementation limited to discovery MVP surfaces: auth shell, profile/location, home list/map, search/results, store detail, medicine detail, contact store, navigation handoff.
10. Do not add cart, payment, delivery, checkout, order tracking, medical advice, dosage guidance, or mobile store/admin surfaces.

## Files still protected / not touched in this setup
- `src/**`
- `dataconnect/**`
- `package.json`, `package-lock.json`
- `firebase.json`, `storage.rules`, `database.rules.json`
- `.env`, `.env.local`, `.env.example`
- `serviceAccountKey.json`
