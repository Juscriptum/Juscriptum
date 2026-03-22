# Law Organizer Runbook

This runbook favors operational clarity over “one command” optimism.

## Before You Start

- Node.js 20 and npm are the expected local runtime
- Docker is optional but required for the containerized modes
- The app loads `.env.local` first and then `.env`
- Docker builds expect the checked-in `package-lock.json`; keep it present in the repo and in the Docker build context so the image build can use `npm ci`
- Direct backend routes use `/v1`
- `GET /health` and `GET /readiness` stay outside `/v1`
- Frontend dev uses `/api` only as a proxy to backend `/v1`

## Mode 1: Fast Local Mode

Use this when you need the fastest edit/run loop.

### What It Uses

- backend on Nest watch mode
- frontend on Vite
- local SQLite by default
- scheduled jobs stay off in the default API dev scripts to keep local resource usage down

### Commands

```bash
npm install
npm run start:all
```

Equivalent split-terminal flow:

```bash
npm run start:dev
npm run start:frontend:wait-backend
```

Run the dedicated local worker only when you need background jobs:

```bash
npm run start:worker:dev
```

### Expected URLs

- Frontend: `http://localhost:5173`
- Platform-admin entry: `http://localhost:5173/platform-admin.html`
- Backend health: `http://localhost:3000/health`
- Backend readiness: `http://localhost:3000/readiness`
- Direct backend API: `http://localhost:3000/v1/...`

### Validation Checklist

```bash
curl http://localhost:3000/health
curl http://localhost:3000/readiness
```

Confirm:

- health returns `200`
- frontend loads on port `5173`
- the separate platform-admin surface is reachable at `/platform-admin.html` for first-owner bootstrap, dedicated login, and MFA setup outside the tenant SPA
- API requests from the frontend proxy reach backend `/v1`

### Caveats

- This mode does not prove PostgreSQL-only behavior such as migrated RLS paths.
- This mode does not prove split web/worker behavior.
- SQLite uses `synchronize: true`, which is a local convenience, not the production-like path.
- `npm run start:dev` and `npm run start:all` set `RUN_SCHEDULED_JOBS=false`; use `npm run start:worker:dev` when you need scheduled/background processing locally.
- `platform-admin.html` now supports first-owner bootstrap, dedicated login, MFA verification, MFA enrollment, and local safe dashboard/organizations read models, but it still does not include platform-admin audit tables or a PostgreSQL-proven privileged read path for tenant metadata.

## Mode 2: Full Local Container Stack

Use this when you want local Postgres, Redis, MinIO, backend, frontend, and the dedicated worker.

### What It Uses

- `docker-compose.yml`
- `docker-compose.rehearsal.yml`
- backend with `RUN_SCHEDULED_JOBS=false`
- worker with `RUN_SCHEDULED_JOBS=true`

### Safe Startup Sequence

Build and start the stateful dependencies first:

```bash
docker compose -f docker-compose.yml -f docker-compose.rehearsal.yml up -d --build postgres redis minio
```

Apply migrations from the backend image:

```bash
docker compose -f docker-compose.yml -f docker-compose.rehearsal.yml run --rm backend npm run migration:run
```

Start the application services:

```bash
docker compose -f docker-compose.yml -f docker-compose.rehearsal.yml up -d backend frontend redis-worker
```

### Expected URLs

- Frontend: `http://localhost:8080`
- Backend health: `http://localhost:3000/health`
- Backend readiness: `http://localhost:3000/readiness`
- Direct backend API: `http://localhost:3000/v1/...`

### Validation Checklist

```bash
curl http://localhost:3000/health
curl http://localhost:3000/readiness
```

Confirm:

- health returns `200`
- readiness returns `200`
- frontend loads on port `8080`
- background jobs are handled by `redis-worker`, not by the web container

### Important Caveats

- The worker service name is historical. It is not a BullMQ/Redis queue worker.
- The current worker is a dedicated Nest context that polls DB-backed jobs on a schedule.
- The checked-in `nginx-proxy` service is not repo-complete because these paths are missing:
  - `nginx.prod.conf`
  - `ssl/`
- Because of that, do not use `nginx-proxy` as the default local entrypoint from this repo.

## Mode 3: Near-Production Rehearsal

Use this when you want a repeatable local rehearsal of health, degraded readiness, and restore flow.

### Command

```bash
./scripts/local-launch-rehearsal.sh
```

### What It Does

- starts the containerized local stack
- captures healthy `/health` and `/readiness`
- simulates Redis degradation and captures degraded readiness
- restores readiness
- creates a Postgres backup and restore flow
- writes artifacts to `tmp/launch-rehearsal`

### Required Environment

The script expects real values for at least:

- `DB_PASSWORD`
- `REDIS_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `APP_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `AWS_SECRET_ACCESS_KEY`

