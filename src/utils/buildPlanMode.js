export function buildPlanMode(metrics) {
    const tasks = [];
    const tips = [];
  
    if (metrics.agencyLevel === "Low") {
      tasks.push({
        title: "Recovery Planning Session",
        due: "Today · Priority",
        status: "Needs Review",
      });
  
      tips.push(
        "Break the work into smaller human-owned decisions before using AI.",
        "Use manual-first mode until decision ownership stabilizes."
      );
    }
  
    if (metrics.deadlineTriggers >= 1) {
      tasks.push({
        title: "Add Pre-Submit Review Checkpoint",
        due: "Before next deadline",
        status: "In Progress",
      });
  
      tips.push(
        "Add a pause-and-review step before any high-stakes submission.",
        "Use scheduling to create buffer time before deadlines."
      );
    }
  
    if (metrics.tabSwitches >= 2) {
      tasks.push({
        title: "Focus Block Setup",
        due: "Next work session",
        status: "Planned",
      });
  
      tips.push(
        "Reduce tab switching by staying in one workspace until the decision is complete.",
        "Cluster related work into one focused session instead of parallel multitasking."
      );
    }
  
    if (metrics.aiAccepts >= 2) {
      tasks.push({
        title: "Manual-First Draft Plan",
        due: "Next creative task",
        status: "Planned",
      });
  
      tips.push(
        "Create your own outline first, then use AI only for expansion or alternatives.",
        "Review at least one AI-generated option manually before accepting it."
      );
    }
  
    if (metrics.manualEdits >= 2) {
      tasks.push({
        title: "Maintain Review Workflow",
        due: "Ongoing",
        status: "In Progress",
      });
  
      tips.push(
        "Keep your current review habit because it is helping preserve agency.",
        "Maintain manual editing checkpoints in future workflows."
      );
    }
  
    if (tasks.length === 0) {
      tasks.push(
        {
          title: "Weekly Intent Planning",
          due: "This week",
          status: "Planned",
        },
        {
          title: "Project Reflection Checkpoint",
          due: "Next major task",
          status: "Planned",
        }
      );
  
      tips.push(
        "Use AI as support for structure and options, not final authority.",
        "Plan tasks around decision checkpoints rather than only deadlines.",
        "Preserve your own first-pass thinking before involving AI."
      );
    }
  
    const uniqueTasks = dedupeTasks(tasks).slice(0, 4);
    const uniqueTips = [...new Set(tips)].slice(0, 4);
  
    return {
      tasks: uniqueTasks,
      tips: uniqueTips,
    };
  }
  
  function dedupeTasks(tasks) {
    const seen = new Set();
    return tasks.filter((task) => {
      if (seen.has(task.title)) return false;
      seen.add(task.title);
      return true;
    });
  }