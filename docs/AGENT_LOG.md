# Agent Log

Append-only. Newest entries on top. Always include absolute dates.

---

## 2026-04-24 — Full mobile app product & system design
**Agent:** Claude Opus 4.7 (Claude Code)
**Session goal:** Expand `docs/MOBILE_APP_PLAN.md` into a complete product-ready design covering vision, per-module feature breakdown, navigation architecture, user flows, Firebase data model, Cloud Functions, MVP vs Phase 2, and risks.

**Skills invoked:** `repo-understanding` (reused context from prior session), `project-memory`, `mobile-product-planner`.

**Files inspected (read-only):**
- `docs/PROJECT_MAP.md`, `docs/ARCHITECTURE.md`, `docs/MOBILE_APP_PLAN.md`, `docs/DESIGN_SYSTEM.md`, `docs/DECISIONS.md` (all authored earlier in this same session, reused without re-read cost).
- No source code files re-inspected this turn — current state still matches what was captured in `PROJECT_MAP.md` on 2026-04-24 earlier.

**Files created / edited:**
- `docs/MOBILE_APP_PLAN.md` — **fully rewritten and expanded**. New structure:
  - §1 Product Vision (what / who / core value)
  - §2 Full Feature Breakdown — 14 modules: Auth, Location + Nearby Stores, Medicine Search, Store Inventory, Map, Medicine Detail, Cart + Checkout, Prescription Upload + Approval, Delivery, Payment, Order Tracking, Notifications, Support, Profile — each with purpose, UI sections, interactions, validations, backend needs.
  - §3 Navigation — 5 bottom tabs, per-tab stacks, modal flows, map vs list UX, deep-link scheme.
  - §4 User flows — A: search→store, B: medicine→navigate, C: prescription upload+approval, D: order→checkout→payment, E: delivery tracking, F: rejection/out-of-stock.
  - §5 Firebase data model — collections: `users`, `stores`, `stores/{id}/inventory`, `medicines`, `prescriptions`, `carts`, `orders` (+ `events`), `payments`, `deliveries`, `notifications`, `supportTickets`; plus relationships diagram and MVP index shortlist.
  - §6 Cloud Functions — ~30 functions grouped by lifecycle (search, prescriptions, cart/orders, payments, delivery, notifications, admin, support, housekeeping).
  - §7 MVP vs Phase 2 — explicit shippable MVP checklist + Phase 2 backlog.
  - §8 Risks & open decisions — 8 open architectural decisions, unclear repo state, top 10 technical risks, non-tech risks, shovel-ready next steps.
- `docs/AGENT_LOG.md` — this entry.
- `docs/TODO_NEXT_AGENT.md` — "Next up" rewritten (see file).

**Files intentionally NOT touched:**
- `src/`, `public/`, `functions/`, `dataconnect/` — website team territory.
- `package.json`, `package-lock.json`, `firebase.json`, `firestore.rules`, `storage.rules`, `vite.config.js`, `eslint.config.js`, `.env*`, `README.md` (root), `.firebaserc` — protected config.
- `apps/mobile/` — planning only this session; no scaffold run.
- `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/PROJECT_MAP.md`, `docs/DESIGN_SYSTEM.md`, `docs/SKILLS_INDEX.md` — no changes this turn; the new plan is consistent with D-001…D-006.

**Decisions:** No new `D-NNN` decisions added. The plan surfaces 8 open decisions in §8.1 that still need user/team sign-off (expo-router vs RN Navigation, JS SDK vs `@react-native-firebase`, custom claims migration, payments provider, Places proxy location, Data Connect timeline, MVP search backend, prescription reuse scope).

**Warnings for next agent:**
- Do NOT start scaffolding `apps/mobile/` yet. Wait for explicit go-ahead.
- The mobile app cannot ship ahead of the Cloud Functions in §6. Backend stubs are the real gating work.
- Rules, indexes, and new collections (`inventory`, `orders`, `payments`, `deliveries`, `prescriptions`, `medicines`, `carts`) must be authored by the website team — do not edit `firestore.rules` from mobile side.
- The previously-flagged committed secrets (`serviceAccountKey.json`, `.env`, `.env.local`) remain unfixed. Still not our file to touch; still needs to be raised.

**Suggested commit message:**
`docs(mobile): full product + system design for Nearnest mobile app`

---

