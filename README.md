# Human-AI Agency Platform

Hackathon project with three integrated surfaces:

- `extension/`: MV3 browser extension with on-device scoring and session bridge
- `scorer/`: FastAPI backend for scoring APIs, persistence, history, and insights
- `src/`, `pages/`, `components/`: React/Vite dashboard UI

## Quick Start

### 1) Install UI dependencies

```bash
npm install
```

### 2) Create and activate Python venv

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3) Backend environment setup

Copy and configure env:

```bash
cp .env.example .env
```

Required backend variable:

- `NEON_CONNECTION_STR` (for persistence)

Optional variables:

- `NEON_PROJECT_ID` (resolve DSN dynamically via `neonctl`)
- `INIT_DB_SCHEMA` (default `true`)
- `USE_TEXT_ANALYSIS` (default `false` in runner)
- `APP_HOST` / `APP_PORT` (default `127.0.0.1:8000`)

### 4) Run backend

```bash
./scripts/run_backend.sh
```

Backend runs at `http://127.0.0.1:8000`.

### 5) Run dashboard

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

Dashboard runs at `http://127.0.0.1:5173`.

### 6) Load extension

Load unpacked extension from:

- `extension/`

## Backend Endpoints

- `GET /health`
- `POST /score`
- `POST /session/start`
- `POST /session/events`
- `GET /history`
- `GET /insights`

## Testing

Run backend test suite:

```bash
./scripts/run_ci.sh
```

Run extension reliability checks:

```bash
node extension/parity/test_reliability_patch.mjs
```

## Notes

- Text analysis is additive; backend still returns valid results if disabled.
- Extension scoring supports confidence-aware modes: `full`, `partial`, `unscored`.
- Dashboard is wired to backend history/insights and falls back to local simulation when backend data is unavailable.
