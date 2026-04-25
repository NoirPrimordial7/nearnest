# Medifind Mobile UI Screen Specs - Discovery MVP

Last updated: 2026-04-24 (Medifind entry/auth screen designs expanded)

## Canonical MVP definition

The Medifind mobile MVP does exactly five things. Every screen in this spec must serve one of these bullets.

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

## Authentication doctrine (MVP)

Firebase Authentication is **required** for the discovery MVP. A mobile user must be signed in and have a minimal `users/{uid}` profile before reaching Home.

- **MVP providers:** email / password (with email verification) AND Google sign-in. Both must ship together.
- **Phase 2 providers:** phone OTP, biometric unlock, Apple sign-in if iOS compliance requires it.
- **Profile requirement:** `users/{uid}` must carry at minimum `displayName`, `email`, `emailVerified`, `photoUrl?`, `authProvider`, `preferences`, `createdAt`, `updatedAt`. `onUserCreate` creates the doc; Profile setup screen completes it.
- **Account collision:** if a Google sign-in email matches an existing email/password account, surface a clear "link accounts" path rather than silently failing.

## Prescription-required medicine doctrine (MVP)

Medifind shows Rx medicines during discovery without becoming a dispensing gate. Every screen that can render an Rx medicine follows this doctrine:

- **Allowed.** Search, list, view, and navigate to stores that carry Rx medicines. Rx items behave like OTC items for the purpose of finding the store.
- **Required.** Display a strong, unmissable **"Prescription required"** badge on every surface that shows an Rx medicine: search results, availability rows, store inventories, medicine detail. Expand to the Rx warning block from `docs/DESIGN_SYSTEM.md` §7 on medicine detail. Copy: "Prescription required. Please carry a valid prescription when you visit or call the store."
- **Blocked in MVP.** No reserve, hold, order, delivery, prescription upload, pharmacist approval, or Rx-approval state. No CTA labelled "Reserve", "Order", "Add to cart", "Buy", "Request".
- **Blocked in MVP.** No medical advice, no dosage, no "how to take", no side effects, no contraindications, no symptom checker, no substitution advice. Even if the canonical `medicines/{id}` doc carries `usage` / `sideEffects` / `warnings`, mobile screens must NOT render them in MVP.
- **CTA guidance.** On any Rx surface the primary CTA is **"Navigate to store"**; secondary is **"Call store"**. Empty-state copy on Rx items: "Please contact the store directly for availability and to confirm your prescription."

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

Phone OTP is also Phase 2. A detailed Phone OTP design is included below so the future flow stays consistent with Medifind, but it must not be scaffolded or enabled for MVP.

## 1. Splash

**Purpose**
- Bootstrap Firebase Auth, cached profile/search area, feature flags, and route decisions while establishing the Medifind brand.

**Layout structure**
- Full-screen `--color-bg`.
- Safe-area container with 24px horizontal padding.
- Center group vertically centered: Medifind app mark, wordmark, and one-line tagline.
- Bottom status row fixed 32px above the safe-area bottom for long boot states only.
- No card, no hero illustration, no gradient, no `by Nearnest` mark on this primary surface.

**UI hierarchy**
- Level 1: Medifind symbol in a 72x72 circle, `--color-primary-50` background, icon in `--color-primary-600`.
- Level 2: `Medifind` wordmark, `--font-h1`, weight 600, `--color-text`.
- Level 3: tagline in `--font-body-sm`, `--color-text-muted`.
- Level 4: boot status in `--font-caption`, `--color-text-soft`, shown only after 1000ms.

**Exact text**
- Wordmark: `Medifind`
- Tagline: `Find nearby medicines faster.`
- Boot text after 1000ms: `Getting Medifind ready`
- Offline cached text: `You are offline. We will use saved details if available.`

**Primary CTA**
- None.

**Secondary actions**
- None.

**Button styles**
- No buttons in the normal state.
- If bootstrap fails, show one secondary button: `Try again`, height 48px, radius `--radius-md`, 1px `--color-border`, label `--color-text`.

**Spacing**
- Center group gap: 12px between mark and wordmark, 8px between wordmark and tagline.
- Status row top margin from center group if it appears in-place on compact screens: 32px.
- Retry panel, when needed: 24px horizontal margin, 16px padding, radius `--radius-lg`.

**Loading states**
- Brand mark fades from 0.92 to 1.0 opacity in a 1200ms loop.
- Three 4px progress dots under tagline if boot exceeds 600ms; dots use `--color-primary-300`.
- Never use a full-screen spinner.

**Error states**
- Firebase/bootstrap failure panel text:
  - Title: `We could not start Medifind.`
  - Body: `Check your connection and try again.`
  - Button: `Try again`
- Offline without cache:
  - Title: `You are offline.`
  - Body: `Connect to the internet to sign in and find stores nearby.`
  - Button: `Try again`
- Errors use inline panel styling, not a toast.

**Interaction notes**
- Check Auth current user, profile completeness, email verification, and saved search area.
- Route unauthenticated users to Welcome.
- Route authenticated users without verified email to Email Verification.
- Route authenticated users missing profile fields to Profile Setup.
- Route authenticated users missing search area to Location Permission.
- Route complete users to Home List.

**Transitions/animations**
- App mark fades in over 220ms and scales from 0.96 to 1.0.
- Route transition uses a 180ms fade; do not slide the splash away.
- Retry panel appears with a 140ms fade and 8px upward motion.

**Components needed**
- BrandMark, BootStatusText, InlineRetryPanel.

**Firebase/backend dependencies**
- Firebase Auth current user.
- Cached `users/{uid}` and saved location/search area.

**Navigation links**
- Unauthenticated -> Welcome or Sign in.
- Authenticated -> Home list.
- Missing search area -> Location permission.

**Design notes**
- Must use Medifind wordmark. Do not show Nearnest as the primary brand on Splash.
- Near-white background; no hero card or decorative gradient.

## 2. Welcome / Onboarding

**Purpose**
- Explain Medifind's discovery promise: find a medicine, see nearby verified stores, call or navigate before going.

**Layout structure**
- Full-screen `--color-bg` with 24px horizontal padding.
- Top safe-area row: Medifind wordmark left, no skip action.
- Main pager area: icon circle, headline, body copy.
- Bottom fixed action area: pagination dots, primary button, sign-in footer link.
- Use three slides; no auto-advance.

