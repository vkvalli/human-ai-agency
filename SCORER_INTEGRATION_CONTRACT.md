# Scorer Integration Contract (Current)

This document is the integration source of truth for backend/extension/dashboard teams.

## Endpoints

- `GET /health`
- `POST /score`

## Health Response

```json
{
  "status": "ok",
  "ml_enabled": false
}
```

- `ml_enabled` reflects `USE_ML_SCORER` env flag only.
- ML scorer is optional and not required for demo flow.

## Score Request

### Canonical fields

```json
{
  "ai_text": "string",
  "final_text": "string",
  "intent_text": "string (optional)",
  "latency_ms": 7000,
  "accept_count": 0,
  "reject_count": 0,
  "regen_count": 1,
  "accepted": true,
  "rejected": false,
  "confidence": 0.6
}
```

### Supported legacy aliases

- `accept_latency_ms` -> `latency_ms`
- `num_regenerations` -> `regen_count`
- `was_accepted` -> `accepted`
- `was_rejected` -> `rejected`

## Score Response

### Canonical fields (use these first)

```json
{
  "agency_score": 68,
  "agency_band": "medium",
  "reliance_risk": 0.68,
  "reliance_band": "medium",
  "decision_type": "mixed",
  "drivers": ["high AI adoption ratio", "substantial manual additions"],
  "text_scores": {
    "intent_preservation": null,
    "rewrite_depth": 0.45,
    "ai_origin": 0.72
  },
  "components": {
    "R": 0.68,
    "S": 0.889,
    "Q": 0.0,
    "E": 0.393,
    "C": 0.72,
    "I": 0.0
  },
  "band": "medium",
  "behavioral_reliance_risk": 0.68,
  "component_breakdown": {
    "R": 0.68,
    "S": 0.889,
    "Q": 0.0,
    "E": 0.393,
    "C": 0.72,
    "I": 0.0
  }
}
```

### Compatibility aliases

- `band` mirrors `agency_band`
- `behavioral_reliance_risk` mirrors `reliance_risk`
- `component_breakdown` mirrors `components`

## Text Analysis Modes

- Normal mode: `USE_TEXT_ANALYSIS=true` (default)
- Safe mode: `USE_TEXT_ANALYSIS=false`

When disabled or unavailable, scorer still returns valid JSON and sets:

```json
"text_scores": {}
```

## Demo Framing Guardrails

- `intent_preservation` depends on quality/specificity of `intent_text`.
- `rewrite_depth` measures substantive editing depth, not objective writing quality.

