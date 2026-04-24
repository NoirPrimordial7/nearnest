# Next-Agent TODO

The top section ("Next up") is rewritten at the end of every session by the `agent-handoff-logger` skill. The backlog below it grows over time.

---

## Next up (as of 2026-04-24, after Medifind Firebase Auth basic setup)

**Canonical MVP:**
- Find a medicine.
- Show nearby stores that have it.
- Show store details and availability.
- Guide / navigate the user to the store.
- Let the user call / contact the store.

**Mobile brand:** customer-facing app is **Medifind**. Nearnest remains the parent/store/admin platform brand.

**Phase 2 / optional (not MVP):** delivery, cart, checkout, payment, order tracking, prescription delivery flow.

**Auth in MVP:** Firebase Authentication required. Email/password AND Google sign-in both ship in MVP. Phone OTP is Phase 2. Every user must have a minimal profile in `users/{uid}` before reaching Home.

**Rx in MVP:** Rx medicines appear in discovery with a strong "Prescription required" badge and warning. Discovery and navigation are not blocked. No reserve/order/delivery. No medical advice, dosage, usage, or side-effect copy, even if the data exists in `medicines/{id}`.

1. **Commit the Firebase Auth basic wiring.** Include `apps/mobile/app/sign-in.tsx`, `apps/mobile/app/sign-up.tsx`, `apps/mobile/services/**`, `docs/AGENT_LOG.md`, `docs/TODO_NEXT_AGENT.md`, and `docs/SESSION_STATE.md`. Suggested message: `feat(mobile): wire email password Firebase auth`.
2. **Replace placeholder Firebase config through an approved plan before real testing.** `apps/mobile/services/firebase.ts` intentionally uses fake values and must not grow real secrets inline.
3. **Add Email Verification and Forgot Password next.** Use Firebase Auth email verification/reset APIs, then update navigation around verified/unverified users.
4. **Resolve the post-sign-up route.** Current Firebase success path routes Sign Up to Home per the latest auth-wiring request; product docs still require a minimal profile before Home, so add a profile-completion guard before release.
5. **Add Profile Setup persistence only after Firestore/profile rules are approved.** Do not add direct profile writes until the mobile-safe profile contract is clear.
6. **Add Google sign-in later for MVP.** Keep phone OTP Phase 2 unless the user explicitly changes auth scope.
7. **Build only discovery MVP routes:** auth shell, profile setup, location/search-area picker, home list/map, search/results, store detail, medicine detail, contact store, navigation handoff, profile.
8. **Do not scaffold commerce routes in MVP.** No cart, checkout, payment status, orders, delivery tracking, or prescription upload/review screens unless the user explicitly expands scope.
9. **Use Graphify before architecture/codebase answers.** Read `graphify-out/GRAPH_REPORT.md`. If a future session's allowed edit scope includes `graphify-out/**`, run `graphify update .` after code changes.
10. **Do not edit protected areas.** No edits to root `src/**`, `functions/**`, `dataconnect/**`, Firebase rules/config, root package files, env files, or `serviceAccountKey.json` without explicit authorization.
11. **End every session by updating handoff memory.** Append to `docs/AGENT_LOG.md`, rewrite this "Next up" section, and update `docs/SESSION_STATE.md`.

---

## Backlog (in rough priority order)

### Architecture + planning
- Discovery MVP backend readiness: confirm `searchMedicines`, `nearbyStores`, Places/geocode proxy functions, store public contact fields, store coordinates, and inventory freshness metadata.
- Phase 2 commerce backlog only: `orders/`, `prescriptions/`, `payments/`, `deliveries/` schemas, rules, indexes, and functions.
- Do not treat Razorpay, Rx approval, cart, checkout, or delivery as blockers for the discovery MVP.

### Mobile app
- Scaffold exists in `apps/mobile/` with placeholder Splash, Welcome, Sign In, Sign Up, Profile Setup, and Home.
- Splash, Welcome, Sign In, and Sign Up have polished implementations.
- Sign In and Sign Up now call Firebase Auth email/password methods through `apps/mobile/services/auth.ts` with placeholder Firebase config from `apps/mobile/services/firebase.ts`.
- Add auth routes not yet present: Email Verification and Forgot Password.
- Profile setup + saved search area/address
- Location permission + address/search-area picker
- Home list + Home map
- Medicine search + search results
- Store detail + medicine detail
- Contact store + native navigation handoff
- Optional: stale availability report / notify-me if backend exists
- Phase 2 only: cart, checkout, payment, prescription approval, orders, delivery, store-admin mobile surface

### Shared design
- Build theme token file from `docs/DESIGN_SYSTEM.md` - but only inside `apps/mobile/theme/`, never overwrite web styles.
- Pick an icon set that matches `lucide-react` on web (candidate: `lucide-react-native`).

### Security + compliance
- Security review of the committed `serviceAccountKey.json`, `.env`, `.env.local` (flag to website team - do not remove yourself).
- Plan App Check rollout for prod.
- Plan test framework adoption only after scaffold is approved.
- Run security/compliance review before any Phase 2 Rx, payment, order, or delivery implementation.

### Housekeeping
- Confirm jezweb / expo external skills register with Claude Code's plugin system after `/reload-plugins`. If not, decide whether to author proper `plugin.json` wrappers or read them directly from `.claude/external/*/` on demand.
