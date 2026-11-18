import type { Editor } from "./editor";
import type { Tool } from "./shapes";

const TOOLS: [Tool, string, string][] = [
  ["pen", "✎", "Pen"],
  ["line", "╱", "Line"],
  ["arrow", "➚", "Arrow"],
  ["rect", "▭", "Rectangle"],
  ["marker", "▮", "Marker"],
  ["text", "T", "Text"],
];
const PALETTE = ["#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#007aff", "#af52de", "#000000", "#ffffff"];
const mod = navigator.platform.startsWith("Mac") ? "⌘" : "Ctrl+";

export function mountToolbar(editor: Editor, onCopy: () => void, onSave: () => void, onClose: () => void) {
  const bar = document.createElement("div");
  bar.id = "toolbar";
  const button = (label: string, title: string, onClick: () => void) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.title = title;
    b.setAttribute("aria-label", title);
    b.addEventListener("click", onClick);
    bar.append(b);
    return b;
  };
  const sep = () => bar.append(Object.assign(document.createElement("span"), { className: "sep" }));

  const toolButtons = TOOLS.map(([tool, icon, name]) => {
    const b = button(icon, name, () => {
      editor.tool = editor.tool === tool ? null : tool;
      sync();
    });
    b.dataset.tool = tool;
    return b;
  });
  sep();
  const swatches = PALETTE.map((c) => {
    const b = button("", c, () => setColor(c));
    b.className = "swatch";
    b.style.background = c;
    return b;
  });
  const custom = document.createElement("input");
  custom.type = "color";
  custom.value = editor.color;
  custom.title = "Custom color";
  custom.setAttribute("aria-label", "Custom color");
  custom.addEventListener("input", () => setColor(custom.value));
  bar.append(custom);
  sep();
  button("↶", `Undo (${mod}Z)`, () => editor.undo());
  button("⧉", `Copy (${mod}C)`, onCopy);
  button("⤓", `Save (${mod}S)`, onSave);
  button("✕", "Close (Esc)", onClose);
  document.body.append(bar);

  function setColor(c: string) {
    editor.color = c;
    custom.value = c;
    sync();
  }

  function sync() {
    for (const b of toolButtons) b.classList.toggle("active", b.dataset.tool === editor.tool);
    for (const b of swatches) b.classList.toggle("active", b.title === editor.color);
  }

  function place() {
    const s = editor.selection;
    bar.hidden = !s || editor.adjusting;
    if (bar.hidden || !s) return;
    const { offsetWidth: bw, offsetHeight: bh } = bar;
    const gap = 8;
    let top = s.y + s.h + gap;
    if (top + bh > innerHeight) top = s.y - bh - gap; // no room below → above
    if (top < 0) top = s.y + s.h - bh - gap; // no room above either → inside, bottom
    const left = Math.min(Math.max(s.x + s.w - bw, 0), innerWidth - bw);
    bar.style.transform = `translate(${left}px, ${top}px)`;
  }

  const prev = editor.onChange;
  editor.onChange = () => {
    prev();
    place();
  };
  sync();
  place();
}
