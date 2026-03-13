#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARTIFACT_DIR="${ROOT_DIR}/tmp/launch-rehearsal"
BACKUP_PATH="${ARTIFACT_DIR}/backup.sql"
HEALTH_PATH="${ARTIFACT_DIR}/health.json"
READINESS_HEALTHY_PATH="${ARTIFACT_DIR}/readiness-healthy.json"
READINESS_DEGRADED_PATH="${ARTIFACT_DIR}/readiness-degraded.json"
READINESS_RESTORED_PATH="${ARTIFACT_DIR}/readiness-restored.json"
HTTP_STATUS_PATH="${ARTIFACT_DIR}/http-status.txt"

mkdir -p "${ARTIFACT_DIR}"

export ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-http://localhost:8080,http://localhost:3000}"
export MALWARE_SCANNER_MODE="${MALWARE_SCANNER_MODE:-stub}"
export REDIS_ENABLED="${REDIS_ENABLED:-true}"
export RESTORE_DB_NAME="${RESTORE_DB_NAME:-law_organizer_restore}"

if [[ -z "${ENCRYPTION_KEY:-}" ]]; then
  if command -v openssl >/dev/null 2>&1; then
    export ENCRYPTION_KEY="$(openssl rand -hex 32)"
  else
    export ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
  fi
fi

: "${DB_USER:=postgres}"
: "${DB_NAME:=law_organizer}"
: "${DB_PASSWORD:?DB_PASSWORD is required}"
: "${REDIS_PASSWORD:?REDIS_PASSWORD is required}"
: "${JWT_SECRET:?JWT_SECRET is required}"
: "${JWT_REFRESH_SECRET:?JWT_REFRESH_SECRET is required}"
: "${APP_URL:?APP_URL is required}"
: "${SMTP_HOST:?SMTP_HOST is required}"
: "${SMTP_PORT:?SMTP_PORT is required}"
: "${SMTP_USER:?SMTP_USER is required}"
: "${SMTP_PASSWORD:?SMTP_PASSWORD is required}"
: "${AWS_SECRET_ACCESS_KEY:?AWS_SECRET_ACCESS_KEY is required}"

COMPOSE_ARGS=(
  -f "${ROOT_DIR}/docker-compose.yml"
  -f "${ROOT_DIR}/docker-compose.rehearsal.yml"
)

wait_for_http() {
  local url="$1"
  local expected_status="${2:-200}"

  for _ in $(seq 1 90); do
    local status
    status="$(curl -s -o /dev/null -w '%{http_code}' "${url}" || true)"
    if [[ "${status}" == "${expected_status}" ]]; then
      return 0
    fi
    sleep 2
  done

  echo "Timed out waiting for ${url} to return ${expected_status}" >&2
  return 1
}

capture_json() {
  local url="$1"
  local output_path="$2"
  curl -fsS "${url}" | tee "${output_path}" >/dev/null
}

docker compose "${COMPOSE_ARGS[@]}" up -d --build postgres redis minio backend frontend redis-worker

wait_for_http "http://localhost:3000/health" 200
wait_for_http "http://localhost:3000/readiness" 200

capture_json "http://localhost:3000/health" "${HEALTH_PATH}"
capture_json "http://localhost:3000/readiness" "${READINESS_HEALTHY_PATH}"

docker compose "${COMPOSE_ARGS[@]}" stop redis
wait_for_http "http://localhost:3000/readiness" 503
curl -sS -o "${READINESS_DEGRADED_PATH}" -w '%{http_code}\n' "http://localhost:3000/readiness" > "${HTTP_STATUS_PATH}"
docker compose "${COMPOSE_ARGS[@]}" start redis
wait_for_http "http://localhost:3000/readiness" 200

docker compose "${COMPOSE_ARGS[@]}" exec -T postgres \
  pg_dump -U "${DB_USER}" -d "${DB_NAME}" > "${BACKUP_PATH}"

docker compose "${COMPOSE_ARGS[@]}" up -d postgres-restore

for _ in $(seq 1 60); do
  if docker compose "${COMPOSE_ARGS[@]}" exec -T postgres-restore \
    pg_isready -U "${DB_USER}" -d "${RESTORE_DB_NAME}" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

cat "${BACKUP_PATH}" | docker compose "${COMPOSE_ARGS[@]}" exec -T postgres-restore \
  psql -U "${DB_USER}" -d "${RESTORE_DB_NAME}" >/dev/null

docker compose "${COMPOSE_ARGS[@]}" up -d backend-restore
wait_for_http "http://localhost:3001/health" 200
wait_for_http "http://localhost:3001/readiness" 200
capture_json "http://localhost:3001/readiness" "${READINESS_RESTORED_PATH}"

printf 'Artifacts written to %s\n' "${ARTIFACT_DIR}"
