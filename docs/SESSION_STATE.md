# Nearnest Session State

Last updated: 2026-04-24 (Medifind Firebase Auth basic setup)

## Current phase
Mobile development has started. Graphify coordination is installed and indexed. The customer-facing mobile app is **Medifind**, with Nearnest remaining the parent/store/admin platform brand.

**Scaffold status (2026-04-24):** `apps/mobile/` contains an Expo managed workflow app using TypeScript and expo-router. Firebase JS SDK is installed and `apps/mobile/services/firebase.ts` now initializes the Firebase app plus Auth instance with placeholder mobile config only. There is still no env wiring, no real Firebase project config, no Firestore, no callable Functions, and no backend changes. Placeholder routes exist for Splash, Welcome, Sign In, Sign Up, Profile Setup, and Home.

**Implementation progress (2026-04-24):** Splash, Welcome, Sign In, and Sign Up have polished Expo UI using `components/Screen.tsx`, `components/ActionButton.tsx`, and `theme/tokens.ts`. Sign In and Sign Up now call Firebase Auth email/password methods through `services/auth.ts`, show loading/error states, and route to Home on success. Google and phone login buttons remain UI-only with no provider logic. Current navigation is Splash -> Welcome, Welcome -> Sign In/Sign Up, Sign In -> Home, Sign Up -> Home after account creation; the Profile Setup completion gate is still future work.

**Design progress (2026-04-24):** Splash, Welcome/onboarding, Sign In, Sign Up, and the future Phone OTP flow now have detailed screen specs covering layout, hierarchy, exact copy, button styles, spacing, loading/error states, interactions, and transitions. Phone OTP remains Phase 2 and must not be enabled or scaffolded for MVP unless explicitly approved.

**Canonical MVP (reconfirmed 2026-04-24):**
- Find a medicine.
- Show nearby stores that have it.
- Show store details and availability.
- Guide / navigate the user to the store.
- Let the user call / contact the store.

**Phase 2 / optional (not MVP):** delivery, cart, checkout, payment, order tracking, prescription delivery flow.

**Auth (MVP, clarified 2026-04-24):** Firebase Authentication is required. Both **email/password** (with email verification) and **Google sign-in** must ship together in MVP. **Phone OTP is Phase 2.** Every mobile user must have a minimal `users/{uid}` profile (`displayName`, `email`, `emailVerified`, `photoUrl?`, `authProvider`, `preferences`, `createdAt`, `updatedAt`) before reaching Home; `onUserCreate` + Profile setup enforce this.

**Rx doctrine (MVP, clarified 2026-04-24):** Rx-required medicines are shown during discovery with a strong "Prescription required" badge and warning. Discovery and navigation are NOT blocked. No reserve/order/delivery path exists in MVP. No medical advice, dosage, usage, side-effects, or substitution guidance is shown anywhere in MVP — even if the canonical `medicines/{id}` doc carries those fields, mobile does not render them.

No root app source, Cloud Functions, Firebase rules, root package files, env files, or secrets should be edited from mobile work. Mobile edits are currently scoped to `apps/mobile/**`.

## Graphify status
- Python package installed: `graphifyy==0.4.23`.
- Global Windows/Claude skill install completed via `graphify install --platform windows`.
- Repo Claude instructions created: `CLAUDE.md`.
- Repo Codex instructions created: `AGENTS.md`.
- Codex hook created: `.codex/hooks.json`.
- Knowledge graph generated under `graphify-out/`.
- Current graph summary from `graphify-out/GRAPH_REPORT.md`: 228 nodes, 217 edges, 60 communities.
- `.graphifyignore` exists and excludes env/secrets, generated build outputs, Graphify cache/cost/manifest files, and AI config folders.

## Command notes
- `graphify .` failed because this CLI version does not support `.` as a command.
- `graphify update .` is the working replacement and was used to create/update the graph.
- `graphify claude install` created `.claude/settings.json`; that file was removed because it was outside the allowed edit list for this session.
- `graphify update .` was not run during the Firebase Auth wiring pass because that session's allowed edit scope did not include `graphify-out/**`.

## Current allowed next work
1. Commit the Firebase Auth basic wiring and handoff docs.
2. Replace placeholder Firebase config through an approved mobile config/env plan before testing real accounts.
3. Add Email Verification and Forgot Password routes, then decide whether Sign Up should route to Profile Setup or Home behind a profile-completion guard.
4. Add the Profile Setup completion gate and minimal profile write only after Firestore/profile rules are approved.
5. Add Google sign-in later for MVP; keep phone OTP Phase 2 unless explicitly approved.
6. Keep implementation limited to discovery MVP surfaces: auth shell, profile/location, home list/map, search/results, store detail, medicine detail, contact store, navigation handoff.
7. Keep backend implementation in the website/backend team's scope; do not edit `functions/**` or Firebase rules from mobile sessions.
8. Do not reintroduce cart, checkout, payment, orders, prescription approval, or delivery into MVP without explicit user direction.

## Protected files not touched in this setup
- `src/**`
- `functions/**`
- `dataconnect/**`
- `package.json`, `package-lock.json`
- `firebase.json`, `firestore.rules`, `storage.rules`, `database.rules.json`, `firestore.indexes.json`
- `.env`, `.env.local`, `.env.example`
- `serviceAccountKey.json`
