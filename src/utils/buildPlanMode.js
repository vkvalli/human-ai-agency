export function buildPlanMode(metrics) {
  const intent =
    metrics.agencyLevel === "Low"
      ? "Recover decision ownership on this project by defining the core direction myself first and using AI only after the human goal is clear."
      : metrics.agencyLevel === "Medium"
      ? "Complete this project with steady human judgment, especially during fast or pressure-heavy moments."
      : "Protect a strong level of decision ownership while using AI as support instead of authority.";

  const mustKeepPoints = [
    "Final judgment and approval stay with me.",
    "The output must keep my voice, logic, and priorities.",
    "Important claims or choices need a manual review before submit.",
  ].join("\n");

  const scope =
    metrics.tabSwitches >= 2
      ? "I will define the project direction, choose priorities, draft the core structure, and finish the review in one focused session."
      : "I will own the project direction, key decisions, first-pass structure, and the final review before anything is submitted.";

  const deadline =
    metrics.deadlineTriggers >= 1 ? "Before next deadline" : "This week";

  const aiScope =
    metrics.aiAccepts >= 2
      ? "AI can help with outlining, reframing, summarizing options, and improving clarity only after I provide the initial intent and scope. AI should not decide the final wording, final reasoning, or submission choice for me."
      : "AI can support brainstorming, structure, rewrite suggestions, and gap-checking after I set the direction. AI should stay out of final approval, priority setting, and any decision that changes the meaning of the work.";

  return {
    intent,
    mustKeepPoints,
    scope,
    deadline,
    aiScope,
  };
}
