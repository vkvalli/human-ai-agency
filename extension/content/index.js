(function initContentEntry(root) {
  const ns = (root.AgencyExt = root.AgencyExt || {});

  const constants = ns.constants;
  const storage = ns.storage;
  const featureApi = ns.scorerFeatures;
  const siteConfig = ns.getSiteConfig(window.location.hostname);

  if (!siteConfig || !constants || !storage || !featureApi || !ns.extractor || !ns.scorer || !ns.observer || !ns.banner) {
    return;
  }

  function clamp01(value) {
    return Math.min(Math.max(Number(value) || 0, 0), 1);
  }

  function normalizedLength(text) {
    return featureApi.normalize(String(text || "")).length;
  }

  const state = {
    extUserId: null,
    lastSuggestionAt: 0,
    regenCount: 0,
    acceptCount: 0,
    rejectCount: 0,
    confidence: null,
    lastBannerFingerprint: null,
    aiContext: {
      lastAiText: "",
      lastAiSeenAt: 0,
      aiContextConfidence: 0,
      aiCaptureSource: null,
      lastSuggestionId: null,
      regenerateObserved: false,
    },
    session: {
      session_id: null,
      plan_id: null,
      task_type: "study",
      deadline_active: false,
      agency_goal: 70,
      intent_text: null,
      must_keep_points: [],
    },
  };

  function sendDebugEvent(name, detail = {}) {
    chrome.runtime.sendMessage({
      type: "CONTENT_DEBUG_EVENT",
      event_name: name,
      host: window.location.hostname,
      at: new Date().toISOString(),
      detail,
    });
  }

  function sendScoreStatus({ status, reason = null, scoreMode = null, scoredAt = null, score = null }) {
    chrome.runtime.sendMessage({
      type: "SCORE_STATUS",
      status,
      reason,
      score_mode: scoreMode,
      scored_at: scoredAt || new Date().toISOString(),
      site_host: window.location.hostname,
      score: score || null,
      session_active: Boolean(state.session.session_id),
    });
  }

  function updateAiContext({ aiText, captureSource, captureConfidence = 0, regenerateObserved = false }) {
    const text = String(aiText || "");
    const length = normalizedLength(text);
    if (!length) return;

    const now = Date.now();
    state.aiContext.lastAiText = text;
    state.aiContext.lastAiSeenAt = now;
    state.aiContext.aiCaptureSource = captureSource || state.aiContext.aiCaptureSource || "response_dom";
    state.aiContext.lastSuggestionId = `${now}:${length}`;
    state.aiContext.regenerateObserved = state.aiContext.regenerateObserved || regenerateObserved;

    let confidence = 0;
    if (length >= constants.MIN_AI_TEXT_CHARS) confidence += 0.45;
    if (state.aiContext.regenerateObserved) confidence += 0.2;
    if (length > 0 && length < constants.MIN_AI_TEXT_CHARS) confidence -= 0.15;
    confidence += Math.min(Math.max(Number(captureConfidence || 0), 0), 1) * 0.15;
    state.aiContext.aiContextConfidence = clamp01(confidence);
  }

  function maybeFallbackAssistantSnapshot() {
    const fallback = ns.extractor.extractAssistantSnapshot(siteConfig);
    if (!fallback || !fallback.ai_text) return;
    updateAiContext({
      aiText: fallback.ai_text,
      captureSource: fallback.capture_source || "fallback_lookup",
      captureConfidence: fallback.capture_confidence || 0,
      regenerateObserved: state.aiContext.regenerateObserved,
    });
  }

  async function hydrateSession() {
    const data = await storage.get([constants.STORAGE_KEYS.SESSION]);
    const session = data[constants.STORAGE_KEYS.SESSION];
    if (session && typeof session === "object") {
      state.session = { ...state.session, ...session };
    }
  }

  function hydrateExtUserId() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "GET_EXT_USER_ID" }, (response) => {
        const ignored = chrome.runtime.lastError;
        void ignored;
        state.extUserId = response && response.user_id ? response.user_id : null;
        resolve();
      });
    });
  }

  function requestRemoteIntent(text, timeoutMs = 1800) {
    return new Promise((resolve) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        resolve(null);
      }, timeoutMs);

      chrome.runtime.sendMessage({ type: "CLASSIFY_INTENT", text }, (response) => {
        const ignored = chrome.runtime.lastError;
        void ignored;
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (response && response.ok && response.intent) {
          resolve({
            intent: response.intent,
            polarity: response.polarity,
            confidence: response.confidence,
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  function buildEventPayload(snapshot, overrides = {}) {
    const aiText = overrides.ai_text || state.aiContext.lastAiText || snapshot.ai_text || "";
    const finalText = overrides.final_text || snapshot.final_text || "";
    const aiContextAgeMs = state.aiContext.lastAiSeenAt
      ? Math.max(Date.now() - state.aiContext.lastAiSeenAt, 0)
      : constants.AI_CONTEXT_STALE_MS + 1;

    return {
      ai_text: aiText,
      final_text: finalText,
      intent_text: state.session.intent_text,
      latency_ms: state.lastSuggestionAt ? Math.max(Date.now() - state.lastSuggestionAt, 0) : 0,
      accept_count: state.acceptCount,
      reject_count: state.rejectCount,
      regen_count: state.regenCount,
      accepted: state.acceptCount > 0,
      rejected: state.rejectCount > 0,
      confidence: state.confidence,
      ai_context_confidence: state.aiContext.aiContextConfidence,
      ai_capture_source: state.aiContext.aiCaptureSource,
      ai_context_age_ms: aiContextAgeMs,
      ai_regenerate_observed: state.aiContext.regenerateObserved,
    };
  }

  function summarizeForWorker(computed, payload) {
    return {
      status: computed.status,
      score_mode: computed.score_mode,
      score_confidence: computed.score_confidence,
      reason: computed.reason || null,
      session_id: state.session.session_id,
      user_id: state.extUserId,
      plan_id: state.session.plan_id,
      task_type: state.session.task_type,
      deadline_active: state.session.deadline_active,
      agency_goal: state.session.agency_goal,
      scored_at: new Date().toISOString(),
      site_host: window.location.hostname,
      features: {
        latency_ms: computed.features.latency_ms,
        adoption_ratio: computed.features.adoption_ratio,
        manual_addition_ratio: computed.features.manual_addition_ratio,
        delete_ratio: computed.features.delete_ratio,
        edit_distance_ratio: computed.features.edit_distance_ratio,
        quick_accept: computed.features.quick_accept,
        regen_count: computed.features.regen_count,
        accept_count: computed.features.accept_count,
        reject_count: computed.features.reject_count,
        has_ai_context: computed.features.has_ai_context,
        ai_context_confidence: computed.features.ai_context_confidence,
        ai_capture_source: computed.features.ai_capture_source,
        ai_text_length: computed.features.ai_text_length,
        final_text_length: computed.features.final_text_length,
      },
      score: computed.score,
      possible_trigger:
        computed.score && computed.score.agency_band === "low" && computed.score.reliance_risk > constants.STAGE_A_RISK_THRESHOLD
          ? "acute_low_agency"
          : null,
      payload_debug: {
        ai_text_length: normalizedLength(payload.ai_text),
        final_text_length: normalizedLength(payload.final_text),
      },
    };
  }

  function maybeShowPreBanner(features) {
    if (
      features.score_mode === "full" &&
      features.adoption_ratio > constants.PRE_BANNER_ADOPTION_THRESHOLD &&
      features.quick_accept
    ) {
      ns.banner.showPreBanner();
    }
  }

  async function handleScoredInteraction(source, overrides = {}) {
    sendDebugEvent("handle_scored_interaction", { source });
    const snapshot = ns.extractor.extractSnapshot(siteConfig);

    if (snapshot.ai_text) {
      updateAiContext({
        aiText: snapshot.ai_text,
        captureSource: snapshot.capture_source || "response_dom",
        captureConfidence: snapshot.capture_confidence || 0,
        regenerateObserved: state.aiContext.regenerateObserved,
      });
    }

    if (!state.aiContext.lastAiText) {
      maybeFallbackAssistantSnapshot();
    }

    const finalText = overrides.final_text || snapshot.final_text || "";
    if (normalizedLength(finalText) < constants.MIN_FINAL_TEXT_CHARS) {
      sendDebugEvent("skip_missing_final_text", { source, final_length: normalizedLength(finalText) });
      sendScoreStatus({
        status: "unscored",
        reason: "missing_final_text",
        scoreMode: "unscored",
      });
      return;
    }

    const payload = buildEventPayload(snapshot, overrides);
    const remoteIntent = await requestRemoteIntent(payload.final_text);
    const computed = ns.scorer.computeScore(payload, { intentOverride: remoteIntent });
    sendDebugEvent("scorer_result", {
      source,
      status: computed.status,
      score_mode: computed.score_mode,
      reason: computed.reason || null,
      ai_context_confidence: computed.features?.ai_context_confidence,
      has_ai_context: computed.features?.has_ai_context,
      has_final_text: computed.features?.has_final_text,
    });

    if (computed.status !== "ok" || !computed.score) {
      sendScoreStatus({
        status: "unscored",
        reason: computed.reason || "missing_ai_context",
        scoreMode: computed.score_mode || "unscored",
      });
      return;
    }

    maybeShowPreBanner(computed.features);
    const shouldRenderBanner = ["commit", "click", "enter", "copy"].includes(String(source || ""));
    const bannerFingerprint = [
      computed.score_mode,
      computed.score.agency_score,
      computed.score.agency_band,
      state.aiContext.lastSuggestionId || "none",
      normalizedLength(payload.final_text),
    ].join("|");
    if (shouldRenderBanner && bannerFingerprint !== state.lastBannerFingerprint) {
      ns.banner.showScoreBanner(computed.score);
      state.lastBannerFingerprint = bannerFingerprint;
    }

    if (ns.scorerIntent && state.session.must_keep_points?.length) {
      const keepPointResults = ns.scorerIntent.evaluateKeepPoints(state.session.must_keep_points, {
        features: computed.features,
        score: computed.score,
      });
      ns.banner.showKeepPointsChecklist(keepPointResults);
    }

    const summary = summarizeForWorker(computed, payload);
    chrome.runtime.sendMessage({ type: "SCORE_EVENT", source, summary });
    sendDebugEvent("score_event_sent", {
      source,
      score_mode: computed.score_mode,
      agency_score: computed.score.agency_score,
      agency_band: computed.score.agency_band,
    });
    sendScoreStatus({
      status: computed.score_mode === "partial" ? "partial" : "ok",
      scoreMode: computed.score_mode,
      scoredAt: summary.scored_at,
      score: computed.score,
    });
  }

  const obs = ns.observer.createObserver(siteConfig, {
    suggestion(evt) {
      sendDebugEvent("observer_suggestion", {
        capture_source: evt.capture_source || null,
        capture_confidence: evt.capture_confidence || 0,
      });
      state.lastSuggestionAt = evt.timestamp || Date.now();
      state.acceptCount = 0;
      state.rejectCount = 0;
      updateAiContext({
        aiText: evt.ai_text || "",
        captureSource: evt.capture_source || "response_dom",
        captureConfidence: evt.capture_confidence || 0,
        regenerateObserved: state.aiContext.regenerateObserved,
      });
    },
    regenerate() {
      sendDebugEvent("observer_regenerate");
      state.regenCount += 1;
      state.aiContext.regenerateObserved = true;
    },
    paste() {
      sendDebugEvent("observer_paste");
      if (state.lastSuggestionAt || state.aiContext.lastAiText) {
        state.acceptCount = 1;
      }
      // Score on paste after the DOM input reflects text, even before explicit submit.
      setTimeout(() => {
        handleScoredInteraction("paste");
      }, 120);
    },
    copy(evt) {
      sendDebugEvent("observer_copy");
      const selectedText = typeof evt?.selected_text === "string" ? evt.selected_text.trim() : "";
      const snapshot = ns.extractor.extractAssistantSnapshot(siteConfig);
      const fallbackAiText = String(snapshot?.ai_text || state.aiContext.lastAiText || "").trim();
      const copiedText = selectedText || fallbackAiText;
      if (!copiedText) return;
      updateAiContext({
        aiText: copiedText,
        captureSource: selectedText ? "copy_match" : "copy_button",
        captureConfidence: selectedText ? 0.55 : (snapshot?.capture_confidence || 0.55),
        regenerateObserved: state.aiContext.regenerateObserved,
      });
      state.acceptCount = Math.max(1, state.acceptCount);
      handleScoredInteraction("copy", {
        ai_text: state.aiContext.lastAiText || copiedText,
        final_text: copiedText,
      });
    },
    commit(evt) {
      sendDebugEvent("observer_commit", { source: evt.source || "commit" });
      if (state.lastSuggestionAt || state.aiContext.lastAiText) {
        state.acceptCount = Math.max(1, state.acceptCount);
      }
      handleScoredInteraction(evt.source || "commit");
    },
    idle() {
      sendDebugEvent("observer_idle");
      if (!state.lastSuggestionAt) {
        return;
      }
      handleScoredInteraction("idle");
    },
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (!message || typeof message !== "object") return;

    if (message.type === "SHOW_DRIFT_BANNER") {
      ns.banner.showDriftBanner(message.reason);
    }

    if (message.type === "SESSION_SYNC" && message.session) {
      state.session = { ...state.session, ...message.session };
      sendScoreStatus({
        status: "waiting_for_ai_capture",
        reason: null,
        scoreMode: "unscored",
      });
    }

    if (message.type === "SESSION_SYNC" && message.session === null) {
      ns.banner?.hideKeepPointsChecklist();
      state.session = {
        session_id: null,
        plan_id: null,
        task_type: "study",
        deadline_active: false,
        agency_goal: 70,
        intent_text: null,
        must_keep_points: [],
      };
      state.aiContext = {
        lastAiText: "",
        lastAiSeenAt: 0,
        aiContextConfidence: 0,
        aiCaptureSource: null,
        lastSuggestionId: null,
        regenerateObserved: false,
      };
    }
  });

  hydrateExtUserId();

  hydrateSession().then(() => {
    obs.start();
    chrome.runtime.sendMessage({
      type: "CONTENT_READY",
      host: window.location.hostname,
      at: new Date().toISOString(),
      path: window.location.pathname,
    });
    sendDebugEvent("content_ready", { path: window.location.pathname });
    sendScoreStatus({
      status: state.session.session_id ? "waiting_for_ai_capture" : "unscored",
      reason: state.session.session_id ? null : "session_inactive",
      scoreMode: "unscored",
    });
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
