# Nearnest AI Handoff Protocol

Purpose: keep Claude Code and Codex coordinated while the mobile/backend planning work proceeds.

## Required startup sequence
1. Read `AGENTS.md` or `CLAUDE.md` for Graphify instructions.
2. Read `graphify-out/GRAPH_REPORT.md` before answering architecture or codebase questions.
3. Read these project-memory docs before planning or editing:
   - `docs/PROJECT_MAP.md`
   - `docs/ARCHITECTURE.md`
   - `docs/DECISIONS.md`
   - `docs/MOBILE_APP_PLAN.md`
   - `docs/DESIGN_SYSTEM.md`
   - `docs/TODO_NEXT_AGENT.md`
   - `docs/SESSION_STATE.md`
4. Check `git status --short` before edits and preserve unrelated user changes.

## Edit boundaries
Current coordination phase allows only Graphify and handoff files. Do not edit:
- `src/**`
- `functions/**`
- `dataconnect/**`
- `apps/mobile/**`
- package files
- Firebase rules/config
- `.env*`
- `serviceAccountKey.json`

If a future user explicitly authorizes code work, update this protocol and `docs/SESSION_STATE.md` before starting.

## Graphify use
- Current graph output lives in `graphify-out/`.
- Current CLI indexing command is `graphify update .`.
- The user-requested `graphify .` command failed on this installed CLI with `unknown command '.'`; keep using `graphify update .` unless the CLI changes.
- Rebuild the graph after code changes. For documentation-only changes, rebuild only when the user requests it or when handoff value outweighs noise.

## Handoff rules
Every AI session should end by updating:
- `docs/AGENT_LOG.md` with what changed, commands run, errors, and protected files not touched.
- `docs/TODO_NEXT_AGENT.md` with the next concrete step.
- `docs/SESSION_STATE.md` with current graph/setup state.

## Conflict handling
- Newest user instruction wins.
- If Graphify writes outside the allowed file set, stop and either remove only the unintended new file or ask the user before preserving it.
- Never silently modify app source, Cloud Functions, Firebase rules, package files, env files, or `apps/mobile/**` during coordination-only work.
