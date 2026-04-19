export function buildDriftTriggers(metrics) {
    const triggers = [];
  
    if (metrics.deadlineTriggers > 0) {
      triggers.push({
        title: "Deadline Compression",
        type: "Scheduler Trigger",
        impact: metrics.deadlineTriggers >= 2 ? "High" : "Medium",
        description:
          "The system detected time pressure near a key action or submission, which increases passive decision behavior.",
      });
    }
  
    if (metrics.tabSwitches > 0) {
      triggers.push({
        title: "Rapid Context Switching",
        type: "Focus Trigger",
        impact: metrics.tabSwitches >= 3 ? "High" : "Medium",
        description:
          "Frequent tab or app switching is increasing multitasking load and weakening decision consistency.",
      });
    }
  
    if (metrics.aiAccepts > 0) {
      triggers.push({
        title: "Passive AI Acceptance",
        type: "Behavior Trigger",
        impact: metrics.aiAccepts >= 3 ? "High" : "Medium",
        description:
          "Repeated AI acceptance suggests reduced review depth and lower human ownership of the final decision.",
      });
    }
  
    if (metrics.agencyLevel === "Low") {
      triggers.push({
        title: "Low Agency State",
        type: "System Trigger",
        impact: "High",
        description:
          "Multiple signals have combined to reduce agency. The system should prioritize supportive interventions and manual review.",
      });
    }
  
    if (triggers.length === 0) {
      triggers.push({
        title: "No Major Drift Detected",
        type: "Stable State",
        impact: "Medium",
        description:
          "Current behavior does not show strong drift patterns. Agency appears stable at the moment.",
      });
    }
  
    return triggers.slice(0, 4);
  }