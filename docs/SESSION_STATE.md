# Nearnest Session State

Last updated: 2026-04-29 (Codex fixed Expo public env inlining for preview APK)

## Mobile Expo public env inlining fix 2026-04-29
- **Mobile-only preview APK crash fix.**
- **No web app, Firebase backend, Firestore rules/indexes, data, or env files were touched.**
- Crash addressed:
  - Preview APK crashed with `Missing required mobile Firebase env var: EXPO_PUBLIC_FIREBASE_API_KEY`.
  - Root cause was dynamic bracket access on `process.env[key]`, which Expo does not inline for `EXPO_PUBLIC_*` variables in EAS builds.
- Fix:
  - `apps/mobile/services/firebase.ts` now defines `firebaseEnv` with explicit dot-notation reads for every required Firebase public env var.
  - `readRequiredEnv(key)` now reads from `firebaseEnv[key]`.
  - `apps/mobile/services/googleAuth.ts` now defines `googleAuthEnv` with explicit dot-notation reads for Google client IDs.
  - `getEnvValue(key)` now reads from `googleAuthEnv[key]`.
- Expected result:
  - Preview APK embeds Firebase config and Google auth client IDs correctly.
  - Startup should no longer crash because Firebase env values were not inlined.
- Verification passed:
  - `cd apps/mobile && npm run typecheck`
  - `cd apps/mobile && npx expo export --platform android --output-dir .expo/fix-preview-env-inline-export --no-bytecode`
  - `graphify update .`
  - `git diff --check`
- Note: Expo export had to be rerun outside the sandbox because Node hit `EPERM` when resolving `C:\Users\Aditya`; the rerun passed.
- Suggested commit: `fix(mobile): inline Expo public env references`.

## Public landing page redesign and hosting output 2026-04-28
- **Public web landing page only.**
- **No mobile app, Firebase Functions, Firestore rules/indexes, or production data were touched.**
- Root route `/` still uses `src/pages/NearnestHome.jsx`.
- Redesigned `NearnestHome` into a premium NearNest/Medifind medical/pharmacy-tech landing page:
  - Navbar with NearNest brand mark/name.
  - Hero: "Find medicines nearby. Help pharmacies get discovered."
  - Customer + pharmacy owner positioning.
  - Get Started CTA.
  - Android download CTA using `import.meta.env.VITE_MEDIFIND_ANDROID_URL`.
  - iOS button using `import.meta.env.VITE_MEDIFIND_IOS_URL`, disabled/coming soon when missing.
  - Stats, how-it-works, pharmacy-owner, app download, and footer sections.
- Replaced red/black styling with teal/green/white medical theme and a CSS app/map visual.
- Updated Firebase Hosting output:
  - `firebase.json` hosting public directory changed from `public` to `dist` for Vite build output.
- Verification passed:
  - `npm run build`
- Build warning:
  - Vite reported a large JS chunk over 500 kB. This is pre-existing app bundle structure and not a landing-page blocker.
- Pending until session close:
  - `git diff --check`
  - `graphify update .`
- Suggested deploy command after commit/review:
  - `firebase deploy --only hosting --project nearnest-platform`
- Suggested commit: `feat(web): redesign public landing page and hosting output`.

## Mobile route navigation mode and map memory fix 2026-04-28
- **Mobile-only final route preview and Google Maps memory fix.**
- **No web portal UI files were touched.**
- **No Firebase deploy was run.**
- **No production data was mutated.**
- OOM root cause addressed:
  - Android Google Maps native views can stay mounted across Expo Router navigation stack screens.
  - Multiple mounted map views can pressure `google.android.gms.policy_maps_core_dynamite` memory on emulator.
- RealMapView changes:
  - Added `active?: boolean`; when false, native `MapView` is not mounted and `MapPlaceholder` renders instead.
  - Added `liteMode?: boolean`; Android preview maps can use native lite mode.
  - Disabled unnecessary map features: rotate, pitch, move-on-marker-press, traffic, and indoors.
- Focus behavior:
  - Home stores mode, Stores tab, medicine nearby stores, store detail, and route preview now pass `active={useIsFocused()}`.
  - Home/list/detail preview maps pass Android `liteMode`.
  - Route preview keeps full map mode with `liteMode={false}`.
- Start preview upgrade:
  - When Start in-app preview is active, the route screen switches to a map-first layout.
  - Map height expands to roughly 63% of the screen.
  - Bulky details are hidden.
  - A compact bottom sheet shows store name, distance, ETA, honest preview copy, End preview, and Call store.
- Verification passed:
  - `cd apps/mobile && npm run typecheck`
  - `cd apps/mobile && npx expo export --platform android --output-dir .expo/final-route-mode-export --no-bytecode`
- Note: Expo export had to be rerun outside the sandbox because Node hit `EPERM` when resolving `C:\Users\Aditya`; the rerun passed.
- No new EAS build is required for these JS/UI-only changes when testing with the already rebuilt dev client.
- Suggested commit: `fix(mobile): make route preview navigation mode and reduce map memory`.

