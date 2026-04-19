import { useState } from "react";
import Card from "../common/Card";
import SectionHeader from "../common/SectionHeader";

export default function IntentMapPanel({ analyses, interventions }) {
  const [selectedWindow, setSelectedWindow] = useState("week");
  const activeAnalysis = analyses[selectedWindow];

  return (
    <Card className="relative overflow-hidden border-cyan-100/80 bg-[linear-gradient(170deg,rgba(240,250,255,0.92),rgba(206,237,255,0.84)_55%,rgba(186,228,252,0.8)_100%)] shadow-[0_22px_54px_rgba(3,54,89,0.16)]">
      <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.72),rgba(186,230,253,0.46)_42%,transparent_78%)]" />
      <div className="p-6 sm:p-7">
        <SectionHeader
          title="Intent Map"
          description="A dynamic guide built from current decision behavior."
        />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.95fr)] xl:items-start">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-cyan-100/80 bg-[linear-gradient(165deg,rgba(247,252,255,0.92),rgba(212,241,255,0.84)_56%,rgba(180,229,255,0.8)_100%)] p-5 shadow-[0_18px_38px_rgba(3,54,89,0.12)] sm:p-6">
            <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.74),rgba(186,230,253,0.52)_42%,transparent_76%)]" />
            <div className="absolute right-4 top-4 h-14 w-14 rounded-full border border-white/60 bg-white/18 blur-2xl" />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative">
                <p className="text-sm font-medium text-slate-600">
                  Agency Analysis
                </p>
                <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                  Behavioral summary
                </h3>
              </div>

              <div className="relative inline-flex rounded-full border border-sky-100 bg-white/86 p-1 shadow-sm backdrop-blur-lg">
                <button
                  type="button"
                  onClick={() => setSelectedWindow("week")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selectedWindow === "week"
                      ? "bg-sky-500 text-white shadow-sm"
                      : "text-sky-700 hover:bg-sky-50"
                  }`}
                >
                  Last week
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedWindow("month")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selectedWindow === "month"
                      ? "bg-sky-500 text-white shadow-sm"
                      : "text-sky-700 hover:bg-sky-50"
                  }`}
                >
                  Last month
                </button>
              </div>
            </div>

            <p className="relative mt-4 text-sm font-medium uppercase tracking-[0.18em] text-sky-700">
              {activeAnalysis.label}
            </p>

            <p className="relative mt-3 text-base leading-7 text-slate-700/95 sm:text-[1.02rem]">
              {activeAnalysis.body}
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[1.75rem] border border-cyan-100/80 bg-[linear-gradient(145deg,rgba(220,242,255,0.94),rgba(238,249,255,0.82)_38%,rgba(196,236,255,0.88)_100%)] p-5 shadow-[0_18px_38px_rgba(3,54,89,0.12)] sm:p-6">
            <div className="absolute right-[-2rem] top-[-2rem] h-28 w-28 rounded-full bg-white/35 blur-3xl" />
            <p className="relative text-sm font-medium text-slate-600">
              Suggested interventions
            </p>
            <h3 className="relative mt-2 text-2xl font-bold tracking-tight text-slate-950">
              Best next actions
            </h3>

            <div className="relative mt-5 space-y-3">
              {interventions.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/80 bg-white/82 p-4 text-sm leading-6 text-slate-700 shadow-sm backdrop-blur-lg"
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
