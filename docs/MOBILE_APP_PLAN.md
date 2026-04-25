# Medifind Mobile App (a Nearnest product) - Product & System Design

_Living planning doc. **Latest authoritative section: "Discovery Redesign 2026-04-25" at the bottom of this file.** Sections above remain valid for the auth/Rx doctrine and the canonical MVP definition; the discovery flow (search → results → medicine detail → nearby stores → store detail) is now defined by the redesign at the bottom. When a redesign section conflicts with an earlier section, the redesign wins._

## Branding (2026-04-24)

- **Platform / parent company:** Nearnest. Everything server-side (Firebase project, Cloud Functions codebase, Firestore, web portal for stores + admins + verifiers + support) stays under the Nearnest name.
- **Customer-facing mobile app:** **Medifind**. App Store listing name, app icon, wordmark, onboarding copy, and in-app voice all carry the Medifind identity.
- **Relationship surfaced to users:** Medifind app may occasionally show a subtle "by Nearnest" mark in About / legal screens to establish provenance and trust. It is not shown on primary surfaces.
- **Store-facing surfaces stay Nearnest.** The web portal, pharmacist approval UI, verification screens, and support portal remain "Nearnest" in branding — stores onboard with Nearnest, customers discover with Medifind.
- **Scope of the rename:** only the customer mobile app and its docs. Repository name, Firebase project, `functions/`, web portal, rules, and infra naming do NOT change.

## Canonical MVP definition (reconfirmed 2026-04-24)

The Nearnest mobile MVP does exactly five things. If a proposed feature does not serve one of these bullets, it is Phase 2 / optional and must not be built into MVP.

- **Find a medicine.**
- **Show nearby stores that have it.**
- **Show store details and availability.**
- **Guide / navigate the user to the store.**
- **Let the user call / contact the store.**

Delivery, cart, checkout, payment, order tracking, and the prescription delivery flow are **Phase 2 / optional**, not MVP. Earlier decisions about commerce (D-005 order/payment gating, D-006 Rx delivery gate, D-010 Razorpay, D-014 per-store Rx) stay on the books as Phase 2 extension points; they do not shape the first shippable mobile app.

## Section 1 - Product Vision

### What Medifind does in MVP
Medifind helps a customer answer one urgent question: **which nearby verified store has the medicine I need right now, and how do I get there or contact them?**

The MVP is a discovery and navigation product, not a delivery marketplace. A user searches for a specific medicine or salt, sees nearby verified stores (Nearnest-verified stores) that have it in stock, compares distance/open status/contact details, opens a map route, and can call or contact the store. The app should feel fast, clinical, and trustworthy.

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
**MVP priority:** Required. Firebase Authentication is part of the discovery MVP. A mobile user must be signed in and have a minimal profile in `users/{uid}` before reaching Home.

- **MVP providers (must ship together):**
  - **Email / password** (with email verification).
  - **Google sign-in** (Google provider via Firebase Auth; uses `expo-auth-session` / Google provider wrapper when scaffold is approved).
- **Phase 2 providers:** phone OTP, biometric unlock, Apple sign-in if iOS compliance requires it.
- **Profile requirement:** Every mobile user must have a `users/{uid}` Firestore document with at minimum: `displayName`, `email`, `emailVerified`, `photoUrl?`, `authProvider: 'password' | 'google.com'`, `preferences`, `createdAt`, `updatedAt`. `onUserCreate` Auth trigger initialises this doc; Profile setup completes it before the user lands on Home.
- UI: splash, welcome, sign in (email + "Continue with Google"), sign up, email verification, forgot password, profile setup.
- Interactions: email/password auth, Google OAuth flow, resend verification, password reset, link-account path if a Google email collides with an existing email/password account.
- Backend: Firebase Auth (email/password + Google provider enabled in console), `onUserCreate` writes `users/{uid}`, mobile client reads/updates whitelisted profile fields directly; roles remain server-only via `setUserRole` (D-009).
- Non-goals for MVP: phone OTP, biometric unlock, caretaker/dependent profiles, multi-tenant admin mobile surface.

