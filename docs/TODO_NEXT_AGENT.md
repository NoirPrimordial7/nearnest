# Next-Agent TODO

The top section ("Next up") is rewritten at the end of every session by the `agent-handoff-logger` skill. The backlog below it grows over time.

---

## Next up (as of 2026-04-24, after backend handoff docs verified)

The backend handoff docs now exist and are the contract for the website/backend team:
`docs/BACKEND_FUNCTIONS_CONTRACT.md`, `docs/FIRESTORE_SCHEMA_CONTRACT.md`, `docs/FIREBASE_RULES_PROPOSAL.md`, and `docs/MOBILE_BACKEND_HANDOFF.md`.

1. **Commit the backend docs first.** Include `docs/AGENT_LOG.md` and this TODO update in the same docs-only commit. Suggested message: `docs(backend): add mobile backend handoff contracts`.
2. **Optionally set up Graphify coordination** before screen-spec work if the team wants a shared execution board for backend/mobile dependencies. Keep it as coordination only; do not let it trigger code generation or scaffolding.
3. **Create UI screen specs next.** Turn `docs/MOBILE_APP_PLAN.md` and `docs/DESIGN_SYSTEM.md` into screen-by-screen specs for the mobile MVP: Auth, Profile, Home, Store detail, Product detail, Search, Cart, Prescription upload, Checkout, Order detail, Notifications, Support.
4. **Do not scaffold Expo yet.** No `expo init`, no `create-expo-app`, no `npm install`, and no edits under `apps/mobile/**` until the user explicitly gives the go-ahead.
5. **Keep backend implementation with the website team.** The mobile side should not edit `functions/**`, Firebase rules files, indexes, root config, `src/**`, or `public/**`.
6. **Before any real Rx/payment/order endpoint is used in prod,** run a security/compliance review against D-005, D-006, D-009, D-010, D-014, and the risky areas in `docs/FIREBASE_RULES_PROPOSAL.md`.
7. **Keep flagging committed secrets.** `serviceAccountKey.json`, `.env`, and `.env.local` remain a credential-leak risk to rotate and purge with the website team; do not touch them in mobile-planning sessions.
8. **End every session by updating handoff memory.** Append to `docs/AGENT_LOG.md` and rewrite this "Next up" section.

---

## Backlog (in rough priority order)

### Architecture + planning
- Confirm mobile-stack open questions in `docs/ARCHITECTURE.md` §8 (expo-router vs React Navigation, Firebase JS SDK vs `@react-native-firebase`, payments provider, Places proxy location, custom claims migration).
- Flesh out `orders/`, `prescriptions/`, `payments/`, `deliveries/` Firestore schemas and corresponding index + rule proposals (use `firebase-architect`).
- Document Cloud Function contracts for: `createOrder`, `updateOrderStatus`, `uploadPrescription`, `reviewPrescription`, `processPayment`, `assignDelivery`, `sendNotification`, `setUserRole`.

### Mobile app (after scaffold)
- Auth screens (sign in / sign up / email verify / forgot password)
- Profile setup
- Store/product browse (list + detail)
- Cart + checkout gate for Rx items
- Prescription upload flow
- Order status + live delivery map
- Notifications inbox
- Store-admin lite view (Phase 2)

### Shared design
- Build theme token file from `docs/DESIGN_SYSTEM.md` — but only inside `apps/mobile/theme/`, never overwrite web styles.
- Pick an icon set that matches `lucide-react` on web (candidate: `lucide-react-native`).

### Security + compliance
- Security review of the committed `serviceAccountKey.json`, `.env`, `.env.local` (flag to website team — do not remove yourself).
- Plan App Check rollout for prod.
- Plan test framework adoption (Vitest for web, Jest + RTL for mobile).

### Housekeeping
- Confirm jezweb / expo external skills register with Claude Code's plugin system after `/reload-plugins`. If not, decide whether to author proper `plugin.json` wrappers or read them directly from `.claude/external/*/` on demand.
