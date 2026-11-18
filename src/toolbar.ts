import { ACTION_ICON, PALETTE, TOOLBAR_GAP, TOOLS } from "./constants";
import { CLASS, createElement, ID } from "./dom";
import type { Editor } from "./editor";
import { clamp, type Rect } from "./geometry";
import { COMMAND_KEY_LABEL } from "./keyboard";

type Size = { width: number; height: number };
export type ToolbarActions = { copy: () => void; save: () => void; close: () => void };

/** Dưới vùng chọn, canh phải; hết chỗ thì lên trên; vẫn không đủ thì nằm trong đáy vùng chọn. */
export function toolbarPosition(selection: Rect, toolbar: Size, viewport: Size): { left: number; top: number } {
  let top = selection.y + selection.height + TOOLBAR_GAP;
  if (top + toolbar.height > viewport.height) top = selection.y - toolbar.height - TOOLBAR_GAP;
  if (top < 0) top = selection.y + selection.height - toolbar.height - TOOLBAR_GAP;
  const left = clamp(selection.x + selection.width - toolbar.width, 0, viewport.width - toolbar.width);
  return { left, top };
}

export function mountToolbar(editor: Editor, actions: ToolbarActions) {
  const toolbar = createElement("div", { id: ID.toolbar });
  const addButton = (icon: string, title: string, onClick: () => void) => {
    const button = createElement("button", { text: icon, title });
    button.addEventListener("click", onClick);
    toolbar.append(button);
    return button;
  };
  const addSeparator = () => toolbar.append(createElement("span", { className: CLASS.separator }));

  const toolButtons = TOOLS.map(({ tool, icon, name }) => {
    const button = addButton(icon, name, () => {
      editor.tool = editor.tool === tool ? null : tool;
      syncActive();
    });
    button.dataset.tool = tool;
    return button;
  });
  addSeparator();

  const swatches = PALETTE.map((color) => {
    const swatch = addButton("", color, () => setColor(color));
    swatch.classList.add(CLASS.swatch);
    swatch.style.background = color;
    return swatch;
  });
  const customColor = createElement("input", { title: "Custom color" });
  customColor.type = "color";
  customColor.value = editor.color;
  customColor.addEventListener("input", () => setColor(customColor.value));
  toolbar.append(customColor);
  addSeparator();

  addButton(ACTION_ICON.undo, `Undo (${COMMAND_KEY_LABEL}Z)`, () => editor.undo());
  addButton(ACTION_ICON.copy, `Copy (${COMMAND_KEY_LABEL}C)`, actions.copy);
  addButton(ACTION_ICON.save, `Save (${COMMAND_KEY_LABEL}S)`, actions.save);
  addButton(ACTION_ICON.close, "Close (Esc)", actions.close);
  document.body.append(toolbar);

  function setColor(color: string) {
    editor.color = color;
    customColor.value = color;
    syncActive();
  }

  function syncActive() {
    for (const button of toolButtons) button.classList.toggle(CLASS.active, button.dataset.tool === editor.tool);
    for (const swatch of swatches) swatch.classList.toggle(CLASS.active, swatch.title === editor.color);
  }

  function place() {
    const selection = editor.selection;
    toolbar.hidden = !selection || editor.adjusting;
    if (!selection || toolbar.hidden) return;
    const size = { width: toolbar.offsetWidth, height: toolbar.offsetHeight };
    const { left, top } = toolbarPosition(selection, size, { width: innerWidth, height: innerHeight });
    toolbar.style.transform = `translate(${left}px, ${top}px)`;
  }

  const previousOnChange = editor.onChange;
  editor.onChange = () => {
    previousOnChange();
    place();
  };
  syncActive();
  place();
}
