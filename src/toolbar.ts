import { PALETTE, TOOLBAR_GAP, TOOLS } from "./constants";
import type { Editor } from "./editor";
import { clamp, type Rect } from "./geometry";

type Size = { w: number; h: number };
export type ToolbarActions = { copy: () => void; save: () => void; close: () => void };

const MOD_KEY_LABEL = navigator.platform.startsWith("Mac") ? "⌘" : "Ctrl+";

/** Below the selection, right-aligned; above it if no room; inside its bottom if neither fits. */
export function toolbarPosition(sel: Rect, bar: Size, view: Size): { left: number; top: number } {
  let top = sel.y + sel.h + TOOLBAR_GAP;
  if (top + bar.h > view.h) top = sel.y - bar.h - TOOLBAR_GAP;
  if (top < 0) top = sel.y + sel.h - bar.h - TOOLBAR_GAP;
  const left = clamp(sel.x + sel.w - bar.w, 0, view.w - bar.w);
  return { left, top };
}

export function mountToolbar(editor: Editor, actions: ToolbarActions) {
  const bar = document.createElement("div");
  bar.id = "toolbar";

  const toolButtons = TOOLS.map(({ tool, icon, name }) => {
    const b = button(bar, icon, name, () => {
      editor.tool = editor.tool === tool ? null : tool;
      sync();
    });
    b.dataset.tool = tool;
    return b;
  });
  separator(bar);

  const swatches = PALETTE.map((color) => {
    const b = button(bar, "", color, () => setColor(color));
    b.className = "swatch";
    b.style.background = color;
    return b;
  });
  const custom = document.createElement("input");
  custom.type = "color";
  custom.value = editor.color;
  custom.title = "Custom color";
  custom.setAttribute("aria-label", custom.title);
  custom.addEventListener("input", () => setColor(custom.value));
  bar.append(custom);
  separator(bar);

  button(bar, "↶", `Undo (${MOD_KEY_LABEL}Z)`, () => editor.undo());
  button(bar, "⧉", `Copy (${MOD_KEY_LABEL}C)`, actions.copy);
  button(bar, "⤓", `Save (${MOD_KEY_LABEL}S)`, actions.save);
  button(bar, "✕", "Close (Esc)", actions.close);
  document.body.append(bar);

  function setColor(color: string) {
    editor.color = color;
    custom.value = color;
    sync();
  }

  function sync() {
    for (const b of toolButtons) b.classList.toggle("active", b.dataset.tool === editor.tool);
    for (const b of swatches) b.classList.toggle("active", b.title === editor.color);
  }

  function place() {
    const sel = editor.selection;
    bar.hidden = !sel || editor.adjusting;
    if (!sel || bar.hidden) return;
    const { left, top } = toolbarPosition(sel, { w: bar.offsetWidth, h: bar.offsetHeight }, { w: innerWidth, h: innerHeight });
    bar.style.transform = `translate(${left}px, ${top}px)`;
  }

  const previous = editor.onChange;
  editor.onChange = () => {
    previous();
    place();
  };
  sync();
  place();
}

function button(parent: HTMLElement, label: string, title: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement("button");
  b.textContent = label;
  b.title = title;
  b.setAttribute("aria-label", title);
  b.addEventListener("click", onClick);
  parent.append(b);
  return b;
}

function separator(parent: HTMLElement) {
  const s = document.createElement("span");
  s.className = "sep";
  parent.append(s);
}
