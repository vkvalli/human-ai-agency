"""Python-vs-JS parity runner for extension local scorer."""

from __future__ import annotations

import json
import math
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CASES_PATH = ROOT / "parity" / "eval_cases.json"
JS_RUNNER = ROOT / "parity" / "run_js_cases.mjs"
REPO_ROOT = ROOT.parent

import sys

if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from scorer.agency_formula import compute_agency_score
from scorer.features import extract_features
from scorer.heuristic_scorer import score_heuristic

EPS = 1e-3


def _python_eval(cases: list[dict]) -> dict[str, dict]:
    out: dict[str, dict] = {}
    for entry in cases:
        payload = entry["payload"]
        features = extract_features(payload)
        reliance = score_heuristic(features)
        agency = compute_agency_score(features, reliance["reliance_risk"])

        out[entry["name"]] = {
            "features": {
                "adoption_ratio": features.adoption_ratio,
                "manual_addition_ratio": features.manual_addition_ratio,
                "delete_ratio": features.delete_ratio,
                "edit_distance_ratio": features.edit_distance_ratio,
            },
            "score": {
                "decision_type": reliance["decision_type"],
                "reliance_risk": reliance["reliance_risk"],
                "reliance_band": reliance["reliance_band"],
                "agency_score": agency["agency_score"],
                "agency_band": agency["agency_band"],
            },
        }

    return out


def _js_eval() -> dict[str, dict]:
    proc = subprocess.run(
        ["node", str(JS_RUNNER), str(CASES_PATH)],
        cwd=str(ROOT.parent),
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(proc.stdout)


def _is_close(a: float, b: float, eps: float = EPS) -> bool:
    return math.isclose(float(a), float(b), rel_tol=eps, abs_tol=eps)


def main() -> int:
    cases = json.loads(CASES_PATH.read_text(encoding="utf-8"))
    py = _python_eval(cases)
    js = _js_eval()

    mismatches: list[str] = []

    for name in py:
        p = py[name]
        j = js.get(name)
        if j is None:
            mismatches.append(f"{name}: missing JS result")
            continue

        for key in ("adoption_ratio", "manual_addition_ratio", "delete_ratio", "edit_distance_ratio"):
            if not _is_close(p["features"][key], j["features"][key]):
                mismatches.append(
                    f"{name}: feature {key} mismatch py={p['features'][key]} js={j['features'][key]}"
                )

        for key in ("reliance_risk",):
            if not _is_close(p["score"][key], j["score"][key]):
                mismatches.append(f"{name}: score {key} mismatch py={p['score'][key]} js={j['score'][key]}")

        for key in ("decision_type", "reliance_band", "agency_band"):
            if p["score"][key] != j["score"][key]:
                mismatches.append(f"{name}: label {key} mismatch py={p['score'][key]} js={j['score'][key]}")

        if p["score"]["agency_score"] != j["score"]["agency_score"]:
            mismatches.append(
                f"{name}: agency_score mismatch py={p['score']['agency_score']} js={j['score']['agency_score']}"
            )

    if mismatches:
        print("PARITY CHECK FAILED")
        for item in mismatches:
            print(f"- {item}")
        return 1

    print("PARITY CHECK PASSED: Python and JS scorer agree on all 15 cases.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
