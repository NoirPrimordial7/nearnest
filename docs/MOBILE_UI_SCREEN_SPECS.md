# Nearnest Mobile UI Screen Specs - Discovery MVP

Last updated: 2026-04-24 (MVP scope reconfirmed)

## Canonical MVP definition

The Nearnest mobile MVP does exactly five things. Every screen in this spec must serve one of these bullets.

- **Find a medicine.**
- **Show nearby stores that have it.**
- **Show store details and availability.**
- **Guide / navigate the user to the store.**
- **Let the user call / contact the store.**

Delivery, cart, checkout, payment, order tracking, and the prescription delivery flow are **Phase 2 / optional**, not MVP. Do not design, scaffold, or route any screen that serves only those flows in MVP.

Scope: customer-facing React Native + Expo screens for the revised MVP. The MVP is **medicine discovery + nearby store availability + map navigation + store contact**. It is not a cart, checkout, payment, order, or delivery product.

Decision baseline:
- Navigation: expo-router when scaffold is approved (D-007).
- Firebase client: Firebase JS SDK plus expo-notifications only if notifications ship (D-008).
- Places proxy: server-side Places key in the existing Functions codebase (D-011).
- Search: Firestore `searchTokens[]` behind `searchMedicines` callable (D-013).
- Commerce decisions D-005, D-006, D-010, and D-014 remain Phase 2 extension points.

Global design rules:
- Use the premium, light, minimal medical-trust system from `docs/DESIGN_SYSTEM.md`.
- One primary CTA per screen.
- Primary actions use `--color-primary-500`; links/info use `--color-accent-500`.
- Rx status is informational in MVP; use the Rx palette for badges/warnings, but do not show approval/checkout gating.
- Store trust signals, open state, availability freshness, contact, and navigation must stay visible.
- Loading uses skeletons; errors are inline with retry.

## MVP Screen Set

The MVP needs these screens:
1. Splash
2. Welcome / onboarding
3. Sign in
4. Sign up
5. Email verification
6. Forgot password
7. Profile setup
8. Location permission
9. Address / search-area picker
10. Home list
11. Home map
12. Search
13. Search results
14. Store detail
15. Product / medicine detail
16. Contact store
17. Navigation handoff
18. Profile

The old commerce screens are Phase 2 only: Cart, Checkout, Payment status, Orders list, Order detail, Delivery tracking, Prescription upload/review.

## 1. Splash

**Purpose**
- Bootstrap auth, cached location/search area, feature flags, and route decisions.

**Layout sections**
- Centered Nearnest brand mark.
- Small shimmer/progress dot.
- Optional status text if boot lasts longer than 1s.

**Primary CTA**
- None.

**Secondary actions**
- None.

**Empty/loading/error states**
- Loading: subtle brand pulse.
- Error: inline retry if Firebase/bootstrap fails.
- Offline: continue with cached discovery data if available; otherwise route to Sign in with network note.

**Components needed**
- BrandMark, BootStatusText, InlineRetryPanel.

**Firebase/backend dependencies**
- Firebase Auth current user if auth is enabled.
- Cached `users/{uid}` and saved location/search area.

**Navigation links**
- Unauthenticated -> Welcome or Sign in.
- Authenticated -> Home list.
- Missing search area -> Location permission.

**Design notes**
- Near-white background; no hero card or decorative gradient.

## 2. Welcome / Onboarding

**Purpose**
- Explain that Nearnest finds nearby stores with a specific medicine and helps users navigate/contact them.

**Layout sections**
- Three-slide pager:
  - "Find the exact medicine"
  - "See nearby verified stores"
  - "Call or navigate before you go"
- Pagination dots.
- CTA row.

**Primary CTA**
- "Get started".

**Secondary actions**
- "Sign in".
- "Skip" to location/search if anonymous discovery is allowed.

**Empty/loading/error states**
- Static screen; no loading.
- Use lucide icons if no illustration assets exist.

**Components needed**
- OnboardingPager, OnboardingSlide, PaginationDots, AuthFooterLinks.

**Firebase/backend dependencies**
- None.

**Navigation links**
- Sign up.
- Sign in.
- Location permission if skipping auth is allowed.

**Design notes**
- Copy must avoid delivery promises. Use MapPin, Search, Phone, ShieldCheck icons.

## 3. Sign In

**Purpose**
- Let returning users authenticate for saved search areas, recent searches, and preferences.

**Layout sections**
- Header.
- Email field.
- Password field.
- Forgot password link.
- Primary button.
- Footer sign-up link.

**Primary CTA**
- "Sign in".

