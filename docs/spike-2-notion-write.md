# Spike 2: writing a page icon to Notion

Date: 2026-10-05.

## Question

Can code running in a logged-in Notion tab set a page's icon through Notion's private API, with no OAuth or integration setup?

## Verdict

Yes. One request set the icon on the first attempt, and the open page showed it without a reload.

## What was done

Run from the page context of `app.notion.com` on a test page ("Mercado") that had no icon, using the logged-in session cookies only.

1. **Read the page record** to get its workspace id and confirm it had no icon:

   ```
   POST /api/v3/syncRecordValuesMain
   {"requests":[{"pointer":{"table":"block","id":"<page id>"},"version":-1}]}
   ```

   The response has the record at `recordMap.block[<page id>]`, with `spaceId` beside `value`, and the block itself at `value.value` (`type`, `properties.title`, `format`, `space_id`). `value.role` was `editor`.

2. **Set the icon:**

   ```
   POST /api/v3/saveTransactionsFanout
   {
     "requestId": "<uuid>",
     "transactions": [{
       "id": "<uuid>",
       "spaceId": "<space id>",
       "debug": {"userAction": "iconSpike.setPageIcon"},
       "operations": [{
         "pointer": {"table": "block", "id": "<page id>", "spaceId": "<space id>"},
         "path": ["format", "page_icon"],
         "command": "set",
         "args": "🛒"
       }]
     }]
   }
   ```

   Response: `200` with body `{}` in 524 ms.

3. **Verified** by re-reading the record (`format` became `{"page_icon":"🛒"}`, version went from 42 to 43) and by checking the page's icon element in the DOM, which showed 🛒 about two seconds later without a reload.

## Findings

- **No extra headers needed:** `content-type: application/json` plus the session cookies was enough. No CSRF token or user-id header was required for this account.
- **`set` creates the parent:** the page had no `format` object at all, and `set` on `["format","page_icon"]` created it.
- **Page id for a full page:** the last 32 hex characters of the URL path, re-hyphenated as a UUID. This does not hold for database rows (see below).
- **Live update:** the open tab picked up the change through Notion's own sync, so the extension does not need to touch the icon DOM after writing.

## Database row in side peek

Second test, on a row of a database ("Goals Tracking") opened in side peek. The row had no icon. The emoji written (⏱️) was Jev's top suggestion for the row's title, so this was also the first end-to-end run of suggestion plus write.

- **Same call works:** the row is a `page` block with `parent_table: "collection"`. The identical `saveTransactionsFanout` request returned `200` and the peek showed the icon without a reload.
- **Existing format is preserved:** the row already had a `format.copied_from_pointer` value. After the write, `format` had both keys, so `set` on `["format","page_icon"]` does not clobber siblings.
- **The URL path is the wrong id here:** the path holds the database's own page (`collection_view_page`). The row's id is in the `p` query parameter, with `pm=s` marking side peek and `v` the database view.
- **The DOM gives the right id without the URL:** "Add icon" is a `div[role=button]` inside `.notion-page-controls`, with siblings "Add cover" and "Customize layout". In a peek it sits inside `.notion-peek-renderer` (`role=region`, `aria-label="Side Peek"`). The first `.notion-page-block[data-block-id]` inside that same container is the title block, and its `data-block-id` equals the row's page id.
- **Take the title block only:** relation property chips in the peek are also `.notion-page-block` elements with other pages' ids, so the lookup must pick the title block, not any match.
- **Button classes are unstable:** the button's own classes are generated (`x87ps6o` and similar). Use `.notion-page-controls` and the button text to find it.
- **"Add icon" disappears after the write:** Notion removed the button on its own once the icon was set.

## Database row opened as a full page

Third check, read-only, on the same row opened full screen. It already had the ⏱️ icon from the previous test, so "Add icon" was not present and no write was made.

- **The URL path is the row's id again:** opened full screen, the row behaves like any page, with its id at the end of the path and no query parameters.
- **Same structure, different container:** `.notion-page-controls` (showing "Add cover" and "Customize layout") and the title block both sit under `main.notion-frame` instead of `.notion-peek-renderer`. The title block's `data-block-id` matched the row's id.
- **An empty peek container can exist:** a `.notion-peek-renderer` element was in the DOM with no peek open. The lookup must start from the button and walk up (`closest('.notion-peek-renderer')`, else `closest('.notion-frame')`), not test whether a peek element exists on the page.

## "Add icon" on a full-page row

Fourth check, read-only, after the icon was removed from the row by hand.

- **Observed, not inferred:** "Add icon" is in `.notion-page-controls` under `main.notion-frame`, before "Add cover" and "Customize layout". The lookup from the button to the frame's title block returned the row's id.
- **Removing an icon by hand deletes the key:** the record's `format` no longer had `page_icon` at all, the same state as a page that never had one.
- **The button is always in the DOM, hidden:** before hover it has `opacity: 0` and `pointer-events: none`. The container itself is visible.
- **Hover is driven by JavaScript:** on hovering the title area, Notion writes `opacity: 1; pointer-events: auto; transition: opacity 100ms` into each button's inline `style`. It is not a CSS `:hover` rule, so an injected button will not show and hide with the others by itself. It has to copy the "Add icon" button's inline opacity, for example by observing that button's `style` attribute.

## Not tested

- **From an extension content script:** the spike ran in the page's own JavaScript context. A content script on the same origin should send the same cookies, but that is unverified.
- **Multiple logged-in accounts:** Notion may need an active-user header to pick the right account.
- **Pages the user can only read or comment on:** the write should fail; the error shape is unknown.
- **Center peek:** rows were tried in side peek and full page only.
- **Undo:** whether the change lands in Notion's undo history (likely not, since it bypasses the editor).
- **Button injection:** the "Add icon" location and hover behaviour are known, but nothing has been injected next to it yet. Whether Notion's re-renders remove an injected node is unknown.

## Risk

These endpoints are undocumented and can change without notice. The names in use today (`syncRecordValuesMain`, `saveTransactionsFanout`) should be kept in one small module so a breakage is a one-file fix.
