# Backend

A Cloudflare Worker that suggests three emojis for a Notion page title, ranked by Jev, and forwards the extension's usage events to PostHog.

## Deployed URL

```
https://icon-ai-for-notion.icon-ai-for-notion-backend.workers.dev
```

Example: `GET /suggest?title=Trip to Japan`

```json
{"suggestions":[{"emoji":"🗾","name":"map of Japan"},{"emoji":"🗻","name":"mount fuji"},{"emoji":"🇯🇵","name":"flag Japan"}]}
```

The endpoint is public. `/suggest` is limited to 20 requests a minute per install and 40 a minute per IP address, and answers `429` beyond that. A request Jev refuses for its own rate limit is retried up to twice before failing.

The `icon-ai-for-notion-backend` part is the Cloudflare account's `workers.dev` subdomain. Renaming it in the Cloudflare dashboard changes this URL.

## Usage events

`POST /event` takes a usage event from the extension and forwards it to PostHog. `/suggest` records its own events when the request carries an install id. The event list and what is collected are in [`../docs/analytics.md`](../docs/analytics.md).

Events are sent only when `POSTHOG_API_KEY` is set. Set it once on the deployed Worker:

```
npx wrangler secret put POSTHOG_API_KEY
```

`POSTHOG_HOST` is optional and defaults to the US host.

## Run locally

```
npm install
npm run dev
```

This serves `http://localhost:8787`. The Jev key is read from `.dev.vars` (gitignored):

```
TYPESAFE_API_KEY=...
```

## Deploy

```
npx wrangler login   # once
npm run deploy
```

The deployed Worker reads the key from a secret, set once with `npx wrangler secret put TYPESAFE_API_KEY`.

## Catalog

`src/catalog.json` holds every emoji in Notion's picker, keyed by the slug Jev chooses from (the emoji's name with underscores, such as `map_of_japan`). Jev sees only the slug. Regenerate the file with `npm run catalog` after refreshing `../data/notion-emojis.json` or updating the emoji package.
