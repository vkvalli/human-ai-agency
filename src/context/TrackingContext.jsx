import { createContext, useContext, useMemo, useState } from "react";
import { sampleTrackingEvents } from "../../data/trackingEvents";

const TrackingContext = createContext(null);

export function TrackingProvider({ children }) {
  const [events, setEvents] = useState(sampleTrackingEvents);

  function addEvent(event) {
    setEvents((prev) => [
      ...prev,
      {
        id: Date.now(),
        timestamp: Date.now(),
        ...event,
      },
    ]);
  }

  function clearEvents() {
    setEvents([]);
  }

  const metrics = useMemo(() => {
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

    score = Math.max(0, Math.min(100, score));

    let agencyLevel = "High";
    if (score < 85) agencyLevel = "Medium";
    if (score < 70) agencyLevel = "Low";

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
  }, [events]);

  return (
    <TrackingContext.Provider
      value={{ events, addEvent, clearEvents, metrics }}
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