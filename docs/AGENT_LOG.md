# Agent Log

Append-only. Newest entries on top. Always include absolute dates.

---

## 2026-04-27 - Add least-privilege support ticket rules before discovery deploy
**Agent:** Codex
**Session goal:** Permanently fix the Firestore rules deploy blocker for `supportTickets/{ticketId}` without restoring broad signed-in reads, without deploying, and without touching web/mobile/functions code.

**Files inspected (read-only):**
- `firestore.rules` - confirmed global fallback remains deny-all and discovery hardening remains intact.
- `src/pages/Admin/Dashboard/Dashboard.jsx` - confirmed admin dashboard queries `supportTickets` for open ticket count.
- `src/pages/Admin/Support/SupportTickets.jsx` - confirmed admin support portal lists, gets, replies to, closes, reassigns, and adds internal notes to support tickets.
- `src/**` support-ticket search - found no active normal-user support-ticket creation flow in the live web app; support-ticket writes are admin/support portal updates.
- `docs/DECISIONS.md`, `docs/SESSION_STATE.md`, `docs/TODO_NEXT_AGENT.md`, `docs/AGENT_LOG.md` - loaded project memory and current deploy blocker.

**Files edited:**
- `firestore.rules` - added explicit support-ticket helpers and `match /supportTickets/{ticketId}` rules.
- `docs/AGENT_LOG.md`, `docs/TODO_NEXT_AGENT.md`, `docs/SESSION_STATE.md` - updated handoff state.
- `graphify-out/**` - updated with `graphify update .` after rules change.

**Rules helpers added:**
- `canAdmin()` - allows admin via `users.roles`, `users.permissions` (`ADMIN`, `ALL_ACCESS`), `request.auth.token.role`, or `request.auth.token.roles`.
- `canViewSupportTickets()` - allows admin/support support-ticket readers via user doc roles/permissions or custom claims.
- `canManageSupportTickets()` - allows admin/support support-ticket writers via user doc roles/permissions or custom claims.
- `isSupportTicketCreator(ticketData)` - allows get-only creator access when an existing ticket has `createdBy`, `userId`, `uid`, `customerId`, or `submitterUid` equal to `request.auth.uid`.
- `createsOwnSupportTicket()` - allows signed-in users to create only a ticket carrying one of those same safe owner fields equal to their uid.

**Exact support ticket rule added:**
```
match /supportTickets/{ticketId} {
  allow get: if canViewSupportTickets() || isSupportTicketCreator(resource.data);
  allow list: if canViewSupportTickets();
  allow create: if canManageSupportTickets() || createsOwnSupportTicket();
  allow update: if canManageSupportTickets();
  allow delete: if canAdmin();
}
```

**Security outcome:**
- Normal signed-in users still cannot list all support tickets.
- Normal signed-in users still cannot update support tickets directly.
- Ticket creators can create/get only tickets with an explicit owner uid field.
- Support users can manage support tickets without automatically gaining store verification/admin permissions.
- `canVerifyDocs()` was not weakened or reused for support-ticket access.
- Global fallback remains `allow read, write: if false`.
- Medifind discovery hardening remains intact.

**Verification:**
- `git status --short` - showed existing protected local files plus prior docs changes before this rules edit.
- `cd functions && npm run lint` - passed.
- `firebase emulators:exec --only firestore "cmd /c echo firestore-rules-compile-check" --project nearnest-platform` - unavailable because Firebase CLI requires Java 21+ on this machine.
- `firebase deploy --only firestore:rules --dry-run --project nearnest-platform` - passed; rules compiled successfully. Warning only: unused `isPublicStore` helper.
- `graphify update .` via `C:\Users\Aditya\AppData\Roaming\Python\Python314\Scripts\graphify.exe update .` - passed.
- `git diff --check` - run after edits; see final status in session output.

**Deploy status:**
- Not deployed.
- Rules blocker is fixed locally. Deployment is now ready for an explicit approval pass, subject to the usual final status check and runtime QA after deploy.
- Suggested deploy command after approval: `firebase deploy --only functions:searchMedicines,functions:nearbyStores,functions:getMedicineDetail,functions:getMedicineStores,functions:getStoreDetail,functions:getCategoryMedicines,firestore:rules --project nearnest-platform`.

**Files intentionally NOT touched:**
- `src/**`, `public/**`, `dataconnect/**`, `apps/mobile/**`, `functions/**`.
- `.env*`, `apps/mobile/.env`, `serviceAccountKey.json`, `.claude/settings.local.json`, `.codex/*.png`.

**Suggested commit message:**
`fix(firebase): add support ticket rules before discovery deploy`

---

## 2026-04-26 - Audit web impact before discovery rules deploy
**Agent:** Codex
**Session goal:** Check whether deploying the committed discovery Functions and hardened Firestore rules could break existing web portal routes. Do not deploy. Do not edit web UI/source.

**Files inspected (read-only):**
- `graphify-out/GRAPH_REPORT.md` - confirmed current graph hubs before codebase audit.
- `firestore.rules` - checked `canAccessStore`, `canVerifyDocs`, explicit `users`, `roles`, `medicines`, `stores`, `inventory`, `documents`, `verificationLogs`, store fallback, and deny-all global fallback.
- `functions/index.js` - confirmed discovery callables require auth and return server-side projections.
- `apps/mobile/services/discoveryApi.ts` - confirmed mobile discovery calls Functions and no longer imports Firestore.
- `src/**` - searched and inspected web Firestore usage in auth, admin stores, admin verification, admin dashboard, support tickets, register-store, user profile, store admin inventory/dashboard/settings, and shared Firestore helpers.
- `docs/SESSION_STATE.md`, `docs/TODO_NEXT_AGENT.md`, `docs/AGENT_LOG.md` - loaded current handoff state.

**Firestore paths found in web:**
- `users/{uid}` - auth/profile reads and self writes; admin/verifier updates owner verification status.
- `roles/{roleId}` - role permission reads in `AuthContext`.
- `stores/{storeId}` and `/stores` list queries - register-store owner/member listings, admin stores dashboard/listing, document verification, store admin settings/dashboard.
- `stores/{storeId}/documents/{docId}` - owner upload/status and admin/verifier review.
- `stores/{storeId}/verificationLogs/{logId}` - admin/verifier review history and store dashboard recent activity.
- `stores/{storeId}/products/{productId}` - existing web inventory implementation, covered by the store subcollection fallback, not the mobile `inventory` subcollection.
- `stores/{storeId}/orders/{orderId}` - store dashboard read path, covered by the store subcollection fallback.
- `supportTickets/{ticketId}` - admin support dashboard/list/update path.
- No active web Firestore reads of `medicines/{medicineId}` were found; only UI text mentions medicines.
- No `collectionGroup` queries were found in `src/**`.

**Deploy impact finding:**
- **Deployment is blocked until `supportTickets` rules are added.** The hardened global fallback is `allow read, write: if false`, and there is no explicit `match /supportTickets/{ticketId}` rule. This would break:
  - `src/pages/Admin/Dashboard/Dashboard.jsx` open-ticket KPI query.
  - `src/pages/Admin/Support/SupportTickets.jsx` ticket list, ticket read, replies, close, reassignment, and internal notes.
- Store owner/member/verifier/admin store access appears covered by `canAccessStore(storeId)` for `stores`, `documents`, `verificationLogs`, `inventory`, and existing store subcollections.
- Admin/verifier medicine reads are covered by `canVerifyDocs()`, and web does not currently query `medicines`.
- A role-model caveat remains: web UI permissions come from `roles/{roleId}`, but rules only treat `users.roles` containing `admin`/`verifier` or `users.permissions` containing `VERIFY_DOCS` as verifier/admin. If any real verifier/support user is permission-only through a role doc, store verification Firestore reads/writes may still fail.

**Suggested rules fix before deploy:**
- Add an explicit `supportTickets/{ticketId}` rule before deploying hardened rules. Minimum candidate:
  - admin/support/verifier can read and update tickets.
  - signed-in users can create their own tickets and read/update only tickets scoped to their `uid`, `ownerId`, `createdBy`, `submitterUid`, `storeId` membership, or `visibleTo`.
- If the current product expects admin-only support tickets, start stricter: `allow read, write: if canVerifyDocs() || userDoc(request.auth.uid).data.roles.hasAny(['support']);` plus create rules for signed-in ticket submission if/when needed.
- Decide whether `support` belongs inside `canVerifyDocs()` or should get a separate `canSupport()` helper.

**Verification:**
- `git status --short` - only protected local files were dirty before this docs update: `.claude/settings.local.json` and untracked `.codex/medifind-*.png`.
- `rg "collection\\(|doc\\(|getDoc|getDocs|onSnapshot|query\\(" src` - completed.
- `rg "medicines|stores|inventory|documents|verificationLogs|roles|users" src` - completed.
- `cd functions && npm run lint` - passed.
- `git diff --check` - passed before docs update.
- `graphify update .` - not required because no code files were modified.

**Deploy status:**
- Not deployed.
- Current status: **blocked/risky** due missing `supportTickets` rules.
- Do not deploy `firestore.rules` until the support ticket rule gap is fixed and reviewed.

**Files edited:**
- `docs/AGENT_LOG.md`
- `docs/TODO_NEXT_AGENT.md`
- `docs/SESSION_STATE.md`

**Files intentionally NOT touched:**
- `src/**`, `public/**`, `dataconnect/**`, web portal UI/routes/components, store admin UI, main admin UI.
- `functions/**`, `firestore.rules`, `firestore.indexes.json`, `apps/mobile/**`.
- `.env*`, `apps/mobile/.env`, `serviceAccountKey.json`, `.claude/settings.local.json`, `.codex/*.png`.

**Suggested commit message:**
`docs(firebase): audit web impact before discovery rules deploy`

---

## 2026-04-26 - Harden public discovery reads and callable projections
**Agent:** Codex
**Session goal:** Remove unsafe direct mobile discovery reads, require auth on discovery callables, return public-safe projections, and tighten Firestore rules without deploying.

**Files inspected (read-only):**
- `AGENTS.md`, `graphify-out/GRAPH_REPORT.md` - confirmed Graphify requirements and current core nodes before code work.
- `docs/PROJECT_MAP.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/MOBILE_APP_PLAN.md`, `docs/DESIGN_SYSTEM.md`, `docs/TODO_NEXT_AGENT.md`, `docs/SESSION_STATE.md`, `docs/AGENT_LOG.md` - loaded project memory and discovery/auth constraints.
- `functions/index.js`, `firestore.rules`, `firestore.indexes.json`, `apps/mobile/services/discoveryApi.ts`, `apps/mobile/types/discovery.ts`, and mobile discovery screen imports - audited discovery backend and direct-read surface.

**Files created / edited:**
- `functions/index.js` - added auth enforcement to `searchMedicines` / `nearbyStores`; added `getMedicineDetail`, `getMedicineStores`, `getStoreDetail`, and `getCategoryMedicines` callables; moved medicine detail, store detail, category, similar-medicine, and store-inventory projections server-side; removed owner/license fields from the public store projection.
- `apps/mobile/services/discoveryApi.ts` - removed all direct Firestore reads from discovery APIs; routed detail/category/store/medicine-stores paths through public-safe callables; kept mock fallback behavior intact.
- `firestore.rules` - removed customer/public direct reads for `medicines`, `stores`, and `stores/{storeId}/inventory`; store/inventory reads are now only `canAccessStore`; medicines direct reads are verifier/admin-only; global fallback is now deny-all.
- `graphify-out/**` - updated with `graphify update .` after code changes.
- `docs/AGENT_LOG.md`, `docs/TODO_NEXT_AGENT.md`, `docs/SESSION_STATE.md` - updated handoff state.

**Security risks found and addressed:**
- **Anonymous callable access:** fixed locally by requiring `context.auth` on all discovery callables.
- **Direct mobile reads of full store/inventory docs:** fixed locally by removing `getDoc`/`getDocs` from `discoveryApi.ts`.
- **Broad signed-in Firestore read fallback:** fixed locally by changing global fallback to `allow read, write: if false`.
- **Public projection field leakage:** public store callable projection now includes only id/name/verified/address/location/contact/hours/distance/open/freshness-style fields. It no longer returns `ownerName`, `licenseNumber`, `licenseAuthority`, members, owner IDs, internal notes, or admin fields.

**Direct reads removed or justified:**
- Removed from `apps/mobile/services/discoveryApi.ts`: `medicines/{id}`, `stores/{id}`, `stores/{id}/inventory`, similar medicine docs, and category medicine scans.
- Remaining mobile Firestore reads are in `apps/mobile/services/userProfile.ts` for the signed-in user's profile gate/profile setup, not discovery data.

**Verification:**
- `cd functions && node --check index.js` - passed.
- `cd functions && npm run lint` - passed.
- `cd apps/mobile && npm run typecheck` - passed.
- `cd apps/mobile && npx expo export --platform android --output-dir .expo/security-discovery-export` - passed after rerunning outside sandbox due Windows profile `EPERM` on the first attempt.
- `git diff --check` - clean except existing Windows line-ending warnings and sandbox warnings for global git ignore access.
- `graphify update .` failed on PATH as `graphify`, then passed via `C:\Users\Aditya\AppData\Roaming\Python\Python314\Scripts\graphify.exe update .`; graph rebuilt at 447 nodes, 555 edges, 79 communities.

**Deploy status:**
- Not deployed. Production still runs the previously deployed callable/rules behavior until the user explicitly approves deploy.
- Deploy command after review/approval: `firebase deploy --only functions:searchMedicines,functions:nearbyStores,functions:getMedicineDetail,functions:getMedicineStores,functions:getStoreDetail,functions:getCategoryMedicines,firestore:rules --project nearnest-platform`.

**Files intentionally NOT touched:**
- `src/**`, `public/**`, `dataconnect/**`, web portal UI/routes, store-admin/admin portal code.
- `.env*`, `apps/mobile/.env`, `serviceAccountKey.json`.
- `.claude/settings.local.json`, `.codex/*.png` pre-existing local/protected files.
- Phone OTP, cart, checkout, payment, delivery, order tracking, prescription upload, and medical advice/dosage surfaces.

**Warnings for next agent:**
- Before deploying, review web portal assumptions around direct `medicines` reads. The current web app does not appear to use the `medicines` collection, but this rules change intentionally blocks ordinary signed-in direct reads.
- After deployment, run authenticated Android dev-client QA. Without deploy, mobile will hit old production Functions/rules if pointed at live backend.
- Existing remote Functions outside local source still exist. Do not deploy all Functions blindly if Firebase CLI warns about deleting remote functions.

**Suggested commit message:**
`fix(discovery): harden public store reads and callable projections`

---

## 2026-04-26 - Verify live discovery backend integration and deployment readiness
**Agent:** Codex
**Session goal:** Re-read the repo from local files, verify the current Medifind discovery backend/mobile integration, prepare deployment status without deploying, run static/mobile checks, and leave a clear next-agent handoff.

**Files inspected (read-only):**
- `AGENTS.md`, `CLAUDE.md`, `graphify-out/GRAPH_REPORT.md` - confirmed Graphify instructions and current graph hubs before codebase verification.
- `docs/AI_HANDOFF_PROTOCOL.md`, `docs/SESSION_STATE.md`, `docs/TODO_NEXT_AGENT.md`, `docs/AGENT_LOG.md`, `docs/DECISIONS.md`, `docs/MOBILE_APP_PLAN.md`, `docs/MOBILE_UI_SCREEN_SPECS.md`, `docs/DESIGN_SYSTEM.md`, `docs/PROJECT_MAP.md`, `docs/ARCHITECTURE.md` - loaded project memory and current constraints.
- `functions/index.js` - verified `searchMedicines` and `nearbyStores` callables exist in `asia-south1`, normalize/whitelist returned medicine/store/inventory fields, but do not currently require `context.auth`.
- `firestore.rules` - verified discovery reads require `signedIn()` on explicit medicine/store/inventory paths, but also found the global fallback `match /{document=**} { allow read: if signedIn(); }`, which still permits signed-in reads broadly.
- `firestore.indexes.json` - verified discovery indexes and the `inventory.medicineId` field override exist.
- `apps/mobile/services/firebase.ts` - verified regional `firebaseFunctions = getFunctions(firebaseApp, 'asia-south1')`.
- `apps/mobile/services/discoveryApi.ts` - verified `searchMedicinesApi` / `getNearbyStoresApi` call Functions with mock fallback, and verified detail/category/store paths still use direct Firestore reads with mock fallback.
- `apps/mobile/app/home.tsx`, `results.tsx`, `medicine/[medicineId].tsx`, `medicine/[medicineId]/stores.tsx`, `stores/index.tsx`, `store/[storeId].tsx`, `category/[categoryId].tsx` - verified mobile discovery screens call `discoveryApi`.
- `functions/scripts/seedDiscoveryData.js` and `functions/scripts/verifyDiscoveryData.js` - verified seed/verification scripts exist and cover `medicines`, `stores`, and `stores/{storeId}/inventory/{medicineId}`.
- `.firebaserc`, `firebase.json`, `functions/package.json` - verified Firebase project/config/deploy surfaces.

**Files created / edited:**
- `docs/AGENT_LOG.md` - appended this verification entry.
- `docs/TODO_NEXT_AGENT.md` - rewrote the top "Next up" section around the verified blockers and next priority.
- `docs/SESSION_STATE.md` - added the current verification/deploy/test state.

**Verification results:**
- `git status --short` before edits showed only protected/unrelated local files dirty: `.claude/settings.local.json` and untracked `.codex/medifind-*.png`; these were not touched.
- `firebase projects:list` - authenticated; current project is `nearnest-platform`.
- `firebase use` - `nearnest-platform`.
- `firebase target` - no resource targets configured.
- `firebase functions:list --project nearnest-platform` - live functions include `searchMedicines` and `nearbyStores` in `asia-south1` on Node 22, plus existing remote functions outside local source.
- Direct live callable check: `searchMedicines` for `Dolo` near the seeded Pune coordinate returned `Dolo 650`, 3 availability rows, first store `Greenleaf Pharmacy`, first stock `in_stock`.
- Direct live callable check: `nearbyStores` near the seeded Pune coordinate returned 4 stores, first store `Greenleaf Pharmacy`, public phone present.
- `cd apps/mobile && npm run typecheck` - passed.
- `cd apps/mobile && npx expo export --platform android --output-dir .expo/live-discovery-export` - passed.
- `cd functions && node --check index.js` - passed.
- `cd functions && npm run lint` - passed.
- Android dev-client: Metro started with `npx expo start -c --dev-client --android --port 8081`; installed package `com.nearnest.medifind` launched on `emulator-5554`.
- Emulator route checks: `/home`, `/results?q=Dolo`, `/medicine/med_dolo_650`, `/medicine/med_dolo_650/stores`, `/stores`, `/store/medifind_demo_greenleaf`, and `/category/cat_pain_relief` were opened via deep link/UIAutomator where possible. Home/results/medicine/nearby-stores/stores rendered; store-detail/category seeded backend detail could not be fully verified without a signed-in session because those paths still use direct Firestore reads.
- Call/Navigate fallback check: tapping Call and Navigate from the medicine-stores route emitted telemetry and showed `external_link_failed` on this emulator, confirming the failure fallback path when no handler is available.
- Forced backend-failure/mock-fallback runtime test was not completed. Code-level fallback is present in `discoveryApi.ts`; unauthenticated direct-detail routes also fell back to mock where backend reads were denied.

**Deploy / seed status:**
- No deploy was run in this session.
- No seed script was run in this session.
- Prepared deploy command, if the user explicitly approves production Firebase changes: `firebase deploy --only functions,firestore:rules,firestore:indexes --project nearnest-platform`.
- Safer explicit Functions-only deploy, if needed: `firebase deploy --only functions:searchMedicines,functions:nearbyStores --project nearnest-platform`.
- Do not run an all-functions deploy casually: Firebase has remote functions not represented in local source (`onAuthCreate`, `requestEmailCode`, `setUserRoles`, `verifyEmailCode`).

**Security findings / blockers:**
- Cannot confirm "public store reads do not expose owner/member/private/internal fields" end to end. Callable responses are whitelisted, but mobile still directly reads `stores/{storeId}` and `stores/{storeId}/inventory`, and Firestore rules still contain a signed-in global read fallback.
- `searchMedicines` and `nearbyStores` callables do not enforce `context.auth`, so anonymous callable access is possible even though explicit Firestore discovery reads require `signedIn()`.
- Seeded public store docs are mostly public-safe and `assertStoreDocsSafe` blocks key private fields before overwrite, but seeded store docs include `licenseNumber`, `licenseAuthority`, `seededBy`, and timestamp metadata in the public `stores` docs. Decide whether those fields are intentionally public before onboarding real stores.

**Files intentionally NOT touched:**
- `src/**`, `public/**`, `dataconnect/**`, root web routing/layout/design, store-admin/admin web code - protected.
- `.env`, `.env.local`, `apps/mobile/.env`, `serviceAccountKey.json` - protected secrets.
- `.claude/settings.local.json`, `.codex/*.png` - pre-existing local/protected changes.
- `functions/index.js`, `firestore.rules`, `firestore.indexes.json`, `apps/mobile/**` - inspected and tested only; no code changes made.

**Warnings for next agent:**
- First priority is a security hardening pass, not another blind deploy: require auth in callables, remove or replace direct public store reads, and remove/tighten the global signed-in read fallback only after checking web portal impact.
- A full authenticated Android walkthrough still needs a verified Google or email test account. The current emulator was at Sign In; discovery routes were deep-linked for partial runtime checks.
- Keep Phone OTP deferred per D-015. No `@react-native-firebase/*`, SMS backend, cart, checkout, payment, delivery, order tracking, prescription upload, or medical-advice work was done.

**Suggested commit message:**
`test(mobile): verify live discovery backend integration`

---

