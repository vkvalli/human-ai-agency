import { useNavigate } from "react-router-dom";

export default function AgencyBanner({ data, onViewInsights }) {
  const navigate = useNavigate();

  const driftRisk =
    data.score >= 85 ? "Moderate" : data.score >= 70 ? "Elevated" : "High";

  const scoreSummary =
    data.score >= 85
      ? "Your decisions still reflect strong ownership, and this view is mainly tracking pressure moments before they turn into drift."
      : data.score >= 70
      ? "Your decisions are still balanced, but pressure-heavy workflows are starting to pull too much ownership toward fast AI use."
      : "Decision ownership is slipping under pressure, so the next few actions should slow down approval and restore manual review.";

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] border border-cyan-200/40 bg-gradient-to-r from-[#0b3a53] via-[#0ea5b7] to-[#22d3ee] p-6 text-white shadow-[0_20px_50px_rgba(20,184,166,0.22)] sm:p-7">
      <div className="absolute -left-8 top-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute right-10 top-4 h-24 w-24 rounded-full bg-pink-300/20 blur-2xl" />

      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-stretch xl:justify-between">
        <div className="max-w-2xl flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-medium text-white/85">Agency Index</p>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-white/90">
              LIVE SNAPSHOT
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-4">
            <h2 className="text-6xl font-bold leading-none sm:text-7xl">
              {data.score}
            </h2>
            <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-md">
              {data.score >= 85
                ? "Stable ownership"
                : data.score >= 70
                ? "Watch for drift"
                : "Recovery needed"}
            </span>
          </div>

          <p className="mt-4 max-w-xl text-base leading-7 text-white/90">
            {scoreSummary}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onViewInsights}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-cyan-600 shadow-sm transition hover:scale-[1.02]"
            >
              View insights
            </button>

            <button
              onClick={() => navigate("/improvement#plan-mode-panel")}
              className="rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Open plan mode
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:w-[340px]">
          <Stat label="Autonomous" value={`${data.autonomous}%`} />
          <Stat label="AI-led" value={`${data.aiLed}%`} />
          <Stat label="Mixed" value={`${data.mixed}%`} />
          <Stat label="Drift Risk" value={driftRisk} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="min-h-[96px] rounded-[1.4rem] border border-white/15 bg-white/15 p-4 backdrop-blur-md">
      <p className="text-sm text-white/80">{label}</p>
      <h3 className="mt-3 text-2xl font-bold">{value}</h3>
    </div>
  );
}
