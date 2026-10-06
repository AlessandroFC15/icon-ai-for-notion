// Spike: does one Jev Choice over the emoji catalog give good top-3 icons for a page title?
// Run: node --env-file=.env spike/suggest.js ["Some title" ...]
import { choice, TypeSafeClient } from "@typesafe-ai/sdk";
import { catalog } from "./catalog.js";

const TITLES = [
  "Q4 Roadmap", "Meeting Notes", "Reading List", "Trip to Japan", "Weekly Grocery List",
  "Workout Plan", "Job Applications", "Budget 2026", "Recipes", "Onboarding Guide",
  "Bug Tracker", "Design System", "Wedding Planning", "Book Notes: Atomic Habits", "Untitled",
  "Notes", "Sprint 42 Retro", "Apartment Hunting", "Guitar Practice Log", "Tax Documents",
  "Gift Ideas", "Movie Watchlist", "Home Renovation", "Journal", "Customer Interviews",
  "API Documentation", "Podcast Ideas", "Garden Planner", "Car Maintenance", "Fantasy Basketball Draft",
];

const client = new TypeSafeClient();

function shuffled(entries) {
  const a = [...entries];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// The API caps a Choice at 255 options, so the catalog is split across several Choice
// questions in one request. Each carries a "none" option so a chunk with no good match
// parks its probability there, which keeps probabilities roughly comparable across chunks.
const CHUNK = 250;
const NONE = "none_of_these";

async function suggest(title) {
  // Jev leans toward earlier options, so the order changes on every request.
  const entries = shuffled(Object.entries(catalog));
  const questions = {};
  for (let i = 0; i * CHUNK < entries.length; i++) {
    const criteria = Object.fromEntries(entries.slice(i * CHUNK, (i + 1) * CHUNK).map(([slug, e]) => [slug, e.description]));
    criteria[NONE] = "No emoji in this list represents the topic of the title well";
    questions[`chunk_${i}`] = choice("Which emoji is the best icon to represent the topic of a document titled `title`?", criteria);
  }
  const started = performance.now();
  const response = await client.systemOne({ state: { title }, questions });
  const ms = Math.round(performance.now() - started);
  const top = Object.values(response.answers)
    .flatMap((answer) => Object.entries(answer.probabilities))
    .filter(([slug]) => slug !== NONE)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([slug, p]) => `${catalog[slug].emoji} ${slug} ${(p * 100).toFixed(0)}%`);
  return { top, ms, usage: response.usage };
}

const titles = process.argv.length > 2 ? process.argv.slice(2) : TITLES;
console.log(`catalog: ${Object.keys(catalog).length} emojis`);
// One at a time: a request is ~55k tokens and the rate limit is 100k tokens per second.
const results = [];
for (const title of titles) results.push(await suggest(title));
titles.forEach((title, i) => {
  const { top, ms } = results[i];
  console.log(`${title.padEnd(28)} ${String(ms).padStart(5)}ms  ${top.join(" | ")}`);
});
console.log("usage (first request):", JSON.stringify(results[0].usage));
