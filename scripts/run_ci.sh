#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

VENV_DIR="${VENV_DIR:-.venv}"
PYTHON_BIN="${PYTHON_BIN:-python3}"

if [[ ! -d "$VENV_DIR" ]]; then
  "$PYTHON_BIN" -m venv "$VENV_DIR"
fi

if [[ "${UPGRADE_PIP:-0}" == "1" ]]; then
  "$VENV_DIR/bin/python" -m pip install --upgrade pip
fi

"$VENV_DIR/bin/pip" install -r requirements.txt

# Keep CI deterministic and avoid first-run model downloads.
HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 "$VENV_DIR/bin/python" -m pytest scorer/tests -q
