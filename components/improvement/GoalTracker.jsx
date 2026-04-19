import Card from "../common/Card";
import SectionHeader from "../common/SectionHeader";

export default function GoalTracker({ goals }) {
  return (
    <Card>
      <div className="p-6 sm:p-7">
        <SectionHeader
          title="Agency Goal Tracker"
          description="Set target agency levels for specific days and compare against actual performance."
        />

        <div className="space-y-2.5">
          {goals.map((item) => {
            const actualWidth = `${item.actual}%`;
            const targetLeft = `${item.target}%`;

            return (
              <div
                key={item.day}
                className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm shadow-cyan-100/40 sm:px-5 sm:py-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm">
                    {item.day}
                  </span>

                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-cyan-100 px-3 py-1 text-cyan-700">
                      Actual {item.actual}
                    </span>
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">
                      Target {item.target}
                    </span>
                  </div>
                </div>

                <div
                  className="relative h-3 rounded-full bg-white shadow-inner"
                  aria-label={`${item.day}: actual ${item.actual}, target ${item.target}`}
                >
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-[#0ea5b7] via-[#22d3ee] to-[#38bdf8]"
                      style={{ width: actualWidth }}
                    />
                    <div
                      className="absolute top-[-3px] h-5 w-[2px] rounded-full bg-slate-900"
                      style={{ left: targetLeft }}
                    />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
