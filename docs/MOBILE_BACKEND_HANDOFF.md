# Nearnest — Mobile → Backend Handoff (beginner-friendly)

This is a practical, plain-English handoff for the **website / backend team**. It explains what the mobile app needs from Firebase + Cloud Functions before we can start building screens, and in what order.

You do NOT need to read the full docs unless you want to. The three detailed companion docs are:
- `docs/BACKEND_FUNCTIONS_CONTRACT.md` — every function, payload, validation.
- `docs/FIRESTORE_SCHEMA_CONTRACT.md` — every collection, field, index.
- `docs/FIREBASE_RULES_PROPOSAL.md` — proposed rules for the new collections.

---

## 1. Why the backend has to go first

The Nearnest mobile app is a **thin client on top of Firebase + Cloud Functions**. Almost every meaningful action (place an order, upload a prescription, pay, get search results) is a call to a Cloud Function. If the backend isn't in place:

- The mobile app can't be tested against anything real.
- We'd be forced to mock every flow inside the app, then rewrite half of it once the backend lands — that's weeks of wasted work and a guaranteed source of bugs.
- Security-critical rules (prescription gate, order totals, payment state) live **in the functions and rules** — not the app. Without them, any demo with fake data would mislead us about whether the app is safe to ship.

The deal is: **backend stubs first (returning sensible placeholder data), then mobile builds against real endpoints.** Stubs become real logic incrementally. We don't need everything done on day one — we need the shape locked in.

---

## 2. What the mobile app expects from the backend

In plain terms, the mobile app expects the backend to provide:

1. **A stable identity system.** Firebase Auth email/password works out of the box. We just need `onUserCreate` to initialise the `users/{uid}` Firestore doc with sensible defaults, and a `setUserRole` callable so admins can grant roles without editing Firestore manually.
2. **A place-and-map proxy so API keys never ship in the app.** Four callables: `placesSearch`, `placeDetails`, `geocode`, `reverseGeocode`. The Google API key lives in Functions config, not the app.
3. **A way to search medicines.** One callable, `searchMedicines`, that takes a query and a location and returns nearby stores that actually have the item in stock.
4. **A cart + order pipeline.** Three callables in sequence: `computeCartTotal` → `createOrder` → `createPaymentOrder`, plus a Razorpay webhook (`paymentsWebhook`) that updates the order when payment is captured.
5. **A prescription pipeline.** `uploadPrescription` (creates the doc + returns signed upload URLs), `reviewPrescription` (the store pharmacist approves / rejects from the web portal), and triggers that notify the user on state changes.
6. **A notification pipeline.** `registerFcmToken` from the app; `sendNotification` used internally by other functions; Firestore triggers on order / prescription state changes call `sendNotification` to fan out in-app + FCM messages.
7. **The right Firestore collections + rules + indexes** so the app's direct reads (e.g. listening to their own order) return the right data and deny everything else.

A one-line summary of every function lives in `BACKEND_FUNCTIONS_CONTRACT.md`.

---

## 3. Order of backend implementation

This is the recommended build order. Each step is shippable on its own and unblocks a chunk of mobile work. Exact function names match `BACKEND_FUNCTIONS_CONTRACT.md`.

### Step 0 — Project plumbing (day 1)
- Region pin: all new Functions + Firestore in `asia-south1`.
- Add App Check config: reCAPTCHA v3 (web), Play Integrity (Android), App Attest (iOS). Deploy in **warn-only** mode first.
- Enable Firestore offline persistence reviewer-facing settings (no mobile side-effect; web is unchanged).
- Add an `auditLogs/{autoId}` collection used by admin actions (role changes, verifications) — server-only writes.

### Step 1 — Identity (unblocks: Auth screens, Profile)
- `onUserCreate` — Auth trigger writing the default `users/{uid}` doc.
- `setUserRole` — callable. Writes **both** custom claims and `users/{uid}.roles[]` mirror (D-009 Phase A).
- `registerFcmToken` — callable. Dedupes tokens across uids.

### Step 2 — Places proxy (unblocks: location permission flow, address picker, home map)
- Set `functions:config:set places.key=<GOOGLE_API_KEY>`.
- `placesSearch`, `placeDetails`, `geocode`, `reverseGeocode` callables.
- Per-uid rate limit (30/min). App Check enforced.

