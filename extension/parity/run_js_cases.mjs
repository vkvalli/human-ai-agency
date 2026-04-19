import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

require(path.join(root, "content/scorer/features.js"));
require(path.join(root, "content/scorer/heuristic.js"));
require(path.join(root, "content/scorer/formula.js"));
const scorer = require(path.join(root, "content/scorer/index.js"));

const casesPath = process.argv[2] || path.join(path.dirname(new URL(import.meta.url).pathname), "eval_cases.json");
const cases = JSON.parse(fs.readFileSync(casesPath, "utf-8"));

const out = {};
for (const entry of cases) {
  const result = scorer.computeScore(entry.payload);
  const safeScore = result.score || {};
  out[entry.name] = {
    status: result.status || "ok",
    score_mode: result.score_mode || "full",
    reason: result.reason || null,
    features: {
      adoption_ratio: result.features.adoption_ratio,
      manual_addition_ratio: result.features.manual_addition_ratio,
      delete_ratio: result.features.delete_ratio,
      edit_distance_ratio: result.features.edit_distance_ratio,
      ai_context_confidence: result.features.ai_context_confidence,
      has_ai_context: result.features.has_ai_context,
      has_final_text: result.features.has_final_text,
    },
    score: {
      decision_type: safeScore.decision_type || null,
      reliance_risk: safeScore.reliance_risk ?? null,
      reliance_band: safeScore.reliance_band || null,
      agency_score: safeScore.agency_score ?? null,
      agency_band: safeScore.agency_band || null,
    },
  };
}

process.stdout.write(JSON.stringify(out, null, 2));
