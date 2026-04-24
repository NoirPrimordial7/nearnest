# Nearnest Mobile App - Product & System Design

_Living planning doc. Updated 2026-04-24 after product priority reset; MVP scope reconfirmed 2026-04-24._

## Canonical MVP definition (reconfirmed 2026-04-24)

The Nearnest mobile MVP does exactly five things. If a proposed feature does not serve one of these bullets, it is Phase 2 / optional and must not be built into MVP.

- **Find a medicine.**
- **Show nearby stores that have it.**
- **Show store details and availability.**
- **Guide / navigate the user to the store.**
- **Let the user call / contact the store.**

Delivery, cart, checkout, payment, order tracking, and the prescription delivery flow are **Phase 2 / optional**, not MVP. Earlier decisions about commerce (D-005 order/payment gating, D-006 Rx delivery gate, D-010 Razorpay, D-014 per-store Rx) stay on the books as Phase 2 extension points; they do not shape the first shippable mobile app.

## Section 1 - Product Vision

### What Nearnest mobile does in MVP
Nearnest mobile helps a customer answer one urgent question: **which nearby verified store has the medicine I need right now, and how do I get there or contact them?**

The MVP is a discovery and navigation product, not a delivery marketplace. A user searches for a specific medicine or salt, sees nearby verified stores that have it in stock, compares distance/open status/contact details, opens a map route, and can call or contact the store. The app should feel fast, clinical, and trustworthy.

### What is not MVP
The following are deliberately out of MVP and move to Phase 2:
- Cart
- Checkout
- Payment
- Order placement
- Delivery tracking
- Driver assignment
- Prescription upload/approval as a transaction gate

Architecture decisions D-005, D-006, D-010, and D-014 remain useful for future commerce. They should not drive MVP scope. In this discovery MVP, Rx state is informational: the app can label prescription-required medicines and tell users to call/visit the store with a valid prescription, but it must not implement prescription review, checkout, or delivery.

### Core value
- "Find my medicine nearby and get directions."
- Real availability from verified stores, not a generic catalog.
- Fast comparison by distance, open state, price, and contactability.
- Store-first flow: search -> available stores -> store detail -> call or navigate.

### Target users
1. **Primary - Retail customer / patient**
   - Needs a specific medicine quickly.
   - Wants to know which nearby store actually has it before traveling.
   - Needs call and navigation actions, not delivery.
2. **Secondary - Caretaker**
   - Finds medicine for a family member.
   - Wants confidence, store contact, directions, and a saved address/search area.
3. **Phase 2 - Buyer**
   - Wants in-app cart, payment, delivery, order tracking, and prescription approval.

## Section 2 - Feature Breakdown

### 2.1 Authentication
**MVP priority:** Required if backend requires signed-in access to stores/search; otherwise can be soft-gated after first launch.

- Purpose: identify the user for saved location, recent searches, contact preferences, and future Phase 2 readiness.
- UI: splash, welcome, sign in, sign up, email verification, forgot password.
- Interactions: email/password auth, resend verification, password reset.
- Backend: Firebase Auth, `onUserCreate` for `users/{uid}`.
- Phase 2: phone OTP, biometric unlock, deeper profile.

### 2.2 Location + Search Area
**MVP priority:** Critical.

- Purpose: anchor medicine availability to where the user is willing to travel.
- UI: location permission primer, manual address/search-area picker, saved addresses.
- Interactions: use current location, search place, drag map pin, save address/search area.
- Backend: `placesSearch`, `placeDetails`, `geocode`, `reverseGeocode`, optional `nearbyStores`.
- Rule: location is for discovery and directions, not delivery availability in MVP.

### 2.3 Medicine Search
**MVP priority:** Core.

- Purpose: let the user search brand, generic, salt, form, and strength.
- UI: global search input, recent searches, suggestions, filters, result groups.
- Interactions: debounce 250ms, minimum 2 chars, filters for Rx/OTC/open now/radius.
- Backend: `searchMedicines` callable behind Firestore `searchTokens[]` per D-013.
- Result shape: medicine plus nearby store availability rows.

### 2.4 Availability
**MVP priority:** Core.

- Purpose: show which stores have the medicine and enough detail to choose one.
- UI: availability rows with store name, verified badge, distance, open state, price, stock confidence, call and navigate affordances.
- Interactions: tap row to Store detail, call directly, open navigation, save store.
- Backend: `stores/{storeId}`, `stores/{storeId}/inventory/{sku}`, `medicines/{medicineId}`.
- Important: do not imply stock is guaranteed unless backend provides a freshness timestamp. Show "updated X min ago" when available.

### 2.5 Map + Navigation
**MVP priority:** Core.

- Purpose: guide the user to the chosen store.
- UI: Home map, store pins, selected store sheet, Store detail mini-map, route/open-in-maps action.
- Interactions: map/list toggle, recenter, search this area, open Google Maps/Apple Maps directions.
- Backend: `nearbyStores`, store location/geohash, Maps SDK key, Places proxy for address search.
- Phase 2: live delivery map.

