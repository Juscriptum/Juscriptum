#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_HEALTH_URL="${BACKEND_HEALTH_URL:-http://localhost:3000/health}"
MAX_ATTEMPTS="${BACKEND_START_MAX_ATTEMPTS:-90}"
SLEEP_SECONDS="${BACKEND_START_SLEEP_SECONDS:-2}"

for attempt in $(seq 1 "${MAX_ATTEMPTS}"); do
  status="$(curl -s -o /dev/null -w '%{http_code}' "${BACKEND_HEALTH_URL}" || true)"

  if [[ "${status}" == "200" ]]; then
    printf 'Backend is ready at %s. Starting Vite.\n' "${BACKEND_HEALTH_URL}"
    cd "${ROOT_DIR}"
    exec npm run start:frontend
  fi

  printf 'Waiting for backend (%s), attempt %s/%s...\n' \
    "${BACKEND_HEALTH_URL}" \
    "${attempt}" \
    "${MAX_ATTEMPTS}"
  sleep "${SLEEP_SECONDS}"
done

printf 'Timed out waiting for backend at %s\n' "${BACKEND_HEALTH_URL}" >&2
exit 1
