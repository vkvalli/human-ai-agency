(function initExtractor(root) {
  const ns = (root.AgencyExt = root.AgencyExt || {});

  function firstVisibleText(selectors) {
    for (const selector of selectors || []) {
      const nodes = document.querySelectorAll(selector);
      for (const node of nodes) {
        const text = (node.innerText || node.textContent || "").trim();
        if (text) return text;
      }
    }
    return "";
  }

  function extractSnapshot(siteConfig) {
    const aiText = firstVisibleText(siteConfig?.aiResponseSelectors || []);
    const finalText = firstVisibleText(siteConfig?.inputSelectors || []);
    return { ai_text: aiText, final_text: finalText };
  }

  ns.extractor = {
    firstVisibleText,
    extractSnapshot,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