## Mobile real maps and route preview polish 2026-04-28
- **Mobile-only UI/runtime polish.**
- **No web portal UI files were touched.**
- **No Firebase deploy was run.**
- **No production data was mutated.**
- RealMapView improvements:
  - Added muted medical Google map styling through `customMapStyle`.
  - Reduced noisy POIs/transit labels while keeping roads, water, parks, and medical POIs readable.
  - Replaced the large bottom overlay with a compact floating overlay.
  - Added selected/verified/unverified marker differentiation.
  - Added map padding and fit-to-coordinates behavior for routes, user+store, store sets, and Pune fallback.
  - Keeps fallback `MapPlaceholder` behavior when Android Maps key is missing or the native map fails.
- Route preview improvements:
  - Uses fallback origin `{ lat: 18.5607, lng: 73.7795 }` when foreground location is unavailable.
  - Keeps the destination as the store coordinate.
  - Metrics now show stable fallback distance/time instead of staying at "Checking..." indefinitely.
  - Route loading is cleared in a `finally` block.
- Location service:
  - `requestCurrentLocation()` now times out after 4 seconds and returns a friendly unavailable result.
  - `watchUserLocation()` remains unchanged for Start preview mode.
- Fallback route behavior:
  - Fallback distance now uses a non-zero estimate unless origin and destination are truly the same.
  - Duration is based on the fallback distance and remains usable.
- Screens touched for map presentation:
  - Home stores mode map
  - Stores tab map
  - Medicine nearby stores map
  - Store detail mini-map
- Verification passed:
  - `cd apps/mobile && npm run typecheck`
  - `cd apps/mobile && npx expo export --platform android --output-dir .expo/real-map-polish-export --no-bytecode`
- Note: Expo export had to be rerun outside the sandbox because Node hit `EPERM` when resolving `C:\Users\Aditya`; the rerun passed.
- No new EAS build is required for these JS/UI-only changes when testing with the already rebuilt dev client.
- Suggested commit: `polish mobile real maps and route preview UI`.

## Mobile route preview demo-store fallback hotfix 2026-04-28
- **Mobile-only emergency demo fix.**
- **No web portal UI files were touched.**
- **No Firebase deploy was run.**
- **No production data was mutated.**
- Root cause:
  - Nearby store lists can show mock/demo stores when live discovery is unavailable.
  - `/navigation/[storeId]` loads store details through `getStoreDetailApi(storeId)`.
  - `getStoreDetailApi` only used mock fallback on thrown callable errors, not on clean backend responses where `store` was `null`.
  - Mock store IDs such as `store_greenleaf` therefore reached the route screen as `store: null` and showed `store_not_found`.
- Fix:
  - `apps/mobile/services/discoveryApi.ts` now falls back to `getStoreById(storeId)` and `getInventoryForStore(storeId, q, filter)` when live store detail returns no store but a demo store exists.
  - `apps/mobile/app/navigation/[storeId].tsx` records dev telemetry when the route preview uses the demo-store fallback.
  - `apps/mobile/services/telemetry.ts` includes `medifind.navigation.store_fallback_used`.
- Expected demo behavior:
  - Route from a mock/demo nearby store opens the in-app route preview normally.
  - The screen shows the existing honest copy: "Using local demo route details while live pharmacy data is unavailable."
  - The Android Maps SDK key warning can still appear on the current APK and should use the fallback map preview.
- Verification passed:
  - `cd apps/mobile && npm run typecheck`
  - `cd apps/mobile && npx expo export --platform android --output-dir .expo/route-fallback-hotfix-export --no-bytecode`
  - `git diff --check`
  - `graphify update .`
- Note: Expo export had to be rerun outside the sandbox because Node hit `EPERM` when resolving `C:\Users\Aditya`; the rerun passed.
- Suggested commit: `fix(mobile): fall back to demo store details for route preview`.

## Mobile discovery Firestore inventory connection 2026-04-28
- **Mobile/Firebase discovery data finish only.**
- **No web portal UI files were touched.**
- **No full Firebase deploy was run.**
- **No users, roles, orders, tickets, private store documents, owner/member fields, or license/admin fields were mutated.**
- Added read-only audit script:
  - `scripts/discovery/audit_discovery_data.cjs`
- Added store product to discovery inventory bridge:
  - `scripts/discovery/sync_store_products_to_discovery_inventory.cjs`
  - Dry-run by default.
  - `--apply` required to write.
  - Writes only `stores/{storeId}/inventory/{medicineId}`.
  - Supports optional `--apply-public-discovery` only for already verified/approved stores.
- Added demo inventory fallback seeder:
  - `scripts/discovery/seed_demo_discovery_inventory.cjs`
  - Dry-run by default.
  - `--apply` required to write.
  - Writes only `stores/{storeId}/inventory/{medicineId}` for public/verified stores.
- Mobile warning fix:
  - `apps/mobile/components/Screen.tsx` now imports `SafeAreaView` from `react-native-safe-area-context`.
  - `apps/mobile/app/navigation/[storeId].tsx` now imports `SafeAreaView` from `react-native-safe-area-context`.
  - Search found no Medifind app imports of `keepAwake`, `useKeepAwake`, or `activateKeepAwake`; the dev-client keep-awake warning is not from app code.