**Secondary actions**
- "Forgot password".
- "Create account".
- Optional "Continue as guest" only if backend allows anonymous discovery.

**Empty/loading/error states**
- Loading: button says "Signing in".
- Error: field-level or form-level inline message.
- Unverified email: route to Email verification.

**Components needed**
- AuthShell, TextField, PasswordField, InlineFormError, LoadingButton.

**Firebase/backend dependencies**
- Firebase Auth `signInWithEmailAndPassword`.
- `users/{uid}` read.

**Navigation links**
- Forgot password.
- Sign up.
- Email verification.
- Home list or Location permission.

**Design notes**
- One primary button; accessible fields and focus states.

## 4. Sign Up

**Purpose**
- Create an account for saved search/location preferences and future commerce readiness.

**Layout sections**
- Header.
- Name, email, phone, password fields.
- Terms checkbox.
- Submit button.
- Sign-in footer link.

**Primary CTA**
- "Create account".

**Secondary actions**
- "Sign in".
- Terms/privacy links.

**Empty/loading/error states**
- Loading: "Creating account".
- Error: inline field validation.
- Duplicate email: show Sign in shortcut.

**Components needed**
- AuthShell, TextField, PhoneField, PasswordField, CheckboxRow, LoadingButton.

**Firebase/backend dependencies**
- Firebase Auth create account.
- Email verification send.
- `onUserCreate` creates `users/{uid}`.

**Navigation links**
- Email verification.
- Sign in.

**Design notes**
- Do not mention delivery checkout benefits in MVP copy.

## 5. Email Verification

**Purpose**
- Verify trusted contact before saving profile/preferences and before any future sensitive features.

**Layout sections**
- Verification icon.
- Email address.
- Short explanation.
- Resend cooldown.
- Confirmation button.

**Primary CTA**
- "I've verified".

**Secondary actions**
- "Resend email".
- "Sign out".

**Empty/loading/error states**
- Loading: "Checking".
- Error: resend/reload failure inline.
- Cooldown: timer on resend action.

**Components needed**
- VerificationStatusIcon, CountdownButton, InlineInfo, LoadingButton.

**Firebase/backend dependencies**
- Firebase Auth verification and reload.

**Navigation links**
- Location permission or Home list.
- Sign in/sign out.

**Design notes**
- Use info/success states calmly.

## 6. Forgot Password

**Purpose**
- Send reset email.

**Layout sections**
- Header.
- Email input.
- Submit button.
- Success panel.

**Primary CTA**
- "Send reset link".

**Secondary actions**
- "Back to sign in".

**Empty/loading/error states**
- Loading: "Sending".
- Success: confirmation.
- Error: inline auth error.

**Components needed**
- AuthShell, TextField, SuccessPanel, LoadingButton.

**Firebase/backend dependencies**
- Firebase Auth `sendPasswordResetEmail`.

**Navigation links**
- Sign in.

**Design notes**
- Keep the screen simple and quiet.

## 7. Profile Setup

**Purpose**
- Capture minimal profile and discovery preferences.

**Layout sections**
- Name/phone confirmation.
- Optional avatar.
- Preferred search radius.
- Preferred maps app if needed.
- Prompt to add search area/address.

**Primary CTA**
- "Continue".

**Secondary actions**
- "Add photo".
- "Set location now".

**Empty/loading/error states**
- Loading: profile skeleton.
- Error: save failure with retry.
- Missing required field: disabled CTA with helper.

**Components needed**
- ProfileAvatarPicker, TextField, RadiusSelector, LoadingButton.

**Firebase/backend dependencies**
- `users/{uid}` read/update.
- Optional Storage `avatars/{uid}/*`.

**Navigation links**
- Location permission.
- Address picker.
- Home list.

**Design notes**
- Replace delivery strategy with discovery radius/preferences.

## 8. Location Permission

**Purpose**
- Ask for location access to rank nearby stores, while offering manual location fallback.

**Layout sections**
- Location icon.
- Why location helps: "show stores near you".
- Permission CTA.
- Manual search-area fallback.

**Primary CTA**
- "Use my location".

**Secondary actions**
- "Enter area manually".
- "Not now".

**Empty/loading/error states**
- Loading: checking permission.
- Denied: manual address picker becomes primary.
- Error: OS location unavailable with retry.

**Components needed**
- PermissionPrimer, IconCircle, InlineError.

**Firebase/backend dependencies**
- Expo location after scaffold.
- `reverseGeocode`.
- `nearbyStores`.

**Navigation links**
- Address picker.
- Home list.

