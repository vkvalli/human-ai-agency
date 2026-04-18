export function buildInterventions(metrics) {
    const actions = [];
  
    if (metrics.deadlineTriggers >= 1) {
      actions.push("Pause before sending or submitting high-stakes work.");
    }
  
    if (metrics.aiAccepts >= 2) {
      actions.push("Review AI output manually before accepting the final version.");
    }
  
    if (metrics.tabSwitches >= 2) {
      actions.push("Reduce tab switching and stay in one workspace until the decision is complete.");
    }
  
    if (metrics.manualEdits <= 1) {
      actions.push("Start with your own first draft before asking AI to expand or refine.");
    }
  
    if (metrics.agencyLevel === "Low") {
      actions.push("Switch to manual-first mode temporarily until decision ownership stabilizes.");
    }
  
    if (actions.length === 0) {
      actions.push(
        "Keep reviewing outputs before finalizing them.",
        "Use AI as support for expansion and alternatives, not as the final authority.",
        "Maintain your current pace while preserving manual decision checkpoints."
      );
    }
  
    return actions.slice(0, 4);
  }