### 2.1.1 Prescription-required medicines in discovery MVP

Nearnest shows Rx medicines during discovery without becoming a dispensing gate. The doctrine for MVP:

- **Allowed.** Search, list, view, and navigate to stores that carry prescription-required medicines. Rx medicines appear in search results, store inventories, and medicine detail exactly like OTC items for the purpose of *finding the store*.
- **Required.** Every Rx medicine — in search results, availability rows, store inventories, and medicine detail — must carry a strong, unmissable **"Prescription required"** badge + warning block. Use the Rx palette tokens from `docs/DESIGN_SYSTEM.md` §7 (`--color-rx-*`). The warning copy is short, clinical, and informational: "Prescription required. Please carry a valid prescription when you visit or call the store."
- **Blocked in MVP.** No reserve, no hold, no order, no delivery, no prescription upload, no pharmacist approval flow, no Rx-approval state in the client. The MVP app cannot initiate any transaction that would dispense an Rx medicine.
- **Also blocked in MVP.** No medical advice, no dosage guidance, no "how to take", no symptom checker, no side-effect copy, no contraindication copy, no substitution advice. Even if the canonical `medicines/{id}` document carries `usage` / `sideEffects` / `warnings` fields, the mobile app must NOT render them. Only the non-medical facts (name, salt, form, strength, pack size, Rx badge) and nearby availability may be shown.
- **Guidance when the user taps anything that looks like "get this".** The CTA is **"Navigate to store"** or **"Call store"** — never "Reserve", "Order", "Add to cart", "Request", "Buy". Empty-state copy on Rx items: "Please contact the store directly for availability and to confirm your prescription."
- **Copy guardrail.** The app does not say a medicine is safe, appropriate, or recommended for anyone. It only says which stores nearby carry it.

D-006, D-010, and D-014 stay on the books as Phase 2 extension points. Do not build any of their flows into MVP.

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

- Purpose: show **non-medical** medicine facts and nearby availability. Do NOT act as a medical information screen.
- UI allowed: medicine name, aliases, salt, form, strength, pack size, manufacturer (optional), strong Rx badge + warning block when `requiresPrescription` is true, nearby available stores.
- UI forbidden in MVP: dosage, "how to take", usage notes, side effects, warnings beyond the Rx-required notice, contraindications, age/weight guidance, substitution advice, ratings/reviews.
- Primary CTA: choose an available store -> Store detail.
- Secondary CTA: call store or navigate from availability row.
- Backend: `medicines/{medicineId}` (read name/salt/form/strength/packSize/requiresPrescription only; ignore `usage`, `sideEffects`, `warnings` in MVP), inventory availability.
- See §2.1.1 for the Rx doctrine this screen must follow.

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

---

# Discovery Redesign 2026-04-25 (authoritative)

This section supersedes the discovery / search / results / medicine / store screens above. Auth, Rx doctrine, canonical MVP, and Phase 2 exclusions remain unchanged. Detailed screen specs for the redesign live in `docs/MOBILE_UI_SCREEN_SPECS.md` under the matching "Discovery Redesign 2026-04-25" appendix.

## Product Thesis

> Medifind is the fastest way to know **which nearby pharmacy actually has the medicine you need right now**, and to **call or walk to it before you leave the house**. It is not a delivery marketplace. It is not a doctor. It is the answer to one question: *is it nearby and is it in stock?*

The user's job-to-be-done: *"My family member needs this medicine. I don't want to drive to three shops. I don't want to wait two hours for delivery. I want to see — right now — which nearby pharmacy has it, then either call to confirm or walk over."*

Two browse modes serve that thesis:
- **Medicine mode** (default) — start from "what do I need", end at "which nearby store has it".
- **Medical Stores mode** — start from "which pharmacies are near me", end at "what does this one stock".

## Phase 0: Thinking

### 0.1 Personas (concrete, not generic)

