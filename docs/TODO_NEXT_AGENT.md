# Next-Agent TODO

The top section ("Next up") is rewritten at the end of every session by the `agent-handoff-logger` skill. The backlog below it grows over time.

---

## Next up (as of 2026-04-24, after full mobile plan)

The full mobile app product + system design now lives in `docs/MOBILE_APP_PLAN.md`. Use that as the blueprint from here on. Nothing else has changed in the repo.

1. **Read memory first.** Load `docs/PROJECT_MAP.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, **the rewritten `docs/MOBILE_APP_PLAN.md`**, `docs/DESIGN_SYSTEM.md`, and this file. Use `project-memory`.
2. **Run `repo-understanding`.** Confirm nothing in `src/`, `functions/`, `dataconnect/`, or root config has drifted from `PROJECT_MAP.md` since 2026-04-24. Update the map if it has.
3. **Resolve the 8 open architectural decisions in `MOBILE_APP_PLAN.md` §8.1** with the user — these gate the scaffold:
   - expo-router vs React Navigation
   - Firebase JS SDK vs `@react-native-firebase`
   - Custom claims migration plan
   - Payments provider (Razorpay / Cashfree / Stripe India)
   - Places proxy location (same `functions/` codebase or separate)
   - Data Connect timeline (deferred — confirm)
   - Search backend for MVP (Firestore prefix vs Algolia/Typesense)
   - Prescription scope (per-store vs cross-store)
   Each resolution should be recorded as a new `D-NNN` entry in `DECISIONS.md`.
4. **Hand off the Cloud Functions contract in `MOBILE_APP_PLAN.md` §6 to the website/backend team.** Mobile cannot ship ahead of these. Ask them to at minimum stub the signatures in `functions/` so rules + schemas can be authored.
5. **Coordinate with the website team on new Firestore collections + rules** (`inventory`, `orders`, `payments`, `deliveries`, `prescriptions`, `medicines`, `carts`, `notifications`, `users/*/addresses`, `users/*/fcmTokens`). Do NOT edit `firestore.rules` or `functions/` from the mobile side.
6. **Review `apps/mobile/`.** Still just `README.md`. Confirm nobody has scaffolded.
7. **Do NOT run `expo init` or `npm install` until the user explicitly says go.** When they do:
   - Use the `react-native-expo-builder` skill.
   - Scaffold with `create-expo-app` (managed workflow, TypeScript, routing per decision in step 3).
   - Commit the scaffold in a **single** commit before any feature work.
8. **Once scaffolded, build the MVP checklist from `MOBILE_APP_PLAN.md` §7.** One screen per commit. Order of screens: Auth → Profile setup → Home (list+map) → Store detail → Product detail → Search → Cart → Prescription upload → Checkout → Order detail → Notifications inbox → Support.
9. **Before any prescription / payment / order code runs in prod:** invoke `security-compliance-reviewer` (checks against `MOBILE_APP_PLAN.md` §8.3 risks).
10. **Raise (again) with the user:** `serviceAccountKey.json`, `.env`, `.env.local` are still committed at repo root and are a credential leak. Not our file to fix, but keep flagging until rotated + gitignored.
11. **End every session with `agent-handoff-logger`** — append to `AGENT_LOG.md`, rewrite this section.

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
