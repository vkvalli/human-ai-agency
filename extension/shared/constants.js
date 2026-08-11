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
    MIN_AI_TEXT_CHARS: 20,
    MIN_FINAL_TEXT_CHARS: 3,
    AI_CONTEXT_STALE_MS: 60 * 1000,
    COOLDOWN_MS: 10 * 60 * 1000,
    ROLLING_WINDOW_SIZE: 3,
    SUPPORTED_CHAT_URL_PATTERNS: [
      "*://chatgpt.com/*",
      "*://*.chatgpt.com/*",
      "*://claude.ai/*",
      "*://*.claude.ai/*",
      "*://gemini.google.com/*",
      "*://*.gemini.google.com/*",
    ],
    STORAGE_KEYS: {
      SESSION: "agency_session",
      ROLLING_SCORES: "agency_rolling_scores",
      LAST_BANNER_TIMES: "agency_last_banner_times",
      PENDING_FLUSH: "agency_pending_flush",
      LAST_STATUS: "agency_last_status",
      CONTENT_STATUS: "agency_content_status",
      DEBUG_TRACE: "agency_debug_trace",
      EXT_USER_ID: "agency_ext_user_id",
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
      EXT_USER_ID_REQUEST: "AGENCY_EXT_USER_ID_REQUEST",
      EXT_USER_ID_RESPONSE: "AGENCY_EXT_USER_ID_RESPONSE",
    },
    SITE_CONFIGS: {
      "chatgpt.com": {
        aiResponseSelectors: [
          "[data-message-author-role='assistant'] .markdown",
          "[data-message-author-role='assistant']",
          "div[data-testid^='conversation-turn-'] .markdown",
          "main article .markdown",
          ".markdown.prose",
          "article .markdown",
        ],
        inputSelectors: [
          "#prompt-textarea",
          "textarea#prompt-textarea",
          "form textarea",
          "form div[contenteditable='true'][data-lexical-editor='true']",
          "div[contenteditable='true'][role='textbox']",
          "textarea",
        ],
        submitSelectors: [
          "button[data-testid='send-button']",
          "form button[aria-label*='Send']",
          "button[aria-label='Send prompt']",
          "button[aria-label*='Send message']",
        ],
        regenerateSelectors: ["button[aria-label*='Regenerate']", "button[data-testid*='regenerate']"],
        copySelectors: [
          "button[data-testid='copy-turn-action-button']",
          "button[aria-label*='Copy']",
          "button[aria-label*='copy']",
        ],
      },
      "claude.ai": {
        aiResponseSelectors: ["[data-testid='assistant-message']", ".font-claude-message", "article"],
        inputSelectors: ["div[contenteditable='true']", "textarea"],
        submitSelectors: ["button[aria-label*='Send']", "button[type='submit']"],
        regenerateSelectors: ["button[aria-label*='Retry']", "button[aria-label*='Regenerate']"],
        copySelectors: ["button[aria-label*='Copy']", "button[aria-label*='copy']"],
      },
      "gemini.google.com": {
        aiResponseSelectors: [".model-response-text", "message-content", "response-element"],
        inputSelectors: ["rich-textarea [contenteditable='true']", "textarea", "div[contenteditable='true']"],
        submitSelectors: ["button[aria-label*='Send']", "button[type='submit']"],
        regenerateSelectors: ["button[aria-label*='Regenerate']", "button[aria-label*='Retry']"],
        copySelectors: ["button[aria-label*='Copy']", "button[aria-label*='copy']"],
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