**UI hierarchy**
- Wordmark: `Medifind`, `--font-h3`, weight 600.
- Slide icon: 72x72 circle, `--color-primary-50`; icon 32px, `--color-primary-600`.
- Headline: `--font-display`, weight 600, `--color-text`, max 2 lines.
- Body: `--font-body`, `--color-text-muted`, max 3 lines.
- Pagination dots: active dot 18x6 pill in `--color-primary-500`; inactive 6x6 in `--color-border`.
- Footer link text: `--font-body-sm`.

**Exact text**
- Slide 1 headline: `Find the medicine you need`
- Slide 1 body: `Search by brand, salt, strength, or form.`
- Slide 2 headline: `See nearby verified stores`
- Slide 2 body: `Compare distance, open status, price, and latest availability.`
- Slide 3 headline: `Call or navigate before you go`
- Slide 3 body: `Confirm with the store, then open directions in your maps app.`
- Primary button on slides 1 and 2: `Next`
- Primary button on slide 3: `Get started`
- Footer link: `Already have an account? Sign in`

**Primary CTA**
- Slide 1/2: `Next`.
- Slide 3: `Get started`.

**Secondary actions**
- `Sign in` from footer.
- No guest/skip action in MVP because Firebase Auth is required before Home.

**Button styles**
- Primary: full-width 48px, filled `--color-primary-500`, white label, radius `--radius-md`.
- Footer `Sign in`: ghost text using `--color-primary-700`, no border, minimum 44px touch target.
- Primary disabled state is not expected; if the pager cannot render, show an inline retry.

**Spacing**
- Top wordmark margin: safe area + 16px.
- Pager top padding: 56px from top row on standard phones.
- Icon to headline: 24px.
- Headline to body: 12px.
- Body to dots: 40px minimum.
- Dots to primary button: 24px.
- Primary button to footer link: 16px.
- Bottom action area: 24px bottom safe-area padding.

**Loading states**
- None in normal use.
- If remote feature flags are ever required, keep slide content visible and show a small inline caption: `Checking setup`.

**Error states**
- Pager asset/icon failure: fall back to lucide icons.
- Feature/bootstrap failure inherited from Splash should not occur here; if it does, show:
  - Title: `Something went wrong.`
  - Body: `Try again to continue setting up Medifind.`
  - Button: `Try again`

**Interaction notes**
- Swiping updates dots and button label.
- Tapping `Next` advances one slide.
- Tapping `Get started` routes to Sign Up.
- Tapping `Sign in` routes to Sign In.
- Persist `hasSeenOnboarding` locally after `Get started`, not after the first slide.

**Transitions/animations**
- Horizontal pager uses native paging with 220ms ease-out.
- Icons fade and move 8px upward as each slide becomes active.
- Button label crossfades over 120ms when changing from `Next` to `Get started`.

**Components needed**
- OnboardingPager, OnboardingSlide, PaginationDots, AuthFooterLinks.

**Firebase/backend dependencies**
- None.

**Navigation links**
- Sign up.
- Sign in.

**Design notes**
- Use Search, ShieldCheck, PhoneCall, and MapPin icons from `lucide-react-native`.
- Copy must avoid delivery, checkout, order, and prescription-upload promises.
- Must use Medifind brand only on primary onboarding surfaces.

## 3. Sign In

**Purpose**
- Let returning users authenticate for saved search areas, recent searches, and preferences.

**Layout structure**
- Full-screen `--color-bg` with keyboard-aware scroll.
- Safe-area header: back arrow icon button if entered from Sign Up, otherwise no back button.
- Auth content column with title, supporting copy, form fields, forgot-password link, primary button, divider, Google button, footer create-account link.
- Form stays vertically centered on tall screens and top-aligned with 32px top padding when keyboard is open.

**UI hierarchy**
- Title: `--font-h1`, weight 600, `--color-text`.
- Supporting copy: `--font-body`, `--color-text-muted`.
- Field labels: `--font-body-sm`, weight 500, `--color-text`.
- Inputs: 48px height, `--color-surface`, 1px `--color-border`, radius `--radius-md`, 16px horizontal padding.
- Forgot link: right-aligned, `--font-body-sm`, `--color-primary-700`.
- Error text: `--font-body-sm`, `--color-danger`, placed under the relevant field or form.

**Exact text**
- Title: `Welcome back`
- Supporting copy: `Sign in to keep your saved areas and recent medicine searches.`
- Email label: `Email address`
- Email placeholder: `you@example.com`
- Password label: `Password`
- Password placeholder: `Enter your password`
- Forgot link: `Forgot password?`
- Primary button: `Sign in`
- Loading primary button: `Signing in`
- Divider label: `or`
- Google button: `Continue with Google`
- Footer: `New to Medifind? Create account`

**Primary CTA**
- `Sign in` (email + password).

**Secondary actions**
- `Continue with Google` (MVP provider required alongside email/password).
- `Forgot password?`
- `Create account`
- No guest mode in MVP; Firebase Auth sign-in is required before Home.

**Button styles**
- Primary: full-width 48px, filled `--color-primary-500`, white label, radius `--radius-md`.
- Primary loading: same button, spinner left of `Signing in`, disabled.
- Google: full-width 48px secondary button, white surface, 1px `--color-border`, radius `--radius-md`, Google glyph left, label `--color-text`.
- Back arrow: 44x44 ghost icon button.

**Spacing**
- Screen horizontal padding: 24px.
- Header to title: 32px.
- Title to supporting copy: 8px.
- Supporting copy to first field: 32px.
- Between fields: 16px.
- Forgot link top margin: 8px.
- Forgot link to primary button: 24px.
- Primary to divider: 24px.
- Divider to Google button: 16px.
- Google button to footer: 24px.

**Loading states**
- Email sign-in: disable all fields and buttons; primary label becomes `Signing in`.
- Google sign-in: disable all fields and buttons; Google button label becomes `Connecting to Google`.
- Profile read after auth: show inline caption under primary area: `Loading your Medifind profile`.

**Error states**
- Empty email: `Enter your email address.`
- Invalid email: `Enter a valid email address.`
- Empty password: `Enter your password.`
- Wrong credentials: `Email or password is incorrect.`
- Network failure: `We could not sign you in. Check your connection and try again.`
- Unverified email: route to Email Verification and show `Please verify your email to continue.`
- Google collision: open Link Accounts sheet with title `This email already has an account` and body `Sign in with your password once to link Google to Medifind.`

**Components needed**
- AuthShell, TextField, PasswordField, InlineFormError, LoadingButton, **GoogleSignInButton**, **LinkAccountsSheet**.

**Firebase/backend dependencies**
- Firebase Auth `signInWithEmailAndPassword`.
- Firebase Auth **Google provider** (via `expo-auth-session` / Google sign-in when scaffold lands).
- `users/{uid}` read.
- `onUserCreate` initialises `users/{uid}` on first Google sign-in.

