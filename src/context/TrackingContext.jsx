import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { sampleTrackingEvents } from "../../data/trackingEvents";
import { requestExtensionUserId, adoptDashboardUserId } from "../utils/extensionSessionBridge";

const TrackingContext = createContext(null);
const USER_ID_STORAGE_KEY = "agency_dashboard_user_id";
const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function scoreToLevel(score) {
  if (score < 70) return "Low";
  if (score < 85) return "Medium";
  return "High";
}

function asNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readDashboardUserId() {
  if (typeof window === "undefined") return "";
  const raw = window.localStorage.getItem(USER_ID_STORAGE_KEY);
  return typeof raw === "string" ? raw.trim() : "";
}

function computeLocalMetrics(events) {
  const aiAccepts = events.filter((e) => e.type === "ai_accept").length;
  const manualEdits = events.filter((e) => e.type === "manual_edit").length;
  const tabSwitches = events.filter((e) => e.type === "tab_switch").length;
  const deadlineTriggers = events.filter(
    (e) => e.type === "deadline_trigger"
  ).length;

  const totalDecisionEvents = aiAccepts + manualEdits;
  const autonomous =
    totalDecisionEvents === 0
      ? 0
      : Math.round((manualEdits / totalDecisionEvents) * 100);
  const aiLed =
    totalDecisionEvents === 0
      ? 0
      : Math.round((aiAccepts / totalDecisionEvents) * 100);
  const mixed = Math.max(0, 100 - autonomous - aiLed);

  let score = 100;
  score -= aiAccepts * 8;
  score -= tabSwitches * 3;
  score -= deadlineTriggers * 10;
  score += manualEdits * 6;
  score = clamp(score, 0, 100);

  const agencyLevel = scoreToLevel(score);
  const latestReason =
    deadlineTriggers > 0
      ? "Deadline pressure and fast AI acceptance are reducing ownership."
      : tabSwitches > 2
      ? "Frequent context switching is increasing drift risk."
      : "Manual review behavior is helping preserve agency.";

  return {
    score,
    autonomous,
    aiLed,
    mixed,
    aiAccepts,
    manualEdits,
    tabSwitches,
    deadlineTriggers,
    agencyLevel,
    latestReason,
  };
}

function buildBackendEvents(historyScores) {
  return historyScores.map((point, index) => {
    const score = asNumber(point.agency_score, 0);
    const timestamp = Date.parse(point.scored_at) || Date.now();
    const type =
      score < 45 ? "ai_accept" : score < 70 ? "tab_switch" : "manual_edit";

    return {
      id: `backend-${index}-${timestamp}`,
      timestamp,
      type,
      app: "Extension",
      page: point.agency_band || "live-score",
      confidence: score >= 85 ? 5 : score >= 70 ? 4 : score >= 55 ? 3 : 2,
      intentMatch: score >= 70 ? "yes" : score >= 50 ? "not_sure" : "no",
      revisionDepth: score >= 80 ? "high" : score >= 55 ? "medium" : "low",
    };
  });
}

function buildBackendMetrics(historyScores, insights, trendDirection) {
  const latestPoint = historyScores.length
    ? historyScores[historyScores.length - 1]
    : null;
  const latestScore = latestPoint ? clamp(asNumber(latestPoint.agency_score, 0), 0, 100) : 100;

  const composition = insights?.decision_composition || {};
  const autonomousCount = asNumber(
    composition.user_led ?? composition.autonomous,
    0
  );
  const aiLedCount = asNumber(composition.ai_led, 0);
  const mixedCount = asNumber(composition.mixed, 0);
  const totalDecisions = autonomousCount + aiLedCount + mixedCount;

  const autonomous =
    totalDecisions > 0 ? Math.round((autonomousCount / totalDecisions) * 100) : 0;
  const aiLed =
    totalDecisions > 0 ? Math.round((aiLedCount / totalDecisions) * 100) : 0;
  const mixed = Math.max(0, 100 - autonomous - aiLed);

  const triggerRows = Array.isArray(insights?.top_drift_triggers)
    ? insights.top_drift_triggers
    : [];
  const triggerTotal = triggerRows.reduce(
    (sum, row) => sum + asNumber(row?.count, 0),
    0
  );
  const topTrigger = triggerRows[0]?.trigger_type || "";
  const agencyLevel = scoreToLevel(latestScore);

  let latestReason = "No scored events yet. Start a session and capture interactions.";
  if (historyScores.length > 0) {
    latestReason =
      topTrigger === "low_score"
        ? "Low-agency interactions were detected recently; slow down before accepting AI outputs."
        : topTrigger === "goal_drift"
        ? "Recent rolling scores fell below your goal; reinforce manual review checkpoints."
        : trendDirection === "down"
        ? "Agency trend is declining over the selected period."
        : trendDirection === "up"
        ? "Agency trend is improving as review behavior increases."
        : "Agency is steady; keep approvals deliberate.";
  }

  return {
    score: latestScore,
    autonomous,
    aiLed,
    mixed,
    aiAccepts: aiLedCount,
    manualEdits: autonomousCount,
    tabSwitches: 0,
    deadlineTriggers: triggerTotal,
    agencyLevel,
    latestReason,
  };
}

