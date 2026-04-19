export default function FactorCard({ item }) {
    const levelStyles = {
      High: "bg-rose-100 text-rose-700",
      Medium: "bg-amber-100 text-amber-700",
      Positive: "bg-emerald-100 text-emerald-700",
    };
  
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${levelStyles[item.level]}`}
          >
            {item.level}
          </span>
        </div>
  
        <p className="mt-4 text-2xl font-bold text-slate-900">{item.score}</p>
  
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {item.description}
        </p>
      </div>
    );
  }