**Navigation links**
- Forgot password.
- Sign up.
- Email verification.
- Home list or Location permission.

**Design notes**
- Use Medifind in copy, not Nearnest.
- One primary button; accessible fields and focus states.

**Interaction notes**
- Submit from keyboard triggers `Sign in` if fields are valid.
- Password field has Show/Hide icon with accessible label.
- On successful sign-in, route through the same Splash/bootstrap decision logic, not directly to Home.
- Footer `Create account` preserves any prefilled email.

**Transitions/animations**
- Form enters with 160ms fade and 8px upward motion.
- Field validation appears inline with no layout jump; reserve 18px helper space under active fields.
- Link Accounts sheet slides up from bottom over 220ms and dims backdrop to 20% black.

## 4. Sign Up

**Purpose**
- Create an account for saved search/location preferences and future commerce readiness.

**Layout structure**
- Full-screen `--color-bg` with keyboard-aware scroll.
- Safe-area header with back arrow icon button.
- Auth content column: title, supporting copy, full name, email, password, terms checkbox, primary button, divider, Google button, footer sign-in link.
- Terms/privacy text sits before the primary CTA so consent is explicit.

**UI hierarchy**
- Title: `--font-h1`, weight 600, `--color-text`.
- Supporting copy: `--font-body`, `--color-text-muted`.
- Field labels and input style match Sign In.
- Password helper uses `--font-body-sm`, `--color-text-soft`.
- Terms row: 20x20 checkbox, body-sm copy, links in `--color-primary-700`.
- Footer link: centered body-sm.

**Exact text**
- Title: `Create your Medifind account`
- Supporting copy: `Save your search area and find verified stores faster.`
- Name label: `Full name`
- Name placeholder: `Your name`
- Email label: `Email address`
- Email placeholder: `you@example.com`
- Password label: `Password`
- Password placeholder: `Create a password`
- Password helper: `Use at least 8 characters.`
- Terms copy: `I agree to the Medifind Terms and Privacy Policy.`
- Primary button: `Create account`
- Loading primary button: `Creating account`
- Divider label: `or`
- Google button: `Continue with Google`
- Footer: `Already have an account? Sign in`

**Primary CTA**
- `Create account` (email + password).

**Secondary actions**
- `Continue with Google` (MVP provider required alongside email/password).
- `Sign in`.
- Terms/privacy links.

**Button styles**
- Primary: full-width 48px, filled `--color-primary-500`, white label, radius `--radius-md`.
- Primary disabled until name, valid email, valid password, and terms checkbox are complete.
- Google: same secondary style as Sign In.
- Terms links: ghost text style, no underline unless focused.

**Spacing**
- Screen horizontal padding: 24px.
- Header to title: 24px.
- Title to supporting copy: 8px.
- Supporting copy to first field: 28px.
- Between fields: 16px.
- Password helper top margin: 6px.
- Fields to terms row: 20px.
- Terms row to primary button: 24px.
- Primary to divider: 24px.
- Divider to Google button: 16px.
- Google button to footer: 24px.

**Loading states**
- Email account creation: disable form; primary label becomes `Creating account`.
- Sending verification email: keep button disabled and show caption `Sending verification email`.
- Google sign-up: disable form; Google button label becomes `Connecting to Google`.

**Error states**
- Missing name: `Enter your full name.`
- Invalid email: `Enter a valid email address.`
- Weak password: `Use at least 8 characters.`
- Terms unchecked on submit attempt: `Please accept the Terms and Privacy Policy.`
- Duplicate email: `An account already exists for this email. Sign in instead.`
- Google collision: show Link Accounts sheet as in Sign In.
- Network failure: `We could not create your account. Check your connection and try again.`

**Components needed**
- AuthShell, TextField, PasswordField, CheckboxRow, LoadingButton, **GoogleSignInButton**, **LinkAccountsSheet**.

**Firebase/backend dependencies**
- Firebase Auth create account (email/password).
- Firebase Auth Google provider.
- Email verification send.
- `onUserCreate` creates `users/{uid}` with `authProvider` = `'password' | 'google.com'`.

**Navigation links**
- Email verification.
- Sign in.

**Design notes**
- Use Medifind as the app name. Do not mention delivery, checkout, order, prescription upload, or payment benefits in MVP copy.
- Phone number is not required in MVP sign-up; Phone OTP is Phase 2 unless scope changes.

**Interaction notes**
- On email/password success, send verification email and route to Email Verification.
- On Google success, rely on provider-verified email and route through profile/search-area bootstrap.
- Keep account creation idempotent: if profile doc is delayed, show loading caption instead of an error for the first retry window.
- Footer `Sign in` preserves prefilled email.

**Transitions/animations**
- Form enters with 160ms fade and 8px upward motion.
- Checkbox press uses 120ms scale 0.96 -> 1.0.
- Successful create transitions to Email Verification with a 180ms horizontal slide.

## 4.1 Phone OTP Flow (Phase 2, not MVP)

**Purpose**
- Future phone-number verification or phone-based sign-in. This design is documented for consistency, but Phone OTP must not be enabled, scaffolded, or treated as an MVP blocker.

**Layout structure**
- Two-step auth stack:
  - Step 1: phone number entry.
  - Step 2: six-digit OTP entry.
- Same AuthShell as Sign In/Sign Up.
- Step indicator near top: `1 of 2` / `2 of 2` in `--font-caption`.
- Bottom action area contains one primary button and one secondary text action.

**UI hierarchy**
- Title: `--font-h1`, weight 600.
- Body: `--font-body`, `--color-text-muted`.
- Phone input: 48px height with country code selector; default country follows app locale/config.
- OTP input: six fixed 44x52 boxes, radius `--radius-md`, centered digits, `--font-h2`.
- Resend countdown: `--font-body-sm`, `--color-text-soft`; active resend link uses `--color-primary-700`.

**Exact text**
- Step 1 title: `Verify your phone`
- Step 1 body: `Use a number you can access. Medifind will send a one-time code.`
- Phone label: `Mobile number`
- Phone placeholder: `98765 43210`
- Step 1 primary button: `Send code`
- Step 1 loading button: `Sending code`
- Step 1 footer action: `Use email instead`
- Step 2 title: `Enter the 6-digit code`
- Step 2 body: `We sent it to {phoneNumber}.`
- OTP label: `Verification code`
- Step 2 primary button: `Verify phone`
- Step 2 loading button: `Verifying`
- Resend disabled: `Resend code in {seconds}s`
- Resend active: `Resend code`
- Change number action: `Change number`
- Success message: `Phone verified`

