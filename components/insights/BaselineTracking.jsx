import Card from "../common/Card";
import SectionHeader from "../common/SectionHeader";

export default function BaselineTracking({ data }) {
  return (
    <Card>
      <SectionHeader
        title="Baseline Agency Quality Tracking"
        description="Weekly baseline trend for agency quality."
      />

      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">{item.label}</span>
              <span className="text-slate-500">{item.value}</span>
            </div>

            <div className="h-3 rounded-full bg-slate-100">
              <div className="h-3 rounded-full bg-gradient-to-r from-[#0ea5b7] via-[#22d3ee] to-[#38bdf8]"
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}