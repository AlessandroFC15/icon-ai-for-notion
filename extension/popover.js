const PAGE_SIZE = 3;

let openPopover = null;

function closePopover() {
  openPopover?.close();
}

// Shows suggestions under `anchor`. `load` resolves to a ranked emoji list and `onPick` receives
// the chosen one. `onClose` is told whether options were shown and whether one was picked. Nothing is drawn while loading: `onLoading` lets the anchor show progress, and
// the popover appears once there is something to show.
function showPopover(anchor, { load, onPick, onLoading, onClose }) {
  closePopover();

  const root = document.createElement("div");
  let emojis = [];
  let page = 0;
  let moreClicks = 0;
  let picked = false;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function show(...children) {
    root.replaceChildren(...children);
    if (root.isConnected) return;
    root.className = `icon-ai-popover ${isDarkTheme() ? "icon-ai-dark" : "icon-ai-light"}`;
    const rect = anchor.getBoundingClientRect();
    root.style.top = `${rect.bottom + 6}px`;
    root.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 220))}px`;
    document.body.append(root);
  }

  function renderMessage(text) {
    const retry = el("button", "icon-ai-link", t("tryAgain"));
    retry.addEventListener("click", fetchOptions);
    show(el("div", "icon-ai-message", text), retry);
  }

  function renderOptions() {
    const row = el("div", "icon-ai-row");
    for (const emoji of emojis.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)) {
      const option = el("button", "icon-ai-option", emoji);
      option.addEventListener("click", () => {
        picked = true;
        close();
        onPick(emoji, { rank: emojis.indexOf(emoji) + 1, moreClicks });
      });
      row.append(option);
    }
    const children = [row];
    if (emojis.length > PAGE_SIZE) {
      const more = el("button", "icon-ai-link icon-ai-more", `${t("more")} ↻`);
      more.addEventListener("click", () => {
        moreClicks++;
        page = (page + 1) % Math.ceil(emojis.length / PAGE_SIZE);
        renderOptions();
      });
      children.push(more);
    }
    show(...children);
  }

  async function fetchOptions() {
    root.remove();
    onLoading?.(true);
    let failed = false;
    try {
      emojis = await load();
      failed = emojis.length === 0;
    } catch {
      failed = true;
    }
    if (openPopover !== handle) return; // closed while loading
    onLoading?.(false);
    page = 0;
    if (failed) renderMessage(t("noSuggestions"));
    else renderOptions();
  }

  function onKeydown(event) {
    if (event.key !== "Escape") return;
    event.stopPropagation();
    close();
  }
  function onPointerdown(event) {
    if (!root.contains(event.target) && !anchor.contains(event.target)) close();
  }
  function close() {
    if (openPopover !== handle) return;
    openPopover = null;
    root.remove();
    document.removeEventListener("keydown", onKeydown, true);
    document.removeEventListener("pointerdown", onPointerdown, true);
    window.removeEventListener("resize", close);
    onLoading?.(false);
    onClose?.({ picked, shown: emojis.length > 0, moreClicks });
  }

  const handle = { anchor, close };
  openPopover = handle;
  document.addEventListener("keydown", onKeydown, true);
  document.addEventListener("pointerdown", onPointerdown, true);
  window.addEventListener("resize", close);
  fetchOptions();
}
