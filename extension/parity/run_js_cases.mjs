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
  out[entry.name] = {
    features: {
      adoption_ratio: result.features.adoption_ratio,
      manual_addition_ratio: result.features.manual_addition_ratio,
      delete_ratio: result.features.delete_ratio,
      edit_distance_ratio: result.features.edit_distance_ratio,
    },
    score: {
      decision_type: result.score.decision_type,
      reliance_risk: result.score.reliance_risk,
      reliance_band: result.score.reliance_band,
      agency_score: result.score.agency_score,
      agency_band: result.score.agency_band,
    },
  };
}

process.stdout.write(JSON.stringify(out, null, 2));
