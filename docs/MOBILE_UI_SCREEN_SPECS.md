# Nearnest Mobile UI Screen Specs - MVP

Last updated: 2026-04-24

Scope: customer-facing React Native + Expo MVP screens only. This is a product/design contract, not implementation code.

Decision baseline:
- Navigation: expo-router (D-007).
- Firebase client: Firebase JS SDK plus expo-notifications (D-008).
- Protected writes: Cloud Functions only (D-005).
- Roles: custom claims canonical, with users.roles mirror during rollout (D-009).
- Payments: Razorpay for India MVP (D-010).
- Places proxy: same functions codebase, server-side Google Places key (D-011).
- Search: Firestore searchTokens behind searchMedicines callable (D-013).
- Prescriptions: per-store approval scope (D-014).

Global UI rules:
- Use the premium, light, minimal medical-trust style from `docs/DESIGN_SYSTEM.md`.
- Use one primary CTA per screen. Secondary actions are ghost or bordered buttons.
- Use Inter/system font, 400/500/600 weights, generous whitespace, and accessible 44x44 minimum touch targets.
- Use `--color-primary-500` for primary actions, `--color-accent-500` for links/info, and the reserved Rx palette for prescription gates.
- Loading uses skeletons wherever content shape is known. Avoid full-screen spinners except during splash/bootstrap.
- Errors are inline with retry. Avoid disruptive red toasts for recoverable errors.
- Any Rx item must show an explicit prescription gate. Checkout remains disabled until every Rx item has approved per-store prescription coverage.

## 1. Splash

**Purpose**
- Bootstrap auth, remote config, cached user profile, and first-run routing without exposing a blank screen.

**Layout sections**
- Centered Nearnest wordmark or symbol.
- Small loading shimmer or progress dot below the brand.
- Optional bottom caption: "Finding trusted nearby stores" only if boot lasts longer than 1s.

**Primary CTA**
- None. Route automatically.

**Secondary actions**
- None.

**Empty/loading/error states**
- Loading: brand mark with subtle pulse.
- Error: small retry panel if Firebase initialization/auth restore fails.
- Offline: continue with cached session if available; otherwise route to Sign in with inline network message.

**Components needed**
- BrandMark, BootStatusText, InlineRetryPanel.

**Firebase/backend dependencies**
- Firebase Auth current user.
- Firestore `users/{uid}` profile read if authenticated.
- Optional cached address/cart from local storage.

**Navigation links**
- Authenticated + profile complete -> Home list.
- Authenticated + profile incomplete -> Profile setup.
- Unauthenticated -> Welcome or Sign in depending first-run flag.
- Email unverified -> Email verification.

**Design notes from DESIGN_SYSTEM.md**
- Near-white background, calm primary color, restrained motion.
- No marketing hero, no decorative gradients, no card wrapper around the brand.

## 2. Welcome / Onboarding

**Purpose**
- Explain the customer value quickly before sign-in: nearby real stock, pharmacist-approved Rx, and live order tracking.

**Layout sections**
- Full-height pager with 3 slides.
- Slide 1: nearby stores and real inventory.
- Slide 2: prescription approval by verified store/pharmacist.
- Slide 3: payment and delivery tracking.
- Bottom pagination dots and CTA row.

**Primary CTA**
- "Get started" -> Sign up on final slide; "Continue" advances earlier slides.

**Secondary actions**
- "Sign in" text button.
- "Skip" on first two slides to Sign in.

**Empty/loading/error states**
- No data loading.
- If illustration asset missing, use lucide icon in tinted circle.
- Error state not expected.

**Components needed**
- OnboardingPager, OnboardingSlide, PaginationDots, AuthFooterLinks.

**Firebase/backend dependencies**
- None.
- Local first-run flag only.

**Navigation links**
- Sign up.
- Sign in.

**Design notes from DESIGN_SYSTEM.md**
- Display type may use `--font-display`.
- Keep copy short and clinical; avoid marketplace language.
- Use trust icons like ShieldCheck, MapPin, Truck.

## 3. Sign In

**Purpose**
- Let returning users authenticate with email/password.

**Layout sections**
- Header: "Welcome back" with short support copy.
- Email input.
- Password input with show/hide icon.
- Forgot password link.
- Primary sign-in button.
- Footer link to Sign up.

**Primary CTA**
- "Sign in".

**Secondary actions**
- "Forgot password".
- "Create account".
- Phase 2 placeholder area for Google/phone auth should not render in MVP unless available.

**Empty/loading/error states**
- Loading: button shows spinner plus "Signing in".
- Error: inline Auth error under relevant field or form summary.
- Unverified email: route to Email verification with resend affordance.

