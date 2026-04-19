export function buildIntentMap(metrics) {
    const steps = [];
  
    if (metrics.aiAccepts >= 2) {
      steps.push({
        title: "Use AI as support, not authority",
        description:
          "The system detected repeated AI acceptance. Shift AI into a supporting role by reviewing options before choosing manually.",
        priority: "high",
      });
    }
  
    if (metrics.manualEdits <= 1) {
      steps.push({
        title: "Own the first draft",
        description:
          "Manual revision activity is low. Start with your own outline or first pass before asking AI to assist.",
        priority: "high",
      });
    }
  
    if (metrics.deadlineTriggers >= 1) {
      steps.push({
        title: "Pause before submit",
        description:
          "Deadline pressure is active. Add a short review checkpoint before sending or submitting anything important.",
        priority: "high",
      });
    }
  
    if (metrics.tabSwitches >= 2) {
      steps.push({
        title: "Reduce multitasking during key decisions",
        description:
          "Frequent context switching is increasing drift risk. Stay in one workspace until the decision is complete.",
        priority: "medium",
      });
    }
  
    if (steps.length === 0) {
      steps.push(
        {
          title: "Maintain manual review",
          description:
            "Your current behavior shows stable decision ownership. Keep reviewing outputs before finalizing them.",
          priority: "positive",
        },
        {
          title: "Use AI for expansion, not replacement",
          description:
            "Continue using AI as an assistant for structure and alternatives, while keeping final judgment with yourself.",
          priority: "positive",
        }
      );
    }
  
    return steps.slice(0, 4);
  }