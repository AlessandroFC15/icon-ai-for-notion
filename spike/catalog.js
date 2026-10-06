import { readFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url)));
// Every emoji in Notion's picker, by category (snapshot of its emojiPickerData asset, 2026-10-05).
const notion = read("../data/notion-emojis.json");
const names = read("../node_modules/unicode-emoji-json/data-by-emoji.json");
const keywords = read("../node_modules/emojilib/dist/emoji-en-US.json");

// The sources disagree on variation selectors, so lookups ignore them.
const norm = (emoji) => emoji.replace(/️/g, "");
const byEmoji = (data) => new Map(Object.entries(data).map(([emoji, value]) => [norm(emoji), value]));
const nameOf = byEmoji(names);
const keywordsOf = byEmoji(keywords);

// slug -> { emoji, description }
export const catalog = {};
for (const emoji of Object.values(notion).flat()) {
  const meta = nameOf.get(norm(emoji));
  const words = (keywordsOf.get(norm(emoji)) ?? []).map((w) => w.replace(/_/g, " ")).filter((w) => w !== meta.name);
  catalog[meta.slug] = { emoji, description: [meta.name, ...new Set(words)].slice(0, 7).join(", ") };
}