**Components needed**
- AuthShell, TextField, PasswordField, InlineFormError, LoadingButton.

**Firebase/backend dependencies**
- Firebase Auth `signInWithEmailAndPassword`.
- `users/{uid}` read after sign-in.
- `getIdTokenResult(true)` for custom claims when needed.

**Navigation links**
- Forgot password.
- Sign up.
- Email verification.
- Profile setup or Home list after auth/profile gate.

**Design notes from DESIGN_SYSTEM.md**
- One primary button.
- Use visible focus ring and readable body copy.
- Errors use danger text inline, not large red banners.

## 4. Sign Up

**Purpose**
- Create a customer account with enough identity data for safe ordering and profile setup.

**Layout sections**
- Header: "Create your Nearnest account".
- Name, email, phone, password fields.
- Password strength/help text.
- Terms and privacy checkbox.
- Primary submit button.
- Footer link to Sign in.

**Primary CTA**
- "Create account".

**Secondary actions**
- "Sign in".
- Terms/privacy links.

**Empty/loading/error states**
- Loading: button shows "Creating account".
- Error: field-level validation for email, password, phone; form-level error for Auth failures.
- Duplicate email: inline message with Sign in shortcut.

**Components needed**
- AuthShell, TextField, PhoneField, PasswordField, PasswordStrengthMeter, CheckboxRow, LoadingButton.

**Firebase/backend dependencies**
- Firebase Auth `createUserWithEmailAndPassword`.
- Auth email verification send.
- `onUserCreate` Cloud Function creates `users/{uid}` with default role user.

**Navigation links**
- Email verification after successful account creation.
- Sign in.

**Design notes from DESIGN_SYSTEM.md**
- Keep terms copy small but legible.
- Use soft surfaces; do not cram fields.
- Primary action disabled until required fields and terms are valid.

## 5. Email Verification

**Purpose**
- Block sensitive actions until the user verifies email.

**Layout sections**
- Verification icon in soft tinted circle.
- Title and verified email address.
- Explanation of why verification matters for prescriptions, orders, and payments.
- Resend email row with cooldown timer.
- Primary "I've verified" action.

**Primary CTA**
- "I've verified" -> reload user and continue.

**Secondary actions**
- "Resend email".
- "Change email" -> Sign up or Profile setup depending implementation.
- "Sign out".

**Empty/loading/error states**
- Loading: primary button "Checking".
- Error: resend failure or reload failure inline.
- Cooldown: disable resend for 30s with timer.

**Components needed**
- VerificationStatusIcon, CountdownButton, InlineInfo, LoadingButton.

**Firebase/backend dependencies**
- Firebase Auth `sendEmailVerification`.
- Firebase Auth `currentUser.reload()`.
- `users/{uid}.emailVerified` mirror should update through backend/client sync.

**Navigation links**
- Profile setup if verified and profile incomplete.
- Home list if verified and profile complete.
- Sign in/sign out path.

**Design notes from DESIGN_SYSTEM.md**
- Use info color for neutral verification state.
- Keep trust/safety message visible without fear-based wording.

## 6. Forgot Password

**Purpose**
- Let users request a password reset email.

**Layout sections**
- Header: "Reset password".
- Email input.
- Primary submit button.
- Success panel after send.

**Primary CTA**
- "Send reset link".

**Secondary actions**
- "Back to sign in".
- "Try a different email" after success.

**Empty/loading/error states**
- Loading: button "Sending".
- Success: calm confirmation with email address.
- Error: invalid email or Auth failure inline.

**Components needed**
- AuthShell, TextField, SuccessPanel, LoadingButton.

**Firebase/backend dependencies**
- Firebase Auth `sendPasswordResetEmail`.

**Navigation links**
- Sign in.

**Design notes from DESIGN_SYSTEM.md**
- Simple, low-friction form.
- Success uses `--color-success` sparingly.

## 7. Profile Setup

**Purpose**
- Capture the minimum profile and default delivery preference needed before using the app.

**Layout sections**
- Header with progress indicator.
- Name and phone confirmation.
- Optional avatar picker.
- Delivery strategy segmented control: nearest, fastest, cheapest.
- Prompt to add first address or continue to Location permission.

**Primary CTA**
- "Continue".

**Secondary actions**
- "Add photo".
- "I'll add address later" only if Home will immediately ask for location/address.

**Empty/loading/error states**
- Loading: skeleton for existing profile fields.
- Error: profile save failure inline with retry.
- Missing required fields: disabled CTA plus helper text.

**Components needed**
- ProfileAvatarPicker, TextField, SegmentedControl, PreferenceCard, LoadingButton.

