# Next-Agent TODO

The top section ("Next up") is rewritten at the end of every session by the `agent-handoff-logger` skill. The backlog below it grows over time.

---

## Next up (as of 2026-04-24, after decisions D-007…D-014)

All 8 open mobile architecture decisions are now resolved in `docs/DECISIONS.md` (D-007 … D-014). `docs/ARCHITECTURE.md` §8 points to each. Use those decisions as binding contract.

1. **Read memory first.** Load `docs/PROJECT_MAP.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md` (especially D-007…D-014), `docs/MOBILE_APP_PLAN.md`, `docs/DESIGN_SYSTEM.md`, and this file. Use `project-memory`.
2. **Run `repo-understanding`.** Confirm nothing in `src/`, `functions/`, `dataconnect/`, or root config has drifted since 2026-04-24.
3. **Hand off the backend contract to the website team.** Share these specific asks, all derived from the new decisions:
   - **D-009 Phase A:** add `setUserRole` callable in `functions/` (writes token claims + mirrors `users.roles[]`). New rules for future mobile collections must read `request.auth.token.role` — no new `users.roles[]` reads.
   - **D-011:** stub `placesSearch`, `placeDetails`, `geocode`, `reverseGeocode` callables in `functions/places.js` with App Check enforcement + a Firestore-backed token-bucket rate limiter.
   - **D-013:** stub `searchMedicines` callable and a Firestore trigger that maintains `searchTokens[]` on `medicines/{id}` and `stores/{storeId}/inventory/{sku}` writes.
   - **D-010:** stub `createPaymentOrder`, `paymentsWebhook` (HMAC-verified), `refundPayment` against Razorpay.
   - **D-014:** `prescriptions/{id}` schema must carry `storeId`; `uploadPrescription` + `reviewPrescription` enforce per-store scope.
   - All of the above require `firestore.rules` edits by the website team — do NOT edit from the mobile side.
4. **Coordinate on new Firestore collections + rules + indexes** (`inventory`, `orders`, `payments`, `deliveries`, `prescriptions`, `medicines`, `carts`, `notifications`, `users/*/addresses`, `users/*/fcmTokens`). The shapes are in `MOBILE_APP_PLAN.md` §5.
5. **Review `apps/mobile/`.** Still just `README.md`. Confirm nobody has scaffolded.
6. **Do NOT run `expo init` or `npm install` until the user explicitly says go.** When they do, per D-007 and D-008:
   - Use the `react-native-expo-builder` skill.
   - Scaffold with `create-expo-app@latest` — **TypeScript + `expo-router` template**.
   - Add `firebase` (JS SDK, v12 to match web), `expo-notifications`, `expo-location`, `expo-image-picker`, `expo-image-manipulator`, `expo-secure-store`, `react-native-maps`, `@tanstack/react-query`, `zustand`, `react-hook-form`, `zod`, `date-fns`, `lucide-react-native`.
   - Do not add `@react-native-firebase/*` (per D-008).
   - Commit the scaffold in a **single** commit before any feature work.
7. **Once scaffolded, build the MVP checklist from `MOBILE_APP_PLAN.md` §7.** One screen per commit. Order: Auth → Profile setup → Home (list+map) → Store detail → Product detail → Search → Cart → Prescription upload → Checkout → Order detail → Notifications inbox → Support.
8. **Before any prescription / payment / order code runs in prod:** invoke `security-compliance-reviewer` against the risks in `MOBILE_APP_PLAN.md` §8.3 and the Rx rules implied by D-006 + D-014.
9. **Raise (again) with the user:** `serviceAccountKey.json`, `.env`, `.env.local` are still committed at repo root. Credential-leak risk. Not our files to fix, but keep flagging until rotated + gitignored.
10. **End every session with `agent-handoff-logger`** — append to `AGENT_LOG.md`, rewrite this section.

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
