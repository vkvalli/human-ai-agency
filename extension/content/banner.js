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

  ns.banner = {
    showPreBanner,
    showScoreBanner,
    showDriftBanner,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
