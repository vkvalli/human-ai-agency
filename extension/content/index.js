(function initContentEntry(root) {
  const ns = (root.AgencyExt = root.AgencyExt || {});

  const constants = ns.constants;
  const storage = ns.storage;
  const siteConfig = ns.getSiteConfig(window.location.hostname);

  if (!siteConfig || !constants || !storage || !ns.extractor || !ns.scorer || !ns.observer || !ns.banner) {
    return;
  }

  const state = {
    lastSuggestionAt: 0,
    latestAiText: "",
    regenCount: 0,
    acceptCount: 0,
    rejectCount: 0,
    confidence: null,
    session: {
      session_id: null,
      plan_id: null,
      task_type: "study",
      deadline_active: false,
      agency_goal: 70,
      intent_text: null,
    },
  };

  async function hydrateSession() {
    const data = await storage.get([constants.STORAGE_KEYS.SESSION]);
    const session = data[constants.STORAGE_KEYS.SESSION];
    if (session && typeof session === "object") {
      state.session = { ...state.session, ...session };
    }
  }

  function buildEventPayload(snapshot) {
    const latencyMs = state.lastSuggestionAt ? Math.max(Date.now() - state.lastSuggestionAt, 0) : 0;

    return {
      ai_text: state.latestAiText || snapshot.ai_text || "",
      final_text: snapshot.final_text || "",
      intent_text: state.session.intent_text,
      latency_ms: latencyMs,
      accept_count: state.acceptCount,
      reject_count: state.rejectCount,
      regen_count: state.regenCount,
      accepted: state.acceptCount > 0,
      rejected: state.rejectCount > 0,
      confidence: state.confidence,
    };
  }

  function summarizeForWorker(computed) {
    return {
      session_id: state.session.session_id,
      plan_id: state.session.plan_id,
      task_type: state.session.task_type,
      deadline_active: state.session.deadline_active,
      agency_goal: state.session.agency_goal,
      scored_at: new Date().toISOString(),
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
      },
      score: computed.score,
      possible_trigger: computed.score.agency_band === "low" && computed.score.reliance_risk > 0.65
        ? "acute_low_agency"
        : null,
    };
  }

  function maybeShowPreBanner(features) {
    if (
      features.adoption_ratio > constants.PRE_BANNER_ADOPTION_THRESHOLD &&
      features.quick_accept
    ) {
      ns.banner.showPreBanner();
    }
  }

  function handleScoredInteraction(source) {
    const snapshot = ns.extractor.extractSnapshot(siteConfig);
    if (!snapshot.final_text) {
      return;
    }

    const payload = buildEventPayload(snapshot);
    const computed = ns.scorer.computeScore(payload);

    maybeShowPreBanner(computed.features);
    ns.banner.showScoreBanner(computed.score);

    const summary = summarizeForWorker(computed);
    chrome.runtime.sendMessage({ type: "SCORE_EVENT", source, summary });
  }

  const obs = ns.observer.createObserver(siteConfig, {
    suggestion(evt) {
      state.lastSuggestionAt = evt.timestamp || Date.now();
      state.latestAiText = evt.ai_text || "";
      state.acceptCount = 0;
      state.rejectCount = 0;
    },
    regenerate() {
      state.regenCount += 1;
    },
    paste() {
      if (state.lastSuggestionAt) {
        state.acceptCount = 1;
      }
    },
    commit(evt) {
      if (state.lastSuggestionAt) {
        state.acceptCount = Math.max(1, state.acceptCount);
      }
      handleScoredInteraction(evt.source || "commit");
    },
    idle() {
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
    }
  });

  hydrateSession().then(() => {
    obs.start();
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
