# Human-AI Agency Scorer

Hackathon scorer service for estimating human decision agency when working with AI suggestions.

This repo currently focuses on the `scorer/` module (FastAPI + heuristic scoring + additive text analysis).

## What This Service Does

- Computes an `agency_score` in `[0, 100]`
- Computes behavioral `reliance_risk` in `[0, 1]`
- Assigns bands (`low`, `medium`, `high`)
- Assigns `decision_type` (`ai_led`, `mixed`, `user_led`)
- Provides interpretable `drivers` and component breakdown
- Supports text-analysis enrichment (`intent_preservation`, `rewrite_depth`, `ai_origin`) as additive signals

## Project Structure

- `scorer/features.py`: behavioral feature extraction + normalization
- `scorer/heuristic_scorer.py`: primary reliance scorer
- `scorer/agency_formula.py`: final agency score formula
- `scorer/text_analysis.py`: additive text-analysis layer (optional/fallback-safe)
- `scorer/scorer_api.py`: FastAPI endpoints
- `scorer/tests/`: unit and evaluation tests
- `scripts/run_ci.sh`: local/CI runner
- `SCORER_INTEGRATION_CONTRACT.md`: API handoff contract for integration
- `SCORER_DEMO_NOTES.md`: demo framing guardrails

## Quick Start

### 1) Create and activate venv

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 2) Install dependencies

```bash
pip install -r requirements.txt
```

### 3) Run tests

```bash
HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 python -m pytest scorer/tests -q
```

### 4) Start API

```bash
python -m uvicorn scorer.scorer_api:app --host 127.0.0.1 --port 8001
```

## Endpoints

- `GET /health`
- `POST /score`

Health response:

```json
{
  "status": "ok",
  "ml_enabled": false
}
```

For full request/response schema (including canonical + compatibility fields), see:

- [SCORER_INTEGRATION_CONTRACT.md](SCORER_INTEGRATION_CONTRACT.md)

## Operating Modes

- Normal mode (default): `USE_TEXT_ANALYSIS=true`
- Safe mode (fallback): `USE_TEXT_ANALYSIS=false`

Example:

```bash
USE_TEXT_ANALYSIS=false python -m uvicorn scorer.scorer_api:app --host 127.0.0.1 --port 8001
```

When text analysis is disabled/unavailable, scorer still returns valid JSON and sets `text_scores` to `{}`.

## CI / Runner

Run the same flow used by CI:

```bash
./scripts/run_ci.sh
```

GitHub Actions workflow:

- `.github/workflows/ci.yml`

## Integration Notes

- Canonical request fields are preferred, but legacy aliases are supported for teammate compatibility:
  - `accept_latency_ms`, `num_regenerations`, `was_accepted`, `was_rejected`
- Response includes both canonical and compatibility alias fields (`band`, `behavioral_reliance_risk`, `component_breakdown`).

## Demo Framing Guardrails

- `intent_preservation` depends on quality/specificity of `intent_text`.
- `rewrite_depth` measures substantive revision depth, not objective writing quality.