- Data audit before additional import/sync:
  - medicines: 108
  - active medicines: 108
  - public/verified stores: 4
  - stores with valid coordinates: 4
  - stores with public phone: 14
  - stores with inventory subcollection: 4
  - total inventory docs: 17
  - medicines with at least one availability row: 8
  - top missing problems: none
- Data operations run:
  - Imported remaining openFDA medicines with `--limit 585 --apply`; skipped 100 existing docs and wrote 485 new medicine docs.
  - Product sync dry-run scanned 15 stores, 4 product collections, 250 products, found 131 matches.
  - Product sync apply scanned 15 stores, skipped 75 existing inventory rows, and wrote 56 new inventory docs.
  - Demo inventory dry-run planned 180 rows across 4 public/verified stores.
  - Demo inventory apply wrote 180 inventory docs.
- Final data audit:
  - medicines: 593
  - active medicines: 593
  - medicines missing search tokens: 0
  - stores: 12
  - public/verified stores: 4
  - stores with valid coordinates: 4
  - stores with public phone: 11
  - stores with inventory subcollection: 6
  - total inventory docs: 223
  - medicines with at least one availability row: 153
  - orphan inventory medicine IDs: 0
  - top missing problems: none
- Verification passed:
  - `node --check scripts/discovery/audit_discovery_data.cjs`
  - `node --check scripts/discovery/sync_store_products_to_discovery_inventory.cjs`
  - `node --check scripts/discovery/seed_demo_discovery_inventory.cjs`
  - `cd apps/mobile && npm run typecheck`
  - `cd apps/mobile && npx expo export --platform android --output-dir .expo/mobile-firebase-data-finish-export --no-bytecode`
  - `git diff --check`
  - `graphify update .`
- Phone runtime checks still need to be run on the new dev APK:
  - Search Dolo
  - Search Crocin
  - Search Paracetamol
  - Results should use backend source when callables are reachable.
  - Medicine detail should show Firestore availability.
  - Nearby stores and Store detail should show real Firestore-backed data.
- Suggested commit: `fix(mobile): connect discovery data to Firestore inventory`.

## Mobile Android Maps key hotfix 2026-04-28
- **Mobile-only emergency fix.**
- **No web portal files were touched.**
- **No Firebase deploy was run.**
- **No production data was mutated.**
- Real-phone crash root cause:
  - `react-native-maps` mounted native Google Maps on Android.
  - The installed Android dev build did not have a native Google Maps SDK API key in the Android manifest.
  - Native Maps SDK threw `java.lang.IllegalStateException: API key not found`.
- Added `apps/mobile/app.config.js`:
  - Keeps existing `app.json` values intact.
  - Reads `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY` or `GOOGLE_MAPS_ANDROID_API_KEY`.
  - Sets `android.config.googleMaps.apiKey`.
  - Adds `extra.hasAndroidMapsKey` for runtime JS gating.
- Added `apps/mobile/plugins/withAndroidGoogleMapsApiKey.js`:
  - Local Expo config plugin used only when an Android Maps key exists.
  - Writes `com.google.android.geo.API_KEY` metadata into the Android manifest during native build.
  - A package-level `react-native-maps` config plugin was not used because the installed package does not ship one in this repo.
- Updated `apps/mobile/components/RealMapView.tsx`:
  - Imports `Constants`, `Platform`, and `PROVIDER_GOOGLE`.
  - On Android, does not mount `<MapView>` unless `Constants.expoConfig.extra.hasAndroidMapsKey === true`.
  - Falls back to `MapPlaceholder` when the key is missing, preventing the current dev build from crashing.
  - Uses `PROVIDER_GOOGLE` on Android when native maps are enabled.
- Updated `apps/mobile/app/(tabs)/_layout.tsx`:
  - Stores tab uses route name `stores/index`.
  - Label/title is `Stores`, avoiding the ugly `stores/index` tab label.
- Verification:
  - `cd apps/mobile && npm run typecheck` passed.
  - `git diff --check` passed with only existing Windows/protected-file warnings.
  - `npx expo config --type public` showed `extra.hasAndroidMapsKey: false` in the current local env, meaning current dev-client JS will use fallback map.
  - Requested Android export reached Metro bundling but failed at local Windows `hermesc.exe` with exit code `3221225477`.
  - `npx expo export --platform android --output-dir .expo/mobile-map-key-hotfix-export --no-bytecode` passed.
- Required for native map rendering:
  - Add `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY` or `GOOGLE_MAPS_ANDROID_API_KEY` to the EAS build environment.
  - Build a new Android dev APK.
  - Without a rebuilt APK containing the native Android Maps SDK key, JS fallback prevents crash but native map tiles will not render.
- Suggested commit: `fix(mobile): configure Android maps key and stores tab`.

## Mobile maps/location/tabs and medicine seed pipeline 2026-04-27
- **Mobile-first deadline session.**
- **No Firebase deploy was run.**
- **No production data was modified.**
- **Web portal UI was not touched.**
- Added native mobile dependencies:
  - `react-native-maps`
  - `expo-location`
- `apps/mobile/app.json` now declares foreground-only location permission copy:
  - "Medifind uses your location to show nearby pharmacies and in-app route previews."
  - No background location was added.
