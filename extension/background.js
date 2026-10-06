// Backend calls live here because content scripts are bound by the page's CORS and CSP.
const BACKEND_URL = "https://icon-ai-for-notion.icon-ai-for-notion-backend.workers.dev";

// A random id for this install, so usage can be counted per install. It is tied to nothing
// in Notion or the browser profile.
async function installId() {
  const stored = await chrome.storage.local.get("installId");
  if (stored.installId) return stored.installId;
  const id = crypto.randomUUID();
  await chrome.storage.local.set({ installId: id });
  return id;
}

async function backendHeaders() {
  return { "x-install-id": await installId(), "x-extension-version": chrome.runtime.getManifest().version };
}

async function suggest(title) {
  const response = await fetch(`${BACKEND_URL}/suggest?title=${encodeURIComponent(title)}`, { headers: await backendHeaders() });
  if (!response.ok) throw new Error(`backend ${response.status}`);
  return (await response.json()).suggestions;
}

// Usage events carry no page titles or ids. See docs/analytics.md for the full list.
async function track(event, properties) {
  if (event === "button_shown") {
    // Sent at most once a day: it only shows that the button still appears for this install.
    const today = new Date().toISOString().slice(0, 10);
    const { buttonShownDay } = await chrome.storage.local.get("buttonShownDay");
    if (buttonShownDay === today) return;
    await chrome.storage.local.set({ buttonShownDay: today });
  }
  await fetch(`${BACKEND_URL}/event`, {
    method: "POST",
    headers: { ...(await backendHeaders()), "content-type": "application/json" },
    body: JSON.stringify({ event, properties }),
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "suggest") {
    suggest(message.title)
      .then((suggestions) => sendResponse({ ok: true, suggestions }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true; // keep the channel open for the async response
  }
  if (message.type === "track") {
    track(message.event, message.properties).catch(() => {}); // analytics must never break the feature
  }
});
