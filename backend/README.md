# Backend

A Cloudflare Worker that suggests three emojis for a Notion page title, ranked by Jev.

## Deployed URL

```
https://icon-ai-for-notion.icon-ai-for-notion-backend.workers.dev
```

Example: `GET /suggest?title=Trip to Japan`

```json
{"suggestions":[{"emoji":"🗾","name":"map of Japan"},{"emoji":"🗻","name":"mount fuji"},{"emoji":"🇯🇵","name":"flag Japan"}]}
```

The endpoint is public and has no rate limiting yet.

The `icon-ai-for-notion-backend` part is the Cloudflare account's `workers.dev` subdomain. Renaming it in the Cloudflare dashboard changes this URL.

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

`src/catalog.json` holds every emoji in Notion's picker with the description Jev sees. Regenerate it with `npm run catalog` after refreshing `../data/notion-emojis.json` or updating the emoji packages.
