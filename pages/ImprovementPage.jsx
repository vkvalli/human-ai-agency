import { useEffect } from "react";
import IntentMapPanel from "../components/improvement/IntentMapPanel";
import GoalTracker from "../components/improvement/GoalTracker";
import PlanModePanel from "../components/improvement/PlanModePanel";
import { useTracking } from "../src/context/TrackingContext";
import { buildIntentMap } from "../src/utils/buildIntentMap";
import { buildInterventions } from "../src/utils/buildInterventions";
import { buildAgencyGoals } from "../src/utils/buildAgencyGoals";
import { buildPlanMode } from "../src/utils/buildPlanMode";

function buildIntentSummary(metrics) {
  if (metrics.agencyLevel === "Low") {
    return {
      title: "Agency recovery mode",
      description:
        "Recent behavior suggests a drop in decision ownership. The system is prioritizing steps that slow down passive AI reliance and restore manual judgment.",
    };
  }

  if (metrics.agencyLevel === "Medium") {
    return {
      title: "Stabilize decision ownership",
      description:
        "Your agency is still stable, but some drift signals are appearing. Focus on reducing pressure-driven and multitasking-based decisions.",
    };
  }

  return {
    title: "Maintain strong agency",
    description:
      "Your recent patterns show healthy decision ownership. The map is focusing on preserving good habits and avoiding subtle drift.",
  };
}

export default function ImprovementPage() {
  const { metrics, events } = useTracking();

  useEffect(() => {
    if (window.location.hash === "#plan-mode-panel") {
      const el = document.getElementById("plan-mode-panel");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, []);

  const dynamicIntentSteps = buildIntentMap(metrics);
  const dynamicInterventions = buildInterventions(metrics);
  const dynamicAgencyGoals = buildAgencyGoals(events);
  const dynamicPlanMode = buildPlanMode(metrics);
  const agencyGoalTarget =
    dynamicAgencyGoals[dynamicAgencyGoals.length - 1]?.target ?? 70;
  const summary = buildIntentSummary(metrics);

  return (
    <div className="space-y-8">
      <IntentMapPanel
        steps={dynamicIntentSteps}
        interventions={dynamicInterventions}
        summary={summary}
      />

      <GoalTracker goals={dynamicAgencyGoals} />

      <PlanModePanel
        tasks={dynamicPlanMode.tasks}
        tips={dynamicPlanMode.tips}
        agencyGoalTarget={agencyGoalTarget}
      />
    </div>
  );
}
