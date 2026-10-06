const PAGE_SIZE = 3;

let openPopover = null;

function closePopover() {
  openPopover?.close();
}

// Shows suggestions under `anchor`. `load` resolves to a ranked emoji list; `apply` sets one.
function showPopover(anchor, { load, apply, onClose }) {
  closePopover();

  const root = document.createElement("div");
  root.className = `icon-ai-popover ${isDarkTheme() ? "icon-ai-dark" : "icon-ai-light"}`;
  const rect = anchor.getBoundingClientRect();
  root.style.top = `${rect.bottom + 6}px`;
  root.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 220))}px`;
  document.body.append(root);

  let emojis = [];
  let page = 0;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function renderLoading() {
    const row = el("div", "icon-ai-row");
    for (let i = 0; i < PAGE_SIZE; i++) row.append(el("div", "icon-ai-option icon-ai-skeleton"));
    root.replaceChildren(row);
  }

  function renderMessage(text, retry) {
    const button = el("button", "icon-ai-link", "Try again");
    button.addEventListener("click", retry);
    root.replaceChildren(el("div", "icon-ai-message", text), button);
  }

  function renderOptions() {
    const row = el("div", "icon-ai-row");
    for (const emoji of emojis.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)) {
      const option = el("button", "icon-ai-option", emoji);
      option.addEventListener("click", () => choose(emoji));
      row.append(option);
    }
    root.replaceChildren(row);
    if (emojis.length > PAGE_SIZE) {
      const more = el("button", "icon-ai-link icon-ai-more", "More ↻");
      more.addEventListener("click", () => {
        page = (page + 1) % Math.ceil(emojis.length / PAGE_SIZE);
        renderOptions();
      });
      root.append(more);
    }
  }

  async function fetchOptions() {
    renderLoading();
    try {
      emojis = await load();
      if (emojis.length === 0) throw new Error("no suggestions");
      page = 0;
      if (root.isConnected) renderOptions();
    } catch {
      if (root.isConnected) renderMessage("Couldn't get suggestions.", fetchOptions);
    }
  }

  async function choose(emoji) {
    root.classList.add("icon-ai-busy");
    try {
      await apply(emoji);
      close();
    } catch {
      root.classList.remove("icon-ai-busy");
      if (root.isConnected) renderMessage("Couldn't set the icon.", renderOptions);
    }
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
    onClose?.();
  }

  const handle = { anchor, close };
  openPopover = handle;
  document.addEventListener("keydown", onKeydown, true);
  document.addEventListener("pointerdown", onPointerdown, true);
  window.addEventListener("resize", close);
  fetchOptions();
}