**Firebase/backend dependencies**
- Firestore `users/{uid}` read/update for owner fields.
- Storage `avatars/{uid}/*` for optional avatar.
- No role writes from client.

**Navigation links**
- Location permission.
- Address picker.
- Home list after complete.

**Design notes from DESIGN_SYSTEM.md**
- Treat profile as a quiet utility surface, not onboarding marketing.
- Use segmented controls for delivery strategy.

## 8. Location Permission

**Purpose**
- Ask for foreground location at the right moment, while preserving manual address fallback.

**Layout sections**
- Location icon or simple map pin illustration.
- Explanation of nearby inventory and delivery-area checks.
- Permission CTA.
- Manual address fallback.

**Primary CTA**
- "Use my location".

**Secondary actions**
- "Enter address manually".
- "Not now" routes to manual address mode.

**Empty/loading/error states**
- Loading: "Checking permission" compact state.
- Denied: show manual address fallback as primary next step.
- Error: OS/location service unavailable message with retry.

**Components needed**
- PermissionPrimer, IconCircle, InlineError, SecondaryButton.

**Firebase/backend dependencies**
- Device location permission via Expo APIs after scaffold.
- `reverseGeocode` callable for detected coordinates.
- `nearbyStores` callable after location/address confirmed.

**Navigation links**
- Address picker.
- Home list if permission succeeds and address is resolved.

**Design notes from DESIGN_SYSTEM.md**
- Clear, respectful copy.
- No dark permission overlay; use near-white background and primary CTA.

## 9. Address Picker

**Purpose**
- Select, save, and switch delivery addresses used for nearby stores, cart, and checkout.

**Layout sections**
- Search input for Places.
- Saved addresses list.
- Map preview with draggable pin for selected result.
- Address form bottom sheet: label, line details, recipient name/phone.
- Confirm bar.

**Primary CTA**
- "Use this address" or "Save address".

**Secondary actions**
- "Use current location".
- "Edit details".
- "Delete" for saved address, destructive only in confirm flow.

**Empty/loading/error states**
- Empty: no saved addresses, show manual entry/search prompt.
- Loading: search result skeleton rows.
- Error: Places/geocode failure inline, allow manual entry.

**Components needed**
- PlacesSearchInput, SavedAddressRow, MapPinPicker, AddressFormSheet, LabelChips.

**Firebase/backend dependencies**
- `placesSearch`, `placeDetails`, `geocode`, `reverseGeocode` callables.
- Firestore `users/{uid}/addresses/{addressId}` CRUD.
- `nearbyStores` after selection.

**Navigation links**
- Return to previous screen (Home, Cart, Checkout, Profile).
- Location permission if current location requested and not granted.

**Design notes from DESIGN_SYSTEM.md**
- Use map as functional element, not decoration.
- Keep address cards compact with clear default badge.

## 10. Home List

**Purpose**
- Show verified nearby stores that can deliver to the selected address.

**Layout sections**
- Header with address chip, notification bell, profile/avatar shortcut.
- Search bar entry point.
- List/map segmented toggle.
- Nearby store cards sorted by selected delivery strategy.
- Category chips and service-area notes.
- Sticky cart bar when cart has items.

**Primary CTA**
- Store card tap -> Store detail.

**Secondary actions**
- Address chip -> Address picker.
- Search bar -> Search.
- Map toggle -> Home map.
- Notification bell -> Notifications inbox.

**Empty/loading/error states**
- Loading: store-card skeletons.
- Empty: "No verified stores deliver here yet" with change-address CTA.
- Error: retry nearby stores fetch.
- Location missing: show address picker prompt.

**Components needed**
- AppHeader, AddressChip, SearchFieldButton, SegmentedToggle, StoreCard, VerifiedBadge, StickyCartBar.

**Firebase/backend dependencies**
- `nearbyStores` callable.
- Firestore `stores/{id}` data as returned/enriched by backend.
- Firestore `carts/{uid}` listener or local cart store.
- Notifications unread count from `notifications/{uid}/items`.

**Navigation links**
- Address picker.
- Home map.
- Search.
- Store detail.
- Cart.
- Notifications inbox.

**Design notes from DESIGN_SYSTEM.md**
- Store cards use thumbnail 4:3, verified badge, distance, ETA, rating.
- Keep list scannable and calm; avoid dense marketplace badges.

## 11. Home Map

**Purpose**
- Provide spatial browsing for nearby verified stores.

**Layout sections**
- Header overlay with address chip and list toggle.
- Full-screen map with clustered store pins.
- "Search this area" pill after map drag.
- Bottom sheet preview for selected store.
- Sticky cart bar if cart active.

