---
name: repo-understanding
description: Use when starting any new task. Reads the current folder structure, existing routes, Firebase setup, components, pages, and current design direction. Always use this skill first before touching any file.
---

# Repo Understanding

**Always invoke this skill FIRST before any other task in the Nearnest repo.**

## What it does
Builds a read-only mental model of the current state of the repository so the agent does not guess, duplicate work, or break the website team's code.

## Read (never edit)
- `src/` — full folder tree, with focus on `src/App.jsx`, `src/pages/`, `src/components/`, `src/lib/firebase.js`
- `functions/index.js` and any other files in `functions/`
- `dataconnect/` (schema + dataconnect.yaml)
- `firebase.json`, `firestore.rules`, `storage.rules`, `database.rules.json`, `firestore.indexes.json`
- `package.json` (to know dependencies + scripts)
- `public/` (static assets only)
- `docs/PROJECT_MAP.md` and `docs/ARCHITECTURE.md` (if they exist — prefer live code if they diverge)

## Never touch
- Any file under `src/`, `public/`, `functions/`, `dataconnect/`
- `package.json`, `package-lock.json`, `firebase.json`
- `firestore.rules`, `storage.rules`
- `vite.config.js`, `eslint.config.js`, `.env.example`, `README.md`

## Output (to the user / next skill)
A short structured summary:
1. **Folder map** — top-level directories that matter for the current task
2. **Routes found** — list from `src/App.jsx`
3. **Firebase surface** — collections touched, rules gist, functions defined
4. **Relevant to current task** — bullet list of files the agent may need to READ (not edit) next
5. **Safe work area** — confirm the agent will only write inside `.Codex/`, `docs/`, or `apps/mobile/`
6. **Open questions** — anything ambiguous to flag before acting

## Rule
If the read-only pass shows the task would require editing a protected file, STOP and ask the user before proceeding.
