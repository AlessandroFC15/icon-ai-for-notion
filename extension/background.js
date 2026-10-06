// The backend call lives here because content scripts are bound by the page's CORS and CSP.
const BACKEND_URL = "http://localhost:8787";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "suggest") return;
  fetch(`${BACKEND_URL}/suggest?title=${encodeURIComponent(message.title)}`)
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`backend ${response.status}`))))
    .then((data) => sendResponse({ ok: true, suggestions: data.suggestions }))
    .catch((error) => sendResponse({ ok: false, error: String(error) }));
  return true; // keep the channel open for the async response
});