- Added Expo Router bottom tabs:
  - Home
  - Search
  - Stores/Map
  - Profile
- Moved tab screens under `apps/mobile/app/(tabs)/` while keeping deep routes hidden from tabs:
  - `/results`
  - `/medicine/[medicineId]`
  - `/medicine/[medicineId]/stores`
  - `/store/[storeId]`
  - `/navigation/[storeId]`
  - `/category/[categoryId]`
- Removed Sign out from Home. Profile is now the only sign-out surface and includes account identity, larger text toggle, support/legal placeholders, and sign out.
- Added real foreground location service in `apps/mobile/services/location.ts`.
- Added reusable `apps/mobile/components/RealMapView.tsx` using `react-native-maps` with user marker, store markers, selected marker, route polyline, and styled fallback map.
- In-app route preview now requests real current location, draws a route polyline, supports Start/End preview mode, and never opens Google Maps/browser for Route.
- Added `getRoutePreview` callable in `functions/index.js`:
  - Requires auth.
  - Declares `GOOGLE_MAPS_ROUTES_API_KEY` as a Functions secret.
  - Reads Routes API key from env/config only.
  - Calls Google Routes API server-side.
  - Returns only public route fields: distance, duration, encoded polyline, decoded coordinates, warnings, and travel mode.
  - If not configured or unavailable, mobile falls back to a straight in-app preview line.
- Improved mobile UI:
  - Home tab spacing and map preview.
  - Search tab actions and filter entry.
  - Results filters for available now, open now, verified stores, and distance/freshness sort.
  - Store detail real map preview and in-app route action.
  - Privacy copy now points sign out to Profile, not Home.
- Added medicine seed tooling:
  - `scripts/medicines/fetch_openfda_medicines.py`
  - `scripts/medicines/import_medicines_to_firestore.cjs`
  - `scripts/medicines/README.md`
  - sample output `scripts/medicines/out/medicines.openfda.sample.json`
- Seed import is dry-run by default. `--apply` is required to write, and it writes only `medicines`.
- Ship-mode actions run after implementation:
  - `firebase functions:secrets:set GOOGLE_MAPS_ROUTES_API_KEY --project nearnest-platform` was attempted but failed because the non-interactive shell sent an empty secret payload. The secret still needs to be set manually/securely before route callable deploy.
  - `python scripts/medicines/fetch_openfda_medicines.py --limit 1000` wrote 585 unique normalized records.
  - Dry-run import for the first 100 records passed.
  - Apply import for the first 100 records wrote 100 `medicines` documents to project `nearnest-platform`.
- Verification passed:
  - `apps/mobile npm run typecheck`
  - `functions node --check index.js`
  - `functions npm run lint`
  - `node --check scripts/medicines/import_medicines_to_firestore.cjs`
  - `python scripts/medicines/fetch_openfda_medicines.py --limit 25`
  - `node scripts/medicines/import_medicines_to_firestore.cjs --project nearnest-platform --file scripts/medicines/out/medicines.openfda.sample.json --limit 100 --dry-run`
  - `apps/mobile npx expo export --platform android --output-dir .expo/mobile-final-map-location-export`
  - `git diff --check`
  - `graphify update .`
- Earlier Android export with Hermes bytecode failed once locally because Windows `hermesc.exe` crashed with exit code `3221225477`; rerun later passed normally.
- Because native dependencies were added, a new Android dev build is required:
  - `cd apps/mobile`
  - `eas build --profile development --platform android`
- If deploying the route callable later, first set the secret with a real value, then use targeted deploy only:
  - `firebase deploy --only functions:getRoutePreview --project nearnest-platform`
- Suggested commit: `feat(mobile): add real maps location tabs and medicine seed pipeline`.

## Mobile in-app route preview and discovery polish 2026-04-27
- **Mobile app only.**
- **No Firebase deploy was run.**
- **No production data was modified.**
- Added `apps/mobile/app/navigation/[storeId].tsx`.
  - Shows a premium in-app route preview with road shapes, route line, You marker, destination marker/name, distance, estimated time, open/closed status, verified badge, optional medicine context, call action, store-detail action, back button, and safety note.
  - Copy explicitly says navigation stays inside Medifind.
- Replaced route/navigation actions to stay in Expo Router:
  - `apps/mobile/app/home.tsx`
  - `apps/mobile/app/medicine/[medicineId]/stores.tsx`
  - `apps/mobile/app/stores/index.tsx`
  - `apps/mobile/app/store/[storeId].tsx`
- Medicine nearby-store route passes `medicineId` into `/navigation/[storeId]`.
- Phone call actions still use `openExternalUrl(getPhoneUrl(...))`.
- `apps/mobile/components/MapPlaceholder.tsx` now renders an in-app map preview with road/grid shapes, route segments, You marker, verified/unverified store pins, and a store-count chip.
- `apps/mobile/components/StoreCard.tsx` has better wrapping, action hierarchy, open/freshness badges, and `Route` label.
- `apps/mobile/app/welcome.tsx` no longer says directions open in a maps app.
- Verification passed:
  - `apps/mobile npm run typecheck`
  - `apps/mobile npx expo export --platform android --output-dir .expo/mobile-in-app-navigation-polish-export`
  - `rg "openExternalUrl\\(getMaps|getMapsUrl\\(" apps/mobile/app apps/mobile/components -n` returned no matches.
  - graphify update via the absolute graphify path.