export function TrackingProvider({ children }) {
  const [localEvents, setLocalEvents] = useState(sampleTrackingEvents);
  const [userId, setUserId] = useState(() => readDashboardUserId());
  const [historyScores, setHistoryScores] = useState([]);
  const [insights, setInsights] = useState({
    top_drift_triggers: [],
    decision_composition: {},
    baseline_delta: 0,
    avg_by_task_type: {},
  });
  const [trendDirection, setTrendDirection] = useState("flat");
  const [backendState, setBackendState] = useState({
    connected: false,
    loading: false,
    error: null,
    lastSyncedAt: null,
  });

  const apiBaseUrl = (
    import.meta.env.VITE_SCORER_API_BASE_URL || DEFAULT_API_BASE_URL
  ).replace(/\/$/, "");

  const syncBackend = useCallback(async () => {
    if (!userId) {
      setHistoryScores([]);
      setInsights({
        top_drift_triggers: [],
        decision_composition: {},
        baseline_delta: 0,
        avg_by_task_type: {},
      });
      setTrendDirection("flat");
      setBackendState((prev) => ({
        ...prev,
        connected: false,
        loading: false,
        error: null,
      }));
      return;
    }

    setBackendState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [historyResponse, insightsResponse] = await Promise.all([
        fetch(
          `${apiBaseUrl}/history?user_id=${encodeURIComponent(
            userId
          )}&period=month`
        ),
        fetch(
          `${apiBaseUrl}/insights?user_id=${encodeURIComponent(
            userId
          )}&period=month`
        ),
      ]);

      if (!historyResponse.ok || !insightsResponse.ok) {
        throw new Error(
          `backend_fetch_failed_${historyResponse.status}_${insightsResponse.status}`
        );
      }

      const historyData = await historyResponse.json();
      const insightsData = await insightsResponse.json();

      setHistoryScores(
        Array.isArray(historyData?.scores) ? historyData.scores : []
      );
      setTrendDirection(
        ["up", "down", "flat"].includes(historyData?.trend_direction)
          ? historyData.trend_direction
          : "flat"
      );
      setInsights(
        insightsData && typeof insightsData === "object"
          ? insightsData
          : {
              top_drift_triggers: [],
              decision_composition: {},
              baseline_delta: 0,
              avg_by_task_type: {},
            }
      );

      setBackendState({
        connected: true,
        loading: false,
        error: null,
        lastSyncedAt: Date.now(),
      });
    } catch (error) {
      setBackendState((prev) => ({
        ...prev,
        connected: false,
        loading: false,
        error: error instanceof Error ? error.message : "backend_fetch_failed",
      }));
    }
  }, [apiBaseUrl, userId]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const next = readDashboardUserId();
      setUserId((current) => (current === next ? current : next));
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    requestExtensionUserId().then((extUserId) => {
      if (!extUserId) return;
      adoptDashboardUserId(extUserId);
      setUserId((current) => (current === extUserId ? current : extUserId));
    });
  }, []);

  useEffect(() => {
    syncBackend();
    const interval = window.setInterval(syncBackend, 5000);
    return () => window.clearInterval(interval);
  }, [syncBackend]);

  function addEvent(event) {
    setLocalEvents((prev) => [
      ...prev,
      {
        id: Date.now(),
        timestamp: Date.now(),
        ...event,
      },
    ]);
  }

  function clearEvents() {
    setLocalEvents([]);
  }

  const localMetrics = useMemo(
    () => computeLocalMetrics(localEvents),
    [localEvents]
  );
  const backendMetrics = useMemo(
    () => buildBackendMetrics(historyScores, insights, trendDirection),
    [historyScores, insights, trendDirection]
  );
  const backendEvents = useMemo(
    () => buildBackendEvents(historyScores),
    [historyScores]
  );

  const dataSource = backendState.connected ? "backend" : "local";
  const events = dataSource === "backend" ? backendEvents : localEvents;
  const metrics = dataSource === "backend" ? backendMetrics : localMetrics;

  return (
    <TrackingContext.Provider
      value={{
        events,
        addEvent,
        clearEvents,
        metrics,
        historyScores,
        insights,
        trendDirection,
        dataSource,
        backendState,
        refreshFromBackend: syncBackend,
      }}
    >
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking() {
  const context = useContext(TrackingContext);

  if (!context) {
    throw new Error("useTracking must be used inside TrackingProvider");
  }

  return context;
}
