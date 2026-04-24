# Nearnest Session State

Last updated: 2026-04-24 (MVP scope reconfirmed)

## Current phase
Mobile MVP planning is documentation-only. Graphify coordination is installed and indexed.

**Canonical MVP (reconfirmed 2026-04-24):**
- Find a medicine.
- Show nearby stores that have it.
- Show store details and availability.
- Guide / navigate the user to the store.
- Let the user call / contact the store.

**Phase 2 / optional (not MVP):** delivery, cart, checkout, payment, order tracking, prescription delivery flow.

**Auth (MVP, clarified 2026-04-24):** Firebase Authentication is required. Both **email/password** (with email verification) and **Google sign-in** must ship together in MVP. **Phone OTP is Phase 2.** Every mobile user must have a minimal `users/{uid}` profile (`displayName`, `email`, `emailVerified`, `photoUrl?`, `authProvider`, `preferences`, `createdAt`, `updatedAt`) before reaching Home; `onUserCreate` + Profile setup enforce this.

**Rx doctrine (MVP, clarified 2026-04-24):** Rx-required medicines are shown during discovery with a strong "Prescription required" badge and warning. Discovery and navigation are NOT blocked. No reserve/order/delivery path exists in MVP. No medical advice, dosage, usage, side-effects, or substitution guidance is shown anywhere in MVP — even if the canonical `medicines/{id}` doc carries those fields, mobile does not render them.

No app source, Cloud Functions, Firebase rules, package files, env files, or mobile scaffold files should be edited in this phase.

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
1. Commit the MVP priority reset docs.
2. If scaffold is approved later, implement only discovery MVP surfaces: auth, profile/location, home list/map, search/results, store detail, medicine detail, contact store, navigation handoff.
3. Keep `apps/mobile/**` untouched until the user explicitly authorizes Expo scaffolding.
4. Keep backend implementation in the website/backend team's scope; do not edit `functions/**` or Firebase rules from mobile-planning sessions.
5. Optionally create documentation-only wireframe notes for the discovery MVP screens.
6. Do not reintroduce cart, checkout, payment, orders, prescription approval, or delivery into MVP without explicit user direction.

## Protected files not touched in this setup
- `src/**`
- `functions/**`
- `dataconnect/**`
- `apps/mobile/**`
- `package.json`, `package-lock.json`
- `firebase.json`, `firestore.rules`, `storage.rules`, `database.rules.json`, `firestore.indexes.json`
- `.env`, `.env.local`, `.env.example`
- `serviceAccountKey.json`