- Android dev-client runtime smoke was not run in this session.
- Suggested commit: `fix(mobile): add in-app route preview and polish discovery UI`.

## Final web store access and mobile discovery regression check 2026-04-27
- **No Firebase deploy was run.**
- **No production data was modified.**
- This session made documentation-only updates.
- Starting `git status --short` showed only protected local files: `.claude/settings.local.json` and `.codex/medifind-*.png`.
- Verification passed:
  - `npm run build` at repo root; Vite reported only the existing large chunk warning.
  - `npm run lint` in `functions/`.
  - `npm run typecheck` in `apps/mobile/`.
  - `git diff --check` before final docs edits.
- Web static/code-path regression:
  - `/store-admin/home` redirects to `/home`.
  - `/store-admin/:storeId` is protected and indexes to `dashboard`.
  - Dashboard, inventory, settings, advertisement, and support child routes remain wired.
  - `UserHome` uses `showStoreError`, so the red store permission banner only renders when no stores are visible.
- Mobile static/code-path regression:
  - Google auth hooks remain wired in sign-in/sign-up.
  - `apps/mobile/services/userProfile.ts` uses `mobileUsers/{uid}`.
  - Discovery screens still call `discoveryApi` for Dolo/search/results/medicine/store flows.
- Not run from this environment:
  - Live authenticated web walkthrough with the friend account.
  - Android emulator/dev-client Google login and discovery walkthrough.
- Suggested commit: `test(app): verify web store access and mobile discovery regression`.

## Stale store permission banner fix 2026-04-27
- **No Firebase deploy was run.**
- **No production data was modified.**
- Current runtime state before this fix:
  - Firestore rules fix was committed/deployed separately.
  - Stores now load correctly on `/home`.
  - A friend account could see store cards but still saw the red banner: "Missing or insufficient permissions for one or more stores."
- Root cause: `src/pages/User/UserHome.jsx` set `errMsg` from listener errors, but the successful `listenUserStores` data callback only updated `stores` and never cleared that stale error message.
- `UserHome.jsx` now clears `errMsg` when a valid non-empty store array arrives.
- The red store error banner now uses `showStoreError`, so it only renders when no stores are currently visible.
- `src/pages/register-store/stores.js` was inspected and not changed; primary owner/member results still stay visible when optional `visibleTo` or `membersMap` listeners warn/fail.
- Verification: `npm run build` passed on rerun with only the existing large chunk warning; graphify update passed via the absolute graphify path.
- Suggested commit: `fix(web): clear stale store permission banner after load`.

## Store resource-data rules fix 2026-04-27
- **No real Firebase deploy was run.**
- **No production data was modified.**
- Current proof before this fix:
  - Diagnostic script proved `adityagholap19.06@gmail.com` maps to Auth UID `ESrKx72DuOOXnxZqREcu4o3FU5r1`.
  - Diagnostic found 6 stores already linked by UID through `ownerId`, `membersArr`, and `membersMap`.
  - Browser console showed the same Firebase project `nearnest-platform`, same UID/email, and `permission-denied` for top-level `stores` queries.
- Root cause: the top-level `stores/{storeId}` list/read rule called `canAccessStore(storeId)`, which used a separate parent `get()` through `storeDoc(storeId)`. That shape blocked browser collection queries even when the candidate store document had matching `ownerId`, `membersArr`, `visibleTo`, or `members.{uid}` fields.
- `firestore.rules` now has `canAccessStoreData(storeData)`:
  - owner path: `storeData.ownerId == request.auth.uid`
  - member paths: `storeData.members[uid] == true` or `storeData.membersArr` contains UID
  - visibility path: `storeData.visibleTo` contains UID
  - admin/verifier path: `canVerifyDocs()`
- `canAccessStore(storeId)` now delegates to `canAccessStoreData(storeDoc(storeId).data)`.
- Top-level `stores/{storeId}` `allow read, get, list` now uses `canAccessStoreData(resource.data)`.
- Store subcollections continue to use `canAccessStore(storeId)` because their access fields live on the parent store document.
- Verification passed:
  - `firebase deploy --only firestore:rules --dry-run --project nearnest-platform`
  - `git diff --check` (only existing protected-file/CRLF warnings)
  - graphify update via `C:\Users\Aditya\AppData\Roaming\Python\Python314\Scripts\graphify.exe update .`
- Real deploy is still required before browser behavior changes: `firebase deploy --only firestore:rules --project nearnest-platform`.
- Suggested commit: `fix(firebase): allow store owner queries with resource data rules`.

## Store listener secondary-query error handling fix 2026-04-27
- **No Firebase deploy was run.**
- **No production data was modified.**
- Latest real diagnostic for `adityagholap19.06@gmail.com` proved data is linked:
  - Auth UID `ESrKx72DuOOXnxZqREcu4o3FU5r1`
  - 6 stores already linked by UID
  - sources include `membersArr`, `membersMap`, and `ownerId`
  - no email-only stores
  - no missing UID linkage
