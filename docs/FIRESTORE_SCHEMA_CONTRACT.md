# Nearnest — Firestore Schema Contract (MVP)

_Target audience: the website/backend team defining Firestore collections + rules + indexes._

**Bound by decisions:** D-003, D-004, D-005, D-006, D-009, D-013, D-014.

**Conventions**
- All timestamps are `serverTimestamp()`; every doc carries `createdAt` and `updatedAt` unless stated.
- Money: integers in **paise**. Currency string field defaults to `"INR"`.
- Coordinates: `{ lat:number, lng:number }`; stores also carry `geohash:string` for proximity queries.
- Arrays of tokens (search, fcm): stored lowercased and deduped.
- "Server-only" = only Cloud Functions may write (enforced by rules checking a synthetic claim or absence of a write path).
- Legacy keep-alive: existing `stores/{id}` rule helpers (`canVerifyDocs`, `canAccessStore`) are expected to remain; new rules for new collections should prefer **token claims** per D-009.

---

## users/{uid}

**Purpose:** Identity + preferences for each person using Nearnest (customer, store member, admin, verifier).

**Document shape**
```
{
  email: string,
  emailVerified: boolean,
  displayName: string,
  phone?: string,           // E.164
  phoneVerified?: boolean,
  photoUrl?: string,
  roles: string[],          // ['user' | 'storeAdmin' | 'admin' | 'verifier']  (mirror of custom claims; see D-009)
  permissions?: string[],   // granular perms, e.g. ['VERIFY_DOCS']
  defaultAddressId?: string,
  preferences: {
    deliveryStrategy: 'nearest'|'fastest'|'cheapest',
    notifications: { order:boolean, prescription:boolean, payment:boolean, promo:boolean, system:boolean },
    language: 'en'|'hi'|...
  },
  createdAt, updatedAt
}
```

**Required:** `email`, `emailVerified`, `displayName`, `roles`, `preferences`, timestamps.
**Optional:** phone, photoUrl, defaultAddressId, permissions.

**Read:** self; `canVerifyDocs()`/admins (existing rule).
**Write:** self may update whitelisted profile fields (`displayName`, `phone`, `photoUrl`, `defaultAddressId`, `preferences`). `roles` + `permissions` server-only (`setUserRole`).

**Server-only fields:** `roles`, `permissions`, `emailVerified`, `phoneVerified`.

**Indexes:** single-field on `roles` (existing).

**Validation:** `roles` ⊆ enum; `phone` E.164 format; `preferences.notifications` is a complete map.

**Example**
```json
{
  "email": "asha@example.com",
  "emailVerified": true,
  "displayName": "Asha P.",
  "phone": "+918800000000",
  "phoneVerified": false,
  "roles": ["user"],
  "permissions": [],
  "defaultAddressId": "addr_home",
  "preferences": {
    "deliveryStrategy": "fastest",
    "notifications": { "order": true, "prescription": true, "payment": true, "promo": false, "system": true },
    "language": "en"
  },
  "createdAt": "<ts>",
  "updatedAt": "<ts>"
}
```

---

## users/{uid}/addresses/{addressId}

**Purpose:** Saved delivery addresses.

**Shape**
```
{
  label: 'home'|'work'|'other'|string,
  line1, line2?, landmark?,
  city, state, pincode,
  location: { lat, lng, geohash? },
  recipientName?, recipientPhone?,
  isDefault: boolean,
  createdAt, updatedAt
}
```

**Read:** self.
**Write:** self (full CRUD).
**Server-only:** none.
**Indexes:** `(isDefault, updatedAt desc)` for self query.
**Validation:** pincode 6 digits; `location.lat/lng` in India bbox; only one `isDefault: true` at a time (enforced by Cloud Function or client logic — rules can’t enforce uniqueness).

**Example**
```json
{ "label":"home","line1":"101, 2nd Cross","city":"Bengaluru","state":"KA","pincode":"560095",
  "location":{"lat":12.926,"lng":77.629},"isDefault":true,"createdAt":"<ts>","updatedAt":"<ts>" }
```

---

## users/{uid}/fcmTokens/{tokenId}

**Purpose:** Device push tokens.

**Shape**
```
{
  token: string,
  platform: 'ios'|'android',
  appVersion: string,
  lastActiveAt: timestamp,
  createdAt
}
```

**Doc ID:** the FCM token itself (dedupe).
**Read:** self.
**Write:** self (`registerFcmToken` callable preferred, but direct upsert allowed for owner).
**Server-only:** none.
**Indexes:** `lastActiveAt` (for `rotateFcmTokens`).
**Validation:** `token.length` > 50; `platform` enum.

---

## notifications/{uid}/items/{notificationId}

**Purpose:** Per-user in-app inbox backing the notifications bell.

