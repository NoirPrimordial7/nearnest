# Architecture Decisions Log

Append-only. Each decision gets a stable ID (`D-NNN`). Never silently edit prior decisions — supersede them with a new entry.

---

## D-001 — Website stays at repo root (for now)
**Date:** 2026-04-24
**Status:** Accepted
**Context:** The web portal currently lives directly at the repo root (`src/`, `public/`, `functions/`, `firebase.json`, etc.). Moving it to `apps/web/` would touch every relative path and risk breaking the active website team's work.
**Decision:** Keep the web portal at the repo root. Do **not** move it into `apps/web/` until the website team explicitly requests it.
**Consequence:** The mobile app will live in `apps/mobile/` while the web app remains at root — a mixed monorepo-ish layout. This is intentional and temporary.

---

## D-002 — Mobile app lives in `apps/mobile/` using React Native + Expo
**Date:** 2026-04-24
**Status:** Accepted
**Context:** Need a single-codebase mobile app for iOS + Android, with quick iteration and OTA updates.
**Decision:** Use **React Native via Expo (managed workflow)** with **EAS Build** for production binaries. All mobile code lives under `apps/mobile/`.
**Consequence:** Scaffolding (`expo init`) is deferred until the user explicitly says go. Expo managed workflow means no bare native modules unless strictly needed.

---

## D-003 — Firebase is the shared backend for web and mobile
**Date:** 2026-04-24
**Status:** Accepted
**Context:** The web portal already runs on Firebase (Auth, Firestore, Storage, Functions, Data Connect scaffolded). A separate backend would double the ops surface.
**Decision:** Mobile app uses the **same Firebase project** as the web portal. No separate API server.
**Consequence:** All security rules, indexes, and Cloud Functions are shared. Changes to Firestore/Storage rules must consider both clients.

---

## D-004 — Firestore is the MVP database
**Date:** 2026-04-24
**Status:** Accepted
**Context:** Data Connect (Postgres-backed) is scaffolded but empty. Shipping a relational layer adds ops complexity for MVP.
**Decision:** **Firestore is the primary datastore for MVP.** Data Connect adoption is deferred and will be revisited after launch for analytics/reporting workloads.
**Consequence:** Designs must accept Firestore's constraints (no joins, indexed queries, denormalization). Revisit when MVP is in users' hands.

---

## D-005 — All protected logic goes through Cloud Functions
**Date:** 2026-04-24
**Status:** Accepted
**Context:** Orders, payments, prescription approvals, role changes, and status transitions must be auditable and tamper-resistant.
**Decision:** **Orders, payments, prescription approval, role changes, delivery state, and all admin actions are handled exclusively by Cloud Functions.** Clients may read via Firestore but must not write to these collections directly — security rules will reject direct writes.
**Consequence:** The `functions/` codebase will grow significantly. Client code (web + mobile) calls callable/HTTPS functions, not Firestore, for these flows. Functions enforce role + business rule checks in addition to rules.

---

## D-006 — Prescription-required medicines cannot be delivered without approval
**Date:** 2026-04-24
**Status:** Accepted
**Context:** Legal and safety requirement for Rx medicines.
**Decision:** A medicine flagged `requiresPrescription: true` cannot be included in an order that is transitioned past `paid` unless **every** such item references a `prescriptions/{id}` document with `state: 'approved'`, approved by a store admin or global admin, and tied to the ordering user.
**Consequence:**
- Client UI must show the prescription gate clearly (see `docs/DESIGN_SYSTEM.md` warning pattern).
- `createOrder` and `updateOrderStatus` Cloud Functions enforce the gate; the client cannot bypass it.
- Every approval/rejection writes an audit entry (actor uid + timestamp + optional notes).

---

## D-007 — Navigation: use `expo-router`
**Date:** 2026-04-24
**Status:** Accepted
**Supersedes:** open question from `MOBILE_APP_PLAN.md` §8.1 (1)
**Context:** Mobile app needs 5 bottom tabs, per-tab stacks, several modal flows (cart, checkout, address picker, prescription attach), and a `nearnest://` deep-link scheme. React Navigation v7 and expo-router are the two realistic choices.
**Decision:** Use **expo-router** (current major) for navigation. Modal groups, typed params, and automatic linking are first-class.
**Why this is best for the MVP:** File-based routing maps 1:1 to the screen list in `MOBILE_APP_PLAN.md` §3, halves navigation boilerplate, gives deep links almost for free, and is officially supported + tested by the Expo team. Because expo-router sits on React Navigation, any low-level escape hatch is still available.
**Impact on mobile:** Routes live under `apps/mobile/app/` as folders + files. `(tabs)/`, `(modal)/`, and `[param]` segments express the structure from §3. Universal/App Links land cheaply when we want them.
**Impact on web/backend:** None.
**Risks:** expo-router ships rapid minor versions; occasional breaking changes; some gesture/perf edge cases need React Navigation APIs underneath. Typed-routes DX requires experimental flags on older versions.
**Fallback:** React Navigation v7 with a hand-rolled linking config — adoptable at any time since expo-router is a thin layer on top.