**Primary CTA**
- Step 1: `Send code`.
- Step 2: `Verify phone`.

**Secondary actions**
- `Use email instead`.
- `Change number`.
- `Resend code` after cooldown.

**Button styles**
- Primary buttons match Sign In: full-width 48px, filled `--color-primary-500`, white label, radius `--radius-md`.
- `Use email instead`, `Change number`, and `Resend code` use ghost style with 44px minimum touch target.
- OTP boxes use `--shadow-focus` on active cell.

**Spacing**
- Screen horizontal padding: 24px.
- Step indicator to title: 24px.
- Title to body: 8px.
- Body to input: 32px.
- OTP boxes gap: 8px.
- Input to primary button: 28px.
- Primary button to secondary action: 16px.

**Loading states**
- Sending code: disable phone input and country selector; primary label `Sending code`.
- Verifying code: disable OTP cells; primary label `Verifying`.
- Resend code: show inline caption `Sending a new code`.

**Error states**
- Invalid phone: `Enter a valid mobile number.`
- SMS quota/rate limit: `Too many attempts. Try again later.`
- Code mismatch: `That code did not match. Try again.`
- Code expired: `This code expired. Request a new one.`
- Network failure: `We could not verify your phone. Check your connection and try again.`
- Unsupported region: `Phone sign-in is not available for this number yet.`

**Components needed**
- AuthShell, PhoneField, CountryCodeSelector, OtpCodeInput, CountdownButton, InlineFormError, LoadingButton.

**Firebase/backend dependencies**
- Phase 2 only: Firebase Phone Auth or an approved OTP provider.
- Requires platform-specific bot protection/verification configuration during scaffold/implementation.
- `users/{uid}.phoneNumber` update only after successful verification.

**Navigation links**
- Sign in.
- Sign up.
- Profile setup after linking/verifying an authenticated user.

**Design notes**
- Keep this visually consistent with Medifind auth screens but label it Phase 2 in planning.
- Do not add phone OTP to MVP onboarding or primary auth CTAs without explicit product approval.

**Interaction notes**
- Auto-advance focus between OTP cells.
- Paste of a six-digit code fills all cells.
- Backspace on an empty cell moves focus to the previous cell.
- Resend cooldown starts at 30 seconds after each send.
- Lock verification for a short cooldown after repeated failures.

**Transitions/animations**
- Step 1 to Step 2 uses 180ms horizontal slide.
- OTP focus ring appears instantly; invalid OTP shakes the code row by 6px for 160ms once.
- Success state uses a 140ms check icon fade before routing forward.

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
- Show non-medical facts about the medicine and where nearby it is available. **Not** a medical information screen.

**Layout sections**
- Name, aliases, salt, form, strength, pack size, manufacturer (optional).
- Strong Rx badge + full Rx warning block (from `docs/DESIGN_SYSTEM.md` §7) when `requiresPrescription` is true.
- Nearby available store list.
- Alternatives by same salt if available (as a neutral list — no recommendation language).
- **Not rendered in MVP:** dosage, how-to-take, side effects, contraindications, warnings beyond the Rx-required notice, age/weight guidance, substitution advice, reviews.

**Primary CTA**
- **"Navigate to store"** on the top availability row — NOT "Reserve", "Order", "Add to cart", "Buy", "Request".

**Secondary actions**
- Call store.
- Select a different availability row -> Store detail.
- Compare alternatives (neutral list of same-salt medicines).

**Empty/loading/error states**
- Loading: medicine skeleton.
- Error: unavailable medicine detail with retry/back.
- No available stores: widen radius / change area / notify me optional.
- Rx + no available stores: "Please contact nearby verified stores directly to confirm availability and your prescription."

**Components needed**
- ProductHero, MedicineFacts, **RxWarningBlock** (strong), StoreAvailabilityList.
- **Removed from MVP:** SafetyInfoAccordion, dosage/usage modules.

**Firebase/backend dependencies**
- `medicines/{medicineId}` — read only `name`, `aliases`, `salt`, `form`, `strength`, `packSize`, `manufacturer?`, `requiresPrescription`, `schedule?`. Do **not** render `usage`, `sideEffects`, `warnings` in MVP.
- Availability from `searchMedicines` or inventory query.

**Navigation links**
- Store detail.
- Contact store.
- Navigation handoff.
- Search results.

**Design notes**
- Rx copy (MVP verbatim): "**Prescription required.** Please carry a valid prescription when you visit or call the store."
- No approval workflow, no upload prompt, no "we'll verify" language.
- No medical advice of any kind, even implicit (avoid "recommended", "safe", "suitable for").

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

- AuthShell, TextField, PasswordField, PhoneField, CountryCodeSelector, OtpCodeInput, CountdownButton, LoadingButton, InlineFormError.
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

---

# Discovery Redesign 2026-04-25 (authoritative)

This appendix supersedes the discovery screens (Home list, Home map, Search, Search results, Store detail, Product detail, Contact store, Navigation handoff) above. Auth, profile, splash, welcome, verify-email, forgot-password, profile-setup screens above remain valid as written. Empty/error/offline templates here are the canonical shared templates for the whole app.

## Route map (expo-router, mock-data only)

```
app/
├── index.tsx                          (existing) Splash
├── welcome.tsx                        (existing)
├── sign-in.tsx                        (existing)
├── sign-up.tsx                        (existing)
├── verify-email.tsx                   (existing)
├── forgot-password.tsx                (existing)
├── profile-setup.tsx                  (existing)
├── home.tsx                           REDESIGN: dual-mode home
├── search.tsx                         REDESIGN: live-suggestion search
├── results.tsx                        NEW: grouped search results
├── medicine/
│   └── [medicineId].tsx               REDESIGN: medicine detail
├── medicine/
│   └── [medicineId]/stores.tsx        NEW: nearby stores for this medicine (map + sheet)
├── stores/
│   └── index.tsx                      NEW: Stores mode landing
├── store/
│   └── [storeId].tsx                  REDESIGN: store detail with inventory + in-store search
├── category/
│   └── [categoryId].tsx               NEW: category browse
└── profile.tsx                        REDESIGN: lightweight, plus large-type toggle
```

A bottom tab is **not** added. Navigation is stack-based; the mode toggle on Home replaces a tab. Profile is reachable via the avatar in the Home header.

## Shared empty / error / offline templates

These are referenced by screen specs below as `Template:Empty`, `Template:Error`, `Template:Offline`, `Template:Stale`, `Template:NoMatch`. Implement once.

