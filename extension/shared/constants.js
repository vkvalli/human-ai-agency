(function initConstants(root) {
  const ns = (root.AgencyExt = root.AgencyExt || {});

  ns.constants = {
    API_BASE_URL: "http://127.0.0.1:8000",
    FLUSH_ENDPOINT: "/session/events",
    SCORE_ENDPOINT_FALLBACK: "/score",
    FLUSH_ALARM_NAME: "agency_flush",
    FLUSH_PERIOD_MINUTES: 1,
    PRE_BANNER_ADOPTION_THRESHOLD: 0.85,
    STAGE_A_RISK_THRESHOLD: 0.65,
    QUICK_ACCEPT_MS: 3000,
    COOLDOWN_MS: 10 * 60 * 1000,
    ROLLING_WINDOW_SIZE: 3,
    STORAGE_KEYS: {
      SESSION: "agency_session",
      ROLLING_SCORES: "agency_rolling_scores",
      LAST_BANNER_TIMES: "agency_last_banner_times",
      PENDING_FLUSH: "agency_pending_flush",
    },
    DASHBOARD_ALLOWED_ORIGINS: [
      "http://localhost",
      "http://127.0.0.1",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    DASHBOARD_MESSAGE_TYPES: {
      START: "AGENCY_SESSION_START",
      END: "AGENCY_SESSION_END",
      CLEAR: "AGENCY_SESSION_CLEAR",
    },
    SITE_CONFIGS: {
      "chatgpt.com": {
        aiResponseSelectors: [".markdown.prose", "article .markdown", "[data-message-author-role='assistant']"],
        inputSelectors: ["#prompt-textarea", "textarea", "div[contenteditable='true']"],
        submitSelectors: ["button[data-testid='send-button']", "button[aria-label*='Send']"],
        regenerateSelectors: ["button[aria-label*='Regenerate']"],
      },
      "claude.ai": {
        aiResponseSelectors: ["[data-testid='assistant-message']", ".font-claude-message", "article"],
        inputSelectors: ["div[contenteditable='true']", "textarea"],
        submitSelectors: ["button[aria-label*='Send']", "button[type='submit']"],
        regenerateSelectors: ["button[aria-label*='Retry']", "button[aria-label*='Regenerate']"],
      },
      "gemini.google.com": {
        aiResponseSelectors: [".model-response-text", "message-content", "response-element"],
        inputSelectors: ["rich-textarea [contenteditable='true']", "textarea", "div[contenteditable='true']"],
        submitSelectors: ["button[aria-label*='Send']", "button[type='submit']"],
        regenerateSelectors: ["button[aria-label*='Regenerate']", "button[aria-label*='Retry']"],
      },
    },
  };

  ns.getSiteConfig = function getSiteConfig(hostname) {
    if (!hostname) return null;
    const entries = Object.entries(ns.constants.SITE_CONFIGS);
    for (const [domain, config] of entries) {
      if (hostname === domain || hostname.endsWith(`.${domain}`)) {
        return config;
      }
    }
    return null;
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
