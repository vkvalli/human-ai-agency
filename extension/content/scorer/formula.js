(function initScorerFormula(root) {
  const ns = (root.AgencyExt = root.AgencyExt || {});

  function clamp(value, lo, hi) {
    return Math.min(Math.max(Number(value) || 0, lo), hi);
  }

  function agencyBand(score) {
    if (score >= 70) return "high";
    if (score >= 40) return "medium";
    return "low";
  }

  function confidenceAlignment(confidence, relianceRisk) {
    if (confidence === null || confidence === undefined) {
      return 0.5;
    }
    const expected = 1 - relianceRisk;
    return clamp(1 - Math.abs(confidence - expected), 0, 1);
  }

  function editRatioComponent(features) {
    return clamp(
      (features.edit_distance_ratio + features.manual_addition_ratio + features.delete_ratio) / 3,
      0,
      1
    );
  }

  function computeAgencyScore(features, relianceRisk) {
    const r = clamp(relianceRisk, 0, 1);
    const s = clamp(features.adoption_ratio, 0, 1);
    const q = features.quick_accept ? 1 : 0;
    const c = confidenceAlignment(features.confidence, r);
    const e = editRatioComponent(features);

    const raw = 100 - (40 * r) - (20 * s) - (15 * q) + (15 * e) + (10 * c);
    const score = Math.trunc(clamp(raw, 0, 100));

    return {
      agency_score: score,
      agency_band: agencyBand(score),
      raw_score: Math.round((raw + Number.EPSILON) * 1000) / 1000,
      components: {
        R: Math.round((r + Number.EPSILON) * 1000) / 1000,
        S: Math.round((s + Number.EPSILON) * 1000) / 1000,
        Q: Math.round((q + Number.EPSILON) * 1000) / 1000,
        E: Math.round((e + Number.EPSILON) * 1000) / 1000,
        C: Math.round((c + Number.EPSILON) * 1000) / 1000,
        I: 0,
      },
    };
  }

  const api = {
    computeAgencyScore,
    agencyBand,
  };

  ns.scorerFormula = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
