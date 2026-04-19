(function initSessionBridge(root) {
  const ns = (root.AgencyExt = root.AgencyExt || {});
  const constants = ns.constants;

  if (!constants) {
    return;
  }

  function isAllowedOrigin(origin) {
    if (!origin || typeof origin !== "string") return false;
    return constants.DASHBOARD_ALLOWED_ORIGINS.includes(origin);
  }

  function asString(value) {
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }

  function toBoolean(value) {
    return value === true;
  }

  function toGoal(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 70;
    return Math.max(0, Math.min(100, parsed));
  }

  function buildStartMessage(payload) {
    const sessionId = asString(payload.sessionId || payload.session_id);
    if (!sessionId) return null;

    return {
      type: "SESSION_START",
      source: "dashboard_bridge",
      session_id: sessionId,
      plan_id: asString(payload.planId || payload.plan_id),
      agency_goal: toGoal(payload.agencyGoal || payload.agency_goal),
      intent_text: asString(payload.intentText || payload.intent_text),
      task_type: asString(payload.taskType || payload.task_type) || "study",
      deadline_active: toBoolean(payload.deadlineActive || payload.deadline_active),
      started_at: asString(payload.startedAt || payload.started_at) || new Date().toISOString(),
      session_version: asString(payload.sessionVersion || payload.session_version),
    };
  }

  function buildEndMessage(payload) {
    const sessionId = asString(payload.sessionId || payload.session_id);
    if (!sessionId) return null;

    return {
      type: "SESSION_END",
      source: "dashboard_bridge",
      session_id: sessionId,
    };
  }

  function buildClearMessage() {
    return {
      type: "SESSION_END",
      source: "dashboard_bridge",
      session_id: null,
    };
  }

  function forwardToWorker(message) {
    chrome.runtime.sendMessage(message, () => {
      const ignored = chrome.runtime.lastError;
      void ignored;
    });
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (!isAllowedOrigin(event.origin)) return;
    if (!event.data || typeof event.data !== "object") return;

    const msgType = event.data.type;
    const payload = event.data.payload && typeof event.data.payload === "object" ? event.data.payload : {};

    if (msgType === constants.DASHBOARD_MESSAGE_TYPES.START) {
      const message = buildStartMessage(payload);
      if (message) forwardToWorker(message);
      return;
    }

    if (msgType === constants.DASHBOARD_MESSAGE_TYPES.END) {
      const message = buildEndMessage(payload);
      if (message) forwardToWorker(message);
      return;
    }

    if (msgType === constants.DASHBOARD_MESSAGE_TYPES.CLEAR) {
      forwardToWorker(buildClearMessage());
    }
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
