---
name: project-audit
description: Audit this repository before major changes when docs may be stale or contradictory. Use for unfamiliar repo state, structural proposals, or truth-reconciliation work. Read AGENTS.md, RUN.md, CLAUDE.md, package.json, and the relevant runtime files before trusting existing docs.
---

# Project Audit

Use this skill when:

- starting work after a gap
- docs look stale or conflict with code
- planning structural or operational changes

## Steps

1. Read `AGENTS.md`, `RUN.md`, and `CLAUDE.md`.
2. Read `package.json`, `src/app.module.ts`, `src/main.ts`, and `src/worker.ts`.
3. If runtime or deployment matters, inspect:
   - `docker-compose.yml`
   - `docker-compose.rehearsal.yml`
   - `k8s/`
4. Verify the current truth for:
   - database mode
   - worker model
   - route prefix and health endpoints
   - migration path
   - RLS and tenant isolation
   - storage and provider assumptions
5. Summarize:
   - what is actually built
   - what is outdated
   - the smallest safe correction set

## Validation Standard

- Do not trust docs without code confirmation.
- Prefer concrete contradictions over generic summaries.
- Treat old audit docs as historical unless they are explicitly current.

## Must Not Do

- do not auto-refactor large areas during the audit
- do not preserve contradictory claims just because they already exist
- do not invent infrastructure that is not in the repo
