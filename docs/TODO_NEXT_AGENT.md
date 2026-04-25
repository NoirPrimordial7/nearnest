# Next-Agent TODO

The top section ("Next up") is rewritten at the end of every session by the `agent-handoff-logger` skill. The backlog below it grows over time.

---

## Next up (as of 2026-04-25, after Google AuthSession wiring)

**Canonical MVP:**
- Find a medicine.
- Show nearby stores that have it.
- Show store details and availability.
- Guide / navigate the user to the store.
- Let the user call / contact the store.

**Mobile brand:** customer-facing app is **Medifind**. Nearnest remains the parent/store/admin platform brand.

**Phase 2 / optional (not MVP):** delivery, cart, checkout, payment, order tracking, prescription delivery flow.

**Auth implementation now:** Firebase Authentication is wired with email/password through the Firebase JS SDK. Splash gates on Firebase Auth state. Google AuthSession code is wired through Firebase JS SDK `GoogleAuthProvider`, but Android Google sign-in is blocked until `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` is added locally and a Medifind development build is installed.

**Google auth status:** code is present, not fully functional locally. Expo Go should not be used as the final OAuth test environment because Expo's OAuth guidance requires a development build for app-specific redirects. The local `.env` has Google Web and iOS client IDs present, but `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` is missing.

**Phone auth status:** `/phone-otp` UI stub exists. Real SMS is deferred because Firebase JS SDK Phone Auth requires a reCAPTCHA verifier with a browser DOM, and Expo's old Firebase reCAPTCHA package is archived. Do not fake SMS or bypass reCAPTCHA.

**Future profile gate:** every user should eventually have a minimal profile in `users/{uid}` before reaching Home, but there is no Firestore profile gate in the app yet. Do not add direct profile writes until the profile contract and rules are approved.

**Rx in MVP:** Rx medicines appear in discovery with a strong "Prescription required" badge and warning. Discovery and navigation are not blocked. No reserve/order/delivery. No medical advice, dosage, usage, or side-effect copy, even if the data exists in `medicines/{id}`.

1. **Commit the Google AuthSession wiring and Phone OTP stub.** Include `apps/mobile/app/sign-in.tsx`, `apps/mobile/app/sign-up.tsx`, `apps/mobile/app/phone-otp.tsx`, `apps/mobile/services/auth.ts`, `apps/mobile/services/googleAuth.ts`, `apps/mobile/services/phoneAuth.ts`, `apps/mobile/.env.example`, `apps/mobile/README.md`, `apps/mobile/app.json`, `apps/mobile/package.json`, `apps/mobile/package-lock.json`, `docs/AGENT_LOG.md`, `docs/TODO_NEXT_AGENT.md`, `docs/SESSION_STATE.md`, and tracked Graphify outputs. Suggested message: `feat(mobile): wire Google auth and phone OTP stub`.
2. **Add the missing Android Google client ID locally.** Add this only to untracked `apps/mobile/.env`, never to committed files:
   `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=`
3. **Restart Expo after changing env values:**
   `cd C:\projects\nearnest\web-portal\apps\mobile`
   `npx expo start -c --lan`
4. **Use a Medifind development build for Google OAuth testing.** Expo Go can load the app, but the Google button intentionally blocks in Expo Go with a clear message.
5. **Run a manual live auth pass with a known Firebase test account.** Automated verification passed (`npm run typecheck`, Android Expo export, SDK/dependency scans), but a credentialed device/simulator test still needs a test account.
6. **If phone browser cannot reach Metro, fix Windows firewall from Administrator PowerShell:**
   `netsh advfirewall firewall add rule name="Medifind Expo Node Private" dir=in action=allow program="C:\Program Files\nodejs\node.exe" enable=yes profile=private`
   `netsh advfirewall firewall add rule name="Medifind Expo Metro 8081 Private" dir=in action=allow protocol=TCP localport=8081 profile=private`
   `netsh advfirewall firewall add rule name="Medifind Expo Metro 8082 Private" dir=in action=allow protocol=TCP localport=8082 profile=private`
7. **If LAN still fails, try fallback port:**
   `npx expo start -c --lan --port 8082`
   Then test `http://192.168.1.149:8082` and `exp://192.168.1.149:8082`.
8. **Choose the real Phone OTP implementation path before enabling SMS.** The current screen is a UI stub with a clear blocker. Do not use Firebase JS SDK phone auth in native Expo unless a supported reCAPTCHA verifier path is approved.
9. **Add Email Verification and Forgot Password next.** Use Firebase JS SDK email verification/reset APIs, then update navigation around verified/unverified users.
10. **Resolve the post-sign-up route.** Current Firebase success path routes Sign Up to Home per the latest auth-wiring request; product docs still require a minimal profile before Home, so add a profile-completion guard before release.
11. **Add Profile Setup persistence only after Firestore/profile rules are approved.** Do not add direct profile writes until the mobile-safe profile contract is clear.
12. **Do not scaffold commerce routes in MVP.** No cart, checkout, payment status, orders, delivery tracking, or prescription upload/review screens unless the user explicitly expands scope.
13. **Use Graphify before architecture/codebase answers.** Read `graphify-out/GRAPH_REPORT.md`; run `graphify update .` after code changes when `graphify-out/**` is in scope.
14. **Do not edit protected areas.** No edits to root `src/**`, `functions/**`, `dataconnect/**`, Firebase rules/config, root package files, root env files, or `serviceAccountKey.json` without explicit authorization.
15. **End every session by updating handoff memory.** Append to `docs/AGENT_LOG.md`, rewrite this "Next up" section, and update `docs/SESSION_STATE.md`.

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
- Google Auth is disabled UI-only for now. Do not re-add `expo-auth-session` / `expo-web-browser` until the Android OAuth client ID and development-build path are ready and explicitly approved.
- Phone auth remains disabled and marked coming soon.
- Add auth routes not yet present: Email Verification and Forgot Password.
- Profile setup + saved search area/address
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