**Primary CTA**
- Bottom sheet "View store".

**Secondary actions**
- Toggle back to List.
- Recenter.
- Search this area.
- Address chip.

**Empty/loading/error states**
- Loading: map with skeleton bottom sheet.
- Empty: map centered on address with no-store message sheet.
- Error: map unavailable fallback to Home list.
- Permission denied: use selected address, not GPS.

**Components needed**
- StoreMap, ClusterPin, SelectedStoreSheet, RecenterButton, SearchAreaPill.

**Firebase/backend dependencies**
- `nearbyStores` callable with map bounds/radius.
- Google Maps SDK rendering key after Expo setup.
- Places proxy only for address changes/search.

**Navigation links**
- Home list.
- Store detail.
- Address picker.
- Cart.

**Design notes from DESIGN_SYSTEM.md**
- Map should be full-bleed/unframed.
- Use bottom sheet as tool surface, not decorative card nesting.

## 12. Search

**Purpose**
- Start global medicine search and show recent/saved searches before results.

**Layout sections**
- Focused search input at top.
- Recent searches.
- Saved searches or requested medicines.
- Popular nearby categories as chips.
- Filters collapsed until query exists.

**Primary CTA**
- Submit query or tap suggestion.

**Secondary actions**
- Clear input.
- Delete recent search.
- Filter chips after query.

**Empty/loading/error states**
- Empty: prompt to search brand or salt name.
- Loading: typeahead suggestions skeleton.
- Error: search service unavailable inline.
- Query too short: helper text for minimum 2 characters.

**Components needed**
- SearchInput, RecentSearchRow, SuggestionRow, FilterChips, EmptyPrompt.

**Firebase/backend dependencies**
- `searchMedicines` callable after minimum query length.
- Optional local storage for recent searches.
- Selected address/location from profile/address state.

**Navigation links**
- Search results.
- Home list via back/tab.

**Design notes from DESIGN_SYSTEM.md**
- Keep search utilitarian.
- Icons from lucide-react-native: Search, Clock, SlidersHorizontal.

## 13. Search Results

**Purpose**
- Show canonical medicine results and ranked in-stock nearby store availability.

**Layout sections**
- Search input with query retained.
- Filter/sort row: nearest, fastest, cheapest, Rx/OTC, open now.
- Medicine result groups.
- Availability rows under each medicine: store, price, ETA, stock, Rx badge.

**Primary CTA**
- Tap availability row -> Store detail pre-scrolled to SKU.

**Secondary actions**
- Tap medicine title -> Product detail.
- Change sort/filter.
- "Notify me" for no availability.
- "Request medicine" for no results.

**Empty/loading/error states**
- Loading: result group skeletons.
- Empty: no nearby store has this, show notify/request actions.
- Error: retry search.
- Partial result: show stale/cached label if backend returns cached data.

**Components needed**
- ResultMedicineCard, AvailabilityRow, SortControl, RxBadge, EmptySearchState.

**Firebase/backend dependencies**
- `searchMedicines` callable.
- `medicines/{medicineId}` canonical fields in response.
- Store/inventory availability returned by backend.

**Navigation links**
- Product detail.
- Store detail.
- Address picker if location missing.

**Design notes from DESIGN_SYSTEM.md**
- Product cards show square image, body name, h3 price, Rx badge.
- Use prescription badge consistently and never hide Rx status in secondary text.

## 14. Store Detail

**Purpose**
- Show a verified store's inventory, trust signals, hours, and products.

**Layout sections**
- Store header: image, name, verified badge, license hint, rating, distance, ETA, open state.
- Mini map with Directions CTA.
- Category chips.
- Search within store.
- Product list/grid.
- Sticky cart bar.

**Primary CTA**
- Add product to cart from product rows/cards.

**Secondary actions**
- Directions.
- Call store if policy allows.
- Search within store.
- Tap product -> Product detail.

**Empty/loading/error states**
- Loading: header and product skeletons.
- Empty: no active inventory in selected category.
- Error: retry store/inventory load.
- Closed store: show closed banner and allow browsing; checkout may be disabled or scheduled when Phase 2.

**Components needed**
- StoreHeader, VerifiedBadge, MiniMap, CategoryChips, ProductCard, QuantityStepper, StickyCartBar.

**Firebase/backend dependencies**
- Firestore `stores/{storeId}` read.
- Firestore `stores/{storeId}/inventory` query.
- Cart state `carts/{uid}` or local cart wrapper.

**Navigation links**
- Product detail.
- Cart.
- Address picker if service area mismatch.
- Home list/map.

**Design notes from DESIGN_SYSTEM.md**
- Trust signals must be first-viewport content.
- Store card visual language should match Home list.

