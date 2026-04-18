import Card from "../common/Card";
import SectionHeader from "../common/SectionHeader";

function getPriorityStyles(priority) {
  if (priority === "high") {
    return {
      badge: "bg-rose-100 text-rose-700",
      number: "bg-rose-600 text-white",
    };
  }

  if (priority === "medium") {
    return {
      badge: "bg-amber-100 text-amber-700",
      number: "bg-amber-500 text-white",
    };
  }

  return {
    badge: "bg-emerald-100 text-emerald-700",
    number: "bg-emerald-600 text-white",
  };
}

export default function IntentMapPanel({ steps, interventions, summary }) {
  return (
    <Card>
      <SectionHeader
        title="Intent Map"
        description="A dynamic guide built from current decision behavior."
      />

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div>
          <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-500">Current focus</p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">{summary.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {summary.description}
            </p>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => {
              const styles = getPriorityStyles(step.priority);

              return (
                <div
                  key={step.title}
                  className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${styles.number}`}
                  >
                    {index + 1}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {step.title}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}
                      >
                        {step.priority}
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 to-violet-50 p-5">
          <p className="text-sm font-medium text-slate-500">
            Suggested interventions
          </p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">
            Best next actions
          </h3>

          <div className="mt-5 space-y-3">
            {interventions.map((item) => (
              <div
                key={item}
                className="rounded-2xl bg-white/80 p-4 text-sm leading-6 text-slate-700 shadow-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}