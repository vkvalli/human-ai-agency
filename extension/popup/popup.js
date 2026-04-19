const scoreEl = document.getElementById("score");
const bandEl = document.getElementById("band");
const sessionEl = document.getElementById("session");
const pendingEl = document.getElementById("pending");

function setBand(band) {
  const safeBand = String(band || "unknown").toLowerCase();
  bandEl.textContent = safeBand;
  bandEl.className = `pill ${safeBand === "high" || safeBand === "medium" || safeBand === "low" ? safeBand : "medium"}`;
}

function renderState(state) {
  if (!state || !state.ok) return;

  if (state.latest) {
    scoreEl.textContent = String(state.latest.agency_score ?? "--");
    setBand(state.latest.agency_band);
  } else {
    scoreEl.textContent = "--";
    setBand("unknown");
  }

  if (state.session?.session_id) {
    sessionEl.textContent = `Session: ${state.session.session_id.slice(0, 8)}...`;
  } else {
    sessionEl.textContent = "No active session";
  }

  pendingEl.textContent = `Pending sync: ${Number(state.pending_count || 0)}`;
}

function requestState() {
  chrome.runtime.sendMessage({ type: "GET_POPUP_STATE" }, renderState);
}

document.getElementById("refresh").addEventListener("click", requestState);
document.getElementById("end").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "SESSION_END" }, () => {
    requestState();
  });
});

requestState();