## 15. Product Detail

**Purpose**
- Help the user decide whether a medicine/product is appropriate and add it to cart safely.

**Layout sections**
- Product image carousel.
- Name, salt, form, strength, pack size.
- Price, MRP, savings if available.
- Rx required warning block when applicable.
- Store availability context.
- Usage/safety notes.
- Alternatives by same salt (Phase 2 or MVP-light if data exists).
- Bottom add-to-cart bar.

**Primary CTA**
- "Add to cart" or quantity stepper once added.

**Secondary actions**
- "Attach prescription" for Rx item.
- "Compare alternatives" if available.
- Back to store/search.

**Empty/loading/error states**
- Loading: image and text skeleton.
- Error: product unavailable with back/retry.
- Out of stock: disable add, show notify action.
- Rx missing: add allowed, checkout gate remains blocked.

**Components needed**
- ProductHero, PriceBlock, RxGateCard, StoreAvailabilityList, SafetyInfoAccordion, AddToCartBar.

**Firebase/backend dependencies**
- `medicines/{medicineId}` read or response from search.
- `stores/{storeId}/inventory/{sku}` read.
- Prescription state for the selected store if Rx.
- Cart state.

**Navigation links**
- Cart.
- Prescription upload/status.
- Store detail.
- Search results.

**Design notes from DESIGN_SYSTEM.md**
- Use reserved Rx warning pattern exactly.
- Medical safety text should be readable, not hidden in tiny accordions only.

## 16. Cart

**Purpose**
- Review one-store cart, adjust quantities, attach prescriptions, and proceed to checkout.

**Layout sections**
- Store name and single-store constraint note.
- Line items with quantity steppers.
- Rx gate blocks for Rx items.
- Delivery address summary.
- Server-estimated totals preview.
- Checkout bar.

**Primary CTA**
- "Checkout".

**Secondary actions**
- Change address.
- Attach/view prescription.
- Remove item.
- Continue shopping.

**Empty/loading/error states**
- Empty: cart icon, "Your cart is empty", CTA to Home/Search.
- Loading: line-item skeletons and total skeleton.
- Error: compute total failure with retry.
- Stock changed: modal with accept new quantity/remove options.
- Rx missing/pending/rejected: checkout disabled with helper text.

**Components needed**
- CartLineItem, QuantityStepper, RxGateCard, AddressSummaryCard, PriceSummary, StickyCheckoutBar.

**Firebase/backend dependencies**
- Firestore `carts/{uid}` or local persisted cart.
- `computeCartTotal` callable.
- `prescriptions` query for matching approved store-scoped docs.

**Navigation links**
- Checkout.
- Address picker.
- Prescription upload/status.
- Store detail/Product detail.

**Design notes from DESIGN_SYSTEM.md**
- Checkout primary button disabled until Rx gate is satisfied.
- Use secondary CTA for prescription upload, not primary.

## 17. Prescription Upload

**Purpose**
- Upload prescription pages for a specific store and medicine set, then create a pending review.

**Layout sections**
- Context header: store and medicines requiring Rx.
- Source chooser: camera, gallery, PDF.
- Page preview/reorder/delete.
- Optional doctor fields.
- Safety note about pharmacist review.
- Submit bar.

**Primary CTA**
- "Submit for review".

**Secondary actions**
- Add page.
- Retake/replace page.
- Save draft/cancel.

**Empty/loading/error states**
- Empty: source chooser with guidance.
- Loading: upload progress per page.
- Error: upload failure per page with retry.
- File invalid: size/type message before upload.

**Components needed**
- PrescriptionContextHeader, UploadSourceButtons, PagePreviewGrid, DoctorInfoFields, UploadProgressList.

**Firebase/backend dependencies**
- `uploadPrescription` callable returns doc ID and signed upload URLs.
- Storage upload to `prescriptions/{uid}/{prescriptionId}/pages/*`.
- `onPrescriptionCreate` trigger notifies store staff.

**Navigation links**
- Prescription status after submit.
- Cart/Checkout return path.
- Product detail return path.

**Design notes from DESIGN_SYSTEM.md**
- Use Rx palette and safety framing.
- Keep upload controls large and one-hand friendly.
- Never show "approved" locally after upload; only pending until backend state changes.

## 18. Prescription Status

**Purpose**
- Show lifecycle state for a prescription and next actions.

**Layout sections**
- State header: pending, approved, rejected, expired.
- Store scope and reviewed-by metadata if available.
- Medicines covered.
- Uploaded pages preview.
- Notes/rejection reason.
- Linked order references if any.

