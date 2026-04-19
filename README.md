# Human-AI Agency Dashboard

## Backend Environment Wiring (Neon)

The backend reads Neon connection settings from environment variables:

- `NEON_CONNECTION_STR` (required for persistence)
- `INIT_DB_SCHEMA` (default `true`)
- `USE_TEXT_ANALYSIS` (default `false` in runner)
- `APP_HOST` / `APP_PORT` (default `127.0.0.1:8000`)

### 1) Create local env file

```bash
cp .env.example .env
```

Then fill `NEON_CONNECTION_STR` in `.env`.

### 2) Run backend with env wiring

```bash
./scripts/run_backend.sh
```

This script:

- loads `.env` and `.env.local` if present
- optionally resolves `NEON_CONNECTION_STR` via `NEON_PROJECT_ID` + `neonctl`
- starts `uvicorn` for `scorer.scorer_api:app`

### 3) Optional dynamic connection string

If you prefer not to store DSN directly, set this in `.env`:

```bash
NEON_PROJECT_ID=<your-neon-project-id>
```

`scripts/run_backend.sh` will resolve `NEON_CONNECTION_STR` at runtime using:

```bash
npx neonctl@latest connection-string --project-id <project-id>
```