---

## D-008 — Firebase client on mobile: Firebase JS SDK (+ `expo-notifications`)
**Date:** 2026-04-24
**Status:** Accepted
**Supersedes:** open question from `MOBILE_APP_PLAN.md` §8.1 (2)
**Context:** Two realistic options for Firebase on RN: the Firebase JS SDK (same one the web portal uses today) or `@react-native-firebase` (native modules).
**Decision:** Use the **Firebase JS SDK** (`firebase` v12, modular imports) for Auth, Firestore, Storage, and Functions. Use **`expo-notifications`** for FCM (with EAS credential setup for APNs + FCM server key).
**Why this is best for the MVP:**
- Keeps the managed-workflow developer loop (`expo go` for prototypes, no dev-client churn).
- Exact API parity with the already-running web portal — auth context, Firestore queries, and helpers can be shared in shape (not code) between clients.
- Smaller config surface for CI/EAS builds.
- Tree-shakeable v9 modular imports keep bundle size acceptable.
**Impact on mobile:** `apps/mobile/services/firebase.ts` mirrors `src/lib/firebase.js`; `services/fcm.ts` wraps `expo-notifications`. No prebuild / bare workflow needed for MVP.
**Impact on web/backend:** None. Cloud Functions remain the single source of truth for protected writes either way.
**Risks:**
- FCM background delivery + notification categories need careful Expo config; iOS APNs setup is done through EAS.
- Firestore offline persistence on RN via the JS SDK is less battle-tested than RNFirebase's.
**Fallback:** Switch to `@react-native-firebase` (with an Expo Dev Client) if (a) we hit an unresolvable background-notification issue on iOS, or (b) offline persistence proves unreliable at scale. The services layer abstracts the swap.

---

## D-009 — Roles: migrate to Firebase Auth custom claims (hybrid during rollout)
**Date:** 2026-04-24
**Status:** Accepted
**Supersedes:** open question from `MOBILE_APP_PLAN.md` §8.1 (3)
**Context:** Today roles live in `users/{uid}.roles[]`; every rule `get()`s the user doc. That is slow, costs a read per rule eval, and is mutable from any client that can write the doc.
**Decision:** Make **Firebase Auth custom claims** the canonical role source. Keep `users/{uid}.roles[]` as a **display mirror** during transition. Rollout in three phases:
1. **Phase A (immediate).** Introduce `setUserRole` callable Cloud Function. Admin-only. Writes custom claims **and** mirrors to `users/{uid}.roles[]`. All *new* rules (for `orders`, `payments`, `deliveries`, `prescriptions`, `inventory`, `medicines`, `carts`, `notifications`) reference token claims: `request.auth.token.role in ['admin','verifier','storeAdmin']` — no Firestore `get()`.
2. **Phase B (during mobile MVP build).** Website team rewrites *existing* rules (for `users`, `stores`, `stores/*/documents`, `stores/*/verificationLogs`) to prefer token claims with a fallback to the legacy roles array. Clients call `await user.getIdToken(true)` after any role change.
3. **Phase C (post-MVP).** Remove fallback reads. `users.roles[]` becomes read-only display data, written only by `setUserRole`.
**Why this is best for the MVP:** Avoids breaking the live web portal while unblocking cheaper, tamper-proof rules for the new mobile collections. Rule eval cost drops by 1 `get()` per access.
**Impact on mobile:** On sign-in and after sensitive actions, call `getIdTokenResult(true)`. Services layer exposes `useRole()` that reads from the parsed token.
**Impact on web/backend:** New `setUserRole` function; staged rule rewrites by the website team; admin UI should refresh the admin's own token after changing someone else's role.
**Risks:** Claim propagation can lag up to ~1 hour unless the client forces a refresh. Mitigation: always `getIdToken(true)` post-change, and display a "your permissions may take a moment to update" hint on the admin tool.
**Fallback:** Keep `users.roles[]` canonical and add a Cloud Function reconciliation pass. Loses the cost/tamper-proof benefit but remains functional.