- Runtime bug found: `listenUserStores(uid)` started multiple `onSnapshot` listeners but passed the same page-level `onError` to all of them. If `visibleTo` or `membersMap` failed, `UserHome` handled that as fatal and called `setStores([])`, hiding valid results from `ownerId`/`membersArr`.
- `src/pages/register-store/stores.js` now tracks query state independently:
  - primary: `ownerId`
  - primary: `membersArr`
  - secondary: `visibleTo`
  - secondary: `membersMap`
- Secondary query failures are dev-logged and do not wipe successful results.
- Page-level `onError` only fires when every active query fails and there are no merged stores available.
- Dev console diagnostics now include browser Firebase `projectId`, auth UID/email, per-query counts, per-query status, and error code/message.
- If all queries finish with merged count `0`, dev console logs a hint to compare the browser Firebase `projectId` with the Admin SDK/service account project.
- `src/App.jsx` was audited again and not modified: `/home` is valid, `/store-admin/home` redirects to `/home`, `/store-admin/:storeId` is protected, index redirects to dashboard, and no `/store-staff/home` redirect remains.
- Verification passed: `npm run build`, `functions npm run lint`, `apps/mobile npm run typecheck`, `git diff --check`, and graphify update via absolute path.
- Suggested commit: `fix(web): keep store results when secondary ownership queries fail`.

## Store ownership lookup fix 2026-04-27
- **No Firebase deploy was run.**
- **No production data was modified.**
- Current status before edits showed only protected/unrelated local files: `.claude/settings.local.json` and `.codex/*.png`.
- Root cause found: `/home` used `listenUserStores(uid)`, but that listener only queried `stores.ownerId == uid` and `stores.membersArr array-contains uid`. Deployed `firestore.rules` allow store access through `ownerId`, `membersArr`, `members[uid] == true`, and `visibleTo`, so a rule-authorized store could be invisible on `/home`.
- `src/pages/register-store/stores.js` now mirrors the rule-backed UID access fields for non-admin users:
  - `ownerId == uid`
  - `membersArr array-contains uid`
  - `visibleTo array-contains uid`
  - `members[uid] == true` using a Firestore `FieldPath`
- `src/pages/User/UserHome.jsx` now passes `user.email` to `listenUserStores` only for development console diagnostics.
- Development-only logging prints auth UID/email and per-query counts for owned/memberArr/visibleTo/memberMap/merged results. Nothing is exposed in production UI.
- Added `scripts/diagnoseStoreOwnership.cjs`.
  - Read-only usage: `node scripts/diagnoseStoreOwnership.cjs adityagholap19.06@gmqaicl.com`
  - Optional safe apply: `node scripts/diagnoseStoreOwnership.cjs adityagholap19.06@gmqaicl.com --apply`
  - `--apply` adds the UID to `membersArr` and `members[uid] = true`, sets `ownerId` only when missing, and never overwrites an existing `ownerId`.
- App route audit remains clean: `/home` works, `/store-admin/home` redirects to `/home`, `/store-admin/:storeId` is protected, its index redirects to dashboard, and no `/store-staff/home` redirect remains.
- Verification passed: `node --check scripts/diagnoseStoreOwnership.cjs`, `npm run build` (Vite large chunk warning only), `functions npm run lint`, `apps/mobile npm run typecheck`, `git diff --check`, and graphify update via absolute path.
- Final status still shows protected local files `.claude/settings.local.json` and `.codex/*.png`; do not stage them.
- Suggested commit: `fix(web): include all store ownership links on home`.

## Web portal routing and account ownership UX 2026-04-27
- **No Firebase deploy was run.**
- `git status --short` was checked before work. Existing protected local files remained untouched: `.claude/settings.local.json` and `.codex/*.png`.
- The earlier docs-only verification pass was preserved first in commit `ee289f7 test(discovery): verify deployed hardened backend` and pushed to `origin/main`.
- `src/main.jsx` still wraps `App` with `BrowserRouter` and `AuthProvider`; `AuthProvider` was removed from `src/App.jsx` because it was unused there.
- `src/App.jsx` now imports user files with tracked casing (`src/pages/User/**`), fixes the store advertisement import to `storeadvertisement.jsx`, protects `/store-admin/:storeId`, adds `/store-admin/home -> /home`, and redirects `/store-admin/:storeId` to its `dashboard` child.
- `src/pages/Auth/AuthContext.jsx` and `src/pages/Auth/SignIn.jsx` now route signed-in users to `/home` instead of fake or missing store-admin/staff home routes.
- `src/pages/StoreAdmin/StoreAdminLayout.jsx` now uses real template strings for settings/support navigation and hides the Analytics / Reports sidebar item because the route is not active.
- `src/pages/User/UserHome.jsx` now imports `signOut`, uses same-folder profile imports, and shows an explicit empty-store message: no stores are registered for this account, the portal is for pharmacy owners/staff, and admins should add the login UID as owner/member when an existing store is expected.
- **UID/store root cause:** `/home` is UID-linked. Non-admin users see stores via `stores.ownerId == auth.uid` or `stores.membersArr array-contains auth.uid`; admin email-based views do not prove the current Auth UID is linked. For `adityagholap19.06@gmqaicl.com`, check `users/{uid}.email`, `stores.ownerId`, `stores.ownerEmail`, `stores.membersArr`, `stores.members`, and `stores.visibleTo`.
- **Mobile profile separation:** `apps/mobile/services/userProfile.ts` now reads/writes `mobileUsers/{uid}` for customer profile data. It performs a one-time safe migration from legacy `users/{uid}` only for customer-safe profile fields and does not copy or write roles/permissions.
- `firestore.rules` now has `mobileUsers/{uid}` rules: signed-in users can read/write their own mobile profile, admin can read, and role/permission/admin keys are rejected in mobile profile writes.
- `docs/DECISIONS.md` now includes D-016: one Firebase Auth identity, split web roles (`users/{uid}`) from mobile customer profile (`mobileUsers/{uid}`).
- Verification passed: root `npm run build` (after sandbox escalation; Vite large chunk warning only), `apps/mobile npm run typecheck`, `functions npm run lint`, `git diff --check`, and graphify update via absolute graphify path.
- Final pre-commit status check still needed after this docs update: `git status --short`.
- Suggested commit: `fix(web): repair portal routing and account store ownership UX`.

