# Nearnest — Backend Cloud Functions Contract (MVP)

_Target audience: the website / backend team implementing `functions/`. Mobile will build against this contract._

**Decisions this contract is bound by:** D-005 (all protected logic in Cloud Functions), D-006 (Rx gate), D-009 (custom claims), D-010 (Razorpay), D-011 (Places in same codebase), D-013 (Firestore search), D-014 (per-store Rx).

**Conventions**
- All callables use `region: asia-south1` (matches Firestore).
- All callables enforce **App Check** in prod (`context.app` required post-MVP; warn-only during early dev).
- Role checks read **Firebase Auth custom claims** (`context.auth.token.role`) per D-009. Fallback to `users/{uid}.roles[]` during Phase A/B rollout.
- Timestamps are `admin.firestore.FieldValue.serverTimestamp()` unless noted.
- Money is stored in **minor units** (paise) as integers. Currency default `INR`.
- Error contract: throw `functions.https.HttpsError(code, message, details?)`. Codes used in this doc: `unauthenticated`, `permission-denied`, `invalid-argument`, `failed-precondition`, `not-found`, `already-exists`, `resource-exhausted`, `aborted`, `internal`, `unavailable`.
- Idempotency: every side-effectful callable accepts an optional `clientRequestId: string`. The function dedupes via a `functionRuns/{clientRequestId}` guard doc with a 24h TTL.
- Rate limits: per-uid token bucket stored in `rateLimits/{uid}_{fn}`; default 60 requests/min unless noted.

**State machines**
- Order: `pending → paid → preparing → ready_for_pickup → out_for_delivery → delivered` with branches `cancelled` (any pre-`preparing`), `cancelled_no_payment` (15-min hold expired), `out_of_stock` (manual, any pre-`out_for_delivery`), `refunded` (post-`paid`).
- Prescription: `pending → approved | rejected | expired`.
- Payment: `created → captured | failed → refunded | partial_refund`.
- Delivery: `unassigned → assigned → picked_up → out_for_delivery → delivered | failed`.

---

## 1. Identity & roles

### 1.1 `onUserCreate`
- **Type:** Auth trigger (`functions.auth.user().onCreate`)
- **Purpose:** Initialise `users/{uid}` the first time a Firebase Auth user is created.
- **Caller:** Firebase Auth (system).
- **Auth req:** N/A (trigger).
- **Role:** N/A.
- **Payload:** `UserRecord` from Firebase.
- **Response:** N/A.
- **Validation:** Skip if `users/{uid}` already exists (idempotent).
- **Firestore reads:** `users/{uid}` (existence check).
- **Firestore writes:** `users/{uid}` with `{ email, emailVerified, displayName, photoUrl, roles:['user'], permissions:[], preferences:{...defaults}, createdAt, updatedAt }`.
- **Storage:** none.
- **Notifications:** none.
- **Errors:** log + swallow (do not throw — would retry forever).
- **Security:** set default role `user` only; admin/verifier/storeAdmin/support never granted here.
- **MVP.**

### 1.2 `setUserRole`
- **Type:** Callable.
- **Purpose:** Grant / revoke roles; canonical writer for **custom claims** (D-009 Phase A).
- **Caller:** Web admin UI (MVP) and future admin mobile surface.
- **Auth req:** Signed-in.
- **Role:** `admin` only.
- **Request:** `{ uid: string, role: 'user'|'storeAdmin'|'admin'|'verifier'|'support', grant: boolean, clientRequestId?: string }`
- **Response:** `{ uid, roles: string[], updatedAt }`
- **Validation:** `uid` must exist in Auth; cannot self-revoke last `admin` (check live admin count).
- **Firestore reads:** `users/{uid}`; `users` where `roles array-contains 'admin'` (for last-admin guard).
- **Firestore writes:** `users/{uid}.roles` (mirror) + an audit doc `auditLogs/{autoId}` (`actorUid`, `targetUid`, `change`, `ts`).
- **Auth side-effects:** `admin.auth().setCustomUserClaims(uid, { role })`. Caller's token does not refresh automatically — mobile must call `getIdToken(true)` after successful admin action on self.
- **Storage:** none.
- **Notifications:** in-app to target uid ("Your permissions were updated").
- **Errors:** `permission-denied`, `not-found`, `failed-precondition` (last-admin), `invalid-argument`.
- **Security:** validates caller claim first; admin actions logged with actor uid.
- **MVP.**