**Design notes**
- No delivery-area language; say "nearby stores" and "directions".

## 9. Address / Search-Area Picker

**Purpose**
- Let users choose where to search from.

**Layout sections**
- Places search field.
- Saved areas/addresses.
- Map pin picker.
- Confirm sheet.

**Primary CTA**
- "Search from here".

**Secondary actions**
- "Use current location".
- "Save this area".
- "Edit details".

**Empty/loading/error states**
- Empty: prompt to enter locality/pincode/landmark.
- Loading: Places result skeletons.
- Error: Places/geocode failure with manual fallback.

**Components needed**
- PlacesSearchInput, SavedAddressRow, MapPinPicker, AddressFormSheet.

**Firebase/backend dependencies**
- `placesSearch`, `placeDetails`, `geocode`, `reverseGeocode`.
- `users/{uid}/addresses/{addressId}` if signed in.

**Navigation links**
- Home list.
- Home map.
- Search results if launched from search.

**Design notes**
- Map is functional. Keep saved address rows compact.

## 10. Home List

**Purpose**
- Show verified stores near the selected search area and provide quick entry to medicine search.

**Layout sections**
- Header with search area chip.
- Search bar.
- List/map toggle.
- Nearby verified store cards.
- Optional "recent medicine searches".

**Primary CTA**
- Tap Search bar -> Search.

**Secondary actions**
- Store card -> Store detail.
- Call store from card if phone exists.
- Navigate from card.
- Toggle Map.

**Empty/loading/error states**
- Loading: store card skeletons.
- Empty: no verified stores nearby; widen radius/change area.
- Error: retry nearby store load.

**Components needed**
- AppHeader, SearchFieldButton, AddressChip, StoreCard, VerifiedBadge, RadiusControl.

**Firebase/backend dependencies**
- `nearbyStores`.
- Store data with public contact and location.

**Navigation links**
- Search.
- Home map.
- Store detail.
- Address picker.
- Contact store.
- Navigation handoff.

**Design notes**
- Store cards emphasize verified, open now, distance, contact, directions.
- No sticky cart bar in MVP.

## 11. Home Map

**Purpose**
- Let users spatially browse nearby stores and select one for details/directions.

**Layout sections**
- Full-screen map.
- Header overlay with search area chip.
- Store pins/clusters.
- Selected store bottom sheet with call/navigate/detail actions.
- "Search this area" pill.

**Primary CTA**
- "Navigate" from selected store sheet.

**Secondary actions**
- "View details".
- "Call".
- Recenter.
- Toggle List.

**Empty/loading/error states**
- Loading: map with skeleton sheet.
- Empty: no-store sheet.
- Error: map unavailable fallback to Home list.

**Components needed**
- StoreMap, ClusterPin, SelectedStoreSheet, RecenterButton, SearchAreaPill.

**Firebase/backend dependencies**
- `nearbyStores`.
- Store coordinates/geohash.
- Maps rendering key.

**Navigation links**
- Store detail.
- Contact store.
- Navigation handoff.
- Address picker.

**Design notes**
- Full-bleed functional map; no decorative container.

## 12. Search

**Purpose**
- Search for a specific medicine, brand, or salt.

**Layout sections**
- Focused search input.
- Recent searches.
- Popular categories/chips.
- Optional filters collapsed until query exists.

**Primary CTA**
- Submit query.

**Secondary actions**
- Tap recent search.
- Clear query.
- Change search area.

**Empty/loading/error states**
- Empty: prompt to search by medicine or salt.
- Loading: suggestions skeleton.
- Error: search unavailable with retry.
- Query too short: helper for minimum 2 characters.

**Components needed**
- SearchInput, RecentSearchRow, SuggestionRow, FilterChips.

**Firebase/backend dependencies**
- `searchMedicines`.
- Local recent searches or `users/{uid}` metadata.

**Navigation links**
- Search results.
- Address picker.

**Design notes**
- Fast, utilitarian, large tap targets.

## 13. Search Results

**Purpose**
- Show matching medicine(s) and nearby stores that currently have them.

**Layout sections**
- Search input with query.
- Sort/filter row: nearest, open now, price, radius, Rx/OTC.
- Medicine result group.
- Store availability rows.

**Primary CTA**
- Tap availability row -> Store detail.

**Secondary actions**
- "Call".
- "Navigate".
- Tap medicine -> Product detail.
- Widen radius/change area.

**Empty/loading/error states**
- Loading: result skeletons.
- Empty: widen radius, edit query, optional "Notify me" if backend supports it.
- Error: retry.
- Stale data: show updated timestamp/freshness.