## Discovery deploy verified 2026-04-27 (Claude follow-on, no code edit, no deploy)
- `firebase functions:list --project nearnest-platform` confirms all 6 expected callables are deployed in `asia-south1` (nodejs22): `searchMedicines`, `nearbyStores`, `getMedicineDetail`, `getMedicineStores`, `getStoreDetail`, `getCategoryMedicines`. Plus pre-existing `setUserRoles`, `requestEmailCode`, `verifyEmailCode`, `onAuthCreate`, `helloWorld` in `us-central1`.
- `firestore.rules` (deployed): customer discovery reads are now **callable-only**. Direct `stores/{id}` client reads require `canAccessStore(storeId)` (owner/member/verifier path only); the prior `isPublicStoreData` direct-read branch is gone. `medicines/{id}` reads require `signedIn()`. SupportTickets gated by `canViewSupportTickets()` / `canManageSupportTickets()` / `canAdmin()` — normal users cannot list, ticket creators can `get` their own, support/admin can list/update/reassign/close.
- Field-leak audit on `functions/index.js`: grep across `ownerId | members | membersArr | adminNotes | internal | verification.documents | licenseAuthority | licenseNumber` returns **zero matches**. `normalizeStore` projects only `id, name, verified, address, location, contact{publicPhoneE164,whatsapp}, hours, distanceKm, isOpenNow, closesAtLabel, freshnessLabel, freshnessUpdatedAt`. No PII surfaces in callable responses.
- Code health: `cd functions && npm run lint` clean; `cd apps/mobile && npm run typecheck` clean; `git diff --check` clean.
- `npx expo export` not re-run (heavy; would write into the protected `apps/mobile/.expo/` tree). Lint + typecheck are sufficient static signal since no source changed since the deploy.
- **Live tests pending and out-of-scope for this environment:** Android dev-build discovery walk (signed-in flow) and web admin support-ticket UI (list / reply / close / reassign). User must drive these.
- **Warnings recorded (queued, no fix this session):** `setUserRoles` plural-vs-singular naming drift vs the contract; possibly-unused `isPublicStoreData` / `isPublicStore` rule helpers; `firebase-functions@6.0.1` is behind current; `functions.config()` deprecation before March 2027.
- No deploy. No code edit. Allowed-file edits this session: `docs/AGENT_LOG.md`, `docs/SESSION_STATE.md`, `docs/TODO_NEXT_AGENT.md`.

## Support-ticket rules fix before hardened discovery deploy 2026-04-27
- **No deploy was run.**
- The previous Firestore rules deploy blocker is fixed locally: `supportTickets/{ticketId}` now has explicit least-privilege rules.
- New helpers in `firestore.rules`:
  - `canAdmin()` supports admin via `users.roles`, `users.permissions` (`ADMIN`, `ALL_ACCESS`), `request.auth.token.role`, or `request.auth.token.roles`.
  - `canViewSupportTickets()` allows admin/support ticket readers via user doc roles/permissions or custom claims.
  - `canManageSupportTickets()` allows admin/support ticket writers via user doc roles/permissions or custom claims.
  - `isSupportTicketCreator(ticketData)` allows get-only creator access when an existing ticket has a safe owner field equal to `request.auth.uid`.
  - `createsOwnSupportTicket()` allows signed-in users to create only their own ticket when the write includes a safe owner uid field.
- Added rule:
  - `get`: support/admin or ticket creator.
  - `list`: support/admin only.
  - `create`: support/admin or own-ticket create.
  - `update`: support/admin only.
  - `delete`: admin only.
- Security properties preserved:
  - Global fallback remains deny-all.
  - No broad signed-in read was restored.
  - Normal users cannot list all tickets.
  - Normal users cannot update tickets directly.
  - Support users do not automatically receive store verification/admin permissions.
  - `canVerifyDocs()` was not weakened.
  - Medifind discovery callable-only hardening remains intact.