**Primary CTA**
- Pending: none or "Back to cart".
- Approved: "Use in cart" when launched from cart.
- Rejected/expired: "Upload new".

**Secondary actions**
- View pages.
- Contact support.
- Re-submit to another store when needed per D-014.

**Empty/loading/error states**
- Loading: status skeleton.
- Error: not found/no access with back to prescriptions list.
- Pending stale: show expected review time and support link.

**Components needed**
- PrescriptionStatusHeader, StatusPill, MedicineCoverageList, PagePreviewStrip, NotesPanel.

**Firebase/backend dependencies**
- Firestore `prescriptions/{prescriptionId}` listener.
- Storage read access for owner page previews.
- `onPrescriptionStateChange` notifications.

**Navigation links**
- Cart/Checkout.
- Prescription upload.
- Support chat/home.
- Product detail.

**Design notes from DESIGN_SYSTEM.md**
- Status chip colors: warning pending, success approved, danger rejected, muted expired.
- Keep approval state visible; do not bury it.

## 19. Checkout

**Purpose**
- Confirm address, totals, Rx readiness, and payment method before creating an order.

**Layout sections**
- Address card.
- Delivery timing: ASAP for MVP.
- Item summary.
- Rx readiness section.
- Payment method picker: UPI, card, netbanking, wallet, COD if store supports.
- Price breakdown.
- Place order bar.

**Primary CTA**
- "Place order".

**Secondary actions**
- Change address.
- Change payment method.
- Edit cart.
- Attach prescription.

**Empty/loading/error states**
- Loading: compute totals skeleton.
- Error: total computation/order creation failure with retry.
- Out of stock: affected items modal.
- Address outside service area: change address or return to store.
- Rx incomplete: disabled primary and helper text.

**Components needed**
- CheckoutAddressCard, PaymentMethodPicker, PriceSummary, RxGateCard, OrderReviewList, LoadingButton.

**Firebase/backend dependencies**
- `computeCartTotal` callable.
- `createOrder` callable.
- `createPaymentOrder` callable for non-COD.
- `prescriptions` approved state.
- Firestore `users/{uid}/addresses`.

**Navigation links**
- Payment status after order/payment starts.
- Address picker.
- Cart.
- Prescription upload/status.

**Design notes from DESIGN_SYSTEM.md**
- Money values use tabular numerals.
- Only one primary CTA.
- Rx gate must use reserved warning pattern.

## 20. Payment Status

**Purpose**
- Handle payment handoff, confirmation, failure, retry, and order transition visibility.

**Layout sections**
- Current payment state: processing, success, failed, pending webhook, COD confirmed.
- Order summary card.
- Retry or view order action.
- Support link for payment issue.

**Primary CTA**
- Success/COD: "View order".
- Failed: "Retry payment".
- Pending: "Check status".

**Secondary actions**
- "Change payment method" when still pending.
- "Contact support".
- "Back to orders".

**Empty/loading/error states**
- Loading: processing state with clear non-dismiss warning during provider handoff.
- Pending webhook: show "Payment confirmation may take a moment".
- Failed: provider reason if safe to show.
- Error: verification failure with retry.

**Components needed**
- PaymentStateIcon, OrderSummaryCard, LoadingButton, InlineSupportLink.

**Firebase/backend dependencies**
- Razorpay SDK/WebView result.
- `verifyPaymentClient` callable.
- Firestore `orders/{orderId}` and `payments/{paymentId}` listeners.
- `paymentsWebhook` is source of truth.

**Navigation links**
- Order detail.
- Checkout for retry/change method.
- Support home/chat.

**Design notes from DESIGN_SYSTEM.md**
- Use success/info/danger state colors sparingly.
- Avoid implying payment success until backend confirms it.

## 21. Orders List

**Purpose**
- Let users track active orders and review past orders.

**Layout sections**
- Header with filter tabs: Active, Past.
- Active order cards with status, ETA, store, total.
- Past order cards with delivered/cancelled/refunded state.
- Reorder affordance on eligible past orders.

**Primary CTA**
- Tap order card -> Order detail.

**Secondary actions**
- Filter toggle.
- Reorder.
- Help for active order.

**Empty/loading/error states**
- Loading: order-card skeletons.
- Empty active: no active orders, CTA to Search.
- Empty past: no order history yet.
- Error: retry orders query.

**Components needed**
- OrderCard, StatusPill, FilterTabs, EmptyOrdersState, ReorderButton.

**Firebase/backend dependencies**
- Firestore `orders` query by `buyerUid`.
- Optional `reorderFromOrder` callable for reorder.
- `notifications` deep links may route here.

**Navigation links**
- Order detail.
- Search.
- Support chat/home.

