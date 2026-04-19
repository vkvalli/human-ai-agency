(function initScorerHeuristic(root) {
  const ns = (root.AgencyExt = root.AgencyExt || {});

  function clamp01(value) {
    return Math.min(Math.max(Number(value) || 0, 0), 1);
  }

  function riskBand(relianceRisk) {
    if (relianceRisk >= 0.75) return "high";
    if (relianceRisk >= 0.34) return "medium";
    return "low";
  }

  function deriveLabel(features) {
    if (features.adoption_ratio >= 0.8 && features.quick_accept) {
      return "ai_led";
    }
    if (features.manual_addition_ratio >= 0.45 && features.delete_ratio >= 0.25) {
      return "user_led";
    }
    return "mixed";
  }

  function scoreHeuristic(features) {
    const latencyFactor = 1 - Math.min(features.latency_ms / 60000, 1);
    const regenFactor = 1 - Math.min(features.regen_count / 3, 1);

    let risk =
      0.35 * features.adoption_ratio +
      0.2 * (1 - features.manual_addition_ratio) +
      0.15 * (1 - features.delete_ratio) +
      0.15 * (features.quick_accept ? 1 : 0) +
      0.1 * latencyFactor +
      0.05 * regenFactor;

    if (features.reject_count > features.accept_count) {
      risk -= 0.08;
    }

    const drivers = [];
    if (features.quick_accept) drivers.push("quick acceptance pattern detected");
    if (features.adoption_ratio > 0.75) drivers.push("high AI adoption ratio");
    if (features.manual_addition_ratio > 0.4) drivers.push("substantial manual additions");
    if (features.delete_ratio > 0.25) drivers.push("user removed notable AI content");

    const relianceRisk = Math.round(clamp01(risk) * 1000) / 1000;
    return {
      reliance_risk: relianceRisk,
      reliance_band: riskBand(relianceRisk),
      decision_type: deriveLabel(features),
      drivers,
    };
  }

  function scoreHeuristicPartial(features) {
    const latencyFactor = 1 - Math.min(features.latency_ms / 60000, 1);
    const regenPenalty = Math.min(features.regen_count / 3, 1);

    let risk =
      0.12 +
      0.22 * (features.quick_accept ? 1 : 0) +
      0.18 * latencyFactor +
      0.12 * (features.accept_count > 0 ? 1 : 0) +
      0.12 * (1 - regenPenalty) +
      0.18 * features.ai_context_confidence +
      0.06 * Math.min(features.adoption_ratio, 0.6);

    if (features.reject_count > features.accept_count) {
      risk -= 0.1;
    }

    const relianceRisk = Math.round(clamp01(risk) * 1000) / 1000;
    const drivers = [];
    if (features.quick_accept) {
      drivers.push("quick acceptance pattern detected");
    }
    if (features.latency_ms > 0 && features.latency_ms < 6000) {
      drivers.push("limited evidence of review before submission");
    }
    drivers.push("AI-assisted context detected with incomplete capture");

    let decisionType = "mixed";
    if (features.quick_accept && features.accept_count > 0 && features.ai_context_confidence >= 0.55) {
      decisionType = "ai_led";
    } else if (features.reject_count > features.accept_count || features.regen_count >= 2) {
      decisionType = "user_led";
    }

    return {
      reliance_risk: relianceRisk,
      reliance_band: riskBand(relianceRisk),
      decision_type: decisionType,
      drivers,
    };
  }

  const api = {
    scoreHeuristic,
    scoreHeuristicPartial,
    deriveLabel,
    riskBand,
  };

  ns.scorerHeuristic = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