### Template:Empty
Layout: 24 px padding, vertically centered. 56×56 circle in `--color-primary-50` with a neutral icon. h3 title, body line, optional ghost CTA.
Strings vary by screen (see each spec). Default action label: `Try a search`.

### Template:Error
Layout: identical container. 56×56 circle in `--color-surface-alt` with a `!` glyph in `--color-danger`.
Title: `Something went wrong.`
Body: `We could not load this. Check your connection and try again.`
Primary CTA (secondary button style): `Try again`. Telemetry: `medifind.error.shown` with `screen_id` and `error_code`.

### Template:Offline
Top of screen, sticky banner, 36 px tall, `--color-rx-bg`, `--color-rx-text` text. Text: `You are offline. Showing your last saved view.` Plus inline body if no cache exists: `We could not reach Medifind. Please reconnect.` Telemetry: `medifind.offline.shown`.

### Template:Stale
Inline banner above the list it qualifies. `--color-warning` border at 12% alpha, body text in `--color-text`.
Strings:
- ≥ 24 h, < 72 h: `Stock data was last updated more than a day ago. Call the store to confirm.`
- ≥ 72 h: `Stock data is more than 3 days old. We will hide this store soon if it does not update.`

### Template:NoMatch
Layout: same as Empty with a 56×56 circle and `?` glyph in `--color-text-muted`.
Title: `No match.`
Body: `Try a brand name like "Crocin" or a composition like "Paracetamol 500".`
Tertiary CTA: `Browse pharmacies near me` (links to /stores).

---

## Screen 1 — Home (dual-mode)

**Purpose.** Get the user from open-app to either a medicine search or a list of nearby pharmacies in one tap.

**User mental state.** Either (a) urgent — knows the medicine name, just wants stores; (b) chronic — wants to glance at "is my usual store open"; or (c) walk-in with a list — wants to start typing.

**Layout zones.**
1. Header (sticky, 64 px). Left: avatar (32×32) → Profile. Centre: nothing. Right: location chip (`Bengaluru · Indiranagar`, tap → address picker, max 22 chars truncated).
2. Mode toggle (full-width pill, 48 px tall). Two segments, equal width: `Medicine` (default), `Medical Stores`.
3. Search bar (Pressable, not focused — tapping pushes /search). 56 px tall, rounded `--radius-lg`, magnifier icon left, placeholder right.
4. Recent + popular row (medicine mode only). Horizontal scroll, 12 chips max, ordered by recency then popularity.
5. Categories grid (medicine mode only). 4 columns × 2 rows = 8 cards (`Pain Relief`, `Cold & Cough`, `Diabetes`, `Skin Care`, `Baby Care`, `First Aid`, `Vitamins`, `Rx Medicines`).
6. Stores preview list (always visible, below). 3 store cards (verified-only, sorted by distance), each with name, distance, open state, freshness. Tap → /store/[storeId].
7. Footer line (caption, muted): `Stock can change. Call the store to confirm before you travel.`

**Components used.** `AppHeader`, `AvatarButton`, `LocationChip`, `ModeToggle`, `SearchFieldButton`, `MedicineChip`, `CategoryCard`, `StorePreviewCard`, `DisclaimerLine`. (Tokens — see DESIGN_SYSTEM redesign appendix.)

**Exact copy.**
- Toggle labels: `Medicine`, `Medical Stores`.
- Search placeholder (medicine mode): `Search a medicine, brand or composition`.
- Search placeholder (stores mode): `Search a pharmacy by name or area`.
- Recent + popular section title: `Quick searches`.
- Categories section title: `Browse by category`.
- Stores preview section title (medicine mode): `Pharmacies near you`.
- Stores preview section title (stores mode): `Pharmacies near you` (same — section becomes the primary content).
- Footer disclaimer: `Stock can change. Call the store to confirm before you travel.`
- Avatar a11y label: `Open profile, signed in as <displayName>`.
- Location chip a11y label: `Change search area, currently <area>`.

**States.**
- `loading`: skeleton chips (8) + skeleton store cards (3). Search bar and toggle never skeletonised.
- `empty` (no recents AND no popular near you): hide section 4; categories grid is the empty fallback.
- `partial-results` (only recents, no popular): show recents only.
- `no-results` (no nearby stores at all in radius): replace section 6 with `Template:Empty` titled `No verified pharmacies near you yet.` body `Try a wider radius or check back later.` CTA: `Change search area`.
- `error`: section 6 only → `Template:Error` with `screen_id: 'home'`, `error_code: 'nearby_load_failed'`.
- `offline`: `Template:Offline` banner over section 1; sections 4 and 6 show last-cached results if available.
- `stale-data`: inline `Template:Stale` 24h variant above the stores preview list when the freshest store's data is > 24 h old.

**Accessibility.**
- Mode toggle: `role=tablist`, each segment `role=tab`, with `aria-selected`. Touch target 48×48.
- Category cards: 84 px tall minimum, label below icon, contrast ≥ 4.5:1.
- All chips at least 44 px tall in large-type mode.

**Telemetry.** `medifind.app.launch` (cold start), `medifind.home.mode_toggle` on toggle, `medifind.search.suggestion_tapped` on chip tap, `medifind.category.opened` on category card tap, `medifind.stores.store_card_tapped` on store preview tap.

**Does NOT do.** No live search on Home (tapping the field opens Search). No map. No filtering. No "buy" CTA, ever.

---

## Screen 2 — Search (live suggestions)

**Purpose.** Capture intent in 2-3 keystrokes and route to a result.

**User mental state.** They know roughly what they want. They are typing one-handed, possibly with autocorrect fighting them.

**Layout zones.**
1. Header (sticky 64 px). Back chevron left, search field full-width (autofocused), `Cancel` text button right (only when keyboard is open).
2. Suggestion list (scrollable). Sectioned: **Recent**, **Popular**, **Suggestions** (live as user types).
3. When suggestions return zero matches: `Template:NoMatch`.

**Components.** `BackButton`, `SearchInput` (autofocus), `CancelButton`, `SuggestionRow`, `SectionHeader`.

**Exact copy.**
- Field placeholder: `Search a medicine, brand or composition`.
- `Cancel` button label: `Cancel`.
- Empty (no input yet): show Recent (max 5) and Popular (max 8) sections. Section titles: `Recent searches`, `Popular medicines near you`.
- Suggestion row hint labels: `Brand`, `Composition`, `Symptom`, `Category`.
- Typo correction inline above suggestions: `Showing results for **{corrected}**. Search for **{original}** instead?` — `{original}` is a tappable link.
- Hindi correction: `Showing results for **{english}** (matched **{hindi}**).`
- Stores-mode placeholder (when reached from Stores tab): `Search a pharmacy by name or area`.

