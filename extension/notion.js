// Everything that depends on Notion's undocumented DOM and private API lives in this file,
// so a Notion change is a one-file fix. See docs/spike-2-notion-write.md.

const ADD_ICON_TEXT = "Add icon";
const SUGGEST_CLASS = "icon-ai-suggest";

function findPageControls() {
  return [...document.querySelectorAll(".notion-page-controls")];
}

function findAddIconButton(controls) {
  return [...controls.querySelectorAll('[role="button"]')].find(
    (button) => !button.classList.contains(SUGGEST_CLASS) && button.textContent.trim() === ADD_ICON_TEXT,
  );
}

// The page a controls row belongs to: the title block in the same peek, or else in the main frame.
function findPage(element) {
  const scope = element.closest(".notion-peek-renderer") ?? element.closest(".notion-frame");
  if (!scope) return null;
  // Relation chips are page blocks too, so only the block holding the title heading counts.
  for (const block of scope.querySelectorAll(".notion-page-block[data-block-id]")) {
    const heading = block.querySelector("h1");
    if (heading) return { id: block.dataset.blockId, title: heading.textContent.trim() };
  }
  return null;
}

function isDarkTheme() {
  return document.querySelector(".notion-dark-theme") !== null;
}

async function notionPost(endpoint, body) {
  const response = await fetch(`/api/v3/${endpoint}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${endpoint} ${response.status}`);
  return response.json();
}

async function setPageIcon(pageId, emoji) {
  const { recordMap } = await notionPost("syncRecordValuesMain", {
    requests: [{ pointer: { table: "block", id: pageId }, version: -1 }],
  });
  const spaceId = recordMap?.block?.[pageId]?.spaceId;
  if (!spaceId) throw new Error("page record not found");
  await notionPost("saveTransactionsFanout", {
    requestId: crypto.randomUUID(),
    transactions: [
      {
        id: crypto.randomUUID(),
        spaceId,
        debug: { userAction: "iconAI.setPageIcon" },
        operations: [
          { pointer: { table: "block", id: pageId, spaceId }, path: ["format", "page_icon"], command: "set", args: emoji },
        ],
      },
    ],
  });
}

// Draws `emoji` where Notion will render the page icon, so it appears before Notion syncs the
// write back. Notion keeps an empty slot for the icon: above the controls on a full page
// (78px), below them in a peek (36px). Returns null when the layout is not one of those two
// known shapes, such as a page with a cover, so nothing is ever drawn in the wrong place.
function showIconPreview(controls, emoji) {
  const peek = controls.closest(".notion-peek-renderer");
  const slot = peek
    ? controls.closest(".peek-top-hover-area")?.parentElement?.nextElementSibling
    : controls.parentElement?.previousElementSibling;
  const knownLayout = getComputedStyle(controls).paddingTop === (peek ? "4px" : "80px");
  if (!slot || slot.childElementCount > 0 || slot.getBoundingClientRect().height > 0 || !knownLayout) return null;

  const icon = document.createElement("div");
  icon.className = `icon-ai-preview ${peek ? "icon-ai-preview-peek" : "icon-ai-preview-page"}`;
  icon.textContent = emoji;
  slot.append(icon);
  // On a full page the controls row loses its top padding once there is an icon above it.
  const host = peek ? null : slot.parentElement;
  host?.classList.add("icon-ai-preview-host");

  return {
    // True once Notion has rendered the real icon next to the preview, or the page is gone.
    isReplaced: () => !icon.isConnected || slot.childElementCount > 1,
    remove() {
      icon.remove();
      host?.classList.remove("icon-ai-preview-host");
    },
  };
}
