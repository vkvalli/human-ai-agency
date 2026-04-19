import { useEffect } from "react";
import IntentMapPanel from "../components/improvement/IntentMapPanel";
import GoalTracker from "../components/improvement/GoalTracker";
import PlanModePanel from "../components/improvement/PlanModePanel";
import { useTracking } from "../src/context/TrackingContext";
import { buildInterventions } from "../src/utils/buildInterventions";
import { buildAgencyGoals } from "../src/utils/buildAgencyGoals";
import { buildPlanMode } from "../src/utils/buildPlanMode";

function buildMonthlyAgencyAnalysis(metrics) {
  const levelText = {
    High: "strong",
    Medium: "stable but vulnerable",
    Low: "under pressure",
  }[metrics.agencyLevel];

  const strongestPressure =
    metrics.deadlineTriggers >= metrics.tabSwitches &&
    metrics.deadlineTriggers >= metrics.aiAccepts
      ? "deadline pressure is the clearest source of drift, especially when decisions are made too quickly near submission time"
      : metrics.tabSwitches >= metrics.aiAccepts
      ? "context switching is creating the most friction, which makes it harder to stay intentional from one decision to the next"
      : "fast AI acceptance is pulling ownership away from manual judgment more often than it should";

  const positiveSignal =
    metrics.manualEdits > 0
      ? `The healthiest signal this month is your manual review behavior, which is keeping ${metrics.autonomous}% of decision ownership anchored on the human side.`
      : "The current pattern shows very little manual review, so the human side of the workflow needs more visible checkpoints.";

  return `Over the last 30 days, your agency pattern looks ${levelText} with a current score of ${metrics.score}/100. Human-owned decisions account for ${metrics.autonomous}% of the tracked mix, while AI-led actions account for ${metrics.aiLed}%, which suggests that ${strongestPressure}. ${positiveSignal} For the next month, the best direction is to keep review moments visible before final actions so your work stays deliberate instead of reactive.`;
}

function buildWeeklyAgencyAnalysis(metrics) {
  const shortTermSignal =
    metrics.deadlineTriggers > 0
      ? "deadline pressure has been the sharpest short-term trigger, especially around final actions"
      : metrics.tabSwitches > 0
      ? "recent context switching has been interrupting decision flow more than it should"
      : "your recent pattern has stayed relatively steady without a major disruption signal";

  const ownershipSignal =
    metrics.autonomous >= metrics.aiLed
      ? `Human-owned decisions are still leading at ${metrics.autonomous}% of the mix, which means your review habits are giving you a decent foundation.`
      : `AI-led decisions are currently outpacing human-owned ones at ${metrics.aiLed}%, so your next few decisions need stronger manual checkpoints.`;

  return `Over the last 7 days, ${shortTermSignal}. Your current score sits at ${metrics.score}/100, and the pattern suggests this week is less about a major long-term drop and more about how quickly small moments of pressure can shift ownership. ${ownershipSignal} The best move for the coming week is to slow down final approvals and make your own judgment visible before submitting or accepting the next important output.`;
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

  const dynamicInterventions = buildInterventions(metrics);
  const dynamicAgencyGoals = buildAgencyGoals(events);
  const dynamicPlanMode = buildPlanMode(metrics);
  const agencyGoalTarget = dynamicAgencyGoals[dynamicAgencyGoals.length - 1]?.target ?? 70;
  const analyses = {
    week: {
      label: "Last 7 days",
      body: buildWeeklyAgencyAnalysis(metrics),
    },
    month: {
      label: "Last 30 days",
      body: buildMonthlyAgencyAnalysis(metrics),
    },
  };

  return (
    <div className="space-y-8">
      <IntentMapPanel
        analyses={analyses}
        interventions={dynamicInterventions}
      />

      

      <PlanModePanel plan={dynamicPlanMode} agencyGoalTarget={agencyGoalTarget} />
    </div>
  );
}
