# Next-Agent TODO

The top section ("Next up") is rewritten at the end of every session by the `agent-handoff-logger` skill. The backlog below it grows over time.

---

## Next up (as of 2026-04-26, after live email auth smoke test)

**Auth status:** Medifind mobile uses Firebase JS SDK only. Email/password and Google sign-in both save or refresh `users/{uid}` in Firestore, then route through the same gate: unverified password user -> `/verify-email`; incomplete profile -> `/profile-setup`; complete profile -> `/home`. `/verify-email`, `/forgot-password`, and real Profile Setup persistence are present. The client does not write `roles` or `permissions`.

**Live Firebase verification:** A live Firebase JS SDK smoke test passed for email/password auth and Firestore profile persistence. Test user `codex.medifind.20260425191445@example.com` / uid `q0yxtSRkSoSCSxa9r1QXgPUTX0V2` was created, `users/{uid}` was written/read, profile completion was saved, and sign-in re-read the same profile. The generated account is not email-verified, so app UI should route it to `/verify-email`.

**Development build status:** EAS Android development build `51fcfd40-9e66-44c4-99f6-f0090b1b21e3` succeeded after fixing AsyncStorage to Expo-pinned `2.2.0`. The APK previously installed on emulator `emulator-5554` and reached Welcome and Sign In. During the latest check, ADB first saw `emulator-5554`, then the emulator went offline and later no devices were connected. Restart the emulator or use a physical device before the next UI pass. Expo Go is not the valid Google OAuth test target.

**Google status:** Google OAuth code and local env key presence are verified, but Google sign-in still needs an interactive live test in the development build with a real Google account. Expected path: Sign In/Sign Up -> Continue with Google -> Firebase credential -> Firestore `users/{uid}` merge -> `/profile-setup` or `/home`.

**Phone OTP:** Still deferred. Sign In/Sign Up phone buttons are disabled and `/phone-otp` is a disabled stub with coming-soon copy. Phase 2 needs an approved implementation path for Firebase Phone Auth/reCAPTCHA or a backend SMS/custom-token flow. Do not fake SMS or bypass reCAPTCHA.

**Canonical MVP remains:** find a medicine, show nearby stores with availability, show store detail, guide/navigation, and call/contact store. Delivery, cart, checkout, payment, orders, and prescription delivery are Phase 2.

1. **Commit the current auth/dev-build/docs changes.** Include mobile auth/profile files, docs, and tracked Graphify outputs if they are still staged for the auth work. Suggested message: `test(mobile): verify Firebase auth profile persistence`.
2. **Restart the emulator or connect a physical device.** Confirm `adb devices` shows a connected device before launching the development client.
3. **Run a manual Google live test in the installed development build.** Confirm the Firestore doc has identity/profile fields and no client-written `roles` or `permissions`.
4. **Run a manual email verification UI test with an inbox-controlled Firebase test account.** Expected path: sign-up -> verification email -> `/verify-email` -> verified -> `/profile-setup` -> `/home`.
5. **Optionally clean up the smoke-test account.** Delete Firebase Auth user / Firestore profile for `codex.medifind.20260425191445@example.com` if the project should not retain test records.
6. **If Metro is stale, restart dev client mode:** `cd C:\projects\nearnest\web-portal\apps\mobile` then `npx expo start -c --dev-client --android`.
7. **Add the location/search-area gate after auth live tests pass.** The current gate stops at profile completion; discovery Home still needs location/search-area setup before real MVP use.
8. **Do not scaffold commerce routes in MVP.** No cart, checkout, payment status, orders, delivery tracking, or prescription upload/review screens unless the user explicitly expands scope.
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
