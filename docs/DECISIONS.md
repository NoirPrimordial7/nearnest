# Architecture Decisions Log

Append-only. Each decision gets a stable ID (`D-NNN`). Never silently edit prior decisions — supersede them with a new entry.

---

## D-001 — Website stays at repo root (for now)
**Date:** 2026-04-24
**Status:** Accepted
**Context:** The web portal currently lives directly at the repo root (`src/`, `public/`, `functions/`, `firebase.json`, etc.). Moving it to `apps/web/` would touch every relative path and risk breaking the active website team's work.
**Decision:** Keep the web portal at the repo root. Do **not** move it into `apps/web/` until the website team explicitly requests it.
**Consequence:** The mobile app will live in `apps/mobile/` while the web app remains at root — a mixed monorepo-ish layout. This is intentional and temporary.

---

## D-002 — Mobile app lives in `apps/mobile/` using React Native + Expo
**Date:** 2026-04-24
**Status:** Accepted
**Context:** Need a single-codebase mobile app for iOS + Android, with quick iteration and OTA updates.
**Decision:** Use **React Native via Expo (managed workflow)** with **EAS Build** for production binaries. All mobile code lives under `apps/mobile/`.
**Consequence:** Scaffolding (`expo init`) is deferred until the user explicitly says go. Expo managed workflow means no bare native modules unless strictly needed.

---

## D-003 — Firebase is the shared backend for web and mobile
**Date:** 2026-04-24
**Status:** Accepted
**Context:** The web portal already runs on Firebase (Auth, Firestore, Storage, Functions, Data Connect scaffolded). A separate backend would double the ops surface.
**Decision:** Mobile app uses the **same Firebase project** as the web portal. No separate API server.
**Consequence:** All security rules, indexes, and Cloud Functions are shared. Changes to Firestore/Storage rules must consider both clients.

---

## D-004 — Firestore is the MVP database
**Date:** 2026-04-24
**Status:** Accepted
**Context:** Data Connect (Postgres-backed) is scaffolded but empty. Shipping a relational layer adds ops complexity for MVP.
**Decision:** **Firestore is the primary datastore for MVP.** Data Connect adoption is deferred and will be revisited after launch for analytics/reporting workloads.
**Consequence:** Designs must accept Firestore's constraints (no joins, indexed queries, denormalization). Revisit when MVP is in users' hands.

---

## D-005 — All protected logic goes through Cloud Functions
**Date:** 2026-04-24
**Status:** Accepted
**Context:** Orders, payments, prescription approvals, role changes, and status transitions must be auditable and tamper-resistant.
**Decision:** **Orders, payments, prescription approval, role changes, delivery state, and all admin actions are handled exclusively by Cloud Functions.** Clients may read via Firestore but must not write to these collections directly — security rules will reject direct writes.
**Consequence:** The `functions/` codebase will grow significantly. Client code (web + mobile) calls callable/HTTPS functions, not Firestore, for these flows. Functions enforce role + business rule checks in addition to rules.

---

## D-006 — Prescription-required medicines cannot be delivered without approval
**Date:** 2026-04-24
**Status:** Accepted
**Context:** Legal and safety requirement for Rx medicines.
**Decision:** A medicine flagged `requiresPrescription: true` cannot be included in an order that is transitioned past `paid` unless **every** such item references a `prescriptions/{id}` document with `state: 'approved'`, approved by a store admin or global admin, and tied to the ordering user.
**Consequence:**
- Client UI must show the prescription gate clearly (see `docs/DESIGN_SYSTEM.md` warning pattern).
- `createOrder` and `updateOrderStatus` Cloud Functions enforce the gate; the client cannot bypass it.
- Every approval/rejection writes an audit entry (actor uid + timestamp + optional notes).

---
