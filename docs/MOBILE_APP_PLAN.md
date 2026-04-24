# Nearnest Mobile App — Full Product & System Design

_Living planning doc. Owned by the `mobile-product-planner` skill. No code lives here. Updated 2026-04-24._

---

## Section 1 — Product Vision

### What Nearnest mobile does
Nearnest is a hyper-local medicine and essentials app that connects a customer to the **nearest real, verified neighbourhood store that actually has their medicine in stock right now**. The user searches for a medicine; the app returns the closest stores that have it, sorted by distance + delivery time. If the medicine requires a prescription, the app gates checkout behind a store-pharmacist approval of an uploaded prescription. The customer pays in-app, tracks the order from accepted → packed → out-for-delivery → delivered on a live map, and can chat with the store or support if anything goes wrong.

The mobile app is the **customer-facing** half of a system whose **store, admin, verifier, and support sides already live on the web portal** (this repo). Both clients share one Firebase backend.

### Target users
1. **Primary — Retail customer (patient / buyer)**
   - Needs a specific medicine or essential, fast, nearby.
   - Mix of recurring (chronic-condition refills) and ad-hoc (illness, emergency).
   - Wants trust (verified store, licensed pharmacist, traceable delivery), clarity (ETA, price, prescription status), and low friction (one-hand checkout).
2. **Secondary — Caretaker / family member**
   - Orders on behalf of elderly parents, spouse, children.
   - Needs saved profiles, saved addresses, multiple-recipient support, prescription folder per dependent.
3. **Phase 2 — Store staff on the go**
   - Accept orders, mark packed, hand to delivery, resolve out-of-stock — lightweight mobile view of the web store-admin portal.
4. **Phase 2 — Delivery partner**
   - Accept assignments, update live location, mark delivered, upload POD.

### Core value — why people will use it
- **"The medicine I need, from a shop I trust, in <45 minutes."**
- **Prescription safety by default.** Rx items cannot be delivered without a pharmacist's approval — no fake-prescription loophole, no "just checkout anyway" bypass.
- **Real inventory, not a catalog.** Searches are scoped to stores that actually have the SKU in stock, not generic "we might have it" listings.
- **Verified stores only.** Every store is document-verified through the existing web portal flow before it can sell.
- **One-tap reorder.** Chronic patients reorder a month's supply with a single tap from order history.
- **Transparent delivery.** Live map, driver name, ETA, POD. If anything is delayed, you see why.

---

## Section 2 — Full Feature Breakdown (module-by-module)

Each module: **purpose · UI sections · interactions · validations · backend needs**.

### 2.1 Authentication
- **Purpose:** Establish a trusted identity with a verified contact channel before the user can order Rx medicines, save addresses, or pay.
- **UI sections**
  - Splash (1–2s), brand logo, quiet loading shimmer.
  - Welcome carousel (3 slides: "Find it nearby" / "Pharmacist-approved" / "Track live"). Skippable.
  - Sign in (email + password; "Continue with Google" Phase 2).
  - Sign up (name, email, password with strength meter, phone, accept T&C).
  - Email verification pending (resend button with 30s cooldown, "I've verified, continue" CTA that polls token refresh).
  - Forgot password (email field → success screen).
  - Phone OTP verify (Phase 2) — 6-digit input with auto-read on Android.
  - Session-expired modal (silent re-auth attempt first).
- **Interactions**
  - Form validation inline (email format, password min 8 + 1 digit, phone E.164).
  - On signup success → email-verify screen → poll `currentUser.reload()` every 3s for up to 2 min.
  - "Sign in" on unverified account → route to email-verify screen with clear messaging.
  - Biometric unlock (Phase 2) after first successful sign-in using Expo LocalAuthentication.
- **Validations**
  - Email uniqueness enforced by Firebase Auth.
  - Email verified before allowing prescription upload, checkout, or adding a saved address.
  - Rate-limit sign-in attempts client-side (exponential backoff after 3 failures).
- **Backend needs**
  - Firebase Auth (email/password; phone Phase 2).
  - `onUserCreate` Cloud Function trigger → creates `users/{uid}` with default role `user`, empty profile, server timestamp.
  - `setUserRole` callable — admin-only, sets custom claims.

### 2.2 Location + Nearby Stores
- **Purpose:** Anchor the whole experience to where the user physically is (or where they want delivery). Surface only stores that can deliver to that point.
- **UI sections**
  - First-run location permission primer (explain why before asking OS).
  - Home header: address chip (tappable → address picker).
  - Nearby stores list/map toggle.
  - Delivery-area indicator on each store ("Delivers to your location · 28 min").
  - Out-of-service-area empty state with "Notify me when Nearnest launches here".
