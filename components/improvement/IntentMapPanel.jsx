import { useState } from "react";
import Card from "../common/Card";
import SectionHeader from "../common/SectionHeader";

export default function IntentMapPanel({ analyses, interventions }) {
  const [selectedWindow, setSelectedWindow] = useState("week");
  const activeAnalysis = analyses[selectedWindow];

  return (
    <Card>
      <div className="p-6 sm:p-7">
        <SectionHeader
          title="Intent Map"
          description="A dynamic guide built from current decision behavior."
        />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.95fr)] xl:items-start">
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Agency Analysis
                </p>
                <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                  Behavioral summary
                </h3>
              </div>

              <div className="inline-flex rounded-full border border-cyan-200 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setSelectedWindow("week")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selectedWindow === "week"
                      ? "bg-cyan-500 text-white shadow-sm"
                      : "text-cyan-700 hover:bg-cyan-50"
                  }`}
                >
                  Last week
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedWindow("month")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selectedWindow === "month"
                      ? "bg-cyan-500 text-white shadow-sm"
                      : "text-cyan-700 hover:bg-cyan-50"
                  }`}
                >
                  Last month
                </button>
              </div>
            </div>

            <p className="mt-4 text-sm font-medium uppercase tracking-[0.18em] text-cyan-700">
              {activeAnalysis.label}
            </p>

            <p className="mt-3 text-base leading-7 text-slate-700 sm:text-[1.02rem]">
              {activeAnalysis.body}
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-sky-50 to-violet-50 p-5 sm:p-6">
            <p className="text-sm font-medium text-slate-500">
              Suggested interventions
            </p>
            <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              Best next actions
            </h3>

            <div className="mt-5 space-y-3">
              {interventions.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/70 bg-white/85 p-4 text-sm leading-6 text-slate-700 shadow-sm"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
