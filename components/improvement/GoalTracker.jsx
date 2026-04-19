import Card from "../common/Card";
import SectionHeader from "../common/SectionHeader";

export default function GoalTracker({ goals }) {
  return (
    <Card>
      <SectionHeader
        title="Agency Goal Tracker"
        description="Set target agency levels for specific days and compare against actual performance."
      />

      <div className="space-y-4">
        {goals.map((item) => {
          const actualWidth = `${item.actual}%`;
          const targetLeft = `${item.target}%`;

          return (
            <div key={item.day}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">{item.day}</span>
                <span className="text-slate-500">
                  Actual {item.actual} / Target {item.target}
                </span>
              </div>

              <div className="relative h-3 rounded-full bg-slate-100">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-[#0ea5b7] via-[#22d3ee] to-[#38bdf8]"
                  style={{ width: actualWidth }}
                />
                <div
                  className="absolute top-[-3px] h-5 w-[2px] bg-slate-900"
                  style={{ left: targetLeft }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}