**Persona A — Urgent caregiver (Asha, 38, Bangalore).**
Her mother woke up at 11:42 pm with high fever. The local pharmacy 200 m away closed at 11 pm. She needs Crocin Advance + ORS within 20 minutes. She is panicked, on a 2-year-old budget Android phone (4 GB RAM), one-handed, in a dim room, and her data is throttled because she's already used 6 GB this month. She fears wasting time at a closed shop, getting the wrong strength, or paying ₹150 for delivery that takes 90 minutes. **What earns trust in 5 seconds:** real-time open/closed state, a phone number she can tap, a verified-pharmacy badge, and the words "in stock as of 11:38 pm".

**Persona B — Chronic-condition patient on monthly repeat (Ravi, 62, Pune).**
He has type-2 diabetes and BP. He buys the same eight items every month — Metformin 500, Glimepiride 1, Telmisartan 40, Ecosprin 75, plus four supplements. He walks slowly. He distrusts new apps. His daughter installed Medifind for him. He wants to keep going to the same shop because the pharmacist knows his name. He fears being shown a different brand, paying more, or having his prescription details on the internet. **What earns trust in 5 seconds:** the name of the pharmacy he already uses, all eight medicines on one screen with green "In stock" tags, large type, no popups, and a single "Call store" button that's bigger than everything else.

**Persona C — Walk-in user with a paper prescription (Priya, 27, Indore).**
She just left the clinic. She has a phone photo of a doctor's prescription with seven items, two of which are illegible. She's never used Medifind. She has 4G but the app has to download. She wants to find a pharmacy within 2 km that has *as many of the seven items as possible* so she only has to make one stop. She fears typing the medicine names wrong or being asked to upload her prescription. **What earns trust in 5 seconds:** typing partial names ("dolo 650", "panto 40") works without autocorrect fighting her, results show how many of her list each store has, no upload required, and "Show me on the map" works on the first tap.

### 0.2 The Sharp Wedge — one sentence

> **Medifind tells you, before you leave the house, which verified pharmacy near you actually has the medicine you need — without making you order, pay, or wait for delivery.**

If anything in the app does not pay rent on that sentence, cut it.

### 0.3 Competitive Teardown

| Product | What's good (steal these) | What's bad (avoid) |
|---|---|---|
| **1mg / Tata 1mg** | (1) Strong product detail page with composition + manufacturer made obvious. (2) "Search a medicine" is the primary surface. | Pushes you toward delivery and prescription upload; product detail is buried under cross-sell offers and review noise. |
| **PharmEasy** | (1) Clean product card grid with consistent imagery. (2) Branded vs generic toggle on detail page is easy to grasp. | The home screen is a marketplace, not a discovery tool; "where" is invisible because everything assumes delivery. |
| **Apollo Pharmacy** | (1) Real store finder with hours + verified-store metadata. (2) Trust visuals — pharmacist face, license number on store pages. | Slow first paint on low-end Android; map UX feels grafted on; non-Apollo stores invisible. |
| **Google Maps** ("pharmacy near me") | (1) Bottom-sheet + list pattern is the right idiom. (2) "Call" and "Directions" are first-class one-tap actions. (3) Hours + busy times establish trust instantly. | Zero awareness of *what's in stock*. Reviews dominate. Generic, not medical. |
| **Blinkit / Zepto** | (1) Live category chip carousel. (2) Recent + popular search shortcuts. (3) Fast type-ahead with image thumbs. (4) Clear in-stock state. | Loud colours, urgency timers, gamified copy — entirely wrong tone for medicine. Shopping psychology, not health. |

**The synthesis:** Maps' trust + Blinkit's speed + 1mg's product depth — all three at the *discovery* layer, none of them at the *transaction* layer.

### 0.4 Search — the seven cases