**Shape**
```
{
  category: 'order'|'prescription'|'payment'|'promo'|'system',
  title: string,
  body: string,
  deepLink?: string,       // 'nearnest://order/{id}' etc.
  payloadRefs?: { orderId?, prescriptionId?, ticketId?, storeId? },
  readAt?: timestamp,
  createdAt
}
```

**Read:** self.
**Write:** **server-only** (via `sendNotification`). Owner may `update` only to set `readAt`.
**Indexes:** `(category, createdAt desc)`, `(readAt==null, createdAt desc)` for unread badge.
**Validation:** `category` enum; `deepLink` URI format if present.

**Example**
```json
{ "category":"order","title":"Order placed","body":"Your order #NN-123 is pending payment.",
  "deepLink":"nearnest://order/ord_abc","payloadRefs":{"orderId":"ord_abc"},"createdAt":"<ts>" }
```

---

## stores/{storeId} (extends existing)

**Purpose:** A verified neighbourhood store. Already partially used by web portal.

**Shape (additions in bold)**
```
{
  name, description?,
  ownerId, members:{uid:true}, membersArr:[], visibleTo:[],
  categoryTags?: string[],
  license?: { number, issuingAuthority, expiresAt },
  verification?: { status, reviewedByUid, reviewedAt, documents?:[] },
  isVerified: boolean,                      // existing / to confirm
  **location: { lat, lng, geohash },**
  **address: { line1, line2?, city, state, pincode },**
  **serviceArea: { type:'radiusKm'|'polygon', value },**
  **hours: { mon:[[HH:MM, HH:MM]], tue:[...], ... },**
  **rating?: { avg:number, count:int },**
  **capabilities: { codAccepted:boolean, rxAccepted:boolean, scheduledDelivery:boolean },**
  createdAt, updatedAt
}
```

**Read:** signed-in (list filtered by `isVerified==true`); existing `canAccessStore` helpers still apply to sensitive subcollections.
**Write:** owner / members for descriptive fields; `isVerified` remains verifier/admin only (existing).
**Server-only:** `verification.*`, `rating.*` (server-aggregated).
**Indexes:** `(isVerified, geohash)`, `(isVerified, categoryTags, rating.avg desc)`.
**Validation:** `serviceArea.value` positive; `hours` day keys complete.

---

## stores/{storeId}/inventory/{sku}

**Purpose:** What this store actually sells + price + stock.

**Shape**
```
{
  medicineId: string,                   // ref medicines/{id}
  name: string, brand?: string,
  form: 'tablet'|'syrup'|'cream'|'inhaler'|..., strength: string, packSize: string,
  price: { mrp:int, sellingPrice:int, currency:'INR' },
  stock: int,                           // available for sale
  reservedStock: int,                   // held during checkout
  requiresPrescription: boolean,        // inherited from medicine; override allowed
  searchTokens: string[],               // lowercased prefixes; maintained by trigger (D-013)
  category?: string, tags?: string[],
  imageUrls?: string[],
  batches?: [{ batchNo, expiresAt, qty }],   // Phase 2
  popularityScore?: number,             // recomputed nightly
  isActive: boolean,
  createdAt, updatedAt
}
```

**Doc ID:** `sku` (store-local, e.g. `DOLO-650-STRIP`).
**Read:** signed-in.
**Write:** store owner/members.
**Server-only:** `reservedStock` (must only change in `createOrder` / `cancelOrder` / `releaseStaleReservations`); `searchTokens` (trigger); `popularityScore` (scheduled).
**Indexes:** `(isActive, category, popularityScore desc)`, `(isActive, medicineId)`, `(searchTokens array-contains, isActive)`.
**Validation:** `stock >= 0`, `reservedStock >= 0`, `reservedStock <= stock + reserved`, `sellingPrice <= mrp`.

**Example**
```json
{ "medicineId":"med_dolo650","name":"Dolo 650","brand":"Micro Labs","form":"tablet",
  "strength":"650mg","packSize":"15 tabs","price":{"mrp":3200,"sellingPrice":3000,"currency":"INR"},
  "stock":42,"reservedStock":3,"requiresPrescription":false,
  "searchTokens":["d","do","dol","dolo","dolo6","dolo65","dolo650","paracet","paraceta","paracetamol"],
  "isActive":true,"createdAt":"<ts>","updatedAt":"<ts>" }
```

---

## medicines/{medicineId}

**Purpose:** Canonical medicine catalog shared across stores.

**Shape**
```
{
  name: string, aliases: string[],
  brand?: string, manufacturer?: string,
  salt: string[],                          // active ingredients
  form: string, strength: string, packSize: string,
  requiresPrescription: boolean,
  schedule?: 'H'|'H1'|'X'|null,            // Indian drug schedule
  therapeuticCategory?: string,
  usage?: string, sideEffects?: string[], warnings?: string[],
  imageUrl?: string,
  searchTokens: string[],
  isActive: boolean,
  createdAt, updatedAt
}
```