---

## 2. Discovery

### 2.1 `nearbyStores`
- **Type:** Callable.
- **Purpose:** Return stores within `radiusKm` of a point, filtered by `isVerified` and optional open-now.
- **Caller:** Mobile app (Home + address picker).
- **Auth req:** Signed-in.
- **Role:** any.
- **Request:** `{ location:{lat,lng}, radiusKm:number=5, filters?:{ openNow?:bool, categoryTags?:string[] } }`
- **Response:** `{ stores: Array<{ id, name, distanceKm, etaMinutes, rating, isOpen, imageUrl, capabilities }> }` — max 50.
- **Validation:** `radiusKm` ≤ 25; `location` in India bbox (sanity clamp).
- **Firestore reads:** geohash-prefix query on `stores` + single-doc fetches for enrichment. Budget ≤ 1 read / returned store.
- **Firestore writes:** none.
- **Storage:** none.
- **Notifications:** none.
- **Errors:** `invalid-argument`.
- **Security:** distance computed server-side; client `location` accepted but result respects `stores.serviceArea` contains query point.
- **MVP.**

### 2.2 `searchMedicines`
- **Type:** Callable.
- **Purpose:** Search by brand / salt and return canonical medicine + ranked nearby in-stock stores. See D-013.
- **Caller:** Mobile app (Search tab).
- **Auth req:** Signed-in.
- **Role:** any.
- **Request:** `{ q: string, location?:{lat,lng}, radiusKm?:number=5, filters?:{ rxOnly?:bool, otcOnly?:bool, maxPrice?:int }, sort?:'nearest'|'fastest'|'cheapest' }`
- **Response:** `{ items: Array<{ medicine:{id,name,salt,form,strength,imageUrl,requiresPrescription}, availability: Array<{ storeId, sku, price, stock, distanceKm, etaMinutes }> }> }` — max 20 medicines, max 5 availability rows each.
- **Validation:** `q.length ≥ 2`; lowercased server-side.
- **Firestore reads:** `medicines where searchTokens array-contains q_lower` → for each, `collectionGroup('inventory') where medicineId == id and isActive == true` joined with nearby stores.
- **Firestore writes:** optional `searchQueries/{uid}_{date}` analytics (best-effort).
- **Storage:** none.
- **Notifications:** none.
- **Errors:** `invalid-argument`, `resource-exhausted` (rate limit).
- **Security:** result restricted to verified stores in service area.
- **MVP.**

---

## 3. Places & Maps proxy (D-011)

All four share: callable, signed-in, any role, App Check enforced, per-uid rate limit 30/min, result cached 60s keyed by request hash.

### 3.1 `placesSearch`
- **Request:** `{ q:string, location?:{lat,lng}, sessionToken?:string }`
- **Response:** `{ predictions: Array<{ placeId, description, primaryText, secondaryText, distanceMeters? }> }`
- **Errors:** `invalid-argument`, `unavailable` (upstream), `resource-exhausted`.
- **MVP.**

### 3.2 `placeDetails`
- **Request:** `{ placeId:string, sessionToken?:string }`
- **Response:** `{ placeId, name, formattedAddress, location:{lat,lng}, components:{...}, types:string[] }`
- **MVP.**

### 3.3 `geocode`
- **Request:** `{ address:string }` → **Response:** `{ matches: Array<{ formattedAddress, location:{lat,lng}, placeId }> }`
- **MVP.**

### 3.4 `reverseGeocode`
- **Request:** `{ location:{lat,lng} }` → **Response:** `{ address, components:{...}, placeId }`
- **MVP.**

**Security (all four):** Google API key lives only in Functions config (`functions:config:set places.key=...`); never returned to client. Requests logged without PII for rate-limit accounting.

---

## 4. Prescription lifecycle (D-006, D-014)

