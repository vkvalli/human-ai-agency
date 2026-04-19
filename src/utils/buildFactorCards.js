export function buildFactorCards(metrics) {
    const cards = [];
  
    if (metrics.deadlineTriggers > 0) {
      cards.push({
        title: "Deadline Pressure",
        score: `+${metrics.deadlineTriggers * 10} drift`,
        level: metrics.deadlineTriggers >= 2 ? "High" : "Medium",
        description:
          "Agency is being reduced by time pressure near important actions or submissions.",
      });
    }
  
    if (metrics.tabSwitches > 0) {
      cards.push({
        title: "Multitasking",
        score: `+${metrics.tabSwitches * 3} drift`,
        level: metrics.tabSwitches >= 3 ? "High" : "Medium",
        description:
          "Frequent context switching is increasing distraction and weakening decision ownership.",
      });
    }
  
    if (metrics.aiAccepts > 0) {
      cards.push({
        title: "Passive AI Reliance",
        score: `+${metrics.aiAccepts * 8} drift`,
        level: metrics.aiAccepts >= 3 ? "High" : "Medium",
        description:
          "Repeated AI acceptance suggests decisions may be shifting away from human ownership.",
      });
    }
  
    if (metrics.manualEdits > 0) {
      cards.push({
        title: "Manual Review Rate",
        score: `-${metrics.manualEdits * 6} drift`,
        level: "Positive",
        description:
          "Manual edits are helping recover agency by increasing review depth and personal ownership.",
      });
    }
  
    if (cards.length === 0) {
      cards.push({
        title: "Stable Decision Ownership",
        score: "0 drift",
        level: "Positive",
        description:
          "No major drift signals detected yet. Current behavior suggests stable agency.",
      });
    }
  
    return cards.slice(0, 4);
  }