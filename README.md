# Notion Icon AI

A Chrome extension that suggests a page icon from a Notion page's title. On a page with a title and no icon, it adds a "Suggest icon" button next to Notion's "Add icon". Clicking it shows three emoji suggestions, and picking one sets it as the page icon.

Not made by, affiliated with, or endorsed by Notion Labs, Inc.

## How it works

1. The content script adds the button to Notion and reads the page title when the button is clicked.
2. The background service worker sends the title to the backend, a Cloudflare Worker.
3. The backend asks Jev (TypeSafe's model) to rank every emoji in Notion's picker for that title, and returns the top three.
4. The picked emoji is set through Notion's own icon picker, driven out of sight.

## Layout

| Path | What it holds |
|---|---|
| `extension/` | The extension, loaded by Chrome as is. There is no build step. |
| `backend/` | The Cloudflare Worker. See [`backend/README.md`](backend/README.md). |
| `data/` | A snapshot of the emojis in Notion's picker, which the backend's catalog is built from. |
| `docs/` | Analytics events, the Web Store listing, and the write-ups of the two spikes. |
| `store-assets/` | Screenshots and promo tiles for the Web Store. |
| `playground/` | Standalone pages for design work. `screenshot.html` draws the store assets. |
| `spike/` | The scripts behind the first spike on suggestion quality. |

## Extension

### Run it locally

1. Open `chrome://extensions` and turn on Developer mode.
2. Click "Load unpacked" and choose the `extension/` folder.
3. Open a page at `https://app.notion.com` that has a title and no icon.

After changing a file, click the reload arrow on the extension's card in `chrome://extensions`, then refresh the Notion tab. The extension talks to the deployed backend, so nothing else has to be running.

### Where things are

- `notion.js` holds everything that depends on Notion's undocumented DOM. If Notion changes and the button disappears or an icon is no longer applied, the fix is in this file. Notion's controls are found by structure, never by their text, so they work in any language.
- `content.js` adds the button and ties the flow together. `popover.js` draws the suggestions.
- `background.js` makes the backend calls and holds the backend URL.
- `strings.js` holds the extension's own text in English, Portuguese and Spanish, picked by the language Notion is shown in. To add a language, add an entry keyed by its code as it appears in Notion's `<html lang>`.
- `_locales/` translates the description shown in Chrome and the Web Store. It follows the browser's language, not Notion's.

### Use a local backend

Start the backend (see [`backend/README.md`](backend/README.md)), then in `extension/`:

1. Set `BACKEND_URL` in `background.js` to `http://localhost:8787`.
2. Add `http://localhost:8787/*` to `host_permissions` in `manifest.json`.
3. Reload the extension.

Do not commit or release either change.

### Release

1. Set the new `version` in `extension/manifest.json` and commit it. Chrome needs one to four dot-separated integers, higher than any version already uploaded to the Web Store.
2. Zip the contents of `extension/`, so `manifest.json` is at the root of the archive:

   ```
   (cd extension && zip -rq ../notion-icon-ai-<version>.zip . -x '*.DS_Store')
   ```

3. Tag the commit `v<version>`, push it, and attach the zip to a GitHub Release.
4. Upload the zip in the Chrome Web Store Developer Dashboard and submit it for review.

If permissions or data handling changed, update [`docs/store-listing.md`](docs/store-listing.md), [`PRIVACY.md`](PRIVACY.md), and the matching answers in the dashboard in the same submission.

## Backend

Running, deploying, and the catalog are covered in [`backend/README.md`](backend/README.md). In short:

```
cd backend
npm install
npm run dev      # http://localhost:8787
npm run deploy
```

## Spike scripts

`spike/suggest.js` runs a list of titles through Jev and prints the top suggestions. It reads the TypeSafe key from `.env` at the repo root (gitignored):

```
npm install
echo "TYPESAFE_API_KEY=..." > .env
node --env-file=.env spike/suggest.js "Trip to Japan" "Lista de compras"
```

With no titles given it runs its built-in list.

## More

- [`PRIVACY.md`](PRIVACY.md): the privacy policy.
- [`docs/analytics.md`](docs/analytics.md): every usage event and what is collected.
- [`docs/store-listing.md`](docs/store-listing.md): the answers submitted to the Chrome Web Store.
- [`docs/spike-1-jev-suggestions.md`](docs/spike-1-jev-suggestions.md) and [`docs/spike-2-notion-write.md`](docs/spike-2-notion-write.md): the two spikes the design came from.
