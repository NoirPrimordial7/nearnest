# Nearnest — Architecture

_Living document. Updated by the `firebase-architect` and `mobile-product-planner` skills._

## 1. System overview

Nearnest is a two-surface product sharing one Firebase backend:

1. **Web portal** (this repo, root) — React + Vite. Used by store owners, admins, verifiers, and support.
2. **Mobile app** (to live in `apps/mobile/`, not yet scaffolded) — React Native + Expo. Used primarily by end customers (and a lightweight store-admin view in Phase 2).

Both clients talk to the **same Firebase project**. All business-critical writes go through **Cloud Functions**; the client SDK is used only for reads and for user-owned writes (profile edits, cart state, etc.).

```
┌────────────────┐        ┌────────────────┐
│  Web Portal    │        │  Mobile App    │
│  React + Vite  │        │ React Native   │
│  (src/)        │        │ Expo           │
│                │        │ (apps/mobile/) │
└───────┬────────┘        └────────┬───────┘
        │  Firebase Web SDK         │  Firebase JS SDK + Expo modules
        └────────────┬──────────────┘
                     ▼
        ┌──────────────────────────┐
        │   Firebase (asia-south1) │
        │  ┌────────────────────┐  │
        │  │ Auth  │  Firestore │  │
        │  │ Storage│ Functions │  │
        │  │ FCM   │ App Check │  │
        │  │ Data Connect (TBD)│  │
        │  └────────────────────┘  │
        └──────────────┬───────────┘
                       │
        ┌──────────────┴───────────┐
        │  Google Maps / Places    │
        │  (separate API key)      │
        └──────────────────────────┘
```

## 2. Web portal architecture (current)

- **Stack:** React 19, React Router v7, Vite (rolldown-vite override), CSS Modules.
- **Entry:** `src/main.jsx` → `src/App.jsx` (route table).
- **Auth context:** `src/pages/Auth/AuthContext` provides `useAuth()`.
- **Route protection:** `ProtectedRoute` (roles) + `RequireProfile` (profile completion).
- **Roles:** `user`, `storeAdmin`, `admin` (plus `verifier` implied by rules).
- **Main flows already built:**
  - Signup + email verify
  - Profile setup
  - Store registration → document upload → review → verification status
  - Admin: dashboard, stores list, document verification, support
  - Store admin: dashboard, inventory, ads, settings, support
- **Design direction:** see `docs/DESIGN_SYSTEM.md`.

## 3. Mobile app architecture (planned)

Target stack:
- **React Native via Expo (managed workflow)** with EAS for builds/OTA updates.
- **expo-router** for file-based navigation (decision open — confirm before scaffold).
- **Firebase JS SDK** (not `@react-native-firebase`) for simplicity and parity with web — confirm before scaffold.
- **State:** lightweight store (Zustand) + React Query for server state. Confirm in planning.
- **Forms:** react-hook-form + zod.
- **Maps:** `react-native-maps` (via Expo config plugin) + Google Places Web Service via our own Cloud Function proxy (to keep the API key server-side).

Folder layout to be created under `apps/mobile/`:
```
apps/mobile/
├── app/ or screens/     # route tree
├── components/          # reusable UI
├── navigation/          # if not using expo-router
├── services/            # firebase.ts, api.ts, maps.ts
├── hooks/
├── store/               # zustand slices
├── utils/
├── constants/
├── theme/               # tokens from docs/DESIGN_SYSTEM.md
├── assets/
└── app.config.ts
```

## 4. Firebase design

### 4.1 Auth
- Email / password with mandatory email verification for sensitive actions.
- Phone auth (OTP) added in Phase 2 for mobile-first customers.
- Custom claims set from Cloud Functions for `admin`, `verifier`, `storeAdmin` roles (currently roles are stored in `users/{uid}.roles` — migration to claims is an open question).

### 4.2 Firestore — current + planned collections
Current (in rules):
- `users/{uid}` — profile, `roles[]`, `permissions[]`
- `roles/{roleId}` — role definitions (read-only for signed-in users)
- `stores/{storeId}` — store metadata, `ownerId`, `members{}`, `membersArr[]`, `visibleTo[]`
- `stores/{storeId}/documents/{docId}` — verification uploads
- `stores/{storeId}/verificationLogs/{logId}` — audit trail
- `stores/{storeId}/{sub=**}` — generic sub-collections fallback

Planned (to design with `firebase-architect`):
- `stores/{storeId}/inventory/{sku}` — product catalog per store
- `stores/{storeId}/products/{productId}` — denormalized for search
- `carts/{uid}` — active cart (client-owned)
- `orders/{orderId}` — order header (server-owned writes only)
- `orders/{orderId}/items/{itemId}` — line items
- `orders/{orderId}/events/{eventId}` — state transitions (audit)
- `prescriptions/{prescriptionId}` — uploaded scripts + approval state (server-set)
- `payments/{paymentId}` — payment records (server-owned)
- `notifications/{uid}/items/{id}` — per-user inbox
- `deliveries/{deliveryId}` — dispatch state + driver
- `supportTickets/{ticketId}` — already partially used by admin