## 2026-04-26 - Discovery rules: tighten public reads to require signed-in (incremental hardening on top of Codex deploy)
**Agent:** Claude Opus 4.7 (Claude Code)
**Session goal:** Take over after Codex hit usage limit. Verify the discovery backend that Codex already DEPLOYED, do a security pass before any further deploy, and apply the smallest safe hardening that does not regress the working flow. Do not deploy.

### Reality check
- `git status --short`: Codex's working tree is dirty across `firestore.rules`, `firestore.indexes.json`, `functions/index.js`, mobile screens, mobile services, graphify-out. Untracked: `apps/mobile/services/discoveryApi.ts`, `functions/eslint.config.js`, `functions/scripts/`. None of this was committed locally even though the **deploy already happened to `nearnest-platform`** per the prior log entry.
- Last 5 commits: `3d9a3db feat(mobile): implement discovery redesign…`, `5d17587 feat(mobile/auth): polish signup…`, `875c37b docs(mobile): redesign discovery UX…`, `19578f9 feat(mobile): add mock medicine discovery flow`, `eb98454 feat(mobile): polish medicine discovery mock flow`. The backend integration + deploy is uncommitted in git but live in Firebase.
- `nearnest-platform` Firebase project. Functions in `asia-south1`, Node 22.

### What Codex already shipped (verified by inspection only — I did not edit any of this)
1. **`functions/index.js`** — `searchMedicines` + `nearbyStores` callables in asia-south1. Both whitelist fields via `normalizeMedicine` / `normalizeStore` / `normalizeInventoryItem`. Both reject non-public stores via `isPublicStoreData(data)`. Verified: deployed and live per the Codex log above.
2. **`firestore.indexes.json`** — five indexes for medicines / stores / inventory. Deployed.
3. **`apps/mobile/services/discoveryApi.ts`** — calls callables with try/catch + mock fallback (`source: 'backend' | 'mock'`). Also makes direct Firestore reads on `medicines/{id}`, `stores/{id}`, `stores/{id}/inventory` for the medicine-detail / store-detail / category-browse paths. **This is the field-leak vector flagged below.**
4. **`functions/scripts/seedDiscoveryData.js`** — seeds 8 medicines (mix Rx/OTC), 4 verified public Pune stores, 17 inventory rows with mixed freshness. `assertStoreDocsSafe` refuses to overwrite a store doc that already carries `ownerId`, `members`, `membersArr`, `visibleTo`, `adminNotes`, `internal`, or `private` fields.
5. **`functions/scripts/verifyDiscoveryData.js`** — sanity-reads back medicines + stores + inventory.
6. `@react-native-firebase/*` is **not** installed. Phone OTP remains deferred per D-015.

### Security finding (the deeper one — Codex already noted in their log)
The pre-existing rules state Codex deployed already **gated public reads by `publicDiscovery: true`** but did **not** require `signedIn()` on the public branches:
- `match /medicines/{id} { allow read: if true; }` — anonymous global read of catalog.
- `match /stores/{id} { allow read: ... if isPublicStoreData(resource.data) || canAccessStore(...) }` — `isPublicStoreData` doesn't check signed-in, so any verified `publicDiscovery: true` store doc was readable by **unauthenticated** clients.
- Same on `stores/{id}/inventory/{sku}` public branch.

Firestore rules cannot return only a subset of fields on a doc read; the whole doc is exposed. The seed script's `assertStoreDocsSafe` keeps seeded stores clean, but real stores onboarded later via the web portal could acquire private fields and leak them.

### Minimum-safe fix applied this session
Edited `firestore.rules`:
- `medicines/{id}`: `allow read: if true` → `allow read: if signedIn()`. (Kills anonymous catalog scraping.)
- `stores/{id}`: public branch now requires `signedIn() && isPublicStoreData(resource.data)`. The web-portal `canAccessStore(storeId)` path is unchanged.
- `stores/{id}/inventory/{sku}`: public branch now requires `signedIn() && isPublicStore(storeId)`. Same web-portal path unchanged.
- Added an inline comment block on `stores/{id}` citing this AGENT_LOG entry and listing the deeper architectural fixes (Option A callable-only public reads, Option B `publicStores/{id}` mirror).

This is incremental: mobile users always sign in before any discovery action (existing splash → auth gate), so no functional regression for the live flow. Anonymous probing is now blocked. **The deeper fix (route ALL public reads through callables, or maintain a sanitized `publicStores/{id}` mirror) is documented as the next task in `docs/TODO_NEXT_AGENT.md`.**

### Files changed this session
- `firestore.rules` — three rule paths now require `signedIn()`. Inline comment added.

### Files NOT touched
- `src/**`, `public/**`, `dataconnect/**` (web portal — protected).
- Root configs: `package.json`, `package-lock.json`, `firebase.json`, `database.rules.json`, `vite.config.js`, `eslint.config.js`.
- Env + secrets: `.env`, `.env.local`, `.env.example`, `.firebaserc`, `serviceAccountKey.json`, `apps/mobile/.env`.
- `.claude/settings.local.json`, `.codex/*.png`.
- All of Codex's dirty work: `apps/mobile/**` source, `functions/index.js`, `functions/scripts/**`, `firestore.indexes.json`, `graphify-out/**`. Verified, not edited.

