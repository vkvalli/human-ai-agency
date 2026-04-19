const SESSION_STORAGE_KEY = "agency_dashboard_active_session";

const DASHBOARD_MESSAGE_TYPES = {
  START: "AGENCY_SESSION_START",
  END: "AGENCY_SESSION_END",
};

function clampGoal(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 70;
  return Math.max(0, Math.min(100, parsed));
}

function asString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function buildId(prefix) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const seed = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${seed}`;
}

function safeReadStoredSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveStoredSession(session) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function clearStoredSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

function postBridgeMessage(type, payload) {
  if (typeof window === "undefined" || typeof window.postMessage !== "function") {
    return;
  }
  window.postMessage({ type, payload }, window.location.origin);
}

async function requestBackendSessionStart({ apiBaseUrl, planId, agencyGoal, taskType, deadlineActive, intentText }) {
  const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/session/start`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      plan_id: planId,
      agency_goal: agencyGoal,
      task_type: taskType,
      deadline_active: deadlineActive,
      intent_text: intentText || null,
    }),
  });

  if (!response.ok) {
    throw new Error(`session_start_failed_${response.status}`);
  }

  const data = await response.json();
  return {
    sessionId: asString(data?.session_id || data?.sessionId),
    planId: asString(data?.plan_id || data?.planId || planId),
    startedAt: asString(data?.started_at || data?.startedAt),
    source: "backend",
  };
}

export function getActiveDashboardSession() {
  return safeReadStoredSession();
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
  const normalizedGoal = clampGoal(agencyGoal);
  const normalizedTaskType = asString(taskType) || "study";
  const normalizedPlanId = asString(planId) || buildId("plan");
  const normalizedVersion = asString(sessionVersion) || `${Date.now()}`;
  const apiBaseUrl =
    asString(import.meta.env.VITE_SCORER_API_BASE_URL) || "http://127.0.0.1:8000";

  let session = null;

  try {
    session = await requestBackendSessionStart({
      apiBaseUrl,
      planId: normalizedPlanId,
      agencyGoal: normalizedGoal,
      taskType: normalizedTaskType,
      deadlineActive: Boolean(deadlineActive),
      intentText: normalizedIntent,
    });
  } catch {
    // Backend wiring can be added later; local fallback keeps extension bridge active.
  }

  const nowIso = new Date().toISOString();
  const finalizedSession = {
    sessionId: asString(session?.sessionId) || buildId("session"),
    planId: asString(session?.planId) || normalizedPlanId,
    startedAt: asString(session?.startedAt) || nowIso,
    agencyGoal: normalizedGoal,
    intentText: normalizedIntent,
    taskType: normalizedTaskType,
    deadlineActive: Boolean(deadlineActive),
    sessionVersion: normalizedVersion,
    source: session?.source || "local",
  };

  postBridgeMessage(DASHBOARD_MESSAGE_TYPES.START, finalizedSession);
  saveStoredSession(finalizedSession);
  return finalizedSession;
}

export function endDashboardSession(session) {
  const activeSession = session || safeReadStoredSession();
  if (!activeSession) return null;

  postBridgeMessage(DASHBOARD_MESSAGE_TYPES.END, {
    sessionId: asString(activeSession.sessionId),
  });
  clearStoredSession();
  return activeSession;
}
