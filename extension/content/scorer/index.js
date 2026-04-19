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
    const reliance = heuristicApi.scoreHeuristic(features);
    const agency = formulaApi.computeAgencyScore(features, reliance.reliance_risk);

    return {
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