### 2.6 Store Detail
**MVP priority:** Core.

- Purpose: present trust, availability, store contact, and navigation.
- UI: store header, verified badge, license hint, address, hours, distance, contact actions, mini-map, available medicines/products list.
- Primary CTA: "Navigate".
- Secondary CTA: "Call store".
- Backend: `stores/{storeId}`, `stores/{storeId}/inventory`, optional support/contact metadata.

### 2.7 Product / Medicine Detail
**MVP priority:** Important.

- Purpose: show medicine facts and nearby availability.
- UI: medicine name, salt, form, strength, pack size, Rx badge, safety notes, nearby available stores.
- Primary CTA: choose an available store -> Store detail.
- Secondary CTA: call store or navigate from availability row.
- Backend: `medicines/{medicineId}`, inventory availability.

### 2.8 Contact Store
**MVP priority:** Core.

- Purpose: let users confirm availability or ask store-specific questions before traveling.
- UI: call button, optional WhatsApp/message link if store profile has it, contact hours/availability.
- Backend: store phone/contact fields. A `callStore` masking proxy can be Phase 2; MVP may use the store's public number if approved by policy.
- Safety: do not expose private owner phone unless it is intended as public store contact.

### 2.9 Notifications
**MVP priority:** Optional.

- Purpose: later support saved-search alerts and requested-medicine updates.
- MVP: can be omitted unless backend has a ready "notify me" flow.
- Phase 2: FCM token registration, notifications inbox, saved search alerts.

### 2.10 Profile
**MVP priority:** Useful but lightweight.

- Purpose: manage identity, saved addresses/search areas, recent searches, and contact preferences.
- UI: avatar/name/email, saved addresses, recent searches, support/legal, sign out.
- Backend: `users/{uid}`, `users/{uid}/addresses`.
- Remove checkout/delivery preferences from MVP; keep "preferred search radius" and "open maps app" preference if needed.

### 2.11 Cart, Checkout, Payment, Orders, Delivery
**MVP priority:** Not in MVP.

- Phase 2 only.
- Existing decisions remain extension points:
  - D-005: protected writes through Cloud Functions.
  - D-006/D-014: Rx approval for order/delivery flows.
  - D-010: Razorpay when payment enters scope.
- Do not create mobile routes, UI, or local state for these during the discovery MVP.

## Section 3 - Navigation Architecture

### 3.1 MVP route model
Use expo-router per D-007 when scaffolding is approved.

```
Root
|-- (auth)
|   |-- splash
|   |-- welcome
|   |-- sign-in
|   |-- sign-up
|   |-- verify-email
|   `-- forgot-password
`-- (tabs)
    |-- home
    |-- search
    |-- map
    `-- profile
```

Shared stack screens:
- `store/[storeId]`
- `medicine/[medicineId]`
- `address-picker`
- `contact-store/[storeId]` if a dedicated contact screen is needed; otherwise use native call links from Store detail.

### 3.2 MVP tabs
| Tab | Purpose |
|-----|---------|
| Home | Nearby verified stores and quick search |
| Search | Medicine search and results |
| Map | Spatial store discovery and navigation |
| Profile | Account, saved addresses, recent searches |

No Cart, Orders, Prescriptions, Checkout, or Delivery tabs in MVP.

### 3.3 Deep links
- `nearnest://store/{storeId}` -> Store detail
- `nearnest://medicine/{medicineId}` -> Medicine detail
- `nearnest://search?q={query}` -> Search results
- `nearnest://map?storeId={storeId}` -> Map selected store

Phase 2 deep links:
- `nearnest://order/{orderId}`
- `nearnest://prescription/{prescriptionId}`
- `nearnest://support/{ticketId}`

## Section 4 - User Flows

### 4.1 Primary flow - search medicine -> find store -> navigate
1. User opens the app.
2. User grants location or picks a search area manually.
3. User searches for a medicine, brand, or salt.
4. App calls `searchMedicines({ q, location, radius, filters })`.
5. Results show the medicine and stores that have it, sorted by nearest/fastest/open now.
6. User taps a store availability row.
7. Store detail shows availability, address, hours, contact, verified badge, and map.
8. User taps **Navigate**.
9. App opens the user's maps app with the store destination.

### 4.2 Secondary flow - call store
1. User finds a store in Search results, Home list, Map, or Store detail.
2. User taps **Call store**.
3. App opens native dialer with the public store contact number.
4. If the store phone is missing, show fallback: "Contact unavailable" and offer navigation or support/report issue.

### 4.3 Browse nearby stores
1. User opens Home.
2. App loads nearby verified stores from `nearbyStores`.
3. User switches List/Map view.
4. User opens Store detail.
5. User searches within store inventory or browses categories.
6. User navigates or calls.

### 4.4 Medicine detail -> available stores
1. User taps medicine result.
2. Medicine detail shows form, strength, salt, Rx requirement, safety notes, and nearby availability.
3. User chooses a store row.
4. User calls or navigates.