---

## D-010 — Payment provider for India MVP: Razorpay
**Date:** 2026-04-24
**Status:** Accepted
**Supersedes:** open question from `MOBILE_APP_PLAN.md` §8.1 (4)
**Context:** MVP needs UPI + card + netbanking + wallet + optional COD, with strong RN SDK support and a straightforward webhook model.
**Decision:** **Razorpay** as primary payment provider. Cashfree held as a Phase-2 fallback if KYC / MCC / pricing becomes a blocker.
**Why this is best for the MVP:**
- First-class RN SDK (`react-native-razorpay`) and a WebView Checkout fallback that works in strictly-managed Expo.
- Full India coverage (UPI intent + collect, RuPay, netbanking, wallets) without stitching providers.
- HMAC-SHA256 signature verification on webhooks is well-documented and simple to implement in `functions/`.
- Standard Razorpay Route is available later if we need split settlements to stores (Phase 2).
- Team familiarity reduces integration risk for the website team who will own the Functions.
**Impact on mobile:** `createPaymentOrder` callable returns a Razorpay `orderId` + key; the app opens the Razorpay checkout sheet (native SDK or WebView). On success, the webhook is the source of truth; the client calls `verifyPaymentClient` purely for UI immediacy.
**Impact on web/backend:** `createPaymentOrder`, `paymentsWebhook` (HMAC-verified), `refundPayment` in `functions/`. `payments/` schema fields (`providerOrderId`, `providerPaymentId`) align with Razorpay's order/payment pair. Webhook URL must be allowlisted in Razorpay dashboard.
**Risks:**
- Pharmacy MCC category can trigger additional KYC / compliance checks.
- Single-provider downtime halts checkout — acceptable for MVP given engineering cost of multi-provider.
- T+1 settlement is standard; cash-flow planning needs to account for that.
**Fallback:** **Cashfree** (similar integration model, competitive UPI rates). Abstract the provider behind a `payments` service so the swap is internal.

---

## D-011 — Places + Maps proxy: same `functions/` codebase, rate-limited per uid
**Date:** 2026-04-24
**Status:** Accepted
**Supersedes:** open question from `MOBILE_APP_PLAN.md` §8.1 (5)
**Context:** Mobile must not ship Google Places API keys on device. The web already uses `@googlemaps/js-api-loader` with a browser-restricted key. We need a proxy for Places Autocomplete, Place Details, Geocode, and Reverse Geocode.
**Decision:** Host `placesSearch`, `placeDetails`, `geocode`, `reverseGeocode` **as callable Cloud Functions inside the existing single `functions/` codebase**, in a dedicated module (e.g. `functions/places.js`). Enforce **App Check** and a **per-uid token-bucket rate limit** on each.
**Why this is best for the MVP:** One deploy target, one CI, one IAM surface. Keeps Places server-key off every device. Splitting into a second codebase adds operational overhead we don't need yet.
**Impact on mobile:** `services/places.ts` wraps the four callables. No Google key in the Expo app. `react-native-maps` uses its own per-platform Maps rendering key, restricted to each bundle ID (keys for rendering only, not Places).
**Impact on web/backend:** Optional future migration of `src/utils/places.js` to call the same proxy (website team decides; not required for MVP). Rate-limit state may live in Firestore or Memorystore — MVP uses a Firestore-backed token bucket.
**Risks:** A single codebase fault affects both order flow and Places. Mitigations: separate function concurrency settings, unit tests on the proxy, and per-function min-instances so cold starts don't compound.
**Fallback:** Multi-codebase deploy (`firebase.json` supports it) with a dedicated `functions-proxy/` codebase if contention or scale-out pushes us there.

---