| Input | Detection rule | Result behaviour | Top-of-list shows |
|---|---|---|---|
| **Exact brand** ("Crocin") | Token match on `medicine.name` | Group A: exact medicine + variants (Crocin Advance, Crocin Pain Relief). Group B: same composition (Paracetamol generics). | The exact medicine card with manufacturer and pack size, then "Available at 7 nearby stores". |
| **Misspelled brand** ("crosin", "dolo650", "dolo 650") | Levenshtein ≤ 2 OR digit-strip match to a `searchTokens[]` entry | Same as exact brand, but with a "Showing results for **Crocin**. Search for **crosin** instead?" inline correction. | Corrected brand result, then alternatives. |
| **Generic / composition** ("paracetamol 500") | Token match on `composition[]` AND optional strength | Group A: branded variants of that composition (Crocin, Calpol, Dolo). Group B: similar compositions. | A "Paracetamol 500 mg" composition header card, then branded options sorted by stock count. |
| **Symptom-led** ("fever medicine", "acidity") | Token match against a `symptomMap` (small curated table — see §0.4.1) | A neutral header reading **"Searches matching 'fever' usually look for:"** followed by 3-5 commonly-bought OTC items. **No medical claim.** | Composition headers and OTC items only. Never an Rx item at the top. |
| **Prescription photo** | n/a in MVP | "Paste or scan a prescription" CTA → label as **v2 only**. | n/a. |
| **Hindi transliteration** ("बुखार", "dard") | Match against a `hindiAliases[]` field on each medicine + symptom map | Same behaviour as symptom-led, with a small "Showing results for **fever**" note. | Same as symptom-led. |
| **Partial / abbreviated** ("azith 500", "panto") | Prefix match on `searchTokens[]` (first 3 chars min) | Show prefix matches grouped by composition. | The most popular completion first ("Azithromycin 500 — Azee"), then runners-up. |

#### 0.4.1 Symptom map — locked decision

The symptom map is a tiny, curated table of OTC-only mappings. It is **not** medical advice. It is search routing, framed as "people searching X usually look at Y". MVP keeps it to seven entries, all OTC, all with the same neutral framing:

| User term | Routes to (compositions) | Framing copy |
|---|---|---|
| fever | Paracetamol 500, Paracetamol 650 | "Searches for **fever** usually look at:" |
| headache | Paracetamol 500, Ibuprofen 400 | "Searches for **headache** usually look at:" |
| body pain / dard | Diclofenac topical, Ibuprofen 400 | "Searches for **body pain** usually look at:" |
| cold / cough | Cetirizine 10, Levocetirizine 5, Dextromethorphan syrup | "Searches for **cold and cough** usually look at:" |
| acidity | Pantoprazole 40, Antacid suspension | "Searches for **acidity** usually look at:" |
| diarrhea / loose motion | ORS, Loperamide | "Searches for **loose motion** usually look at:" |
| allergy | Cetirizine 10, Levocetirizine 5 | "Searches for **allergy** usually look at:" |

If the input matches no symptom and no medicine, fall through to "No match. Try a brand name or composition like *Paracetamol*."

### 0.5 Trust signals — every screen

| Signal | Where it lives | Visual treatment |
|---|---|---|
| Verified pharmacy badge | Store cards, store detail header, store row in nearby-stores sheet, store row in availability list | Solid green pill with a small `✓`, label `Verified`. Always shown for verified stores. Absent for non-verified. |
| License number | Store detail (subdued, below address) | `Drug license: KA-12345/2024`, body-sm muted. Tap reveals the issuing-authority full text. |
| Stock freshness | Every availability row, every in-store inventory row | `In stock · updated 12 min ago`. After 24 h, switch to amber and `Last updated > 1 day ago — call to confirm`. After 72 h, switch to a neutral disclaimer card and the row dims. |
| Rx required | Medicine cards, medicine detail, store inventory rows | Rx pill in `--color-rx-text` on `--color-rx-bg`, label `Rx`. On medicine detail, expand to the full Rx warning block from `docs/DESIGN_SYSTEM.md` §7. |
| "Call to confirm" disclaimer | Permanently visible in the bottom-sheet store list footer and on every medicine detail's availability list footer | One muted line: `Stock can change. Call the store to confirm before you travel.` |
| Nearnest provenance | About / Legal / Help only | "Medifind is part of Nearnest. Stores are verified through Nearnest's licensing review." |
| **No** trust theatre | We do **not** show fake review counts, fake "20 people bought this", urgency timers, "limited stock" flames, or pharmacist photos we don't actually have. | n/a |