### 4.1 `uploadPrescription`
- **Type:** Callable.
- **Purpose:** Create `prescriptions/{id}` in `pending` state and return signed upload URLs for the user to PUT page files to Storage.
- **Caller:** Mobile app.
- **Auth req:** Signed-in + email-verified.
- **Role:** any.
- **Request:** `{ storeId:string, pagesCount:int(1..10), medicineIds:string[], doctor?:{name?,regNo?,clinic?}, issuedAt?:ts, clientRequestId?:string }`
- **Response:** `{ prescriptionId, uploadUrls: Array<{ page:int, url:string, expiresAt:ts }> }` (signed 15-min PUTs to `prescriptions/{uid}/{id}/pages/{n}.jpg|pdf`).
- **Validation:** storeId exists + `isVerified==true` + `capabilities.rxAccepted==true`; `medicineIds` non-empty; each resolves to a medicine with `requiresPrescription==true`; `pagesCount` ≤ 10.
- **Firestore reads:** `stores/{storeId}`, `medicines/{id}` × N.
- **Firestore writes:** `prescriptions/{id}` (`ownerUid`, `storeId`, `state:'pending'`, `pagesCount`, `storagePathPrefix`, `doctor?`, `issuedAt?`, `expiresAt` (+90 days), `coversMedicineIds=[]`, `linkedOrderIds:[]`, `createdAt`, `updatedAt`).
- **Storage:** signed-URL grants write only on the matching prefix.
- **Notifications:** none yet (on successful upload, `onPrescriptionCreate` fires).
- **Errors:** `unauthenticated`, `failed-precondition` (email unverified / store doesn't accept Rx), `invalid-argument`.
- **Security:** signed URLs are single-purpose + short-lived; Storage rules still deny anyone else.
- **MVP.**

### 4.2 `reviewPrescription`
- **Type:** Callable.
- **Purpose:** Approve or reject a prescription for a given store.
- **Caller:** Web store-admin portal (MVP); mobile Phase 2.
- **Auth req:** Signed-in.
- **Role:** member of the prescription's `storeId` (owner/members) OR `admin`.
- **Request:** `{ prescriptionId:string, decision:'approve'|'reject', coversMedicineIds?:string[], notes?:string, clientRequestId?:string }`
- **Response:** `{ prescriptionId, state, reviewedByUid, reviewedAt }`
- **Validation:** doc exists + state == `pending`; if approve, `coversMedicineIds` ⊆ original `medicineIds`.
- **Firestore reads:** `prescriptions/{id}`, `stores/{storeId}` (membership).
- **Firestore writes:** `prescriptions/{id}` (`state`, `reviewedByUid`, `reviewedAt`, `notes`, `coversMedicineIds`); audit entry to `stores/{storeId}/verificationLogs` (reuse existing pattern).
- **Storage:** none.
- **Notifications:** trigger `onPrescriptionStateChange` → FCM to owner.
- **Errors:** `permission-denied`, `not-found`, `failed-precondition` (wrong state), `invalid-argument`.
- **Security:** state is the client-untrusted field — only this function writes it.
- **MVP.**

### 4.3 `expirePrescriptions`
- **Type:** Scheduled (`every 60 minutes`).
- **Purpose:** Move prescriptions past `expiresAt` to `expired`.
- **Caller:** scheduler.
- **Auth:** N/A.
- **Reads:** `prescriptions where state in ['pending','approved'] and expiresAt <= now` (paged).
- **Writes:** `prescriptions/{id}.state = 'expired'`.
- **Notifications:** in-app to owner for any formerly-approved ones.
- **Errors:** logged; retried on next tick.
- **MVP.**

### 4.4 `onPrescriptionCreate`
- **Type:** Firestore trigger (`onCreate prescriptions/{id}`).
- **Purpose:** Notify the store that a new Rx is awaiting review.
- **Reads:** `stores/{storeId}` members.
- **Writes:** `notifications/{uid}/items/{auto}` for each store member; calls `sendNotification` internally for FCM.
- **MVP.**

### 4.5 `onPrescriptionStateChange`
- **Type:** Firestore trigger (`onUpdate prescriptions/{id}` with state delta).
- **Purpose:** Notify owner on approve/reject/expire; relink affected carts (un-gate / re-gate).
- **Writes:** owner `notifications` + optional cart flag refresh.
- **MVP.**

---

## 5. Cart & orders

### 5.1 `computeCartTotal`
- **Type:** Callable.
- **Purpose:** Return server-canonical totals + signed `cartHash`. Client never computes totals.
- **Caller:** Mobile (cart + checkout screens).
- **Auth req:** Signed-in.
- **Role:** any.
- **Request:** `{ storeId:string, items: Array<{ sku:string, qty:int }>, addressId?:string, clientRequestId?:string }`
- **Response:** `{ subtotal:int, deliveryFee:int, packagingFee:int, taxes:int, discount:int, grandTotal:int, currency:'INR', cartHash:string, items: Array<{ sku, medicineId, qty, unitPrice, lineTotal, requiresPrescription, inStock }>, warnings?:string[] }`
- **Validation:** every `sku` lives in `stores/{storeId}/inventory`; `qty ≤ stock`; delivery fee from store or matrix; `addressId` (if given) belongs to caller and is in service area.
- **Firestore reads:** `stores/{storeId}/inventory/{sku}` × N; `stores/{storeId}`; optional `users/{uid}/addresses/{id}`.
- **Writes:** none (or optional `carts/{uid}` mirror for persistence).
- **Errors:** `not-found`, `invalid-argument`, `failed-precondition` (out of stock).
- **Security:** `cartHash` = HMAC of ordered items+prices+address with a server secret; `createOrder` rejects tampered carts.
- **MVP.**

### 5.2 `createOrder`
- **Type:** Callable.
- **Purpose:** Transactionally create `orders/{id}`, reserve inventory, validate Rx gate, prepare payment.
- **Caller:** Mobile.
- **Auth req:** Signed-in + email-verified.
- **Role:** any.
- **Request:** `{ cartHash:string, storeId:string, items, addressId:string, paymentMethod:'UPI'|'CARD'|'NETBANKING'|'WALLET'|'COD', rxLinks?: Array<{ sku:string, prescriptionId:string }>, clientRequestId?:string }`
- **Response:** `{ orderId, status:'pending', totals, payment?:{ providerOrderId, providerKeyId, amount, currency } }` — payment object present for non-COD.
- **Validation:**
  - `cartHash` matches a recomputed hash.
  - Every item with `requiresPrescription==true` has a matching `prescriptionId` in `rxLinks` where `prescription.state=='approved'` and `prescription.storeId==storeId` and `prescription.ownerUid==uid` and medicine in `prescription.coversMedicineIds`.
  - Store accepts payment method + is open (or schedules allowed).
  - Transactionally: `inventory.stock >= qty`; decrement `stock` and increment `reservedStock`.
- **Firestore reads:** `stores`, `stores/{id}/inventory/{sku}`, `prescriptions`, `users/{uid}/addresses/{id}`.
- **Writes:** `orders/{id}` (status `pending`, timestamped), `orders/{id}/events/{auto}` (`placed`), `inventory` stock/reservation, `payments/{id}` draft (non-COD), `prescriptions/{id}.linkedOrderIds += orderId`.
- **Storage:** none.
- **Notifications:** `onOrderStateChange` → store admin FCM.
- **Errors:** `invalid-argument` (bad hash), `failed-precondition` (Rx gate / stock), `aborted` (transaction retry).
- **Security:** this is the single gate for the Rx + stock + total invariants.
- **MVP.**

### 5.3 `cancelOrder`
- **Type:** Callable.
- **Purpose:** Cancel an order; release reservations; trigger refund if already paid.
- **Caller:** Mobile (owner) or web admin/store-admin.
- **Auth req:** Signed-in.
- **Role:** owner OR `storeAdmin` of order's storeId OR `admin`.
- **Request:** `{ orderId, reason?, clientRequestId? }`
- **Response:** `{ orderId, status:'cancelled'|'refunded' }`
- **Validation:** owner allowed only before `preparing`; staff allowed any pre-`delivered`.
- **Writes:** order status + event; inventory reservation release; calls `refundPayment` if paid.
- **Errors:** `permission-denied`, `failed-precondition` (too late), `not-found`.
- **MVP.**

### 5.4 `updateOrderStatus`
- **Type:** Callable.
- **Purpose:** Transition an order through the state machine.
- **Caller:** Web store admin; driver app (Phase 2).
- **Auth req:** Signed-in.
- **Role:** `storeAdmin` of store, or `admin`, or assigned `driverUid`.
- **Request:** `{ orderId, newStatus, note?, clientRequestId? }`
- **Response:** `{ orderId, status }`
- **Validation:** transition must be legal per state machine.
- **Writes:** status + event row.
- **Notifications:** `onOrderStateChange`.
- **MVP.**

### 5.5 `reorderFromOrder`
- **Type:** Callable.
- **Purpose:** Build a new cart snapshot from a past order at today's prices/stock.
- **Caller:** Mobile.
- **Auth req:** Signed-in.
- **Request:** `{ orderId }` → **Response:** same shape as `computeCartTotal` response + `missing: string[]` for unavailable items.
- **Validation:** caller owns the order.
- **Writes:** optional `carts/{uid}` overwrite.
- **Phase 2** (MVP can do client-side cart rebuild).

---

## 6. Payments (D-010, Razorpay)

### 6.1 `createPaymentOrder`
- **Type:** Callable.
- **Purpose:** Wrap Razorpay order creation; returns token for the client SDK.
- **Caller:** Mobile (after `createOrder`).
- **Auth req:** Signed-in.
- **Request:** `{ orderId, clientRequestId? }`
- **Response:** `{ providerOrderId, providerKeyId, amount, currency, paymentId }`
- **Validation:** caller owns order; order status `pending`; amount matches.
- **Writes:** `payments/{paymentId}` (`status:'created'`, `providerOrderId`, `amount`, `idempotencyKey`).
- **Errors:** `permission-denied`, `failed-precondition`, `unavailable` (provider).
- **MVP.**

### 6.2 `paymentsWebhook`
- **Type:** HTTP (signed).
- **Purpose:** Razorpay → server. Source of truth for payment state.
- **Caller:** Razorpay.
- **Auth req:** HMAC-SHA256 signature verified against `X-Razorpay-Signature` using webhook secret.
- **Request:** Razorpay event JSON (`payment.captured`, `payment.failed`, `refund.processed`, …).
- **Response:** `200` within 5s; reject with `401` on bad signature.
- **Validation:** dedupe via `payments/{id}.events` array carrying event IDs.
- **Writes:** `payments/{id}.status` + `events[]`; on `captured`, transition `orders/{orderId}.status = 'paid'` + event row.
- **Errors:** log + `500` to force provider retry.
- **Security:** secret stored in Functions config; never logged.
- **MVP.**

### 6.3 `verifyPaymentClient`
- **Type:** Callable.
- **Purpose:** UI-immediacy fallback when the app observes payment success before the webhook has landed.
- **Caller:** Mobile.
- **Request:** `{ orderId, providerPaymentId, providerSignature }`
- **Response:** `{ orderId, status }`
- **Validation:** verify HMAC of `${providerOrderId}|${providerPaymentId}` using the same secret; must match order.
- **Writes:** if verified and payment still `created`, mirror state transitions as the webhook would (idempotent).
- **Errors:** `permission-denied`, `failed-precondition`.
- **MVP.**

### 6.4 `refundPayment`
- **Type:** Callable.
- **Purpose:** Initiate a refund (full or partial).
- **Caller:** Web admin/store-admin.
- **Role:** `storeAdmin` of the order's store or `admin`.
- **Request:** `{ paymentId, amount?, reason }`
- **Response:** `{ paymentId, refundId, status }`
- **Writes:** `payments/{id}` + `orders/{id}.status = 'refunded'` when fully refunded.
- **MVP.**

### 6.5 `reconcilePayments`
- **Type:** Scheduled (`every 15 minutes`).
- **Purpose:** Resolve `payments` stuck in `created` > 15 min (release reservations, mark order `cancelled_no_payment`).
- **Writes:** bulk state transitions.
- **MVP.**

---

## 7. Delivery (Phase 2 ops, MVP stubs OK)

### 7.1 `assignDelivery`
- **Type:** Callable.
- **Caller:** Web store admin.
- **Role:** `storeAdmin` of order's store.
- **Request:** `{ orderId, driverUid? }`
- **Response:** `{ deliveryId, status:'assigned' }`
- **Writes:** `deliveries/{id}`; `orders/{id}.status = 'out_for_delivery'` when the driver confirms.
- **MVP (without driver app — storeAdmin marks delivered manually until Phase 2).**

### 7.2 `updateDeliveryLocation`
- **Type:** Callable.
- **Caller:** Driver app (Phase 2).
- **Role:** assigned `driverUid`.
- **Request:** `{ deliveryId, lat, lng }`
- **Response:** `{ ok:true }`
- **Writes:** `deliveries/{id}.driverLocation`.
- **Rate limit:** 10/min per driver.
- **Phase 2.**

### 7.3 `markDelivered`
- **Type:** Callable.
- **Caller:** Driver (Phase 2) or store admin (MVP fallback).
- **Request:** `{ deliveryId, podPhotoPath? }`
- **Response:** `{ orderId, status:'delivered' }`
- **Writes:** `deliveries/{id}.status`, `orders/{orderId}.status`.
- **MVP (store admin variant).**

---

## 8. Notifications

### 8.1 `sendNotification`
- **Type:** Internal (callable but restricted to other functions; check `context.app` + caller uid is a service account or drop the callable and make it a plain function).
- **Purpose:** Single entry point for writing an in-app notification + firing FCM.
- **Request:** `{ uid?:string, topic?:string, category, title, body, deepLink?, payloadRefs? }`
- **Writes:** `notifications/{uid}/items/{auto}`; calls `admin.messaging().send` for each valid FCM token.
- **Throttling:** per-uid per-category cap via Firestore token-bucket.
- **MVP.**

### 8.2 `registerFcmToken`
- **Type:** Callable.
- **Purpose:** Register / refresh a device token.
- **Caller:** Mobile.
- **Request:** `{ token, platform:'ios'|'android', appVersion }`
- **Writes:** `users/{uid}/fcmTokens/{token}` (upsert `lastActiveAt`). Deletes any other doc that has the same token under a different uid (owner switch).
- **MVP.**

---

## 9. Support

### 9.1 `createSupportTicket`
- **Type:** Callable. **Caller:** Mobile or web.
- **Request:** `{ category, subject, orderId?, storeId?, body, attachments?: string[] }`
- **Writes:** `supportTickets/{id}` + first message in `supportTickets/{id}/messages`.
- **Notifications:** in-app to support team.
- **MVP.**

### 9.2 `postSupportMessage`
- **Type:** Callable.
- **Role:** ticket owner, or `support`/`admin`.
- **Request:** `{ ticketId, body, attachments? }`
- **Writes:** message subdoc + `supportTickets/{id}.lastMessageAt`.
- **MVP.**

### 9.3 `closeSupportTicket`
- **Type:** Callable.
- **Role:** `support` or `admin` (owner may mark resolved → awaiting confirmation).
- **Writes:** `supportTickets/{id}.status = 'closed'`.
- **MVP.**

---

## 10. Housekeeping (scheduled)

### 10.1 `expireStaleCarts`
- Daily. Delete `carts/{uid}` where `updatedAt < now - 24h`.
- MVP.

### 10.2 `releaseStaleReservations`
- Every 5 min. For each `inventory` where `reservedStock > 0` but no referencing `orders/{id}` in `pending`/`paid` status, decrement reservation.
- MVP.

### 10.3 `recomputePopularity`
- Daily. Update `inventory.popularityScore` from last-14-days order line counts. Used by `searchMedicines` ranking.
- MVP-optional (ship with flat popularity, wire this in week 2).

### 10.4 `rotateFcmTokens`
- Weekly. Delete `users/{uid}/fcmTokens/*` where `lastActiveAt < now - 60d`.
- MVP.

---

## 11. Non-goals / not in this contract
- Server-side analytics pipelines (handled by Firebase Analytics + BigQuery export, out of `functions/`).
- Driver app functions (see Phase 2).
- Promotions / coupons (Phase 2).
- Chat live-typing (Phase 2).

---

## 12. Stubbing order for week 1
If the backend team has only a few days before mobile starts calling, stub in this order (no-op bodies that write sensible placeholder data):
1. `onUserCreate`, `setUserRole`, `registerFcmToken`
2. `nearbyStores`, `searchMedicines`, `placesSearch`, `placeDetails`, `geocode`, `reverseGeocode`
3. `computeCartTotal`
4. `uploadPrescription`, `reviewPrescription`, `onPrescriptionCreate`, `onPrescriptionStateChange`
5. `createOrder`, `updateOrderStatus`, `cancelOrder`
6. `createPaymentOrder`, `paymentsWebhook`, `verifyPaymentClient`, `refundPayment`
7. `sendNotification`, `createSupportTicket`, `postSupportMessage`, `closeSupportTicket`
8. Scheduled: `expirePrescriptions`, `reconcilePayments`, `releaseStaleReservations`, `expireStaleCarts`, `rotateFcmTokens`, `recomputePopularity`
