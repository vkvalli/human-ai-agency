importScripts("shared/constants.js", "shared/storage.js");

const ns = globalThis.AgencyExt;
const constants = ns.constants;
const storage = ns.storage;

function now() {
  return Date.now();
}

function avg(values) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function asIso() {
  return new Date().toISOString();
}

function isSupportedHost(hostname) {
  if (!hostname) return false;
  const entries = Object.keys(constants.SITE_CONFIGS || {});
  return entries.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}

async function getActiveTabContext() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs && tabs.length ? tabs[0] : null;
    if (!tab || !tab.url) {
      return { host: null, supported: false };
    }
    const url = new URL(tab.url);
    return {
      host: url.hostname || null,
      supported: isSupportedHost(url.hostname || ""),
    };
  } catch {
    return { host: null, supported: false };
  }
}

async function getState() {
  const keys = constants.STORAGE_KEYS;
  const data = await storage.get([
    keys.SESSION,
    keys.ROLLING_SCORES,
    keys.LAST_BANNER_TIMES,
    keys.PENDING_FLUSH,
    keys.LAST_STATUS,
    keys.CONTENT_STATUS,
    keys.DEBUG_TRACE,
  ]);

  return {
    session: data[keys.SESSION] || null,
    rollingScores: Array.isArray(data[keys.ROLLING_SCORES]) ? data[keys.ROLLING_SCORES] : [],
    lastBannerTimes: data[keys.LAST_BANNER_TIMES] || {},
    pendingFlush: Array.isArray(data[keys.PENDING_FLUSH]) ? data[keys.PENDING_FLUSH] : [],
    lastStatus: data[keys.LAST_STATUS] || null,
    contentStatus: data[keys.CONTENT_STATUS] || null,
    debugTrace: Array.isArray(data[keys.DEBUG_TRACE]) ? data[keys.DEBUG_TRACE] : [],
  };
}

async function setContentStatus(contentStatus) {
  await storage.set({
    [constants.STORAGE_KEYS.CONTENT_STATUS]: {
      host: contentStatus?.host || null,
      path: contentStatus?.path || null,
      at: contentStatus?.at || asIso(),
      last_event: contentStatus?.last_event || null,
      detail: contentStatus?.detail || null,
    },
  });
}

async function appendDebugTrace(entry) {
  const safeEntry = {
    at: entry?.at || asIso(),
    host: entry?.host || null,
    event_name: entry?.event_name || "unknown",
    detail: entry?.detail || null,
  };
  await storage.appendToArray(constants.STORAGE_KEYS.DEBUG_TRACE, safeEntry, 150);
}

async function setSession(session) {
  await storage.set({ [constants.STORAGE_KEYS.SESSION]: session });
}

