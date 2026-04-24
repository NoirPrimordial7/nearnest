---
name: security-compliance-reviewer
description: Use before shipping any prescription flow, payment flow, or admin action. Checks that prescription-required medicines cannot be ordered without approval, that admin actions are logged, and that sensitive files are protected.
---

# Security & Compliance Reviewer

Read-only audit skill. Runs before any merge that touches prescriptions, payments, admin actions, or Firebase security rules.

## Reads
- `firestore.rules`, `storage.rules`, `database.rules.json`
- `functions/` (all files)
- Any code under review (web `src/` or `apps/mobile/`) — read-only
- `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`

## Output
A structured audit report. **Never edits source files.**

## Compliance checklist
1. **Prescription gate**
   - [ ] Cannot add a prescription-required medicine to cart without a valid, approved prescription document
   - [ ] Approval state is set by a Cloud Function, not the client
   - [ ] Storefront admin approval is logged with actor uid + timestamp
2. **Payment**
   - [ ] Order totals computed server-side, not client-side
   - [ ] Payment status transitions go through a Cloud Function
   - [ ] No card/PAN data ever stored in Firestore
3. **Admin actions**
   - [ ] Role check enforced by rules AND re-checked in Cloud Functions
   - [ ] Every verification / status change writes a `verificationLogs` or audit entry
4. **Storage**
   - [ ] `storeDocs/` writes restricted by owner/member + contentType
   - [ ] Avatar writes restricted to matching uid
   - [ ] Default-deny fallback present
5. **Auth**
   - [ ] Email verification required for sensitive actions
   - [ ] App Check planned/enabled for prod
6. **Leakage**
   - [ ] No `serviceAccountKey.json` in client bundle or committed to a public branch
   - [ ] No secrets in `VITE_*` env vars beyond public Firebase web config

## Output format
```
## Security review — YYYY-MM-DD
Scope: <branch / feature>
Risk: LOW | MEDIUM | HIGH | BLOCKER

Findings:
- [BLOCKER] …
- [MEDIUM] …
- [INFO] …

Recommendations: …
```
