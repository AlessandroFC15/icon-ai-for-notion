# Spike 1: Jev icon suggestions

Date: 2026-10-05. Model: `jev-latest` (resolved to `jev-1.13.0`).

## Question

Can one Jev request turn a Notion page title into three good emoji suggestions, fast and cheap enough for a button click?

## Verdict

Yes. Good enough to build on. Two ranking issues remain (see "Open issues"), both fixable in code without changing the catalog.

## How it works

- **Catalog:** every emoji in Notion's picker (1,843), taken from a snapshot of Notion's `emojiPickerData` web asset saved in `data/notion-emojis.json`. Nothing is filtered out.
- **Descriptions:** each emoji's name from `unicode-emoji-json` plus up to six English keywords from `emojilib`.
- **Request:** the title is the `state`. The catalog is shuffled and split into 8 Choice questions of up to 250 emojis each, all in one request. Each question also has a `none_of_these` option.
- **Ranking:** all per-emoji probabilities are merged across the 8 questions and sorted. The top entries are the suggestions.

Code: `spike/catalog.js` builds the catalog, `spike/suggest.js` runs titles.

```
node --env-file=.env spike/suggest.js                      # the 30 built-in titles
node --env-file=.env spike/suggest.js "Some title" "Other" # your own
```

## Measurements

| | Value |
|---|---|
| Input tokens per request | about 54,700 |
| Cost per request | about $0.0023 (about 430 suggestions per dollar) |
| Latency | 600 to 950 ms |
| Titles tested | 30, English only |

## Sample results (top 3)

| Title | Suggestions |
|---|---|
| Trip to Japan | 🗾 🇯🇵 🗼 |
| Meeting Notes | 🤝 📝 🗒️ |
| Wedding Planning | 👰 💒 💍 |
| Customer Interviews | 💬 🗨️ 🎤 |
| Budget 2026 | 💵 💳 💹 |
| Guitar Practice Log | 🎸 🎵 🎼 |
| Gift Ideas | 🎁 💝 📦 |
| Podcast Ideas | 🎙️ 📻 🎧 |
| Bug Tracker | 🐛 🐞 🐝 |
| Q4 Roadmap | 🗓️ 📅 📆 |
| Workout Plan | 🏋️‍♂️ 🏃 🏋️‍♀️ |
| Job Applications | 💼 🈸 📩 |
| Sprint 42 Retro | 🔃 🔄 🤔 |
| Untitled | 📄 📃 📝 |

## Findings

- **Choice cap:** the API rejects a Choice with more than 255 options (`400 Too many choices`). This is why the catalog is split into chunks.
- **Merging chunks works:** with a `none_of_these` option in each chunk, probabilities were comparable enough across chunks to rank on directly. No second "re-check the finalists" request was needed.
- **Probabilities are not a distribution over the top results:** several emojis can each score above 90% for the same title, so they should be read as per-emoji fit, not shares of 100%.
- **Vague titles score low:** "Untitled" peaks at 45% and weak matches such as "Onboarding Guide" sit around 70%, while clear titles reach 95% or more. This gap can drive a fallback to generic document icons.
- **A wider catalog improved results:** adding people, smileys and flags gave better picks for several titles (🇯🇵 for a Japan trip, 🤝 for meetings, 👰 and 💍 for a wedding) compared with an earlier filtered catalog of 872.

## Latency follow-up: parallel requests

Measured later the same day, from a home connection in Brazil, calling the HTTP API directly.

| Request shape | Time |
|---|---|
| 3 options (the floor: network plus minimal model work) | 250 to 370 ms |
| 250 options, one request | 330 to 340 ms |
| 1,843 options, one request with 8 questions | 590 to 1,010 ms |
| 1,843 options, 8 parallel requests of about 230 options | 370 to 510 ms |
| 1,843 options, 16 parallel requests | 390 to 520 ms |

- **Split into 8 parallel requests:** it brings the full catalog close to the floor. Sixteen is no faster.
- **Same cost:** the token total is unchanged.
- **Ranking shifts a little:** the top results differed slightly from the single-request run but stayed sensible (for "Trip to Japan": 🇯🇵 🌸 🗾 🎌). Only three titles were checked, and this test did not shuffle the catalog.
- **The API sits behind Cloudflare:** `api.typesafe.ai` resolves to Cloudflare addresses. Where the model itself runs is unknown.

## Limits to design around

- **Request size:** 54.7k tokens against Jev's 64k per-request cap. Longer descriptions or a larger Notion emoji set would force a split into two requests.
- **Rate limit:** 100k tokens per second per account, so under two suggestions per second. Thirty parallel requests failed. The backend needs a queue or a smaller catalog if usage grows, and caching by normalized title.
- **Failure handling:** the parallel run surfaced as an SDK error (`Body is unusable: Body has already been read`) rather than a clean rate limit error. The rate limit is the assumed cause; it was not confirmed.
- **Language:** only English titles were tested. Jev's docs say other languages are weaker.

## Open issues

- **Near-duplicates:** the top 3 often contains variants of one idea (three calendars for "Q4 Roadmap", three notebooks for "Journal"). The picker needs a dedupe step so the three options differ.
- **Gender variants:** man, woman and person versions of the same emoji crowd the top (🏋️‍♂️ 🏋️‍♀️ 🏋️). These should collapse to one.
- **Literal name matches:** Japanese symbol emojis match on their English names (🈸 "Japanese application button" for "Job Applications", 🔰 for "Onboarding Guide").
- **No fallback yet:** the low-probability threshold and the generic icons to show below it are not chosen.

## Facts about Notion learned along the way

- **Picker contents:** Notion's picker has 1,843 emojis and stops at Emoji 14.0. Skin tone variants are not separate entries.
- **Domain:** `www.notion.so` redirects to `app.notion.com`, so the extension needs host permissions for `app.notion.com`.
- **Snapshot age:** `data/notion-emojis.json` reflects Notion's asset on 2026-10-05 and will need refreshing when Notion updates its emoji set.
