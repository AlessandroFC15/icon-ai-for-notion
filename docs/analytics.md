# Usage analytics

Events go from the extension to the backend, and the backend forwards them to PostHog. The extension never talks to PostHog, so no analytics key ships in it.

## What is and is not collected

- **Identity:** a random id generated on first run and stored in the extension (`installId`). It is tied to nothing in Notion or the browser.
- **Never sent to analytics:** page titles, page ids, and anything about the Notion user or workspace. The backend receives the title to make suggestions and does not log it.
- **Location:** events reach PostHog from Cloudflare, so IP-based location is switched off (`$geoip_disable`).
- **Profiles:** installs are counted, not profiled (`$process_person_profile: false`).

The Chrome Web Store listing has to disclose this collection.

## Events from the extension

Every event also carries `extension_version`. `view` is `page` or `peek`.

| Event | When | Properties |
|---|---|---|
| `button_shown` | "Suggest icon" is injected, at most once a day per install | none |
| `suggest_clicked` | the button is clicked | `view` |
| `suggestions_shown` | the popover opens with options | `view`, `count`, `latency_ms`, `cached` |
| `suggestion_failed` | no options could be shown | `view`, `reason`, `latency_ms` |
| `icon_picked` | an option is clicked | `view`, `rank`, `more_clicks` |
| `suggestions_dismissed` | options were shown and the popover closed without a pick | `view`, `more_clicks` |
| `icon_apply_failed` | driving Notion's picker timed out | `view`, `reason` |

`reason` on `suggestion_failed` is `backend_error`, `empty`, or `no_response`. `rank` is the position of the picked emoji in the ranked list, starting at 1.

## Events from the backend

| Event | When | Properties |
|---|---|---|
| `suggestions_served` | Jev answered | `latency_ms`, `count`, `top_probability`, `input_tokens` |
| `jev_request_failed` | the Jev call failed | `latency_ms` |

Backend events are only recorded for requests that carry a valid install id.

## Answering the main questions

| Question | How |
|---|---|
| How many people tried it? | unique installs with `suggest_clicked` |
| How many times did they pick a suggestion? | count of `icon_picked` |
| How often did we fail to suggest? | count of `suggestion_failed`, by `reason` |
| Are the suggestions good? | `icon_picked` by `rank`, and `suggestions_dismissed` against `suggestions_shown` |
| Did Notion change under us? | any `icon_apply_failed`, or installs with no `button_shown` |
| What does it cost? | sum of `input_tokens` on `suggestions_served` |

## Configuration

The backend reads two settings. With no key set it sends nothing, which is the case in local development.

- `POSTHOG_API_KEY`: the PostHog project key (`phc_...`).
- `POSTHOG_HOST`: optional, defaults to `https://us.i.posthog.com`.

The `/event` endpoint only accepts the event names and properties listed above and drops everything else.
