---
name: run-and-validate
description: Start Law Organizer in the correct mode and validate the baseline health. Use for local startup checks, runbook verification, demo prep, or worker/runtime sanity checks across fast local, container, and rehearsal modes.
---

# Run And Validate

Use this skill when:

- checking that the repo starts
- verifying `RUN.md`
- preparing a local demo or QA pass

## Choose The Correct Mode

- Fast local:
  - `npm run start:all`
  - SQLite-first, API may also run scheduled jobs
- Full local container stack:
  - use `docker-compose.yml` plus `docker-compose.rehearsal.yml`
  - run migrations before starting backend/frontend/worker
- Near-production rehearsal:
  - `./scripts/local-launch-rehearsal.sh`

## What To Validate

1. `GET /health`
2. `GET /readiness`
3. frontend loads on the documented port
4. direct backend API uses `/v1`
5. worker behavior matches the mode:
   - fast local can be single-process
   - split modes require `RUN_SCHEDULED_JOBS=false` on web and `true` on worker

## Repo-Specific Caveats

- The worker is not BullMQ.
- `nginx-proxy` is not a safe default local entrypoint because `nginx.prod.conf` and `ssl/` are missing from the repo.
- SQLite green status does not prove PostgreSQL-only features such as migrated RLS behavior.

## Must Not Do

- do not pretend all run modes are equivalent
- do not describe the worker as a Redis queue consumer
- do not ignore migration requirements in PostgreSQL-backed modes
