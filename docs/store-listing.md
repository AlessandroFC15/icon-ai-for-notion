# Chrome Web Store listing

Paste-ready answers for the Developer Dashboard, in dashboard order. Written for version 1.0.0. Every answer describes what the code does, so update this file whenever permissions, data flows, or the backend change.

The dashboard's field names and limits change over time. Where the live form differs from this file, trust the form.

## Store listing

### Title

Comes from `name` in `extension/manifest.json`. Changing it means a new package.

```
Notion Icon AI
```

### Summary

Comes from `description` in the manifest (132 characters max), through `extension/_locales`. Changing it means a new package.

```
Suggests a page icon from the page title.
```

### Description (English)

```
Notion Icon AI suggests an icon for your Notion page from its title.

On any page without an icon, click "Suggest icon" above the title and pick one of three emojis. Works with Notion in any language.

Not made by, affiliated with, or endorsed by Notion Labs, Inc.
```

### Description (Portuguese)

```
O Notion Icon AI sugere um ícone para a sua página do Notion a partir do título.

Em qualquer página sem ícone, clique em "Sugerir ícone" acima do título e escolha um dos três emojis. Funciona com o Notion em qualquer idioma.

Não é feito, afiliado nem endossado pela Notion Labs, Inc.
```

### Description (Spanish)

```
Notion Icon AI sugiere un ícono para tu página de Notion a partir del título.

En cualquier página sin ícono, haz clic en "Sugerir ícono" encima del título y elige uno de los tres emojis. Funciona con Notion en cualquier idioma.

No está hecha, afiliada ni respaldada por Notion Labs, Inc.
```

### Category

```
Workflow & Planning
```

Reason: it speeds up a step in organising a Notion workspace. "Tools" is the fallback if that category is not offered.

### Language

```
English
```

The package ships `en`, `pt_BR`, `pt_PT` and `es` locales, so the dashboard should offer a localized listing for each. Paste the Portuguese description into both Portuguese locales.

### Assets

| Asset | Size | Status |
|---|---|---|
| Store icon | 128x128 PNG | Exists: `extension/icons/icon128.png`. Check the artwork is about 96x96 with transparent padding. |
| Screenshots | 1280x800 or 640x400, 1 to 5 | Missing |
| Small promo tile | 440x280 | Exists: `store-assets/promo-small.png`, from `playground/screenshot.html?tile=small`. |
| Marquee promo tile | 1400x560 | Exists: `store-assets/marquee.png`, from `playground/screenshot.html?tile=marquee`. |
| Promo video | YouTube URL | Missing, optional |

Suggested screenshots, in order:

1. A Notion page with no icon, showing "Suggest icon" next to "Add icon".
2. The popover open with three emoji suggestions under the button.
3. The same page with the picked icon set.
4. The same flow in a side peek.
5. Notion in Portuguese or Spanish, with the translated button.

### URLs

| Field | Status |
|---|---|
| Homepage | `https://github.com/AlessandroFC15/icon-ai-for-notion` |
| Support | `https://github.com/AlessandroFC15/icon-ai-for-notion/issues` |
| Privacy policy | `https://github.com/AlessandroFC15/icon-ai-for-notion/blob/master/PRIVACY.md` |

## Privacy

### Single purpose

```
Notion Icon AI suggests an emoji icon for a Notion page based on the page's title, and sets the suggestion the user picks as the page icon.
```

### Permission justification: storage

Used in `extension/background.js` (lines 7, 10, 29 and 31).

```
The extension stores two small values in chrome.storage.local. The first is a random install id generated on first run, sent with requests to our server so it can rate-limit each install and count anonymous usage. The second is the date the "button shown" usage event was last sent, so that event is sent at most once a day. No page content, page titles or browsing data is stored.
```

### Permission justification: host permissions

Covers the host permission for the backend (`extension/background.js`, lines 19 and 33) and the content script on `https://app.notion.com/*` (`extension/manifest.json`).

```
https://app.notion.com/*: the extension's content script runs only on the Notion web app. It adds a "Suggest icon" button next to Notion's "Add icon" button, reads the title of the open page when the user clicks that button, and sets the icon the user picks through Notion's own icon picker. It runs on no other site.

https://icon-ai-for-notion.icon-ai-for-notion-backend.workers.dev/*: this is the extension's own server. The background service worker sends it the page title to get emoji suggestions, and sends anonymous usage events. The request is made from the service worker because Notion's content security policy blocks it from the page. Access is limited to this single host.
```

### Remote code

```
No, I am not using remote code.
```

All JavaScript is in the package. The server returns only JSON data (emoji suggestions). The one use of `innerHTML` writes a fixed SVG string defined in `extension/content.js`.

### Data usage

| Category | Answer | Evidence |
|---|---|---|
| Personally identifiable information | No | No name, email, or account identifier is read. The install id is a random UUID tied to nothing. |
| Health information | No | |
| Financial and payment information | No | |
| Authentication information | No | No cookies, tokens or credentials are read. |
| Personal communications | No | |
| Location | No, with a caveat | The server reads the caller's IP address only as a rate-limit key (`backend/src/index.js`, `isRateLimited`). It is not stored, logged, or sent to analytics, and IP-based location is switched off in analytics. The store lists IP address under Location, so tick this if you prefer the conservative answer. |
| Web history | No | No URLs or page ids are collected. |
| User activity | Yes | Usage events for clicks on the extension's own button and popover, listed in `docs/analytics.md`. |
| Website content | Yes | The title of the open Notion page is sent to the server, and from there to the AI provider (TypeSafe), when the user clicks "Suggest icon". |

### Certifications

| Statement | True of the code? |
|---|---|
| I do not sell or transfer user data to third parties, outside of the approved use cases | Yes. The title goes to TypeSafe only to produce the suggestions, and usage events go to PostHog as a service provider. Confirm TypeSafe's terms do not let it keep or reuse the titles for its own purposes. |
| I do not use or transfer user data for purposes unrelated to the item's single purpose | Yes. Titles are used only for suggestions. Usage events measure this one feature. |
| I do not use or transfer user data to determine creditworthiness or for lending purposes | Yes. |

## Distribution

- **Price:** free.
- **Visibility:** unlisted for the first submission, so the listing can be tested from the store link before it is public. Switch to public afterwards.
- **Regions:** all regions.

## Test instructions

The reviewer needs a Notion account. Either state that any free account works, or create a test account and enter its credentials in the dashboard's test instructions field.

```
The extension only acts on the Notion web app, and clicking its toolbar icon does nothing.

1. Sign in at https://app.notion.com (any free Notion account works).
2. Create a new page and give it a title, for example "Trip to Japan". Do not add an icon.
3. Hover over the area above the title. Next to Notion's "Add icon" button there is a "Suggest icon" button added by the extension.
4. Click "Suggest icon". After a moment, three emoji suggestions appear below the button.
5. Click one. It is set as the page icon.

The button only appears on pages that have no icon, and does nothing if the page has no title.
```

## Account prerequisites

For a first submission: the one-time developer registration fee, a verified contact email, and the trader or non-trader declaration.

## Privacy policy

The policy is `PRIVACY.md` at the root of the repo, published at:

```
https://github.com/AlessandroFC15/icon-ai-for-notion/blob/master/PRIVACY.md
```

Keep it in step with the data usage answers above.