**States.**
- `loading` (suggestions debounced): inline thin progress bar under the search field for ≤ 1 s.
- `empty` (no input): Recent + Popular shown. If both empty: `Template:Empty` with body `Start typing a medicine or brand to see suggestions.`
- `partial-results` (1-2 suggestions): show what's there + a `See all results` link to /results.
- `no-results`: `Template:NoMatch`.
- `error`: `Template:Error` with `error_code: 'suggestions_failed'`.
- `offline`: search still works against cached recents; live suggestions section shows `Template:Offline` inline strip with text `Live suggestions are not available offline.`

**Accessibility.** Field a11y label: `Search medicines, brands or compositions`. Each suggestion row has `accessibilityRole=button` and `accessibilityHint` listing the hint label. Pressing return fires submit.

**Telemetry.** `medifind.search.submitted` on return key or row tap (with `q_length`, `had_correction`). `medifind.search.suggestion_tapped` for any tapped suggestion. `medifind.search.no_results` when zero matches after debounce.

**Does NOT do.** No filters here. No store list here.

---

## Screen 3 — Search results (grouped)

**Purpose.** Present a search query's matches grouped clearly so the user can pick exact, variant, or composition match.

**Mental state.** They typed and submitted. They want the right card to be obvious in 2 seconds.

**Layout.**
1. Header (sticky). Back, the query as the title, edit-icon to reopen Search.
2. Filter strip. Three chips: `All`, `OTC`, `Rx`. Default `All`. (Filter only — never gates results, only narrows.)
3. Result groups (top to bottom):
   - **Group A — Best match (single card).** The medicine that exactly matches the typed query. Larger card.
   - **Group B — Same brand variants.** Other variants from the same manufacturer (e.g. Crocin Advance, Crocin Pain Relief).
   - **Group C — Same composition.** Other branded medicines with the same composition (e.g. Calpol, Dolo for Paracetamol 500).
   - **Group D — Similar by category.** Same category but different composition. Capped at 6 entries.
4. Footer: `Template:Stale` if any rendered card has stale availability.

**Components.** `BackHeader`, `FilterChipRow`, `MedicineCardLarge`, `MedicineCardCompact`, `GroupHeader`, `RxBadge`, `AvailableNearbyBadge`, `DisclaimerLine`.

**Exact copy.**
- Header back-button a11y: `Back to search`.
- Filter labels: `All`, `OTC`, `Rx`.
- Group A header: hidden (the larger card is the header).
- Group B header: `Other {manufacturer} options`.
- Group C header: `Same composition`.
- Group D header: `Similar by category`.
- Card subtitle pattern: `{manufacturer} · {composition} · {packSize}`.
- Available-nearby badge label: `Available at {n} nearby`.
- No-availability badge label: `Not in nearby stores`.
- Empty (no group A): replace with `Template:NoMatch` titled `No match for "{query}".`
- Per-card CTA label: `Find nearby stores`.
- Tap target on card body opens medicine detail; tap on the CTA opens the medicine's nearby-stores screen directly.

**States.**
- `loading`: 1 large skeleton + 4 compact skeletons.
- `empty` (no group A, no group B, no group C): `Template:NoMatch`.
- `partial-results` (only Groups B+C, no exact A): show groups present, hide A. Add a small note above: `No exact match. Showing close options.`
- `no-results`: `Template:NoMatch`.
- `error`: `Template:Error`, `error_code: 'results_failed'`.
- `offline`: `Template:Offline` banner. If cached results exist, show them dimmed by 8% with a stale note.
- `Rx-required`: every Rx card carries the Rx badge; no special screen treatment.

**Accessibility.** Group headers are `role=heading aria-level=2`. Cards expose `accessibilityLabel` combining name + manufacturer + Rx status + nearby count. Touch targets ≥ 56 px tall.

**Telemetry.** `medifind.results.medicine_viewed` when a medicine card tap navigates away; `medifind.results.find_stores_tapped` when the card's primary CTA fires.

**Does NOT do.** No price comparison ranking. No reviews. No add-to-cart.

---

## Screen 4 — Medicine detail

**Purpose.** Confirm "yes, this is the medicine" and route to nearby stores that have it.

**Mental state.** The user is verifying. They want to read the manufacturer, composition, pack size, and Rx status — then move on.

**Layout zones.**
1. Header. Back, share-icon (system share, optional in MVP), bookmark-icon (local-only "save for later", v2 toggle).
2. Hero (240 px). Centered medicine image (180 px square), `--color-surface-alt` background.
3. Identity block. h2 medicine name, body composition line, caption pack-size + form, Rx badge inline if applicable.
4. Manufacturer line. Body, `--color-text-muted`. Format: `By {manufacturer}`.
5. Description (one neutral sentence, max 120 chars). Example for Paracetamol: `Paracetamol is an over-the-counter analgesic and antipyretic.` No dosage. No indications. No "consult".
6. Rx warning block (full Rx pattern from DESIGN_SYSTEM §7) — only when `requiresPrescription === true`.
7. Nearby availability summary card. `Available at {n} nearby pharmacies` + a stub of the top-3 store names with distance.
8. Primary CTA (sticky bottom, 16 px above safe-area): `Find nearby stores` (full-width, `--color-primary-500`).
9. Similar medicines section (below the fold). h3 `Similar medicines`, horizontal scroll of 6 compact cards.

**Components.** `MedicineHeroImage`, `MedicineIdentityBlock`, `RxWarningBlock`, `AvailabilitySummaryCard`, `PrimaryCTA`, `SimilarMedicineRail`.

**Exact copy.**
- Hero a11y label: `Photo of {medicineName}, {form}, {packSize}`.
- Manufacturer line: `By {manufacturer}`.
- Description: one sentence per medicine, supplied in mock data. **Never dosage or indication.** Paracetamol example above is the canonical pattern.
- Rx warning block (full): title `Prescription required`, body `Please carry a valid prescription when you visit or call the store.` Sub-line: `Medifind does not take prescriptions or fulfil orders.` No CTA inside the block.
- Availability card title (with stores): `Available at {n} nearby pharmacies`.
- Availability card title (zero): `Not currently in nearby pharmacies.`
- Availability card sub-line: stub of 3 store names: `{store1}, {store2}, {store3} +{n-3} more`.
- CTA label (with stores): `Find nearby stores`.
- CTA label (no stores): `Show pharmacies anyway` (greyed primary; opens the nearby-stores screen with empty state).
- Similar header: `Similar medicines`.
- Similar a11y for each card: `{name} by {manufacturer}, similar to {currentMedicineName}`.

