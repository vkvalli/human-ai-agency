export default function LiveAgencyBanner({ status, onOpen }) {
    const levelStyles = {
      High: "bg-emerald-100 text-emerald-700",
      Medium: "bg-amber-100 text-amber-700",
      Low: "bg-rose-100 text-rose-700",
    };
  
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${levelStyles[status.level]}`}
              >
                {status.level} Agency
              </span>
              <span className="text-sm text-slate-500">
                Score: {status.score}
              </span>
            </div>
  
            <h3 className="mt-3 text-xl font-bold text-slate-900">
              Live Agency Banner
            </h3>
  
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {status.reason}
            </p>
          </div>
  
        </div>
      </div>
    );
  }