### Step 3 — Catalog + search (unblocks: Home, Store detail, Search tab)
- Seed `medicines/` with 100–200 canonical items (we can script this separately).
- Add a Firestore trigger that maintains `searchTokens[]` on `medicines` and `stores/{id}/inventory/{sku}` writes (D-013).
- `nearbyStores` callable. Use geohash prefix query on `stores.location.geohash`.
- `searchMedicines` callable. Joins canonical medicine + nearby inventory.

### Step 4 — Cart + order creation (unblocks: Cart modal, Checkout)
- `computeCartTotal` callable. Server computes totals and returns a signed `cartHash`.
- `createOrder` callable. Transactionally reserves inventory, validates Rx gate (see step 5 first!), writes `orders/{id}` + `orders/{id}/events/`.
- `cancelOrder`, `updateOrderStatus`, and the `onOrderStateChange` trigger that fans notifications.

### Step 5 — Prescription flow (parallelizable with step 4 — finish this BEFORE `createOrder` is called in anger)
- `uploadPrescription` callable — creates the doc in `pending` and returns signed upload URLs for `prescriptions/{uid}/{id}/pages/*`.
- `reviewPrescription` callable — the existing web portal gets a new "pending prescriptions" queue.
- `expirePrescriptions` scheduled (hourly).
- `onPrescriptionCreate`, `onPrescriptionStateChange` Firestore triggers.

### Step 6 — Payments (Razorpay — D-010)
- Razorpay account + webhook URL allowlist.
- `createPaymentOrder` callable.
- `paymentsWebhook` HTTP with HMAC verification (**mandatory**).
- `verifyPaymentClient` callable (app-initiated fallback).
- `refundPayment` callable (admin + store admin).
- `reconcilePayments` scheduled (every 15 min) — resolves payments stuck in `created`.

### Step 7 — Notifications + support
- `sendNotification` internal function (used by triggers).
- `createSupportTicket`, `postSupportMessage`, `closeSupportTicket` callables.

### Step 8 — Housekeeping + Phase 2 stubs
- `expireStaleCarts`, `releaseStaleReservations`, `recomputePopularity`, `rotateFcmTokens` (scheduled).
- `assignDelivery` / `markDelivered` callable stubs so MVP can mark orders delivered manually from the store admin web portal until the driver app ships in Phase 2.

---

## 4. Which functions should be **stubbed** first

"Stub" = returns the contract-correct response shape with fake data, no side effects. Stubs let the mobile team wire up screens against real endpoints before the real logic is written. Lock the payload shapes; make the bodies return placeholder data.

**Stub on day 1 (unblocks mobile screens immediately):**
- `nearbyStores`, `searchMedicines`
- `placesSearch`, `placeDetails`, `geocode`, `reverseGeocode`
- `computeCartTotal` (return a plausible total)
- `registerFcmToken`
- `createSupportTicket`, `postSupportMessage`

These nine stubs unblock ~70% of the mobile app's visual scaffolding.

---

## 5. Which functions need **real logic** before the UI can work

Stubs are fine for discovery + cosmetics. These must be real before the matching screen can honestly work:

| Function | Why it can't be stubbed |
|---|---|
| `onUserCreate` | Sign-up is broken until `users/{uid}` actually exists — the app reads profile on sign-in. |
| `setUserRole` | Admin granting a store-admin role is real data; stubs leave the system unusable for store staff. |
| `uploadPrescription` | The whole file has to land in Storage and the Firestore doc has to exist for the review queue to show it. |
| `reviewPrescription` | Without this, nothing gets approved and no Rx order ever completes. |
| `createOrder` | Inventory must actually reserve, Rx gate must actually enforce, cart hash must actually match — this is the safety critical path. |
| `createPaymentOrder` + `paymentsWebhook` + `verifyPaymentClient` | Real money. Stubs here would produce money-loss bugs. |
| `refundPayment` | Same reason. |
| All Firestore rules for `orders`, `payments`, `prescriptions`, `deliveries`, `notifications` | Rules are binary — they're either enforcing or leaking. |

---

## 6. What the mobile app can temporarily mock

While the above real-logic items are being built, the mobile app is allowed to mock:

- **Static demo data** for nearby stores, store detail, product list, categories — as long as the shape matches the stub's response. Wire up the real calls behind a feature flag.
- **Delivery map** — show the ordered store → customer line with a fake moving pin until `updateDeliveryLocation` is wired up in Phase 2.
- **Prescription "pending" status** — in local UI while `reviewPrescription` is still being built. Never mock "approved" locally; that would let someone fake past the Rx gate.
- **Notification inbox** — may display canned entries on first launch until `sendNotification` is wired.
- **Support chat** — canned "a representative will respond" response, locally, until real ticket plumbing exists.

