---
name: fix-and-verify
description: Make a targeted change in this repo and verify it with the smallest relevant real commands. Use for bug fixes, operational cleanups, doc+code alignment, and behavior changes that must be recorded honestly.
---

# Fix And Verify

Use this skill when:

- implementing a focused fix
- aligning docs with code
- closing a specific inconsistency

## Steps

1. Define the exact scope before editing.
2. Change only the files required for that scope.
3. If behavior, runtime, or validation expectations changed, update:
   - `CLAUDE.md`
   - `docs/PROJECT_CONTEXT_CACHE.md`
   - any relevant run/security/deployment doc
4. Run the smallest real verification that matches the change:
   - backend: `npm run build`
   - frontend: `npm run build:frontend`
   - cross-cutting/security/runtime: `npm run lint`, targeted tests, and add `npm run test:e2e -- --runInBand` when routes/contracts changed
5. Report what changed, what was actually verified, and what remains unproven.

## Validation Standard

- Record only commands that were really run.
- Distinguish local verification from staging or production proof.
- Prefer targeted tests over broad claims.

## Must Not Do

- do not silently expand the task
- do not say “fixed” without verification
- do not skip documentation updates when behavior or operational truth changed
