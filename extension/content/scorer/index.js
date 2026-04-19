(function initScorerIndex(root) {
  const ns = (root.AgencyExt = root.AgencyExt || {});

  function computeScore(eventPayload) {
    const featureApi = ns.scorerFeatures;
    const heuristicApi = ns.scorerHeuristic;
    const formulaApi = ns.scorerFormula;

    if (!featureApi || !heuristicApi || !formulaApi) {
      throw new Error("Scorer modules are not loaded");
    }

    const features = featureApi.extractFeatures(eventPayload);
    if (features.score_mode === "unscored") {
      return {
        status: "unscored",
        score_mode: "unscored",
        score_confidence: "none",
        reason: features.unscored_reason || "missing_ai_context",
        features,
        score: null,
      };
    }

    const scoreMode = features.score_mode === "partial" ? "partial" : "full";
    const reliance =
      scoreMode === "partial"
        ? heuristicApi.scoreHeuristicPartial(features)
        : heuristicApi.scoreHeuristic(features);
    const agency = formulaApi.computeAgencyScore(features, reliance.reliance_risk, {
      status: "ok",
      score_mode: scoreMode,
    });
    if (!agency) {
      return {
        status: "unscored",
        score_mode: "unscored",
        score_confidence: "none",
        reason: "invalid_scorer_state",
        features,
        score: null,
      };
    }

    return {
      status: "ok",
      score_mode: scoreMode,
      score_confidence: scoreMode === "partial" ? "partial" : "high",
      features,
      score: {
        agency_score: agency.agency_score,
        agency_band: agency.agency_band,
        reliance_risk: reliance.reliance_risk,
        reliance_band: reliance.reliance_band,
        decision_type: reliance.decision_type,
        drivers: reliance.drivers,
        components: agency.components,
      },
    };
  }

  ns.scorer = {
    computeScore,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      computeScore,
    };
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
