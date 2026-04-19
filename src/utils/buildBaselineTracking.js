function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  
  function scoreBucket(events) {
    let score = 100;
  
    for (const event of events) {
      if (event.type === "ai_accept") score -= 8;
      if (event.type === "tab_switch") score -= 3;
      if (event.type === "deadline_trigger") score -= 10;
      if (event.type === "manual_edit") score += 6;
    }
  
    return clamp(score, 0, 100);
  }
  
  export function buildBaselineTracking(events) {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
    if (!events || events.length === 0) {
      return labels.map((label) => ({
        label,
        value: 70,
      }));
    }
  
    const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
  
    const bucketCount = 7;
    const buckets = Array.from({ length: bucketCount }, () => []);
  
    sorted.forEach((event, index) => {
      const bucketIndex = Math.min(
        bucketCount - 1,
        Math.floor((index / sorted.length) * bucketCount)
      );
      buckets[bucketIndex].push(event);
    });
  
    return buckets.map((bucket, index) => ({
      label: labels[index],
      value: bucket.length > 0 ? scoreBucket(bucket) : 70,
    }));
  }