Mocks must be behind a single `src/services/*` wrapper that gets replaced with real callable invocations — no scattered `if (__DEV__)` branches throughout screens.

---

## 7. What **cannot** be mocked for production

These must be real by the time the app is in the hands of a real user:

1. **Auth + email verification** (Firebase Auth does this for free; just don't turn it off).
2. **Role and permission checks** — custom claims live in the token; there's no "pretend it's true" path in production.
3. **Prescription approval.** Never allow a prescription to show as "approved" unless `reviewPrescription` wrote that state.
4. **Order totals.** The client's total must always be what `computeCartTotal` returned. Never trust a client-computed number.
5. **Payment state.** Must come from `paymentsWebhook` or `verifyPaymentClient`. Never from the app alone.
6. **Inventory reservation + stock.** Never decrement stock client-side; always via `createOrder`.
7. **Rx gate in `createOrder`.** The gate is legal + safety critical.
8. **App Check enforcement** at launch.
9. **Real Google API keys** restricted to each platform bundle / origin, with Places calls routed exclusively through the proxy functions — never the app.

---

## 8. Final checklist for backend readiness

Tick every box before the mobile team begins wiring real endpoints.

**Plumbing**
- [ ] `functions/` package deployable to `asia-south1` with CI.
- [ ] Razorpay account + keys in Functions config (`razorpay.key`, `razorpay.secret`, `razorpay.webhook_secret`).
- [ ] Google API key in Functions config (`places.key`), restricted in GCP console.
- [ ] App Check configured in **warn-only** for web + iOS + Android.

**Rules + schema**
- [ ] New collections listed in `FIRESTORE_SCHEMA_CONTRACT.md` exist in code paths (at minimum, write a smoke test doc).
- [ ] Rules proposed in `FIREBASE_RULES_PROPOSAL.md` merged into `firestore.rules` (by the website team, not mobile) and passing the existing rules tests.
- [ ] Storage rule for `prescriptions/{uid}/{id}/pages/*` merged.
- [ ] Composite indexes from the "quick list" deployed.

**Callables stubbed (contract-correct responses)**
- [ ] `nearbyStores`, `searchMedicines`
- [ ] `placesSearch`, `placeDetails`, `geocode`, `reverseGeocode`
- [ ] `computeCartTotal`
- [ ] `registerFcmToken`
- [ ] `createSupportTicket`, `postSupportMessage`, `closeSupportTicket`

**Callables with real logic**
- [ ] `onUserCreate` trigger
- [ ] `setUserRole` (custom claims + mirror)
- [ ] `uploadPrescription`
- [ ] `reviewPrescription`
- [ ] `createOrder` (transactional, Rx gate, stock reservation, cartHash verify)
- [ ] `cancelOrder`
- [ ] `updateOrderStatus`
- [ ] `createPaymentOrder`
- [ ] `paymentsWebhook` (HMAC verified)
- [ ] `verifyPaymentClient`
- [ ] `refundPayment`
- [ ] `sendNotification`

**Triggers + scheduled**
- [ ] `onPrescriptionCreate`, `onPrescriptionStateChange`, `onOrderStateChange`
- [ ] `expirePrescriptions` (hourly)
- [ ] `reconcilePayments` (every 15 min)
- [ ] `releaseStaleReservations` (every 5 min)
- [ ] `expireStaleCarts` (daily)
- [ ] `rotateFcmTokens` (weekly)
- [ ] `recomputePopularity` (daily)

**Observability**
- [ ] Cloud Logging structured logs for every callable (uid, function, latency, errorCode).
- [ ] Alert on: `paymentsWebhook` signature failures > 0, `createOrder` aborted-retry rate > 5%, `reviewPrescription` latency SLA.
- [ ] Dashboards: orders/hour, Rx review backlog, payment capture rate.

**Data**
- [ ] Seed `medicines/` with an initial catalog (script provided separately).
- [ ] At least one verified `stores/{id}` with `serviceArea` + `geohash` set.
- [ ] At least one store member user with the `storeAdmin` claim granted via `setUserRole`.

**Security sign-off**
- [ ] `security-compliance-reviewer` run on the Rx + payment + order flows before turning App Check to enforce.
- [ ] `serviceAccountKey.json` rotated; secret `.env` files gitignored and purged from history (coordinate with the website team — still flagged).

When every box above is ticked, mobile can stop mocking and the app can be cut for a closed-beta build.
