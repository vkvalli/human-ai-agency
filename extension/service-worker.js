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

async function getState() {
  const keys = constants.STORAGE_KEYS;
  const data = await storage.get([
    keys.SESSION,
    keys.ROLLING_SCORES,
    keys.LAST_BANNER_TIMES,
    keys.PENDING_FLUSH,
  ]);

  return {
    session: data[keys.SESSION] || null,
    rollingScores: Array.isArray(data[keys.ROLLING_SCORES]) ? data[keys.ROLLING_SCORES] : [],
    lastBannerTimes: data[keys.LAST_BANNER_TIMES] || {},
    pendingFlush: Array.isArray(data[keys.PENDING_FLUSH]) ? data[keys.PENDING_FLUSH] : [],
  };
}

async function setSession(session) {
  await storage.set({ [constants.STORAGE_KEYS.SESSION]: session });
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
  };
  return storage.appendToArray(
    constants.STORAGE_KEYS.ROLLING_SCORES,
    scorePoint,
    constants.ROLLING_WINDOW_SIZE
  );
}

function buildTrigger(rollingScores, session, summary) {
  const score = summary.score;
  const lowHigh = score.agency_band === "low" && score.reliance_risk > 0.65;

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
      return;
    }

    await storage.set({ [constants.STORAGE_KEYS.PENDING_FLUSH]: [] });
  } catch (error) {
    // Keep queue for retry on next alarm.
    console.warn("[AgencyExt] flush failed", error);
  }
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
      const session = {
        session_id: message.session_id || null,
        plan_id: message.plan_id || null,
        task_type: message.task_type || "study",
        deadline_active: Boolean(message.deadline_active),
        agency_goal: Number(message.agency_goal || 70),
        intent_text: message.intent_text || null,
        started_at: new Date().toISOString(),
        tab_switch_count: 0,
      };
      await setSession(session);
      await ensureAlarm();
      sendResponse({ ok: true, session });
      return;
    }

    if (message.type === "SESSION_END") {
      await flushPending();
      await clearSession();
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

    if (message.type === "GET_POPUP_STATE") {
      const state = await getState();
      const latest = state.rollingScores.length ? state.rollingScores[state.rollingScores.length - 1] : null;
      sendResponse({
        ok: true,
        latest,
        session: state.session,
        pending_count: state.pendingFlush.length,
      });
      return;
    }

    sendResponse({ ok: false, error: "unknown_type" });
  })();

  return true;
});
