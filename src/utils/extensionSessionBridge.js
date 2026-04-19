const SESSION_STORAGE_KEY = "agency_dashboard_active_session";
const USER_ID_STORAGE_KEY = "agency_dashboard_user_id";

const DASHBOARD_MESSAGE_TYPES = {
  START: "AGENCY_SESSION_START",
  END: "AGENCY_SESSION_END",
};

function asString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function clampGoal(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 70;
  return Math.max(0, Math.min(100, parsed));
}

function buildId(prefix) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const seed = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${seed}`;
}

function buildUuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const template = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  return template.replace(/[xy]/g, (char) => {
    const r = Math.floor(Math.random() * 16);
    const v = char === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getStoredJson(key) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function setStoredJson(key, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function removeStored(key) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

function postBridgeMessage(type, payload) {
  if (typeof window === "undefined" || typeof window.postMessage !== "function") {
    return;
  }
  window.postMessage({ type, payload }, window.location.origin);
}

function getOrCreateUserId() {
  if (typeof window === "undefined") {
    return buildId("user");
  }
  const existing = asString(window.localStorage.getItem(USER_ID_STORAGE_KEY));
  if (existing) return existing;
  const created = buildUuid();
  window.localStorage.setItem(USER_ID_STORAGE_KEY, created);
  return created;
}

async function requestBackendSessionStart({
  apiBaseUrl,
  userId,
  taskType,
  deadlineActive,
  intentText,
  planId,
}) {
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/session/start`;
  const body = {
    user_id: userId,
    task_type: taskType,
    deadline_active: deadlineActive,
    intent_text: intentText || null,
  };
  if (planId) {
    body.plan_id = planId;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`session_start_failed_${response.status}`);
  }

  const data = await response.json();
  return {
    sessionId: asString(data?.session_id || data?.sessionId),
    startedAt: asString(data?.started_at || data?.startedAt),
    source: "backend",
  };
}

export function getActiveDashboardSession() {
  return getStoredJson(SESSION_STORAGE_KEY);
}

export async function startDashboardSession({
  intentText = "",
  agencyGoal = 70,
  taskType = "study",
  deadlineActive = false,
  planId = "",
  sessionVersion = "",
} = {}) {
  const normalizedIntent = asString(intentText);
  const normalizedTaskType = asString(taskType) || "study";
  const normalizedPlanId = asString(planId);
  const normalizedGoal = clampGoal(agencyGoal);
  const normalizedVersion = asString(sessionVersion) || `${Date.now()}`;
  const userId = getOrCreateUserId();
  const apiBaseUrl =
    asString(import.meta.env.VITE_SCORER_API_BASE_URL) || "http://127.0.0.1:8000";

  let session = null;
  try {
    session = await requestBackendSessionStart({
      apiBaseUrl,
      userId,
      taskType: normalizedTaskType,
      deadlineActive: Boolean(deadlineActive),
      intentText: normalizedIntent,
      planId: normalizedPlanId || undefined,
    });
  } catch {
    // Allow local-only fallback for demo resilience.
  }

  const nowIso = new Date().toISOString();
  const finalizedSession = {
    sessionId: asString(session?.sessionId) || buildId("session"),
    userId,
    planId: normalizedPlanId || null,
    startedAt: asString(session?.startedAt) || nowIso,
    agencyGoal: normalizedGoal,
    intentText: normalizedIntent,
    taskType: normalizedTaskType,
    deadlineActive: Boolean(deadlineActive),
    sessionVersion: normalizedVersion,
    source: session?.source || "local",
  };

  postBridgeMessage(DASHBOARD_MESSAGE_TYPES.START, finalizedSession);
  setStoredJson(SESSION_STORAGE_KEY, finalizedSession);
  return finalizedSession;
}

export function endDashboardSession(session) {
  const activeSession = session || getStoredJson(SESSION_STORAGE_KEY);
  if (!activeSession) return null;

  postBridgeMessage(DASHBOARD_MESSAGE_TYPES.END, {
    sessionId: asString(activeSession.sessionId),
  });
  removeStored(SESSION_STORAGE_KEY);
  return activeSession;
}
