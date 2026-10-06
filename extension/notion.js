// Everything that depends on Notion's undocumented DOM lives in this file, so a Notion change
// is a one-file fix. See docs/spike-2-notion-write.md.

// Notion translates its labels, so controls are found by structure and never by their text.
const ADD_ICON_GLYPH_SELECTOR = "svg.emojiFaceFill";
const SUGGEST_CLASS = "icon-ai-suggest";
const DRIVING_CLASS = "icon-ai-driving";
const STEP_TIMEOUT_MS = 4000;

function findPageControls() {
  return [...document.querySelectorAll(".notion-page-controls")];
}

function findAddIconButton(controls) {
  return [...controls.querySelectorAll('[role="button"]')].find(
    (button) => !button.classList.contains(SUGGEST_CLASS) && button.querySelector(ADD_ICON_GLYPH_SELECTOR),
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

// The language Notion's interface is in, such as "en", "pt" or "es". It can differ from the
// browser's language.
function notionLanguage() {
  return document.documentElement.lang.split("-")[0].toLowerCase();
}

function isDarkTheme() {
  return document.querySelector(".notion-dark-theme") !== null;
}

// Emoji text without variation selectors or skin tone modifiers, so the same emoji compares
// equal however Notion renders it (the picker applies the user's preferred skin tone).
function emojiKey(text) {
  return text.replace(/[\uFE0F\u{1F3FB}-\u{1F3FF}]/gu, "").trim();
}

// Resolves with the first truthy result of `find`, re-checked on every DOM change. Driven by a
// MutationObserver because timers are throttled in background tabs.
function waitFor(find, timeoutMs = STEP_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const found = find();
    if (found) return resolve(found);
    const observer = new MutationObserver(() => {
      const found = find();
      if (!found) return;
      stop();
      resolve(found);
    });
    const timer = setTimeout(() => {
      stop();
      reject(new Error("timed out waiting for Notion"));
    }, timeoutMs);
    const stop = () => {
      observer.disconnect();
      clearTimeout(timer);
    };
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true });
  });
}

// The icon picker is the one dialog holding both a filter input and a grid of emoji cells.
function findPicker() {
  return [...document.querySelectorAll('[role="dialog"]')].find(
    (dialog) => dialog.querySelector("input") && dialog.querySelector('[role="gridcell"]'),
  );
}

// The emoji Notion currently shows as a page icon inside `scope`, or null.
function findPageIconEmoji(scope) {
  const icon = scope.querySelector(".notion-record-icon");
  return icon ? emojiKey(icon.textContent || icon.querySelector("img")?.alt || "") : null;
}

// Sets the page icon the way a person would: "Add icon", then the emoji in Notion's picker.
// Notion updates its own state, so the icon is real and clickable at once. The picker is kept
// invisible while it is driven. If a step fails the picker is left open and becomes visible,
// so the choice can be finished by hand.
async function pickPageIcon(addIcon, emoji) {
  const root = document.documentElement;
  root.classList.add(DRIVING_CLASS);
  try {
    addIcon.click(); // Notion sets a random icon and opens the picker
    const filter = await waitFor(() => findPicker()?.querySelector("input"));
    // The filter matches on the emoji character itself. React only notices a value written
    // through the native setter followed by an input event.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(filter, emoji);
    filter.dispatchEvent(new Event("input", { bubbles: true }));
    const cell = await waitFor(() =>
      [...(findPicker()?.querySelectorAll('[role="gridcell"]') ?? [])].find(
        (candidate) => emojiKey(candidate.textContent || candidate.querySelector("img")?.alt || "") === emojiKey(emoji),
      ),
    );
    (cell.firstElementChild ?? cell).click();
    // Notion does not always close the picker after a pick.
    findPicker()
      ?.querySelector("input")
      ?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", keyCode: 27, which: 27, bubbles: true, cancelable: true }));
    await waitFor(() => !findPicker());
  } finally {
    // Always lifted, or the picker would stay invisible when the user opens it later.
    root.classList.remove(DRIVING_CLASS);
  }
}

// Draws `emoji` where Notion renders the page icon and hides Notion's own icon behind it. It
// covers the random icon "Add icon" sets before the picked one lands. Notion keeps an empty
// slot for the icon: above the controls on a full page (78px), below them in a peek (36px).
// Returns null when the layout is not one of those two known shapes, such as a page with a
// cover, so nothing is ever drawn in the wrong place.
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
  slot.classList.add("icon-ai-preview-slot");
  // On a full page the controls row loses its top padding once there is an icon above it.
  const host = peek ? null : slot.parentElement;
  host?.classList.add("icon-ai-preview-host");

  return {
    slot,
    remove() {
      icon.remove();
      slot.classList.remove("icon-ai-preview-slot");
      host?.classList.remove("icon-ai-preview-host");
    },
  };
}