**States.**
- `loading`: image skeleton + identity skeleton + sticky CTA disabled with `Loading availability`.
- `empty` (no medicine matched): `Template:Error`, `error_code: 'medicine_not_found'`.
- `partial-results` (medicine loaded but availability still loading): show identity + Rx + skeleton availability + CTA disabled.
- `no-results` (medicine loaded, zero nearby): availability card collapses to the zero variant; CTA reads `Show pharmacies anyway`.
- `error`: `Template:Error`, `error_code: 'medicine_failed'`.
- `offline`: render from cache if present. If image is uncached, show neutral placeholder block with the medicine's first letter.
- `stale-data`: if availability data is stale, show `Template:Stale` 24 h or 72 h variant above the availability card.
- `Rx-required`: full Rx warning block (above) renders.

**Accessibility.** Sticky CTA passes 4.5:1 contrast white-on-primary. Description font size scales with the user's large-type setting. Hero image always has alt text.

**Telemetry.** `medifind.results.medicine_viewed` on screen open. `medifind.results.find_stores_tapped` on CTA tap. `medifind.results.similar_tapped` on similar card tap. If Rx warning block renders, emit no extra event (it's deterministic from the data).

**Does NOT do.** No dosage. No indications. No "how to take". No reviews. No price across stores. No add-to-cart. No prescription upload.

---

## Screen 5 — Nearby stores for this medicine (map + bottom sheet)

**Purpose.** Let the user pick a pharmacy that actually has this medicine, then call or navigate.

**Mental state.** Decision time. They want one tap to call, one tap to drive there.

**Layout.**
1. Top 40% of viewport: map (mock placeholder for MVP — see "Map placeholder" below). Header floating: back-button + medicine name compact.
2. Bottom sheet, 60% default height, draggable to 95%. Sticky inside the sheet:
   - Sheet handle (32×4 pill, centered, `--color-borderSoft`).
   - Sticky toggle row: `List` / `Map` (Map collapses sheet to 25%; List re-expands to 60%).
3. Sheet content: store cards, sorted by distance, cap 25.

**Map placeholder (MVP).** No live map SDK. Render `--color-surfaceAlt` rectangle with `Pharmacies near you` centered, plus a faint dot for each store roughly positioned. Codex implements this as a static `<View>`. Replacing with `react-native-maps` later is a swap of the placeholder component only.

**Components.** `MapPlaceholder`, `BottomSheet`, `SheetHandle`, `SheetToggle`, `StoreAvailabilityCard`, `RxBadge`, `DisclaimerLine`.

**Store availability card (per row).**
- Top row: store name (h3) on left, verified pill on right.
- Sub line: `{distanceKm} km · {locality} · {open|closed}`.
- Stock line: `In stock · updated {x} min ago`. Color-coded: green up to 24 h, amber 24-72 h, neutral grey > 72 h.
- Action row (3 buttons, equal width): `Call`, `Navigate`, `View store`.
- Card height: 132 px. Tap on card body opens store detail (same as `View store`).

**Exact copy.**
- Header title: medicine name, max 28 chars.
- Sheet toggle labels: `List`, `Map`.
- Card actions: `Call`, `Navigate`, `View store`.
- Footer disclaimer (sticky at sheet bottom): `Stock can change. Call the store to confirm before you travel.`
- Empty body when zero stores: `Template:Empty` titled `No nearby pharmacies have this right now.` body `Try a wider radius or browse pharmacies and ask in person.` CTA `Change search area`.

**States.**
- `loading`: 4 skeleton cards in the sheet, map placeholder static.
- `empty` (zero results in radius): empty template above.
- `partial-results` (some stores stale): mixed list with stale rows visually de-emphasised.
- `no-results`: same as empty.
- `error`: `Template:Error` filling the sheet, `error_code: 'nearby_for_medicine_failed'`.
- `offline`: sheet shows last-known cache of these stores; banner template:offline pinned to the top of the sheet.
- `stale-data`: per-row colouring + `Template:Stale` banner at the top of the sheet.
- `Rx-required`: medicine carries Rx badge in the header; cards do not change.

**Accessibility.** Bottom sheet handle has `accessibilityRole=adjustable` with `accessibilityActions: increment, decrement`. Action buttons inside cards keep ≥ 44 px touch targets. Map placeholder is `accessibilityElementsHidden=true` because it is decorative in MVP.

**Telemetry.** `medifind.stores.list_view_open` on entry, `medifind.stores.map_view_open` on toggle to map view. `medifind.stores.store_card_tapped`, `store_call_clicked`, `store_navigate_clicked` with `from_screen: 'medicine_stores'`.

**Does NOT do.** No real map in MVP. No driving directions inside the app — `Navigate` opens the OS maps app via a `geo:` / `maps:` URL.

---

## Screen 6 — Stores mode landing

**Purpose.** Browse all nearby pharmacies (no medicine context).

**Mental state.** Either (a) chronic patient looking for "my usual store"; (b) walk-in user wanting to see what's nearby in case they forgot the medicine name; (c) user who tapped the wrong mode and needs an exit.

**Layout.** Identical to Screen 5 (map + bottom sheet) with two differences:
- Header title is `Pharmacies near you` instead of a medicine name.
- The sheet has a sticky search field at the top: `Search a pharmacy by name or area`. Tapping pushes a stores-scoped Search.
- Cards omit the "in stock" line because there is no medicine context. They still show name, verified, distance, locality, open state, freshness label.

**Exact copy.**
- Sheet field placeholder: `Search a pharmacy by name or area`.
- Card stock line absent.
- Empty: `Template:Empty` titled `No verified pharmacies near you yet.` body `Try a wider radius or check back later.`
- Mode-fallback link at bottom: `Looking for a medicine? Switch to Medicine mode.` (Tertiary, body-sm, `--color-primary-700`.)

**States.** Same as Screen 5, minus `stale-data` (no inventory shown).

**Accessibility.** Same as Screen 5.

**Telemetry.** `medifind.stores.list_view_open`, `map_view_open`, `store_card_tapped`, `store_call_clicked`, `store_navigate_clicked` with `from_screen: 'stores_landing'`.

**Does NOT do.** No medicine search from this screen — it routes back to mode-toggled Search.

---

## Screen 7 — Store detail

**Purpose.** Confirm the store is real, verified, currently open, and learn what's in stock — then call or navigate.

**Mental state.** "Should I trust this place enough to drive there." Trust signals must dominate the first viewport.

**Layout.**
1. Header (sticky, 64 px). Back, share, bookmark.
2. Hero block (240 px). `--color-surface` card with: store name (h2), verified pill, distance + locality + open/closed (caption muted), `Drug license: {value}` line.
3. Action row (3 buttons, equal width, sticky just below the hero on scroll). `Call`, `Navigate`, `Hours`. (The `Hours` button toggles a hours panel.)
4. Hours panel (collapsed by default). 7-day grid; today highlighted; closed days in muted text.
5. Address block. Body, full address; tap to copy.
6. In-store search field. Sticky just above the inventory list. Placeholder: `Search items in this store`.
7. Inventory list. Grouped by category (Pain Relief, Cold & Cough, …). Each row: medicine name + composition + Rx pill + stock label.
8. Footer disclaimer.

**Components.** `StoreHero`, `VerifiedPill`, `LicenseLine`, `StoreActionRow`, `HoursPanel`, `AddressLine`, `InStoreSearchField`, `InventoryRow`, `CategoryHeader`, `DisclaimerLine`.

**Exact copy.**
- Hero a11y: `{name}, verified pharmacy, {distanceKm} km away, {open|closed}, {locality}`.
- License line: `Drug license: {licenseNumber}`. Tap reveals: `Issued by {licenseAuthority}.`
- Action labels: `Call`, `Navigate`, `Hours`.
- Hours panel toggle expanded label (a11y): `Collapse store hours`.
- Address tap copy toast: `Address copied`.
- In-store search placeholder: `Search items in this store`.
- Inventory empty (store has zero in-stock items): `Template:Empty` body `This pharmacy has not posted recent stock. Call to ask in person.` CTA: `Call store`.
- Footer: `Stock can change. Call the store to confirm before you travel.`

**States.**
- `loading`: hero skeleton + 6 inventory skeleton rows.
- `empty` (no inventory at all): empty template above.
- `partial-results` (in-store search returns 0 of N): inline note `No items match "{query}"` and a `Clear search` ghost button.
- `no-results` (search returns nothing): same.
- `error`: `Template:Error`, `error_code: 'store_failed'`.
- `offline`: render from cache; banner template:offline.
- `stale-data`: row-level greying for stale items, top-of-list `Template:Stale`.
- `Rx-required`: rows for Rx items show Rx badge.

**Accessibility.** Action row buttons ≥ 64 px tall. Hours panel is keyboard-traversable. License line has `accessibilityHint: 'Tap to see issuing authority'`.

**Telemetry.** `medifind.stores.store_card_tapped` (entry), `store_call_clicked`, `store_navigate_clicked` with `from_screen: 'store_detail'`. `medifind.store.in_store_search_used` when the in-store search field is submitted.

**Does NOT do.** No reviews. No driving directions inside the app. No "delivery available" badge.

---

## Screen 8 — In-store search (modal-style overlay on store detail)

**Purpose.** Quickly check whether *this* store has a specific item, without leaving store detail.

**Behaviour.** Tapping the in-store search field on Screen 7 expands an overlay (not a separate route) that:
- Replaces sections 7 + 8 with a search input + suggestion list scoped to this store's inventory only.
- Suggestions are full inventory rows (same shape as Screen 7).
- Keyboard `return` filters the underlying list and dismisses the overlay.
- `Cancel` button dismisses without filtering.

This is a within-screen state, not a separate route. Treated as a single screen so a back-press collapses the overlay first, then leaves /store/[id].

**Exact copy.** Same field placeholder as Screen 7 plus the overlay CTAs `Cancel`, `Apply`. Empty within-store: `No items match "{query}" at this pharmacy.` plus `Clear search` ghost.

**States.** `loading` (rare — store inventory is already loaded), `empty`, `no-results`, `error` (defer to store-detail's error). No offline-specific state because overlay shares cache.

**Accessibility.** Trap focus inside overlay while open; `Esc`/back collapses.

**Telemetry.** `medifind.store.in_store_search_used` on submit.

---

## Screen 9 — Category browse

**Purpose.** Provide a calm browsing experience for chronic / first-aid / household categories.

**Mental state.** Either a chronic patient knowing the family of medicines they want (Diabetes), or a parent restocking First Aid.

**Layout.**
1. Header. Back, category title (e.g. `Pain Relief`).
2. Header sub-line. Body-muted: `{n} medicines stocked nearby` (where `n` is the count summed across nearby stores that carry any item in this category).
3. Filter strip. `All`, `OTC`, `Rx`. Default `All`.
4. Medicine grid (2 columns). Each tile: image (1:1, 152 px wide), name (body), manufacturer (caption muted), Rx pill if applicable, available-nearby pill if `n > 0`.
5. Footer disclaimer.

**Components.** `CategoryHeader`, `FilterChipRow`, `MedicineGridCard`, `RxBadge`, `AvailableNearbyBadge`.

**Exact copy.**
- Sub-line zero-state: `No medicines from this category are stocked at nearby pharmacies right now.`
- Tile CTA on tap (whole tile): opens medicine detail.
- Empty: `Template:Empty` titled `Nothing in {categoryName} nearby right now.` body `Browse other categories or try a search.`
- Header back-button a11y: `Back to home`.

**States.**
- `loading`: 6 grid skeletons.
- `empty`: empty template.
- `partial-results`: filtered grid; if filter eliminates all, inline note `No {filter} matches in {category}.`.
- `no-results`: empty template.
- `error`: `Template:Error`, `error_code: 'category_failed'`.
- `offline`: cached if any.
- `Rx-required`: tiles show Rx badge.

**Accessibility.** Grid tiles ≥ 200 px tall to fit name + manufacturer + badges without truncation in large-type mode. Color of the available-nearby pill never the only signal — text always says `Available at {n}`.

**Telemetry.** `medifind.category.opened`, `medifind.results.medicine_viewed` on tile tap.

**Does NOT do.** No price ranking. No "popular this week" dynamic ordering in MVP — sort by manufacturer alphabetical, deterministic.

---

## Profile (small redesign)

Add a `Larger text` toggle at the top of the existing Profile screen, persisted to `users/{uid}.preferences.largeType: boolean`. Wire to a global font-scale multiplier of 1.15 when on. Keep the existing fields (display name, saved areas, recent searches, sign out) unchanged.

**Telemetry.** `medifind.profile.large_type_toggled` with `enabled: true|false`.

---

## Phone OTP (deferred — design preserved above)

Phone OTP screen and entry buttons remain disabled and "coming soon" per D-015. The earlier detailed Phone OTP design above remains the future flow. No work in MVP.
