export default function LiveAgencyBanner({ status }) {
  const levelStyles = {
    High: "bg-emerald-100 text-emerald-700",
    Medium: "bg-amber-100 text-amber-700",
    Low: "bg-rose-100 text-rose-700",
  };

  const signalDotStyles = {
    High: "bg-emerald-400",
    Medium: "bg-amber-400",
    Low: "bg-rose-400",
  };

  const nextFocus =
    status.level === "High"
      ? "Keep approvals deliberate while the score is strong."
      : status.level === "Medium"
      ? "Watch the next few submissions closely for rushed approval."
      : "Slow down the next decision and reclaim manual review first.";

  return (
    <div className="rounded-3xl border border-sky-100/80 bg-white/90 p-5 shadow-[0_18px_44px_rgba(4,42,74,0.16)] backdrop-blur-xl sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${levelStyles[status.level]}`}
            >
              {status.level} Agency
            </span>
            <span className="flex items-center gap-2 text-sm text-slate-500">
              <span
                className={`h-2.5 w-2.5 rounded-full ${signalDotStyles[status.level]}`}
              />
              Live status
            </span>
            <span className="text-sm text-slate-500">Score: {status.score}</span>
          </div>

          <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900">
            Live Agency Banner
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {status.reason}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:w-[320px]">
          <div className="rounded-2xl border border-sky-100 bg-white/68 p-4 backdrop-blur-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Current level
            </p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {status.level} agency
            </p>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-white/68 p-4 backdrop-blur-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Next focus
            </p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {nextFocus}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