async function getOrCreateExtUserId() {
  const data = await storage.get([constants.STORAGE_KEYS.EXT_USER_ID]);
  let userId = data[constants.STORAGE_KEYS.EXT_USER_ID];
  if (typeof userId === "string" && userId.trim()) {
    return userId.trim();
  }
  userId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `ext-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await storage.set({ [constants.STORAGE_KEYS.EXT_USER_ID]: userId });
  return userId;
}

async function setLastStatus(status) {
  const payload = {
    status: status?.status || "unscored",
    reason: status?.reason || null,
    score_mode: status?.score_mode || null,
    scored_at: status?.scored_at || asIso(),
    last_site_host: status?.last_site_host || null,
    score: status?.score || null,
  };
  await storage.set({ [constants.STORAGE_KEYS.LAST_STATUS]: payload });
}

async function broadcastSessionSync(session) {
  const tabs = await chrome.tabs.query({
    url: constants.SUPPORTED_CHAT_URL_PATTERNS,
  });
  for (const tab of tabs) {
    if (tab.id !== undefined) {
      chrome.tabs.sendMessage(tab.id, { type: "SESSION_SYNC", session }, () => {
        const ignored = chrome.runtime.lastError;
        void ignored;
      });
    }
  }
}

async function clearSession() {
  await storage.remove([
    constants.STORAGE_KEYS.SESSION,
    constants.STORAGE_KEYS.ROLLING_SCORES,
    constants.STORAGE_KEYS.LAST_BANNER_TIMES,
  ]);
}

async function ensureAlarm() {
  const alarm = await chrome.alarms.get(constants.FLUSH_ALARM_NAME);
  if (!alarm) {
    chrome.alarms.create(constants.FLUSH_ALARM_NAME, {
      periodInMinutes: constants.FLUSH_PERIOD_MINUTES,
    });
  }
}

async function enqueueSummary(summary) {
  await storage.appendToArray(constants.STORAGE_KEYS.PENDING_FLUSH, summary, 500);
}

async function updateRolling(summary) {
  const scorePoint = {
    agency_score: summary.score.agency_score,
    agency_band: summary.score.agency_band,
    reliance_risk: summary.score.reliance_risk,
    scored_at: summary.scored_at,
    score_mode: summary.score_mode || "full",
  };
  return storage.appendToArray(
    constants.STORAGE_KEYS.ROLLING_SCORES,
    scorePoint,
    constants.ROLLING_WINDOW_SIZE
  );
}

function buildTrigger(rollingScores, session, summary) {
  const score = summary.score;
  const lowHigh = score.agency_band === "low" && score.reliance_risk > constants.STAGE_A_RISK_THRESHOLD;

  const threshold = Number(session?.agency_goal || 70);
  const latestThree = rollingScores.slice(-3);
  const rollingBelowGoal =
    latestThree.length === 3 &&
    avg(latestThree.map((row) => Number(row.agency_score || 0))) < threshold;

  if (lowHigh) {
    return {
      triggerType: "low_score",
      reason: "Low agency with high reliance detected (band low + risk > 0.65).",
    };
  }

  if (rollingBelowGoal) {
    return {
      triggerType: "goal_drift",
      reason: "Rolling average of last 3 scores is below agency_goal.",
    };
  }

  return null;
}

function inCooldown(lastBannerTimes, triggerType) {
  const last = Number(lastBannerTimes[triggerType] || 0);
  return now() - last < constants.COOLDOWN_MS;
}

async function setCooldown(lastBannerTimes, triggerType) {
  const next = { ...lastBannerTimes, [triggerType]: now() };
  await storage.set({ [constants.STORAGE_KEYS.LAST_BANNER_TIMES]: next });
}

async function maybeShowStageATrigger({ sender, session, summary, rollingScores, lastBannerTimes }) {
  const trigger = buildTrigger(rollingScores, session, summary);
  if (!trigger) return;
  if (inCooldown(lastBannerTimes, trigger.triggerType)) return;

  if (sender.tab && sender.tab.id !== undefined) {
    chrome.tabs.sendMessage(sender.tab.id, {
      type: "SHOW_DRIFT_BANNER",
      reason: trigger.reason,
      trigger_type: trigger.triggerType,
    });
  }

  await setCooldown(lastBannerTimes, trigger.triggerType);
}

async function flushPending() {
  const state = await getState();
  if (!state.pendingFlush.length) return;

  const endpoint = `${constants.API_BASE_URL}${constants.FLUSH_ENDPOINT}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: state.pendingFlush }),
    });

    if (!response.ok) {
      console.warn("[AgencyExt] flush non-200", response.status);
      return;
    }

    await storage.set({ [constants.STORAGE_KEYS.PENDING_FLUSH]: [] });
  } catch (error) {
    // Keep queue for retry on next alarm.
    console.warn("[AgencyExt] flush failed", error);
  }
}

function isValidScoredSummary(summary) {
  if (!summary || typeof summary !== "object") return false;
  if (summary.status !== "ok") return false;
  if (!summary.score || typeof summary.score !== "object") return false;
  if (!summary.score_mode || !["full", "partial"].includes(summary.score_mode)) return false;
  return true;
}

chrome.runtime.onInstalled.addListener(() => {
  ensureAlarm();
});

chrome.runtime.onStartup.addListener(() => {
  ensureAlarm();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === constants.FLUSH_ALARM_NAME) {
    flushPending();
  }
});

