# Agency Dashboard Browser Extension (MV3)

This extension performs **local agency scoring** on supported AI chat sites and only sends **summarized scored events** to the backend.

## What It Does
- Observes meaningful interaction events on ChatGPT/Claude/Gemini.
- Extracts `ai_text` and `final_text` only in content script memory.
- Computes features + score locally using JS scorer parity modules.
- Shows immediate banner feedback (`pre`, scored band, drift warning).
- Buffers summarized events and flushes to backend every 60 seconds.

## Privacy Boundary
- `ai_text` and `final_text` are never persisted in storage.
- Raw text is never sent to backend in the primary mode.
- Backend receives only derived features, score outputs, and session metadata.

## Folder Layout
- `manifest.json`
- `service-worker.js`
- `content/`
- `content/scorer/`
- `shared/`
- `popup/`
- `parity/`

## Load Locally
1. Open Chrome -> `chrome://extensions`
2. Enable Developer mode.
3. Click **Load unpacked** and select the `extension/` folder.

## Backend Endpoint
Default backend base URL is set in `shared/constants.js`:
- `API_BASE_URL = "http://127.0.0.1:8000"`

Adjust this before demo if your backend is hosted elsewhere.

## Parity Gate
Run parity before integration:

```bash
python extension/parity/run_parity.py
```

This compares Python scorer vs JS scorer on the 15-case evaluation set and fails on any band/label mismatch.
