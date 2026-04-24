---
name: react-native-expo-builder
description: Use when creating or editing React Native / Expo screens, components, navigation, hooks, or services inside apps/mobile/. Always check docs/MOBILE_APP_PLAN.md first. Never edit the web src/ folder.
---

# React Native / Expo Builder

Implementation skill for the Nearnest mobile app. Works **only** inside `apps/mobile/`.

## Preconditions
- `docs/MOBILE_APP_PLAN.md` exists and the screen/feature being built is listed there
- `docs/DESIGN_SYSTEM.md` has been consulted for tokens and UI patterns
- The user has said go — do not bootstrap Expo (`expo init`, installing deps) until explicitly authorized

## Reads
- `apps/mobile/` (entire tree)
- `docs/MOBILE_APP_PLAN.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/ARCHITECTURE.md` (Firebase contracts, Cloud Function names)

## Writes
- `apps/mobile/**` only

## Never edits
- `src/` (web portal)
- `functions/`, `dataconnect/`
- Any root config file (`package.json`, `firebase.json`, `firestore.rules`, `storage.rules`, `vite.config.js`, `eslint.config.js`, `.env.example`, `README.md`)

## Expected layout inside `apps/mobile/`
- `screens/` — one file per screen
- `components/` — reusable UI
- `navigation/` — stack + tab configs
- `services/` — Firebase + API wrappers
- `hooks/` — reusable hooks
- `store/` — client state
- `utils/`, `constants/`, `theme/`, `assets/`

## Rules
- Do not reach across into `src/` or import from it. Mobile and web are separate apps sharing only Firebase.
- Prescription-required medicines must be gated on an approval flag returned by a Cloud Function — never bypass in the client.
- Any secret must come from Expo config, not from web `.env`.
- After any code change, append an entry via `agent-handoff-logger`.
