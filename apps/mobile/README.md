# Medifind Mobile

Expo managed workflow scaffold for the Medifind customer mobile app.

## Stack

- Expo SDK 54
- TypeScript
- expo-router
- Firebase JS SDK for Auth

## Current Scope

This scaffold contains early MVP auth screens and placeholder app screens:

- Splash
- Welcome
- Sign In
- Sign Up
- Profile Setup
- Home

Firebase app/Auth initialization lives in `services/firebase.ts` and reads only Expo public env variables. Sign In and Sign Up call Firebase email/password Auth through the Firebase JS SDK with React Native AsyncStorage persistence. Google auth, Phone auth, Firestore, Functions, analytics, and backend wiring are not implemented yet.

## Environment

Create a local `apps/mobile/.env` file with the variables listed in `.env.example`. The local `.env` and `.env.local` files are ignored by Git.

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

Google auth is UI-only right now. Before implementing it later, add a real Android client ID from the Medifind development/production build credentials:

```bash
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
```

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
- Do not commit real Firebase values. Use local Expo public env variables only.
- Do not commit real Google OAuth client IDs. Google auth remains disabled until explicitly reintroduced.
- MVP stays focused on medicine discovery, nearby store availability, store contact, and navigation.
- Cart, checkout, payment, order tracking, delivery, and Phone OTP remain out of MVP unless explicitly approved.
