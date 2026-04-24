---
name: mobile-product-planner
description: Use when planning the React Native mobile app features, screens, user flows, MVP vs Phase 2, Firebase collections, or Cloud Functions. Do not use this to write code — only for planning documents.
---

# Mobile Product Planner

Planning-only skill for the Nearnest React Native / Expo app. Produces/updates planning docs. **Never writes code.**

## Reads
- `docs/ARCHITECTURE.md`
- `docs/MOBILE_APP_PLAN.md`
- `docs/PROJECT_MAP.md`
- `docs/DECISIONS.md` (to respect locked decisions)

## Writes
- `docs/MOBILE_APP_PLAN.md` (only)

## Never edits
- `src/` (web portal)
- `apps/mobile/` code files (screens, components, services, etc.)
- `functions/`, `firestore.rules`, `storage.rules`, any root config

## What to plan
- App purpose, target users, and core value in ≤3 sentences
- User types (end user, store admin, delivery, verifier/admin)
- MVP screen list and navigation tree
- Firebase collections needed (names + key fields + ownership)
- Cloud Functions needed (name, trigger, purpose, auth check)
- MVP vs Phase 2 split with rationale
- Open questions to resolve before coding

## Rule
If a planning decision conflicts with `DECISIONS.md`, escalate to the user instead of silently overriding.
