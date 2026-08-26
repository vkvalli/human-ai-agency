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

  const stats = [
    { label: "Autonomous", value: `${data.autonomous}%` },
    { label: "AI-led", value: `${data.aiLed}%` },
    { label: "Mixed", value: `${data.mixed}%` },
    { label: "Drift Risk", value: driftRisk },
  ];

  return (
    <div className="relative min-h-[21rem] overflow-hidden rounded-[2.8rem] border border-slate-200 bg-slate-100 p-6 text-slate-900 shadow-[0_20px_45px_rgba(15,23,42,0.08)] sm:p-7 lg:px-8 lg:py-8">
      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-stretch xl:justify-between">
        <div className="max-w-[36rem] flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-medium text-slate-700">Agency Index</p>
            <span className="rounded-full border border-slate-200 bg-slate-200 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-slate-700">
              LIVE SNAPSHOT
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-4">
            <h2 className="text-6xl font-bold leading-none text-slate-900 sm:text-7xl">
              {data.score}
            </h2>
            <span className="rounded-full border border-slate-200 bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm">
              {data.score >= 85
                ? "Stable ownership"
                : data.score >= 70
                ? "Watch for drift"
                : "Recovery needed"}
            </span>
          </div>

          <p className="mt-4 max-w-[30rem] text-base leading-8 text-slate-700">
            {scoreSummary}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onViewInsights}
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_24px_rgba(15,23,42,0.14)] transition hover:scale-[1.02]"
            >
              View insights
            </button>

            <button
              onClick={() => navigate("/improvement#plan-mode-panel")}
              className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Open plan mode
            </button>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-3 sm:gap-4 xl:w-[360px]">
          {stats.map((stat, index) => (
            <Stat
              key={stat.label}
              label={stat.label}
              value={stat.value}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, index }) {
  return (
    <div
      className="min-h-[112px] rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_10px_22px_rgba(15,23,42,0.04)]"
      style={{ animationDelay: `${index * 1.8}s` }}
    >
      <p className="text-sm text-slate-600">{label}</p>
      <h3 className="mt-3 text-2xl font-bold text-slate-900">{value}</h3>
    </div>
  );
}
