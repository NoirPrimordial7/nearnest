# Next-Agent TODO

The top section ("Next up") is rewritten at the end of every session by the `agent-handoff-logger` skill. The backlog below it grows over time.

---

## Next up (as of 2026-04-24, after MVP scope reconfirmation)

**Canonical MVP:**
- Find a medicine.
- Show nearby stores that have it.
- Show store details and availability.
- Guide / navigate the user to the store.
- Let the user call / contact the store.

**Phase 2 / optional (not MVP):** delivery, cart, checkout, payment, order tracking, prescription delivery flow.

**Auth in MVP:** Firebase Authentication required. Email/password AND Google sign-in both ship in MVP. Phone OTP is Phase 2. Every user must have a minimal profile in `users/{uid}` before reaching Home.

**Rx in MVP:** Rx medicines appear in discovery with a strong "Prescription required" badge and warning. Discovery and navigation are not blocked. No reserve/order/delivery. No medical advice, dosage, usage, or side-effect copy — even if the data exists in `medicines/{id}`.

1. **Commit the MVP-direction + auth/Rx clarifications.** Include `docs/MOBILE_APP_PLAN.md`, `docs/MOBILE_UI_SCREEN_SPECS.md`, `docs/TODO_NEXT_AGENT.md`, `docs/SESSION_STATE.md`, and `docs/AGENT_LOG.md`. Suggested message: `docs(mobile): clarify auth providers and Rx handling in MVP`.
2. **Use Graphify before architecture/codebase answers.** Read `graphify-out/GRAPH_REPORT.md`; use `graphify update .` only after future code changes. Documentation-only changes do not require a graph rebuild unless requested.
3. **If scaffold is approved later, build only discovery MVP routes:** auth, profile setup, location/search-area picker, home list, home map, search, search results, store detail, medicine detail, contact store, navigation handoff, profile.
4. **Do not scaffold commerce routes in MVP.** No cart, checkout, payment status, orders, delivery tracking, or prescription upload/review screens unless the user explicitly expands scope.
5. **Backend readiness for MVP now means discovery endpoints first:** `searchMedicines`, `nearbyStores`, Places/geocode proxy functions, store public contact fields, store coordinates, and inventory freshness metadata.
6. **Keep architecture flexible for Phase 2.** Existing backend/payment/Rx decisions remain future extension points, but they should not influence first mobile implementation scope.
7. **Do not edit protected areas during planning.** No edits to `src/**`, `functions/**`, `dataconnect/**`, Firebase rules/config, package files, env files, `serviceAccountKey.json`, or `apps/mobile/**` without explicit user authorization.
8. **Keep flagging committed secrets.** `serviceAccountKey.json`, `.env`, and `.env.local` remain a credential-leak risk to rotate and purge with the website team.
9. **End every session by updating handoff memory.** Append to `docs/AGENT_LOG.md`, rewrite this "Next up" section, and update `docs/SESSION_STATE.md`.

---

## Backlog (in rough priority order)

### Architecture + planning
- Discovery MVP backend readiness: confirm `searchMedicines`, `nearbyStores`, Places/geocode proxy functions, store public contact fields, store coordinates, and inventory freshness metadata.
- Phase 2 commerce backlog only: `orders/`, `prescriptions/`, `payments/`, `deliveries/` schemas, rules, indexes, and functions.
- Do not treat Razorpay, Rx approval, cart, checkout, or delivery as blockers for the discovery MVP.

### Mobile app (after scaffold approval)
- Auth screens (sign in / sign up / email verify / forgot password)
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
