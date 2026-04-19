(function initExtractor(root) {
  const ns = (root.AgencyExt = root.AgencyExt || {});

  function normalize(text) {
    return String(text || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isVisible(node) {
    if (!(node instanceof Element)) return false;
    const style = window.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
      return false;
    }
    const rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function buildAssistantCandidate(node, index, total) {
    if (!(node instanceof Element)) return null;
    const text = normalize(node.innerText || node.textContent || "");
    if (!text) return null;
    if (!isVisible(node)) return null;

    const lengthScore = Math.min(text.length / 200, 1) * 0.65;
    const recencyScore = total > 1 ? (index / (total - 1)) * 0.25 : 0.25;
    const roleScore = node.matches("[data-message-author-role='assistant'], [data-testid*='assistant']") ? 0.1 : 0;

    return {
      text,
      score: lengthScore + recencyScore + roleScore,
      source: "response_dom",
    };
  }

  function bestAssistantCandidate(selectors) {
    const candidates = [];
    for (const selector of selectors || []) {
      const nodes = Array.from(document.querySelectorAll(selector));
      const total = nodes.length;
      nodes.forEach((node, index) => {
        const candidate = buildAssistantCandidate(node, index, total);
        if (candidate) {
          candidates.push(candidate);
        }
      });
    }

    if (!candidates.length) return null;
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0];
  }

  function firstVisibleText(selectors) {
    for (const selector of selectors || []) {
      const nodes = document.querySelectorAll(selector);
      for (const node of nodes) {
        const text = normalize(node.innerText || node.textContent || "");
        if (text && isVisible(node)) return text;
      }
    }
    return "";
  }

  function extractAssistantSnapshot(siteConfig) {
    const candidate = bestAssistantCandidate(siteConfig?.aiResponseSelectors || []);
    if (!candidate) {
      return {
        ai_text: "",
        capture_source: null,
        capture_confidence: 0,
      };
    }

    return {
      ai_text: candidate.text,
      capture_source: candidate.source,
      capture_confidence: Math.min(Math.max(candidate.score, 0), 1),
    };
  }

  function extractSnapshot(siteConfig) {
    const assistant = extractAssistantSnapshot(siteConfig);
    const finalText = firstVisibleText(siteConfig?.inputSelectors || []);
    return {
      ai_text: assistant.ai_text,
      final_text: finalText,
      capture_source: assistant.capture_source,
      capture_confidence: assistant.capture_confidence,
    };
  }

  ns.extractor = {
    firstVisibleText,
    extractAssistantSnapshot,
    extractSnapshot,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
