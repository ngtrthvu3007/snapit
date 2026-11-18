import { TEXT, TOOL_WIDTH } from "./constants";
import type { Point } from "./geometry";

/** A textarea floating over the canvas while the user types a text annotation. */
export class TextInput {
  private readonly el = document.createElement("textarea");

  constructor(
    readonly at: Point,
    color: string,
    onCommit: () => void,
    onCancel: () => void,
  ) {
    const el = this.el;
    el.className = "text-input";
    Object.assign(el.style, {
      left: `${at.x}px`,
      top: `${at.y}px`,
      color,
      fontSize: `${TOOL_WIDTH.text}px`,
      fontFamily: TEXT.fontFamily,
      lineHeight: String(TEXT.lineHeight),
    });
    el.addEventListener("keydown", (e) => {
      e.stopPropagation(); // Esc / shortcuts while typing affect only the text box
      if (e.key === "Escape") onCancel();
      else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onCommit();
      }
    });
    el.addEventListener("input", () => this.fitHeight());
    document.body.append(el);
    // focus after the pointer event finishes, or the canvas click takes focus back
    requestAnimationFrame(() => el.focus());
  }

  get value(): string {
    return this.el.value;
  }

  remove() {
    this.el.remove();
  }

  private fitHeight() {
    this.el.style.height = "auto";
    this.el.style.height = `${this.el.scrollHeight}px`;
  }
}
