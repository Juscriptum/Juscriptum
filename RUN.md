# Law Organizer — How to Run

## Stack

- **Backend:** NestJS 10, TypeORM, Node 20
- **Frontend:** React 18, Vite 5, Redux Toolkit
- **DB:** SQLite (local) / PostgreSQL (Docker)
- **Cache:** Redis (optional; disabled in development by default)
- **Package manager:** npm

---

## 1. Run locally (dev)

### Prerequisites

- Node.js 20 LTS (recommended; other versions may need `npm rebuild better-sqlite3`)
- npm

### Steps

```bash
# Install dependencies
npm install

# Rebuild native module if you use a different Node version than the one used for npm install
npm rebuild better-sqlite3

# Copy env (optional; already has defaults for local)
cp .env.example .env

# Backend: SQLite, no Redis
NODE_ENV=development DB_TYPE=sqlite npm run start

# In another terminal — frontend
npm run start:frontend
```

- **Backend:** http://localhost:3000  
  - Health: http://localhost:3000/health  
  - API: http://localhost:3000/v1/...
- **Frontend:** http://localhost:5173 (Vite proxy to backend)

If you see `SqliteError: near ")": syntax error` on first run, use PostgreSQL (e.g. via Docker) or set `DB_SYNC=false` in `.env` and manage schema yourself.

---

## 2. Run with Docker

### Full stack (Postgres, Redis, MinIO, backend, frontend)

```bash
cp .env.example .env
# Edit .env if needed (DB, Redis, Stripe, etc.)

docker-compose up --build -d

# Optional: run only backend + postgres
docker-compose up -d postgres backend
```

- **Frontend:** http://localhost:80  
- **Backend API:** http://localhost:3000 (or via frontend at /api/…)  
- **Health:** http://localhost:3000/health  
- **PgAdmin:** http://localhost:5050  
- **MinIO Console:** http://localhost:9001  

### Restart

```bash
docker-compose restart backend
# or
docker-compose down && docker-compose up -d
```

---

## 3. Ports

| Service   | Port |
|----------|------|
| Frontend | 80 (Docker), 5173 (Vite dev) |
| Backend  | 3000 |
| Postgres | 5432 |
| Redis    | 6379 |
| MinIO    | 9000 (API), 9001 (Console) |
| PgAdmin  | 5050 |

---

## 4. Health check

```bash
curl http://localhost:3000/health
# => {"status":"ok","timestamp":"..."}
```

---

## 5. Fixes applied in this repo

- Entity relations: `Document` ↔ `Case`, `Case` ↔ `Event` (imports / type-only imports).
- Auth: removed duplicate `ThrottlerModule` from `AuthModule` (global config in `AppModule`).
- Health: added `GET /health` and excluded it from global prefix `v1`.
- API prefix: `v1`; frontend uses `VITE_API_URL=/api` in Docker (nginx proxies `/api` → backend `v1`).
- Redis: optional in dev (`REDIS_ENABLED` defaults to `false` when `NODE_ENV=development`).
- Winston: sync console-only config in `LoggingModule` to avoid startup hang.
- Docker: frontend build from repo root; worker service removed (no `dist/worker.js`); backend uses `DB_TYPE=postgres` and `DATABASE_*` in compose.
- TypeORM: entity path uses `*.entity.js` in build; Postgres env vars `DATABASE_HOST` etc. supported.
- Enterprise: `TenantDatabaseService` supports SQLite for shared datasource when `DB_TYPE=sqlite`.
