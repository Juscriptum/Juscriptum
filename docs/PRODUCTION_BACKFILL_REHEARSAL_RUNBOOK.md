# Production Backfill Rehearsal Runbook

**Updated:** 2026-03-10  
**Audience:** operator / backend lead / DB owner  
**Applies to:** large-scale backfills for encrypted PII, blind indexes, trust verification state, and future data migrations

## Purpose

This runbook defines how to rehearse a production-scale backfill before running any high-volume rewrite in staging or production.

Use it for:

- encrypted PII rewrites
- blind-index rebuilds
- future trust-provider metadata backfills
- schema/data corrections that touch a large portion of tenant records

## Non-Goals

- this is not the migration implementation itself
- this does not replace application tests
- this does not authorize production execution without backup/restore proof

## Preconditions

- the candidate migration/backfill code is already merged
- targeted unit/integration tests are green
- backup/restore path is available
- isolated rehearsal environment has similar PostgreSQL version and extensions
- rollback owner and go/no-go owner are assigned

## Rehearsal Input Requirements

Prepare these before starting:

- exact git commit SHA to rehearse
- target migration/backfill name
- estimated affected row counts per table
- expected write amplification
- success criteria
- rollback criteria

## Rehearsal Environment

Use an isolated environment populated from a recent backup or masked production clone.

Minimum components:

- PostgreSQL
- Redis if the application path depends on it
- backend
- worker

Optional but recommended:

- frontend
- ClamAV/runtime dependencies
- provider sandbox credentials

## Step-By-Step Procedure

### 1. Capture baseline

Record:

- database size
- row counts for affected tables
- current app version / image tags
- `GET /health`
- `GET /readiness`

For PII-related rehearsals also capture:

- login by email
- client exact-match search by email/phone/EDRPOU/INN

### 2. Restore clone

- restore from the latest acceptable backup
- boot backend and worker against the restored DB
- confirm baseline reads work before any rewrite begins

### 3. Dry-run planning

Before the real backfill:

- compute row counts that will be touched
- decide batch size
- estimate total runtime
- define commit cadence
- define pause/resume checkpoint format

Recommended batch controls:

- primary-key ordered batches
- explicit transaction per batch
- no full-table rewrite in one transaction
- operator-visible progress after each batch

### 4. Execute rehearsal

Run the backfill using the exact commands or maintenance container intended for staging/production.

Record during execution:

- batch number
- table
- id range
- rows processed
- per-batch duration
- errors/retries
- DB CPU and lock symptoms
- app readiness during the run

### 5. Validate application behavior

After the backfill completes:

- restart backend and worker if the procedure requires it
- verify `GET /health` returns `200`
- verify `GET /readiness` returns `200`
- verify the exact application paths impacted by the rewrite

Minimum post-run checks for current encrypted/blind-indexed PII:

- user login by email
- password reset lookup by email
- organization lookup by email
- client exact-match search by:
  - email
  - phone
  - EDRPOU
  - INN
- create new client with searchable PII
- update existing client searchable PII

### 6. Rollback rehearsal

Do not skip this.

- restore the pre-run backup into a fresh isolated target
- boot backend and worker
- verify `GET /health` and `GET /readiness`
- re-run the same smoke checks used in baseline validation

The rehearsal is incomplete if rollback is not proven.

## Go / No-Go Criteria

Approve staging/production execution only if all are true:

- no data corruption observed
- targeted user flows remain correct
- runtime stays healthy enough during the batch process
- operator can stop and resume safely
- rollback was executed successfully
- measured runtime fits the planned maintenance window

Reject or redesign if any are true:

- long-running locks block normal application behavior
- readiness becomes unstable for sustained periods
- search/login semantics regress
- rollback cannot be completed inside the expected window

## Current Project-Specific Targets

These are the most relevant current rehearsal candidates:

1. Blind-index key rotation / full encrypted PII rewrite
2. Re-run of `1710300000000-EncryptSensitivePiiFields.ts`-style bulk encryption logic on production-scale data
3. Re-run of `1710310000000-EncryptSearchablePiiWithBlindIndexes.ts`-style blind-index rebuild on production-scale data
4. Any future trust-provider normalization/backfill affecting `user_identities`, `document_signatures`, or `trust_verification_jobs`

## Evidence To Save

- commit SHA
- backup identifier
- rehearsal environment identifier
- start/end timestamps
- total processed row counts
- per-table duration
- readiness snapshots before/during/after
- rollback execution evidence
- operator notes on bottlenecks

## Current Limitation

This repository now has the migration code and runbook guidance, but not an operator script for generic resumable backfills. If repeated production-scale rewrites become common, add a dedicated maintenance command with:

- checkpoint persistence
- batch-size flags
- dry-run mode
- structured progress output