### 4.5 No result / unavailable flow
1. Search returns no stores with current stock.
2. App suggests widening radius, changing search terms, or calling nearby verified stores.
3. Optional Phase 2 action: "Notify me when available" or "Request this medicine".

## Section 5 - Firebase Data Model For Discovery MVP

### 5.1 Needed for MVP
- `users/{uid}`: profile, preferences, recent/saved search metadata if persisted.
- `users/{uid}/addresses/{addressId}`: saved search areas/addresses.
- `stores/{storeId}`: name, verified status, public contact, address, location/geohash, hours, license/verification signal.
- `stores/{storeId}/inventory/{sku}`: medicineId, name, price, stock/availability, updatedAt, isActive, requiresPrescription.
- `medicines/{medicineId}`: canonical medicine facts, aliases, salt, form, strength, Rx flag, searchTokens.

### 5.2 Optional for MVP
- `notifications/{uid}/items/{id}` and `users/{uid}/fcmTokens/{tokenId}` only if "notify me" ships.
- `supportTickets` only if in-app support ships; otherwise store contact/report issue can be deferred.

### 5.3 Phase 2 data
- `carts/{uid}`
- `orders/{orderId}`
- `orders/{orderId}/events`
- `payments/{paymentId}`
- `deliveries/{deliveryId}`
- `prescriptions/{prescriptionId}` as an approval workflow

Keep schemas documented in backend contracts for future commerce, but do not require them for discovery MVP.

## Section 6 - Backend Functions Needed

### 6.1 Required for MVP
- `searchMedicines(q, location, radius, filters)` - returns medicine plus ranked store availability.
- `nearbyStores(location, radius, filters?)` - returns verified nearby stores.
- `placesSearch(q, location?)` - Places autocomplete proxy.
- `placeDetails(placeId)` - resolve selected place.
- `geocode(address)` and `reverseGeocode(location)` - address/search-area support.
- Optional `reportInventoryIssue({ storeId, sku, note })` if users can report stale stock.

### 6.2 Nice-to-have for MVP
- `registerFcmToken` and `sendNotification` only if saved-search alerts ship.
- `createSupportTicket` only if support/reporting is in MVP.

### 6.3 Phase 2 functions
- `computeCartTotal`
- `createOrder`
- `cancelOrder`
- `updateOrderStatus`
- `createPaymentOrder`
- `paymentsWebhook`
- `verifyPaymentClient`
- `refundPayment`
- `uploadPrescription`
- `reviewPrescription`
- delivery functions

## Section 7 - MVP vs Phase 2

### MVP - discovery/navigation
- [ ] Auth: email/password, email verification, forgot password.
- [ ] Lightweight profile and saved search areas/addresses.
- [ ] Location permission and manual location fallback.
- [ ] Medicine search by brand/salt/form/strength.
- [ ] Search results showing nearby stores with availability.
- [ ] Nearby store list.
- [ ] Nearby store map.
- [ ] Store detail with verified status, address, hours, availability.
- [ ] Medicine detail with Rx badge and nearby availability.
- [ ] Call store using approved public contact.
- [ ] Open native maps navigation to store.
- [ ] Optional: report stale availability.
- [ ] Optional: notify me / saved search alerts if backend is ready.
- [ ] App Check and key restrictions before public launch.

### Phase 2 - commerce/delivery
- Cart and checkout.
- Prescription upload, review, and approval gate.
- Razorpay payment.
- Order creation and status tracking.
- Delivery assignment and live tracking.
- Notifications inbox for orders/prescriptions/payments.
- Support chat tied to orders.
- Reorder, refunds, coupons, scheduled delivery, driver app.

## Section 8 - Risks & Guardrails

### 8.1 MVP risks
1. **Stale availability.** Show `updatedAt` and let users call the store. Avoid "guaranteed in stock" language unless backend enforces freshness.
2. **Bad store contact data.** Store phone/contact must be verified or intentionally public.
3. **Map key exposure.** Places stays server-side per D-011; Maps rendering keys must be platform-restricted.
4. **Search quality.** Firestore prefix search has no typo tolerance. Mitigate with aliases/salts and clear empty states.
5. **Regulated medicine trust.** Rx badge is informational in discovery MVP; do not imply the app can authorize dispensing.

### 8.2 Architecture flexibility for Phase 2
- Keep service wrappers separated: search, stores, maps, contact, auth.
- Do not create cart/order/payment state in MVP screens.
- Keep backend contracts for orders/payments/prescriptions as future references.
- If Phase 2 starts, run security/compliance review before implementing Rx, order, payment, or delivery flows.

### 8.3 Repo guardrails
- Do not scaffold Expo until explicit go-ahead.
- Do not edit `src/**`, `functions/**`, `dataconnect/**`, Firebase rules/config, package files, env files, or `apps/mobile/**` during planning.
- Keep committed secrets (`serviceAccountKey.json`, `.env`, `.env.local`) flagged for rotation and history purge by the website team.