**Components needed**
- ResultMedicineCard, AvailabilityRow, SortControl, RxBadge, FreshnessLabel.

**Firebase/backend dependencies**
- `searchMedicines`.
- Store/inventory/medicine response.

**Navigation links**
- Store detail.
- Product detail.
- Contact store.
- Navigation handoff.
- Address picker.

**Design notes**
- Availability rows must make call/navigate easy.
- Avoid "buy" or "add to cart" language.

## 14. Store Detail

**Purpose**
- Show the selected store's trust, contact, address, hours, map, and relevant availability.

**Layout sections**
- Store header with verified badge and open state.
- Public contact actions.
- Address and mini-map.
- Hours and license/verification hint.
- Available medicines/products list.
- "Medicine you searched for" highlight when applicable.

**Primary CTA**
- "Navigate".

**Secondary actions**
- "Call store".
- "Search in this store".
- "Report stale info".
- Tap medicine -> Product detail.

**Empty/loading/error states**
- Loading: header and inventory skeletons.
- Empty: no active visible inventory; still show contact/navigation.
- Error: retry store load.
- Closed: show hours and allow navigation/call.

**Components needed**
- StoreHeader, VerifiedBadge, ContactActionRow, MiniMap, HoursPanel, ProductAvailabilityRow.

**Firebase/backend dependencies**
- `stores/{storeId}`.
- `stores/{storeId}/inventory`.
- Store public contact fields.

**Navigation links**
- Product detail.
- Contact store.
- Navigation handoff.
- Home map/list.

**Design notes**
- Trust signals first viewport.
- Primary action is navigate, not checkout.

## 15. Product / Medicine Detail

**Purpose**
- Explain the medicine and show where nearby it is available.

**Layout sections**
- Name, salt, form, strength, pack size.
- Rx badge and informational warning if needed.
- Safety/usage notes.
- Nearby available store list.
- Alternatives by same salt if available.

**Primary CTA**
- Select a store availability row -> Store detail.

**Secondary actions**
- Call store.
- Navigate.
- Compare alternatives if available.

**Empty/loading/error states**
- Loading: medicine skeleton.
- Error: unavailable medicine detail with retry/back.
- No available stores: widen radius/change area/notify me optional.

**Components needed**
- ProductHero, MedicineFacts, RxInfoCard, StoreAvailabilityList, SafetyInfoAccordion.

**Firebase/backend dependencies**
- `medicines/{medicineId}`.
- Availability from `searchMedicines` or inventory query.

**Navigation links**
- Store detail.
- Contact store.
- Navigation handoff.
- Search results.

**Design notes**
- Rx copy: "Prescription may be required by the store/pharmacist." Do not show approval workflow in MVP.

## 16. Contact Store

**Purpose**
- Give a focused contact surface when direct call/message needs context.

**Layout sections**
- Store summary.
- Public phone number / call action.
- Optional WhatsApp/message action if store provides it.
- Hours/open-state note.
- Searched medicine context.

**Primary CTA**
- "Call store".

**Secondary actions**
- "Navigate".
- "View store".
- "Report wrong number".

**Empty/loading/error states**
- Loading: contact skeleton.
- Missing phone: show "Contact unavailable" and offer navigate/report.
- Error: retry store contact load.

**Components needed**
- StoreSummaryCard, ContactActionRow, HoursStatus, ReportIssueLink.

**Firebase/backend dependencies**
- `stores/{storeId}` public contact fields.
- Optional `reportInventoryIssue` / support ticket in Phase 2.

**Navigation links**
- Store detail.
- Navigation handoff.
- Support/report issue optional.

**Design notes**
- Use phone icon button with clear label. Do not expose non-public owner contact.

## 17. Navigation Handoff

**Purpose**
- Confirm the selected destination and hand off to the user's map app.

**Layout sections**
- Store name and address.
- Distance estimate.
- Map preview.
- Map app choices if multiple are available.

**Primary CTA**
- "Open directions".

**Secondary actions**
- "Call store".
- "Back to store".

**Empty/loading/error states**
- Loading: resolving route/address.
- Error: cannot open maps; show copy address fallback.
- Missing coordinates: show address and call action.

**Components needed**
- DestinationSummary, MiniMap, MapAppPicker, CopyAddressButton.

**Firebase/backend dependencies**
- Store coordinates/address.
- Device maps linking.
- No Cloud Function required unless route estimates are server-side.

**Navigation links**
- External maps app.
- Store detail.
- Contact store.

**Design notes**
- Keep the handoff utilitarian. Map content is functional, not decorative.

