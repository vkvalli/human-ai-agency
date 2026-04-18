import Card from "../common/Card";
import SectionHeader from "../common/SectionHeader";

function TriggerCard({ item }) {
  const impactStyles = {
    High: "bg-rose-100 text-rose-700",
    Medium: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{item.type}</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">
            {item.title}
          </h3>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${impactStyles[item.impact]}`}
        >
          {item.impact}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
    </div>
  );
}

export default function DriftTriggers({ items }) {
  return (
    <Card>
      <SectionHeader
        title="Top Drift Triggers"
        description="Events and patterns most associated with drops in agency."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <TriggerCard key={item.title} item={item} />
        ))}
      </div>
    </Card>
  );
}