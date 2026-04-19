import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

require(path.join(root, "content/scorer/features.js"));
require(path.join(root, "content/scorer/heuristic.js"));
require(path.join(root, "content/scorer/formula.js"));
const scorer = require(path.join(root, "content/scorer/index.js"));

function runCase(name, payload) {
  const result = scorer.computeScore(payload);
  return { name, result };
}

const fullCase = runCase("full", {
  ai_text: "Thank you for your feedback. I appreciate your time and guidance on this project.",
  final_text: "Thank you for your feedback. I appreciate your time and guidance on this project.",
  ai_capture_source: "response_dom",
  ai_context_age_ms: 1000,
  latency_ms: 1500,
  accept_count: 1,
  regen_count: 0,
});
assert.equal(fullCase.result.status, "ok");
assert.equal(fullCase.result.score_mode, "full");
assert.ok(fullCase.result.score && typeof fullCase.result.score.agency_score === "number");

const partialCase = runCase("partial", {
  ai_text: "This is a concise summary of the task and next steps for tomorrow morning.",
  final_text: "This is a concise summary of the task and next steps for tomorrow morning.",
  latency_ms: 12000,
  accept_count: 1,
  regen_count: 0,
  ai_context_age_ms: 120000,
  ai_capture_source: null,
});
assert.equal(partialCase.result.status, "ok");
assert.equal(partialCase.result.score_mode, "partial");
assert.ok(partialCase.result.score && partialCase.result.score.agency_score <= 95);

const unscoredMissingContext = runCase("unscored_missing_context", {
  ai_text: "",
  final_text: "I wrote this manually with no captured assistant suggestion.",
  latency_ms: 1200,
  accept_count: 1,
  regen_count: 0,
});
assert.ok(["unscored", "ok"].includes(unscoredMissingContext.result.status));
if (unscoredMissingContext.result.status === "ok") {
  assert.equal(unscoredMissingContext.result.score_mode, "partial");
  assert.ok(unscoredMissingContext.result.score.agency_score < 100);
} else {
  assert.equal(unscoredMissingContext.result.reason, "missing_ai_context");
  assert.equal(unscoredMissingContext.result.score, null);
}

const unscoredMissingFinal = runCase("unscored_missing_final", {
  ai_text: "Some assistant output",
  final_text: "",
});
assert.equal(unscoredMissingFinal.result.status, "unscored");
assert.equal(unscoredMissingFinal.result.reason, "missing_final_text");

const noFalseHighCase = runCase("no_false_high", {
  ai_text: "",
  final_text: "Copied response text with missing AI capture should never look like perfect agency.",
  latency_ms: 1000,
  accept_count: 1,
  regen_count: 0,
});
assert.ok(
  noFalseHighCase.result.status === "unscored" ||
    (noFalseHighCase.result.score && noFalseHighCase.result.score.agency_score < 100),
  "Expected unscored or non-perfect agency score when AI capture is missing"
);

console.log("Reliability scorer mode checks passed.");
