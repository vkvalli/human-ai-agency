(function initObserver(root) {
  const ns = (root.AgencyExt = root.AgencyExt || {});

  function matchesAny(target, selectors) {
    if (!target || !selectors || !selectors.length) return false;
    if (!(target instanceof Element)) return false;
    return selectors.some((selector) => target.closest(selector));
  }

  function createObserver(siteConfig, handlers) {
    let observer = null;
    let lastAiHash = "";
    let idleTimer = null;

    function emit(name, payload) {
      const fn = handlers && handlers[name];
      if (typeof fn === "function") {
        fn(payload);
      }
    }

    function hash(text) {
      return (text || "").slice(0, 1200);
    }

    function onMutations() {
      if (!ns.extractor) return;
      const aiText = ns.extractor.firstVisibleText(siteConfig.aiResponseSelectors || []);
      const currentHash = hash(aiText);
      if (currentHash && currentHash !== lastAiHash) {
        lastAiHash = currentHash;
        emit("suggestion", { ai_text: aiText, timestamp: Date.now() });
      }
    }

    function onClick(event) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      if (matchesAny(target, siteConfig.regenerateSelectors || [])) {
        emit("regenerate", { timestamp: Date.now() });
        return;
      }

      if (matchesAny(target, siteConfig.submitSelectors || [])) {
        emit("commit", { source: "click", timestamp: Date.now() });
      }
    }

    function onPaste() {
      emit("paste", { timestamp: Date.now() });
    }

    function onKeydown(event) {
      if (event.key === "Enter" && !event.shiftKey) {
        emit("commit", { source: "enter", timestamp: Date.now() });
      }

      if (idleTimer) {
        clearTimeout(idleTimer);
      }
      idleTimer = setTimeout(() => {
        emit("idle", { timestamp: Date.now() });
      }, 3000);
    }

    function onBlur(event) {
      const target = event.target;
      if (!target || !(target instanceof Element)) return;
      if (!matchesAny(target, siteConfig.inputSelectors || [])) return;
      emit("idle", { timestamp: Date.now() });
    }

    function start() {
      observer = new MutationObserver(onMutations);
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });

      document.addEventListener("click", onClick, true);
      document.addEventListener("paste", onPaste, true);
      document.addEventListener("keydown", onKeydown, true);
      document.addEventListener("blur", onBlur, true);

      onMutations();
    }

    function stop() {
      if (observer) observer.disconnect();
      observer = null;

      if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }

      document.removeEventListener("click", onClick, true);
      document.removeEventListener("paste", onPaste, true);
      document.removeEventListener("keydown", onKeydown, true);
      document.removeEventListener("blur", onBlur, true);
    }

    return { start, stop };
  }

  ns.observer = {
    createObserver,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
