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
