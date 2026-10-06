// GET /suggest?title=... -> three emoji suggestions for a Notion page title, ranked by Jev.
// POST /event            -> a usage event from the extension, forwarded to PostHog.
import { capture, readInstall, sanitizeEvent } from "./analytics.js";
import catalog from "./catalog.json";

const TYPESAFE_URL = "https://api.typesafe.ai/v1/systemone";
const INSTRUCTIONS = "Which emoji is the best icon to represent the topic of a document titled `title`?";
// The API caps a Choice at 255 options, so the catalog is split across several Choice
// questions in one request. Each carries a "none" option so a chunk with no good match
// parks its probability there, which keeps probabilities roughly comparable across chunks.
const CHUNK = 250;
const NONE = "none_of_these";
const MAX_TITLE_LENGTH = 200;
const SUGGESTIONS = 3;
// Jev limits tokens per second across the whole account, so two requests landing together can
// be refused. A refused request is retried after a short pause instead of failing.
const JEV_RETRIES = 2;
const MAX_RETRY_WAIT_MS = 2000;

function json(body, status = 200) {
  return Response.json(body, { status });
}

function shuffled(entries) {
  const a = [...entries];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions() {
  // Jev leans toward earlier options, so the order changes on every request.
  const entries = shuffled(Object.entries(catalog));
  const questions = {};
  for (let i = 0; i * CHUNK < entries.length; i++) {
    // The slug alone describes each option (see scripts/build-catalog.js).
    const criteria = Object.fromEntries(entries.slice(i * CHUNK, (i + 1) * CHUNK).map(([slug]) => [slug, null]));
    criteria[NONE] = "No emoji in this list represents the topic of the title well";
    questions[`chunk_${i}`] = { type: "choice", instructions: INSTRUCTIONS, criteria };
  }
  return questions;
}

async function askJev(title, apiKey) {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(TYPESAFE_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ model: "jev-latest", state: { title }, questions: buildQuestions() }),
    });
    if (response.ok) return response.json();
    if (response.status !== 429 || attempt === JEV_RETRIES) {
      throw new Error(`TypeSafe responded ${response.status}: ${(await response.text()).slice(0, 200)}`);
    }
    const advised = Number(response.headers.get("retry-after")) * 1000;
    const wait = advised > 0 ? advised : 400 * (attempt + 1) + Math.random() * 300;
    await new Promise((resolve) => setTimeout(resolve, Math.min(wait, MAX_RETRY_WAIT_MS)));
  }
}

async function suggest(title, apiKey) {
  const { answers, usage } = await askJev(title, apiKey);
  const ranked = Object.values(answers)
    .flatMap((answer) => Object.entries(answer.probabilities))
    .filter(([slug]) => slug !== NONE)
    .sort((a, b) => b[1] - a[1])
    .slice(0, SUGGESTIONS);
  return {
    suggestions: ranked.map(([slug]) => ({ emoji: catalog[slug].emoji, name: catalog[slug].name })),
    topProbability: ranked[0]?.[1],
    inputTokens: usage?.input_tokens,
  };
}

// Each suggestion costs a Jev request, so both the caller's address and its install id are
// limited. The install id alone would not do: a script can invent a new one per request.
async function isRateLimited(request, env, install) {
  const checks = [env.IP_LIMITER?.limit({ key: request.headers.get("cf-connecting-ip") ?? "unknown" })];
  if (install) checks.push(env.INSTALL_LIMITER?.limit({ key: install.id }));
  const results = await Promise.all(checks);
  return results.some((result) => result && !result.success);
}

async function handleSuggest(request, env, ctx, url) {
  const title = url.searchParams.get("title")?.trim();
  if (!title) return json({ error: "Missing title" }, 400);
  if (title.length > MAX_TITLE_LENGTH) return json({ error: `Title is longer than ${MAX_TITLE_LENGTH} characters` }, 400);
  const install = readInstall(request);
  if (await isRateLimited(request, env, install)) return json({ error: "Too many requests" }, 429);
  const started = Date.now();
  try {
    const { suggestions, topProbability, inputTokens } = await suggest(title, env.TYPESAFE_API_KEY);
    // The title itself is never sent to analytics.
    capture(env, ctx, install, "suggestions_served", {
      latency_ms: Date.now() - started,
      count: suggestions.length,
      top_probability: topProbability,
      input_tokens: inputTokens,
    });
    return json({ suggestions });
  } catch (error) {
    console.error(error);
    capture(env, ctx, install, "jev_request_failed", { latency_ms: Date.now() - started });
    return json({ error: "Could not get suggestions" }, 502);
  }
}

async function handleEvent(request, env, ctx) {
  const install = readInstall(request);
  if (!install) return json({ error: "Missing install id" }, 400);
  const event = sanitizeEvent(await request.json().catch(() => null));
  if (!event) return json({ error: "Unknown event" }, 400);
  capture(env, ctx, install, event.name, event.properties);
  return json({ ok: true });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/suggest") return handleSuggest(request, env, ctx, url);
    if (request.method === "POST" && url.pathname === "/event") return handleEvent(request, env, ctx);
    return json({ error: "Not found" }, 404);
  },
};
