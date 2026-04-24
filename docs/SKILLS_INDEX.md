# Nearnest — Skills Index

The full list of skills available to agents working on this repo. **`repo-understanding` runs first on every new task.** After every task, run `agent-handoff-logger` and update `docs/AGENT_LOG.md`.

## Rule of thumb
1. Start → `repo-understanding`
2. Load memory → `project-memory`
3. Plan (no code) → `mobile-product-planner` or `firebase-architect` or `superpowers:brainstorming`
4. Write plan → `superpowers:writing-plans`
5. Execute → `react-native-expo-builder` (mobile) or the appropriate skill
6. Review → `security-compliance-reviewer` for prescription / payment / admin code; `superpowers:requesting-code-review` generally
7. Finish → `agent-handoff-logger`

---

## Custom skills (this project)

| Skill | What it does | When to use | Writes to |
|-------|--------------|-------------|-----------|
| **repo-understanding** | Read-only scan of the repo: folders, routes, Firebase surface, design direction | **First, always.** Before touching any file. | Nothing |
| **project-memory** | Loads + updates the `docs/` memory files | Start and end of every task | `docs/AGENT_LOG.md`, `docs/TODO_NEXT_AGENT.md`, optionally `docs/ARCHITECTURE.md` / `docs/DECISIONS.md` / `docs/PROJECT_MAP.md` |
| **agent-handoff-logger** | Appends the session entry and rewrites the "Next up" TODO | End of every session | `docs/AGENT_LOG.md` (append), `docs/TODO_NEXT_AGENT.md` (top section) |
| **mobile-product-planner** | Plans React Native app features, screens, flows, collections, functions | Planning the mobile app — no code | `docs/MOBILE_APP_PLAN.md` |
| **firebase-architect** | Designs Firestore schemas, rules intent, functions, FCM, App Check, Maps | Before any Firebase-related code | `docs/ARCHITECTURE.md` (Firebase section) |
| **react-native-expo-builder** | Implements Expo screens, components, services | Only after user says go + `MOBILE_APP_PLAN.md` has the feature | `apps/mobile/**` only |
| **security-compliance-reviewer** | Audits prescription, payment, admin flows + rules | Before shipping anything sensitive | Nothing (read-only audit) |

## Installed plugin skills

### Superpowers (`superpowers:*`)
Process + discipline skills. Use `superpowers:using-superpowers` at session start to load the framework.

- `superpowers:brainstorming` — before any creative work
- `superpowers:writing-plans` — turn specs into step-by-step plans
- `superpowers:executing-plans` — execute a written plan with checkpoints
- `superpowers:subagent-driven-development` — execute plans with independent subagents
- `superpowers:dispatching-parallel-agents` — parallelize independent tasks
- `superpowers:test-driven-development` — TDD loop (requires a test framework)
- `superpowers:systematic-debugging` — structured debugging before proposing a fix
- `superpowers:verification-before-completion` — prove work is done with evidence
- `superpowers:requesting-code-review` / `superpowers:receiving-code-review`
- `superpowers:using-git-worktrees` — isolate feature work
- `superpowers:finishing-a-development-branch` — merge / PR / cleanup
- `superpowers:writing-skills` — create or edit skills

### Anthropic official (`document-skills:*` and `example-skills:*`)
Document + artifact skills. Use when the deliverable is a doc, slide deck, PDF, spreadsheet, artifact, or canvas. Relevant picks for Nearnest:

- `document-skills:doc-coauthoring` — structured doc writing (use for ARCHITECTURE/DECISIONS updates)
- `document-skills:frontend-design` / `frontend-design:frontend-design` — premium UI generation (reference `docs/DESIGN_SYSTEM.md`)
- `document-skills:mcp-builder` — if we ever expose Nearnest data to Claude via MCP
- `document-skills:claude-api` — if/when we add AI features to the app
- `document-skills:webapp-testing` — Playwright-based UI checks for the web portal (read-only; do not touch `src/`)
- `document-skills:skill-creator` — when adding new custom skills

### jezweb/claude-skills (`.claude/skills/react-native-expo/`)
Community React Native + Expo + UX audit + roadmap skills. Symlinked from `.claude/external/jezweb-skills/`. Consult directly if the Skill tool hasn't surfaced them yet.

- `react-native-expo` (and whatever siblings the repo exposes) — practical RN/Expo recipes

### expo/skills (`.claude/skills/expo-workflows/`)
Official Expo team skills for EAS and React Native workflows. Symlinked from `.claude/external/expo-skills/`.

- `expo-workflows` — EAS builds, OTA updates, app config, common Expo workflows

> If a skill from jezweb or expo doesn't show up under the Skill tool after `/reload-plugins`, open the file directly from `.claude/external/<repo>/` as plain markdown and follow it by hand. Flag this to the user so we can add a plugin manifest.

## Global rules
1. **`repo-understanding` first, always.**
2. **`agent-handoff-logger` last, always.**
3. Never touch `src/`, `public/`, `functions/`, `dataconnect/`, or the protected root config files. If a task seems to require it, stop and ask.
4. Do not scaffold Expo or run `npm install` without explicit user go-ahead.
5. Any work touching prescription, payment, or admin flows must also pass `security-compliance-reviewer`.