### 0.6 Accessibility (locked)

- **Large-type mode.** A user-visible toggle in Profile (`Larger text`) maps to a 1.15× type scale. Layouts must reflow without clipping at this scale up to 200% OS-level dynamic type.
- **High-contrast text by default.** All body copy hits WCAG AA on `--color-bg` and `--color-surface`. We do not use `--color-text-soft` for any *primary* content — only for hints/captions where loss of contrast does not destroy meaning.
- **Icons + words, never icons alone.** Tab bar items, mode toggle items, action buttons all carry text labels under or beside the icon.
- **Low-end Android.** No parallax, no entrance animations longer than 300 ms, no blur effects, no auto-playing video, no Lottie above 60 KB. Initial render budget on Home: ≤ 100 KB JS executed before first paint, no images > 60 KB above the fold.
- **Network resilience.** Every screen defines an explicit offline state and a slow-network state (skeletons + a 4 s "still loading" inline note). No screen is allowed to spin forever.
- **One-handed thumb zone.** Primary CTAs always live in the bottom 25% of the viewport. Search bar at the top is OK because it's reachable by lowering the device, but the *submit* action is also reachable from the keyboard's `return`.
- **Hindi/Marathi readiness.** Data model carries `nameLocalised: { en, hi, mr? }` and `aliases[]`. UI strings are routed through a single `t()` shim now even though we ship English first; this prevents shipping unilingual hardcoded copy.

### 0.7 State matrix — every screen, minimum five states

Every screen in the redesign defines: `loading`, `empty`, `partial-results`, `no-results`, `error`, `offline`, `stale-data` (when stock data > 24 h old), `Rx-required` (when applicable). A screen spec missing more than 2 of these is incomplete and must be returned. Templates for the shared states live in §"Empty / error / offline templates" of the screen specs doc.

### 0.8 Non-goals (what Medifind is NOT)

We have caught ourselves being tempted by all of these. They are **out**:

- No doctor consults. No symptom checker. No "ask a pharmacist" chat.
- No price comparison across stores beyond showing each store's price (we do not score stores by who's cheapest, we score by distance + freshness + open).
- No home delivery. Not even "delivery available at this store" badging — we do not surface a store's delivery capability anywhere.
- No reviews. No ratings. No "stars".
- No loyalty programme, wallet, coins, streaks, badges.
- No upselling, cross-selling, sponsored medicines, paid placement.
- No prescription upload in MVP. (v2 only — reserved as a future "scan to fill" entry to search.)
- No checkout, cart, payment, order tracking.
- No medical advice, dosage, side effects, contraindications. (See Rx doctrine §2.1.1.)
- No store management mobile UI. Store owners and admins use the Nearnest web portal; if they sign in to Medifind mobile they see the customer experience.

### 0.9 Success metrics — what proves it works

These are the only metrics the design optimises for in MVP. We instrument all of them via the telemetry events listed under each screen spec.

1. **Search-to-store-action conversion** = `(store_call_clicked + store_navigate_clicked) / search_submitted` per session. **Target ≥ 35%.** Anything below means people are searching but not finding a satisfying store result.
2. **Time-to-first-store-action** = elapsed time between app open and the first `store_call_clicked` or `store_navigate_clicked`. **P50 ≤ 45 s, P90 ≤ 2 min.** Sub-minute is the wedge against a phone-and-Google-Maps workflow.
3. **Stale-data frustration** = `% of availability views where freshness > 24 h`. **Keep ≤ 15%.** Above that, the in-stock claim is no longer reliable and trust collapses.
4. **No-result rate** = `% of search_submitted where results.length == 0` after typo correction. **Target ≤ 8%.** Above that, the catalog or the typo tolerance is broken.
5. **D1 retention for chronic users (persona B)** = retention of users with ≥ 3 distinct medicines in their last 30-day search history. **Target ≥ 60% D1.** This is the hardest, most valuable user; if they don't return next day, the product isn't sticky.

