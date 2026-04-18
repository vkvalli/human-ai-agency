import { useEffect, useRef, useState } from "react";
import AgencyBanner from "../components/dashboard/AgencyBanner";
import AgencyTrendChart from "../components/dashboard/AgencyTrendChart";
import DecisionAutonomyChart from "../components/dashboard/DecisionAutonomyChart";
import Card from "../components/common/Card";
import SectionHeader from "../components/common/SectionHeader";
import LiveAgencyBanner from "../components/popup/LiveAgencyBanner";
import TrackingSimulator from "../components/tracking/TrackingSimulator";
import { useTracking } from "../src/context/TrackingContext";
import { agencyTrend, popupInterventions } from "../data/mockData";

export default function HomePage() {
  const { metrics } = useTracking();

  const insightsSectionRef = useRef(null);


  const agencySummary = {
    score: metrics.score,
    autonomous: metrics.autonomous,
    aiLed: metrics.aiLed,
    mixed: metrics.mixed,
  };

  const liveAgencyStatus = {
    level: metrics.agencyLevel,
    score: metrics.score,
    reason: metrics.latestReason,
  };

  const autonomyData = [
    { name: "Autonomous", value: metrics.autonomous },
    { name: "AI-led", value: metrics.aiLed },
    { name: "Mixed", value: metrics.mixed },
  ];

  const handleViewInsights = () => {
    insightsSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="space-y-6">
      <AgencyBanner
        data={agencySummary}
        onViewInsights={handleViewInsights}
      />

      <LiveAgencyBanner
        status={liveAgencyStatus}
        onOpen={() => setOpenModal(true)}
      />

      <TrackingSimulator />

      <div ref={insightsSectionRef} className="grid gap-6 xl:grid-cols-2">
        <Card>
          <SectionHeader
            title="Agency Index Graph"
            description="Trend of decision ownership"
          />
          <AgencyTrendChart data={agencyTrend} />
        </Card>

        <Card>
          <SectionHeader
            title="Decision Autonomy"
            description="Autonomous vs AI-led decisions"
          />
          <DecisionAutonomyChart data={autonomyData} />
        </Card>
      </div>

    </div>
  );
}