## 2026-04-24 — Bootstrap AI skill system and docs memory
**Agent:** Claude Opus 4.7 (Claude Code)
**Session goal:** Set up the AI skill system and project memory without touching any protected web-portal code.

**Plugins / external skills confirmed present (pre-existing in this workspace):**
- `superpowers` (obra) — loaded; visible in Skill tool list (`superpowers:*`)
- `document-skills@anthropic-agent-skills` — loaded (`document-skills:*`)
- `example-skills@anthropic-agent-skills` — loaded (`example-skills:*`)
- `.claude/external/jezweb-skills/` (jezweb/claude-skills) — cloned; `react-native-expo` symlinked into `.claude/skills/react-native-expo`
- `.claude/external/expo-skills/` (expo/skills) — cloned; `expo-workflows` symlinked into `.claude/skills/expo-workflows`

Note: the Skill tool list confirms Superpowers + Anthropic skills are active. The jezweb / expo symlinks exist on disk but their SKILL.md files may need a `/reload-plugins` or explicit plugin manifest for Claude Code to surface them in the Skill tool. Flagged for next agent.

**Files inspected (read-only):**
- `package.json` — deps + scripts
- `firebase.json` — emulators + region (asia-south1)
- `firestore.rules` — role model + store/doc/log collections
- `storage.rules` — avatars + storeDocs paths
- `README.md` — default Vite template README
- `src/App.jsx` — route table
- `functions/index.js` — only `helloWorld` stub
- `.env.example` — Firebase web config vars only
- Directory listings: repo root, `src/`, `src/pages/`, `src/components/`, `src/lib/`, `src/utils/`, `functions/`, `dataconnect/`, `.claude/`, `.claude/skills/`, `.claude/external/`

**Files created:**
Custom SKILL.md files in `.claude/skills/`:
- `.claude/skills/repo-understanding/SKILL.md`
- `.claude/skills/project-memory/SKILL.md`
- `.claude/skills/agent-handoff-logger/SKILL.md`
- `.claude/skills/mobile-product-planner/SKILL.md`
- `.claude/skills/firebase-architect/SKILL.md`
- `.claude/skills/react-native-expo-builder/SKILL.md`
- `.claude/skills/security-compliance-reviewer/SKILL.md`

Documentation in `docs/`:
- `docs/PROJECT_MAP.md`
- `docs/ARCHITECTURE.md`
- `docs/AGENT_LOG.md` (this file)
- `docs/DECISIONS.md`
- `docs/TODO_NEXT_AGENT.md`
- `docs/MOBILE_APP_PLAN.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/SKILLS_INDEX.md`

Mobile placeholder:
- `apps/mobile/README.md`

**Files intentionally NOT touched (protected):**
- `src/**` — website team
- `public/**` — website team
- `functions/**` — website team
- `dataconnect/**` — website team
- `package.json`, `package-lock.json` — deps managed by website team
- `firebase.json`, `firestore.rules`, `storage.rules`, `database.rules.json`, `firestore.indexes.json`
- `vite.config.js`, `eslint.config.js`
- `.env`, `.env.local`, `.env.example`, `.firebaserc`
- `README.md` (root)
- `cors.json`, `apphosting.emulator.yaml`, `main.jsx` (root), `serviceAccountKey.json`

**Decisions made:** see `docs/DECISIONS.md` (D-001 … D-006).

**Warnings for next agent:**
- `serviceAccountKey.json`, `.env`, `.env.local` are at repo root and appear to be committed. Do NOT touch in this phase, but raise with the website team — this is a credential leak risk.
- `src/components copy/`, `src/pages/Admin copy/`, `src/pages/StoreAdmin copy/` are manual backup folders. Ignore.
- Cloud Functions are effectively empty (`helloWorld` only). Any mobile feature that depends on server logic (orders, payments, prescription approval) will need functions written by the website/backend team first.
- No test framework is configured. TDD skills cannot run until one is added.
- jezweb / expo external skills are on disk but may not auto-register with Claude Code's plugin system. If they don't show up in the Skill tool after `/reload-plugins`, fall back to reading them directly from `.claude/external/*/` when needed.
- Nothing has been `npm install`-ed, no Expo init has been run, no git commit has been made.

**Suggested commit message:**
`chore(ai): bootstrap .claude skills and docs memory for mobile planning`

---