**Design notes from DESIGN_SYSTEM.md**
- Order cards use compact status pill with color at 12% alpha background.
- Timestamps and order IDs use caption/mono styles.

## 22. Order Detail

**Purpose**
- Single source of truth for order state, delivery tracking, support, and receipt context.

**Layout sections**
- Header: order number, store, placed time, total.
- Status stepper.
- Live map when out_for_delivery; otherwise progress summary.
- Items list.
- Prescription attached section if any.
- Payment summary.
- Event log collapsed by default.
- Action row: Call store, Help, Cancel/request cancellation, Reorder.

**Primary CTA**
- Active delivery: context CTA such as "Track delivery" if map collapsed.
- Delivered: "Reorder".
- Problem state: "Get help".

**Secondary actions**
- Call store.
- View receipt.
- Cancel before preparing.
- Open support.

**Empty/loading/error states**
- Loading: detail skeleton.
- Error/not found/no access: inline panel and back to Orders.
- Stale delivery location: ETA "Updating".
- Out of stock/refunded: show clear resolution panel.

**Components needed**
- OrderHeader, OrderStatusStepper, DeliveryMap, ItemSummaryList, EventLog, PaymentSummary, ActionRow.

**Firebase/backend dependencies**
- Firestore `orders/{orderId}` listener.
- Firestore `orders/{orderId}/events` listener.
- Firestore `deliveries/{deliveryId}` listener when active.
- `cancelOrder` callable.
- `reorderFromOrder` callable.

**Navigation links**
- Store detail.
- Support chat.
- Orders list.
- Product detail for item rows if available.

**Design notes from DESIGN_SYSTEM.md**
- Use the order/delivery stepper pattern.
- Delivery map is full-width functional content.
- Trust timestamps must remain visible.

## 23. Notifications Inbox

**Purpose**
- Give users an in-app record of order, prescription, payment, and system notifications.

**Layout sections**
- Header with unread count.
- Category filters: All, Orders, Prescriptions, Payments, System.
- Notification list grouped by date.
- Read/unread indicator.

**Primary CTA**
- Tap notification -> deep link target.

**Secondary actions**
- Mark all read.
- Filter category.
- Notification settings link.

**Empty/loading/error states**
- Loading: list skeleton.
- Empty: quiet icon and "No notifications yet".
- Error: retry inbox fetch.

**Components needed**
- NotificationRow, CategoryFilterTabs, UnreadDot, EmptyInboxState.

**Firebase/backend dependencies**
- Firestore `notifications/{uid}/items` query.
- Owner update of `readAt`.
- FCM token registered via `registerFcmToken`.

**Navigation links**
- Order detail.
- Prescription status.
- Support chat.
- Profile notification settings.

**Design notes from DESIGN_SYSTEM.md**
- Inbox is not a bottom tab; open from bell.
- Keep rows compact and readable; use icons for category scan.

## 24. Support Home

**Purpose**
- Help users create or continue support tickets for orders, payments, prescriptions, or account issues.

**Layout sections**
- Topic cards: Order issue, Payment issue, Prescription issue, Account/Other.
- Open tickets list.
- FAQ/search section.
- Optional context card when launched from order/prescription.

**Primary CTA**
- "Start support request" for selected topic.

**Secondary actions**
- Open existing ticket.
- Search FAQ.
- Back to originating order/prescription.

**Empty/loading/error states**
- Loading: ticket skeleton rows.
- Empty tickets: show topic cards only.
- Error: retry ticket load.

**Components needed**
- SupportTopicCard, TicketRow, FAQSearch, ContextSummaryCard.

**Firebase/backend dependencies**
- Firestore `supportTickets` query by owner.
- `createSupportTicket` callable.

**Navigation links**
- Support chat.
- Order detail.
- Prescription status.
- Profile.

**Design notes from DESIGN_SYSTEM.md**
- Support should feel calm and accountable.
- Avoid red warning styling unless the issue is destructive/urgent.

## 25. Support Chat

**Purpose**
- Provide threaded conversation between user and support team, optionally tied to an order/store/prescription.

**Layout sections**
- Ticket header: subject, status, linked context.
- Message list.
- Composer with attachment option.
- Status/resolution banner.

**Primary CTA**
- Send message.

**Secondary actions**
- Attach image/PDF if enabled.
- Mark resolved/close request when allowed.
- View linked order/prescription.

**Empty/loading/error states**
- Loading: message skeleton.
- Empty: first-message composer prompt.
- Error: failed send retry on message bubble.
- Closed ticket: composer disabled, reopen/support CTA if allowed.

**Components needed**
- ChatHeader, MessageBubble, Composer, AttachmentPreview, TicketStatusBanner.