**Read:** signed-in.
**Write:** `admin` only (catalog is curated).
**Server-only:** `searchTokens` (trigger).
**Indexes:** `(isActive, searchTokens array-contains)`, `(salt, isActive)`.
**Validation:** `requiresPrescription` consistent with `schedule` (any of `H`, `H1`, `X` implies true).

---

## carts/{uid}

**Purpose:** The user's active single-store cart.

**Shape**
```
{
  storeId: string,
  items: Array<{ sku, medicineId, qty, priceSnapshot }>,
  updatedAt
}
```

**Read/Write:** self.
**Server-only:** none (but `computeCartTotal` is authoritative on money).
**Indexes:** none beyond defaults.
**Validation:** all items reference the same `storeId`; `qty >= 1`.

---

## prescriptions/{prescriptionId}

**Purpose:** An uploaded prescription reviewed for a specific store (per-store scope, D-014).

**Shape**
```
{
  ownerUid: string,
  storeId: string,
  state: 'pending'|'approved'|'rejected'|'expired',
  pagesCount: int,
  storagePathPrefix: string,              // 'prescriptions/{uid}/{id}/'
  doctor?: { name?, regNo?, clinic? },
  issuedAt?: timestamp,
  expiresAt?: timestamp,                  // default +90 days from createdAt
  coversMedicineIds: string[],            // set on approve
  notes?: string,                         // reviewer note, esp. on reject
  reviewedByUid?: string, reviewedAt?: timestamp,
  linkedOrderIds: string[],
  createdAt, updatedAt
}
```

**Read:** owner; members of `storeId`; `admin`.
**Write:** `create` via `uploadPrescription` only (client `create` rejected by rules — must originate from the callable). `state`, `reviewedByUid`, `reviewedAt`, `notes`, `coversMedicineIds`, `linkedOrderIds`, `expiresAt` are **server-only**.
**Indexes:** `(ownerUid, state, createdAt desc)`, `(storeId, state, createdAt desc)`, `(state, expiresAt)` for expiry job.
**Validation:** `state` transitions only via `reviewPrescription` / `expirePrescriptions` / `onPrescriptionCreate` path.

**Example**
```json
{ "ownerUid":"uid_asha","storeId":"store_abc","state":"pending","pagesCount":2,
  "storagePathPrefix":"prescriptions/uid_asha/presc_123/",
  "doctor":{"name":"Dr. Roy","regNo":"KMC-12345"},
  "issuedAt":"<ts>","expiresAt":"<ts+90d>",
  "coversMedicineIds":[],"linkedOrderIds":[],"createdAt":"<ts>","updatedAt":"<ts>" }
```

---

## orders/{orderId}

**Purpose:** The immutable contract between a buyer and a store at checkout.

**Shape**
```
{
  buyerUid: string,
  storeId: string,
  status: 'pending'|'paid'|'preparing'|'ready_for_pickup'|'out_for_delivery'|'delivered'
        |'cancelled'|'refunded'|'cancelled_no_payment'|'out_of_stock',
  items: Array<{ sku, medicineId, qty, unitPrice, lineTotal, requiresPrescription, rxPrescriptionId? }>,
  totals: { subtotal, deliveryFee, packagingFee, taxes, discount, grandTotal, currency },
  cartHash: string,
  addressSnapshot: { line1, line2?, city, state, pincode, location, recipientName?, recipientPhone? },
  paymentMethod: 'UPI'|'CARD'|'NETBANKING'|'WALLET'|'COD',
  eta: { placedAt, packedAt?, outAt?, deliveredAt? },
  placedAt, updatedAt
}
```

**Read:** `buyerUid`, members of `storeId`, `admin`.
**Write:** **server-only** (clients never write). Callables: `createOrder`, `updateOrderStatus`, `cancelOrder`, `paymentsWebhook` (indirect).
**Indexes:** `(buyerUid, placedAt desc)`, `(storeId, status, placedAt desc)`, `(status, updatedAt)` (for jobs).
**Validation:** `items[].rxPrescriptionId` required when `requiresPrescription==true`.

---

## orders/{orderId}/events/{eventId}

**Purpose:** Append-only audit trail of every transition.

**Shape**
```
{
  type: 'placed'|'paid'|'preparing'|'ready_for_pickup'|'out_for_delivery'|'delivered'
      |'cancelled'|'refunded'|'note'|'out_of_stock',
  actorUid?: string, actorRole?: string,
  note?: string,
  payload?: object,
  createdAt
}
```

**Read:** same as parent order.
**Write:** **server-only** (append-only; no update, no delete).
**Indexes:** default `(createdAt asc)`.

