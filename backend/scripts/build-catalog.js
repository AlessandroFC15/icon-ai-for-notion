// Builds src/catalog.json: every emoji in Notion's picker, keyed by the slug Jev chooses from.
// Run: npm run catalog (after refreshing ../data/notion-emojis.json or updating the emoji package).
import { readFileSync, writeFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const notion = read("../../data/notion-emojis.json");
const names = read("../node_modules/unicode-emoji-json/data-by-emoji.json");

// The sources disagree on variation selectors, so lookups ignore them.
const norm = (emoji) => emoji.replace(/️/g, "");
const byEmoji = (data) => new Map(Object.entries(data).map(([emoji, value]) => [norm(emoji), value]));
const nameOf = byEmoji(names);

// slug -> { emoji, name }. The slug is the emoji's name with underscores, and it is all Jev
// sees: adding the name or keywords as a description cost 2 to 3 times the tokens without
// changing the suggestions noticeably (compared on 30 titles, 2026-10-06).
const catalog = {};
for (const emoji of Object.values(notion).flat()) {
  const meta = nameOf.get(norm(emoji));
  if (!meta) throw new Error(`No name data for ${emoji}`);
  catalog[meta.slug] = { emoji, name: meta.name };
}

writeFileSync(new URL("../src/catalog.json", import.meta.url), JSON.stringify(catalog) + "\n");
console.log(`catalog: ${Object.keys(catalog).length} emojis`);
