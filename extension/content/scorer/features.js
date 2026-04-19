(function initScorerFeatures(root) {
  const ns = (root.AgencyExt = root.AgencyExt || {});

  function clamp01(value) {
    return Math.min(Math.max(Number(value) || 0, 0), 1);
  }

  function round3(value) {
    return Math.round((value + Number.EPSILON) * 1000) / 1000;
  }

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .trim()
      .replace(/\s+/g, " ");
  }

  function tokenize(text) {
    const n = normalize(text);
    return n ? n.split(" ") : [];
  }

  function frequency(tokens) {
    const map = new Map();
    for (const token of tokens) {
      map.set(token, (map.get(token) || 0) + 1);
    }
    return map;
  }

  function levenshteinDistance(a, b) {
    if (a === b) return 0;
    if (!a) return b.length;
    if (!b) return a.length;

    const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i += 1) {
      const curr = [i];
      for (let j = 1; j <= b.length; j += 1) {
        const insertCost = curr[j - 1] + 1;
        const deleteCost = prev[j] + 1;
        const replaceCost = prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
        curr.push(Math.min(insertCost, deleteCost, replaceCost));
      }
      for (let j = 0; j < curr.length; j += 1) {
        prev[j] = curr[j];
      }
    }
    return prev[prev.length - 1];
  }

  function computeEditDistanceRatio(aiText, finalText) {
    const a = normalize(aiText);
    const b = normalize(finalText);
    const denom = Math.max(a.length, b.length, 1);
    const dist = levenshteinDistance(a, b);
    return round3(clamp01(dist / denom));
  }

  function computeAdoptionRatio(aiText, finalText) {
    const aiTokens = tokenize(aiText);
    const finalTokens = tokenize(finalText);
    if (!aiTokens.length) return 0;

    const aiCounter = frequency(aiTokens);
    const finalCounter = frequency(finalTokens);
    let retained = 0;

    for (const [token, count] of aiCounter.entries()) {
      retained += Math.min(count, finalCounter.get(token) || 0);
    }

    return round3(clamp01(retained / Math.max(aiTokens.length, 1)));
  }

  function computeManualAdditionRatio(aiText, finalText) {
    const aiTokens = tokenize(aiText);
    const finalTokens = tokenize(finalText);
    if (!finalTokens.length) return 0;

    const aiCounter = frequency(aiTokens);
    const finalCounter = frequency(finalTokens);
    let novel = 0;

    for (const [token, count] of finalCounter.entries()) {
      novel += Math.max(count - (aiCounter.get(token) || 0), 0);
    }

    return round3(clamp01(novel / Math.max(finalTokens.length, 1)));
  }

  function computeDeleteRatio(aiText, finalText) {
    const aiTokens = tokenize(aiText);
    const finalTokens = tokenize(finalText);
    if (!aiTokens.length) return 0;

    const aiCounter = frequency(aiTokens);
    const finalCounter = frequency(finalTokens);
    let deleted = 0;

    for (const [token, count] of aiCounter.entries()) {
      deleted += Math.max(count - (finalCounter.get(token) || 0), 0);
    }

    return round3(clamp01(deleted / Math.max(aiTokens.length, 1)));
  }

  function coalesceInt(event, keys, fallback) {
    for (const key of keys) {
      const raw = event[key];
      if (raw === null || raw === undefined || raw === "") continue;
      const value = Number.parseInt(raw, 10);
      if (!Number.isNaN(value)) return value;
    }
    return fallback;
  }

  function coalesceFloat(event, keys) {
    for (const key of keys) {
      const raw = event[key];
      if (raw === null || raw === undefined || raw === "") continue;
      const value = Number.parseFloat(raw);
      if (!Number.isNaN(value)) return value;
    }
    return null;
  }

  function asBool(value) {
    return value === true;
  }

  function computeAiContextConfidence({
    aiTextLength,
    adoptionRatio,
    captureSource,
    aiContextAgeMs,
    regenerateObserved,
    acceptCount,
    rejectCount,
    quickAccept,
    latencyMs,
  }) {
    let confidence = 0;

    if (aiTextLength >= 20 && captureSource) {
      confidence += 0.45;
    } else if (aiTextLength >= 20 && adoptionRatio >= 0.75) {
      confidence += 0.3;
    }
    if (asBool(regenerateObserved)) {
      confidence += 0.2;
    }
    if (adoptionRatio >= 0.6) {
      confidence += 0.25;
    }
    if (acceptCount > 0) {
      confidence += 0.25;
    }
    if (quickAccept) {
      confidence += 0.15;
    }
    if (acceptCount > 0 && latencyMs > 0 && latencyMs <= 8000) {
      confidence += 0.1;
    }
    if (rejectCount > acceptCount) {
      confidence -= 0.1;
    }
    if (aiContextAgeMs > 60 * 1000) {
      confidence -= 0.2;
    }
    if (aiTextLength > 0 && aiTextLength < 20) {
      confidence -= 0.15;
    }

    return round3(clamp01(confidence));
  }

  function extractFeatures(event) {
    const aiText = String(event.ai_text || "");
    const finalText = String(event.final_text || "");
    const captureSourceRaw = event.ai_capture_source;
    const captureSource =
      typeof captureSourceRaw === "string" && captureSourceRaw.trim()
        ? captureSourceRaw.trim()
        : null;

    const latencyMs = coalesceInt(event, [
      "latency_ms",
      "accept_latency_ms",
      "decision_latency_ms",
      "time_to_decision_ms",
    ], 0);

    let acceptCount = coalesceInt(event, ["accept_count", "accepted_count"], 0);
    let rejectCount = coalesceInt(event, ["reject_count", "rejected_count"], 0);
    const regenCount = coalesceInt(event, ["regen_count", "regeneration_count", "num_regenerations"], 0);

    if (acceptCount === 0 && (event.accepted || event.was_accepted)) {
      acceptCount = 1;
    }
    if (rejectCount === 0 && (event.rejected || event.was_rejected)) {
      rejectCount = 1;
    }

    const confidenceRaw = coalesceFloat(event, ["confidence", "self_confidence"]);
    const confidence = confidenceRaw === null ? null : clamp01(confidenceRaw);

    const normalizedAi = normalize(aiText);
    const normalizedFinal = normalize(finalText);
    const aiTextLength = normalizedAi.length;
    const finalTextLength = normalizedFinal.length;
    const hasFinalText = finalTextLength >= 3;

    const adoptionRatio = computeAdoptionRatio(aiText, finalText);
    const manualAdditionRatio = computeManualAdditionRatio(aiText, finalText);
    const deleteRatio = computeDeleteRatio(aiText, finalText);
    const editDistanceRatio = computeEditDistanceRatio(aiText, finalText);
    const quickAccept = Boolean(acceptCount > 0 && regenCount === 0 && latencyMs <= 3000);

    const explicitConfidence = coalesceFloat(event, ["ai_context_confidence"]);
    const aiContextAgeMs = Math.max(coalesceInt(event, ["ai_context_age_ms"], 0), 0);
    const regenerateObserved = asBool(event.ai_regenerate_observed) || regenCount > 0;
    const derivedConfidence = computeAiContextConfidence({
      aiTextLength,
      adoptionRatio,
      captureSource,
      aiContextAgeMs,
      regenerateObserved,
      acceptCount,
      rejectCount,
      quickAccept,
      latencyMs,
    });

    const aiContextConfidence =
      explicitConfidence === null
        ? derivedConfidence
        : round3(clamp01((0.6 * derivedConfidence) + (0.4 * explicitConfidence)));

    const hasAiContext = aiContextConfidence >= 0.4;

    let scoreMode = "unscored";
    let unscoredReason = null;
    if (!hasFinalText) {
      unscoredReason = "missing_final_text";
    } else if (aiContextConfidence >= 0.7) {
      scoreMode = "full";
    } else if (aiContextConfidence >= 0.4) {
      scoreMode = "partial";
    } else {
      unscoredReason = "missing_ai_context";
    }

    return {
      latency_ms: latencyMs,
      accept_count: acceptCount,
      reject_count: rejectCount,
      regen_count: regenCount,
      confidence,
      ai_text: aiText,
      final_text: finalText,
      intent_text: event.intent_text || null,
      adoption_ratio: adoptionRatio,
      manual_addition_ratio: manualAdditionRatio,
      delete_ratio: deleteRatio,
      edit_distance_ratio: editDistanceRatio,
      quick_accept: quickAccept,
      has_final_text: hasFinalText,
      has_ai_context: hasAiContext,
      ai_context_confidence: aiContextConfidence,
      ai_capture_source: captureSource,
      score_mode: scoreMode,
      unscored_reason: scoreMode === "unscored" ? unscoredReason || "missing_ai_context" : null,
      ai_text_length: aiTextLength,
      final_text_length: finalTextLength,
    };
  }

  const api = {
    normalize,
    extractFeatures,
    computeAdoptionRatio,
    computeManualAdditionRatio,
    computeDeleteRatio,
    computeEditDistanceRatio,
  };

  ns.scorerFeatures = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
