import FactorsGrid from "../components/insights/FactorsGrid";
import DecisionTable from "../components/insights/DecisionTable";
import BaselineTracking from "../components/insights/BaselineTracking";
import DriftTriggers from "../components/insights/DriftTriggers";
import { useTracking } from "../src/context/TrackingContext";
import { buildFactorCards } from "../src/utils/buildFactorCards";
import { buildDriftTriggers } from "../src/utils/buildDriftTriggers";
import { buildDecisionRows } from "../src/utils/buildDecisionRows";
import { buildBaselineTracking } from "../src/utils/buildBaselineTracking";
import { baselineTracking } from "../data/mockData";

export default function InsightsPage() {
  const { metrics, events } = useTracking();

  const dynamicFactorCards = buildFactorCards(metrics);
  const dynamicDriftTriggers = buildDriftTriggers(metrics);
  const dynamicDecisionRows = buildDecisionRows(events);
  const dynamicBaselineTracking = buildBaselineTracking(events);
  return (
    <div className="space-y-8">
      <FactorsGrid items={dynamicFactorCards} />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <DecisionTable rows={dynamicDecisionRows} />
        <BaselineTracking data={dynamicBaselineTracking} />
      </div>

      <DriftTriggers items={dynamicDriftTriggers} />
    </div>
  );
}