---

## payments/{paymentId}

**Purpose:** Payment record with provider context.

**Shape**
```
{
  orderId: string,
  provider: 'razorpay'|'cashfree',
  providerOrderId: string, providerPaymentId?: string,
  amount: int, currency: 'INR',
  status: 'created'|'captured'|'failed'|'refunded'|'partial_refund',
  idempotencyKey: string,
  events: Array<{ type, payloadDigest, at }>,     // webhook digest audit
  refunds?: Array<{ refundId, amount, reason, at, status }>,
  createdAt, capturedAt?, refundedAt?
}
```

**Read:** buyer of `orderId` + store members + `admin`.
**Write:** **server-only** (`createPaymentOrder`, `paymentsWebhook`, `verifyPaymentClient`, `refundPayment`).
**Indexes:** `(orderId)`, `(status, createdAt)` for reconciliation, `(provider, providerOrderId)` unique-ish.
**Validation:** `amount == orders/{orderId}.totals.grandTotal` at `created` time.

---

## deliveries/{deliveryId}

**Purpose:** State of the physical delivery for an order.

**Shape**
```
{
  orderId: string,
  driverUid?: string,
  status: 'unassigned'|'assigned'|'picked_up'|'out_for_delivery'|'delivered'|'failed',
  driverLocation?: { lat, lng, ts },
  route?: string,                  // encoded polyline
  etaMinutes?: int,
  podPhotoPath?: string,           // Phase 2
  failureReason?: string,
  createdAt, updatedAt
}
```

**Read:** buyer + store members + assigned driver + `admin`.
**Write:** **server-only**; `updateDeliveryLocation` allows the assigned driver uid to update `driverLocation` (enforced by function, not direct rule).
**Indexes:** `(orderId)`, `(status, updatedAt)`.
**Validation:** `driverLocation` timestamp monotonically increasing.

---

## supportTickets/{ticketId}

**Purpose:** User ↔ support thread. Reuses existing structure where possible.

**Shape**
```
{
  ownerUid: string,
  storeId?: string, orderId?: string,
  category: 'order'|'payment'|'prescription'|'account'|'other',
  subject: string,
  status: 'open'|'awaiting_user'|'awaiting_support'|'resolved'|'closed',
  lastMessageAt: timestamp,
  createdAt, updatedAt
}
```

**Read:** owner + `admin` + `support` role.
**Write:** owner may create; status transitions by support/admin (via callables).
**Indexes:** `(ownerUid, status, lastMessageAt desc)`, `(status, lastMessageAt desc)` for support queues.

---

## supportTickets/{ticketId}/messages/{messageId}

**Purpose:** Thread messages.

**Shape**
```
{
  authorUid: string,
  authorRole: 'user'|'support'|'admin',
  body: string,
  attachments?: string[],                // Storage paths
  createdAt
}
```

**Read:** ticket readers.
**Write:** owner (as user) or `support`/`admin`; set `authorRole` server-side in `postSupportMessage` to prevent spoof.
**Indexes:** default `(createdAt asc)`.

---

## Composite index quick list (MVP)
- `inventory`: `(storeId asc, isActive asc, popularityScore desc)`, `(storeId asc, medicineId asc)`, `(searchTokens array-contains, isActive asc)`.
- `medicines`: `(isActive asc, searchTokens array-contains)`, `(salt asc, isActive asc)`.
- `orders`: `(buyerUid asc, placedAt desc)`, `(storeId asc, status asc, placedAt desc)`.
- `prescriptions`: `(ownerUid asc, state asc, createdAt desc)`, `(storeId asc, state asc, createdAt desc)`, `(state asc, expiresAt asc)`.
- `payments`: `(status asc, createdAt asc)`.
- `deliveries`: `(status asc, updatedAt desc)`.
- `notifications/{uid}/items`: `(category asc, createdAt desc)`.
- `supportTickets`: `(ownerUid asc, status asc, lastMessageAt desc)`, `(status asc, lastMessageAt desc)`.

---

## Storage paths referenced here
- `avatars/{uid}/*` — existing.
- `storeDocs/{storeId}/*` — existing.
- `prescriptions/{uid}/{prescriptionId}/pages/{n}.{jpg|pdf}` — new. Only owner + reviewing store members + admin can read; writes come only through signed URLs issued by `uploadPrescription`.
- `orders/{orderId}/pod/*` — Phase 2.
- `support/{ticketId}/attachments/*` — MVP-optional.

---

## Change management
Any schema change after this contract is published must:
1. Create a new `D-NNN` entry in `DECISIONS.md` that names the schema change.
2. Update this file in the same PR.
3. Coordinate rule + index changes with the website team.
4. Run `security-compliance-reviewer` if the change touches Rx, payments, orders, deliveries, or prescriptions.
