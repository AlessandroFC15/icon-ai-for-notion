const styleObservers = new WeakMap();

async function loadSuggestions(title) {
  const response = await chrome.runtime.sendMessage({ type: "suggest", title });
  if (!response?.ok) throw new Error(response?.error ?? "no response");
  return response.suggestions.map((suggestion) => suggestion.emoji);
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

function createButton(addIcon) {
  // A clone picks up Notion's own button styling, including its generated class names.
  const button = addIcon.cloneNode(false);
  button.classList.add(SUGGEST_CLASS);
  const spark = document.createElement("span");
  spark.className = "icon-ai-spark";
  spark.textContent = "✨";
  button.append(spark, "Suggest icon");

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    if (openPopover?.anchor === button) return closePopover();
    const page = findPage(button);
    if (!page?.title) return;
    showPopover(button, {
      load: () => loadSuggestions(page.title),
      apply: (emoji) => setPageIcon(page.id, emoji),
      onClose: () => styleObservers.get(button)?.copy(),
    });
    styleObservers.get(button)?.copy();
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

let scheduled = false;
new MutationObserver(() => {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    sync();
  });
}).observe(document.documentElement, { childList: true, subtree: true });
sync();
