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

// Usage events, sent through the background worker. They never include titles or page ids.
function track(button, event, properties = {}) {
  const view = button.closest(".notion-peek-renderer") ? "peek" : "page";
  chrome.runtime.sendMessage({ type: "track", event, properties: { view, ...properties } }).catch(() => {});
}

async function loadSuggestions(button, page) {
  const key = `${page.id}:${page.title}`;
  const cached = suggestionCache.has(key);
  const started = performance.now();
  const elapsed = () => Math.round(performance.now() - started);
  if (!cached) {
    const response = await chrome.runtime.sendMessage({ type: "suggest", title: page.title }).catch(() => null);
    const emojis = response?.ok ? response.suggestions.map((suggestion) => suggestion.emoji) : [];
    if (emojis.length === 0) {
      const reason = !response ? "no_response" : !response.ok ? "backend_error" : "empty";
      track(button, "suggestion_failed", { reason, latency_ms: elapsed() });
      throw new Error(reason);
    }
    suggestionCache.set(key, emojis);
  }
  const emojis = suggestionCache.get(key);
  track(button, "suggestions_shown", { count: emojis.length, cached, latency_ms: elapsed() });
  return emojis;
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

// Notion's own picker sets the icon, driven out of sight. The chosen emoji is drawn in place
// first, covering the random icon Notion shows until the pick lands.
let applying = false;
async function applyIcon(button, emoji) {
  const controls = button.parentElement;
  const addIcon = findAddIconButton(controls);
  if (!addIcon || applying) return;
  applying = true;
  const preview = showIconPreview(controls, emoji);
  const hidden = preview ? [addIcon, button] : [];
  for (const element of hidden) element.classList.add(HIDDEN_CLASS);
  try {
    await pickPageIcon(addIcon, emoji);
    if (preview) await waitFor(() => findPageIconEmoji(preview.slot) === emojiKey(emoji));
  } catch (error) {
    console.warn("Notion Icon AI: could not finish setting the icon", error);
    track(button, "icon_apply_failed", { reason: "picker_timeout" });
  } finally {
    preview?.remove();
    for (const element of hidden) element.classList.remove(HIDDEN_CLASS);
    applying = false;
  }
}

function openSuggestions(button, page) {
  showPopover(button, {
    load: () => loadSuggestions(button, page),
    onPick: (emoji, { rank, moreClicks }) => {
      track(button, "icon_picked", { rank, more_clicks: moreClicks });
      applyIcon(button, emoji);
    },
    onLoading: (loading) => {
      button.style.setProperty("--icon-ai-shine", isDarkTheme() ? "#fff" : "#000");
      button.classList.toggle(LOADING_CLASS, loading);
    },
    onClose: ({ picked, shown, moreClicks }) => {
      if (shown && !picked && button.isConnected) track(button, "suggestions_dismissed", { more_clicks: moreClicks });
      styleObservers.get(button)?.copy();
    },
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
  label.textContent = t("suggestIcon");
  button.append(spark, label);

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    if (openPopover?.anchor === button) return closePopover();
    const page = findPage(button);
    if (!page?.title) return;
    track(button, "suggest_clicked");
    openSuggestions(button, page);
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
      track(button, "button_shown");
    }
  }
  if (openPopover && !openPopover.anchor.isConnected) closePopover();
}

// Runs on every batch of DOM changes. It is not deferred to an animation frame because those
// do not fire in background tabs.
new MutationObserver(sync).observe(document.documentElement, { childList: true, subtree: true });
sync();
