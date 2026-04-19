export const agencySummary = {
    score: 74,
    autonomous: 46,
    aiLed: 28,
    mixed: 26,
  };
  
  export const agencyTrend = [
    { day: "Mon", score: 62 },
    { day: "Tue", score: 68 },
    { day: "Wed", score: 71 },
    { day: "Thu", score: 66 },
    { day: "Fri", score: 74 },
  ];
  
  export const autonomyData = [
    { name: "Autonomous", value: 46 },
    { name: "AI-led", value: 28 },
    { name: "Mixed", value: 26 },
  ];
  
  export const factorCards = [
    {
      title: "Deadline Pressure",
      score: "+18 drift",
      level: "High",
      description:
        "Agency drops when important work is completed close to deadlines without review time.",
    },
    {
      title: "Multitasking",
      score: "+11 drift",
      level: "Medium",
      description:
        "Frequent switching between apps and tasks increases passive AI acceptance.",
    },
    {
      title: "Manual Review Rate",
      score: "-9 drift",
      level: "Positive",
      description:
        "Intentional self-review before submit improves ownership and confidence alignment.",
    },
    {
      title: "Confidence Mismatch",
      score: "+7 drift",
      level: "Medium",
      description:
        "Low confidence paired with fast AI acceptance signals possible over-reliance.",
    },
  ];
  
  export const decisionRows = [
    {
      task: "Email Draft",
      source: "Mixed",
      confidence: "4/5",
      intentMatch: "Yes",
      revisionDepth: "Medium",
      time: "2:10 PM",
    },
    {
      task: "Hackathon Planning",
      source: "Autonomous",
      confidence: "5/5",
      intentMatch: "Yes",
      revisionDepth: "High",
      time: "3:05 PM",
    },
    {
      task: "Slide Outline",
      source: "AI-led",
      confidence: "2/5",
      intentMatch: "Not Sure",
      revisionDepth: "Low",
      time: "4:20 PM",
    },
    {
      task: "Code Refactor",
      source: "Mixed",
      confidence: "3/5",
      intentMatch: "Yes",
      revisionDepth: "High",
      time: "5:15 PM",
    },
  ];
  
  export const baselineTracking = [
    { label: "Mon", value: 64 },
    { label: "Tue", value: 69 },
    { label: "Wed", value: 71 },
    { label: "Thu", value: 66 },
    { label: "Fri", value: 74 },
    { label: "Sat", value: 76 },
    { label: "Sun", value: 72 },
  ];
  
  export const driftTriggers = [
    {
      title: "Deadline Compression",
      type: "Scheduler Trigger",
      impact: "High",
      description:
        "Detected a cluster of rushed decisions 2 hours before task submission.",
    },
    {
      title: "Rapid Context Switching",
      type: "Plan Mode Trigger",
      impact: "Medium",
      description:
        "Multiple app switches in a short span reduced manual review behavior.",
    },
    {
      title: "Fast Accept + Low Confidence",
      type: "Behavior Trigger",
      impact: "High",
      description:
        "AI suggestions were accepted quickly despite lower self-confidence scores.",
    },
  ];
  
  export const intentMapSteps = [
    {
      title: "Own the first draft",
      description:
        "Start with your own idea before asking AI for structure or suggestions.",
    },
    {
      title: "Use AI as support",
      description:
        "Let AI assist with expansion, rewording, or checking gaps, but not final judgment.",
    },
    {
      title: "Pause before submit",
      description:
        "Add a review checkpoint to confirm the final output still reflects your voice.",
    },
    {
      title: "Trigger interventions",
      description:
        "Enable nudges only during high-risk moments like deadline pressure or multitasking.",
    },
  ];
  
  export const agencyGoals = [
    { day: "Mon", target: 72, actual: 64 },
    { day: "Tue", target: 72, actual: 69 },
    { day: "Wed", target: 74, actual: 71 },
    { day: "Thu", target: 75, actual: 66 },
    { day: "Fri", target: 76, actual: 74 },
    { day: "Sat", target: 78, actual: 76 },
    { day: "Sun", target: 78, actual: 72 },
  ];
  
  export const interventionSuggestions = [
    "Pause for 30 seconds before sending or submitting.",
    "Review one alternative before accepting the AI output.",
    "Switch to manual-first mode for high-stakes work.",
    "Reset intent and confirm what decision is truly yours.",
  ];
  
  export const planModeTasks = [
    {
      title: "Hackathon Prototype Wireframe",
      due: "Today · 7:00 PM",
      status: "In Progress",
    },
    {
      title: "Deeper Insights UI Build",
      due: "Tomorrow · 11:30 AM",
      status: "Planned",
    },
    {
      title: "Intent Map Review",
      due: "Tomorrow · 4:00 PM",
      status: "Needs Review",
    },
  ];
  
  export const planModeTips = [
    "Break projects into small human-owned decisions.",
    "Use AI for options, not final authority.",
    "Schedule checkpoints before important actions.",
    "Regenerate the plan only if the intent map changes significantly.",
  ];


  export const liveAgencyStatus = {
    level: "Medium",
    score: 74,
    reason: "Quick AI acceptance is increasing during deadline-heavy work.",
  };
  
  export const popupInterventions = [
    {
      id: 1,
      title: "Pause 30 Seconds",
      description:
        "Take a short pause before continuing so your next action is more intentional.",
      type: "pause",
    },
    {
      id: 2,
      title: "Show 2 Alternatives",
      description:
        "Review two possible approaches before accepting the current AI suggestion.",
      type: "alternatives",
    },
    {
      id: 3,
      title: "Manual-first Mode",
      description:
        "Temporarily hide AI assistance and continue with your own decision first.",
      type: "manual",
    },
    {
      id: 4,
      title: "Intent Reset Prompt",
      description:
        "Restate your original goal and confirm whether the current output still matches it.",
      type: "intent",
    },
  ];