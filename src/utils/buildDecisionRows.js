function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  
  function formatSource(type) {
    if (type === "ai_accept") return "AI-led";
    if (type === "manual_edit") return "Autonomous";
    if (type === "deadline_trigger") return "Context";
    if (type === "tab_switch") return "Mixed";
    return "Mixed";
  }
  
  function formatTask(event) {
    if (event.page) {
      return event.page
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }
  
    return event.app || "Unknown Task";
  }
  
  function formatIntentMatch(intentMatch) {
    if (!intentMatch) return "-";
    if (intentMatch === "yes") return "Yes";
    if (intentMatch === "not_sure") return "Not Sure";
    if (intentMatch === "no") return "No";
    return intentMatch;
  }
  
  function formatRevisionDepth(depth) {
    if (!depth) return "-";
    return depth.charAt(0).toUpperCase() + depth.slice(1);
  }
  
  export function buildDecisionRows(events) {
    return [...events]
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((event) => ({
        task: formatTask(event),
        source: formatSource(event.type),
        confidence: event.confidence ? `${event.confidence}/5` : "-",
        intentMatch: formatIntentMatch(event.intentMatch),
        revisionDepth: formatRevisionDepth(event.revisionDepth),
        time: formatTime(event.timestamp),
      }));
  }