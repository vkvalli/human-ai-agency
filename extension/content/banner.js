(function initBanner(root) {
  const ns = (root.AgencyExt = root.AgencyExt || {});

  const BANNER_ID = "agency-dashboard-banner-root";

  function createHost() {
    let host = document.getElementById(BANNER_ID);
    if (host) return host;

    host = document.createElement("div");
    host.id = BANNER_ID;
    host.style.position = "fixed";
    host.style.top = "16px";
    host.style.right = "16px";
    host.style.zIndex = "2147483647";
    document.documentElement.appendChild(host);
    return host;
  }

  function ensureShadow() {
    const host = createHost();
    const shadow = host.shadowRoot || host.attachShadow({ mode: "open" });
    if (!shadow.getElementById("agency-banner-style")) {
      const style = document.createElement("style");
      style.id = "agency-banner-style";
      style.textContent = `
        .card { font-family: Inter, system-ui, sans-serif; min-width: 280px; max-width: 360px; border-radius: 14px; padding: 14px 16px; box-shadow: 0 14px 30px rgba(15,23,42,.22); border: 1px solid rgba(255,255,255,.18); color: #f8fafc; }
        .pre { background: #1f2937; }
        .low { background: #7f1d1d; }
        .medium { background: #92400e; }
        .high { background: #14532d; }
        .drift { background: #3f1d7a; }
        .title { font-size: 12px; opacity: .9; margin: 0 0 4px; text-transform: uppercase; letter-spacing: .04em; }
        .value { font-size: 18px; font-weight: 700; margin: 0; }
        .sub { font-size: 12px; margin: 6px 0 0; opacity: .95; line-height: 1.4; }
      `;
      shadow.appendChild(style);
    }
    return shadow;
  }

  function render({ mode, title, value, subtitle }) {
    const shadow = ensureShadow();
    let card = shadow.getElementById("agency-banner-card");
    if (!card) {
      card = document.createElement("div");
      card.id = "agency-banner-card";
      shadow.appendChild(card);
    }

    card.className = `card ${mode}`;
    card.innerHTML = `
      <p class="title">${title}</p>
      <p class="value">${value}</p>
      <p class="sub">${subtitle || ""}</p>
    `;
  }

  function dismiss(delayMs) {
    if (!delayMs) return;
    setTimeout(() => {
      const host = document.getElementById(BANNER_ID);
      if (host) host.remove();
    }, delayMs);
  }

  function showPreBanner() {
    render({
      mode: "pre",
      title: "Agency Check",
      value: "Reviewing your decision...",
      subtitle: "Quick local signal suggests possible over-reliance.",
    });
  }

  function showScoreBanner(score) {
    const band = String(score.agency_band || "medium").toLowerCase();
    const topDriver = Array.isArray(score.drivers) && score.drivers.length ? score.drivers[0] : "No driver available";
    render({
      mode: band,
      title: "Agency Score (Patched)",
      value: `${score.agency_score} (${band})`,
      subtitle: topDriver,
    });
    dismiss(8000);
  }

  function showDriftBanner(reason) {
    render({
      mode: "drift",
      title: "Agency Drift Detected",
      value: "Pause and review",
      subtitle: reason || "Recent behavior suggests high reliance pressure.",
    });
  }

  const CHECKLIST_ID = "agency-keep-points-root";

  function ensureChecklistShadow() {
    let host = document.getElementById(CHECKLIST_ID);
    if (!host) {
      host = document.createElement("div");
      host.id = CHECKLIST_ID;
      host.style.position = "fixed";
      host.style.bottom = "16px";
      host.style.right = "16px";
      host.style.zIndex = "2147483647";
      document.documentElement.appendChild(host);
    }
    const shadow = host.shadowRoot || host.attachShadow({ mode: "open" });
    if (!shadow.getElementById("agency-checklist-style")) {
      const style = document.createElement("style");
      style.id = "agency-checklist-style";
      style.textContent = `
        .panel { font-family: Inter, system-ui, sans-serif; min-width: 260px; max-width: 340px; border-radius: 14px; padding: 12px 14px; box-shadow: 0 14px 30px rgba(15,23,42,.22); border: 1px solid rgba(255,255,255,.14); background: #0f172a; color: #e2e8f0; }
        .head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .title { font-size: 11px; opacity: .8; margin: 0; text-transform: uppercase; letter-spacing: .04em; }
        .close { cursor: pointer; opacity: .6; font-size: 14px; line-height: 1; background: none; border: none; color: inherit; }
        .close:hover { opacity: 1; }
        .item { display: flex; gap: 8px; align-items: flex-start; padding: 5px 0; font-size: 12.5px; line-height: 1.4; }
        .icon { flex: none; width: 16px; text-align: center; }
        .ok .icon { color: #4ade80; }
        .risk .icon { color: #fbbf24; }
        .text { opacity: .95; }
      `;
      shadow.appendChild(style);
    }
    return shadow;
  }

  function showKeepPointsChecklist(results) {
    if (!Array.isArray(results) || !results.length) return;
    const shadow = ensureChecklistShadow();
    let panel = shadow.getElementById("agency-checklist-panel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "agency-checklist-panel";
      panel.className = "panel";
      shadow.appendChild(panel);
    }

    const items = results
      .map((r) => {
        const cls = r.satisfied ? "ok" : "risk";
        const icon = r.satisfied ? "✓" : "⚠";
        return `<div class="item ${cls}"><span class="icon">${icon}</span><span class="text">${r.point}</span></div>`;
      })
      .join("");

    panel.innerHTML = `
      <div class="head">
        <p class="title">Must Keep Points</p>
        <button class="close" type="button" aria-label="Dismiss">×</button>
      </div>
      ${items}
    `;

    const closeBtn = panel.querySelector(".close");
    if (closeBtn) {
      closeBtn.onclick = () => {
        const host = document.getElementById(CHECKLIST_ID);
        if (host) host.remove();
      };
    }
  }

  function hideKeepPointsChecklist() {
    const host = document.getElementById(CHECKLIST_ID);
    if (host) host.remove();
  }

  ns.banner = {
    showPreBanner,
    showScoreBanner,
    showDriftBanner,
    showKeepPointsChecklist,
    hideKeepPointsChecklist,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