- Web support-ticket creation audit: no active normal-user support-ticket creation flow was found in live `src/**`; current live use is admin dashboard/support portal read/update.
- Verification:
  - `cd functions && npm run lint` passed.
  - Firestore emulator compile check was unavailable because Firebase CLI requires Java 21+ on this machine.
  - `firebase deploy --only firestore:rules --dry-run --project nearnest-platform` passed and compiled rules successfully. Warning only: unused `isPublicStore` helper.
  - `graphify update .` passed via absolute graphify path.
  - `git diff --check` should be clean after final whitespace check.
- Deployment status: ready for explicit approval from a rules/functions perspective; still not deployed.
- Suggested deploy command after approval: `firebase deploy --only functions:searchMedicines,functions:nearbyStores,functions:getMedicineDetail,functions:getMedicineStores,functions:getStoreDetail,functions:getCategoryMedicines,firestore:rules --project nearnest-platform`.
- Suggested commit message: `fix(firebase): add support ticket rules before discovery deploy`.

## Web-impact audit before hardened rules deploy 2026-04-26
- **No deploy was run.**
- Audit status: **deployment blocked/risky** until `supportTickets/{ticketId}` rules are added.
- Reason: hardened `firestore.rules` deny the global fallback with `allow read, write: if false`, but the existing web portal reads and updates `supportTickets`.
- Breaking paths if rules are deployed as-is:
  - `src/pages/Admin/Dashboard/Dashboard.jsx` queries `supportTickets` for the open-ticket KPI.
  - `src/pages/Admin/Support/SupportTickets.jsx` lists, reads, updates, replies to, closes, reassigns, and annotates support tickets.
- Web paths checked against hardened rules:
  - `users/{uid}` self auth/profile reads/writes remain covered; admin/verifier owner-status updates remain covered by `canVerifyDocs()`.
  - `roles/{roleId}` reads remain allowed to signed-in users.
  - `stores/{storeId}` and `/stores` list queries remain covered for owner/member/visibleTo/admin/verifier through `canAccessStore(storeId)`.
  - `stores/{storeId}/documents` and `stores/{storeId}/verificationLogs` remain covered through `canAccessStore(storeId)`.
  - Existing web inventory uses `stores/{storeId}/products`, not the mobile discovery `stores/{storeId}/inventory`; product/order store subcollections remain covered for reads by the store fallback.
  - No active web Firestore reads of `medicines` were found; only UI copy mentions medicines.
  - No `collectionGroup` queries were found in `src/**`.
- Role caveat: web UI permissions are assembled from `roles/{roleId}` docs, but Firestore rules only consider `users.roles` containing `admin`/`verifier` or `users.permissions` containing `VERIFY_DOCS`. If real verifier/support users rely only on role-doc permissions, rules may deny their Firestore operations.
- Suggested next rules fix: add explicit `supportTickets` rules and preferably a separate `canSupport()` helper unless support users should also get pharmacy verification privileges.
- Verification run: required `src/**` Firestore searches, support-ticket source inspection, `cd functions && npm run lint`, and `git diff --check`.
- `graphify update .` was not required because this audit changed docs only, not code.
- Suggested commit message: `docs(firebase): audit web impact before discovery rules deploy`.

## Discovery security hardening 2026-04-26 (Codex follow-on)
- **Local code change only, NOT deployed.** Production still runs the previously deployed Functions/rules until the user explicitly approves deployment.
- `functions/index.js` now requires `context.auth` for `searchMedicines`, `nearbyStores`, `getMedicineDetail`, `getMedicineStores`, `getStoreDetail`, and `getCategoryMedicines`.
- New public-safe callables added locally: `getMedicineDetail`, `getMedicineStores`, `getStoreDetail`, `getCategoryMedicines`.
- Public store callable projection now omits `ownerName`, `licenseNumber`, `licenseAuthority`, owner/member/internal/admin fields, and raw store docs. It returns id/name/verified/address/location/contact/hours/distance/open/freshness style fields only.
- `apps/mobile/services/discoveryApi.ts` no longer imports `firebase/firestore` and no longer uses `getDoc`/`getDocs` for discovery. Search, nearby stores, medicine detail, medicine stores, store detail, and category browse all call Functions and keep mock fallback.
- Remaining mobile direct Firestore reads are in `apps/mobile/services/userProfile.ts` for signed-in user profile persistence/gating, not discovery data.
- `firestore.rules` now blocks ordinary signed-in direct reads of full `medicines`, `stores`, and store inventory docs. Store/inventory direct reads require `canAccessStore`; medicine direct reads require `canVerifyDocs`; global fallback is deny-all.
- Verification passed: `functions node --check index.js`, `functions npm run lint`, `apps/mobile npm run typecheck`, `apps/mobile npx expo export --platform android --output-dir .expo/security-discovery-export`, `git diff --check`, and Graphify update via absolute path.
- Deploy command after review/approval: `firebase deploy --only functions:searchMedicines,functions:nearbyStores,functions:getMedicineDetail,functions:getMedicineStores,functions:getStoreDetail,functions:getCategoryMedicines,firestore:rules --project nearnest-platform`.
- Next runtime proof needed after deploy: authenticated Android dev-client walkthrough against live backend and forced mock fallback test.

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
