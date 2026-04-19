import { useState } from "react";
import Card from "../common/Card";
import SectionHeader from "../common/SectionHeader";

function FieldCard({
  label,
  children,
  className = "",
}) {
  return (
    <label
      className={`block rounded-[1rem] border border-slate-200 bg-white p-2.5 shadow-sm shadow-cyan-100/40 sm:p-3 ${className}`}
    >
      <div className="mb-1.5">
        <span className="text-xs font-semibold text-slate-900">{label}</span>
      </div>
      {children}
    </label>
  );
}

const fieldClassName =
  "min-h-[58px] w-full resize-none rounded-[0.75rem] border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs leading-5 text-slate-700 outline-none transition focus:border-cyan-400 focus:bg-white";

const emptyPlan = {
  intent: "",
  mustKeepPoints: "",
  scope: "",
  deadline: "",
  aiScope: "",
};

export default function PlanModePanel({ plan }) {
  const [form, setForm] = useState(emptyPlan);

  function updateField(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function resetToSuggestedPlan() {
    setForm(plan);
  }

  function clearPlan() {
    setForm(emptyPlan);
  }

  return (
    <Card id="plan-mode-panel">
      <div className="p-6 sm:p-7">
        <SectionHeader
          title="Plan Mode"
          description="Set the human-owned plan first, then define exactly where AI is allowed to help."
        />

        <div className="rounded-[1.75rem] border border-cyan-200 bg-gradient-to-br from-sky-50 via-cyan-50 to-white p-5 sm:p-6">
          <div className="flex flex-col gap-3 border-b border-cyan-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-cyan-700">
                Planning canvas
              </p>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                Human-first project setup
              </h3>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={resetToSuggestedPlan}
                className="rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
              >
                Use suggested plan
              </button>

              <button
                type="button"
                onClick={clearPlan}
                className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Clear fields
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.85fr)]">
            <div className="space-y-3">
              <FieldCard label="My intent">
                <textarea
                  value={form.intent}
                  onChange={(e) => updateField("intent", e.target.value)}
                  className={fieldClassName}
                />
              </FieldCard>

              <FieldCard label="Must keep points">
                <textarea
                  value={form.mustKeepPoints}
                  onChange={(e) =>
                    updateField("mustKeepPoints", e.target.value)
                  }
                  className={fieldClassName}
                />
              </FieldCard>

              <FieldCard label="My scope">
                <textarea
                  value={form.scope}
                  onChange={(e) => updateField("scope", e.target.value)}
                  className={fieldClassName}
                />
              </FieldCard>
            </div>

            <div className="space-y-3">
              <FieldCard label="Deadline">
                <input
                  type="text"
                  value={form.deadline}
                  onChange={(e) => updateField("deadline", e.target.value)}
                  className="w-full rounded-[0.75rem] border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs leading-5 text-slate-700 outline-none transition focus:border-cyan-400 focus:bg-white"
                />
              </FieldCard>

              <FieldCard label="AI scope">
                <textarea
                  value={form.aiScope}
                  onChange={(e) => updateField("aiScope", e.target.value)}
                  className={`${fieldClassName} min-h-[96px] xl:min-h-[124px]`}
                />
              </FieldCard>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