### 0.10 Telemetry — events emitted

All events are namespaced `medifind.<area>.<event>`. They carry the user uid (when signed in), session id, and a screen id. **No medicine names, no store names, no PII** in the payload — only IDs.

| Event | Where | Payload (beyond default) |
|---|---|---|
| `medifind.app.launch` | every cold start | `auth_state`, `cached_profile`, `cold` |
| `medifind.home.mode_toggle` | mode toggle | `mode` ∈ `medicine` \| `stores` |
| `medifind.search.submitted` | Search | `q_length`, `mode`, `had_correction` |
| `medifind.search.no_results` | Search | `q_length`, `mode` |
| `medifind.search.suggestion_tapped` | Search | `suggestion_kind` ∈ `recent` \| `popular` \| `category` |
| `medifind.results.medicine_viewed` | Results / Home chip | `medicine_id`, `result_group` |
| `medifind.results.similar_tapped` | Medicine detail | `medicine_id`, `similar_id` |
| `medifind.results.find_stores_tapped` | Medicine detail | `medicine_id`, `available_count` |
| `medifind.stores.list_view_open` | Nearby stores sheet | `medicine_id` (nullable in stores mode) |
| `medifind.stores.map_view_open` | Nearby stores sheet | `medicine_id` (nullable) |
| `medifind.stores.store_card_tapped` | Stores list / store detail entry | `store_id` |
| `medifind.stores.store_call_clicked` | Store cards / store detail | `store_id`, `from_screen` |
| `medifind.stores.store_navigate_clicked` | Store cards / store detail | `store_id`, `from_screen` |
| `medifind.store.in_store_search_used` | Store detail in-store search | `store_id`, `q_length` |
| `medifind.category.opened` | Category card | `category_id` |
| `medifind.profile.large_type_toggled` | Profile | `enabled` |
| `medifind.error.shown` | error templates | `screen_id`, `error_code` |
| `medifind.offline.shown` | offline templates | `screen_id` |

Telemetry sink in MVP: console + Firestore ring buffer (`telemetry/{uid}/events`) capped at the last 200 events. Production sink (Cloud Functions → BigQuery) is a Phase 2 task; the schema is fixed today so the sink swap is a one-line change.

## Data Model (mock-data shape, MVP)

These are TypeScript-style shapes consumed by the redesigned screens. Mock data lives under `apps/mobile/services/mockDiscovery/` (existing folder). Backend wiring later replaces these in place. The shapes intentionally match `docs/FIRESTORE_SCHEMA_CONTRACT.md` so the swap is mechanical.

