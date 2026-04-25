# Next-Agent TODO

The top section ("Next up") is rewritten at the end of every session by the `agent-handoff-logger` skill. The backlog below it grows over time.

---

## Next up (as of 2026-04-26, discovery UI mock phase)

**Current verified auth state:** Medifind mobile uses Firebase JS SDK only. Email/password and Google sign-in both save or refresh `users/{uid}` in Firestore, then route through: unverified password user -> `/verify-email`; incomplete profile -> `/profile-setup`; complete profile -> `/home`. Google dev-build flow passed on emulator via `10.0.2.2:8081`; Profile Setup routed to Home after save. Email/password + Firestore profile persistence has a direct live smoke test.

**Phone OTP direction:** `D-015` now explicitly defers Phone OTP until after the medicine discovery MVP. Keep Email/Password + Google as MVP auth. Do not install React Native Firebase, do not disable email/password, and do not build a custom SMS backend yet. The `/phone-otp` route remains a disabled "coming soon" UI.

**Discovery UI status:** Home is now the discovery entry page. Mock-only routes exist for `/search`, `/store/[storeId]`, and `/medicine/[medicineId]`, backed by `apps/mobile/services/mockDiscovery.ts` and `apps/mobile/types/discovery.ts`. These screens show medicine search, nearby store previews, availability badges, Rx warnings, public call actions, and native maps URL handoff. They do not call Firestore, Cloud Functions, Maps SDKs, or any real inventory service.

**Canonical MVP remains:** find a medicine, show nearby stores with availability, show store detail, guide/navigation, and call/contact store. Delivery, cart, checkout, payment, orders, and prescription delivery are Phase 2.

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
