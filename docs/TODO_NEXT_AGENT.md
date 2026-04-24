# Next-Agent TODO

The top section ("Next up") is rewritten at the end of every session by the `agent-handoff-logger` skill. The backlog below it grows over time.

---

## Next up (as of 2026-04-25, after auth verification report)

**Canonical MVP:**
- Find a medicine.
- Show nearby stores that have it.
- Show store details and availability.
- Guide / navigate the user to the store.
- Let the user call / contact the store.

**Mobile brand:** customer-facing app is **Medifind**. Nearnest remains the parent/store/admin platform brand.

**Phase 2 / optional (not MVP):** delivery, cart, checkout, payment, order tracking, prescription delivery flow.

**Auth implementation now:** Firebase Authentication is wired with email/password through the Firebase JS SDK only. Splash now gates on Firebase Auth state. Google and Phone buttons are disabled UI-only placeholders.

**Google auth status:** do not reintroduce Google OAuth yet. `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` is still required before Google auth can be implemented against a development/production build. `expo-auth-session`, `expo-web-browser`, `GoogleAuthProvider`, and all `@react-native-firebase/*` usage have been removed from the mobile app.

**Phone auth status:** Phone OTP is Phase 2.

**Future profile gate:** every user should eventually have a minimal profile in `users/{uid}` before reaching Home, but there is no Firestore profile gate in the app yet. Do not add direct profile writes until the profile contract and rules are approved.

**Rx in MVP:** Rx medicines appear in discovery with a strong "Prescription required" badge and warning. Discovery and navigation are not blocked. No reserve/order/delivery. No medical advice, dosage, usage, or side-effect copy, even if the data exists in `medicines/{id}`.

1. **Commit and push the auth verification report.** Include `docs/MOBILE_AUTH_VERIFICATION_REPORT_2026-04-25.md`, `docs/AGENT_LOG.md`, `docs/TODO_NEXT_AGENT.md`, and `docs/SESSION_STATE.md`. Suggested message: `docs(mobile): add auth verification report`.
2. **Restart Expo after pulling this change:**
   `cd C:\projects\nearnest\web-portal\apps\mobile`
   `npx expo start -c --lan`
3. **Run a manual live auth pass with a known Firebase test account.** Automated verification passed (`npm run typecheck`, Android Expo export, SDK/dependency scans), but a credentialed device/simulator test still needs a test account.
4. **Decide Google Auth direction before coding.** If Google must work now, explicitly approve reimplementation, add `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` to untracked `apps/mobile/.env`, and use Firebase JS SDK only. If not, keep the disabled "coming soon" buttons.
5. **If phone browser cannot reach Metro, fix Windows firewall from Administrator PowerShell:**
   `netsh advfirewall firewall add rule name="Medifind Expo Node Private" dir=in action=allow program="C:\Program Files\nodejs\node.exe" enable=yes profile=private`
   `netsh advfirewall firewall add rule name="Medifind Expo Metro 8081 Private" dir=in action=allow protocol=TCP localport=8081 profile=private`
   `netsh advfirewall firewall add rule name="Medifind Expo Metro 8082 Private" dir=in action=allow protocol=TCP localport=8082 profile=private`
6. **If LAN still fails, try fallback port:**
   `npx expo start -c --lan --port 8082`
   Then test `http://192.168.1.149:8082` and `exp://192.168.1.149:8082`.
7. **Add Email Verification and Forgot Password next.** Use Firebase JS SDK email verification/reset APIs, then update navigation around verified/unverified users.
8. **Resolve the post-sign-up route.** Current Firebase success path routes Sign Up to Home per the latest auth-wiring request; product docs still require a minimal profile before Home, so add a profile-completion guard before release.
9. **Add Profile Setup persistence only after Firestore/profile rules are approved.** Do not add direct profile writes until the mobile-safe profile contract is clear.
10. **Do not scaffold commerce routes in MVP.** No cart, checkout, payment status, orders, delivery tracking, or prescription upload/review screens unless the user explicitly expands scope.
11. **Use Graphify before architecture/codebase answers.** Read `graphify-out/GRAPH_REPORT.md`; run `graphify update .` after code changes when `graphify-out/**` is in scope.
12. **Do not edit protected areas.** No edits to root `src/**`, `functions/**`, `dataconnect/**`, Firebase rules/config, root package files, root env files, or `serviceAccountKey.json` without explicit authorization.
13. **End every session by updating handoff memory.** Append to `docs/AGENT_LOG.md`, rewrite this "Next up" section, and update `docs/SESSION_STATE.md`.

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