```ts
type LocaleCode = 'en' | 'hi' | 'mr';

type Composition = {
  id: string;                 // 'comp_paracetamol_500'
  name: string;               // 'Paracetamol 500 mg'
  saltKey: string;            // 'paracetamol' (for similarity grouping)
  strengthMg?: number;        // 500
  form: MedicineForm;         // see below
};

type MedicineForm =
  | 'tablet' | 'capsule' | 'syrup' | 'suspension' | 'injection'
  | 'ointment' | 'cream' | 'drops' | 'inhaler' | 'powder' | 'sachet';

type Manufacturer = {
  id: string;                 // 'mfr_micro_labs'
  name: string;               // 'Micro Labs'
};

type Category = {
  id: string;                 // 'cat_pain_relief'
  name: string;               // 'Pain Relief'
  iconKey: string;            // matches an icon registered in theme/icons
  order: number;
};

type Medicine = {
  id: string;
  name: string;                          // 'Crocin Advance'
  nameLocalised?: Partial<Record<LocaleCode, string>>;
  aliases: string[];                     // ['Crocin', 'Crocin 500']
  hindiAliases?: string[];               // ['क्रोसिन']
  manufacturer: Manufacturer;
  compositions: Composition[];           // multi-component allowed
  form: MedicineForm;
  packSize: string;                      // '15 tablets'
  imageUrl: string;
  requiresPrescription: boolean;
  categoryIds: string[];                 // ['cat_pain_relief']
  searchTokens: string[];                // lowercased prefixes + alias prefixes
  similarMedicineIds: string[];          // hand-curated for MVP, salt-derived later
  variantOfMedicineId?: string;          // for siblings (Crocin Pain Relief variant of Crocin)
  description?: string;                  // ONE neutral line, not medical advice
};

type StoreContact = {
  publicPhoneE164: string;               // '+919812345678'
  whatsapp?: string;                     // optional
};

type StoreHours = {
  // 0=Sun..6=Sat; each slot is [openHHmm, closeHHmm] in 24h local time
  [day: number]: Array<[string, string]>;
};

type Store = {
  id: string;
  name: string;
  ownerName?: string;                    // optional, not surfaced unless intended public
  verified: boolean;
  licenseNumber?: string;                // 'KA-12345/2024'
  licenseAuthority?: string;             // 'Karnataka State Drugs Control'
  address: { line1: string; line2?: string; city: string; state: string; pincode: string };
  location: { lat: number; lng: number; geohash: string };
  contact: StoreContact;
  hours: StoreHours;
  distanceKm: number;                    // computed at fetch time, cached on the model for mock
  isOpenNow: boolean;                    // derived; server replaces with real time check
  closesAtLabel?: string;                // 'Open until 11:00 PM'
  freshnessLabel: string;                // 'Inventory updated 12 min ago'
  freshnessUpdatedAt: number;            // epoch ms; for stale checks
};

type StoreInventoryItem = {
  storeId: string;
  medicineId: string;
  inStock: boolean;
  stockLabel: 'in_stock' | 'low' | 'out';   // never numeric to avoid implying guarantee
  priceInr?: number;                         // optional; never required for discovery MVP
  updatedAt: number;                         // epoch ms
};

type SearchSuggestion = {
  kind: 'medicine' | 'composition' | 'symptom' | 'category';
  id: string;
  display: string;                       // 'Crocin' / 'Paracetamol 500 mg' / 'Pain Relief'
  hint?: string;                         // 'Brand' / 'Composition' / 'Category'
  routeHint:
    | { kind: 'medicine'; medicineId: string }
    | { kind: 'composition'; compositionId: string }
    | { kind: 'symptom'; symptomKey: string }
    | { kind: 'category'; categoryId: string };
};

type RecentSearch = {
  query: string;
  ts: number;                            // epoch ms
  resolvedTo?: SearchSuggestion['routeHint'];
};
```

Screens that consume each shape:
- `Medicine` → Search results, Medicine detail, Home popular chips, Category browse, In-store search rows.
- `Store` → Nearby stores sheet, Store detail, Stores mode landing.
- `StoreInventoryItem` → Medicine detail availability list, Store detail inventory list.
- `Composition` → Search results "same composition" group, Medicine detail composition row.
- `SearchSuggestion` + `RecentSearch` → Search live-suggestion list.
- `Category` → Home category cards, Category browse.

## Phase 4: Self-Critique

**Where this design is weakest.** The two-mode toggle on Home is a real risk. Mode switching is one of the most-fumbled UI patterns on mobile because users don't read pill toggles — they scan. If a user lands on Stores mode by mistake and sees a map of pharmacies instead of a search box, they will likely close the app. Mitigation in the screen spec: the toggle is large, labelled with both icon and word, and the *secondary* mode's landing screen includes a prominent "Search a medicine instead" affordance. But the underlying risk — that the mode is invisible to a 65-year-old user — is not fully mitigated. The honest fix would be a single-mode home with a "Browse pharmacies" link in the search empty state. Marking that as Open Question 1.