- **Interactions**
  - On first launch: request foreground location; fall back to "Pick address manually" if denied.
  - Address picker: saved addresses → search Places (proxied) → drag a pin on map → confirm → save with label (Home / Work / Mom's).
  - Switching address re-queries nearby stores + re-validates cart feasibility.
- **Validations**
  - Stores only shown if `store.serviceArea` (radius or polygon) contains user's delivery point.
  - Distance computed server-side to avoid spoof; client distance is advisory only.
- **Backend needs**
  - `placesSearch` Cloud Function proxy (Google Places Web Service) to keep API key server-side.
  - Optional `nearbyStores` callable — geo-query using geohashes indexed on `stores/{id}.geohash`.
  - `stores/{id}.serviceArea` (radius in km or GeoJSON polygon).

### 2.3 Medicine Search
- **Purpose:** Let a user type a brand or salt name and see every nearby store that has it in stock — ranked.
- **UI sections**
  - Search bar (sticky at top of Home and dedicated Search tab).
  - Recent searches + saved searches.
  - Type-ahead suggestions (medicine name, salt, brand).
  - Results list: medicine card with strength/form, then a ranked list of stores that have it (store name, distance, ETA, price, Rx badge).
  - Empty state: "No nearby store has this right now. Notify me when back in stock." + "Request this medicine" action.
- **Interactions**
  - Debounced query (250ms).
  - Filters: Rx-only / OTC / generic-available / within X km / open-now.
  - Sort: nearest · fastest · cheapest.
  - Tap store result → jump directly into that store's inventory page pre-scrolled to the SKU.
- **Validations**
  - Minimum 2 chars before hitting the aggregation endpoint.
  - Results respect delivery-area gating.
- **Backend needs**
  - `searchMedicines` Cloud Function → aggregates across nearby stores' `inventory` subcollection, filtered by stock > 0, returns ranked list.
  - `medicines/{medicineId}` — canonical medicine catalog (name, salt, form, strength, image, Rx flag, aliases for search).
  - Algolia / Typesense (Phase 2) for fuzzy search — MVP uses Firestore prefix index on `searchTokens[]`.

### 2.4 Store Inventory View
- **Purpose:** Show what a specific store actually sells right now, with in-stock state and price.
- **UI sections**
  - Store header: name, verified badge, rating, distance, ETA, open/closed, license ID (tap → verification details).
  - Category chips (Medicines / Supplements / Baby / Skincare / Devices / …).
  - Search within store.
  - Product grid/list with Rx badge on Rx items, out-of-stock greyed-out state, price.
  - Sticky cart bar bottom ("N items · ₹xxx · View cart").
- **Interactions**
  - Add/remove from cart with haptic + animated pill counter.
  - Cannot mix items from two different stores in one cart — warning modal: "Switch store? This will clear your cart."
- **Validations**
  - Quantity ≤ `inventory.stock`.
  - Rx items don't block add-to-cart, but block checkout until approved prescription is linked.
- **Backend needs**
  - `stores/{storeId}/inventory/{sku}` listed via Firestore query (ordered by `category` + `popularityScore`).
  - `storeDoc.isVerified === true` enforced by rules + client filter.

### 2.5 Map Integration
- **Purpose:** Visual spatial context for nearby stores, store location on detail screen, and live delivery tracking.
- **UI sections**
  - Home map view (toggle from list) with clustered pins; bottom sheet with currently-selected store preview.
  - Store-detail mini map showing exact location + "Get directions" CTA.
  - Live delivery map on in-progress orders (driver pin, route polyline, ETA chip).
- **Interactions**
  - Pinch-to-zoom; tapping a cluster expands it.
  - Tapping a pin → peek card → tap again to open store.
  - Long-press "Get directions" launches the device's default maps app.
  - Live map auto-follows the driver; user can pan to break-follow and a "Recenter" button appears.
- **Validations**
  - Location permission state handled gracefully (denied → map centered on selected address instead of GPS).
  - Map tiles cached for offline resilience (MVP: last-known map view).
- **Backend needs**
  - `react-native-maps` with Google provider.
  - Platform-specific Google Maps API keys, restricted to bundle IDs. Places calls go through the `placesSearch` function, not from the device.
  - `deliveries/{id}.driverLocation` updated by driver app (Phase 2) — MVP uses coarse store-to-home polyline + stepped pseudo-ETA.

### 2.6 Medicine Detail
- **Purpose:** Give the user enough information to trust the medicine and decide to buy.
- **UI sections**
  - Hero image (carousel).
  - Name · salt · strength · form · pack size.
  - Price + any MRP strike-through + savings pill.
  - Rx required warning card (see Design System §7) if applicable.
  - "Available at" — list of nearby stores with this SKU in stock.
  - Dosage / usage notes (from `medicines/{id}.usage`), safety notes.
  - Alternatives: same-salt substitutes (generics) clearly labelled.
  - Reviews / ratings (Phase 2).
- **Interactions**
  - Add to cart from here routes through the cheapest / nearest / fastest of the available stores (user picks strategy once, remembered in preferences).
  - "Compare" shows same-salt alternatives side-by-side.
- **Validations**
  - Show expiry-date-based warning if store's batch is <30 days to expiry (Phase 2 — needs inventory to carry batch info).
- **Backend needs**
  - `medicines/{medicineId}` canonical.
  - Denormalized `stores/{storeId}/inventory/{sku}` linked via `medicineId`.

### 2.7 Cart + Checkout
- **Purpose:** Confirm items, delivery address, prescriptions, payment, and place the order.
- **UI sections**
  - Line items with qty stepper, unit + line price, Rx badge.
  - Prescription attach block (per Rx item or per cart, see §2.8).
  - Delivery address card (tap to switch).
  - Delivery slot / ASAP toggle (Phase 2 adds scheduled delivery).
  - Price breakdown (subtotal, delivery fee, packaging, taxes, coupon, total).
  - Coupon input (Phase 2).
  - Payment method picker.
  - "Place order" primary button — disabled with clear helper text when any Rx item is missing approval.
- **Interactions**
  - Changing the delivery address that makes the store undeliverable prompts a switch-store decision.
  - Editing qty refreshes price server-side via `computeCartTotal` callable (totals never trusted from client).
  - If stock drops mid-session, show a soft modal "X is no longer available in the requested qty" and let the user accept the new qty or remove.
- **Validations**
  - All items belong to the same store.
  - Total items ≤ store's per-order cap.
  - No Rx item without an `approved` prescription tied to the ordering uid.
  - Totals computed and signed server-side.
- **Backend needs**
  - `carts/{uid}` (client-owned writes).
  - `computeCartTotal` callable — returns server-canonical totals.
  - `createOrder` callable — atomically creates `orders/{id}`, reserves inventory, validates Rx gate.

### 2.8 Prescription Upload + Approval
- **Purpose:** Keep Rx medicines legal and safe. No approval → no delivery. Full audit trail.
- **UI sections**
  - "My prescriptions" list (tab): each has state (pending / approved / rejected / expired) and medicines-covered list.
  - Upload screen: camera + gallery + PDF picker; multi-page support; doctor info fields (optional OCR assist later).
  - Attach-to-item flow: when adding an Rx item, show "Attach a prescription" sheet with two paths — "Use an approved prescription" or "Upload new".
  - Pending state: "Sent to {storeName}. You'll hear back in ~{median minutes}."
  - Rejected state: reason + "Upload a clearer prescription".
- **Interactions**
  - Auto-crop + brighten scanned pages (expo-image-manipulator).
  - Compress to ≤2 MB per page before upload.
  - Upload to `prescriptions/{uid}/{prescriptionId}/pages/{n}` in Storage with a signed-URL download path granted only to the user + reviewing store staff.
  - On approval → FCM push to user.
  - Rx approved for a specific store's review; **cross-store reuse requires re-review** (decision in §8 — see risks).
- **Validations**
  - File types: jpg, png, pdf.
  - Each page ≤ 10 MB; total ≤ 25 MB.
  - Every Rx item in cart must reference a prescription that (a) is approved, (b) covers that medicine's salt, and (c) is tied to `ordererUid`.
  - Server enforces approval state — client only reflects it.
- **Backend needs**
  - `prescriptions/{prescriptionId}` doc — `ownerUid`, `state`, `reviewedByUid`, `reviewedAt`, `storeId`, `coversMedicineIds[]`, `notes`, `pagesCount`, `expiresAt`.
  - Storage path `prescriptions/{uid}/{prescriptionId}/pages/*` — client-readable-only for owner, server-readable for admins via signed URLs.
  - `uploadPrescription` callable (creates doc + returns signed upload URLs).
  - `reviewPrescription` callable — store-admin-or-above; writes state, timestamp, reviewer, reason (if rejected); emits FCM.
  - `onPrescriptionCreate` trigger — FCM to store admin.

### 2.9 Delivery System
- **Purpose:** Get the order from the store counter to the user's door, with live visibility.
- **UI sections**
  - On order detail: stepper (see Design System §8) + a live map when `out_for_delivery`.
  - Driver card: name, phone (masked via proxy in Phase 2), vehicle type.
  - Contactless delivery toggle + delivery instructions.
  - Proof-of-delivery (POD) photo displayed after handover (Phase 2).
- **Interactions**
  - Tap "Call store" → masked number via Cloud Function (Phase 2; MVP is plain number).
  - "I'm not home" → reschedule (Phase 2) or cancel with penalty rules.
  - Delivery partner app (Phase 2) posts location every 10–15s while `out_for_delivery`.
- **Validations**
  - Driver location updates only accepted from the assigned driver's uid.
  - Cannot mark delivered without POD photo (Phase 2).
- **Backend needs**
  - `deliveries/{deliveryId}` — `orderId`, `driverUid`, `status`, `driverLocation {lat,lng,ts}`, `podPhotoUrl`.
  - `assignDelivery` callable — store-admin-only.
  - `updateDeliveryLocation` callable — driver-only.
  - `markDelivered` callable — driver-only; transitions order.

### 2.10 Payment System
- **Purpose:** Collect money safely, transition order state, issue receipts, support refunds.
- **UI sections**
  - Payment method chooser: UPI, cards, netbanking, wallets, Cash on Delivery (store toggleable).
  - Payment sheet (provider SDK) with loading + success/failure states.
  - Receipt screen with download PDF (Phase 2) and "Report issue" link.
- **Interactions**
  - On checkout → `createOrder` returns `orderId` + a provider `paymentOrderId`.
  - App opens provider SDK; on success/failure the provider calls a server webhook + the app verifies state via a callable.
  - COD: order goes straight to `preparing`; cash is recorded on delivery.
- **Validations**
  - Totals verified server-side against `createOrder` signed total.
  - Duplicate-payment guard via idempotency key.
  - Refund eligibility (time since delivered + item type) computed server-side.
- **Backend needs**
  - Payment provider TBD (Razorpay / Cashfree / Stripe India — see §8).
  - `payments/{paymentId}` — `orderId`, `provider`, `providerOrderId`, `amount`, `currency`, `status`, `capturedAt`, `refundedAt`.
  - `createPaymentOrder` callable (provider-specific order/token).
  - `paymentsWebhook` HTTP — verifies signature, updates `payments/`, triggers `orders/{id}.status = paid`.
  - `verifyPaymentClient` callable — app-initiated fallback verification.
  - `refundPayment` callable — admin-or-store; partial or full.

### 2.11 Order Tracking
- **Purpose:** The order-detail screen is the user's "what's happening with my stuff" single source of truth.
- **UI sections**
  - Header: order number, store name (tap → store), placed-at, total.
  - Status stepper (Design System §8).
  - Live map (when `out_for_delivery`).
  - Items list (readonly post-placement).
  - Prescription attached (collapsible).
  - Actions: Call store · Help · Cancel (if allowed) · Reorder.
  - Event log (show/hide): every state transition with timestamp + actor role.
- **Interactions**
  - Realtime listener on `orders/{id}` + `orders/{id}/events/{id}` subcollection.
  - Cancel is only allowed in `pending` / `paid` (before `preparing`). After that, it becomes a "Request cancellation" support action.
  - Reorder: pre-fills cart with the same items at current prices & stock; Rx prescriptions must be re-attached (fresh or reused).
- **Validations**
  - Only the ordering user, the store's staff, and admins can read the order and its events.
- **Backend needs**
  - `orders/{id}` + `events/{id}` as defined in §5.

### 2.12 Notifications
- **Purpose:** Keep the user in the loop without making them poll.
- **UI sections**
  - FCM push with deep links to the relevant order/prescription.
  - In-app inbox tab with filters (orders / prescriptions / offers / system).
  - Badge count on tab icon.
  - Settings toggle per category.
- **Interactions**
  - Tap notification → deep link to order/prescription detail.
  - Swipe to dismiss; long-press to mute a category.
- **Validations**
  - Permission primer before requesting OS permission.
  - Server-side throttling — max N notifications per hour per user per category.
- **Backend needs**
  - `users/{uid}/fcmTokens/{tokenId}` — device token, platform, lastActiveAt.
  - `notifications/{uid}/items/{id}` — `title`, `body`, `category`, `deepLink`, `readAt`.
  - `sendNotification` callable — single entry point; handles write + FCM send.
  - `onOrderStateChange`, `onPrescriptionStateChange` triggers call `sendNotification` internally.

### 2.13 Support / Chat
- **Purpose:** Give the user a channel for "something's wrong" that doesn't require a phone call.
- **UI sections**
  - Help home: topics (order issue, payment issue, prescription issue, other).
  - Ticket list (open / resolved).
  - Ticket detail with chat thread (user ↔ support team).
  - FAQ search.
- **Interactions**
  - Creating a ticket from an order auto-attaches order context.
  - Support-side uses the existing web portal — no mobile admin needed for MVP.
  - Typing indicator + read receipts (Phase 2).
- **Validations**
  - Ticket user ownership enforced in rules.
- **Backend needs**
  - `supportTickets/{ticketId}` (already present in web) — reuse.
  - `supportTickets/{ticketId}/messages/{id}` subcollection.
  - `createSupportTicket` + `postSupportMessage` callables.

### 2.14 Profile
- **Purpose:** Home for identity, addresses, prescriptions, settings, linked family profiles.
- **UI sections**
  - Avatar, name, email, phone.
  - Saved addresses (Home / Work / custom) with default flag.
  - My prescriptions shortcut.
  - Orders shortcut.
  - Preferences: language (Phase 2), notifications per category, delivery strategy (nearest / fastest / cheapest).
  - Linked profiles (caretaker — Phase 2).
  - Legal: T&C, privacy, about, version.
  - Sign out.
- **Interactions**
  - Edit profile → direct Firestore write to self-owned fields (rules enforce).
  - Avatar upload → Storage `avatars/{uid}/*`.
- **Validations**
  - Only owner can edit their profile (rules already enforce).
  - Phone change requires OTP re-verification (Phase 2).
- **Backend needs**
  - `users/{uid}` (existing).
  - `users/{uid}/addresses/{id}` (new).

---

## Section 3 — App Navigation Architecture

### 3.1 High-level
```
RootNavigator
├── AuthStack           (unauthenticated users)
│   ├── Splash
│   ├── Welcome
│   ├── SignIn
│   ├── SignUp
│   ├── VerifyEmail
│   └── ForgotPassword
└── AppTabs             (authenticated users; profile-complete gate in front)
    ├── HomeTab
    ├── SearchTab
    ├── OrdersTab
    ├── PrescriptionsTab
    └── ProfileTab
```

### 3.2 Bottom tabs (5)
| Tab | Primary surface | Secondary surfaces (inside stack) |
|-----|-----------------|-----------------------------------|
| **Home** | Nearby stores (list/map toggle) | StoreDetail → ProductDetail → Search-in-store |
| **Search** | Global medicine search | SearchResults → StoreDetail → ProductDetail |
| **Orders** | Active + past orders | OrderDetail → LiveDeliveryMap → SupportThread |
| **Prescriptions** | List of uploaded prescriptions | PrescriptionDetail → UploadPrescription |
| **Profile** | Profile home | EditProfile → Addresses → AddressEditor → Notifications settings → Support → About |

Notifications inbox lives as a top-right bell icon on Home/Orders (opens a stack screen), not a tab — keeps tabs focused on action, not reading.

### 3.3 Stack navigation (per tab)
- **Home stack:** Home → StoreDetail → ProductDetail → SearchInStore → CartModal.
- **Search stack:** SearchHome → SearchResults → StoreDetail (shared) → ProductDetail (shared).
- **Orders stack:** Orders → OrderDetail → LiveDeliveryMap → SupportThread → CreateSupportTicket.
- **Prescriptions stack:** PrescriptionsList → PrescriptionDetail → UploadPrescription → Camera/Crop → Review.
- **Profile stack:** Profile → EditProfile → Addresses → AddressEditor (map pick) → NotificationPrefs → SupportHome → FAQ → LegalScreens.

### 3.4 Modal flows (presented above tabs, not inside them)
- **Cart modal** — reachable from any screen; sticky cart bar deep-links into it.
- **Checkout modal** — launched from cart; cannot be backgrounded without a confirm prompt during payment.
- **Address picker modal** — used by Home/Cart/Checkout/Profile.
- **Prescription attach modal** — from ProductDetail / Cart / Checkout.
- **Switch-store confirm** — when adding an item from a different store.

### 3.5 Map vs List UX
- **Home default is List.** Map is a toggle (top-right pill).
- **Map view** renders clustered pins with a bottom sheet preview of the selected store; dragging the map triggers a "Search this area" pill.
- **Store detail** always shows a small non-interactive mini-map with a "Directions" CTA.
- **Live delivery** is always map-first — the stepper collapses into a compact pill above the map.

### 3.6 Entry points (deep links)
- `nearnest://order/{orderId}` → OrderDetail
- `nearnest://prescription/{prescriptionId}` → PrescriptionDetail
- `nearnest://store/{storeId}` → StoreDetail
- `nearnest://medicine/{medicineId}` → ProductDetail
- `nearnest://support/{ticketId}` → SupportThread
- Universal / App Links for HTTPS variants (Phase 2).

---

## Section 4 — Full User Flows

### 4.1 Flow A — Search medicine → find nearest store
1. User opens app, already signed in, location granted.
2. User taps search bar, types "Dolo 650".
3. Client debounces and calls `searchMedicines({ q, location, radius })`.
4. Function returns canonical medicine + ranked list of nearby in-stock stores (store, distance, ETA, price, Rx flag).
5. User sees "Dolo 650 – 500 mg" card at top and list of 3 stores below.
6. User taps a store row → routed to StoreDetail for that store, pre-scrolled to Dolo 650.
7. Sticky cart bar shows after first add-to-cart.

**Edge cases:** no results → empty state with "Notify me when available" + "Request this medicine". Location denied → prompt to set a manual address; results will use that point.

### 4.2 Flow B — Open medicine → navigate to store
1. User browses Home → taps a nearby store → StoreDetail.
2. Taps a category chip (Medicines) → scrolls to a product → ProductDetail.
3. Reads info, taps **Add to cart**.
4. Sticky cart bar animates; Rx items show the Rx gate block on the detail card.
5. Tapping **View cart** → Cart modal for that store.

**Edge cases:** already has cart items from a different store → switch-store modal. User cancels → no change.

### 4.3 Flow C — Upload prescription → approval
1. User is in Cart with at least one Rx item; the Rx gate block says "Upload prescription".
2. Taps it → chooses Camera / Gallery / PDF.
3. Captures one or more pages; auto-crop + brighten; page reorder + delete.
4. Optional doctor name + date fields.
5. Taps **Submit** → client calls `uploadPrescription({ storeId, pageCount, medicineIds })`.
6. Function creates `prescriptions/{id}` with `state: pending`, returns signed upload URLs.
7. Client uploads each page to Storage.
8. Function trigger `onPrescriptionCreate` → FCM to store staff, in-app notification to user ("Sent — pharmacist reviewing").
9. Store admin (web) opens queue → `reviewPrescription({ id, decision, reason })`.
10. On approve → state `approved`, FCM to user, Rx gate in cart flips from "Pending" to "Approved".
11. On reject → state `rejected` with reason, FCM with next-action hint. User can re-upload; the rejected doc stays archived for audit.

**Edge cases:** upload fails → retry with exponential backoff. User backgrounds the app mid-upload → resume on foreground from the Storage task queue.

### 4.4 Flow D — Order medicine → checkout → payment
1. From Cart with all items ready and any Rx approved, user taps **Checkout**.
2. Checkout modal loads: confirms address, delivery slot (ASAP), payment method.
3. Client calls `computeCartTotal` → server returns signed total + `cartHash`.
4. User taps **Place order** → `createOrder({ cartHash, paymentMethod, addressId })`.
5. Server re-validates (stock, Rx gate, address in service area), reserves inventory in a transaction, creates `orders/{id}` with `status: pending`, creates `payments/{id}` draft, returns provider token.
6. Client opens payment provider SDK sheet.
7. On success: provider webhook → `paymentsWebhook` → marks `payments/{id}.status = captured` and `orders/{id}.status = paid`. FCM to store admin.
8. App also calls `verifyPaymentClient` for UI immediacy; the webhook remains source of truth.
9. Success screen with ETA + "View order".

**Edge cases:** payment fails → order rolls back to `pending` with a 15-min hold; stock remains reserved during that hold. Second attempt allowed. Hold expires → reservation released, order marked `cancelled_no_payment`.

### 4.5 Flow E — Track delivery
1. Store admin marks `packed` on web → order moves to `preparing` → `ready_for_pickup`.
2. `assignDelivery` → status `out_for_delivery`; mobile app's OrderDetail switches to live map.
3. Driver app posts `updateDeliveryLocation` every 10–15s; client listens and animates the pin.
4. ETA chip recomputes server-side using last-known driver location + historical travel time.
5. Driver marks delivered (with POD photo in Phase 2) → status `delivered`.
6. User gets FCM + in-app "Delivered at HH:MM". Order moves to past orders. "Reorder" becomes primary.

**Edge cases:** driver location stale (>60s) → ETA chip shows "Updating…". No driver assigned within 20 min of `ready_for_pickup` → escalates to support and notifies the user.

### 4.6 Flow F — Handle rejection / out of stock
**Rejection (prescription):**
- Pharmacist rejects with reason ("Image not legible", "Expired prescription", "Medicine not on prescription").
- User gets FCM + banner on cart; Rx gate block shows rejection reason and **Upload new**.
- User re-uploads → flow restarts.

**Out of stock (at checkout or after order):**
- At checkout: server returns `OUT_OF_STOCK` with affected SKUs + available quantities. Client shows a modal listing what changed, letting the user accept new quantities, remove items, or cancel.
- Post-order: if store admin can't fulfil, they call `updateOrderStatus({ status: 'out_of_stock' })` per-item or whole-order. Refund path auto-triggers for prepaid amounts. User gets FCM + options: **Switch to substitute** (if offered) / **Refund** / **Cancel**.

---

## Section 5 — Firebase Data Model

Notation: `{placeholder}`. Ownership column: who can write (clients vs Cloud Functions). All timestamps are Firestore server timestamps unless noted.

### 5.1 `users/{uid}`
```
users/{uid}
├── displayName: string
├── email: string (verified: bool)
├── phone: E.164 string (verified: bool)
├── photoUrl: string
├── roles: ['user'|'storeAdmin'|'admin'|'verifier']     // legacy; target = custom claims
├── permissions: string[]
├── defaultAddressId: string | null
├── preferences: { deliveryStrategy, notifications{...}, language }
├── fcmTokens: map/subcol (see below)
├── createdAt, updatedAt
└── subcollections:
    ├── addresses/{addressId}        -> owner write
    ├── fcmTokens/{tokenId}          -> owner write
    └── notifications/{notifId}      -> server-only write
```
**Owner writes:** profile fields, addresses, fcmTokens.
**Server writes:** roles changes (via Cloud Function), notifications subcollection.

### 5.2 `stores/{storeId}` (extends existing)
```
stores/{storeId}
├── name, description, categoryTags[]
├── ownerId, members{uid: true}, membersArr[], visibleTo[]
├── license { number, issuingAuthority, expiresAt }
├── verification { status, reviewedByUid, reviewedAt, documents[] }
├── isVerified: bool
├── location { lat, lng, geohash }
├── address { line1, line2, city, state, pincode }
├── serviceArea { type: 'radiusKm'|'polygon', value }
├── hours { mon: [...], tue: [...], ... }
├── rating { avg, count }
├── capabilities { codAccepted, rxAccepted, scheduledDelivery }
├── createdAt, updatedAt
└── subcollections:
    ├── inventory/{sku}              -> owner/members write
    ├── documents/{docId}            -> existing
    └── verificationLogs/{logId}     -> existing
```
**Client reads:** any signed-in user (filtered by `isVerified && inServiceArea`).
**Client writes:** store owner / members only.

### 5.3 `stores/{storeId}/inventory/{sku}` (new)
```
├── medicineId: ref→medicines/{id}      // canonical
├── name, brand, form, strength, packSize
├── price { mrp, sellingPrice, currency }
├── stock: int
├── reservedStock: int                   // transactional holds during checkout
├── requiresPrescription: bool           // inherited from medicine; override allowed
├── searchTokens[]                       // denormalized for prefix search
├── category, tags[]
├── imageUrls[]
├── batches: [{ batchNo, expiresAt, qty }]   // Phase 2
├── isActive: bool
├── updatedAt
```

### 5.4 `medicines/{medicineId}` (new — canonical catalog)
```
├── name, aliases[], brand, manufacturer
├── salt: string[]                       // active ingredients
├── form: 'tablet'|'syrup'|'cream'|...
├── strength, packSize
├── requiresPrescription: bool
├── schedule: 'H'|'H1'|'X'|null          // Indian drug schedule
├── therapeuticCategory
├── usage, sideEffects, warnings
├── imageUrl
├── searchTokens[]
├── isActive: bool
```
Rationale: `storeInventory` references `medicines` so that search, alternatives, and compliance rules stay consistent across stores.

### 5.5 `prescriptions/{prescriptionId}` (new)
```
├── ownerUid: string
├── storeId: string                      // scope of review
├── state: 'pending'|'approved'|'rejected'|'expired'
├── pagesCount: int
├── storagePathPrefix: 'prescriptions/{uid}/{id}/'
├── doctor { name?, regNo?, clinic? }
├── issuedAt?: timestamp
├── expiresAt?: timestamp
├── coversMedicineIds[]                  // medicines approved by reviewer
├── reviewedByUid?, reviewedAt?, notes?
├── linkedOrderIds[]                     // audit
├── createdAt, updatedAt
```
**Client writes:** create via `uploadPrescription`. `state` never writable by client.
**Server writes:** state, reviewer, linkedOrderIds.

### 5.6 `carts/{uid}` (new)
```
├── storeId: string                      // single-store constraint
├── items: [{ sku, medicineId, qty, priceSnapshot }]
├── updatedAt
```
Ephemeral client-owned; cleared on successful order or after 24h of inactivity (scheduled function).

### 5.7 `orders/{orderId}` (new)
```
├── buyerUid, storeId
├── status: 'pending'|'paid'|'preparing'|'ready_for_pickup'
│         |'out_for_delivery'|'delivered'
│         |'cancelled'|'refunded'|'cancelled_no_payment'|'out_of_stock'
├── items: [{ sku, medicineId, qty, unitPrice, lineTotal, rxPrescriptionId? }]
├── totals: { subtotal, deliveryFee, packagingFee, taxes, discount, grandTotal, currency }
├── cartHash: string                    // signed hash of the contents at checkout
├── addressSnapshot: {...}
├── paymentMethod: 'UPI'|'CARD'|'COD'|...
├── placedAt, updatedAt
├── eta: { placed: ts, packed?: ts, out?: ts, delivered?: ts }
└── subcollections:
    ├── events/{eventId}                -> server-only; append-only audit
    └── messages/{messageId}            -> user ↔ store notes (Phase 2)
```
**Writes:** clients never write directly; only `createOrder` / `updateOrderStatus` / `cancelOrder` Cloud Functions do.

### 5.8 `payments/{paymentId}` (new)
```
├── orderId
├── provider: 'razorpay'|'cashfree'|...
├── providerOrderId
├── providerPaymentId
├── amount, currency
├── status: 'created'|'captured'|'failed'|'refunded'|'partial_refund'
├── idempotencyKey
├── createdAt, capturedAt, refundedAt
├── events[]                            // webhook payload digests
```
**Writes:** Cloud Functions only. Webhook verifies signature.

### 5.9 `deliveries/{deliveryId}` (new)
```
├── orderId
├── driverUid?
├── status: 'unassigned'|'assigned'|'picked_up'|'out_for_delivery'|'delivered'|'failed'
├── driverLocation?: { lat, lng, ts }
├── route?: polyline
├── etaMinutes?: int
├── podPhotoPath?: string               // Phase 2
├── createdAt, updatedAt
```
**Writes:** `assignDelivery` + `updateDeliveryLocation` + `markDelivered` functions.

### 5.10 `notifications/{uid}/items/{id}` (new)
```
├── category: 'order'|'prescription'|'payment'|'promo'|'system'
├── title, body
├── deepLink: string
├── readAt?: timestamp
├── payloadRefs: { orderId?, prescriptionId?, ticketId? }
├── createdAt
```

### 5.11 `supportTickets/{ticketId}` (reuse + extend)
```
├── ownerUid, storeId?, orderId?, category
├── status: 'open'|'awaiting_user'|'awaiting_support'|'resolved'|'closed'
├── subject, lastMessageAt
└── subcollections:
    └── messages/{messageId}
```

### 5.12 Relationships at a glance
```
users ─┬─< orders >──┬─< payments
       │             ├─< deliveries
       │             └─< events
       ├─< carts (1:1)
       ├─< prescriptions >── reviewed by storeAdmin (users)
       ├─< fcmTokens
       ├─< addresses
       └─< notifications.items

stores ─┬─< inventory (by SKU, refs medicines)
        ├─< documents / verificationLogs  (existing)
        └─< orders (by storeId on each order)

medicines ─< inventory.medicineId (1:N across stores)
          ─< prescriptions.coversMedicineIds[] (N:N)
```

### 5.13 Indexes (MVP shortlist)
- `inventory`: `(storeId, medicineId, isActive)`, `(storeId, category, popularityScore desc)`.
- `orders`: `(buyerUid, placedAt desc)`, `(storeId, status, placedAt desc)`.
- `prescriptions`: `(ownerUid, state, createdAt desc)`, `(storeId, state, createdAt desc)`.
- `stores`: geohash-prefix index for nearby queries.
- `supportTickets`: `(ownerUid, status, lastMessageAt desc)`.

---

## Section 6 — Cloud Functions Needed

All Rx / order / payment / role changes run through Cloud Functions. Clients never bypass.

### 6.1 Search & discovery
- **`searchMedicines(q, location, radius, filters)`** — Aggregates across `medicines` + nearby stores' `inventory`; returns ranked list by (distance, ETA, price). Caches popular queries 60s.
- **`nearbyStores(location, radius, filters?)`** — Geohash query on `stores`, filters by `isVerified && serviceArea`.
- **`placesSearch(q, location)`** — Proxy to Google Places; keeps key server-side; rate-limited per uid.
- **`geocode(address)`** / **`reverseGeocode(lat,lng)`** — server-proxied Geocoding API.

### 6.2 Prescription lifecycle
- **`uploadPrescription({ storeId, pagesCount, medicineIds })`** — creates doc, returns signed upload URLs; pending.
- **`reviewPrescription({ prescriptionId, decision, notes, coversMedicineIds })`** — store-admin+; transitions state.
- **`expirePrescriptions`** (scheduled hourly) — moves expired prescriptions to `expired`.
- **`onPrescriptionCreate`** (Firestore trigger) — FCM to store staff.
- **`onPrescriptionStateChange`** — FCM to owner; relinks affected cart/order.

### 6.3 Cart & orders
- **`computeCartTotal({ storeId, items })`** — server-canonical totals, returns signed hash.
- **`createOrder({ cartHash, paymentMethod, addressId })`** — transactional: re-validate stock, reserve inventory, check Rx, write order + draft payment.
- **`cancelOrder({ orderId, reason })`** — user (before `preparing`) or admin; releases reservations; triggers refund if paid.
- **`updateOrderStatus({ orderId, newStatus, note? })`** — store-admin+/driver; validated state machine.
- **`reorderFromOrder({ orderId })`** — builds a new cart from past order at current prices/stock.
- **`onOrderStateChange`** (trigger) — fan-out FCM + event row.

### 6.4 Payments
- **`createPaymentOrder({ orderId })`** — creates provider order; returns provider token.
- **`paymentsWebhook`** (HTTP) — signature-verified; transitions `payments/` + `orders/`.
- **`verifyPaymentClient({ orderId, providerPaymentId })`** — client-initiated reconciliation fallback.
- **`refundPayment({ paymentId, amount?, reason })`** — admin-or-store; partial/full.
- **`reconcilePayments`** (scheduled) — resolves pending payments older than 15 min.

### 6.5 Delivery
- **`assignDelivery({ orderId, driverUid })`** — store-admin-only.
- **`updateDeliveryLocation({ deliveryId, lat, lng })`** — driver-only (uid check).
- **`markDelivered({ deliveryId, podPhotoPath? })`** — driver-only; transitions order.
- **`unassignDelivery`** — store-admin; reverts state.

### 6.6 Notifications
- **`sendNotification({ uid?, topic?, payload })`** — internal; only callable from other functions.
- **`registerFcmToken({ token, platform })`** — self-only; dedupes on token.
- **`onOrderStateChange` / `onPrescriptionStateChange`** — already listed; call `sendNotification`.

### 6.7 Admin & roles
- **`setUserRole({ uid, role })`** — admin-only; sets custom claims.
- **`toggleStoreVerification({ storeId, status, note })`** — verifier/admin; writes to verificationLogs.
- **`impersonateForSupport({ uid })`** (Phase 2) — admin-only, audit-logged.

### 6.8 Support
- **`createSupportTicket({ category, subject, orderId? })`** — self.
- **`postSupportMessage({ ticketId, body, attachments? })`** — self / support.
- **`closeSupportTicket({ ticketId })`** — support.

### 6.9 Housekeeping (scheduled)
- **`expireStaleCarts`** — cart idle >24h.
- **`releaseStaleReservations`** — inventory `reservedStock` without a paid order.
- **`recomputePopularity`** — daily, updates `inventory.popularityScore` for ranking.
- **`rotateFcmTokens`** — prune tokens unused >60d.

---

## Section 7 — MVP vs Phase 2

### MVP (first shippable mobile app — "can you buy a medicine and get it delivered?")
- [ ] Auth: email/password + email verify + forgot password
- [ ] Profile setup + at least one saved address
- [ ] Location permission + manual address fallback
- [ ] Home list + map toggle (static polyline only)
- [ ] Store detail + product detail
- [ ] Global medicine search (Firestore prefix index)
- [ ] Cart (single-store) + server-computed totals
- [ ] Prescription upload + approval flow (per-store scope)
- [ ] Checkout + one payment provider (UPI + card) + COD toggle
- [ ] Order placement, state machine, order detail with status stepper
- [ ] FCM push + in-app inbox (minimum: order + prescription categories)
- [ ] Support ticket create + chat (reuse web)
- [ ] App Check enabled before public release
- [ ] Crash + analytics (Crashlytics + minimal events)

### Phase 2 (enhancements)
- Live driver map + ETA + driver app surface
- Phone OTP auth + biometric unlock
- Caretaker / dependent profiles
- Fuzzy search (Algolia / Typesense)
- Scheduled delivery slots, recurring orders, subscriptions
- Promotions + coupons + wallet credits
- Reviews + ratings
- Reorder from past orders one-tap
- Alternative-medicine suggestions (same salt)
- Masked call (store + driver)
- POD photo + contactless delivery toggle
- Batch / expiry-aware inventory
- Refund self-serve wizard
- Multi-provider payment fallback
- Cross-store prescription reuse (with re-validation policy)
- Dark mode
- Localization (at minimum: Hindi + one regional)
- Web PWA parity for customer surface

---

## Section 8 — Risks & Missing Pieces

### 8.1 Architectural decisions still open
1. **expo-router vs React Navigation** — lean expo-router for cleaner deep links, but confirm before scaffold.
2. **Firebase JS SDK vs `@react-native-firebase`** — JS SDK for parity with web & simpler Expo setup; native SDK for better offline + FCM ergonomics. Current lean: **JS SDK + `expo-notifications` for FCM**. Confirm.
3. **Custom claims vs `users.roles[]`** — today roles are in Firestore. Migrating to custom claims is safer for rules but needs a function to set + a client refresh. Plan migration; keep hybrid read during transition.
4. **Payments provider** — Razorpay / Cashfree / Stripe India. Impacts SDK size, payout cycle, KYC. **Decision needed before checkout is built.**
5. **Places proxy location** — same `functions/` codebase as orders, or a separate `functions-proxy/` for rate-limit isolation? Lean same codebase with per-function rate limiting.
6. **Data Connect adoption** — stays deferred (per D-004). Revisit for analytics only.
7. **Search backend for MVP** — Firestore prefix index (`searchTokens[]`) is fine for low-catalog, weak on typos. If catalog >20k SKUs or typo-tolerance matters at launch, switch to Algolia/Typesense pre-MVP.
8. **Per-store vs cross-store prescription scope** — MVP default: per-store. Simpler trust model; user uploads once per store. Revisit for UX win.

### 8.2 What's unclear from current repo state
- `functions/` has only `helloWorld`. **Every Cloud Function listed in §6 is unwritten.** Mobile cannot ship ahead of them.
- `inventory`, `orders`, `payments`, `deliveries`, `prescriptions`, `medicines` collections don't exist yet in rules or code. Website team must author rules + indexes in coordination.
- Google Maps/Places key strategy (per-platform restriction) and Firebase App Check registration are not set up in this repo.
- No test harness — neither the web (`package.json` has no `test` script) nor a mobile one yet. TDD skill can't run.
- Committed secrets (`serviceAccountKey.json`, `.env`, `.env.local`) at repo root — **must be rotated + gitignored before the mobile app ships**.

### 8.3 What could break (top risks)
1. **Client-side totals trust.** If any flow lets the client set `totals.grandTotal`, we lose money. Mitigation: every total from `computeCartTotal`; `createOrder` re-computes and rejects mismatch.
2. **Prescription bypass.** A missed rule on `orders/{id}.items[].rxPrescriptionId` → Rx delivered without approval. Mitigation: `createOrder` enforces + `security-compliance-reviewer` gates every release.
3. **Stock oversell during concurrent checkout.** Two users racing on last unit. Mitigation: `createOrder` uses a Firestore transaction on `inventory.stock` + `reservedStock`.
4. **Driver location spoofing.** Driver sets fake coordinates. Mitigation: allow only assigned driver uid; server sanity-check speed/distance between updates; Phase 2 can add device attestation.
5. **Webhook replay / duplicate payment.** Mitigation: idempotency keys on `payments/{id}` + signature-verified webhook.
6. **FCM token fanout on shared devices.** A device signing out then another user in gets the old user's notifications. Mitigation: `registerFcmToken` dedupes per token and unlinks on sign-out.
7. **Map API key leak.** If keys ship in the Expo bundle without restrictions, they'll be abused. Mitigation: per-platform restriction to bundle ID; Places routed through `placesSearch` function; Maps SDK key limited to map rendering only.
8. **App Check delays to enable.** Launching without App Check exposes rules/functions to bots. Mitigation: enable in a "soft" mode on day 1, flip to enforcing before public marketing.
9. **Offline-first expectations.** Users will open the app with no signal. Firestore offline persistence helps, but orders/payments must never be created offline. Mitigation: gate checkout behind network check; queue cart edits.
10. **Operational: no store staff mobile UI for MVP.** Approvals + order management stay on web. If a store doesn't keep the web dashboard open, SLAs slip. Mitigation: FCM to store admin + minimum viable store-admin mobile view in Phase 2.

### 8.4 Non-technical risks
- **Regulatory (Rx):** Indian drug-sale regulations evolve; schedule-H/H1/X handling must be reviewed by legal before launch. Surfaces that need legal sign-off: prescription UX, audit trail retention, doctor details capture.
- **Brand trust:** The app must feel clinical, not like a general marketplace, or users won't trust it with medicine. Mitigation: adhere strictly to `docs/DESIGN_SYSTEM.md`.

### 8.5 Shovel-ready next steps (in order)
1. Resolve the open decisions in §8.1 (stack, payments, claims).
2. Have the backend team stub the Cloud Functions in §6 with no-op implementations so rules + schemas can be written and the mobile app can be built against a canonical contract.
3. Draft Firestore rules for the new collections + submit to the website team for review (do NOT edit `firestore.rules` from the mobile side).
4. Only then: scaffold Expo in `apps/mobile/` (after user go-ahead) and start building MVP screens from §2 / §3.
