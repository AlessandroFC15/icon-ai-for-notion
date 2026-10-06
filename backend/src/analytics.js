// Usage analytics, forwarded to PostHog. The extension never talks to PostHog itself, so no
// analytics key ships in it. Nothing here carries page titles, page ids, or anything about the
// Notion user: an install is identified only by a random id the extension generates.

const DEFAULT_POSTHOG_HOST = "https://us.i.posthog.com";
const INSTALL_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const VERSION = /^\d+(\.\d+){0,3}$/;

// Events the extension may send, and the properties each may carry. Anything else is dropped,
// so this public endpoint cannot be used to store arbitrary data.
const EXTENSION_EVENTS = {
  button_shown: [],
  suggest_clicked: ["view"],
  suggestions_shown: ["view", "latency_ms", "count", "cached"],
  suggestion_failed: ["view", "latency_ms", "reason"],
  suggestions_dismissed: ["view", "more_clicks"],
  icon_picked: ["view", "rank", "more_clicks"],
  icon_apply_failed: ["view", "reason"],
};
const PROPERTY_CHECKS = {
  view: (value) => value === "page" || value === "peek",
  reason: (value) => typeof value === "string" && /^[a-z_]{1,40}$/.test(value),
  cached: (value) => typeof value === "boolean",
  latency_ms: isCount,
  count: isCount,
  rank: isCount,
  more_clicks: isCount,
};

function isCount(value) {
  return Number.isInteger(value) && value >= 0 && value < 1e7;
}

// The install behind a request, or null when it does not identify itself properly.
export function readInstall(request) {
  const id = request.headers.get("x-install-id") ?? "";
  if (!INSTALL_ID.test(id)) return null;
  const version = request.headers.get("x-extension-version") ?? "";
  return { id, version: VERSION.test(version) ? version : undefined };
}

// Reduces a request body to a known event with only its allowed, well-formed properties.
export function sanitizeEvent(body) {
  const allowed = EXTENSION_EVENTS[body?.event];
  if (!allowed) return null;
  const properties = {};
  for (const key of allowed) {
    const value = body.properties?.[key];
    if (value !== undefined && PROPERTY_CHECKS[key](value)) properties[key] = value;
  }
  return { name: body.event, properties };
}

// Sends one event to PostHog without delaying the response. Does nothing when no project key
// is configured (local development) or the caller is not an identified install.
export function capture(env, ctx, install, event, properties = {}) {
  if (!env.POSTHOG_API_KEY || !install) return;
  const request = fetch(`${env.POSTHOG_HOST || DEFAULT_POSTHOG_HOST}/i/v0/e/`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      api_key: env.POSTHOG_API_KEY,
      event,
      distinct_id: install.id,
      timestamp: new Date().toISOString(),
      properties: {
        ...properties,
        extension_version: install.version,
        $lib: "icon-ai-worker",
        // Installs are anonymous counters, not people, and the request comes from Cloudflare,
        // so its IP says nothing about the user.
        $process_person_profile: false,
        $geoip_disable: true,
      },
    }),
  }).catch((error) => console.error("PostHog capture failed", error));
  ctx.waitUntil(request);
}