**Two decisions I'd change with more time.**
(1) The symptom map (§0.4.1) is curated by hand. It is therefore brittle, English-centric, and limited to seven entries. With more time I would either drop symptom search entirely (the "no medical advice" rule pushes that direction) or build it from a properly licensed therapeutic dictionary. Today's compromise is informal enough to be safe but too small to be useful.
(2) "Stock label" is three buckets (`in_stock` / `low` / `out`) rather than a number. This protects us from implying a guarantee but is genuinely worse for chronic users (Persona B) who *want* to know "you have eight strips left, I'll come at 6 pm". A future iteration should let stores opt into showing real counts with an explicit "guaranteed last updated at HH:MM" disclaimer.

**The assumption that, if wrong, breaks the product.** That stores will keep their inventory roughly fresh — at minimum once a day — so that the freshness label is mostly green/amber, not red. If most stores don't update, the entire wedge collapses to "I called five pharmacies and the app was wrong." There is no in-MVP fix for this; the only mitigation is product policy: the Nearnest web portal should nag inactive stores and a store with no inventory updates in 7 days should be hidden from Medifind. That is a policy ask we owe the website team. **Open Question 4.**

**What I copied too closely from Blinkit/Zepto.** The category card grid on Home and the recent-search chip carousel both come straight from quick-commerce. The grid is fine — categories are categories — but the chip carousel should be redesigned for the medical context. Quick-commerce uses chips for *cravings* (chocolate, chips, cola). Medifind uses chips for *needs* (Crocin, Telmisartan, ORS). The same component shape, but the typography needs to be calmer, no emoji, no badges, and the carousel should not auto-scroll. The current spec gets the calmness right; it does not get the auto-scroll wrong because we have it disabled. Net: low-grade copying, mostly fine.

**What a 65-year-old user would struggle with on the home screen.** The mode toggle (already covered above). After that: small chip text (Phase 0 §0.6 enforces 15 px minimum, but chip labels can wrap awkwardly under large-type mode — must verify). Tap targets near the search bar are tight if the keyboard is open and the device is gripped one-handed. Recovery from a typo is currently inline ("Showing results for X") which a 65-year-old may not read; a louder banner or a confirm dialog would be more forgiving but more annoying for everyone else. We picked the inline path for the median user; we should A/B this if possible.

## Open Questions (5, ranked by impact)

1. **Mode toggle visibility for low-tech users.** Should Home default to a single-mode search experience and demote Stores mode to a tab, link, or empty-state action? Recommended default if we ship as-is: mode toggle stays, but a "Browse pharmacies near me" tertiary link lives at the bottom of every empty/no-result state. Decide before public launch.
2. **Search backend for MVP.** D-013 picks Firestore `searchTokens[]`. With seven search cases (§0.4) including transliteration and symptom mapping, Firestore prefix matching alone will fall short on misspellings. Recommended default: ship Firestore for MVP, watch the no-result rate (§0.9 metric 4); if it crosses 10%, fast-track Typesense per the D-013 fallback. Decide at four-week post-launch checkpoint.
3. **Localisation timing.** We've designed the data model to carry `nameLocalised` and `hindiAliases`. Do we ship English-only at launch (yes, recommended) and add Hindi at week-six, or hold launch for Hindi? Recommended default: English-only MVP, Hindi week-six.
4. **Inventory freshness policy with stores.** The Nearnest web portal must enforce a freshness SLA — recommended: hide a store from Medifind discovery after 7 days without inventory writes; show an amber badge after 24 hours. Needs sign-off from the website/backend team.
5. **Symptom map breadth.** Keep the 7 hand-curated entries (§0.4.1), expand to ~30, or remove the symptom search entirely. Recommended default: ship the 7 as a soft routing heuristic, framed as "people searching X usually look at Y", with explicit copy. Re-evaluate after eight weeks of search-log review.
