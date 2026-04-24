# Nearnest Session State

Last updated: 2026-04-24

## Current phase
Mobile MVP planning is documentation-only. Graphify coordination is installed and indexed, backend handoff docs exist, and `docs/MOBILE_UI_SCREEN_SPECS.md` now defines the 26 MVP customer-facing screens. No app source, Cloud Functions, Firebase rules, package files, env files, or mobile scaffold files should be edited in this phase.

## Graphify status
- Python package installed: `graphifyy==0.4.23`.
- Global Windows/Claude skill install completed via `graphify install --platform windows`.
- Repo Claude instructions created: `CLAUDE.md`.
- Repo Codex instructions created: `AGENTS.md`.
- Codex hook created: `.codex/hooks.json`.
- Knowledge graph generated under `graphify-out/`.
- Current graph summary from `graphify-out/GRAPH_REPORT.md`: 208 nodes, 207 edges, 50 communities.
- `.graphifyignore` exists and excludes env/secrets, generated build outputs, Graphify cache/cost/manifest files, and AI config folders.

## Command notes
- `graphify .` failed because this CLI version does not support `.` as a command.
- `graphify update .` is the working replacement and was used to create/update the graph.
- `graphify claude install` created `.claude/settings.json`; that file was removed because it was outside the allowed edit list for this session.

## Current allowed next work
1. Commit the mobile UI screen specs and handoff updates.
2. Review the UI specs against backend contracts for missing API assumptions.
3. Keep `apps/mobile/**` untouched until the user explicitly authorizes Expo scaffolding.
4. Keep backend implementation in the website/backend team's scope; do not edit `functions/**` or Firebase rules from mobile-planning sessions.
5. Optionally create documentation-only wireframe notes or a route map for the 26 screens.

## Protected files not touched in this setup
- `src/**`
- `functions/**`
- `dataconnect/**`
- `apps/mobile/**`
- `package.json`, `package-lock.json`
- `firebase.json`, `firestore.rules`, `storage.rules`, `database.rules.json`, `firestore.indexes.json`
- `.env`, `.env.local`, `.env.example`
- `serviceAccountKey.json`
