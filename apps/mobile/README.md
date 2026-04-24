# Nearnest — Mobile App (reserved)

This folder is reserved for the **Nearnest React Native / Expo mobile app**.

## Status
**Empty on purpose.** The app has not been scaffolded yet.

## Do NOT run `expo init` here yet
Expo/EAS scaffolding will happen only when the project owner explicitly gives the go-ahead. Until then:

- Do **not** run `npx create-expo-app .` or `expo init` in this folder.
- Do **not** run `npm install` here.
- Do **not** add any screens, components, or config files yet.
- Planning lives in `docs/MOBILE_APP_PLAN.md`. Architecture lives in `docs/ARCHITECTURE.md`. Design tokens live in `docs/DESIGN_SYSTEM.md`.

## Planned layout (once scaffolded)
```
apps/mobile/
├── app/ or screens/     # route tree (expo-router) or screens (React Navigation)
├── components/          # reusable UI (cards, pills, status, Rx gate)
├── navigation/          # stack + tab configs (if not using expo-router)
├── services/            # firebase.ts, api.ts, maps.ts (Places proxy client)
├── hooks/               # useAuth, useCart, useOrder, useRxGate, …
├── store/               # lightweight client state (Zustand)
├── utils/               # formatters, validators
├── constants/           # enums, endpoint names, FCM topics
├── theme/               # tokens mirrored from docs/DESIGN_SYSTEM.md
├── assets/              # images, fonts, lotties
├── app.config.ts        # Expo config (icons, splash, EAS, plugins)
├── eas.json             # EAS build/submit profiles
├── package.json
└── tsconfig.json        # TypeScript
```

## Boundary rules (enforced by the `react-native-expo-builder` skill)
- This app does **not** import from the root-level web portal (`src/`). Web and mobile share Firebase, not code.
- Prescription-required medicines must be gated by a Cloud Function approval flag — never bypass in the client. See `docs/DECISIONS.md` §D-006.
- All protected writes (orders, payments, prescription state, role changes) must go through callable/HTTPS Cloud Functions, not direct Firestore writes. See `docs/DECISIONS.md` §D-005.
- Secrets come from Expo config and EAS, not from the web's `.env`.

## When the user gives the go-ahead
1. Confirm stack decisions from `docs/ARCHITECTURE.md` §8 (expo-router vs React Navigation, Firebase JS SDK vs `@react-native-firebase`, TypeScript, Zustand + React Query).
2. Use `create-expo-app` (TypeScript, managed workflow) in this folder.
3. Commit the scaffold in a **single** commit before any feature work.
4. Then build MVP screens one-by-one from `docs/MOBILE_APP_PLAN.md`, one screen per commit.
