(function initScorerIntent(root) {
  const ns = (root.AgencyExt = root.AgencyExt || {});

  // Positive intents: asking the AI to support your own thinking, not do it for you.
  const POSITIVE_PATTERNS = {
    brainstorm: [
      /\bbrainstorm\b/i,
      /\bgive me (some )?ideas\b/i,
      /\b(topics|ideas) for\b/i,
      /\bsuggest (some )?(ideas|topics|angles)\b/i,
      /\bwhat are some ways\b/i,
      /\bhelp me think of\b/i,
    ],
    explain: [
      /\bexplain\b/i,
      /\bwhat (is|are|does)\b.{0,40}\bmean\b/i,
      /\bhow does\b.{0,60}\bwork\b/i,
      /\bcan you clarify\b/i,
      /\bhelp me understand\b/i,
      /\bwalk me through\b/i,
      /\bwhat('|’)s the difference between\b/i,
    ],
    feedback: [
      /\bfeedback on\b/i,
      /\breview my\b/i,
      /\bcritique\b/i,
      /\bwhat do you think of my\b/i,
      /\bis this (good|correct|right)\b/i,
      /\bhow can i improve my\b/i,
      /\bcheck my\b/i,
      /\bdoes this (make sense|look right)\b/i,
    ],
    hint: [
      /\bhint\b/i,
      /\bi('|’)m stuck\b/i,
      /\bstuck on\b/i,
      /\bnudge me\b/i,
      /\bpoint me in the right direction\b/i,
      /\bwithout giving (me )?the answer\b/i,
      /\bwhat should i (try|consider) next\b/i,
    ],
    organize: [
      /\borganize\b/i,
      /\bstructure my\b/i,
      /\bhelp me organize\b/i,
      /\boutline my\b/i,
      /\barrange these\b/i,
      /\bclean up my notes\b/i,
      /\bgroup these (ideas|points)\b/i,
    ],
  };

  // Negative intents: asking the AI to fully replace your own work/judgment.
  const NEGATIVE_PATTERNS = {
    full_assignment: [
      /\bwrite (my|the) (entire |whole |full )?(essay|assignment|paper|homework|report|thesis)\b/i,
      /\bdo my homework\b/i,
      /\bcomplete (this|my) assignment\b/i,
      /\bfinish my (essay|assignment|paper|homework)\b/i,
      /\bwrite (this|it) for me\b/i,
    ],
  };

  const CITATION_PATTERNS = [
    /\([A-Z][a-zA-Z]+(?:\s+(?:et\s+al\.?|&|and)\s*[A-Z]?[a-zA-Z]*)?,?\s*\d{4}\)/,
    /\bet\s?al\.?,?\s*\(?\d{4}\)?/i,
    /\bdoi:\s*\S+/i,
    /https?:\/\/doi\.org\/\S+/i,
    /\[\d+\]/,
  ];

  function matchAny(text, patterns) {
    return patterns.some((re) => re.test(text));
  }

  function classifyPromptIntent(text) {
    const normalized = String(text || "").trim();
    if (!normalized) return null;

    for (const [label, patterns] of Object.entries(NEGATIVE_PATTERNS)) {
      if (matchAny(normalized, patterns)) {
        return { intent: label, polarity: "negative" };
      }
    }

    for (const [label, patterns] of Object.entries(POSITIVE_PATTERNS)) {
      if (matchAny(normalized, patterns)) {
        return { intent: label, polarity: "positive" };
      }
    }

    return null;
  }

  function hasFabricatedCitationRisk(aiText) {
    const text = String(aiText || "");
    if (!text) return false;
    return matchAny(text, CITATION_PATTERNS);
  }

  // "Must keep points" split into two flavors, because they need different
  // evidence to check: a PROCESS rule ("final judgment stays with me") is about
  // how you used the AI this turn, not something that appears in the text — so
  // it's checked against reliance/adoption signals. A CONTENT rule ("keep my
  // voice and priorities") is about the output itself — checked against how
  // much you actually rewrote/added versus adopted verbatim.
  const PROCESS_POINT_PATTERNS = [
    /\bjudg?ment\b/i,
    /\bapproval\b/i,
    /\breview\b/i,
    /\bfinal (say|call|decision|approval)\b/i,
    /\bsubmit(ting)?\b/i,
    /\bmyself\b/i,
    /\bown (the|this)\b/i,
    /\bdecide\b/i,
    /\bmanual(ly)?\b/i,
  ];

  const CONTENT_POINT_PATTERNS = [
    /\bvoice\b/i,
    /\btone\b/i,
    /\bstyle\b/i,
    /\bwording\b/i,
    /\blogic\b/i,
    /\bpriorities\b/i,
    /\bargument\b/i,
    /\bstructure\b/i,
    /\bcontent\b/i,
  ];

  function classifyKeepPointType(point) {
    const text = String(point || "");
    if (matchAny(text, PROCESS_POINT_PATTERNS)) return "process";
    if (matchAny(text, CONTENT_POINT_PATTERNS)) return "content";
    return "general";
  }

  // `features`/`score` are the same objects computeScore() already produced for
  // this interaction — no extra text ever leaves the browser for this check.
  function evaluateKeepPoints(points, { features, score }) {
    if (!Array.isArray(points) || !points.length || !features || !score) {
      return [];
    }

    return points
      .map((raw) => String(raw || "").trim())
      .filter(Boolean)
      .map((point) => {
        const type = classifyKeepPointType(point);
        let satisfied;

        if (type === "process") {
          satisfied = score.decision_type !== "ai_led" && score.reliance_risk < 0.55;
        } else if (type === "content") {
          satisfied =
            score.decision_type === "user_led" ||
            features.manual_addition_ratio >= 0.25 ||
            features.edit_distance_ratio >= 0.25;
        } else {
          satisfied = score.agency_score >= 60;
        }

        return { point, type, satisfied };
      });
  }

  ns.scorerIntent = {
    classifyPromptIntent,
    hasFabricatedCitationRisk,
    classifyKeepPointType,
    evaluateKeepPoints,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      classifyPromptIntent,
      hasFabricatedCitationRisk,
      classifyKeepPointType,
      evaluateKeepPoints,
    };
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
