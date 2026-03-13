# Blind-Index Key Rotation Runbook

**Updated:** 2026-03-10  
**Audience:** operator / SRE / backend lead  
**Applies to:** encrypted searchable PII backed by `ENCRYPTION_KEY`

## Purpose

This runbook describes how to rotate the key material that currently drives:

- AES-256-GCM field encryption via `encryptFieldValue`
- blind-index generation via `createBlindIndex`

Current implementation detail:

- both encryption and blind-index HMAC derive from the same `ENCRYPTION_KEY`
- the key must be a 64-character hex string
- searchable blind indexes are used for:
  - `organizations.email_blind_index`
  - `users.email_blind_index`
  - `clients.email_blind_index`
  - `clients.phone_blind_index`
  - `clients.edrpou_blind_index`
  - `clients.inn_blind_index`

Because the application does not yet support dual-read / dual-write key slots, key rotation is a controlled maintenance event and must include a full data rewrite/backfill.

## Preconditions

- maintenance window approved
- fresh PostgreSQL backup completed and verified
- isolated restore environment available
- staging rehearsal completed first using the same procedure
- `ENCRYPTION_KEY` replacement generated and stored in the secret manager
- rollback owner assigned

## Risks

- changing `ENCRYPTION_KEY` before re-encryption makes existing ciphertext unreadable
- changing `ENCRYPTION_KEY` before blind-index rebuild breaks exact-match search on encrypted PII
- partial execution can leave mixed encrypted payloads and stale blind indexes

## Rotation Strategy

Use a stop-the-world rotation for now.

1. Freeze writes.
2. Back up production.
3. Restore into isolated rehearsal environment and validate the procedure there.
4. Run an offline re-encryption + blind-index rebuild against production data while application writes remain disabled.
5. Boot the application with the new key.
6. Verify supported read/search flows.

## Step-By-Step Procedure

### 1. Freeze traffic

- put frontend in maintenance mode or remove public ingress
- stop background workers that mutate encrypted entities
- confirm no write jobs are still draining

Suggested commands:

```bash
kubectl scale deployment/law-organizer-backend --replicas=0 -n law-organizer
kubectl scale deployment/law-organizer-worker --replicas=0 -n law-organizer
```

If ingress-level maintenance is preferred, keep one backend replica only for operator checks and block public writes externally.

### 2. Take backup

Follow the backup flow from [DEPLOYMENT.md](/Users/edhar/Documents/Адвокатська практика/Сайт Органайзер Юриста/Project Z Code/docs/DEPLOYMENT.md).

Minimum evidence to capture:

- backup object name
- timestamp
- operator
- restore target

### 3. Rehearse on isolated restore first

- restore the fresh backup into an isolated PostgreSQL instance
- run the rotation there before touching production
- verify:
  - login by email still works
  - organization lookup by email still works
  - client search by email/phone/EDRPOU/INN still works
  - encrypted fields are readable in supported API flows

### 4. Prepare rotation script inputs

You need:

- old key: current `ENCRYPTION_KEY`
- new key: replacement `ENCRYPTION_KEY`
- table/column inventory from:
  - `src/database/migrations/1710300000000-EncryptSensitivePiiFields.ts`
  - `src/database/migrations/1710310000000-EncryptSearchablePiiWithBlindIndexes.ts`

Fields that must be rewritten:

- `organizations.email`, `tax_number`, `phone`, `address`
- `users.email`, `phone`, `mfa_secret`, `bar_number`
- `clients.email`, `phone`, `edrpou`, `inn`, `secondary_phone`, `address`, `postal_code`, `passport_number`, `notes`

Blind indexes that must be recomputed:

- `organizations.email_blind_index`
- `users.email_blind_index`
- `clients.email_blind_index`
- `clients.phone_blind_index`
- `clients.edrpou_blind_index`
- `clients.inn_blind_index`

### 5. Run offline rewrite

Use a one-off operator script or maintenance container that:

1. reads plaintext by decrypting with the old key
2. re-encrypts with the new key
3. recomputes blind indexes with the new key
4. updates rows in deterministic batches

Batching rules:

- process in primary-key order
- keep batch size small enough to avoid long row locks
- persist progress after every committed batch
- log row counts only; never log plaintext values

Recommended audit fields per batch:

- table name
- batch start/end ids
- row count
- started_at / finished_at
- success / failure

### 6. Swap application secret

After the full rewrite succeeds:

- update Kubernetes secret / secret-manager entry for `ENCRYPTION_KEY`
- restart backend and worker deployments

Suggested commands:

```bash
kubectl rollout restart deployment/law-organizer-backend -n law-organizer
kubectl rollout restart deployment/law-organizer-worker -n law-organizer
kubectl rollout status deployment/law-organizer-backend -n law-organizer
kubectl rollout status deployment/law-organizer-worker -n law-organizer
```

### 7. Post-rotation verification

Run all of these before reopening writes:

- `GET /health` returns `200`
- `GET /readiness` returns `200`
- login by encrypted email works
- password reset lookup by email works
- client exact-match search works for:
  - email
  - phone
  - EDRPOU
  - INN
- create/update client still stores searchable PII correctly

### 8. Reopen traffic

- re-enable ingress
- scale app/worker to normal replica count
- monitor auth errors, client search failures, and readiness degradation for at least one hour

## Rollback

Rollback trigger examples:

- unreadable encrypted fields
- email-based login lookup failures
- client exact-match search failures on blind-indexed fields
- unexpected readiness degradation tied to data access

Rollback path:

1. stop app/worker again
2. restore the pre-rotation backup
3. restore the previous `ENCRYPTION_KEY`
4. verify `GET /health`, `GET /readiness`, login, and client lookup
5. only then reopen traffic

## Evidence To Attach

- backup object id
- restored rehearsal environment id
- batch rewrite logs with row counts only
- post-rotation verification output
- reopen timestamp

## Current Limitation

This runbook is intentionally conservative because the codebase does not yet support:

- multiple active encryption keys
- key version tagging for blind indexes
- online dual-write/dual-read rotation
