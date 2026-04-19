import Card from "../common/Card";
import SectionHeader from "../common/SectionHeader";

export default function BaselineTracking({ data }) {
  return (
    <Card className="p-6 sm:p-7">
      <SectionHeader
        title="Baseline Agency Quality Tracking"
        description="Weekly baseline trend for agency quality."
      />

      <div className="space-y-3">
        {data.map((item) => (
          <div
            key={item.label}
            className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm">
                  {item.label}
                </span>
                <span className="text-sm font-medium text-slate-700">
                  Weekly baseline
                </span>
              </div>

              <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
                {item.value}
              </span>
            </div>

            <div className="h-3 rounded-full bg-white shadow-inner">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-[#0ea5b7] via-[#22d3ee] to-[#38bdf8]"
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
