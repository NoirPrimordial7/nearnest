# Nearnest Session State

Last updated: 2026-04-24 (Medifind Expo scaffold created)

## Current phase
Mobile development has started. Graphify coordination is installed and indexed. The customer-facing mobile app is **Medifind**, with Nearnest remaining the parent/store/admin platform brand.

**Scaffold status (2026-04-24):** `apps/mobile/` now contains an Expo managed workflow app using TypeScript and expo-router. Firebase is present as the Firebase JS SDK dependency only; there is no Firebase initialization, no env wiring, no backend calls, and no real auth implementation yet. Placeholder routes exist for Splash, Welcome, Sign In, Sign Up, Profile Setup, and Home.

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
- Current graph summary from `graphify-out/GRAPH_REPORT.md`: 208 nodes, 207 edges, 50 communities.
- `.graphifyignore` exists and excludes env/secrets, generated build outputs, Graphify cache/cost/manifest files, and AI config folders.

## Command notes
- `graphify .` failed because this CLI version does not support `.` as a command.
- `graphify update .` is the working replacement and was used to create/update the graph.
- `graphify claude install` created `.claude/settings.json`; that file was removed because it was outside the allowed edit list for this session.

## Current allowed next work
1. Commit the Medifind Expo scaffold and handoff docs.
2. Next mobile implementation pass: add placeholder Email Verification and Forgot Password routes, then refine Profile Setup, Location Permission, and Address/Search-Area Picker.
3. Keep implementation limited to discovery MVP surfaces: auth shell, profile/location, home list/map, search/results, store detail, medicine detail, contact store, navigation handoff.
4. Keep backend implementation in the website/backend team's scope; do not edit `functions/**` or Firebase rules from mobile sessions.
5. Do not add Firebase config/env values until an approved mobile config plan exists.
6. Do not reintroduce cart, checkout, payment, orders, prescription approval, or delivery into MVP without explicit user direction.
7. Do not add Phone OTP to MVP unless the user explicitly changes the auth scope.

## Protected files not touched in this setup
- `src/**`
- `functions/**`
- `dataconnect/**`
- `package.json`, `package-lock.json`
- `firebase.json`, `firestore.rules`, `storage.rules`, `database.rules.json`, `firestore.indexes.json`
- `.env`, `.env.local`, `.env.example`
- `serviceAccountKey.json`