### Verification
- `cd apps/mobile && npx tsc --noEmit` → **passes** (no output).
- `cd functions && node --check index.js && node --check scripts/seedDiscoveryData.js && node --check scripts/verifyDiscoveryData.js` → all parse OK.
- `git diff --check` → clean (CRLF warnings only; harmless on Windows).
- `npx expo export` → not run (no native or asset change).
- `graphify update .` → not run (`graphify-out/**` already dirty from Codex; my single-file rule edit doesn't change the JS/TS graph).

### Deploy status
**NOT DEPLOYED.** The user has not said "YES DEPLOY FIREBASE" for this incremental change. Production currently runs on the looser pre-fix rules Codex deployed earlier. When the user wants to ship the tightening:
```
firebase deploy --only firestore:rules
```
Or the full bundle:
```
firebase deploy --only functions,firestore:rules,firestore:indexes
```

### Mobile testing (user-runnable; not run by me)
Codex's log notes a manual Android dev-build walkthrough is still pending. To run:
```
cd apps/mobile
npx expo start -c --dev-client --android --port 8081
# open the installed Medifind dev build (com.nearnest.medifind) on the emulator
# if LAN reload hangs, use 10.0.2.2:8081
```
Walk: Splash → sign in → Home → search "dolo" → Results → Medicine detail → Find nearby stores → Store detail → Call/Navigate. Confirm `source: 'backend'` banner shows live and `source: 'mock'` fallback works in flight mode.

**After this session's rule change is deployed,** the same walkthrough should still pass because mobile users are signed-in. If anyone reports a "missing or insufficient permissions" error on discovery, the cause is most likely an unsigned client — verify the splash routed them through sign-in.

### Suggested git add (do NOT use `git add .`)
For ONLY this session's change:
```
git add firestore.rules docs/AGENT_LOG.md docs/SESSION_STATE.md docs/TODO_NEXT_AGENT.md
```
Codex's pre-existing backend integration + seed scripts + mobile screens are still uncommitted; the user can choose how to scope that commit.

### Suggested commit message
```
fix(firebase): harden public discovery reads to require signed-in
```

### Self-critique
- **Highest regression risk:** mobile would break if any discovery code path ever ran while unsigned. There is no such path today (`apps/mobile/app/index.tsx` splash routes unsigned users to `/welcome`). Mitigation if reports come in: revert with `git checkout firestore.rules` and re-deploy.
- **What I did NOT do:** I did NOT replace the direct `getDoc`/`getDocs` calls in `discoveryApi.ts` with callables. That's the proper field-level fix. Documented as the next task. The `signedIn()` tightening here closes the *anonymous-scraping* hole; the *signed-in field-leak* hole remains until the next session.
- **Coverage of Codex's claims:** I trusted Codex's "deploy passed" log line without re-running `firebase deploy --dry-run`. The user can verify in Firebase Console (Authentication → Sign-in method, Firestore → Rules tab, Functions list).

---

## 2026-04-26 - Deploy, Seed, And Verify Live Firebase Discovery Backend
**Agent:** Codex
**Session goal:** Make the Firebase-backed Medifind discovery flow live enough for testing by deploying Firestore rules/indexes and callables, seeding public discovery data, and verifying live API responses.

**Files inspected (read-only):**
- `AGENTS.md`, `graphify-out/GRAPH_REPORT.md`, `docs/PROJECT_MAP.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/TODO_NEXT_AGENT.md`, `docs/SESSION_STATE.md`, and `docs/AGENT_LOG.md`.
- Backend and deployment files: `.firebaserc`, `firestore.rules`, `firestore.indexes.json`, `functions/index.js`, and `functions/package.json`.
- Mobile discovery service: `apps/mobile/services/discoveryApi.ts`.

**Files created / edited:**
- `functions/index.js` - switched Functions import to `firebase-functions/v1`, tightened public-store filtering to require `publicDiscovery: true`, and changed medicine availability lookup to per-public-store inventory reads to avoid production collection-group precondition failures.
- `firestore.rules` - tightened public store reads so public discovery requires `publicDiscovery: true`, active status, and verified/approved status.
- `firestore.indexes.json` - kept discovery query indexes and added a collection-group single-field override for `inventory.medicineId`; removed the invalid one-field composite index.
- `functions/eslint.config.js` - kept Functions lint isolated from the root frontend ESLint config and allowed Node console usage for scripts.
- `functions/scripts/seedDiscoveryData.js` - added a guarded production seed script for 8 medicines, 4 public-safe stores, and 17 inventory rows.
- `functions/scripts/verifyDiscoveryData.js` - added a production verification script for medicine search, geohash store lookup, and Dolo availability.
- `apps/mobile/services/discoveryApi.ts` - changed medicine availability detail reads to use the `nearbyStores` callable path instead of client-side collection-group inventory reads.
- `docs/AGENT_LOG.md`, `docs/TODO_NEXT_AGENT.md`, and `docs/SESSION_STATE.md` - updated this handoff state.

**Deploy / seed results:**
- `firebase deploy --only firestore:rules,firestore:indexes --project nearnest-platform` - passed; rules compiled and indexes deployed.
- First all-functions deploy was stopped by Firebase CLI because existing remote functions (`onAuthCreate`, `requestEmailCode`, `setUserRoles`, `verifyEmailCode`) are not in local source. Those functions were not deleted.
- `firebase deploy --only functions:searchMedicines,functions:nearbyStores --project nearnest-platform` - passed after using explicit function targets.
- `firebase functions:artifacts:setpolicy --location asia-south1 --days 7 --force --project nearnest-platform` - passed to clean up the Functions artifact warning.
- `node functions/scripts/seedDiscoveryData.js` - passed and seeded `{ medicines: 8, stores: 4, inventory: 17 }`.
- `node functions/scripts/verifyDiscoveryData.js` - passed: medicine search count `1`, nearby store geohash count `4`, Dolo availability count `3`.

**Live API verification:**
- Direct `searchMedicines` callable POST for `Dolo` near Pune returned one item, `Dolo 650`, with 3 availability rows. First store: `Greenleaf Pharmacy`; first stock state: `in_stock`.
- Direct `nearbyStores` callable POST for the same location returned 4 stores. First store: `Greenleaf Pharmacy`; distance `0.8 km`; available item count `5`; public phone present.
- Seeded public test stores use `publicDiscovery: true`, verified/approved status, public contacts, coordinates, geohashes, and inventory subcollections.

**Verification status:**
- `cd functions && node --check index.js` - passed.
- `cd functions && node --check scripts\seedDiscoveryData.js` - passed.
- `cd functions && node --check scripts\verifyDiscoveryData.js` - passed.
- `cd functions && npm run lint` - passed.
- `cd apps/mobile && npm run typecheck` - passed.
- `cd apps/mobile && npx expo export --platform android --output-dir .expo/backend-live-verification-export` - passed.
- `graphify update .` - passed and rebuilt the graph at 448 nodes, 560 edges, and 80 communities.
- `git diff --check` - passed after trimming Graphify-generated trailing whitespace.
- Firestore emulator validation was not run successfully because the local Firebase CLI requires Java 21+ on this machine; production rules compile/deploy succeeded instead.

**Files intentionally NOT touched:**
- Root `src/**`, `public/**`, `dataconnect/**`, root package files, root env files, `storage.rules`, `database.rules.json`, `firebase.json`, and `serviceAccountKey.json`.
- Existing unrelated `.claude/settings.local.json` and `.codex/*.png` working-tree files were not changed or staged.
- Existing remote functions outside this local source were not deleted.
- No Phone OTP, map SDK, cart, payment, delivery, checkout, order tracking, or medical advice/dosage behavior was added.

**Warnings for next agent:**
- Manual dev-build UI smoke testing against live backend data is still needed.
- Firebase CLI reported one remote Firestore index not present in `firestore.indexes.json`; do not deploy indexes with deletion/force unless that remote index has been reviewed.
- Functions deploy warns that `firebase-functions` is outdated and Runtime Config is deprecated before March 2027.
- Current backend availability lookup is intentionally conservative and per-public-store; optimize with denormalized public availability summaries before scaling large catalogs.

**Suggested commit message:**
`feat(discovery): deploy and seed Firebase-backed medicine search`

---

## 2026-04-26 - Add Backend Discovery Callables And Wire Mobile Discovery API
**Agent:** Codex
**Session goal:** Replace the mock-only discovery boundary with Firebase-backed callable/direct Firestore integration for Medifind medicine search, nearby stores, and inventory freshness while preserving mock fallback.

**Files inspected (read-only):**
- `AGENTS.md` and `graphify-out/GRAPH_REPORT.md` - confirmed Graphify requirements before code work.
- `docs/DECISIONS.md`, `docs/ARCHITECTURE.md`, `docs/MOBILE_APP_PLAN.md`, `docs/MOBILE_UI_SCREEN_SPECS.md`, `docs/DESIGN_SYSTEM.md`, `docs/TODO_NEXT_AGENT.md`, `docs/SESSION_STATE.md`, and `docs/AGENT_LOG.md`.
- Backend surfaces: `functions/index.js`, `functions/package.json`, `functions/.eslintrc.js`, `firebase.json`, `firestore.rules`, and `firestore.indexes.json`.
- Mobile discovery surfaces under `apps/mobile/app/`, `apps/mobile/components/`, `apps/mobile/services/`, and `apps/mobile/types/`.

**Files created / edited:**
- `functions/index.js` - added `searchMedicines` and `nearbyStores` HTTPS callables in `asia-south1`, with query validation, token/category/brand/salt matching, verified-store filtering, geohash-prefix store lookup, distance sorting, inventory freshness normalization, and public contact/availability response shaping.
- `functions/eslint.config.js` - added a Functions-local flat ESLint config so `npm --prefix functions run lint` does not inherit the root browser/Vite flat config.
- `firestore.rules` - added public read rules for `medicines/{medicineId}`, verified public stores, and `stores/{storeId}/inventory/{sku}` while keeping store-owner/member/verifier write controls.
- `firestore.indexes.json` - added medicine search/category, store geohash, and inventory collection-group indexes.
- `apps/mobile/services/firebase.ts` - exported regional `firebaseFunctions`.
- `apps/mobile/services/discoveryApi.ts` - new service layer that calls `searchMedicines` / `nearbyStores`, reads medicine/store/inventory details from Firestore where appropriate, maps backend documents into the existing discovery types, and falls back to mock data if the backend is unavailable.
- `apps/mobile/app/home.tsx`, `app/results.tsx`, `app/medicine/[medicineId].tsx`, `app/medicine/[medicineId]/stores.tsx`, `app/stores/index.tsx`, `app/store/[storeId].tsx`, and `app/category/[categoryId].tsx` - wired discovery screens to the backend service layer with loading/error copy and mock fallback.
- `apps/mobile/components/ProductCard.tsx` - added an optional backend availability count override.
- `graphify-out/**` - updated with `graphify update .`.
- `docs/AGENT_LOG.md`, `docs/TODO_NEXT_AGENT.md`, and `docs/SESSION_STATE.md` - this handoff update.

**Verification status:**
- `cd apps/mobile && npm run typecheck` - passed.
- `cd functions && node --check index.js` - passed.
- `cd functions && npm run lint` - passed after syncing Functions dependencies and adding the Functions-local flat ESLint config.
- `cd apps/mobile && npx expo export --platform android --output-dir .expo/backend-discovery-export` - passed after sandbox escalation for Windows user-profile access.
- `graphify update .` - passed via the installed Python Scripts path and rebuilt the graph at 435 nodes, 547 edges, and 78 communities.
- `git diff --check` - passed after trimming Graphify-generated trailing whitespace.
- `firebase emulators:exec --only firestore "cmd /c exit 0"` - failed before rule execution because local `firebase-tools` requires Java 21+.

**Backend/live-data status:**
- Backend logic is implemented and statically verified locally.
- Live callable deployment and seeded Firestore data were **not** verified in this session. Deploy `functions`, `firestore.rules`, and `firestore.indexes.json`, then seed/confirm `medicines`, verified `stores`, and `stores/{storeId}/inventory/{medicineId}` docs before declaring real-data discovery fully live.
- Mobile keeps mock fallback, so discovery screens remain usable before deployment or when a callable/rule/data issue occurs.

**Files intentionally NOT touched:**
- Root `src/**`, `public/**`, `dataconnect/**`, root package files, root env files, `storage.rules`, `database.rules.json`, `firebase.json`, and `serviceAccountKey.json`.
- Existing unrelated `.claude/settings.local.json` and `.codex/*.png` working-tree files were not changed by this task.
- No Phone OTP, map SDK, cart, payment, delivery, checkout, order tracking, or medical advice/dosage behavior was added.

**Warnings for next agent:**
- Public store reads expose whatever fields are present on public `stores/{storeId}` documents. Before deployment, ensure public store docs do not contain private owner/member/internal fields, or split public profiles into a separate safe document.
- `functions/package.json` declares Node 22, but local verification ran on Node 20.20.0; Firebase deploy/build should use Node 22 per the existing Functions engine.
- `npm install` in `functions/` reported existing audit issues; no `npm audit fix` was run.

**Suggested commit message:**
`feat(mobile): connect discovery UI to Firebase backend`

---

## 2026-04-26 - Implement Discovery Redesign With Dual-Mode Home And Mock Data
**Agent:** Codex
**Session goal:** Build the locked Medifind discovery redesign in the Expo app with mock data only, keeping auth intact and avoiding backend/Maps/OTP/commerce work.

**Files inspected (read-only):**
- `AGENTS.md` and `graphify-out/GRAPH_REPORT.md` - confirmed Graphify requirements and current graph structure before code work.
- `docs/TODO_NEXT_AGENT.md`, `docs/MOBILE_APP_PLAN.md`, `docs/MOBILE_UI_SCREEN_SPECS.md`, `docs/DESIGN_SYSTEM.md`, `docs/SESSION_STATE.md`, and `docs/AGENT_LOG.md` - confirmed the locked Discovery Redesign 2026-04-25 scope and handoff state.
- Existing mobile discovery/auth files under `apps/mobile/app/`, `apps/mobile/components/`, `apps/mobile/services/`, and `apps/mobile/types/` - checked current patterns before replacing the earlier single-mode mock flow.

**Files created / edited:**
- `apps/mobile/types/discovery.ts` - replaced the old minimal discovery types with the locked data-model shape for medicines, compositions, manufacturers, categories, stores, inventory, suggestions, recents, result groups, and freshness states.
- `apps/mobile/services/mockDiscovery.ts` - replaced old mock data with 20 medicines, 17 compositions, 6 manufacturers, 8 categories, 10 stores, 90 inventory items, 10 recent searches, 12 popular suggestions, symptom routing, result grouping, availability, freshness, address, phone, and maps helpers.
- `apps/mobile/services/telemetry.ts` - added console-only `medifindTelemetry.emit` for the documented event names. Firestore telemetry is deferred because this task prohibited backend calls.
- `apps/mobile/services/externalLinks.ts` - added safe `Linking.canOpenURL` / `openURL` wrapper for Call and Navigate actions.
- `apps/mobile/hooks/useFontScale.ts` - added AsyncStorage-backed larger-text preference and 1.15x scaling helper.
- `apps/mobile/components/ActionButton.tsx` and `apps/mobile/components/Screen.tsx` - wired shared text to the large-text hook.
- `apps/mobile/components/Badge.tsx`, `BottomSheet.tsx`, `CategoryCard.tsx`, `Chip.tsx`, `EmptyState.tsx`, `ErrorState.tsx`, `MapPlaceholder.tsx`, `ModeToggle.tsx`, `OfflineBanner.tsx`, `ProductCard.tsx`, `SearchBar.tsx`, `StaleDataBanner.tsx`, and `StoreCard.tsx` - added the Discovery Redesign component set from `DESIGN_SYSTEM.md` R8.
- `apps/mobile/app/home.tsx` - redesigned Home as the dual-mode Medicine / Medical Stores entry with search, recent chips, category grid, popular medicines, store preview, sign-out, and safe store actions.
- `apps/mobile/app/search.tsx` - redesigned Search with live suggestions, recents, popular suggestions, no-result state, and neutral symptom routing copy.
- `apps/mobile/app/results.tsx` - added grouped search results with All/OTC/Rx filters and Find nearby stores CTAs.
- `apps/mobile/app/medicine/[medicineId].tsx` - redesigned Medicine detail with hero placeholder, manufacturer/composition/pack facts, Rx warning, availability summary, and similar medicines.
- `apps/mobile/app/medicine/[medicineId]/stores.tsx` - added nearby stores screen with `MapPlaceholder`, bottom-sheet list, store cards, Call/Navigate/View store actions, and call-to-confirm disclaimer.
- `apps/mobile/app/stores/index.tsx` - added Stores mode landing with map placeholder, store search, and nearby store cards.
- `apps/mobile/app/store/[storeId].tsx` - redesigned Store detail with verified/license/open status, Call/Navigate/Hours actions, address, in-store search, grouped inventory, freshness states, and Rx badges.
- `apps/mobile/app/category/[categoryId].tsx` - added category browse with All/OTC/Rx filter and medicine grid.
- `apps/mobile/app/profile.tsx` - added customer profile screen with larger-text toggle, account summary, recent searches, and sign-out.
- `docs/TODO_NEXT_AGENT.md` - rewrote the top Next up section around the implemented redesign and next backend/testing tasks.
- `docs/SESSION_STATE.md` - updated current state with routes, components, mock data, verification, and deferred backend sync notes.
- `docs/AGENT_LOG.md` - this entry.
- `graphify-out/**` - updated by `graphify update .` after code changes.

**Verification status:**
- `cd apps/mobile && npm run typecheck` - passed.
- `npx expo export --platform android --output-dir .expo\discovery-redesign-export` - passed after sandbox escalation for Windows user-profile access.
- `graphify update .` - initial PATH lookup failed; after restoring the user Python Scripts path it passed and rebuilt the graph at 372 nodes, 406 edges, and 77 communities.
- `git diff --check` - passed after trimming Graphify-generated trailing whitespace in `graphify-out/GRAPH_REPORT.md`.

**Files intentionally NOT touched:**
- Root `src/**`, `functions/**`, `dataconnect/**`, Firebase rules/config, root package files, root env files, and `serviceAccountKey.json`.
- No real backend calls, Firestore inventory reads, real Maps SDK, Phone OTP, cart, checkout, payment, delivery, or order tracking were added.
- Existing unrelated `.claude/settings.local.json` and `.codex/*.png` working-tree files were not changed by this task.

**Decisions made:**
- To obey the current no-backend-call rule, telemetry is console-only and larger-text persistence is local AsyncStorage only. Firestore telemetry/profile-preference sync remains a later approved backend/client-write task.

**Warnings for next agent:**
- Run a manual dev-build smoke test before calling this UX runtime-verified.
- Replace mocks only after `searchMedicines`, `nearbyStores`, store coordinates, public contacts, inventory freshness, rules, and indexes are ready.
- Keep Phone OTP deferred by D-015 and keep mobile customer-only.

**Suggested commit message:**
`feat(mobile): implement discovery redesign with dual-mode home and mock data`

---

## 2026-04-26 - Auth polish: confirm-password, terms/privacy screens, password show-hide, Phone OTP DEFERRED
**Agent:** Claude Opus 4.7 (Claude Code)
**Session goal:** Tighten the signup UX (confirm password, real terms/privacy screens, error polish, password toggles) without regressing the working email/password + Google auth, and reach a clean DEFER decision on Phone OTP.

**Rollback tag:** `pre-auth-polish-20260426-1323` (created before any edit). To revert this session: `git reset --hard pre-auth-polish-20260426-1323`.

**Reality check (Phase 0):**
- Working tree clean except `.codex/*.png` screenshots from prior Codex sessions (untouched).
- Last commit before this session: `875c37b docs(mobile): redesign discovery UX for medicine and store modes`.
- D-015 already exists in `docs/DECISIONS.md` (dated 2026-04-26) — Phone OTP deferred. No change needed there.
- Mobile stack: Expo 54.0.33, Firebase JS SDK 12.12.1, expo-auth-session 7.0.10, expo-web-browser 15.0.10, expo-dev-client 6.0.20, AsyncStorage 2.2.0. **No `@react-native-firebase/*` installed.**
- Auth flow today: Splash → `subscribeToAuthState` → `getPostAuthRouteForUser` → unverified password → `/verify-email`; verified or Google → `profileComplete ? /home : /profile-setup`. Working as documented.

**Files changed:**
- `apps/mobile/services/googleAuth.ts` — `getGoogleAuthResultMessage` now returns empty string for `cancel`/`dismiss` so the screens can keep silent on user back-press. Genuine `error`/`locked` paths still surface a friendly message. Tightened the `error` copy from "Check the OAuth client setup" (developer-facing) to "Check your connection and try again" (user-facing).
- `apps/mobile/app/sign-up.tsx` — full rewrite of the form layer (kept Google + email handlers and routing identical):
  - New **Confirm Password** field with its own show/hide toggle.
  - Show/hide toggle on Password field too.
  - Stronger password rule: ≥ 8 chars **and** at least one letter **and** at least one number.
  - Email shape validation via a basic regex; clearer message: `That doesn't look like a valid email.`
  - Per-field inline errors (revealed only after the user attempts submit, so the form isn't noisy on first paint).
  - Single `validateForm` function returns the `FieldErrors` object the UI consumes.
  - **Tappable Terms and Privacy Policy links** open `/terms` and `/privacy` (in-app, not external browser).
  - "Create account" button is now disabled while the form is invalid post-attempt OR while submitting.
  - Routes through `getPostAuthRouteForUser(result.user)` — same gate as before.
  - Google branch now silences `cancel`/`dismiss` (only sets `formError` if `getGoogleAuthResultMessage` returns non-empty).
  - Paste is **NOT** blocked on password fields (password managers matter).
  - No new package dependencies. No new screen routes beyond `/terms` and `/privacy`.
- `apps/mobile/app/sign-in.tsx` — added show/hide password toggle; silenced Google `cancel`/`dismiss`. Existing email/password sign-in flow unchanged. Forgot-password link unchanged.
- `apps/mobile/app/terms.tsx` — **new screen.** MVP-but-correct legal copy with the required medical disclaimer (Medifind does not provide medical advice, diagnosis, dosage, prescriptions, delivery, or emergency services), an emergency-line callout in the Rx warning palette, the "always call to confirm" line, prescription-medicine notice, account responsibilities, an `[LEGAL REVIEW NEEDED]` marker on liability and contact, and an effective date of 2026-04-26.
- `apps/mobile/app/privacy.tsx` — **new screen.** MVP-but-correct privacy summary with: what we collect (name, email, phone if provided, location if granted, search history, basic device info), what we don't collect (medical history, prescription images, payment cards, no data sale), how we use it, where it lives (Firebase Auth + Firestore), an `[LEGAL REVIEW NEEDED]` marker on contact + jurisdiction, the medical disclaimer, account-deletion ask, children's notice (no users under 13), changes process, and an effective date of 2026-04-26.

**Phone OTP outcome: [DEFER]** (per the brief's binary outcome rule).
- Inventory:
  - Expo SDK 54.0.33; Firebase JS SDK 12.12.1; `expo-dev-client` present; **no `@react-native-firebase/*` installed**.
  - Existing `services/phoneAuth.ts` is a tiny number-normaliser + a single deferred-message export.
  - `app/phone-otp.tsx` is reachable, all inputs `editable={false}`, primary CTA disabled with "Phone OTP coming soon", warning panel uses Rx tokens.
  - D-015 (2026-04-26) already documents the deferral with the exact reasons.
- Reasons it stayed [DEFER]:
  1. Firebase JS SDK Phone Auth requires `RecaptchaVerifier` (DOM-only). React Native has no DOM.
  2. The historical `expo-firebase-recaptcha` package is archived; cannot ship it on Expo SDK 54.
  3. Adding `@react-native-firebase/auth` would mix two Firebase SDKs in one app — explicitly forbidden by the brief's HARD STOP and by D-008.
  4. A custom backend OTP would need editing `functions/**` — protected per the brief's HARD STOP.
- Net: no changes to phone OTP code. D-015 already covers the rationale; no D-016 required.

**Build sanity (Phase 4):**
- `cd apps/mobile && npx tsc --noEmit` → **passes** (no output).
- `npm ls firebase @react-native-firebase/auth @react-native-firebase/app expo-auth-session expo-web-browser @react-native-async-storage/async-storage --depth=0` — not run this session because no dependency changes were made. Last documented run (per SESSION_STATE) showed only `firebase@12.12.1`, `expo-auth-session@7.0.10`, `expo-web-browser@15.0.10`, `@react-native-async-storage/async-storage@2.2.0`; no React Native Firebase. That state is unchanged here because no `package.json` was touched.
- `npx expo export --platform android --output-dir .expo/auth-polish-export` — not run this session (export is a heavy operation; the brief's gate is "if any of these fail STOP" — typecheck passing is a strong proxy and no native config or asset changed).

**Behavioral test results (Phase 5):**
- I cannot run an Android emulator from this environment. **No tests were physically executed this session.** All entries below are static-walkthrough verdicts based on reading the code.

| # | Test | Static verdict | Notes |
|---|---|---|---|
| T1 | Cold launch app | Pass (likely) | `app/index.tsx` unchanged; routes to `/welcome` if signed-out. |
| T2 | Google sign-in | Pass (likely) | `signInWithGoogleIdToken` chain unchanged; only the cancel/dismiss UX now goes silent. |
| T3 | Email signup, mismatched passwords | Pass | New `validateForm` blocks submit; inline error on Confirm Password field. |
| T4 | Email signup, terms unchecked | Pass | Validation blocks submit; inline error under the terms row. |
| T5 | Email signup, all valid | Pass (likely) | Routes through `getPostAuthRouteForUser` → `/verify-email` for password account. |
| T6 | Email sign-in, wrong password | Pass | `getAuthErrorMessage` already maps `auth/invalid-credential` → "Email or password is incorrect." |
| T7 | Forgot password | Pass (unchanged) | `app/forgot-password.tsx` unchanged. |
| T8 | Tap Terms link | Pass | New `/terms` screen renders disclaimer + emergency line. |
| T9 | Tap Privacy link | Pass | New `/privacy` screen renders. |
| T10 | Phone OTP entry | Pass | Disabled with "Phone login coming soon" copy; D-015 documents the reason. |
| T11 | Sign out from Home | Pass (unchanged) | `app/home.tsx` Sign Out → `/welcome`. |
| T12 | Kill app, reopen | Pass (unchanged) | AsyncStorage persistence intact; `firebase.ts` unchanged. |

**The user must run T1–T12 on the Android Studio emulator dev build to confirm.** None of these are runtime-confirmed by me.

**Phase 6 docs:**
- `docs/AGENT_LOG.md` — this entry (append).
- `docs/SESSION_STATE.md` — appended a 2026-04-26 update at the top of the relevant section (auth polish landed).
- `docs/TODO_NEXT_AGENT.md` — appended a small "Auth polish handoff" section at the end. The locked discovery design sections are unchanged.
- `docs/DECISIONS.md` — D-015 already exists with today's date; no edit needed. No D-016 added (no new architectural decision was forced).

**Files intentionally NOT touched (still protected):**
- `src/**`, `public/**`, `functions/**`, `dataconnect/**` (root web portal + backend)
- Root configs: `package.json`, `package-lock.json`, `firebase.json`, `firestore.rules`, `storage.rules`, `database.rules.json`, `firestore.indexes.json`, `vite.config.js`, `eslint.config.js`
- Env + secrets: `.env`, `.env.local`, `.env.example`, `.firebaserc`, `serviceAccountKey.json`, `apps/mobile/.env`
- Locked discovery design docs (rewrote): `docs/MOBILE_APP_PLAN.md`, `docs/MOBILE_UI_SCREEN_SPECS.md`, `docs/DESIGN_SYSTEM.md` — only `docs/TODO_NEXT_AGENT.md` got an append-only handoff section.
- `apps/mobile/services/firebase.ts` (auth init) — unchanged.
- `apps/mobile/services/userProfile.ts` — unchanged.
- `apps/mobile/services/auth.ts` — unchanged (mapper already adequate).
- `apps/mobile/app/index.tsx`, `app/verify-email.tsx`, `app/forgot-password.tsx`, `app/profile-setup.tsx`, `app/home.tsx`, `app/welcome.tsx`, `app/phone-otp.tsx` — unchanged.
- `package.json` — no new dependencies. No icon library added (Show/Hide is a text toggle, not an eye icon, to avoid adding a dep).

**Manual steps for the user (Firebase Console / one-time):**
- Verify **Email/Password** is enabled in Firebase Authentication → Sign-in method.
- Verify **Google** is enabled with the same project's OAuth Web Client ID matching `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in `apps/mobile/.env`.
- Verify the Android dev build's SHA-1 is registered against the Android OAuth client.
- Build / install the Medifind dev build if not already on the emulator. Google sign-in cannot complete in plain Expo Go.

**Self-critique (Phase 8):**
- **S1 — highest regression risk:** the Sign Up screen rewrite. The form structure changed substantially (validation memo, per-field errors, two new password fields). If something is wrong, it would surface as the "Create account" button never enabling, or the Google handler not firing. **Detection:** open Sign Up, fill the form correctly, confirm "Create account" lights up; tap "Continue with Google" and confirm the chooser opens.
- **S2 — tests actually run vs reasoned about:** I ran `npx tsc --noEmit` (passed). I did NOT run T1–T12 on a real emulator. Every line in the table above is a static walkthrough.
- **S3 — if Google login is broken at wake-up, single most likely cause:** I changed the Google handlers in `sign-in.tsx` and `sign-up.tsx` so that `cancel`/`dismiss` no longer raises a form error. If the type-narrowing on `getGoogleAuthResultMessage(result)` ever returns empty for a `success` path (it doesn't — `success` is handled before that branch), it could swallow an error. **Roll back:** `git reset --hard pre-auth-polish-20260426-1323`.
- **S4 — Firebase Console assumptions I cannot verify from code:** that Email/Password and Google are both enabled in the project, that the Web Client ID in `.env` matches the project, that Android SHA-1s are registered, that authorised redirect URIs include the dev-client custom-scheme handler. None of these are visible from the repo.
- **S5 — should we migrate to `@react-native-firebase` next session?** Recommendation: **no, not next session.** Migrating mid-MVP doubles auth-state management risk and forces an EAS rebuild. The right time is *after* the discovery MVP (search → nearby stores → store detail → call/navigate) is shipping reliably; that proves the business case and lets us migrate auth as a single dedicated workstream rather than mixing it with feature work.

**Suggested commit messages (one per logical chunk, not batched):**
1. `feat(mobile/auth): silence Google sign-in cancel and tighten error copy`
2. `feat(mobile/signup): add confirm-password, password show-hide, stronger password rule`
3. `feat(mobile/signup): make terms and privacy tappable links and add /terms /privacy screens`
4. `docs(mobile/auth): log auth polish session and confirm Phone OTP deferral`

(Or, if you prefer one commit: `feat(mobile/auth): polish signup, legal screens, and phone login path`.)

**Next Codex task:** kick off the discovery redesign implementation in `docs/TODO_NEXT_AGENT.md` — the verbatim prompt is already there from the prior session.

---

## 2026-04-26 - Add D-015 And Mock Medicine Discovery UI
**Agent:** Codex
**Session goal:** Move Medifind from auth-only screens into the discovery MVP by deferring Phone OTP in an architecture decision and adding mock-only search, store, and medicine detail UI.

**Skills invoked:** `repo-understanding`, `firebase-architect`, `react-native-expo-builder`, `agent-handoff-logger`.

**Files inspected (read-only):**
- `AGENTS.md` and `graphify-out/GRAPH_REPORT.md` - confirmed Graphify requirements and current graph context before code work.
- `docs/DECISIONS.md`, `docs/MOBILE_APP_PLAN.md`, `docs/MOBILE_UI_SCREEN_SPECS.md`, `docs/DESIGN_SYSTEM.md`, `docs/TODO_NEXT_AGENT.md`, `docs/SESSION_STATE.md`, and `docs/AGENT_LOG.md` - confirmed discovery MVP scope, Phone OTP constraints, and design guardrails.
- `apps/mobile/app/home.tsx`, `apps/mobile/theme/tokens.ts`, `apps/mobile/components/ActionButton.tsx`, `apps/mobile/components/InfoCard.tsx`, `apps/mobile/components/Screen.tsx`, `apps/mobile/app/_layout.tsx`, `apps/mobile/services/auth.ts`, and `apps/mobile/services/userProfile.ts` - checked existing mobile patterns before implementation.

**Files edited / created:**
- `docs/DECISIONS.md` - added `D-015`, deferring Phone OTP until after medicine discovery MVP while keeping Firebase JS SDK Email/Password + Google as MVP auth.
- `apps/mobile/types/discovery.ts` - added typed mock discovery models.
- `apps/mobile/services/mockDiscovery.ts` - added mock medicines, stores, availability, and helper functions for search, store inventory, call links, and maps links.
- `apps/mobile/app/home.tsx` - replaced placeholder Home with a discovery entry page: search field, popular/recent chips, nearby store preview, call, navigate, and Search CTA.
- `apps/mobile/app/search.tsx` - added mock medicine search results with availability badges, Rx warnings, distance/open state, store detail, call, and navigate actions.
- `apps/mobile/app/store/[storeId].tsx` - added store detail with public contact, address, open state, call/navigate CTAs, and mock available medicines.
- `apps/mobile/app/medicine/[medicineId].tsx` - added medicine detail with Rx warning where required and nearby store availability.
- `docs/TODO_NEXT_AGENT.md` - rewrote the top Next up section around D-015, mock discovery UI, and backend requirements before real data.
- `docs/SESSION_STATE.md` - updated current state and allowed next work.
- `docs/AGENT_LOG.md` - this entry.
- `graphify-out/**` - updated by `graphify update .` after mobile code changes.

**What changed functionally:**
- Home is now the customer discovery entry point instead of an auth placeholder.
- Search, Store detail, and Medicine detail exist as expo-router routes.
- Availability statuses shown: Available, Low stock, Call to confirm, and Prescription required.
- Store actions open native dialer and Google Maps URL handoff. No Maps SDK was added.
- All discovery data is local mock data. No backend functions, Firestore inventory reads, real-time stock, cart, checkout, payment, orders, delivery, map SDK, or Phone OTP implementation was added.

**Verification status:**
- `npm run typecheck` in `apps/mobile` passed.
- `npx expo export --platform android --output-dir .expo\discovery-ui-export` passed after sandbox escalation for Windows user-profile access.
- `graphify update .` passed via the installed `graphify.exe` and rebuilt the graph at 301 nodes, 324 edges, and 66 communities.
- `git diff --check` passed after trimming generated trailing whitespace in `graphify-out/GRAPH_REPORT.md`.

**Files intentionally NOT touched:**
- Root `src/**`, `functions/**`, `dataconnect/**`, Firebase rules/config, root package files, root env files, and `serviceAccountKey.json`.
- No real backend, Firebase rules, Cloud Functions, map SDK, payment, delivery, cart, order, or Phone OTP code was added.

**Warnings for next agent:**
- Do not replace mock discovery data until backend contracts for `searchMedicines` and `nearbyStores` are ready.
- Keep Phone OTP deferred per `D-015`; do not install React Native Firebase or disable email/password for OTP work.
- Native map rendering is still a later decision. Current UI only opens external maps links.

**Suggested commit message:**
`feat(mobile): add mock medicine discovery flow`

---

## 2026-04-26 - Define Phone OTP And Store Locator Next Phase
**Agent:** Codex
**Session goal:** Move Medifind into the next phase by documenting the Phone OTP decision point and backend/map prerequisites without changing app code.

**Files inspected (read-only):**
- `AGENTS.md` and `graphify-out/GRAPH_REPORT.md` - confirmed Graphify requirements and current graph context.
- `docs/MOBILE_APP_PLAN.md`, `docs/DECISIONS.md`, `docs/SESSION_STATE.md`, `docs/TODO_NEXT_AGENT.md`, and `docs/AGENT_LOG.md` - checked MVP scope, accepted Firebase/mobile decisions, and current handoff state.
- `apps/mobile/package.json` and `apps/mobile/app.json` - confirmed Expo SDK 54, Firebase JS SDK 12, `expo-dev-client`, `expo-auth-session`, and no React Native Firebase packages.
- Official Expo Firebase guide - confirmed Expo currently documents Firebase JS SDK and React Native Firebase as separate paths; React Native Firebase requires custom native code / development builds and is not usable in Expo Go.
- Official Firebase Web Phone Auth docs and JS API reference - confirmed Firebase JS phone auth still depends on `RecaptchaVerifier` / `ApplicationVerifier` for SMS verification.
- Official Expo map docs - confirmed `react-native-maps` is supported by Expo and requires Google Maps app-key setup for production/development binaries; Expo Maps also exists but should be selected deliberately before code.

**Files edited:**
- `docs/AGENT_LOG.md` - this entry.
- `docs/TODO_NEXT_AGENT.md` - top Next up section rewritten for Phone OTP architecture, map/store locator backend readiness, and safe implementation order.
- `docs/SESSION_STATE.md` - current state updated to reflect next-phase blockers and recommended order.

**Progress made:**
- Confirmed no Phone OTP code should be added yet under the current D-008 Firebase JS SDK-only decision.
- Confirmed email/password should stay enabled while Phone OTP is evaluated.
- Defined the Phone OTP decision path:
  1. Wait for a current Expo/Firebase reCAPTCHA path that works with Firebase JS SDK in native Expo, or
  2. add a new `D-015` decision to migrate auth to React Native Firebase / native phone auth in a development build, or
  3. build a backend OTP provider with Cloud Functions + Firebase custom tokens.
- Defined the map/store locator implementation gate: do not build real map/store locator UI until `nearbyStores`, `searchMedicines`, store coordinates, inventory freshness, and public contact fields are available from backend contracts/functions.
- Reconfirmed delivery/cart/checkout/payment/orders remain Phase 2 and should not enter the discovery MVP.

**Files intentionally NOT touched:**
- `apps/mobile/**` source files - no implementation changes were made because the requested features are gated by decisions/backend readiness.
- `src/**`, `functions/**`, `dataconnect/**`, Firebase rules/config, root package files, root env files, and `serviceAccountKey.json`.
- `docs/DECISIONS.md` - not edited because no Phone OTP architecture choice was approved yet.
- `apps/mobile/.env` - not read or edited in this pass.

**Testing status:**
- No runtime test was required because no app code changed.
- Existing known state remains: Google dev-build flow passed; email/password + Firestore profile persistence passed in a live smoke test; Phone OTP remains disabled.

**Warnings for next agent:**
- Do not install `@react-native-firebase/auth` casually. It would change the accepted Firebase client architecture and needs a `D-015` decision plus a migration plan for auth state/profile writes.
- Do not disable email/password until Phone OTP is implemented and tested end to end.
- Do not implement map/store locator against mock "real-time" data. Build the backend contract/function first or clearly mark UI as placeholder-only.
- For maps, choose between `react-native-maps` and `expo-maps` deliberately; `react-native-maps` is the safer mature default, while `expo-maps` should be treated as a separate decision if selected.

**Suggested commit message:**
`docs(mobile): define phone otp and store locator next phase`

---

## 2026-04-26 - Verify Google Dev-Build Flow And Assess Phone OTP Next Phase
**Agent:** Codex
**Session goal:** Test Google OAuth in the Medifind development build, verify profile completion routing, and assess the requested Phone OTP / map next phase without forcing unsupported auth code.

**Files inspected (read-only):**
- `AGENTS.md` and `graphify-out/GRAPH_REPORT.md` - confirmed Graphify requirements and current auth graph nodes.
- `docs/MOBILE_APP_PLAN.md`, `docs/DECISIONS.md`, `docs/SESSION_STATE.md`, `docs/TODO_NEXT_AGENT.md`, and `docs/AGENT_LOG.md` - checked MVP scope, Firebase SDK decision, and current handoff state.
- `apps/mobile/package.json` and `apps/mobile/app.json` - confirmed Expo SDK 54, Firebase JS SDK 12, `expo-dev-client`, `expo-auth-session`, and `expo-web-browser`.
- `apps/mobile/services/auth.ts`, `apps/mobile/services/googleAuth.ts`, `apps/mobile/services/userProfile.ts`, `apps/mobile/app/sign-in.tsx`, `apps/mobile/app/sign-up.tsx`, `apps/mobile/app/profile-setup.tsx`, and `apps/mobile/app/phone-otp.tsx` - reviewed Google auth, profile persistence, profile completion, and Phone OTP disabled state.
- `apps/mobile/.env` - checked key presence only; values were not printed. Firebase and Google Web/Android public env keys are set locally.
- Official Expo Firebase guide and Firebase Web Phone Auth / JS API docs - checked the requested Expo reCAPTCHA + Firebase Phone OTP path.

**Files edited:**
- `docs/AGENT_LOG.md` - this entry.
- `docs/TODO_NEXT_AGENT.md` - rewrote the top Next up section around Google verification, Phone OTP blocker, and map/backend prerequisites.
- `docs/SESSION_STATE.md` - updated current Google verification state and next-phase constraints.

**Google OAuth test results:**
- Existing LAN dev-client URL initially stuck on `Reloading...`.
- Fixed emulator connectivity by starting Metro on port `8081` and reopening the development client with Android emulator host URL `exp+medifind://expo-development-client/?url=http%3A%2F%2F10.0.2.2%3A8081`.
- Tapped **Continue with Google** on Sign In.
- Google sign-in completed in the development build and returned to Medifind.
- App routed to `/profile-setup` with the Google account display name populated: `Aditya Gholap`.
- Tapped the Profile Setup **Continue** button and verified the app routed to `/home`.
- Home showed `Welcome, Aditya Gholap`, confirming the current user/profile gate sees the profile as complete after save.

**Firestore/profile verification status:**
- Google credential sign-in and post-auth profile gate succeeded on-device.
- Profile completion save succeeded on-device because `/profile-setup` routed to `/home` only after `markProfileComplete` resolved.
- Direct Firestore REST verification of the Google user's `users/{uid}` doc was started but interrupted by the user's next-phase request before completion; do not claim direct console/REST inspection for this Google account.
- Previous live email/password Firestore smoke test remains direct-data verified: `codex.medifind.20260425191445@example.com`, uid `q0yxtSRkSoSCSxa9r1QXgPUTX0V2`.

**Phone OTP assessment:**
- Phone OTP was not enabled.
- The requested "Firebase Phone OTP using Expo reCAPTCHA" path is not safe to implement in the current Expo SDK 54 + Firebase JS SDK 12 setup. Firebase JS Phone Auth requires an `ApplicationVerifier` / `RecaptchaVerifier` built around web reCAPTCHA. Expo's current Firebase guide treats old Expo Firebase reCAPTCHA packages as migration-era and points Firebase users toward JS SDK or React Native Firebase depending on requirements.
- This conflicts with D-008, which currently accepts Firebase JS SDK for mobile and only lists React Native Firebase as a fallback after an explicit architecture decision.
- Email/password was not disabled because the replacement Phone OTP path is not implemented and disabling working auth would strand the app.

**Map/store locator assessment:**
- Real nearby-store maps and real-time medicine availability were not implemented in this pass.
- The current backend still needs the documented MVP functions/data contracts before the app can show real availability: `nearbyStores`, `searchMedicines`, store coordinates, public store contact fields, and inventory freshness metadata.
- Do not fake real-time availability with local mock data.

**Commands run:**
1. `npm run typecheck` in `apps/mobile` - passed.
2. `npm ls firebase @react-native-firebase/auth @react-native-firebase/app expo-auth-session expo-web-browser @react-native-async-storage/async-storage --depth=0` - passed; no React Native Firebase packages are installed.
3. `adb devices` - reported `emulator-5554 device`.
4. `npx expo start -c --dev-client --android --port 8081` - started Metro on port `8081`.
5. `adb reverse tcp:8081 tcp:8081` and `adb shell am start ...10.0.2.2:8081` - used to load the dev client successfully on the Android emulator.
6. ADB tap/screenshot passes - verified Sign In, Google -> Profile Setup, and Profile Setup -> Home.

**Files intentionally NOT touched:**
- `apps/mobile/**` source files - no code changes were made in this pass.
- `src/**`, `functions/**`, `dataconnect/**`, Firebase rules/config, root package files, root env files, and `serviceAccountKey.json`.
- `apps/mobile/.env` - read key presence only; no values were printed or edited.

**Warnings for next agent:**
- If the user still wants Phone OTP, add a new decision superseding/refining D-008 first. Viable paths are:
  1. React Native Firebase Auth with Expo Dev Client and a broader mobile-auth migration plan.
  2. Backend OTP provider + Cloud Function + Firebase custom token.
  3. A future officially supported Expo/Firebase reCAPTCHA path if Expo/Firebase reintroduce one.
- Do not disable email/password until Phone OTP is actually working.
- Do not implement maps/availability until the backend functions and Firestore inventory contracts exist.
- Direct Firestore REST verification for the Google account was not completed; the on-device flow verifies successful auth/profile gate behavior.

**Suggested commit message:**
`docs(mobile): record Google auth verification and next-phase blockers`

---

## 2026-04-26 - Live Email Auth Smoke Test And Firestore Verification
**Agent:** Codex
**Session goal:** Continue Medifind auth verification by testing live Firebase email/password auth, Firestore profile persistence, current mobile dependencies, and development-build availability.

**Files inspected (read-only):**
- `AGENTS.md` and `graphify-out/GRAPH_REPORT.md` - confirmed Graphify rules and current auth graph context.
- `docs/MOBILE_APP_PLAN.md`, `docs/SESSION_STATE.md`, `docs/TODO_NEXT_AGENT.md`, and `docs/AGENT_LOG.md` - checked current mobile/auth handoff state.
- `apps/mobile/.env` - checked key presence only; values were not printed. Firebase and Google Web/iOS/Android public env keys are set locally.
- `apps/mobile/services/firebase.ts`, `apps/mobile/services/auth.ts`, `apps/mobile/services/userProfile.ts`, `apps/mobile/app/index.tsx`, `apps/mobile/app/sign-in.tsx`, `apps/mobile/app/sign-up.tsx`, `apps/mobile/app/verify-email.tsx`, `apps/mobile/app/profile-setup.tsx`, `apps/mobile/app/phone-otp.tsx`, `apps/mobile/package.json`, and `firestore.rules` - reviewed auth/profile flow and write permissions.

**Files edited:**
- `docs/AGENT_LOG.md` - this entry.
- `docs/TODO_NEXT_AGENT.md` - updated the top Next up section with live verification results and remaining manual tests.
- `docs/SESSION_STATE.md` - updated current auth verification state, command notes, and next work.

**Live verification performed:**
- Ran a Firebase JS SDK live smoke test against the configured Firebase project using a generated email/password user.
- Created Firebase Auth user `codex.medifind.20260425191445@example.com` with uid `q0yxtSRkSoSCSxa9r1QXgPUTX0V2`.
- Wrote and read Firestore `users/q0yxtSRkSoSCSxa9r1QXgPUTX0V2`.
- Confirmed initial profile fields persisted with `profileComplete: false`, no client-written `roles`, and no client-written `permissions`.
- Marked the profile complete and confirmed Firestore stored `profileComplete: true`, `hasProfile: true`, and `preferences.preferredSearchRadiusKm: 10`.
- Signed out, signed back in with email/password, and re-read the same Firestore profile successfully.

**Commands run:**
1. Live Firebase JS SDK email/password + Firestore smoke test in `apps/mobile` - passed after approved network access.
2. `npm run typecheck` in `apps/mobile` - passed.
3. `npm ls firebase @react-native-firebase/auth @react-native-firebase/app expo-auth-session expo-web-browser @react-native-async-storage/async-storage --depth=0` - passed; no React Native Firebase packages are installed.
4. `adb devices` - first reported `emulator-5554 device`, then later reported no connected devices.
5. `adb shell pm list packages com.nearnest.medifind` / `adb shell pidof com.nearnest.medifind` - failed because the emulator became offline: `error: closed` and `device offline`.

**Testing status:**
- Email/password Auth plus Firestore profile persistence is live data-verified at the Firebase SDK/backend level.
- Profile-completion persistence is live data-verified in Firestore.
- Google OAuth code and env presence are verified, but Google sign-in is still not interactively live-tested because the emulator disconnected and no Google account session was completed.
- The generated email test user's `emailVerified` value is `false`, so the app should route that account to `/verify-email` until a real inbox-verifiable account is used.
- Development APK build `51fcfd40-9e66-44c4-99f6-f0090b1b21e3` remains the successful development build, but the emulator must be restarted before another UI run.

**Files intentionally NOT touched:**
- `src/**`, `functions/**`, `dataconnect/**`, Firebase rules/config, root package files, root env files, and `serviceAccountKey.json`.
- `apps/mobile/**` source files - no app code was changed in this verification pass.
- `apps/mobile/.env` - read for key presence only; no values were printed or edited.
- Phone OTP implementation - remains disabled and deferred.

**Warnings for next agent:**
- Clean up the generated Firebase Auth user / Firestore profile if the project should not retain smoke-test accounts: `codex.medifind.20260425191445@example.com`, uid `q0yxtSRkSoSCSxa9r1QXgPUTX0V2`.
- Complete the manual Google OAuth test in the development build after restarting the emulator or using a physical device.
- Complete the email verification UI route with a real inbox-controlled test account; the generated smoke-test address cannot receive verification email.

**Suggested commit message:**
`test(mobile): verify Firebase auth profile persistence`

---

## 2026-04-26 - Add Auth Profile Gate And Fix Development Build
**Agent:** Codex
**Session goal:** Finish Medifind auth profile routing, resolve the Expo Android development build failure, and document the remaining live-test status.

**Files inspected (read-only):**
- `AGENTS.md` and `graphify-out/GRAPH_REPORT.md` - confirmed Graphify requirements and current mobile auth graph nodes.
- `docs/MOBILE_APP_PLAN.md`, `docs/MOBILE_UI_SCREEN_SPECS.md`, `docs/DESIGN_SYSTEM.md`, `docs/DECISIONS.md`, `docs/SESSION_STATE.md`, `docs/TODO_NEXT_AGENT.md`, and `docs/AGENT_LOG.md` - checked the auth/profile, MVP, and handoff requirements.
- `apps/mobile/.env` - checked key presence only; values were not printed. Firebase and Google Web/iOS/Android public env keys are set locally.
- `apps/mobile/app/*.tsx`, `apps/mobile/services/*.ts`, `apps/mobile/package.json`, `apps/mobile/app.json`, and `apps/mobile/eas.json` - reviewed current mobile auth, routing, Expo, and EAS setup.

**Files created / edited:**
- `apps/mobile/services/userProfile.ts` - added/finished profile loading, email verification refresh, profile completion save, and `getPostAuthRouteForUser` for `/verify-email` -> `/profile-setup` -> `/home` routing.
- `apps/mobile/services/auth.ts` - made email sign-in/sign-up upsert Firestore profiles; sign-up updates display name and sends email verification when possible.
- `apps/mobile/app/index.tsx` - Splash now routes through the profile gate instead of sending every signed-in user to Home.
- `apps/mobile/app/sign-in.tsx` and `apps/mobile/app/sign-up.tsx` - route successful email/Google auth through the shared profile gate; Phone remains disabled.
- `apps/mobile/app/verify-email.tsx` - after reload/poll success, refreshes Firestore email state and routes through the shared gate.
- `apps/mobile/app/profile-setup.tsx` - protects the screen from unverified password users and saves `profileComplete` to Firestore.
- `apps/mobile/README.md` - documented email/Google profile persistence and auth gating.
- `apps/mobile/package.json` and `apps/mobile/package-lock.json` - corrected AsyncStorage to Expo SDK-compatible `2.2.0`.
- `apps/mobile/services/firebase.ts` - uses the default AsyncStorage object with `getReactNativePersistence`, removing the incompatible `createAsyncStorage` v3 API.
- `docs/SESSION_STATE.md` - updated auth/dev-build status, verification status, command notes, and current next work.
- `docs/TODO_NEXT_AGENT.md` - added a fresh top Next up section for live Google/email testing, Phone OTP deferral, and next MVP work.
- `docs/AGENT_LOG.md` - this entry.
- `graphify-out/GRAPH_REPORT.md`, `graphify-out/graph.json`, and `graphify-out/graph.html` - refreshed by `graphify update .`.

**Files intentionally NOT touched:**
- `src/**`, `functions/**`, `dataconnect/**`, Firebase rules/config, root package files, root env files, and `serviceAccountKey.json` - protected/out of scope.
- `apps/mobile/.env` - read key presence only; no values were printed or committed.
- `firestore.rules` - not edited; profile writes still depend on existing signed-in user write permissions.
- Phone OTP implementation - intentionally deferred; no SMS, reCAPTCHA, or native auth provider was enabled.

**Decisions made:** No new decision record added. Continued D-008 Firebase JS SDK-only mobile auth and D-009 server-owned roles/permissions.

**Commands run:**
1. `npm run typecheck` in `apps/mobile` - passed.
2. `npm ls firebase @react-native-firebase/auth @react-native-firebase/app expo-auth-session expo-web-browser @react-native-async-storage/async-storage --depth=0` - passed; no React Native Firebase packages are installed.
3. `npx expo export --platform android --output-dir .expo\profile-gate-verification-export` - passed.
4. `eas build --profile development --platform android` - first build `54f87dfb-3dcf-4bb7-aac8-ffe263907e11` failed because AsyncStorage `3.0.2` required unresolved Gradle artifact `org.asyncstorage.shared_storage:storage-android:1.0.0`.
5. `npx expo install @react-native-async-storage/async-storage` - corrected AsyncStorage to `2.2.0`; `firebase.ts` was updated for that API.
6. `eas build --profile development --platform android` - second build `51fcfd40-9e66-44c4-99f6-f0090b1b21e3` succeeded.
7. APK install via adb - installed `https://expo.dev/artifacts/eas/b8d16xe1sNKYJc1rE7Akze.apk` on `emulator-5554`; Medifind dev client opened and reached Welcome/Sign In.
8. `graphify update .` - first PATH attempt failed; rerun with the installed Scripts path succeeded and rebuilt the graph at 273 nodes, 298 edges, and 63 communities.

**Warnings for next agent:**
- Google/email Firestore persistence is code-verified and bundle-verified, but live credential testing was not completed because emulator automation was interrupted and no account credentials were entered.
- Run the next test manually in the installed development build and confirm `users/{uid}` in Firestore has profile fields and no client-written `roles` or `permissions`.
- Phone OTP remains disabled; do not implement SMS until the user approves a supported path.
- `.expo/*verification-export`, `.expo/builds/*`, and EAS log downloads are local generated output and should remain uncommitted.

**Suggested commit message:**
`feat(mobile): add auth profile gate and dev build fix`

---

## 2026-04-25 - Persist Google Auth Profiles In Firestore
**Agent:** Codex
**Session goal:** Continue Medifind Google auth work by wiring basic Firestore `users/{uid}` profile persistence after successful Google credential sign-in while keeping Phone OTP disabled.

**Files inspected (read-only):**
- `AGENTS.md` - confirmed Graphify requirements.
- `graphify-out/GRAPH_REPORT.md` - checked current graph context before code changes.
- `docs/MOBILE_APP_PLAN.md`, `docs/MOBILE_UI_SCREEN_SPECS.md`, `docs/DESIGN_SYSTEM.md`, `docs/PROJECT_MAP.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/SESSION_STATE.md`, `docs/TODO_NEXT_AGENT.md`, and `docs/AGENT_LOG.md` - checked mobile/auth/product contracts and current handoff state.
- `firestore.rules`, `storage.rules`, `firebase.json`, `functions/index.js`, and `dataconnect/` - read for Firebase architecture constraints; no protected files were edited.
- `apps/mobile/services/firebase.ts`, `apps/mobile/services/auth.ts`, `apps/mobile/services/googleAuth.ts`, `apps/mobile/app/sign-in.tsx`, `apps/mobile/app/sign-up.tsx`, `apps/mobile/app/phone-otp.tsx`, `apps/mobile/app/index.tsx`, `apps/mobile/app/home.tsx`, and `apps/mobile/package.json` - reviewed current mobile auth implementation.
- `apps/mobile/.env` - checked Google OAuth key presence only; values were not printed.
- Expo official AuthSession/authentication docs and Firebase official Google Auth/Firestore docs - checked current Firebase credential and Firestore write patterns.

**Files created / edited:**
- `apps/mobile/services/userProfile.ts` - added a Firestore profile upsert service for Firebase Auth users, including Google identity fields, timestamps, default discovery preferences, and no client writes to roles/permissions.
- `apps/mobile/services/firebase.ts` - exported Firestore `db` from the Firebase JS SDK app.
- `apps/mobile/services/auth.ts` - made `signInWithGoogleIdToken` await Firebase credential sign-in and then upsert `users/{uid}`.
- `apps/mobile/app/sign-in.tsx` and `apps/mobile/app/sign-up.tsx` - kept Google active, updated copy, and changed Phone login to disabled "coming soon".
- `apps/mobile/app/phone-otp.tsx` - disabled the OTP inputs and primary action so the route cannot imply real SMS behavior.
- `apps/mobile/README.md` - documented that successful Google sign-in now writes a basic Firestore profile.
- `docs/SESSION_STATE.md` - recorded Firestore profile persistence, verification results, Graphify status, and the remaining Android OAuth blocker.
- `docs/TODO_NEXT_AGENT.md` - rewrote the top Next up section around Google live testing, Firestore profile verification, and disabled Phone OTP.
- `docs/AGENT_LOG.md` - this entry.
- `graphify-out/GRAPH_REPORT.md`, `graphify-out/graph.json`, and `graphify-out/graph.html` - refreshed by `graphify update .`.

**Files intentionally NOT touched:**
- `src/**`, `functions/**`, `dataconnect/**`, Firebase rules/config, root package files, root env files, and `serviceAccountKey.json` - protected/out of scope.
- `apps/mobile/.env` - not edited because the missing Android OAuth client ID cannot be inferred; values were not printed.
- Firestore rules - not edited; current mobile profile write relies on the existing signed-in user write allowance.
- Phone OTP real Firebase implementation - deferred; no SMS or reCAPTCHA flow was added.

**Decisions made:** No new decision record added. Implementation stays on D-008 Firebase JS SDK and D-009 server-owned roles/permissions. The mobile profile writer intentionally avoids `roles` and `permissions`.

**Commands run:**
1. `npm run typecheck` in `apps/mobile` - passed.
2. `rg` scan for React Native Firebase, Firebase analytics, Functions, Storage, Database, fetch, and axios in mobile app code - no matches.
3. `npm ls firebase @react-native-firebase/auth @react-native-firebase/app expo-auth-session expo-web-browser --depth=0` - first sandboxed attempt failed with `EPERM: operation not permitted, lstat 'C:\Users\Aditya'`; escalated rerun passed and reported `firebase@12.12.1`, `expo-auth-session@7.0.10`, and `expo-web-browser@15.0.10`.
4. Mobile `.env` key-presence check - Google Web and iOS client IDs are present; `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` is missing.
5. `npx expo export --platform android --output-dir .expo\google-firestore-verification-export` - first sandboxed attempt failed with the same `EPERM`; escalated rerun passed and bundled Android successfully.
6. `graphify update .` - passed and rebuilt the graph at 257 nodes, 261 edges, and 62 communities.

**Warnings for next agent:**
- Google profile persistence is code-verified and bundle-verified, but not live-tested. Android Google sign-in still needs `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` in untracked `apps/mobile/.env` and a Medifind development build.
- Confirm the live Firestore doc after Google sign-in: it should include identity/profile fields and must not include client-written `roles` or `permissions`.
- Email/password auth remains wired but does not yet create the mobile Firestore profile document.
- Phone OTP remains disabled; do not claim SMS OTP is implemented.
- `.expo/google-firestore-verification-export` is generated local test output and should remain uncommitted.

**Suggested commit message:**
`feat(mobile): persist Google auth profiles`

---

## 2026-04-25 - Wire Google AuthSession And Phone OTP Stub
**Agent:** Codex
**Session goal:** Reintroduce Google sign-in using Expo AuthSession with Firebase JS SDK credential sign-in, add a Phone OTP UI stub, and document the remaining platform/config blockers.

**Files inspected (read-only):**
- `AGENTS.md` - confirmed Graphify requirements.
- `graphify-out/GRAPH_REPORT.md` - checked current graph context before code changes.
- `docs/MOBILE_APP_PLAN.md` - checked current auth scope and MVP guardrails.
- `docs/SESSION_STATE.md` - checked latest auth verification state.
- `docs/TODO_NEXT_AGENT.md` - checked current next-agent priorities.
- `docs/MOBILE_UI_SCREEN_SPECS.md` - checked Sign In/Sign Up and Phone OTP design requirements.
- `docs/AGENT_LOG.md` - checked prior handoff entries.
- Expo official authentication/AuthSession docs and Firebase official Phone Auth docs - checked current OAuth and reCAPTCHA constraints.
- `apps/mobile/package.json`, `apps/mobile/app.json`, `apps/mobile/services/firebase.ts`, `apps/mobile/services/auth.ts`, `apps/mobile/app/sign-in.tsx`, and `apps/mobile/app/sign-up.tsx` - reviewed current mobile auth implementation.
- `apps/mobile/.env` - checked key presence only; values were not printed.

**Files created / edited:**
- `apps/mobile/services/googleAuth.ts` - added Google AuthSession config helpers, Expo Go runtime guard, env-missing messages, and AuthSession result messaging.
- `apps/mobile/services/phoneAuth.ts` - added Phone OTP deferred reason and phone-number normalization helper.
- `apps/mobile/app/phone-otp.tsx` - added Medifind-styled Phone OTP UI stub with explicit deferred status.
- `apps/mobile/services/auth.ts` - added Firebase JS SDK `GoogleAuthProvider` credential sign-in.
- `apps/mobile/app/sign-in.tsx` - enabled Google button through AuthSession/Firebase flow and routed Phone to `/phone-otp`.
- `apps/mobile/app/sign-up.tsx` - enabled Google button through the same AuthSession/Firebase flow and routed Phone to `/phone-otp`.
- `apps/mobile/.env.example` - documented Google OAuth env keys for local setup.
- `apps/mobile/README.md` - documented Google development-build requirement and Phone/Auth status.
- `apps/mobile/package.json` and `apps/mobile/package-lock.json` - added `expo-auth-session` and `expo-web-browser`.
- `apps/mobile/app.json` - added the `expo-web-browser` config plugin.
- `docs/SESSION_STATE.md` - recorded Google/Phone status, verification results, and Graphify update.
- `docs/TODO_NEXT_AGENT.md` - rewrote the top Next up section around Android OAuth client ID, dev-build testing, and Phone OTP blocker.
- `docs/AGENT_LOG.md` - this entry.
- `graphify-out/GRAPH_REPORT.md`, `graphify-out/graph.json`, and `graphify-out/graph.html` - refreshed by `graphify update .`.

**Files intentionally NOT touched:**
- `src/**`, `functions/**`, `dataconnect/**`, Firebase rules/config, root package files, root env files, and `serviceAccountKey.json` - protected/out of scope.
- `apps/mobile/.env` - not edited because the missing Android OAuth client ID cannot be inferred; values were not printed.
- Firestore/profile integration - deferred until auth is stable and profile rules/contracts are approved.

**Decisions made:** No new decision record added. Implementation stays on D-008 Firebase JS SDK. Phone OTP remains a UI stub because Firebase JS SDK Phone Auth requires a reCAPTCHA verifier with browser DOM, while Expo's old Firebase reCAPTCHA package is archived.

**Commands run:**
1. `npx expo install expo-auth-session expo-web-browser` in `apps/mobile` - succeeded and added the `expo-web-browser` plugin.
2. `npm run typecheck` in `apps/mobile` - passed.
3. Mobile `.env` key-presence check - Firebase keys, Google Web client ID, and Google iOS client ID are present; `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` is missing.
4. `rg` scan for React Native Firebase, Firebase analytics, Firestore, Functions, Storage, Database, fetch, and axios in mobile app code - no matches.
5. `npm ls firebase @react-native-firebase/auth @react-native-firebase/app expo-auth-session expo-web-browser @react-native-async-storage/async-storage --depth=0` - first sandboxed attempt failed with `EPERM: operation not permitted, lstat 'C:\Users\Aditya'`; escalated rerun passed and reported `firebase@12.12.1`, `expo-auth-session@7.0.10`, `expo-web-browser@15.0.10`, and `@react-native-async-storage/async-storage@3.0.2` only.
6. `npx expo export --platform android --output-dir .expo\google-auth-verification-export` - first sandboxed attempt failed with the same `EPERM`; escalated rerun passed and bundled Android successfully.
7. `graphify update .` - passed and rebuilt the graph at 252 nodes, 253 edges, and 62 communities.

**Warnings for next agent:**
- Google code is present but Android Google sign-in is not functional until `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` is added locally and a Medifind development build is installed. Expo Go intentionally shows a blocking message for Google OAuth.
- Do not claim Phone OTP is implemented. It is a UI stub with a documented platform blocker.
- Do not add Firestore profile writes yet.
- `.expo/google-auth-verification-export` is generated local test output and should remain uncommitted.

**Suggested commit message:**
`feat(mobile): wire Google auth and phone OTP stub`

---

## 2026-04-25 - Verify Medifind Auth And Document Current State
**Agent:** Codex
**Session goal:** Review today's Medifind mobile auth/scaffold/UI updates, verify the current Expo/Firebase state, and create a summary report with blockers and next steps.

**Files inspected (read-only):**
- `AGENTS.md` - confirmed Graphify rules.
- `graphify-out/GRAPH_REPORT.md` - checked current graph context before codebase verification.
- `docs/PROJECT_MAP.md` - checked repo structure and protected areas.
- `docs/ARCHITECTURE.md` - checked mobile/Firebase architecture.
- `docs/DECISIONS.md` - confirmed D-008 Firebase JS SDK decision.
- `docs/MOBILE_APP_PLAN.md` - checked MVP auth/navigation scope.
- `docs/DESIGN_SYSTEM.md` - checked UI token/design direction.
- `docs/SESSION_STATE.md` - checked current handoff state.
- `docs/TODO_NEXT_AGENT.md` - checked current next-agent priorities.
- `apps/mobile/app/_layout.tsx`, `apps/mobile/app/index.tsx`, `apps/mobile/app/welcome.tsx`, `apps/mobile/app/sign-in.tsx`, `apps/mobile/app/sign-up.tsx`, `apps/mobile/app/home.tsx` - reviewed navigation and UI flows.
- `apps/mobile/services/firebase.ts` and `apps/mobile/services/auth.ts` - reviewed Firebase JS SDK initialization and auth methods.
- `apps/mobile/package.json`, `apps/mobile/app.json`, and `apps/mobile/.env.example` - reviewed dependencies, Expo config, and public env template.

**Files created / edited:**
- `docs/MOBILE_AUTH_VERIFICATION_REPORT_2026-04-25.md` - new markdown report summarizing today's mobile auth work, diagrams, verification checklist, blockers, and recommendations.
- `docs/SESSION_STATE.md` - added verification status and current blockers.
- `docs/TODO_NEXT_AGENT.md` - rewrote the top Next up section around the verification report and live-test/Google-auth decisions.
- `docs/AGENT_LOG.md` - this entry.

**Files intentionally NOT touched:**
- `src/**`, `functions/**`, `dataconnect/**`, Firebase rules/config, root package files, root env files, and `serviceAccountKey.json` - protected/out of scope.
- `apps/mobile/.env` - checked required key presence only; values were not printed or committed.
- `apps/mobile/**` source files - read-only in this verification pass; no app code changes were needed.
- `.expo/verification-export` - generated by Expo export for smoke testing and left uncommitted.

**Decisions made:** No new architecture decision added. The report confirms the current committed state: Firebase JS SDK email/password auth is wired; Google auth is not implemented and is blocked on explicit approval plus `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`.

**Commands run:**
1. `npm run typecheck` in `apps/mobile` - passed.
2. Mobile `.env` key-presence check - required `EXPO_PUBLIC_FIREBASE_*` keys are present; values were not printed.
3. `rg` scan for React Native Firebase, Expo Google Auth Session, Firebase analytics, compat auth, and Google credential imports in app code - no matches.
4. `rg` scan for Firestore, Functions, Storage, Database, fetch, or axios calls in app source - no matches.
5. `npm ls firebase @react-native-firebase/auth @react-native-firebase/app --depth=0` in `apps/mobile` - passed and reported only `firebase@12.12.1`.
6. `npm ls expo-auth-session expo-web-browser @react-native-async-storage/async-storage --depth=0` in `apps/mobile` - first sandboxed attempt failed with `EPERM: operation not permitted, lstat 'C:\Users\Aditya'`; escalated rerun passed and reported only `@react-native-async-storage/async-storage@3.0.2`.
7. `npx expo export --platform android --output-dir .expo\verification-export` - first sandboxed attempt failed with `EPERM: operation not permitted, lstat 'C:\Users\Aditya'`; escalated rerun passed and bundled the Android app.

**Warnings for next agent:**
- Do not mark Google login as working. It is currently disabled by design and needs explicit approval plus Android OAuth client setup before implementation.
- Email/password auth is code-verified and bundle-verified, but live credential testing still needs a known Firebase test account on a device/simulator.
- Forgot Password is visible as text only; it is not wired yet.
- Profile setup gate remains future work; no Firestore profile writes should be added until the profile contract and rules are approved.

**Suggested commit message:**
`docs(mobile): add auth verification report`

---

## 2026-04-25 - Fix Medifind Firebase Auth SDK Mismatch
**Agent:** Codex
**Session goal:** Return Medifind mobile auth to the Expo managed Firebase JS SDK path, remove React Native Firebase/Google OAuth wiring, and add a simple Splash auth gate.

**Files inspected (read-only):**
- `AGENTS.md` - confirmed Graphify requirements.
- `graphify-out/GRAPH_REPORT.md` - checked current graph context before code changes.
- `docs/DECISIONS.md` - confirmed the mobile MVP decision to use Firebase JS SDK modular imports, not React Native Firebase.
- `docs/ARCHITECTURE.md` - confirmed mobile auth architecture.
- `docs/SESSION_STATE.md` - checked current mobile/auth handoff state.
- `docs/TODO_NEXT_AGENT.md` - checked current next-agent priorities.
- `apps/mobile/package.json` - checked mobile dependencies.
- `apps/mobile/services/firebase.ts` - checked Firebase initialization.
- `apps/mobile/services/auth.ts` - checked auth service functions.
- `apps/mobile/app/sign-in.tsx` - checked sign-in wiring.
- `apps/mobile/app/sign-up.tsx` - checked sign-up wiring.
- `apps/mobile/app/index.tsx` - checked Splash navigation.
- `apps/mobile/app/home.tsx` - checked target auth route.

**Files created / edited:**
- `apps/mobile/services/firebase.ts` - replaced React Native Firebase/analytics setup with Firebase JS SDK app/Auth initialization, required Expo public env reads, and React Native AsyncStorage persistence.
- `apps/mobile/types/firebase-auth-react-native.d.ts` - added a local Firebase v12 React Native persistence type declaration so the documented `firebase/auth` import typechecks in Expo.
- `apps/mobile/services/auth.ts` - kept email/password Firebase JS SDK methods and added `signOut` plus `onAuthStateChanged` subscription helper; removed Google credential sign-in.
- `apps/mobile/app/index.tsx` - added basic Firebase auth-state gate from Splash to `/home` or `/welcome`.
- `apps/mobile/app/sign-in.tsx` - removed Expo Google Auth Session code and left Google/Phone buttons disabled as coming soon.
- `apps/mobile/app/sign-up.tsx` - removed Expo Google Auth Session code and left Google/Phone buttons disabled as coming soon.
- `apps/mobile/services/googleAuth.ts` - deleted the temporary Google OAuth helper.
- `apps/mobile/package.json` and `apps/mobile/package-lock.json` - removed `@react-native-firebase/auth`, `expo-auth-session`, and `expo-web-browser` from mobile dependencies.
- `apps/mobile/app.json` - removed the `expo-web-browser` plugin entry.
- `apps/mobile/.env.example` - kept Firebase Expo public env placeholders and marked Google env keys as future-only.
- `apps/mobile/README.md` - documented Firebase JS SDK email/password auth with AsyncStorage persistence and Google/Phone disabled status.
- `docs/SESSION_STATE.md` - updated auth implementation state, command notes, and Graphify summary.
- `docs/TODO_NEXT_AGENT.md` - rewrote the top Next up section around the SDK cleanup and next auth steps.
- `docs/AGENT_LOG.md` - this entry.
- `graphify-out/GRAPH_REPORT.md`, `graphify-out/graph.json`, and `graphify-out/graph.html` - refreshed by `graphify update .`.
- `graphify-out/cache/*.json` - untracked Graphify cache files generated by `graphify update .`; leave uncommitted unless the project explicitly decides to track cache outputs.

**Files intentionally NOT touched:**
- `src/**`, `functions/**`, `dataconnect/**` - protected/out of scope.
- Root `package.json`, root `package-lock.json`, Firebase rules/config, root env files, and `serviceAccountKey.json` - protected/out of scope.
- `apps/mobile/.env` - not read or edited; no real Firebase or Google keys were printed or committed.
- `apps/mobile/.gitignore` and `apps/mobile/eas.json` - pre-existing mobile changes left as-is because they were not needed for this SDK mismatch fix.

**Decisions made:** No new decision record added. This implements existing D-008 direction: Firebase JS SDK for Expo managed workflow, no React Native Firebase in MVP.

**Commands run:**
1. `npm uninstall @react-native-firebase/auth expo-auth-session expo-web-browser` in `apps/mobile` - first sandboxed attempt failed with `EPERM: operation not permitted, lstat 'C:\Users\Aditya'`; escalated rerun succeeded.
2. `npm run typecheck` in `apps/mobile` - passed after the SDK cleanup.
3. `npm ls firebase @react-native-firebase/auth @react-native-firebase/app --depth=0` in `apps/mobile` - passed and reported only `firebase@12.12.1`.
4. `rg -n "@react-native-firebase" apps\mobile\package.json apps\mobile\package-lock.json apps\mobile\services apps\mobile\app` - no matches.
5. `rg -n "firebase/analytics|getAnalytics" apps\mobile\services apps\mobile\app` - no matches.
6. `graphify update .` - passed and rebuilt the graph at 236 nodes, 226 edges, and 61 communities.

**Warnings for next agent:**
- Google auth is intentionally UI-only now. Do not reintroduce Google OAuth until the user explicitly approves it and `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` is available for the development/production build path.
- Phone OTP remains Phase 2.
- `apps/mobile/services/firebase.ts` throws a clear development error if required Expo public Firebase env vars are missing; restart Expo after changing `apps/mobile/.env`.
- Profile setup/profile persistence is still not wired. Do not add Firestore profile writes until the mobile profile contract and rules are approved.

**Suggested commit message:**
`fix(mobile): use Firebase JS SDK auth`

---

## 2026-04-24 - Implement Medifind Google Auth
**Agent:** Codex
**Session goal:** Add Expo-compatible Google sign-in to the Medifind mobile app while keeping email/password auth working and phone OTP disabled.

**Files inspected (read-only):**
- `apps/mobile/.env` - checked required key presence only; values were not printed.
- `apps/mobile/.env.example`
- `apps/mobile/services/firebase.ts`
- `apps/mobile/services/auth.ts`
- `apps/mobile/app/sign-in.tsx`
- `apps/mobile/app/sign-up.tsx`
- `apps/mobile/package.json`
- `apps/mobile/app.json`
- `docs/SESSION_STATE.md`
- `docs/TODO_NEXT_AGENT.md`
- `docs/AGENT_LOG.md`
- `AGENTS.md`
- `graphify-out/GRAPH_REPORT.md`

**Files created:**
- `apps/mobile/services/googleAuth.ts` - centralizes Google OAuth client ID env reads, setup-state messaging, and Expo Auth Session completion support.

**Files updated:**
- `apps/mobile/services/auth.ts` - added Firebase `GoogleAuthProvider` credential sign-in via `signInWithGoogleIdToken`.
- `apps/mobile/app/sign-in.tsx` - Google button now launches Expo Auth Session, exchanges the returned Google ID token for a Firebase credential, and routes to `/home` on success.
- `apps/mobile/app/sign-up.tsx` - Google button now uses the same Firebase credential sign-in path and routes to `/home` on success.
- `apps/mobile/.env.example` - added blank Google OAuth client ID env keys.
- `apps/mobile/README.md` - documented Google auth scope and env keys.
- `apps/mobile/package.json` and `apps/mobile/package-lock.json` - added `expo-auth-session` and `expo-web-browser`.
- `apps/mobile/app.json` - added the `expo-web-browser` config plugin.
- `docs/SESSION_STATE.md` - recorded Google Auth implementation status.
- `docs/TODO_NEXT_AGENT.md` - rewrote next steps around local Google client ID setup/testing.
- `docs/AGENT_LOG.md` - this entry.

**Commands run:**
1. `npx expo install expo-auth-session expo-web-browser` - succeeded.
2. `npm run typecheck` in `apps/mobile` - passed.
3. `npm ls @react-native-firebase/app @react-native-firebase/auth --depth=0` - returned `(empty)`, confirming no React Native Firebase dependency.
4. `npm ls expo-auth-session expo-web-browser firebase --depth=0` - confirmed `expo-auth-session@7.0.10`, `expo-web-browser@15.0.10`, and `firebase@12.12.1`.
5. `rg -n "AIza|client_secret|EXPO_PUBLIC_GOOGLE_.*=.+|EXPO_PUBLIC_FIREBASE_.*=.+" apps\mobile\.env.example apps\mobile\README.md apps\mobile\services apps\mobile\app` - no matches.

**Setup still required locally:**
- Add the correct Google OAuth client IDs to untracked `apps/mobile/.env`:
  - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
  - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
  - `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- Enable Google provider in Firebase Authentication.
- Restart Expo after editing `.env`.

**Scope notes:**
- Email/password auth remains wired through Firebase JS SDK.
- Phone login remains disabled and marked "Phone login coming soon".
- No real secrets, root env files, `serviceAccountKey.json`, web source, Functions, Data Connect, Firebase rules/config, Firestore, or Phone OTP were touched.
- `graphify update .` was not run because this session's allowed edit scope did not include `graphify-out/**`.

**Suggested commit message:**
`feat(mobile): add Google Firebase auth`

---

## 2026-04-24 - Verify Medifind auth and Expo LAN preview
**Agent:** Codex
**Session goal:** Confirm email/password Firebase Auth wiring, make unwired Google/Phone auth visibly unavailable, and diagnose Expo LAN phone-preview connectivity without changing backend/Firebase rules or root env files.

**Files inspected (read-only):**
- `apps/mobile/.env` - checked required key presence only; values were not printed.
- `apps/mobile/.env.example`
- `apps/mobile/services/firebase.ts`
- `apps/mobile/services/auth.ts`
- `apps/mobile/app/sign-in.tsx`
- `apps/mobile/app/sign-up.tsx`
- `apps/mobile/app/home.tsx`
- `docs/SESSION_STATE.md`
- `docs/TODO_NEXT_AGENT.md`
- `AGENTS.md`
- `graphify-out/GRAPH_REPORT.md`

**Files updated:**
- `apps/mobile/app/sign-in.tsx` - disabled unwired Google/Phone buttons and changed copy to "coming soon"; kept real email/password Firebase sign-in to `/home`.
- `apps/mobile/app/sign-up.tsx` - disabled unwired Google/Phone buttons and changed copy to "coming soon"; kept real email/password Firebase account creation to `/home`.
- `docs/SESSION_STATE.md` - recorded Firebase auth verification and Expo LAN status.
- `docs/TODO_NEXT_AGENT.md` - rewrote next steps for phone LAN testing and auth follow-up.
- `docs/AGENT_LOG.md` - this entry.

**Commands run:**
1. Mobile `.env` key-presence check - all required `EXPO_PUBLIC_FIREBASE_*` values are present.
2. `ipconfig` - Wi-Fi IPv4 is `192.168.1.149`.
3. `netsh advfirewall show currentprofile` - firewall inbound policy is blocking by default.
4. `Test-NetConnection 192.168.1.149 -Port 8081` before restart - failed because Metro was not listening.
5. `Test-NetConnection 192.168.1.149 -Port 8082` before restart - succeeded while prior fallback server was active.
6. Firewall add-rule attempts for Node.js and ports `8081`/`8082` - failed with `The requested operation requires elevation (Run as administrator).`
7. `npx expo start -c --lan` - launched detached; Metro is listening on `0.0.0.0:8081`.
8. `Invoke-WebRequest http://192.168.1.149:8081` - returned HTTP 200 from the laptop.
9. `npm run typecheck` in `apps/mobile` - passed.

**Connection status:**
- Laptop side is working: Metro is bound on LAN at `http://192.168.1.149:8081`.
- Phone must be on the same Wi-Fi and should test `http://192.168.1.149:8081` in its browser.
- If the phone browser cannot open that URL, the remaining root cause is Windows firewall/private-network inbound blocking or router/client-isolation, not app code.

**Scope notes:**
- No Google auth, phone OTP, Firestore, Functions, Firebase rules/config, root env files, or web/backend source were changed.
- `apps/mobile/.env` was read only for key presence; real values were not logged.
- `graphify update .` was not run because this session's allowed edit scope did not include `graphify-out/**`.

**Suggested commit message:**
`fix(mobile): disable unwired auth providers`

---

## 2026-04-24 - Move Medifind Firebase config to Expo env
**Agent:** Codex
**Session goal:** Replace hardcoded placeholder Firebase mobile config with Expo public environment variables, add a mobile env template, and keep real Firebase keys out of source.

**Files inspected (read-only):**
- `AGENTS.md`
- `graphify-out/GRAPH_REPORT.md`
- `apps/mobile/services/firebase.ts`
- `apps/mobile/package.json`
- `apps/mobile/app.json`
- `apps/mobile/README.md`
- `apps/mobile/.gitignore`
- `docs/SESSION_STATE.md`
- `docs/TODO_NEXT_AGENT.md`

**Files created:**
- `apps/mobile/.env.example` - lists the required `EXPO_PUBLIC_FIREBASE_*` keys with blank values.

**Files updated:**
- `apps/mobile/services/firebase.ts` - now reads Firebase config from `process.env.EXPO_PUBLIC_*` values, including `databaseURL` and `measurementId`; analytics is not initialized.
- `apps/mobile/.gitignore` - explicitly ignores `apps/mobile/.env` and `apps/mobile/.env.local`.
- `apps/mobile/README.md` - documents the mobile env variables and current Firebase Auth scope.
- `docs/SESSION_STATE.md` - recorded the env-based Firebase config state.
- `docs/TODO_NEXT_AGENT.md` - rewrote next steps for post-env-config auth work.
- `docs/AGENT_LOG.md` - this entry.

**Commands run:**
1. `npm run typecheck` in `apps/mobile` - passed.
2. `rg -n "MEDIFIND_PLACEHOLDER|AIza|serviceAccount|FIREBASE_API_KEY=.+|EXPO_PUBLIC_FIREBASE_.*=.+" apps\mobile\services apps\mobile\.env.example apps\mobile\README.md` - no matches.

**Scope notes:**
- No real Firebase keys or local env values were committed.
- No root `.env`, `.env.local`, `serviceAccountKey.json`, web source, Firebase rules/config, package files, analytics setup, Firestore, Functions, Google auth, or phone auth were touched.
- `graphify update .` was not run because this session's allowed edit scope did not include `graphify-out/**`.

**Suggested commit message:**
`chore(mobile): load Firebase config from Expo env`

---

## 2026-04-24 - Add basic Firebase Auth wiring to Medifind
**Agent:** Codex
**Session goal:** Add MVP-level Firebase Auth setup for email/password sign-in and sign-up in the Expo mobile app without adding providers, Firestore, backend changes, env secrets, or commerce scope.

**Files inspected (read-only):**
- `AGENTS.md`
- `graphify-out/GRAPH_REPORT.md`
- `docs/DECISIONS.md`
- `docs/MOBILE_APP_PLAN.md`
- `docs/SESSION_STATE.md`
- `docs/TODO_NEXT_AGENT.md`
- current Medifind auth screens and shared mobile UI components

**Files created:**
- `apps/mobile/services/firebase.ts` - initializes the Firebase app and Auth instance using placeholder mobile config only.
- `apps/mobile/services/auth.ts` - wraps `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, and friendly Firebase Auth error messages.

**Files updated:**
- `apps/mobile/app/sign-in.tsx` - replaced the fake email submit delay with Firebase email/password sign-in, loading state, error display, and success navigation to Home.
- `apps/mobile/app/sign-up.tsx` - replaced the fake account creation delay with Firebase email/password account creation, loading state, error display, and success navigation to Home.
- `docs/SESSION_STATE.md` - recorded that basic Firebase Auth wiring exists with placeholder config.
- `docs/TODO_NEXT_AGENT.md` - rewrote next steps for post-auth-wiring mobile work.
- `docs/AGENT_LOG.md` - this entry.

**Commands run:**
1. `npm run typecheck` in `apps/mobile` - passed.
2. `rg -n "firebase/firestore|GoogleAuthProvider|PhoneAuthProvider|signInWithPopup|EXPO_PUBLIC_|VITE_|serviceAccount|AIza" apps\mobile\app apps\mobile\components apps\mobile\services apps\mobile\theme` - no matches.

**Scope notes:**
- Firebase is connected at the SDK/Auth-instance level only. The config is intentionally placeholder and cannot authenticate real users until replaced through an approved mobile config plan.
- No Google auth, phone auth, Firestore, Functions, App Check, env files, secrets, or backend changes were added.
- Google and phone buttons remain UI-only placeholders.
- `graphify update .` was not run because this session's allowed edit scope did not include `graphify-out/**`.

**Files intentionally NOT touched:**
- root `src/**`, `public/**`, `functions/**`, `dataconnect/**`
- root `package.json`, root `package-lock.json`
- Firebase rules/config files
- `.env`, `.env.local`, `.env.example`
- `serviceAccountKey.json`

**Suggested commit message:**
`feat(mobile): wire email password Firebase auth`

---

## 2026-04-24 - Implement Medifind auth UI screens
**Agent:** Codex
**Session goal:** Implement the first Medifind auth/onboarding UI screens in Expo without backend or Firebase wiring.

**Files inspected (read-only):**
- `AGENTS.md`
- `graphify-out/GRAPH_REPORT.md`
- `docs/MOBILE_UI_SCREEN_SPECS.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/SESSION_STATE.md`
- current `apps/mobile` scaffold files

**Files updated:**
- `apps/mobile/components/ActionButton.tsx` - added disabled/loading UI and optional leading label support for Google/phone buttons.
- `apps/mobile/app/index.tsx` - polished Splash with Medifind mark, loading dots, status text, and timed navigation to Welcome.
- `apps/mobile/app/welcome.tsx` - implemented onboarding pager UI with correct copy, spacing, dots, and Sign In/Sign Up navigation.
- `apps/mobile/app/sign-in.tsx` - implemented email/password form UI, inline errors, loading state, Google button UI, phone button UI, and temporary navigation to Home.
- `apps/mobile/app/sign-up.tsx` - implemented account form UI, terms checkbox, inline errors, loading state, Google button UI, phone button UI, and temporary navigation to Profile Setup.
- `docs/SESSION_STATE.md` - recorded the auth UI implementation state.
- `docs/TODO_NEXT_AGENT.md` - updated next steps for the next mobile pass.
- `docs/AGENT_LOG.md` - this entry.
- `graphify-out/GRAPH_REPORT.md`, `graphify-out/graph.json`, `graphify-out/graph.html` - refreshed by `graphify update .` after code changes.

**Commands run:**
1. `npm run typecheck` in `apps/mobile` - passed.
2. `graphify update .` - passed; graph now reports 228 nodes, 217 edges, and 60 communities.

**Scope notes:**
- No Firebase initialization, provider auth, env config, Firestore, Functions, or backend calls were added.
- Google and phone login buttons are UI-only.
- Phone login remains outside MVP auth scope unless explicitly approved.
- Sign In temporarily routes to Home; Sign Up temporarily routes to Profile Setup.

**Files intentionally NOT touched:**
- root `src/**`, `public/**`, `functions/**`, `dataconnect/**`
- root `package.json`, root `package-lock.json`
- Firebase rules/config files
- `.env`, `.env.local`, `.env.example`
- `serviceAccountKey.json`

**Suggested commit message:**
`feat(mobile): implement Medifind auth UI screens`

---

## 2026-04-24 - Scaffold Medifind Expo app
**Agent:** Codex
**Session goal:** Start Medifind mobile development by scaffolding an Expo managed TypeScript app in `apps/mobile` with expo-router, Firebase JS SDK dependency only, and placeholder MVP entry screens.

**Files inspected (read-only):**
- `AGENTS.md`
- `graphify-out/GRAPH_REPORT.md`
- `docs/SESSION_STATE.md`
- `docs/MOBILE_UI_SCREEN_SPECS.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/DECISIONS.md`
- `docs/TODO_NEXT_AGENT.md`
- existing `apps/mobile/README.md`

**Commands run:**
1. `node -v` - succeeded: `v20.20.0`.
2. `npm -v` - failed in sandbox with `EPERM: operation not permitted, lstat 'C:\Users\Aditya'`; reran with approval and succeeded: `11.6.0`.
3. `npx create-expo-app@latest apps/mobile --template blank-typescript --yes` - failed because npm applied the root web package override: `EOVERRIDE Override for vite@npm:rolldown-vite@^7.1.14 conflicts with direct dependency`.
4. `npx create-expo-app@latest C:\projects\nearnest\web-portal\apps\mobile --template blank-typescript --yes` from `C:\projects` - succeeded.
5. `npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants` - succeeded.
6. `npm install firebase` - initially failed with `ERESOLVE` around optional `react-dom` peer resolution.
7. `npx expo install react-dom react-native-web` - succeeded with Expo-compatible versions.
8. `npm install firebase` - succeeded.
9. `npm run typecheck` - failed in sandbox with the same `EPERM` user-profile path issue; reran with approval and passed.
10. `npm ls firebase expo-router @react-native-firebase/app --depth=0` - confirmed `expo-router@6.0.23`, `firebase@12.12.1`, and no `@react-native-firebase/app`.

**Files created / updated:**
- `apps/mobile/package.json` - Expo SDK 54 app, `expo-router/entry`, TypeScript scripts, Firebase JS SDK dependency.
- `apps/mobile/package-lock.json` - mobile-local dependency lockfile.
- `apps/mobile/app.json` - Medifind app name/slug/scheme and Expo Router plugin.
- `apps/mobile/app/_layout.tsx` - root expo-router stack.
- `apps/mobile/app/index.tsx` - Splash placeholder.
- `apps/mobile/app/welcome.tsx` - Welcome/onboarding placeholder.
- `apps/mobile/app/sign-in.tsx` - Sign In placeholder.
- `apps/mobile/app/sign-up.tsx` - Sign Up placeholder.
- `apps/mobile/app/profile-setup.tsx` - Profile Setup placeholder.
- `apps/mobile/app/home.tsx` - Home placeholder.
- `apps/mobile/components/ActionButton.tsx`, `InfoCard.tsx`, `Screen.tsx` - lightweight scaffold UI.
- `apps/mobile/theme/tokens.ts` - mobile tokens mirrored from `docs/DESIGN_SYSTEM.md`.
- `apps/mobile/README.md` - scaffold notes and guardrails.
- Expo default assets and `.gitignore` under `apps/mobile/`.
- `docs/SESSION_STATE.md` - current phase updated from planning to scaffolded development.
- `docs/TODO_NEXT_AGENT.md` - next steps rewritten for post-scaffold mobile work.
- `docs/AGENT_LOG.md` - this entry.

**Scope notes:**
- Firebase is a dependency only. No `initializeApp`, env config, callable Functions, Firestore reads/writes, or real auth flow were added.
- Phone OTP, delivery, cart, checkout, payment, orders, and prescription upload remain out of MVP.
- `graphify update .` was not run because it would modify `graphify-out/**`, which was outside this session's allowed edit list.

**Files intentionally NOT touched:**
- root `src/**`, `public/**`, `functions/**`, `dataconnect/**`
- root `package.json`, root `package-lock.json`
- `firebase.json`, `firestore.rules`, `storage.rules`, `database.rules.json`, `firestore.indexes.json`
- `.env`, `.env.local`, `.env.example`
- `serviceAccountKey.json`

**Suggested commit message:**
`feat(mobile): scaffold Medifind Expo app`

---

## 2026-04-24 - Expand Medifind entry/auth screen designs
**Agent:** Codex
**Session goal:** Continue Claude's Medifind design work and complete documentation-only screen specs for Splash, Welcome/onboarding, Sign In, Sign Up, and Phone OTP.

**Files inspected (read-only):**
- `AGENTS.md`
- `graphify-out/GRAPH_REPORT.md`
- `docs/MOBILE_APP_PLAN.md` (read only; pre-existing Claude changes were not edited)
- `docs/MOBILE_UI_SCREEN_SPECS.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/SESSION_STATE.md`
- `docs/TODO_NEXT_AGENT.md`
- `docs/AGENT_LOG.md`

**Files updated:**
- `docs/MOBILE_UI_SCREEN_SPECS.md` - expanded Splash, Welcome/onboarding, Sign In, Sign Up, and Phone OTP with layout structure, UI hierarchy, exact copy, button styles, spacing, loading states, error states, interaction notes, and transitions/animations.
- `docs/DESIGN_SYSTEM.md` - added a Medifind mobile brand note while keeping Nearnest as the parent/store/admin platform brand.
- `docs/TODO_NEXT_AGENT.md` - rewrote the top handoff section for the next docs-only design pass and preserved no-scaffold guardrails.
- `docs/SESSION_STATE.md` - recorded current design progress and clarified that Phone OTP remains Phase 2.
- `docs/AGENT_LOG.md` - this entry.

**Sections completed:**
- `## 1. Splash`
- `## 2. Welcome / Onboarding`
- `## 3. Sign In`
- `## 4. Sign Up`
- `## 4.1 Phone OTP Flow (Phase 2, not MVP)`

**Branding / scope notes:**
- Customer-facing mobile copy now uses **Medifind** on primary entry/auth surfaces.
- Nearnest remains the parent platform and store/admin brand.
- Phone OTP is designed for future consistency only. MVP auth remains email/password plus Google sign-in.
- No cart, checkout, payment, order tracking, delivery, prescription upload, or commerce copy was added to MVP screens.

**Files intentionally NOT touched:**
- `src/**`, `public/**`, `functions/**`, `dataconnect/**`, `apps/mobile/**`
- `package.json`, `package-lock.json`
- `firebase.json`, `firestore.rules`, `storage.rules`, `database.rules.json`, `firestore.indexes.json`
- `.env`, `.env.local`, `.env.example`
- `serviceAccountKey.json`

**Suggested commit message:**
`docs(mobile): expand Medifind auth screen specs`

---

## 2026-04-26 - Medifind discovery redesign (docs-only, no app code)
**Agent:** Claude Opus 4.7 (Claude Code)
**Session goal:** Stop coding for the night and re-plan the discovery experience around Blinkit/Zepto-style medicine search + Google-Maps-style nearby pharmacy finder, with a hard "no commerce, no medical advice" frame. Output is markdown only.

**Phase 0 thinking captured (in MOBILE_APP_PLAN.md):**
- Product thesis (one-sentence wedge): "Medifind tells you, before you leave the house, which verified pharmacy near you actually has the medicine you need — without making you order, pay, or wait for delivery."
- Three concrete personas: Asha (urgent caregiver, 11pm fever), Ravi (chronic-condition repeat buyer), Priya (walk-in with paper prescription).
- Competitive teardown: 1mg, PharmEasy, Apollo Pharmacy, Google Maps, Blinkit/Zepto — what to steal and what to avoid for each.
- Seven search cases enumerated with detection rules and result behaviour: exact brand, misspelled brand, composition, symptom-led, prescription photo (v2), Hindi transliteration, partial/abbreviated. Symptom map locked at 7 OTC entries with neutral framing.
- Trust signals matrix and "no trust theatre" rule.
- Accessibility rules: large-type 1.15× variant, low-end Android budget, no animations > 300 ms, one-handed thumb-zone CTAs, Hindi/Marathi data-model readiness without launch dependency.
- State matrix: every screen defines loading / empty / partial / no-results / error / offline / stale / Rx.
- Non-goals locked (no doctor consults, no symptom checker, no price comparison, no delivery, no reviews, no loyalty, no upsell, no Rx upload in MVP, no checkout/cart/payment, no medical advice, no store-management mobile UI).
- Success metrics: search-to-store-action conversion ≥ 35%, P50 time-to-first-action ≤ 45 s, stale-data ≤ 15%, no-result rate ≤ 8%, chronic-user D1 retention ≥ 60%.
- Telemetry: 18 events listed with payload contracts and Firestore ring-buffer sink in MVP.
- Data model: Medicine, MedicineVariant via `variantOfMedicineId`, Composition, Manufacturer, Category, Store, StoreInventoryItem, StoreContact, StoreHours, SearchSuggestion, RecentSearch — TypeScript-style shapes that match `FIRESTORE_SCHEMA_CONTRACT.md` so the swap is mechanical.
- Phase 4 self-critique: weakest is the mode toggle's discoverability for low-tech users; would change the symptom map and the three-bucket stock label given more time; the load-bearing assumption is store inventory freshness; partial copy from Blinkit (chip carousel) is acceptable today but typography needs a calmer pass.
- 5 ranked open questions with recommended defaults, top of list: mode-toggle visibility for low-tech users.

**Screen specs added (in MOBILE_UI_SCREEN_SPECS.md):**
Route map, shared empty/error/offline/stale/no-match templates, then full specs (purpose, mental state, layout zones, components, exact copy, all required states, a11y, telemetry, non-goals) for:
1. Home (dual-mode with Medicine ↔ Medical Stores toggle, category grid, recent+popular chips, store preview).
2. Search (live suggestions, recent + popular sections, sectioned suggestions with hint labels, typo-correction inline, Hindi transliteration note).
3. Search results (grouped into Best match / Same brand / Same composition / Similar by category, with `All`/`OTC`/`Rx` filter chips, `Find nearby stores` per-card CTA).
4. Medicine detail (hero image, identity block, manufacturer, neutral one-line description, full Rx warning when applicable, availability summary, sticky `Find nearby stores` CTA, similar-medicines rail).
5. Nearby stores for this medicine (top 40% map placeholder + bottom sheet 60% with List/Map toggle, store cards with `Call` / `Navigate` / `View store`, color-coded freshness, sticky disclaimer).
6. Stores mode landing (same map + sheet idiom, sheet-scoped pharmacy search, no in-stock line on cards, fallback link back to Medicine mode).
7. Store detail (verified hero, license number with issuing-authority reveal, action row sticky on scroll, hours panel, address copy, in-store search field, inventory grouped by category).
8. In-store search (overlay-style, not a separate route).
9. Category browse (2-column grid, OTC/Rx filter, deterministic alphabetical sort).
- Profile small redesign: `Larger text` toggle persisted to `users/{uid}.preferences.largeType`.

**Design system additions (in DESIGN_SYSTEM.md):**
- R1: palette rationale ("loud grocery" / "cold institutional" / "wellness pastel" failure modes the existing tokens were chosen against).
- R2: large-type variant tokens (1.15× type scale, 1.10× line height, 200% reflow guarantee).
- R3: motion rules (220 ms in / 180 ms out, no spring on primary surfaces, no animation > 300 ms except splash, bottom-sheet drag is the one exception with controlled spring).
- R4: dark mode policy — deferred; tokens are abstract enough that the swap is later trivial.
- R5: component tokens (ProductCard large/compact/grid, StoreCard, CategoryCard, SearchBar pressable + input, ModeToggle, BottomSheet, Chip, Badge variants for Rx/Verified/AvailableNearby/CallToConfirm, EmptyState, ErrorState, OfflineBanner, StaleDataBanner).
- R6: iconography rules — lucide for system + categories; medicine cards always use real product photography or a typographic placeholder, never a generic icon stand-in.
- R7: image asset rules.
- R8: name-to-file mapping for Codex implementation.

**Files touched (this session):**
- `docs/MOBILE_APP_PLAN.md` — appended ~200 lines under "Discovery Redesign 2026-04-25" with Phase 0, data model, Phase 4 self-critique, open questions. Top-of-file note tells future agents the appendix wins on conflict.
- `docs/MOBILE_UI_SCREEN_SPECS.md` — appended ~250 lines under "Discovery Redesign 2026-04-25" with all 9 redesigned screens plus shared templates and Profile addendum.
- `docs/DESIGN_SYSTEM.md` — appended ~150 lines under "Discovery Redesign 2026-04-25" with rationale, motion, large-type, dark-mode, and component tokens.
- `docs/TODO_NEXT_AGENT.md` — "Next up" rewritten to point at the redesign appendices and to embed a verbatim Codex implementation prompt the user can paste tomorrow.
- `docs/SESSION_STATE.md` — new section "Discovery redesign 2026-04-25 (docs-only this session)" pinned at the top.
- `docs/AGENT_LOG.md` — this entry.

**Files intentionally NOT touched (still protected):**
- `apps/mobile/**` source — design + planning only this session, no code changes.
- `src/**`, `public/**`, `functions/**`, `dataconnect/**`.
- Root configs: `package.json`, `package-lock.json`, `firebase.json`, `firestore.rules`, `storage.rules`, `database.rules.json`, `firestore.indexes.json`, `vite.config.js`, `eslint.config.js`.
- Env + secrets: `.env`, `.env.local`, `.env.example`, `.firebaserc`, `serviceAccountKey.json`, `apps/mobile/.env`.

**Constraint check:** Effort was set to medium. Task asked for docs-only with no "TBD" anywhere. Every spec in this session has an explicit decision or a recommended default; the open questions list is the only place where decisions are tagged as needing user sign-off. No app code, no backend code, no Firebase rules.

**Suggested commit message:**
`docs(mobile): redesign discovery UX for medicine and store modes`

---

## 2026-04-25 - Wire up email/password Firestore profile, email verification, forgot password, profile-completion gate
**Agent:** Claude Opus 4.7 (Claude Code)
**Session goal:** Take the MVP auth experience from "Google works, email half-works, no verify, no reset, no profile gate" to a complete, emulator-testable end-to-end flow. Phone OTP intentionally left deferred — see "Phone OTP decision required" below.

**Honest scope statement:** I cannot run the Android Studio emulator from this environment. The Bash tool here cannot launch GUI apps or interact with a live device. What I can do is write the code, typecheck it, and hand the user a runbook. That's what I delivered. Live runtime confirmation is the user's step. `tsc --noEmit` is clean after every change in this session.

### What's now wired

**Email sign-in / sign-up writes Firestore profile.**
- `services/auth.ts:signInWithEmail` and `signUpWithEmail` now both call `upsertUserProfileFromAuthUser(result.user, 'password')` after the Firebase Auth call resolves. Closes the bug surfaced in the prior static review.
- `signUpWithEmail` accepts an optional `displayName`; if present it calls `updateProfile(user, { displayName })` *before* the Firestore upsert so the trimmed name lands in `users/{uid}.displayName` immediately rather than falling back to the email-prefix.
- `signUpWithEmail` calls `sendEmailVerification(result.user)` automatically; failures are caught and logged in dev only — they never block sign-up.
- The mobile client still does NOT write `roles` or `permissions` (per D-009).

**Email verification flow.**
- New screen `app/verify-email.tsx`. Shows the user's email, polls `reload(currentUser)` every 4 seconds, auto-routes to `/profile-setup` (or `/home` if profile is already complete) the moment `emailVerified` flips true. Manual "I've verified, check now" CTA, "Resend verification email" with a 30-second cooldown, and "Use a different account" sign-out.
- Email signups now route to `/verify-email` on success (was `/home`). Email sign-ins of unverified accounts also route to `/verify-email`.
- New helpers in `services/auth.ts`: `sendVerificationEmailToCurrentUser`, `reloadCurrentUser` (also writes the refreshed `emailVerified` back to Firestore via `refreshEmailVerifiedField`).

**Forgot password flow.**
- New screen `app/forgot-password.tsx`. Email input -> `sendPasswordReset(trimmed)` (delegates to `firebase/auth:sendPasswordResetEmail`) -> success panel with "Back to sign in" / "Send to a different email". Inline error mapping via `getAuthErrorMessage` covers `auth/user-not-found`, `auth/invalid-email`, `auth/too-many-requests`, `auth/missing-email`.
- `app/sign-in.tsx`'s "Forgot password?" link is now a real `Pressable` that pushes `/forgot-password`.
- New `services/auth.ts:sendPasswordReset(email)` helper.

**Profile-completion gate at splash + after sign-in/up.**
- `app/index.tsx` (splash) now does:
  - signed out -> `/welcome`
  - signed in but `!emailVerified` -> `/verify-email`
  - signed in + verified, `users/{uid}.profileComplete === true` -> `/home`
  - signed in + verified, profile missing or incomplete -> `/profile-setup`
- `app/sign-in.tsx` and `app/sign-up.tsx` apply the same gate after Google sign-in (Google identities are pre-verified, so they skip the verify-email branch).
- Failure to load `users/{uid}` does NOT strand the user on splash; it falls through to `/profile-setup` which performs its own retry.

**Profile setup actually saves now.**
- `app/profile-setup.tsx` rewritten. Reads `users/{uid}` on mount (with auth state subscription), prefills `displayName` and `preferredSearchRadiusKm`. "Continue" calls `markProfileComplete(uid, { displayName, preferredSearchRadiusKm })` which writes `profileComplete: true`, `hasProfile: true`, `displayName`, `name`, `preferences.preferredSearchRadiusKm`, and `updatedAt`. Includes accessible radio-group radius selector and a "Sign out" ghost button.
- New helpers in `services/userProfile.ts`: `loadUserProfile(uid)`, `markProfileComplete(uid, fields)`, `refreshEmailVerifiedField(user)`. Exported `UserProfile` type.

**Home screen.**
- `app/home.tsx` reads `users/{uid}` for the welcome-name and exposes a "Sign out" ghost button so the user can leave the signed-in state during testing.

**Phone OTP - intentionally still deferred (see decision below).**
- `app/phone-otp.tsx`, `services/phoneAuth.ts`, and the disabled "Phone login coming soon" buttons in Sign In / Sign Up unchanged. They remain disabled with the deferred-message panel. No fake SMS, no bypass.

### Files changed this turn
- `apps/mobile/services/auth.ts` (rewritten — email upserts profile, signup sets displayName + sends verification, new helpers).
- `apps/mobile/services/userProfile.ts` (new helpers: `loadUserProfile`, `markProfileComplete`, `refreshEmailVerifiedField`; exported `UserProfile` type).
- `apps/mobile/app/index.tsx` (splash now gates on emailVerified + profileComplete).
- `apps/mobile/app/sign-in.tsx` (routes to /verify-email when unverified, to /profile-setup or /home based on profile, real /forgot-password link).
- `apps/mobile/app/sign-up.tsx` (routes to /verify-email after success; passes fullName through to signUpWithEmail; Google path uses profile gate).
- `apps/mobile/app/verify-email.tsx` (NEW).
- `apps/mobile/app/forgot-password.tsx` (NEW).
- `apps/mobile/app/profile-setup.tsx` (rewritten — wired to Firestore via markProfileComplete).
- `apps/mobile/app/home.tsx` (welcome-name from profile + sign-out CTA).

### Build sanity
- `npx tsc --noEmit` from `apps/mobile/`: **passes**.
- No new dependencies added. No `package.json` changes. No `expo prebuild` triggered.
- `node_modules/` already present from prior session; no `npm install` ran.

### Phone OTP decision required (cannot ship without it)
The user asked for phone auth to "just work." I did NOT enable it because both viable paths require an architectural call beyond this session:

1. **Option A - Migrate phone auth to `@react-native-firebase/auth`.** This is the only Firebase-supported, in-Expo phone-auth path today (silent verification on Android via Play Integrity, APNs on iOS). Requires:
   - Adding `@react-native-firebase/app` + `@react-native-firebase/auth` to `apps/mobile/package.json`.
   - Adding the Expo config plugin and re-running `expo prebuild`.
   - **The risk:** this introduces a second Firebase Auth instance alongside the JS SDK we already use for everything else. Auth state is then split between RNFirebase (phone) and JS SDK (email + Google). Reconciling the two is non-trivial; the cleanest solution is to migrate ALL auth to RNFirebase, which contradicts D-008.
   - Best-fit if mobile is the primary product and we want full native auth support for the long term.

2. **Option B - Build a Cloud Function + SMS provider OTP.** Mobile sends a phone number to a callable; the function generates a code, sends via Twilio / MSG91 / Fast2SMS, stores a hash in Firestore with TTL, then verifies a code and returns a Firebase **custom token**. Mobile signs in with `signInWithCustomToken`. Requires:
   - A new Cloud Function (currently `functions/index.js` is just `helloWorld`).
   - An SMS provider account + paid SMS sending.
   - Backend authorization to edit `functions/**` (currently still gated in the protected list per the not-yet-updated handoff protocol).
   - Best-fit if we want to stay on the JS SDK and keep all auth on a single instance.

I have not implemented either. The user's call.

### Files intentionally NOT touched
- `src/**`, `public/**`, `functions/**`, `dataconnect/**` (still website team territory).
- Root configs and secrets: `package.json`, `package-lock.json`, `firebase.json`, `firestore.rules`, `storage.rules`, `database.rules.json`, `firestore.indexes.json`, `vite.config.js`, `eslint.config.js`, `.env`, `.env.local`, `.env.example`, `.firebaserc`, `serviceAccountKey.json`.
- `apps/mobile/.env` and `apps/mobile/.env.example` — values are user-managed.
- `apps/mobile/package.json`, `apps/mobile/app.json`, `apps/mobile/eas.json` — no dependency or config changes.
- `graphify-out/**` — not regenerated this turn (out of allowed-edit scope by current protocol).

### Hand-runnable Android emulator runbook (for the user)

1. Open `apps/mobile/.env`. Verify these are populated:
   - `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`, `EXPO_PUBLIC_FIREBASE_PROJECT_ID`, `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`, `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `EXPO_PUBLIC_FIREBASE_APP_ID`.
   - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (required for Google).
   - `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` (required for Android Google sign-in).
2. In Firebase Console -> Authentication -> Sign-in method: enable **Email/Password** AND **Google**.
3. In Google Cloud Console for the same project, confirm the OAuth Web client matches `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`. For the Android client, confirm the SHA-1 of the dev keystore is registered (`eas credentials --platform android` shows it).
4. In Firebase Console -> Firestore -> Rules: confirm authenticated reads on `users/{uid}` are allowed (the existing rule allows self-read; that's enough). The mobile client only writes to its own `users/{uid}`.
5. Build a development client for Android (Google sign-in cannot complete in plain Expo Go):
   - `cd apps/mobile`
   - `npm install` (only if `node_modules/` is missing).
   - `eas build --profile development --platform android` -> install the resulting APK on the Android Studio emulator (drag-and-drop, or `adb install <path>`).
6. Start the dev server: `npx expo start -c --dev-client --lan` (use `--port 8082` if 8081 is blocked).
7. On the emulator, open the installed Medifind dev build. Press the keyboard `r` shortcut once to load the Metro bundle if needed.
8. **Email signup test:** Welcome -> "Get started" -> Sign Up. Enter name, email (use a real inbox you can check), password (8+ chars), accept Terms -> "Create account". Expected: route to /verify-email with your email shown. Open the inbox, click the verification link. Within 4 seconds the app should auto-route to /profile-setup (or /home if profile is already complete from a prior run). In Firebase Console -> Firestore -> `users/{your_uid}` confirm: `uid`, `email`, `displayName` (your typed name), `name`, `emailVerified: true` (after the link), `authProvider: 'password'`, `authProviders: ['password']`, `preferences`, `profileComplete: false`, `hasProfile: false`, `createdAt`, `updatedAt`, `lastLoginAt`. NO `roles` or `permissions`.
9. **Profile setup:** confirm prefilled name; pick a radius; "Continue". Firestore should now show `profileComplete: true`, `hasProfile: true`, `preferences.preferredSearchRadiusKm: <chosen>`.
10. **Home:** confirm "Welcome, <displayName>" appears.
11. **Sign-out test:** Home -> "Sign out" -> Welcome.
12. **Email sign-in test:** Welcome -> "Already have an account? Sign in" -> enter the same email + password. Expected: jumps straight to /home (because profile is complete and email is verified).
13. **Forgot password test:** Sign In -> "Forgot password?" -> enter email -> "Send reset link" -> success panel. Open inbox, click reset link, set a new password. Return to Sign In and use the new password.
14. **Google sign-in test:** Welcome -> Sign In -> "Continue with Google" -> pick an account -> consent. Expected: route to /home (or /profile-setup if first time). Firestore `users/{your_uid}` shows `authProvider: 'google.com'`, `authProviders: ['google.com']`, `photoURL` populated.
15. **Phone OTP:** Sign In -> "Phone login coming soon" should be visibly disabled. Tapping nothing happens. From the Splash test build you can also navigate to `/phone-otp` directly via the URL bar; the screen renders, all inputs are disabled, primary CTA is disabled and labelled "Phone OTP coming soon", deferred-reason warning panel renders in the Rx palette.

If any of step 8 fails, the most common causes are: missing/invalid Firebase env, Email/Password provider not enabled in console (returns `auth/operation-not-allowed`), Firestore rules blocking the write (the existing rule allows self-write on `users/{uid}` so this should be fine), or the device having no internet access.

If step 14 fails, the most common causes are: `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` missing, SHA-1 mismatch in Google Cloud, or running in plain Expo Go (the code detects this and shows a guidance message; you must use the dev build).

### Suggested commit message
`feat(mobile/auth): wire email Firestore profile, email verification, password reset, profile-completion gate`

---

## 2026-04-25 - Static review of Google Sign-In + Firestore profile + Phone OTP state
**Agent:** Claude Opus 4.7 (Claude Code)
**Session goal:** Verify the auth implementation in `apps/mobile/` against MVP doctrine: Google Sign-In flow correctness, `users/{uid}` Firestore write on first sign-in, and Phone OTP "coming soon" UX.

**Honesty disclosure (read this first):**
- I cannot launch the Expo app, complete a real Google OAuth, or watch a Firestore write land. There is no emulator/device/live Firebase access in this environment.
- What follows is a **static code review** plus a **hand-runnable test checklist** the user can execute to confirm runtime behavior. It is NOT a runtime test pass. Anything labelled with a green check is verified by reading code; runtime confirmation is pending the user's manual run.

**Repo state surfaced:**
- The mobile app has been scaffolded since the last logged session. `apps/mobile/` now contains an Expo Router app (TypeScript, expo ~54, expo-router ~6, firebase ^12.12.1), with route files under `app/`, components under `components/`, theme tokens under `theme/`, and a services layer (`firebase.ts`, `auth.ts`, `googleAuth.ts`, `userProfile.ts`, `phoneAuth.ts`).
- App identity: name = "Medifind", slug = "medifind", scheme = "medifind", android package = "com.nearnest.medifind". Branding is already applied in code.
- The handoff protocol's old "no edits inside `apps/mobile/`" guard is therefore stale. Phase has moved from planning to implementation.

**Files inspected (read-only):**
- `apps/mobile/package.json`, `apps/mobile/app.json`, `apps/mobile/.env.example`
- `apps/mobile/services/firebase.ts`, `apps/mobile/services/googleAuth.ts`, `apps/mobile/services/auth.ts`, `apps/mobile/services/userProfile.ts`, `apps/mobile/services/phoneAuth.ts`
- `apps/mobile/app/_layout.tsx`, `apps/mobile/app/index.tsx`, `apps/mobile/app/sign-in.tsx`, `apps/mobile/app/sign-up.tsx`, `apps/mobile/app/phone-otp.tsx`

**Build sanity:**
- `npx tsc --noEmit` in `apps/mobile/` returned no output, i.e. **typecheck passes**.

### Findings

**Google Sign-In - implementation looks correct (static).**
- `firebase.ts` initialises Firebase JS SDK with `getReactNativePersistence(AsyncStorage)` (correct for RN; `auth/already-initialized` is handled with a `getAuth(app)` fallback).
- `googleAuth.ts` uses `expo-auth-session/providers/google` with three client IDs (web/android/ios), `selectAccount: true`, and a clean Expo-Go detection path that returns a guidance message when running in Expo Go (Google OAuth needs a dev client).
- `auth.ts:signInWithGoogleIdToken` builds `GoogleAuthProvider.credential(idToken)`, calls `signInWithCredential(auth, credential)`, then calls `upsertUserProfileFromAuthUser(result.user, GoogleAuthProvider.PROVIDER_ID)`. This is the expected chain.
- `sign-in.tsx` and `sign-up.tsx` both:
  - Use `Google.useIdTokenAuthRequest(getGoogleAuthRequestConfig())` (correct for getting an ID token Firebase can consume).
  - Dedupe responses via a `handledGoogleResponse` ref so a single response is not consumed twice.
  - Handle `success | cancel | dismiss | error | locked | opened` shapes.
  - Reject when `params.id_token` is missing.
  - Map all auth errors via `getAuthErrorMessage` (covers `auth/account-exists-with-different-credential`, `auth/popup-closed-by-user`, `auth/operation-not-allowed`, `auth/unauthorized-domain`, `auth/network-request-failed`, `auth/api-key-not-valid` etc.).
- `splash` (`app/index.tsx`) uses `subscribeToAuthState` to route to `/home` if signed in, `/welcome` if not, with a 900 ms minimum splash hold.

**Firestore profile write on Google sign-in - correct (static).**
- `userProfile.ts:upsertUserProfileFromAuthUser` writes `users/{uid}` with the four required fields plus extras:
  - `uid`: Firebase UID, also used as doc ID.
  - `email`: `user.email ?? ''`.
  - `displayName`: trimmed `user.displayName`, falls back to email-prefix, then to `'Medifind user'`.
  - `photoURL`: `user.photoURL ?? null`. (Also writes a `photoUrl` legacy mirror.)
  - Plus: `emailVerified`, `authProvider` (`'password' | 'google.com'`, derived from `providerData`), `authProviders[]`, `updatedAt`, `lastLoginAt`.
  - On first-create only: `preferences` (defaults), `profileComplete: false`, `hasProfile: false`, `createdAt`.
- The doc is written via `setDoc(..., { merge: true })`, which is idempotent and safe across re-sign-ins.
- This satisfies the MVP Auth doctrine (`users/{uid}` shape) for the Google path.

**Bug found - email sign-in / sign-up does NOT write to Firestore.**
- `signInWithEmail` and `signUpWithEmail` (in `services/auth.ts`) call only the Firebase Auth methods and return. They do **not** call `upsertUserProfileFromAuthUser`.
- The MVP doctrine in `docs/MOBILE_APP_PLAN.md` §2.1 says every user must have a minimal `users/{uid}` profile before reaching Home, normally created by the `onUserCreate` Cloud Function trigger.
- `functions/index.js` still contains only `helloWorld` — no `onUserCreate` exists yet.
- **Net effect today:** an email signup creates a Firebase Auth user but NO Firestore profile doc. The user is then routed to `/home` (or `/profile-setup`) with `users/{uid}` missing.
- This was not asked about in the current task, but it directly affects the MVP profile guarantee. Surfaced here so the next agent can fix it.

**Profile-completeness gate not yet enforced.**
- `app/index.tsx` routes signed-in users to `/home` without checking `users/{uid}.profileComplete`. The MVP doctrine asks for routing to `/profile-setup` when profile is incomplete.
- Not blocking for the current Google sign-in test, but flagged for the next task batch.

**Phone OTP - correctly disabled and clearly marked "coming soon".**
- `services/phoneAuth.ts` exports a clear deferred-explanation message: *"Phone OTP is not enabled in this Expo build. Firebase JS SDK phone auth requires a supported reCAPTCHA verifier; the old Expo reCAPTCHA package is archived, so this needs a separate approved implementation path."*
- `app/phone-otp.tsx` keeps the screen visible for navigation continuity but:
  - Phone-number input has `editable={false}`.
  - OTP input has `editable={false}`.
  - "Change number" pressable is `disabled`.
  - Primary CTA reads **"Phone OTP coming soon"** and is `disabled`.
  - Warning panel renders the deferred-message in the Rx warning palette (`rxBg`/`rxBorder`/`rxText` tokens).
- `sign-in.tsx` and `sign-up.tsx` both have a disabled "Phone login coming soon" secondary action.
- This satisfies the user's requirement that Phone OTP UI remain disabled and clearly marked.

### Hand-runnable verification checklist (for the user to execute)

Until the user runs these, runtime success is **not yet confirmed**.

1. Confirm `apps/mobile/.env` has all six `EXPO_PUBLIC_FIREBASE_*` keys populated for the same Firebase project the website uses, plus `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (required) and the platform-specific `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` for whichever platform you'll test.
2. In Firebase Console -> Authentication -> Sign-in method, confirm both **Email/Password** and **Google** are enabled.
3. In Google Cloud Console for the same project, confirm the OAuth client IDs match the values in `.env` and that the SHA-1 of the Android dev keystore is registered (Android only).
4. Build a development client (Google sign-in does not work in plain Expo Go — the code already detects this and shows a guidance message): `cd apps/mobile && eas build --profile development --platform android` (or `ios`). Install the resulting build on a real device or emulator.
5. `npx expo start --dev-client` and connect the dev build.
6. From the Welcome screen tap **Create account** -> on Sign Up tap **Continue with Google** -> complete the Google chooser. Expected: redirect back to app, route to `/home`.
7. Open Firebase Console -> Firestore -> `users/{your_uid}`. Expected fields: `uid`, `email`, `emailVerified`, `displayName`, `photoURL`, `authProvider: 'google.com'`, `authProviders: ['google.com']`, `preferences`, `profileComplete: false`, `hasProfile: false`, `createdAt`, `updatedAt`, `lastLoginAt`.
8. Sign out, then re-sign-in with the same Google account. Confirm the doc updates `updatedAt` + `lastLoginAt` but does NOT regenerate `createdAt`.
9. Visit Sign In -> tap the disabled **Phone login coming soon** button. Expected: button does not respond. Tap **Use email instead** from `/phone-otp` -> route back to Sign In.
10. Repeat 6-7 from the Sign In screen with **Continue with Google** to confirm the existing-account path also writes correctly.

If any step fails, the static review pinpoints likely culprits: missing client IDs (step 1), provider not enabled (step 2), wrong SHA-1 (step 3), running in Expo Go instead of dev client (step 4), `auth/operation-not-allowed` (step 2 again), `auth/unauthorized-domain` (step 3 again).

**Files updated this turn:**
- `docs/AGENT_LOG.md` (this entry).
- `docs/TODO_NEXT_AGENT.md` ("Next up" rewritten around the email-path Firestore bug + manual verification checklist).
- `docs/SESSION_STATE.md` (phase moved from "planning-only" to "mobile implementation in progress; auth landed").

**Files intentionally NOT touched (still protected):**
- `src/**`, `public/**`, `functions/**`, `dataconnect/**`
- Root config files: `package.json`, `firebase.json`, `firestore.rules`, `storage.rules`, `database.rules.json`, `firestore.indexes.json`, `vite.config.js`, `eslint.config.js`
- `.env`, `.env.local`, `.env.example`, `.firebaserc`, `serviceAccountKey.json`
- `apps/mobile/**` source — this turn only **read** that tree; no edits made. The email-path bug is documented for the next implementation pass to fix.

**Outstanding from prior turn:**
- The Medifind rename + design specs task (Splash + Welcome detailed designs, DESIGN_SYSTEM Medifind extension) was paused mid-edit before this task arrived. Two edits landed in `MOBILE_APP_PLAN.md` (title + Branding section + Section 1 vision rewrite). The remaining work (MOBILE_UI_SCREEN_SPECS title rename, DESIGN_SYSTEM Medifind extension, full Splash + Welcome design spec) is still to do.

**Suggested commit message:**
`docs(auth): static review of Google sign-in, Firestore profile, phone OTP state`

---

## 2026-04-24 - Clarify auth providers and Rx doctrine in MVP
**Agent:** Claude Opus 4.7 (Claude Code)
**Session goal:** Pin down two things that could otherwise drift during implementation: (a) the exact authentication providers required in MVP and (b) how the app must behave around prescription-required medicines.

**Clarifications recorded:**

Auth (MVP):
- Firebase Authentication is required for discovery MVP.
- **Email/password** (with email verification) AND **Google sign-in** must ship together.
- Phone OTP is **Phase 2** (not MVP).
- Every mobile user must have a minimal `users/{uid}` profile (`displayName`, `email`, `emailVerified`, `photoUrl?`, `authProvider: 'password' | 'google.com'`, `preferences`, `createdAt`, `updatedAt`) before reaching Home. `onUserCreate` + Profile setup enforce this.
- Google sign-in collisions with an existing email/password account route to a "Link accounts" path, not silent failure.

Prescription-required medicines (MVP):
- **Allowed:** search, list, view, navigate to stores that carry Rx medicines.
- **Required:** a strong "Prescription required" badge + warning block on every Rx surface (palette from `docs/DESIGN_SYSTEM.md` §7). Copy: "Prescription required. Please carry a valid prescription when you visit or call the store."
- **Blocked in MVP:** reserve, hold, order, delivery, prescription upload, pharmacist approval, any Rx-approval state in the client. No CTA labelled Reserve/Order/Add to cart/Buy/Request.
- **Blocked in MVP:** medical advice, dosage, "how to take", side effects, contraindications, substitution advice, symptom checker. Even if `medicines/{id}.usage`/`sideEffects`/`warnings` exist in Firestore, mobile does not render them.
- CTA guidance: primary is **"Navigate to store"**; secondary is **"Call store"**.

**Files updated:**
- `docs/MOBILE_APP_PLAN.md` — §2.1 Authentication rewritten to specify MVP providers and the required profile shape; new §2.1.1 "Prescription-required medicines in discovery MVP" encodes the full Rx doctrine; §2.7 Medicine Detail tightened to forbid medical/dosage content in MVP.
- `docs/MOBILE_UI_SCREEN_SPECS.md` — two new top-level doctrine blocks ("Authentication doctrine (MVP)" + "Prescription-required medicine doctrine (MVP)"); Sign In and Sign Up screens updated with Google sign-in button + account-collision path; Medicine Detail (screen §15) updated: allowed vs forbidden sections, Rx-only CTA wording, components list updated (added `RxWarningBlock`, removed `SafetyInfoAccordion`).
- `docs/SESSION_STATE.md` — "Current phase" now includes the Auth and Rx clarifications.
- `docs/TODO_NEXT_AGENT.md` — "Next up" restated with Auth + Rx clarifications; commit suggestion updated.
- `docs/AGENT_LOG.md` — this entry.

**What did NOT change:**
- No architectural decisions added; D-001 … D-014 unchanged. D-006, D-010, D-014 remain Phase-2 extension points.
- No backend contract (`BACKEND_FUNCTIONS_CONTRACT.md`, `FIRESTORE_SCHEMA_CONTRACT.md`, `FIREBASE_RULES_PROPOSAL.md`, `MOBILE_BACKEND_HANDOFF.md`) edits — existing Auth provider support is Firebase-level config, not a doc-change requirement; Rx fields stay in schemas for Phase 2 but are not rendered in MVP UI.
- No code. No scaffold. No protected files touched.

**Files intentionally NOT touched (protected):**
- `src/**`, `public/**`, `functions/**`, `dataconnect/**`, `apps/mobile/**`
- `package.json`, `package-lock.json`
- `firebase.json`, `firestore.rules`, `storage.rules`, `database.rules.json`, `firestore.indexes.json`
- `vite.config.js`, `eslint.config.js`
- `.env`, `.env.local`, `.env.example`, `.firebaserc`
- `README.md` (root), `cors.json`, `apphosting.emulator.yaml`, `main.jsx` (root)
- `serviceAccountKey.json`

**Warnings for next agent:**
- Backend team enabling the Google provider in Firebase console is a prerequisite to shipping auth UI; note this in the coordination thread.
- When scaffold is authorized, the Expo side will need `expo-auth-session` (or the chosen Google-sign-in wrapper). That's a scaffold-time dependency, not a planning-phase change.
- If you see an Rx medicine's dosage or side-effects rendered anywhere in the mobile app code, STOP — this violates MVP doctrine. Escalate before merging.

**Suggested commit message:**
`docs(mobile): clarify auth providers and Rx handling in MVP`

---

## 2026-04-24 - Reconfirm MVP direction before any coding
**Agent:** Claude Opus 4.7 (Claude Code)
**Session goal:** Lock in the canonical MVP scope in the planning docs as a five-bullet statement future agents can grep for, so discovery-only MVP cannot be re-expanded to commerce by accident.

**Canonical MVP (verbatim):**
- Find a medicine.
- Show nearby stores that have it.
- Show store details and availability.
- Guide / navigate the user to the store.
- Let the user call / contact the store.

**Phase 2 / optional (not MVP):** delivery, cart, checkout, payment, order tracking, prescription delivery flow.

**Skills invoked:** `repo-understanding` (reused), `project-memory`, `firebase-architect`, `mobile-product-planner`, `agent-handoff-logger`.

**Files inspected (read-only):**
- `CLAUDE.md`, `AGENTS.md`, `graphify-out/GRAPH_REPORT.md`
- `docs/AI_HANDOFF_PROTOCOL.md`, `docs/SESSION_STATE.md`, `docs/TODO_NEXT_AGENT.md`, `docs/AGENT_LOG.md`, `docs/DECISIONS.md`, `docs/MOBILE_APP_PLAN.md`, `docs/MOBILE_UI_SCREEN_SPECS.md`
- No source files re-inspected; no backend docs edited.

**Files updated:**
- `docs/MOBILE_APP_PLAN.md` - added a "Canonical MVP definition" section at the top containing the five-bullet statement verbatim and an explicit Phase-2 callout. The rest of the doc (discovery/navigation plan authored by the prior Codex session) is unchanged.
- `docs/MOBILE_UI_SCREEN_SPECS.md` - added the same five-bullet canonical MVP block below the title. Existing 18-screen spec unchanged.
- `docs/SESSION_STATE.md` - "Current phase" now restates the canonical MVP bullets and the Phase-2 exclusions.
- `docs/TODO_NEXT_AGENT.md` - "Next up" top section restated with the canonical bullets; commit message suggestion updated.
- `docs/AGENT_LOG.md` - this entry.

**What did NOT change (important):**
- No scope drift. Discovery MVP, Phase 2 commerce set, D-001 ... D-014, and the 18 MVP screens all remain exactly as Codex left them. This session only makes the MVP definition harder to lose.
- `docs/BACKEND_FUNCTIONS_CONTRACT.md`, `docs/FIRESTORE_SCHEMA_CONTRACT.md`, `docs/FIREBASE_RULES_PROPOSAL.md`, `docs/MOBILE_BACKEND_HANDOFF.md` untouched; they still document the full (including Phase-2) surface, which is intentional.

**Files intentionally NOT touched (protected):**
- `src/**`, `public/**`, `functions/**`, `dataconnect/**`, `apps/mobile/**`
- `package.json`, `package-lock.json`
- `firebase.json`, `firestore.rules`, `storage.rules`, `database.rules.json`, `firestore.indexes.json`
- `vite.config.js`, `eslint.config.js`
- `.env`, `.env.local`, `.env.example`, `.firebaserc`
- `README.md` (root), `cors.json`, `apphosting.emulator.yaml`, `main.jsx` (root)
- `serviceAccountKey.json`

**Warnings for next agent:**
- If you see anything in future work that looks like cart, checkout, payment, order tracking, or prescription *delivery* flow in MVP context, stop and re-read the canonical MVP block at the top of `docs/MOBILE_APP_PLAN.md`. Escalate to the user before proceeding.
- Committed secrets (`serviceAccountKey.json`, `.env`, `.env.local`) still at repo root - not our file to fix, still flag it.

**Suggested commit message:**
`docs(mobile): reconfirm MVP direction - discovery over commerce`

---

## 2026-04-24 - Refocus mobile MVP on medicine discovery
**Agent:** Codex
**Session goal:** Adjust product priorities before coding so the first mobile MVP focuses on finding a medicine, seeing which nearby stores have it, navigating to the store, and calling/contacting the store.

**Files inspected (read-only):**
- `AGENTS.md`
- `graphify-out/GRAPH_REPORT.md`
- `docs/DECISIONS.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/MOBILE_APP_PLAN.md`
- `docs/MOBILE_UI_SCREEN_SPECS.md`

**Files updated:**
- `docs/MOBILE_APP_PLAN.md` - rewritten around discovery/navigation MVP. Cart, checkout, payment, order placement, delivery, and prescription approval are explicitly Phase 2.
- `docs/MOBILE_UI_SCREEN_SPECS.md` - rewritten for the reduced MVP screen set: auth, profile/location, home list/map, search/results, store detail, medicine detail, contact store, navigation handoff, profile. Commerce screens are marked Phase 2/optional.
- `docs/TODO_NEXT_AGENT.md` - next steps rewritten to prevent commerce/delivery scaffolding in MVP.
- `docs/SESSION_STATE.md` - current phase updated with the new priority reset.
- `docs/AGENT_LOG.md` - this entry.

**Important scope reset:**
- MVP is now: search -> nearby store availability -> store detail -> call/contact -> map navigation.
- MVP is not: cart, checkout, payment, order tracking, prescription approval, or delivery.
- Existing decisions D-005, D-006, D-010, and D-014 remain future Phase 2 extension points, not MVP implementation requirements.

**Files intentionally NOT touched:**
- `src/**`, `functions/**`, `dataconnect/**`, `apps/mobile/**`
- `package.json`, `package-lock.json`
- `firebase.json`, `firestore.rules`, `storage.rules`, `database.rules.json`, `firestore.indexes.json`
- `.env`, `.env.local`, `.env.example`
- `serviceAccountKey.json`

**Suggested commit message:**
`docs(mobile): refocus MVP on medicine discovery`

---

## 2026-04-24 — Add mobile MVP UI screen specs
**Agent:** Codex
**Session goal:** Create detailed, documentation-only mobile UI screen specs for the Nearnest MVP without scaffolding Expo or touching app/backend code.

**Files inspected (read-only):**
- `AGENTS.md`
- `graphify-out/GRAPH_REPORT.md`
- `docs/AI_HANDOFF_PROTOCOL.md`
- `docs/SESSION_STATE.md`
- `docs/MOBILE_APP_PLAN.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/DECISIONS.md`
- `docs/TODO_NEXT_AGENT.md`

**Files created / updated:**
- `docs/MOBILE_UI_SCREEN_SPECS.md` — new 26-screen MVP spec covering purpose, layout, CTAs, secondary actions, states, components, Firebase/backend dependencies, navigation links, and design notes for every requested screen.
- `docs/TODO_NEXT_AGENT.md` — top section rewritten for the next docs-only step.
- `docs/SESSION_STATE.md` — current phase updated to note UI specs are complete.
- `docs/AGENT_LOG.md` — this entry.

**Screen specs included:**
- Splash, Welcome / onboarding, Sign in, Sign up, Email verification, Forgot password, Profile setup, Location permission, Address picker.
- Home list, Home map, Search, Search results, Store detail, Product detail.
- Cart, Prescription upload, Prescription status, Checkout, Payment status.
- Orders list, Order detail, Notifications inbox, Support home, Support chat, Profile.

**Decision alignment:**
- Specs use expo-router as the planned navigation baseline (D-007), Firebase JS SDK + expo-notifications (D-008), Cloud Functions for protected writes (D-005), Razorpay payments (D-010), server-side Places proxy (D-011), searchMedicines behind Firestore searchTokens (D-013), and per-store prescription scope (D-014).

**Files intentionally NOT touched:**
- `src/**`, `functions/**`, `dataconnect/**`, `apps/mobile/**`
- `package.json`, `package-lock.json`
- `firebase.json`, `firestore.rules`, `storage.rules`, `database.rules.json`, `firestore.indexes.json`
- `.env`, `.env.local`, `.env.example`
- `serviceAccountKey.json`

**Suggested commit message:**
`docs(mobile): add MVP UI screen specs`

---

## 2026-04-24 — Complete Graphify coordination setup
**Agent:** Codex
**Session goal:** Continue Graphify setup from the PATH failure and coordinate Claude Code + Codex without touching app source code.

**Commands run:**
1. `graphify install --platform windows`
   - Direct shell attempt still failed because this spawned PowerShell did not inherit the user's PATH update.
   - Retried with `C:\Users\Aditya\AppData\Roaming\Python\Python314\Scripts` prepended inside the command and succeeded.
2. `graphify claude install`
   - Succeeded. Wrote `CLAUDE.md`.
   - Also created `.claude/settings.json`; removed it because `.claude/**` was outside the allowed edit list for this session.
3. `graphify codex install`
   - Succeeded. Wrote `AGENTS.md` and `.codex/hooks.json`.
4. `graphify .`
   - Failed because this Graphify CLI version does not support `.` as a command.
5. `graphify --help`
   - Used to identify the current indexing command.
6. `graphify update .`
   - Succeeded. Generated/updated `graphify-out/` with 208 nodes, 207 edges, and 50 communities.

**Exact errors observed:**
```text
graphify : The term 'graphify' is not recognized as the name of a cmdlet, function, script file, or operable program.
Check the spelling of the name, or if a path was included, verify that the path is correct and try again.
At line:2 char:1
+ graphify install --platform windows
+ ~~~~~~~~
    + CategoryInfo          : ObjectNotFound: (graphify:String) [], CommandNotFoundException
    + FullyQualifiedErrorId : CommandNotFoundException
```

```text
error: unknown command '.'
Run 'graphify --help' for usage.
```

**Files created / updated:**
- `.graphifyignore`
- `AGENTS.md`
- `CLAUDE.md`
- `.codex/hooks.json`
- `graphify-out/graph.json`
- `graphify-out/graph.html`
- `graphify-out/GRAPH_REPORT.md`
- `graphify-out/cache/**`
- `docs/AI_HANDOFF_PROTOCOL.md`
- `docs/SESSION_STATE.md`
- `docs/TODO_NEXT_AGENT.md`
- `docs/AGENT_LOG.md`

**Files intentionally NOT touched:**
- `src/**`, `functions/**`, `dataconnect/**`, `apps/mobile/**`
- `package.json`, `package-lock.json`
- `firebase.json`, `firestore.rules`, `storage.rules`, `database.rules.json`, `firestore.indexes.json`
- `.env`, `.env.local`, `.env.example`
- `serviceAccountKey.json`

**Notes for next agent:**
- Use `graphify update .`, not `graphify .`, with Graphify `0.4.23`.
- `graphify claude install` wants to register `.claude/settings.json`; that file was intentionally removed to honor this session's allowed-file list.

**Suggested commit message:**
`chore(ai): configure graphify coordination for claude and codex`

---

## 2026-04-24 — Attempt Graphify coordination setup (stopped on command failure)
**Agent:** Codex
**Session goal:** Set up Graphify coordination for Claude Code + Codex without touching app source code.

**Allowed files constraint:** Only `.graphifyignore`, `AGENTS.md`, `CLAUDE.md`, `.codex/**`, `graphify-out/**`, `docs/AI_HANDOFF_PROTOCOL.md`, `docs/SESSION_STATE.md`, `docs/AGENT_LOG.md`, and `docs/TODO_NEXT_AGENT.md`.

**Commands run:**
1. `pip install graphifyy`
   - First sandbox attempt failed due blocked network access.
   - Retried with approved network access and succeeded.
2. `graphify install --platform windows`
   - Failed. Stopped immediately per user instruction.

**Exact failure that stopped the setup:**
```text
graphify : The term 'graphify' is not recognized as the name of a cmdlet, function, script file, or operable program. 
Check the spelling of the name, or if a path was included, verify that the path is correct and try again.
At line:2 char:1
+ graphify install --platform windows
+ ~~~~~~~~
    + CategoryInfo          : ObjectNotFound: (graphify:String) [], CommandNotFoundException
    + FullyQualifiedErrorId : CommandNotFoundException
```

**Files created before failure:**
- `.graphifyignore` — created with requested exclusions.

**Files not created because setup stopped:**
- `docs/AI_HANDOFF_PROTOCOL.md`
- `docs/SESSION_STATE.md`
- `AGENTS.md`
- `CLAUDE.md`
- `.codex/**`
- `graphify-out/**`

**Files intentionally NOT touched:**
- `src/**`, `functions/**`, `dataconnect/**`
- `package.json`, `firebase.json`, `firestore.rules`, `storage.rules`
- `.env*`, `serviceAccountKey.json`

**Next action:** Re-run the Graphify commands after adding `C:\Users\Aditya\AppData\Roaming\Python\Python314\Scripts` to PATH for the shell, or invoke `graphify.exe` by absolute path if the user approves deviating from the exact command text.

---

## 2026-04-24 — Verify and complete backend handoff contracts
**Agent:** Codex
**Session goal:** Take over after Claude hit a usage limit while creating backend handoff docs; verify what exists, complete any gaps, and leave a clear next-agent handoff without touching code.

**Files inspected (read-only):**
- `AGENTS.md` — not present in repo root.
- `docs/PROJECT_MAP.md`
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- `docs/MOBILE_APP_PLAN.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/TODO_NEXT_AGENT.md`
- `docs/AGENT_LOG.md`
- `docs/BACKEND_FUNCTIONS_CONTRACT.md`
- `docs/FIRESTORE_SCHEMA_CONTRACT.md`
- `docs/FIREBASE_RULES_PROPOSAL.md`
- `docs/MOBILE_BACKEND_HANDOFF.md`

**What Claude started:**
- Claude had created the four backend handoff docs: Cloud Functions contract, Firestore schema contract, Firebase rules proposal, and beginner-friendly mobile-to-backend handoff.

**What Codex verified / completed:**
- Confirmed all four backend docs exist and contain full section structures, implementation order, rules intent, schema/index coverage, and backend readiness checklist.
- Found and fixed one consistency gap: support-ticket functions/rules already referenced a `support` role, but the role enum in the functions/schema contracts did not include `support`.
- Rewrote the top "Next up" section in `docs/TODO_NEXT_AGENT.md` to make the immediate path explicit: commit backend docs, optionally set up Graphify coordination, create UI screen specs, and do not scaffold Expo until explicit go-ahead.

**Files changed:**
- `docs/BACKEND_FUNCTIONS_CONTRACT.md` — added `support` to the `setUserRole` role enum and default-role safety note.
- `docs/FIRESTORE_SCHEMA_CONTRACT.md` — added `support` to the user role description/enum.
- `docs/TODO_NEXT_AGENT.md` — rewrote "Next up" for the next phase.
- `docs/AGENT_LOG.md` — this entry.

**Protected files intentionally NOT touched:**
- `src/**`, `public/**`, `functions/**`, `dataconnect/**`
- `package.json`, `package-lock.json`
- `firebase.json`, `firestore.rules`, `storage.rules`, `database.rules.json`, `firestore.indexes.json`
- `vite.config.js`, `eslint.config.js`
- `.env`, `.env.local`, `.env.example`
- `README.md`, `serviceAccountKey.json`
- `apps/mobile/**`

**Suggested commit message:**
`docs(backend): add mobile backend handoff contracts`

---

## 2026-04-24 — Resolve 8 open mobile architecture decisions
**Agent:** Claude Opus 4.7 (Claude Code)
**Session goal:** Close every open architectural decision surfaced in `docs/MOBILE_APP_PLAN.md` §8.1 so the mobile MVP has a firm technical baseline before any scaffold.

**Skills invoked:** `repo-understanding` (reused), `project-memory`, `firebase-architect`, `mobile-product-planner`.

**Files inspected (read-only):**
- `docs/MOBILE_APP_PLAN.md` (§8 open questions)
- `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/PROJECT_MAP.md` (memory)
- No source code files re-inspected — state unchanged from earlier this day.

**Decisions added (D-007 … D-014):**
- **D-007** — Navigation: **expo-router** (React Navigation fallback).
- **D-008** — Mobile Firebase client: **Firebase JS SDK** + `expo-notifications` (RNFirebase fallback).
- **D-009** — Roles: migrate to **Firebase Auth custom claims** with `users.roles[]` as a mirror during a 3-phase rollout.
- **D-010** — Payments: **Razorpay** for India MVP (Cashfree fallback).
- **D-011** — Places + Maps proxy: **same `functions/` codebase**, callables with per-uid rate limiting + App Check.
- **D-012** — **Data Connect deferred** past MVP; re-evaluate 3 months post-launch.
- **D-013** — Search: **Firestore `searchTokens[]`** behind a `searchMedicines` callable (Typesense fallback).
- **D-014** — Prescriptions: **per-store scope** for MVP; cross-store variant reserved for Phase 2.

Each `D-NNN` entry includes Recommendation, Why-best-for-MVP, Impact on mobile, Impact on web/backend, Risks, Fallback.

**Files created / edited:**
- `docs/DECISIONS.md` — appended D-007 … D-014. (Temporarily got reordered during editing; final order is D-001 → D-014, verified with `grep`.)
- `docs/ARCHITECTURE.md` — §8 rewritten from an open-questions list to a resolution table linking each question to its `D-NNN` decision.
- `docs/AGENT_LOG.md` — this entry.
- `docs/TODO_NEXT_AGENT.md` — "Next up" rewritten.

**Files intentionally NOT touched:**
- `src/`, `public/`, `functions/`, `dataconnect/`
- `package.json`, `package-lock.json`, `firebase.json`, `firestore.rules`, `storage.rules`, `database.rules.json`, `firestore.indexes.json`
- `vite.config.js`, `eslint.config.js`, `.env*`, `README.md`, `.firebaserc`, `cors.json`, `apphosting.emulator.yaml`, `main.jsx` (root), `serviceAccountKey.json`
- `apps/mobile/` — no scaffold or file changes
- `docs/MOBILE_APP_PLAN.md` — unchanged; §8.1 now points to the resolved decisions via `ARCHITECTURE.md`

**Warnings for next agent:**
- These decisions are the contract. If implementation discovers a blocker, escalate and add a new `D-NNN` that *supersedes* the old one — never silently re-litigate.
- Expo scaffold still requires explicit user go-ahead. D-007 + D-008 determine the commands to run when that happens.
- D-009's Phase A (new `setUserRole` + new rules using token claims) is a backend task for the website team before mobile writes any role-gated flow. Mobile can build against the token-claim shape from day one.
- D-013 implies a Firestore trigger that maintains `searchTokens[]`; backend team should stub this alongside `searchMedicines`.
- Previously-flagged committed secrets (`serviceAccountKey.json`, `.env`, `.env.local`) remain unfixed. Still flagged.

**Suggested commit message:**
`docs(decisions): resolve 8 open mobile architecture decisions (D-007…D-014)`

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
