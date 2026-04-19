import { useNavigate } from "react-router-dom";

export default function AgencyBanner({ data, onViewInsights }) {

    const navigate = useNavigate();

    return (
          <div className="relative overflow-hidden rounded-[2.5rem] border border-cyan-200/40 bg-gradient-to-r from-[#0b3a53] via-[#0ea5b7] to-[#22d3ee] p-6 text-white shadow-[0_20px_50px_rgba(20,184,166,0.22)]">
          <div className="absolute -left-8 top-0 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute right-10 top-4 h-24 w-24 rounded-full bg-pink-300/20 blur-2xl" />
  
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-white/85">Agency Index</p>
              <h2 className="mt-2 text-6xl font-bold leading-none">{data.score}</h2>
              <p className="mt-4 text-base text-white/90">
                Your decisions still reflect strong ownership, but AI reliance is
                increasing during pressure-heavy workflows.
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
  
            <div className="grid grid-cols-2 gap-4 lg:w-[320px]">
              <Stat label="Autonomous" value={`${data.autonomous}%`} />
              <Stat label="AI-led" value={`${data.aiLed}%`} />
              <Stat label="Mixed" value={`${data.mixed}%`} />
              <Stat label="Drift Risk" value="Moderate" />
            </div>
          </div>
        </div>
    );
  }
  
  function Stat({ label, value }) {
    return (
      <div className="rounded-2xl border border-white/15 bg-white/15 p-4 backdrop-blur-md">
        <p className="text-sm text-white/80">{label}</p>
        <h3 className="mt-2 text-2xl font-bold">{value}</h3>
      </div>
    );
  }