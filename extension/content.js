const HIDDEN_CLASS = "icon-ai-hidden";
const LOADING_CLASS = "icon-ai-loading";

// Three stars drawn as separate paths so each can twinkle on its own while loading.
const SPARK_SVG = `<svg viewBox="-10 -10 20 20" aria-hidden="true">
  <path d="M-2,-6 C-1,-0.5 -0.5,0 5,1.5 C-0.5,3 -1,3.5 -2,9 C-3,3.5 -3.5,3 -9,1.5 C-3.5,0 -3,-0.5 -2,-6Z"/>
  <path d="M6,-9.5 C6.4,-7 6.6,-6.8 9.5,-6 C6.6,-5.2 6.4,-5 6,-2.5 C5.6,-5 5.4,-5.2 2.5,-6 C5.4,-6.8 5.6,-7 6,-9.5Z"/>
  <path d="M6.5,4 C6.8,5.8 7,6 9,6.5 C7,7 6.8,7.2 6.5,9 C6.2,7.2 6,7 4,6.5 C6,6 6.2,5.8 6.5,4Z"/>
</svg>`;

const styleObservers = new WeakMap();
const suggestionCache = new Map(); // "page id:title" -> ranked emojis
const iconPreviews = new Set();

async function loadSuggestions(page) {
  const key = `${page.id}:${page.title}`;
  if (!suggestionCache.has(key)) {
    const response = await chrome.runtime.sendMessage({ type: "suggest", title: page.title });
    if (!response?.ok) throw new Error(response?.error ?? "no response");
    suggestionCache.set(key, response.suggestions.map((suggestion) => suggestion.emoji));
  }
  return suggestionCache.get(key);
}

// Notion fades the controls row in and out by writing inline styles from JavaScript,
// so the injected button copies them from "Add icon" to appear and disappear with it.
function mirrorVisibility(addIcon, button) {
  const copy = () => {
    const open = openPopover?.anchor === button;
    button.style.opacity = open ? "1" : addIcon.style.opacity;
    button.style.pointerEvents = open ? "auto" : addIcon.style.pointerEvents;
    button.style.transition = addIcon.style.transition;
  };
  const observer = new MutationObserver(copy);
  observer.observe(addIcon, { attributes: true, attributeFilter: ["style"] });
  styleObservers.set(button, { observer, copy });
  copy();
}

// Notion only shows the new icon after its write syncs back, so the chosen emoji is drawn
// in place right away and swapped for Notion's own once that arrives.
function applyIcon(button, page, emoji) {
  const controls = button.parentElement;
  const preview = showIconPreview(controls, emoji);
  const hidden = preview ? [findAddIconButton(controls), button].filter(Boolean) : [];
  for (const element of hidden) element.classList.add(HIDDEN_CLASS);
  if (preview) iconPreviews.add(preview);

  setPageIcon(page.id, emoji).catch(() => {
    preview?.remove();
    iconPreviews.delete(preview);
    for (const element of hidden) element.classList.remove(HIDDEN_CLASS);
    if (button.isConnected) openSuggestions(button, page, "Couldn't set the icon.");
  });
}

function openSuggestions(button, page, error) {
  showPopover(button, {
    error,
    load: () => loadSuggestions(page),
    onPick: (emoji) => applyIcon(button, page, emoji),
    onLoading: (loading) => {
      button.style.setProperty("--icon-ai-shine", isDarkTheme() ? "#fff" : "#000");
      button.classList.toggle(LOADING_CLASS, loading);
    },
    onClose: () => styleObservers.get(button)?.copy(),
  });
  styleObservers.get(button)?.copy();
}

function createButton(addIcon) {
  // A clone picks up Notion's own button styling, including its generated class names.
  const button = addIcon.cloneNode(false);
  button.classList.add(SUGGEST_CLASS);
  const spark = document.createElement("span");
  spark.className = "icon-ai-spark";
  spark.innerHTML = SPARK_SVG;
  const label = document.createElement("span");
  label.className = "icon-ai-label";
  label.textContent = "Suggest icon";
  button.append(spark, label);

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    if (openPopover?.anchor === button) return closePopover();
    const page = findPage(button);
    if (page?.title) openSuggestions(button, page);
  });
  return button;
}

function removeButton(button) {
  if (openPopover?.anchor === button) closePopover();
  styleObservers.get(button)?.observer.disconnect();
  button.remove();
}

function sync() {
  for (const controls of findPageControls()) {
    const addIcon = findAddIconButton(controls);
    const existing = controls.querySelector(`.${SUGGEST_CLASS}`);
    // Notion removes "Add icon" once a page has an icon; the suggest button follows it.
    if (!addIcon) {
      if (existing) removeButton(existing);
    } else if (!existing) {
      const button = createButton(addIcon);
      addIcon.after(button);
      mirrorVisibility(addIcon, button);
    }
  }
  if (openPopover && !openPopover.anchor.isConnected) closePopover();
}

// Runs synchronously on every batch of DOM changes, before the browser paints, so a preview and
// Notion's real icon are never painted together. It is not deferred to an animation frame
// because those do not fire in background tabs.
new MutationObserver(() => {
  for (const preview of iconPreviews) {
    if (!preview.isReplaced()) continue;
    preview.remove();
    iconPreviews.delete(preview);
  }
  sync();
}).observe(document.documentElement, { childList: true, subtree: true });
sync();