## D-012 — Data Connect stays deferred past MVP
**Date:** 2026-04-24
**Status:** Accepted
**Supersedes:** open question from `MOBILE_APP_PLAN.md` §8.1 (6); refines D-004
**Context:** `dataconnect/` is scaffolded but unused. Adopting a Postgres-backed relational layer for MVP would double the data plane with no feature payoff.
**Decision:** **Do not adopt Data Connect for MVP.** Re-evaluate **3 months post-launch** or when a reporting / analytics need appears that Firestore cannot serve efficiently.
**Why this is best for the MVP:** Firestore covers all MVP flows (transactional order creation, geohash nearby, status streams, subcollection audit). Data Connect's strengths (joins, integrity, analytics SQL) aren't on the MVP critical path.
**Impact on mobile:** None — app uses Firebase JS SDK → Firestore.
**Impact on web/backend:** Keep `dataconnect/` scaffolded; do not grow its schema. When post-MVP needs arrive, prefer backfilling Firestore → Data Connect (or BigQuery) via a scheduled Cloud Function export, rather than migrating live writes.
**Risks:** Denormalization debt accumulates in Firestore (order history reports, per-store analytics). Mitigation: record each denormalization in `ARCHITECTURE.md` as it happens.
**Fallback:** Adopt Data Connect earlier if we hit a concrete Firestore limit (e.g. join-heavy support dashboard) that can't be worked around with indexes or subcollections.

---

## D-013 — Search backend for MVP: Firestore `searchTokens[]` behind a proxy
**Date:** 2026-04-24
**Status:** Accepted
**Supersedes:** open question from `MOBILE_APP_PLAN.md` §8.1 (7)
**Context:** Medicine search must return ranked nearby in-stock stores for a typed query. Third-party search (Algolia / Typesense) adds cost and ops; pure Firestore has limitations.
**Decision:** **Firestore prefix index via a `searchTokens[]` array** for MVP. Clients never query the index directly — they call the **`searchMedicines` callable Cloud Function** which composes the Firestore query, joins to nearby stores' `inventory`, and ranks results. The client-facing contract is backend-agnostic so we can swap the engine later.
**Why this is best for the MVP:** Zero new infrastructure and zero recurring cost. Works well for the launch catalog (a few thousand SKUs per store, ~20–30k canonical medicines). Prefix + starts-with covers the majority of real queries ("dolo", "paracetamol", "crocin").
**Concretely:** On writes to `medicines/{id}` and `stores/{storeId}/inventory/{sku}`, a Firestore trigger generates `searchTokens[]` = lowercased prefixes of name + aliases + salt (length-capped to keep write size bounded). Queries use `where('searchTokens', 'array-contains', q.toLowerCase())` plus an `isActive` filter and a store-location join.
**Impact on mobile:** No direct Firestore search query from the app. `services/search.ts` wraps only `searchMedicines`. Swapping the backend is a Cloud Function change, not a mobile release.
**Impact on web/backend:** New trigger to maintain `searchTokens[]`; `searchMedicines` aggregator; index on `(searchTokens, isActive)`.
**Risks:** No typo tolerance, no synonym expansion, limited relevance signals beyond popularity + distance. Performance degrades past ~50k docs or many-token queries.
**Fallback:** **Typesense** (self-hosted on a small GCE VM, ~$20/mo) as the first upgrade for typo tolerance and better ranking. **Algolia** if we decide to pay for a managed tier with richer relevance.

---

## D-014 — Prescription scope for MVP: per-store
**Date:** 2026-04-24
**Status:** Accepted
**Supersedes:** open question from `MOBILE_APP_PLAN.md` §8.1 (8); refines D-006
**Context:** When a user uploads a prescription, does it bind to a single store, or can any participating store fulfil it?
**Decision:** **Per-store scope for MVP.** A `prescriptions/{id}` document carries a required `storeId`, is reviewed by that store's pharmacist, and is only valid for orders placed at that store. Phase 2 may add an admin-certified "cross-store verified" variant.
**Why this is best for the MVP:**
- Aligns with Indian Schedule-H expectations — the dispensing pharmacist reviews what they dispense.
- Minimizes PII surface: a given prescription is visible only to its owner + one store's reviewers.
- Avoids conflict-of-interest between competing stores reviewing each other's liability.
- Simpler rules, simpler audit trail, simpler UI (no "which store is this valid for?" ambiguity).
**Impact on mobile:** When a user adds an Rx item at a different store, UX offers **"Re-submit this prescription for review at {newStore}"** — same file(s), new doc, new pending queue at the new store. This keeps the trust model clean while saving the user from re-scanning.
**Impact on web/backend:** `prescriptions.storeId` is required; `reviewPrescription` scoped to members of that store; rules enforce. Storage path keeps the user's scan under `prescriptions/{uid}/...` so the file is reusable across reviews.
**Risks:** Friction for chronic-condition users who rotate stores. Mitigation: the "re-submit to new store" one-tap flow + a Phase 2 cross-store verified flag gated on an admin-doctor review.
**Fallback:** Cross-store scope, gated behind admin approval and a stricter review path, to be designed in Phase 2 after legal sign-off.

---
