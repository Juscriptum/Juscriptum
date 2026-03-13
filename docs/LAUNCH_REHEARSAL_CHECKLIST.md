# Launch Rehearsal Checklist

**Updated:** 2026-03-11
**Scope:** Monitoring, alerting, and evidence-based staging readiness

This checklist distinguishes between controls that are now proven in code/runtime and steps that still require an operator to execute them in staging or production.

## Proven In Code

- Backend liveness endpoint exists at `GET /health`.
- Backend readiness endpoint exists at `GET /readiness`.
- Local production-like rehearsal harness now exists in:
  - `docker-compose.rehearsal.yml`
  - `scripts/local-launch-rehearsal.sh`
- The rehearsal harness now covers:
  - backend/frontend port exposure for local operator checks
  - isolated restore PostgreSQL + restore backend boot path
  - single-run scheduler topology (`RUN_SCHEDULED_JOBS=false` on web, `true` on worker)
  - production env alias compatibility for both `DB_*` and `DATABASE_*`
- `GET /readiness` now reports:
  - database ping status/latency
  - Redis ping status/latency or explicit `disabled`
  - auth abuse signal via locked-account count
  - trust-verification worker backlog/failure counts
  - malware-scan backlog/failure/infected-upload counts
  - outbox backlog/dead-letter-risk counts
  - billing anomaly counts (`past_due` / `unpaid`)
- Readiness now returns `503` when the platform is degraded or unhealthy.
- Cross-tenant/data-isolation denials are now classified into structured security events in the global exception filter.
- A scheduled operational monitor now emits structured security alerts for:
  - locked accounts
  - trust-verification failures/backlog
  - malware scan failures/backlog
  - infected uploads
  - outbox delivery backlog/dead-letter risk
  - billing anomalies

## Staging Checklist

### Deploy / Boot

- [ ] Deploy backend, frontend, worker, PostgreSQL, and Redis manifests to staging.
- [ ] Confirm `GET /health` returns `200`.
- [ ] Confirm `GET /readiness` returns `200` on a healthy staging stack.
- [ ] Confirm `GET /readiness` returns `503` when Redis, PostgreSQL, or worker backlogs are intentionally degraded.

### Migrations / Data Safety

- [ ] Run migrations on a staging clone before application rollout.
- [ ] Confirm startup completes with environment validation enabled.
- [ ] Confirm encrypted/blind-indexed PII fields can still be read through supported API flows after migration.
- [ ] Rehearse blind-index key rotation using [BLIND_INDEX_KEY_ROTATION_RUNBOOK.md](/Users/edhar/Documents/Адвокатська практика/Сайт Органайзер Юриста/Project Z Code/docs/BLIND_INDEX_KEY_ROTATION_RUNBOOK.md).
- [ ] Rehearse production-scale backfill using [PRODUCTION_BACKFILL_REHEARSAL_RUNBOOK.md](/Users/edhar/Documents/Адвокатська практика/Сайт Органайзер Юриста/Project Z Code/docs/PRODUCTION_BACKFILL_REHEARSAL_RUNBOOK.md).

### Auth / Isolation / Abuse

- [ ] Verify login, logout, logout-all, password reset, and revoked-token rejection.
- [ ] Verify tenant isolation by attempting cross-tenant access and confirming:
  - request denial
  - structured `tenant_context_violation_detected` or `data_isolation_violation_detected` event in logs/Sentry
- [ ] Verify repeated failed logins produce account lockout and readiness reflects non-zero locked-account count.

### Workers / Documents / Billing

- [ ] Verify trust-verification jobs move through queued -> completed/retrying and readiness reflects backlog correctly.
- [ ] Verify malware scan jobs move through pending -> clean/infected/failed and infected uploads trigger alert events.
- [ ] Verify outbox backlog or forced publish failures surface in readiness.
- [ ] Verify a `past_due` or `unpaid` subscription is visible in readiness/alerts.

### Backup / Restore

- [ ] Run a PostgreSQL backup in staging or production-like infrastructure.
- [ ] Restore that backup into an isolated environment.
- [ ] Confirm the restored environment can boot and serve `GET /readiness`.

## Not Proven In This Workspace

- Actual execution of `scripts/local-launch-rehearsal.sh` in this session was blocked by an unavailable Docker daemon (`Cannot connect to /Users/edhar/.docker/run/docker.sock`).
- Real staging Kubernetes deployment health
- Production-like Redis/PostgreSQL outage drills
- Backup/restore execution evidence
- Real Sentry/on-call delivery outside local structured logs
- Live ACSK/Diia/BankID external-provider operations
- Real ClamAV runtime deployment rehearsal
- Real SMTP/SMS/push provider delivery proof (current notification workflow is queue/state-complete locally, but outbound transport integration is still not exercised against live providers)
- Blind-index key rotation on a restored production-like dataset
- Large-scale backfill pause/resume and rollback evidence
