(function initScorerIndex(root) {
  const ns = (root.AgencyExt = root.AgencyExt || {});

  const INTENT_DRIVER_LABELS = {
    brainstorm: "Asked AI for ideas/brainstorming — healthy exploratory use",
    explain: "Asked AI to explain a concept — learning-oriented use",
    feedback: "Asked AI for feedback on your own work — you retain ownership",
    hint: "Asked AI for a hint while solving a problem yourself",
    organize: "Used AI to organize your own ideas — you did the thinking",
    full_assignment: "Asked AI to write an entire assignment — full delegation detected",
  };

  function buildIntentOverride(features, { agencyScore, relianceRisk, decisionType, driver }) {
    const formulaApi = ns.scorerFormula;
    const heuristicApi = ns.scorerHeuristic;
    return {
      status: "ok",
      score_mode: "full",
      score_confidence: "high",
      features,
      score: {
        agency_score: agencyScore,
        agency_band: formulaApi.agencyBand(agencyScore),
        reliance_risk: relianceRisk,
        reliance_band: heuristicApi.riskBand(relianceRisk),
        decision_type: decisionType,
        drivers: [driver],
        components: {},
      },
    };
  }

  function computeScore(eventPayload, options = {}) {
    const featureApi = ns.scorerFeatures;
    const heuristicApi = ns.scorerHeuristic;
    const formulaApi = ns.scorerFormula;
    const intentApi = ns.scorerIntent;

    if (!featureApi || !heuristicApi || !formulaApi) {
      throw new Error("Scorer modules are not loaded");
    }

    const features = featureApi.extractFeatures(eventPayload);

    // Intent classification runs ahead of the confidence gate: a good question is a good
    // question even on the first turn, before there's any prior AI response to compare against.
    // The semantic classifier (backend, embeddings-based) is preferred when available; the
    // local regex classifier is a resilience fallback for when the network call fails/times out.
    if (intentApi && features.has_final_text) {
      const citationRisk =
        features.adoption_ratio >= 0.5 &&
        intentApi.hasFabricatedCitationRisk(eventPayload.ai_text);

      if (citationRisk) {
        return buildIntentOverride(features, {
          agencyScore: 18,
          relianceRisk: 0.82,
          decisionType: "ai_led",
          driver: "AI response includes citation-like content that was adopted — verify sources before use",
        });
      }

      const remoteIntent = options.intentOverride;
      const promptIntent =
        remoteIntent && remoteIntent.intent && remoteIntent.polarity
          ? { intent: remoteIntent.intent, polarity: remoteIntent.polarity, source: "semantic" }
          : { ...(intentApi.classifyPromptIntent(eventPayload.final_text) || {}), source: "pattern" };

      if (promptIntent && promptIntent.polarity === "negative") {
        return buildIntentOverride(features, {
          agencyScore: 12,
          relianceRisk: 0.88,
          decisionType: "ai_led",
          driver: INTENT_DRIVER_LABELS[promptIntent.intent] || promptIntent.intent,
        });
      }

      if (promptIntent && promptIntent.polarity === "positive") {
        return buildIntentOverride(features, {
          agencyScore: 92,
          relianceRisk: 0.08,
          decisionType: "user_led",
          driver: INTENT_DRIVER_LABELS[promptIntent.intent] || promptIntent.intent,
        });
      }
    }

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