## 18. Profile

**Purpose**
- Manage account, saved search areas, recent searches, preferences, support/legal, and sign out.

**Layout sections**
- Profile header.
- Saved search areas/addresses.
- Recent searches.
- Preferred radius.
- Notification preference only if notify-me ships.
- Support/report issue.
- Legal/about/version.
- Sign out.

**Primary CTA**
- "Add search area" if none exists; otherwise no dominant CTA.

**Secondary actions**
- Edit profile.
- Manage saved areas.
- Clear recent searches.
- Sign out.

**Empty/loading/error states**
- Loading: profile skeleton.
- Error: retry.
- No saved areas: prompt to add one.

**Components needed**
- ProfileHeader, SettingsRow, SavedAreaCard, RadiusSelector, SignOutButton.

**Firebase/backend dependencies**
- `users/{uid}`.
- `users/{uid}/addresses`.
- Firebase Auth sign out.

**Navigation links**
- Address picker.
- Search.
- Support/report issue optional.
- Auth stack after sign out.

**Design notes**
- Remove orders, prescriptions, cart, delivery preferences from MVP profile.

## Phase 2 / Optional Screens

These are intentionally not part of discovery MVP. Do not scaffold or route them until the user explicitly expands scope.

### Cart
- Phase 2 commerce screen.
- Requires cart state, totals, Rx gate, and `computeCartTotal`.
- Not present in MVP navigation.

### Checkout
- Phase 2 commerce screen.
- Requires `createOrder`, Rx validation, address serviceability, and payment handoff.
- Not present in MVP navigation.

### Payment Status
- Phase 2 commerce screen.
- D-010 selects Razorpay when this scope returns.
- Requires `createPaymentOrder`, `paymentsWebhook`, and `verifyPaymentClient`.

### Orders List / Order Detail
- Phase 2 commerce/delivery screens.
- Requires `orders`, `orders/{id}/events`, cancellation/reorder, and later delivery state.
- Not present in MVP tabs.

### Delivery Tracking
- Phase 2 only.
- Requires `deliveries`, driver assignment, and location updates.

### Prescription Upload / Prescription Status
- Phase 2 if in-app ordering/delivery of Rx medicines ships.
- In discovery MVP, show only an Rx informational badge and tell users to contact the store.

### Notifications Inbox
- Optional MVP only if saved-search/notify-me ships.
- Otherwise Phase 2 for order/payment/prescription notifications.

### Support Chat
- Optional MVP for reporting stale availability.
- Full ticket chat can wait for Phase 2.

## MVP Component Inventory

- AuthShell, TextField, PasswordField, PhoneField, LoadingButton, InlineFormError.
- AppHeader, AddressChip, SearchFieldButton, SearchInput, FilterChips.
- StoreCard, StoreHeader, VerifiedBadge, ContactActionRow, HoursPanel.
- StoreMap, MiniMap, SelectedStoreSheet, RecenterButton, SearchAreaPill.
- ResultMedicineCard, AvailabilityRow, ProductAvailabilityRow, FreshnessLabel.
- ProductHero, MedicineFacts, RxBadge, RxInfoCard, SafetyInfoAccordion.
- DestinationSummary, MapAppPicker, CopyAddressButton.
- ProfileHeader, SavedAreaCard, RadiusSelector.
- EmptyState, SkeletonList, InlineRetryPanel.

## Backend Dependency Map

Required for MVP:
- Auth/profile: Firebase Auth, `users/{uid}`, optional `onUserCreate`.
- Location/search area: `placesSearch`, `placeDetails`, `geocode`, `reverseGeocode`, `users/{uid}/addresses`.
- Discovery: `nearbyStores`, `searchMedicines`, `stores`, `stores/{storeId}/inventory`, `medicines`.
- Contact/navigation: store public contact fields, store coordinates/address, native map links.

Deferred to Phase 2:
- `carts/{uid}`, `orders`, `payments`, `deliveries`, `prescriptions` approval workflow.
- `computeCartTotal`, `createOrder`, `createPaymentOrder`, `paymentsWebhook`, `uploadPrescription`, `reviewPrescription`, delivery functions.

## Scaffold Notes For Later

- Specs assume expo-router, but no files under `apps/mobile/**` should be created until explicit scaffold approval.
- Service wrappers should be separated by domain: auth, location, stores, search, contact, maps.
- Do not create cart/order/payment service wrappers in MVP unless they are empty Phase 2 placeholders and the user explicitly approves.
- Mock data may be used behind service wrappers for discovery screens only; do not mock commerce flows because they are out of scope.
