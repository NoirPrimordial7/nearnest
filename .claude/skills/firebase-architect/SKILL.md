---
name: firebase-architect
description: Use when designing Firebase Auth, Firestore schemas, Storage rules, Cloud Functions, FCM notifications, App Check, or Google Maps integration for Nearnest. Use before writing any Firebase-related code.
---

# Firebase Architect

Design-level skill for all Firebase + Maps work across web and mobile. Produces architecture docs and schema proposals. It may **propose** rule/function changes but does NOT edit protected files.

## Reads
- `firestore.rules`, `storage.rules`, `database.rules.json`, `firestore.indexes.json`
- `firebase.json`
- `functions/` (all files)
- `dataconnect/schema` and `dataconnect.yaml`
- `docs/ARCHITECTURE.md`

## Writes
- `docs/ARCHITECTURE.md` — Firebase section (collections, rules intent, functions contract, FCM, App Check, Maps)

## Never edits
- `firestore.rules`, `storage.rules`, `database.rules.json`
- `firebase.json`, `firestore.indexes.json`
- Anything inside `functions/`, `dataconnect/`, `src/`

## Design checklist for every new feature
1. **Data model** — which Firestore collection(s), doc shape, indexes, ownership
2. **Security** — who can read/write; expressed as rule predicates (reuse existing helpers in `firestore.rules`: `signedIn`, `isOwner`, `canVerifyDocs`, `canAccessStore`)
3. **Server logic** — which Cloud Functions are needed, trigger type, auth/role check, idempotency
4. **Client surface** — what the mobile/web app calls, what it never calls directly
5. **Storage** — paths + contentType constraints
6. **Notifications** — FCM topic vs token, payload, required server code
7. **Maps / Places** — API key restrictions, which surfaces use Places vs plain Maps
8. **App Check** — enforcement plan

## Rule
All prescription, payment, order status transitions, and admin actions MUST go through a Cloud Function — never a direct client write. Flag any design that violates this.