**Firebase/backend dependencies**
- Firestore `supportTickets/{ticketId}` read.
- Firestore `supportTickets/{ticketId}/messages` listener.
- `postSupportMessage` callable.
- Optional Storage path for attachments.

**Navigation links**
- Support home.
- Order detail.
- Prescription status.
- Notification deep links.

**Design notes from DESIGN_SYSTEM.md**
- Use clear ownership in bubbles without noisy color.
- Attachment controls must meet touch target sizing.

## 26. Profile

**Purpose**
- Manage account, addresses, prescriptions, notification preferences, delivery preferences, legal links, and sign-out.

**Layout sections**
- Profile header: avatar, name, email, phone, verification status.
- Saved addresses summary.
- My prescriptions shortcut.
- Orders shortcut.
- Preferences: delivery strategy, notification categories, language placeholder.
- Support shortcut.
- Legal/about/version.
- Sign out.

**Primary CTA**
- Contextual: "Complete profile" if incomplete; otherwise no single dominant CTA.

**Secondary actions**
- Edit profile.
- Manage addresses.
- Manage notifications.
- View prescriptions.
- Sign out.

**Empty/loading/error states**
- Loading: profile skeleton.
- Error: retry profile load.
- Missing phone/address: show completion prompt.
- Sign-out failure: inline message near sign-out row.

**Components needed**
- ProfileHeader, SettingsRow, AddressSummaryCard, PreferenceSegmentedControl, SignOutButton.

**Firebase/backend dependencies**
- Firestore `users/{uid}` read/update for owner fields.
- Firestore `users/{uid}/addresses` query.
- Firestore `prescriptions` query by owner.
- Firebase Auth sign out.
- Storage avatar path `avatars/{uid}/*`.

**Navigation links**
- Profile setup/edit profile.
- Address picker/manage addresses.
- Prescription status/list.
- Orders list.
- Notifications inbox/settings.
- Support home.
- Auth stack after sign out.

**Design notes from DESIGN_SYSTEM.md**
- Keep profile utilitarian and scan-friendly.
- Use cards for individual repeated items only; do not nest cards.
- Sign out is secondary/destructive-adjacent but not bright red unless confirming.

## Cross-Screen Component Inventory

- AuthShell, TextField, PasswordField, PhoneField, LoadingButton, InlineFormError.
- AppHeader, AddressChip, NotificationBell, SegmentedToggle, FilterTabs.
- StoreCard, StoreHeader, VerifiedBadge, ProductCard, ProductHero, PriceBlock.
- RxBadge, RxGateCard, PrescriptionStatusHeader, PagePreviewGrid.
- CartLineItem, QuantityStepper, StickyCartBar, PriceSummary.
- PaymentMethodPicker, PaymentStateIcon, OrderCard, OrderStatusStepper.
- StoreMap, DeliveryMap, SelectedStoreSheet, MiniMap.
- NotificationRow, SupportTopicCard, TicketRow, MessageBubble, Composer.
- EmptyState, SkeletonList, InlineRetryPanel.

## Backend Dependency Map By Screen Group

- Auth/Profile: Firebase Auth, `users/{uid}`, `onUserCreate`, `setUserRole` only for admin-side role changes, avatar Storage.
- Location/Home/Search: `nearbyStores`, `searchMedicines`, `placesSearch`, `placeDetails`, `geocode`, `reverseGeocode`, `stores`, `inventory`, `medicines`.
- Cart/Checkout/Payment: `carts/{uid}`, `computeCartTotal`, `createOrder`, `createPaymentOrder`, `paymentsWebhook`, `verifyPaymentClient`.
- Prescriptions: `uploadPrescription`, `reviewPrescription`, `expirePrescriptions`, `onPrescriptionCreate`, `onPrescriptionStateChange`, `prescriptions`, prescription Storage path.
- Orders/Delivery: `orders`, `orders/{id}/events`, `deliveries`, `cancelOrder`, `updateOrderStatus`, `assignDelivery`, `markDelivered`.
- Notifications/Support: `registerFcmToken`, `sendNotification`, `notifications/{uid}/items`, `supportTickets`, `createSupportTicket`, `postSupportMessage`, `closeSupportTicket`.

## MVP Implementation Notes For Future Scaffold

- Specs assume expo-router route groups, but no route files should be created until explicit scaffold approval.
- Service wrappers should isolate all callable names so backend stubs can swap to real logic without screen rewrites.
- Mock data may be used only behind service wrappers; never mock approved prescriptions, payment success, order totals, or role permissions in production.
- Before public launch, run security/compliance review on Rx, payment, order, notification, and support flows.
