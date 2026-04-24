# Medifind Mobile

Expo managed workflow scaffold for the Medifind customer mobile app.

## Stack

- Expo SDK 54
- TypeScript
- expo-router
- Firebase JS SDK dependency only

## Current Scope

This scaffold contains placeholder screens only:

- Splash
- Welcome
- Sign In
- Sign Up
- Profile Setup
- Home

There is no Firebase initialization, no backend wiring, and no real auth yet.

## Commands

```bash
npm run start
npm run android
npm run ios
npm run web
npm run typecheck
```

## Guardrails

- Do not import from the root web portal `src/`.
- Keep Firebase config out of source until an approved mobile env/config plan exists.
- MVP stays focused on medicine discovery, nearby store availability, store contact, and navigation.
- Cart, checkout, payment, order tracking, delivery, and Phone OTP remain out of MVP unless explicitly approved.
