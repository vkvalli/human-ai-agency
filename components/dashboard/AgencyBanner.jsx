import { useNavigate } from "react-router-dom";

const heroBubbles = [
  { left: "50%", top: "20%", size: "0.8rem", delay: "-2s", duration: "13s", drift: "12px", end: "-10px" },
  { left: "56%", top: "34%", size: "0.95rem", delay: "-6s", duration: "15s", drift: "10px", end: "-12px" },
  { left: "62%", top: "14%", size: "0.65rem", delay: "-7s", duration: "11s", drift: "8px", end: "-8px" },
  { left: "66%", top: "46%", size: "0.75rem", delay: "-10s", duration: "14s", drift: "12px", end: "-11px" },
  { left: "72%", top: "26%", size: "1rem", delay: "-4s", duration: "15s", drift: "9px", end: "-10px" },
  { left: "76%", top: "58%", size: "0.8rem", delay: "-12s", duration: "13s", drift: "11px", end: "-9px" },
  { left: "82%", top: "18%", size: "0.7rem", delay: "-9s", duration: "12s", drift: "8px", end: "-7px" },
  { left: "86%", top: "34%", size: "1.05rem", delay: "-14s", duration: "16s", drift: "13px", end: "-12px" },
  { left: "68%", top: "54%", size: "0.9rem", delay: "-5s", duration: "14s", drift: "10px", end: "-9px" },
  { left: "88%", top: "48%", size: "0.75rem", delay: "-11s", duration: "16s", drift: "9px", end: "-8px" },
  { left: "60%", top: "66%", size: "0.85rem", delay: "-8s", duration: "15s", drift: "12px", end: "-11px" },
  { left: "92%", top: "24%", size: "0.95rem", delay: "-15s", duration: "17s", drift: "8px", end: "-10px" },
];

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
    <div className="relative min-h-[21rem] overflow-hidden rounded-[2.8rem] border border-cyan-100/45 bg-[#0d4672] p-6 text-white shadow-[0_30px_80px_rgba(3,26,43,0.38)] sm:p-7 lg:px-8 lg:py-8">
      <div className="absolute inset-0 hero-banner-scene" />
      <div className="absolute inset-0 hero-banner-scene-overlay" />
      <div className="absolute inset-y-0 left-0 w-[54%] hero-banner-copy-shade" />
      <div className="absolute inset-0 hero-card-caustics" />
      <div className="absolute inset-x-0 top-0 h-[52%] hero-card-sheen" />
      <div className="absolute -left-[8%] top-[-12%] h-56 w-56 rounded-full bg-white/8 blur-3xl" />
      <div className="absolute right-[8%] top-[12%] h-40 w-40 rounded-full bg-cyan-200/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 hidden md:block">
        {heroBubbles.map((bubble, index) => (
          <span
            key={`hero-bubble-${index}`}
            className="hero-bubble absolute"
            style={{
              left: bubble.left,
              top: bubble.top,
              width: bubble.size,
              height: bubble.size,
              "--hero-bubble-mid-x": bubble.drift,
              "--hero-bubble-end-x": bubble.end,
              animationDelay: bubble.delay,
              animationDuration: bubble.duration,
            }}
          />
        ))}
      </div>

      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-stretch xl:justify-between">
        <div className="max-w-[36rem] flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-medium text-white/90">Agency Index</p>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-white/92 backdrop-blur-md">
              LIVE SNAPSHOT
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-4">
            <h2 className="text-6xl font-bold leading-none sm:text-7xl">
              {data.score}
            </h2>
            <span className="rounded-full border border-white/12 bg-white/16 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-xl">
              {data.score >= 85
                ? "Stable ownership"
                : data.score >= 70
                ? "Watch for drift"
                : "Recovery needed"}
            </span>
          </div>

          <p className="mt-4 max-w-[30rem] text-base leading-8 text-white/92">
            {scoreSummary}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onViewInsights}
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-cyan-700 shadow-[0_14px_24px_rgba(255,255,255,0.18)] transition hover:scale-[1.02]"
            >
              View insights
            </button>

            <button
              onClick={() => navigate("/improvement#plan-mode-panel")}
              className="rounded-full border border-white/26 bg-white/8 px-6 py-3 text-sm font-semibold text-white backdrop-blur-lg transition hover:bg-white/16"
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
      className="hero-stat-card min-h-[112px] rounded-[1.75rem] border border-cyan-50/40 bg-cyan-100/18 p-5 backdrop-blur-xl"
      style={{ animationDelay: `${index * 1.8}s` }}
    >
      <p className="text-sm text-white/82">{label}</p>
      <h3 className="mt-3 text-2xl font-bold">{value}</h3>
    </div>
  );
}