### 4.3 Storage
Current:
- `avatars/{uid}/*` — user avatars (owner-only write, any signed-in read)
- `storeDocs/{storeId}/*` — verification docs, images/PDFs only, owner/member gated
- Default deny fallback

Planned:
- `products/{storeId}/{sku}/*` — product images (owner/member write, public read via download URL)
- `prescriptions/{uid}/{prescriptionId}/*` — user uploads, only readable by owner + approving admin (enforced by Cloud Function-issued signed URLs)
- `orders/{orderId}/receipts/*` — server-written only

### 4.4 Cloud Functions (to design)
All protected logic lives here. Current state: only a `helloWorld` stub.

Planned callable/HTTP + triggered functions:
- `createOrder` — validates cart, computes totals, reserves inventory, requires prescription proof for Rx items, writes `orders/` + event.
- `updateOrderStatus` — transitions order state; role-gated; writes event.
- `uploadPrescription` → triggers `onPrescriptionCreate` — notifies store admin, returns pending state.
- `reviewPrescription` — approve/reject; only admin/store admin; writes log.
- `processPayment` — webhook-backed; updates `payments/` + `orders/`.
- `assignDelivery` / `updateDeliveryLocation` — dispatch flow.
- `sendNotification` — wraps FCM send for a target uid/topic.
- `setUserRole` — admin-only, sets custom claims.
- Scheduled: `expireStaleCarts`, `reconcilePayments`.

### 4.5 FCM notifications
- Per-device tokens stored under `users/{uid}/fcmTokens/{tokenId}` (planned).
- Topics for broadcast (`store:{storeId}`, `order:{orderId}`).
- All sends go through `sendNotification` Cloud Function; clients never send directly.

### 4.6 App Check
- Enable for prod: reCAPTCHA v3 (web), Play Integrity (Android), App Attest (iOS).
- Required on Firestore, Storage, and Functions before public launch.

### 4.7 Data Connect
Scaffolded but not in use. Decision pending on whether to adopt for relational views (order history, analytics). Default: stay on Firestore for MVP.

## 5. Google Maps + Places integration

- **Web:** `@googlemaps/js-api-loader` already in deps. Key must be restricted to site origins.
- **Mobile:**
  - Map rendering: `react-native-maps` with Google provider. Separate keys per platform, restricted to app bundle IDs.
  - Place search / autocomplete: **route through a `placesSearch` Cloud Function** so the server key stays off the device.
- Shared utility today: `src/utils/places.js`.

## 6. Prescription approval workflow

1. User adds a prescription-required medicine to cart → client blocks checkout until a prescription is attached.
2. User uploads prescription image/PDF → `uploadPrescription` Cloud Function creates `prescriptions/{id}` with `state: 'pending'`.
3. Store admin (or global admin) opens pending queue in store-admin portal → calls `reviewPrescription` with `approve` or `reject` + notes.
4. Function writes `state: 'approved'|'rejected'`, logs actor + timestamp, sends FCM notification.
5. Only orders where every Rx item references an `approved` prescription for the ordering user can be fulfilled. Enforcement lives in `createOrder` + `updateOrderStatus` — never in the client.

## 7. Order → payment → delivery flow

```
draft cart (client)
   │   user checks out
   ▼
createOrder (callable Function)
   │   validates Rx gate, computes total, reserves inventory
   ▼
order:created (event)  ──►  FCM to store admin
   │   user pays
   ▼
processPayment (webhook) ──► order.status = paid
   │
   ▼
store admin accepts ──► order.status = preparing
   │
   ▼
assignDelivery ──► order.status = out_for_delivery, delivery doc created
   │
   ▼
delivery confirmed ──► order.status = delivered
```

Every transition writes to `orders/{id}/events` with actor uid + timestamp for audit.

## 8. Open architecture questions — RESOLVED 2026-04-24

The eight questions previously tracked here were resolved and recorded in `docs/DECISIONS.md` (D-007 … D-014). Summary:

| # | Question | Decision | Ref |
|---|----------|----------|-----|
| 1 | Navigation library | **expo-router** | D-007 |
| 2 | Firebase client on mobile | **Firebase JS SDK** (+ `expo-notifications` for FCM) | D-008 |
| 3 | Role authority | **Custom claims** (canonical) + `users.roles[]` mirror during 3-phase rollout | D-009 |
| 4 | India payment provider | **Razorpay** (Cashfree fallback) | D-010 |
| 5 | Places / Maps proxy hosting | **Same `functions/` codebase**, per-uid rate-limited callables, App Check enforced | D-011 |
| 6 | Data Connect timeline | **Deferred past MVP**, re-evaluate at 3 months post-launch | D-012 |
| 7 | Search backend for MVP | **Firestore `searchTokens[]` prefix index**, exposed via `searchMedicines` callable so it's swappable to Typesense / Algolia later | D-013 |
| 8 | Prescription scope | **Per-store** for MVP; cross-store variant reserved for Phase 2 pending legal review | D-014 |

Any new open questions discovered while implementing should be re-opened here and tracked until they become a `D-NNN` decision in `DECISIONS.md`.
