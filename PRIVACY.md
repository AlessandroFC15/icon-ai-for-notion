# Privacy policy for Notion Icon AI

Last updated: 8 October 2026

Notion Icon AI is a Chrome extension that suggests an emoji icon for a Notion page based on the page's title.

## What the extension sends

**Page titles.** When you click "Suggest icon", the title of the page you are on is sent to our server over HTTPS. The server passes it to an AI provider, TypeSafe, which ranks emojis for the title. The title is used only to produce the suggestions. We do not store it and do not include it in analytics. Nothing is sent until you click the button, and the content of your pages is never read or sent.

**Usage events.** The extension sends anonymous events about its own feature: that the button was shown, clicked, that suggestions were shown, picked or dismissed, and that something failed, along with timings, counts and the extension version. These are tied to a random id generated when the extension is installed. They never include page titles, page ids, or anything about your Notion account or workspace. Events are stored with our analytics provider, PostHog.

**IP address.** Our server uses your IP address to limit how many requests one caller can make. It is not stored by us, not sent to analytics, and not used to work out your location.

## What is stored on your device

The random install id, and the date a usage event was last sent. Removing the extension deletes both.

## What we do not do

We do not sell your data. We do not use or transfer it for anything other than providing and improving the icon suggestions. We do not use it for advertising, or to determine creditworthiness or for lending.

## Third parties

TypeSafe receives page titles to rank emojis. PostHog receives the usage events. Cloudflare hosts the server.

## Contact

Open an issue at https://github.com/AlessandroFC15/icon-ai-for-notion/issues.

Notion Icon AI is not made by, affiliated with, or endorsed by Notion Labs, Inc.
