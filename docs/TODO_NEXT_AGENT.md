# Next-Agent TODO

The top section ("Next up") is rewritten at the end of every session by the `agent-handoff-logger` skill. The backlog below it grows over time.

---

## Next up (as of 2026-04-24, after mobile UI screen specs)

Mobile MVP screen specs now live in `docs/MOBILE_UI_SCREEN_SPECS.md`. They translate `docs/MOBILE_APP_PLAN.md`, `docs/DESIGN_SYSTEM.md`, and decisions D-005 through D-014 into screen-by-screen UI contracts.

1. **Commit the UI screen specs.** Include `docs/MOBILE_UI_SCREEN_SPECS.md`, `docs/AGENT_LOG.md`, `docs/TODO_NEXT_AGENT.md`, and `docs/SESSION_STATE.md`. Suggested message: `docs(mobile): add MVP UI screen specs`.
2. **Use Graphify before architecture/codebase answers.** Read `graphify-out/GRAPH_REPORT.md`; use `graphify update .` to refresh the graph after future code changes. Documentation-only changes do not require a graph rebuild unless requested.
3. **Review backend readiness before implementation.** Compare `docs/MOBILE_UI_SCREEN_SPECS.md` against `docs/BACKEND_FUNCTIONS_CONTRACT.md`, `docs/FIRESTORE_SCHEMA_CONTRACT.md`, `docs/FIREBASE_RULES_PROPOSAL.md`, and `docs/MOBILE_BACKEND_HANDOFF.md` for any missing endpoints or screen assumptions.
4. **Optional next planning doc:** create low-fidelity wireframe notes or route-map docs for the 26 screens. Keep it documentation-only unless the user explicitly asks for design assets or code.
5. **Do not scaffold Expo yet.** No `expo init`, no `create-expo-app`, no `npm install`, and no edits under `apps/mobile/**` until the user explicitly gives the go-ahead.
6. **Keep backend implementation with the website team.** The mobile side should not edit `functions/**`, Firebase rules files, indexes, root config, `src/**`, or `public/**`.
7. **Before any real Rx/payment/order endpoint is used in prod,** run a security/compliance review against D-005, D-006, D-009, D-010, D-014, and the risky areas in `docs/FIREBASE_RULES_PROPOSAL.md`.
8. **Keep flagging committed secrets.** `serviceAccountKey.json`, `.env`, and `.env.local` remain a credential-leak risk to rotate and purge with the website team; do not touch them in mobile-planning sessions.
9. **End every session by updating handoff memory.** Append to `docs/AGENT_LOG.md`, rewrite this "Next up" section, and update `docs/SESSION_STATE.md`.

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
