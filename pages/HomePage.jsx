import { useRef, useState } from "react";
import AgencyBanner from "../components/dashboard/AgencyBanner";
import AgencyTrendChart from "../components/dashboard/AgencyTrendChart";
import DecisionAutonomyChart from "../components/dashboard/DecisionAutonomyChart";
import Card from "../components/common/Card";
import LiveAgencyBanner from "../components/popup/LiveAgencyBanner";
import TrackingSimulator from "../components/tracking/TrackingSimulator";
import { useTracking } from "../src/context/TrackingContext";

function clampScore(value) {
  return Math.max(50, Math.min(100, value));
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, value));
}

function buildWeeklyTrend(score) {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const offsets = [-12, -9, -7, -5, -3, -1, 0];

  return labels.map((day, index) => ({
    day,
    score: clampScore(score + offsets[index]),
  }));
}

function buildMonthlyTrend(score) {
  const labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
  const offsets = [-10, -7, -4, 0];

  return labels.map((day, index) => ({
    day,
    score: clampScore(score + offsets[index]),
  }));
}

function buildMonthlyAutonomyData(metrics) {
  const autonomous = clampPercent(
    metrics.autonomous - (metrics.deadlineTriggers > 0 ? 4 : 2)
  );
  const aiLed = clampPercent(metrics.aiLed + (metrics.aiAccepts > 0 ? 3 : 1));
  const mixed = Math.max(0, 100 - autonomous - aiLed);

  return [
    { name: "Autonomous", value: autonomous },
    { name: "AI-led", value: aiLed },
    { name: "Mixed", value: mixed },
  ];
}

function buildHistoryTrend(historyScores, range) {
  const maxPoints = range === "week" ? 7 : 30;
  const selected = historyScores.slice(-maxPoints);
  if (!selected.length) {
    return [];
  }

  return selected.map((point) => {
    const scoredAt = new Date(point.scored_at);
    const label =
      range === "week"
        ? scoredAt.toLocaleDateString([], { weekday: "short" })
        : scoredAt.toLocaleDateString([], { month: "short", day: "numeric" });

    return {
      day: label,
      score: clampScore(Number(point.agency_score || 0)),
    };
  });
}

function RangeToggle({ value, onChange }) {
  return (
    <div className="inline-flex rounded-full border border-cyan-200 bg-slate-50 p-1">
      <button
        type="button"
        onClick={() => onChange("week")}
        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
          value === "week"
            ? "bg-cyan-500 text-white shadow-sm"
            : "text-cyan-700 hover:bg-cyan-100"
        }`}
      >
        1 week
      </button>
      <button
        type="button"
        onClick={() => onChange("month")}
        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
          value === "month"
            ? "bg-cyan-500 text-white shadow-sm"
            : "text-cyan-700 hover:bg-cyan-100"
        }`}
      >
        1 month
      </button>
    </div>
  );
}

function ChartCardHeader({ title, description, range, onRangeChange }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-cyan-800">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>

      <RangeToggle value={range} onChange={onRangeChange} />
    </div>
  );
}

export default function HomePage() {
  const { metrics, dataSource, historyScores } = useTracking();
  const insightsSectionRef = useRef(null);
  const [trendRange, setTrendRange] = useState("week");
  const [autonomyRange, setAutonomyRange] = useState("week");

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

  const backendTrendData = buildHistoryTrend(historyScores, trendRange);
  const trendData =
    dataSource === "backend" && backendTrendData.length > 0
      ? backendTrendData
      : trendRange === "week"
      ? buildWeeklyTrend(metrics.score)
      : buildMonthlyTrend(metrics.score);

  const decisionAutonomyData =
    autonomyRange === "week"
      ? autonomyData
      : buildMonthlyAutonomyData(metrics);

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

      <LiveAgencyBanner status={liveAgencyStatus} />

      {dataSource === "local" ? <TrackingSimulator /> : null}

      <div ref={insightsSectionRef} className="grid gap-6 xl:grid-cols-2">
        <Card className="min-w-0 p-6 sm:p-7">
          <ChartCardHeader
            title="Agency Index Graph"
            description="Trend of decision ownership"
            range={trendRange}
            onRangeChange={setTrendRange}
          />
          <div className="mt-5 min-w-0">
            <AgencyTrendChart data={trendData} />
          </div>
        </Card>

        <Card className="min-w-0 p-6 sm:p-7">
          <ChartCardHeader
            title="Decision Autonomy"
            description="Autonomous vs AI-led decisions"
            range={autonomyRange}
            onRangeChange={setAutonomyRange}
          />
          <div className="mt-5 min-w-0">
            <DecisionAutonomyChart data={decisionAutonomyData} />
          </div>
        </Card>
      </div>
    </div>
  );
}
