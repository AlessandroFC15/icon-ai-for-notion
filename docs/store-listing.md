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
Notion Icon AI picks an icon for your Notion page so you don't have to scroll through the emoji picker. It is for anyone who creates a lot of Notion pages and wants each one to have a fitting icon.

How it works
On any Notion page that has a title and no icon, a "Suggest icon" button appears next to Notion's own "Add icon" button. Click it and you get three emoji suggestions based on the page title. Click one and it becomes the page icon. If none fits, ask for more.

The icon is set through Notion's own icon picker, so it behaves exactly like an icon you picked by hand. It works on full pages and in side peeks, in light and dark mode.

Languages
The extension works with Notion in any language. Its own button and messages are available in English, Portuguese and Spanish.

What it sends, and what it does not
When you click "Suggest icon", the title of that page is sent to our server, which uses an AI model to rank emojis for it. The title is used only to produce the suggestions and is not stored. Nothing is sent until you click the button, and the content of your pages is never read or sent.

The extension also sends anonymous usage events, such as "the button was clicked" or "a suggestion was picked", tied to a random install id. These events never include page titles, page ids, or anything about your Notion account or workspace.

This extension is not made by, affiliated with, or endorsed by Notion Labs, Inc.
```

### Description (Portuguese)

```
O Notion Icon AI escolhe um ícone para a sua página do Notion, para você não precisar procurar no seletor de emojis. É para quem cria muitas páginas no Notion e quer que cada uma tenha um ícone adequado.

Como funciona
Em qualquer página do Notion que tenha título e não tenha ícone, aparece um botão "Sugerir ícone" ao lado do botão "Adicionar ícone" do próprio Notion. Clique nele e você recebe três sugestões de emoji com base no título da página. Clique em uma e ela vira o ícone da página. Se nenhuma servir, peça mais.

O ícone é definido pelo seletor de ícones do próprio Notion, então se comporta exatamente como um ícone escolhido à mão. Funciona em páginas inteiras e na visualização lateral, nos modos claro e escuro.

Idiomas
A extensão funciona com o Notion em qualquer idioma. O botão e as mensagens da extensão estão disponíveis em inglês, português e espanhol.

O que é enviado e o que não é
Quando você clica em "Sugerir ícone", o título daquela página é enviado ao nosso servidor, que usa um modelo de IA para classificar emojis para ele. O título é usado apenas para gerar as sugestões e não é armazenado. Nada é enviado até você clicar no botão, e o conteúdo das suas páginas nunca é lido nem enviado.

A extensão também envia eventos de uso anônimos, como "o botão foi clicado" ou "uma sugestão foi escolhida", ligados a um identificador aleatório de instalação. Esses eventos nunca incluem títulos de páginas, identificadores de páginas, nem nada sobre a sua conta ou o seu espaço de trabalho do Notion.

Esta extensão não é feita, afiliada nem endossada pela Notion Labs, Inc.
```

### Description (Spanish)

```
Notion Icon AI elige un ícono para tu página de Notion, para que no tengas que buscar en el selector de emojis. Es para quienes crean muchas páginas en Notion y quieren que cada una tenga un ícono adecuado.

Cómo funciona
En cualquier página de Notion que tenga título y no tenga ícono, aparece un botón "Sugerir ícono" junto al botón "Agregar un ícono" de Notion. Haz clic y recibirás tres sugerencias de emoji basadas en el título de la página. Haz clic en una y se convierte en el ícono de la página. Si ninguna te sirve, pide más.

El ícono se establece mediante el selector de íconos del propio Notion, así que se comporta exactamente igual que uno elegido a mano. Funciona en páginas completas y en la vista lateral, en modo claro y oscuro.

Idiomas
La extensión funciona con Notion en cualquier idioma. Su botón y sus mensajes están disponibles en inglés, portugués y español.

Qué se envía y qué no
Cuando haces clic en "Sugerir ícono", el título de esa página se envía a nuestro servidor, que usa un modelo de IA para clasificar emojis para ese título. El título se usa únicamente para generar las sugerencias y no se almacena. No se envía nada hasta que haces clic en el botón, y el contenido de tus páginas nunca se lee ni se envía.

La extensión también envía eventos de uso anónimos, como "se hizo clic en el botón" o "se eligió una sugerencia", asociados a un identificador aleatorio de instalación. Estos eventos nunca incluyen títulos de páginas, identificadores de páginas ni nada sobre tu cuenta o tu espacio de trabajo de Notion.

Esta extensión no está hecha, afiliada ni respaldada por Notion Labs, Inc.
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