### Validation Checklist

After the script completes, review:

- `tmp/launch-rehearsal/health.json`
- `tmp/launch-rehearsal/readiness-healthy.json`
- `tmp/launch-rehearsal/readiness-degraded.json`
- `tmp/launch-rehearsal/readiness-restored.json`
- `tmp/launch-rehearsal/backup.sql`

## Staging Prep Pack

Use this when the goal is to move from local verification to a controlled staging rollout with a reduced day-one scope.

Starting artifacts:

- `docs/DAY_ONE_SCOPE_AND_STAGING_PREP.md`
- `.env.staging.example`

Recommended assumptions for this pack:

- trust providers stay in `stub` mode
- Stripe and WayForPay stay out of scope unless explicitly re-added
- SMS and push stay out of scope
- staging proves:
  - PostgreSQL migrations
  - Redis-backed throttling
  - dedicated worker split
  - object storage
  - real ClamAV command execution
  - real PDF/OCR runtime
  - SMTP-backed email for essential flows

Important boundary:

- this pack prepares staging and a reduced first-launch scope
- it does not by itself prove full public-launch readiness

## Build, Test, And Verification Commands

```bash
npm run build
npm run build:frontend
npm run lint
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run test:frontend:smoke
```

Use targeted helpers when relevant:

```bash
npm run build:registry-index
npm run update:external-data -- --dry-run
```

These helper scripts load `.env.local` and `.env` directly, with `.env.local` overriding `.env`, so one-off registry/external-data runs see the same URL settings as the main app runtime.

Shared registry import notes:

- `storage/registry-index.db` is the shared cross-user SQLite cache for `court_stan` and `court_dates`; it is not tenant-scoped
- `storage/asvp-index.db` is the dedicated cross-user ASVP metadata/cache state SQLite database; it is also not tenant-scoped
- `storage/asvp-index-shards/asvp-YYYY.db` stores the actual indexed ASVP rows in yearly SQLite shard files
- `npm run build:registry-index -- --source=court_stan|court_dates|asvp --force` imports each source into its current cache layout; `ASVP` now reads either raw root CSVs or streamed year files from `asvp/split/asvp-YYYY.csv` and writes rows into yearly shard databases keyed by `VP_BEGINDATE`
- by default, successfully imported `court_stan`, `court_dates`, and `asvp` source CSVs are deleted after the SQLite commit for their target cache; drop a fresh full snapshot into the corresponding source directory before the next import cycle if you want to refresh the index
- when a source directory is empty after a consumed import, the last successful SQLite index for that source is kept instead of being cleared
- tune chunking / cleanup with:
  - `COURT_STAN_PRE_SPLIT_MIN_BYTES`
  - `COURT_STAN_SPLIT_ROWS_PER_FILE`
  - `COURT_STAN_DELETE_IMPORTED_FILES=false`
  - `COURT_DATES_PRE_SPLIT_MIN_BYTES`
  - `COURT_DATES_SPLIT_ROWS_PER_FILE`
  - `COURT_DATES_DELETE_IMPORTED_FILES=false`
  - `ASVP_PRE_SPLIT_MIN_BYTES`
  - `ASVP_SPLIT_ROWS_PER_FILE`
  - `ASVP_DELETE_IMPORTED_FILES=false`
- auto-start triggers for registry imports and rebuilds:
  - on first startup when local source files are present and external-data URLs are not configured
  - on first startup through external-data bootstrap when external URLs are configured
    this path now writes `ASVP` from `data.gov.ua` into `asvp/split/asvp-YYYY.csv`, triggers the yearly shard rebuild, and avoids keeping a full raw `ASVP` CSV in the workspace; for the current large ZIP payload it now prefers a temp archive assembled by resumable `Range` chunks in the OS temp directory and deletes that temp archive after the run
  - daily at `10:00` fixed `+01:00`
  - on new or changed CSV detection in `court_stan/`, `court_dates/`, or `asvp/` via the source monitor
- tune the source monitor with:
  - `REGISTRY_SOURCE_MONITOR_INTERVAL_MS`

## Worker Behavior Summary

- Fast local mode:
  - API keeps scheduled jobs off by default in `npm run start:dev` and `npm run start:all`
  - run `npm run start:worker:dev` when you need local scheduled/background execution
- Split/containerized modes:
  - web/API must use `RUN_SCHEDULED_JOBS=false`
  - worker must use `RUN_SCHEDULED_JOBS=true`
- Current worker model:
  - dedicated Nest application context
  - `@nestjs/schedule`
  - DB-backed polling tables
  - not BullMQ

## Truth Boundaries

- Local green status is not enough to call the repo production-ready.
- PostgreSQL-only behavior must be validated on PostgreSQL.
- Real provider, scanner, OCR/runtime, and staging drills are still separate evidence tracks.
