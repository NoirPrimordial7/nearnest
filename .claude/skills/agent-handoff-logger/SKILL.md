---
name: agent-handoff-logger
description: Use at the end of every coding session or task. Updates AGENT_LOG.md with what was done, what files were changed, and what the next agent should do first. Always use this before ending a session.
---

# Agent Handoff Logger

Final step of every session. Ensures the next agent (or the human) can resume without re-reading the chat transcript.

## Writes
- `docs/AGENT_LOG.md` — **append** a new dated block (never rewrite history)
- `docs/TODO_NEXT_AGENT.md` — **replace** the top "Next up" section with the new priority list; keep the historical backlog below it

## AGENT_LOG.md entry template
```
## YYYY-MM-DD — <short session title>
**Agent:** <model name>
**Session goal:** <one sentence>

**Files inspected (read-only):**
- path — why

**Files created / edited:**
- path — what changed and why

**Files intentionally NOT touched:**
- path — reason (protected / out of scope)

**Decisions made:** (link to DECISIONS.md entry if any)
**Warnings for next agent:**
- <warning>

**Suggested commit message:**
`<type>(<scope>): <imperative one-liner>`
```

## Rules
- Never delete or mutate prior log entries.
- Absolute dates only (never "today" / "yesterday").
- If a protected file *needed* to be touched but was not, record it as a blocker.
- If tests or lint were not run, say so explicitly — do not claim success.

## Output
Confirmation containing:
1. The new AGENT_LOG entry (verbatim)
2. The new top of TODO_NEXT_AGENT.md
3. A suggested git commit message
