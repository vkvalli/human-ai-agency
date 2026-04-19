import Card from "../common/Card";
import SectionHeader from "../common/SectionHeader";

function TriggerCard({ item, compact = false }) {
  const impactStyles = {
    High: "bg-rose-100/90 text-rose-700 ring-1 ring-rose-200/80",
    Medium: "bg-amber-100/90 text-amber-700 ring-1 ring-amber-200/80",
  };

  return (
    <div
      className={`rounded-[1.5rem] border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(240,249,255,0.78))] shadow-[0_14px_34px_rgba(4,42,74,0.08)] ${
        compact ? "p-4" : "p-4 sm:p-5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            {item.type}
          </p>
          <h3
            className={`mt-2 font-semibold leading-7 text-slate-950 ${
              compact ? "text-base" : "text-lg"
            }`}
          >
            {item.title}
          </h3>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${impactStyles[item.impact]}`}
        >
          {item.impact}
        </span>
      </div>

      <p
        className={`mt-4 text-sm leading-6 text-slate-700/90 ${
          compact ? "max-w-none" : ""
        }`}
      >
        {item.description}
      </p>
    </div>
  );
}

export default function DriftTriggers({ items, compact = false }) {
  return (
    <Card className="relative overflow-hidden border-cyan-100/80 bg-[linear-gradient(170deg,rgba(239,250,255,0.92),rgba(203,238,255,0.84)_55%,rgba(186,228,252,0.8)_100%)] p-6 shadow-[0_22px_54px_rgba(3,54,89,0.16)] sm:p-7">
      <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.72),rgba(186,230,253,0.46)_42%,transparent_78%)]" />
      <div className="absolute left-[-1.5rem] top-8 h-14 w-14 rounded-full border border-white/55 bg-white/18 blur-2xl" />
      <SectionHeader
        title="Top Drift Triggers"
        description="Events and patterns most associated with drops in agency."
      />

      <div
        className={`grid gap-4 ${
          compact ? "grid-cols-1" : "md:grid-cols-2 xl:grid-cols-3"
        }`}
      >
        {items.map((item) => (
          <TriggerCard key={item.title} item={item} compact={compact} />
        ))}
      </div>
    </Card>
  );
}
