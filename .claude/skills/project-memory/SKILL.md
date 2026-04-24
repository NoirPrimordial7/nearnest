---
name: project-memory
description: Use to read and update AI memory files before starting or after finishing any task. Ensures continuity between agents and sessions.
---

# Project Memory

Loads and maintains the shared, durable memory for Nearnest so every agent and session starts from the same baseline.

## Always read (at task start)
- `docs/PROJECT_MAP.md` — live map of folders, routes, Firebase surface
- `docs/ARCHITECTURE.md` — intended architecture for web + mobile + Firebase
- `docs/AGENT_LOG.md` — chronological log of prior agent work
- `docs/DECISIONS.md` — locked-in architectural decisions
- `docs/TODO_NEXT_AGENT.md` — prioritized work queue for the next agent

## Always update (at task end)
- `docs/AGENT_LOG.md` — append a dated entry: what was done, files inspected, files created, files NOT touched, warnings
- `docs/TODO_NEXT_AGENT.md` — rewrite the top "Next up" section with the new priority order

## May update when design shifts
- `docs/ARCHITECTURE.md` — when a firebase/mobile/web decision changes
- `docs/DECISIONS.md` — append only; never silently edit prior decisions
- `docs/PROJECT_MAP.md` — when new top-level folders, routes, or collections appear

## Never write
Anything outside `docs/`, `.claude/`, or `apps/mobile/`.

## Output
A short confirmation block:
- **Read:** list of docs/* files loaded
- **Updated:** list of docs/* files written, with a one-line diff summary for each
- **Still-open items promoted to TODO_NEXT_AGENT.md**
