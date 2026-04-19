#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f ".env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source ".env"
  set +a
fi

if [[ -f ".env.local" ]]; then
  set -a
  # shellcheck disable=SC1091
  source ".env.local"
  set +a
fi

if [[ -z "${NEON_CONNECTION_STR:-}" && -n "${NEON_PROJECT_ID:-}" ]]; then
  if command -v npx >/dev/null 2>&1; then
    echo "Resolving NEON_CONNECTION_STR from Neon project ${NEON_PROJECT_ID}..."
    export NEON_CONNECTION_STR="$(npx neonctl@latest connection-string --project-id "${NEON_PROJECT_ID}")"
  else
    echo "warning: npx not found; cannot resolve NEON_CONNECTION_STR from NEON_PROJECT_ID" >&2
  fi
fi

if [[ -z "${NEON_CONNECTION_STR:-}" ]]; then
  echo "warning: NEON_CONNECTION_STR is not set; backend persistence endpoints will return 503." >&2
fi

HOST="${APP_HOST:-127.0.0.1}"
PORT="${APP_PORT:-8000}"
USE_TEXT_ANALYSIS="${USE_TEXT_ANALYSIS:-false}"
INIT_DB_SCHEMA="${INIT_DB_SCHEMA:-true}"
HF_HUB_OFFLINE="${HF_HUB_OFFLINE:-1}"
TRANSFORMERS_OFFLINE="${TRANSFORMERS_OFFLINE:-1}"
export USE_TEXT_ANALYSIS INIT_DB_SCHEMA HF_HUB_OFFLINE TRANSFORMERS_OFFLINE

if [[ -x ".venv/bin/python" ]]; then
  PYTHON_BIN=".venv/bin/python"
else
  PYTHON_BIN="${PYTHON_BIN:-python3}"
fi

echo "Starting scorer API on http://${HOST}:${PORT}"
"$PYTHON_BIN" -m uvicorn scorer.scorer_api:app --host "$HOST" --port "$PORT"
