# Nearnest Session State

Last updated: 2026-04-25 (Medifind Firebase Auth SDK cleanup)

## Current phase
Mobile development has started. Graphify coordination is installed and indexed. The customer-facing mobile app is **Medifind**, with Nearnest remaining the parent/store/admin platform brand.

**Scaffold status (2026-04-24):** `apps/mobile/` contains an Expo managed workflow app using TypeScript and expo-router. Firebase JS SDK is installed and `apps/mobile/services/firebase.ts` initializes the Firebase app plus Auth instance from Expo public env variables. `apps/mobile/.env.example` lists the required keys, while `apps/mobile/.env` and `.env.local` are ignored. There is still no committed real Firebase config, no Firestore, no callable Functions, and no backend changes. Placeholder routes exist for Splash, Welcome, Sign In, Sign Up, Profile Setup, and Home.

**Implementation progress (2026-04-25):** Splash, Welcome, Sign In, and Sign Up have polished Expo UI using `components/Screen.tsx`, `components/ActionButton.tsx`, and `theme/tokens.ts`. Sign In and Sign Up call Firebase Auth email/password methods through `services/auth.ts`, show loading/error states, and route to Home on success. `apps/mobile/services/firebase.ts` now uses the Firebase JS SDK only, initializes Auth with React Native AsyncStorage persistence, reads required Expo public Firebase env vars, and does not initialize analytics. Splash listens to Firebase Auth state and routes authenticated users to `/home` and signed-out users to `/welcome`. Google and Phone buttons are disabled UI-only placeholders for now; Google OAuth code and Expo Auth Session dependencies have been removed until the Android OAuth client ID and development-build flow are ready. Current navigation is Splash -> Home/Welcome based on auth state, Welcome -> Sign In/Sign Up, Sign In -> Home, Sign Up -> Home after account creation; the Profile Setup completion gate is still future work.

**Design progress (2026-04-24):** Splash, Welcome/onboarding, Sign In, Sign Up, and the future Phone OTP flow now have detailed screen specs covering layout, hierarchy, exact copy, button styles, spacing, loading/error states, interactions, and transitions. Phone OTP remains Phase 2 and must not be enabled or scaffolded for MVP unless explicitly approved.

**Canonical MVP (reconfirmed 2026-04-24):**
- Find a medicine.
- Show nearby stores that have it.
- Show store details and availability.
- Guide / navigate the user to the store.
- Let the user call / contact the store.

**Phase 2 / optional (not MVP):** delivery, cart, checkout, payment, order tracking, prescription delivery flow.

**Auth (MVP, clarified 2026-04-25):** Firebase Authentication is required. Current code wires **email/password** only through the Firebase JS SDK for Expo managed workflow. Google sign-in remains planned but disabled until the Expo development-build OAuth setup is ready, including `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`; do not reintroduce Google OAuth without explicit go-ahead. **Phone OTP is Phase 2.** Every mobile user must eventually have a minimal `users/{uid}` profile (`displayName`, `email`, `emailVerified`, `photoUrl?`, `authProvider`, `preferences`, `createdAt`, `updatedAt`) before reaching Home; the current app has no Firestore profile gate yet.

**Rx doctrine (MVP, clarified 2026-04-24):** Rx-required medicines are shown during discovery with a strong "Prescription required" badge and warning. Discovery and navigation are NOT blocked. No reserve/order/delivery path exists in MVP. No medical advice, dosage, usage, side-effects, or substitution guidance is shown anywhere in MVP — even if the canonical `medicines/{id}` doc carries those fields, mobile does not render them.

No root app source, Cloud Functions, Firebase rules, root package files, env files, or secrets should be edited from mobile work. Mobile edits are currently scoped to `apps/mobile/**`.

## Graphify status
- Python package installed: `graphifyy==0.4.23`.
- Global Windows/Claude skill install completed via `graphify install --platform windows`.
- Repo Claude instructions created: `CLAUDE.md`.
- Repo Codex instructions created: `AGENTS.md`.
- Codex hook created: `.codex/hooks.json`.
- Knowledge graph generated under `graphify-out/`.
- Current graph summary from `graphify-out/GRAPH_REPORT.md`: 236 nodes, 226 edges, 61 communities.
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

## Current allowed next work
1. Commit the Firebase Auth SDK cleanup and handoff docs.
2. Restart Expo after pulling this change so Metro picks up the dependency/env changes: `npx expo start -c --lan`.
3. Test email/password sign-in and sign-up on a device or simulator with valid untracked `apps/mobile/.env` Firebase values.
4. Add Email Verification and Forgot Password routes next using Firebase JS SDK APIs.
5. Decide whether Sign Up should route to Profile Setup or Home behind a profile-completion guard; do not add Firestore profile writes until profile rules/contracts are approved.
6. Keep Google Auth UI-only until `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` and the development-build OAuth path are ready and the user explicitly approves reimplementation.
7. Keep Phone OTP Phase 2 unless explicitly approved.
8. Keep implementation limited to discovery MVP surfaces: auth shell, profile/location, home list/map, search/results, store detail, medicine detail, contact store, navigation handoff.
9. Keep backend implementation in the website/backend team's scope; do not edit `functions/**` or Firebase rules from mobile sessions.
10. Do not reintroduce cart, checkout, payment, orders, prescription approval, or delivery into MVP without explicit user direction.

## Protected files not touched in this setup
- `src/**`
- `functions/**`
- `dataconnect/**`
- `package.json`, `package-lock.json`
- `firebase.json`, `firestore.rules`, `storage.rules`, `database.rules.json`, `firestore.indexes.json`
- `.env`, `.env.local`, `.env.example`
- `serviceAccountKey.json`
