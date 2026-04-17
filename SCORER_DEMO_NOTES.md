# Scorer Demo Notes (Architecture Frozen)

These notes capture constraints to keep demo claims accurate and implementation focused.

## Caution Notes

1. `intent_preservation_score` quality depends on `intent_text` quality.
- Encourage structured user intent in frontend prompts.
- Good examples:
  - "I want this email to sound apologetic but confident."
  - "I want this response to preserve my own reasoning."
- If intent input is vague, treat this score as weak signal.

2. `rewrite_depth_score` is revision substantiveness, not objective quality.
- In demos and judging language, describe it as "depth of revision" or "substantive editing."
- Do not claim it directly measures whether final output is better writing.

## Implementation Order (Locked)

1. `features.py`
2. `heuristic_scorer.py`
3. `agency_formula.py`
4. `scorer_api.py`
5. `text_analysis.py`
6. `tests/`
7. optional `train.py`

No additional architecture iteration unless a hard blocker appears.