chrome.tabs.onActivated.addListener(async () => {
  const state = await getState();
  if (!state.session) return;
  const tabSwitchCount = Number(state.session.tab_switch_count || 0) + 1;
  await setSession({ ...state.session, tab_switch_count: tabSwitchCount });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== "object") {
    sendResponse({ ok: false, error: "invalid_message" });
    return false;
  }

  (async () => {
    if (message.type === "SESSION_START") {
      const startIso =
        typeof message.started_at === "string" && message.started_at.trim()
          ? message.started_at
          : asIso();
      const session = {
        session_id: message.session_id || null,
        plan_id: message.plan_id || null,
        task_type: message.task_type || "study",
        deadline_active: Boolean(message.deadline_active),
        agency_goal: Number(message.agency_goal || 70),
        intent_text: message.intent_text || null,
        must_keep_points: Array.isArray(message.must_keep_points) ? message.must_keep_points : [],
        started_at: startIso,
        session_version: message.session_version || startIso,
        tab_switch_count: 0,
      };
      await setSession(session);
      await setLastStatus({
        status: "waiting_for_ai_capture",
        reason: null,
        score_mode: "unscored",
        scored_at: startIso,
        last_site_host: null,
      });
      await broadcastSessionSync(session);
      await ensureAlarm();
      sendResponse({ ok: true, session });
      return;
    }

    if (message.type === "SESSION_END") {
      const state = await getState();
      if (
        message.session_id &&
        state.session &&
        state.session.session_id &&
        state.session.session_id !== message.session_id
      ) {
        sendResponse({ ok: false, error: "session_id_mismatch" });
        return;
      }
      await flushPending();
      await clearSession();
      await setLastStatus({
        status: "unscored",
        reason: "session_inactive",
        score_mode: "unscored",
        scored_at: asIso(),
        last_site_host: null,
      });
      await broadcastSessionSync(null);
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "CONTENT_READY") {
      await setContentStatus({
        host: message.host || null,
        path: message.path || null,
        at: message.at || asIso(),
        last_event: "content_ready",
        detail: null,
      });
      await appendDebugTrace({
        at: message.at || asIso(),
        host: message.host || null,
        event_name: "content_ready",
        detail: { path: message.path || null },
      });
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "CONTENT_DEBUG_EVENT") {
      await appendDebugTrace({
        at: message.at || asIso(),
        host: message.host || null,
        event_name: message.event_name || "content_debug_event",
        detail: message.detail || null,
      });
      await setContentStatus({
        host: message.host || null,
        path: null,
        at: message.at || asIso(),
        last_event: message.event_name || "content_debug_event",
        detail: message.detail || null,
      });
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "SCORE_STATUS") {
      await setLastStatus({
        status: message.status || "unscored",
        reason: message.reason || null,
        score_mode: message.score_mode || null,
        scored_at: message.scored_at || asIso(),
        last_site_host: message.site_host || null,
        score: message.score || null,
      });
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "SCORE_EVENT") {
      const summary = message.summary;
      if (!summary || typeof summary !== "object") {
        sendResponse({ ok: false, error: "missing_summary" });
        return;
      }

      const state = await getState();

      if (!isValidScoredSummary(summary)) {
        await appendDebugTrace({
          at: summary.scored_at || asIso(),
          host: summary.site_host || null,
          event_name: "score_event_ignored",
          detail: {
            status: summary.status || "unknown",
            score_mode: summary.score_mode || null,
            reason: summary.reason || "missing_ai_context",
          },
        });
        await setLastStatus({
          status: summary.status || "unscored",
          reason: summary.reason || "missing_ai_context",
          score_mode: summary.score_mode || "unscored",
          scored_at: summary.scored_at || asIso(),
          last_site_host: summary.site_host || null,
          score: null,
        });
        sendResponse({ ok: true, ignored: true });
        return;
      }

      const session = state.session || {
        session_id: summary.session_id || null,
        plan_id: summary.plan_id || null,
        task_type: summary.task_type || "study",
        deadline_active: Boolean(summary.deadline_active),
        agency_goal: Number(summary.agency_goal || 70),
        tab_switch_count: 0,
      };

      if (!state.session) {
        await setSession(session);
      }

      const rollingScores = await updateRolling(summary);
      await enqueueSummary(summary);
      await flushPending();
      await appendDebugTrace({
        at: summary.scored_at || asIso(),
        host: summary.site_host || null,
        event_name: "score_event_accepted",
        detail: {
          score_mode: summary.score_mode,
          agency_score: summary.score?.agency_score ?? null,
          agency_band: summary.score?.agency_band ?? null,
        },
      });
      await setLastStatus({
        status: summary.score_mode === "partial" ? "partial" : "ok",
        reason: null,
        score_mode: summary.score_mode,
        scored_at: summary.scored_at || asIso(),
        last_site_host: summary.site_host || null,
        score: summary.score,
      });

      await maybeShowStageATrigger({
        sender,
        session,
        summary,
        rollingScores,
        lastBannerTimes: state.lastBannerTimes,
      });

      sendResponse({ ok: true });
      return;
    }

    if (message.type === "GET_EXT_USER_ID") {
      const userId = await getOrCreateExtUserId();
      sendResponse({ ok: true, user_id: userId });
      return;
    }

    if (message.type === "CLASSIFY_INTENT") {
      try {
        const endpoint = `${constants.API_BASE_URL}/classify-intent`;
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: message.text || "" }),
        });
        if (!response.ok) {
          sendResponse({ ok: false });
          return;
        }
        const data = await response.json();
        sendResponse({
          ok: true,
          intent: data.intent || null,
          polarity: data.polarity || null,
          confidence: Number(data.confidence || 0),
        });
      } catch (error) {
        sendResponse({ ok: false });
      }
      return;
    }

    if (message.type === "FLUSH_NOW") {
      await flushPending();
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "GET_POPUP_STATE") {
      const state = await getState();
      const latest = state.rollingScores.length ? state.rollingScores[state.rollingScores.length - 1] : null;
      const activeTab = await getActiveTabContext();
      const sessionActive = Boolean(state.session && state.session.session_id);
      const lastScoreStatus = activeTab.supported
        ? state.lastStatus?.status || (sessionActive ? "waiting_for_ai_capture" : "unscored")
        : (sessionActive ? "unsupported_site" : "unscored");

      sendResponse({
        ok: true,
        latest,
        session: state.session,
        session_active: sessionActive,
        page_supported: activeTab.supported,
        current_host: activeTab.host,
        last_score_status: lastScoreStatus,
        last_scored_at: state.lastStatus?.scored_at || null,
        last_site_host: state.lastStatus?.last_site_host || activeTab.host || null,
        pending_count: state.pendingFlush.length,
        content_status: state.contentStatus,
        debug_tail: state.debugTrace.slice(-5),
      });
      return;
    }

    sendResponse({ ok: false, error: "unknown_type" });
  })();

  return true;
});
