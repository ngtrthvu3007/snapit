import { TEXT, TOOL_WIDTH } from "./constants";
import { CLASS, createElement } from "./dom";
import type { Point } from "./geometry";
import { KEY } from "./keyboard";

/** Ô nhập chữ nổi trên canvas trong lúc gõ chú thích. */
export class TextInput {
  private readonly element = createElement("textarea", { className: CLASS.textInput });

  constructor(
    readonly position: Point,
    color: string,
    onCommit: () => void,
    onCancel: () => void,
  ) {
    const element = this.element;

    element.wrap = "off"; // chỉ Shift+Enter mới xuống dòng, giống chữ sau khi chốt
    element.rows = 1;

    Object.assign(element.style, {
      left: `${position.x}px`,
      top: `${position.y}px`,
      color,
      fontSize: `${TOOL_WIDTH.text}px`,
      fontFamily: TEXT.fontFamily,
      lineHeight: String(TEXT.lineHeight),
    });

    element.addEventListener("keydown", (event) => {
      // Esc / phím tắt khi đang gõ chỉ tác động lên ô chữ
      event.stopPropagation();

      if (event.key === KEY.escape) {
        onCancel();
      } else if (event.key === KEY.enter && !event.shiftKey) {
        event.preventDefault();
        onCommit();
      }
    });

    element.addEventListener("input", () => this.fitContent());

    document.body.append(element);

    // focus sau khi sự kiện chuột kết thúc, nếu không canvas giành lại focus
    requestAnimationFrame(() => element.focus());
  }

  get value(): string {
    return this.element.value;
  }

  remove() {
    this.element.remove();
  }

  /** Co giãn theo nội dung (không xuống dòng tự động, không thanh cuộn). */
  private fitContent() {
    const style = this.element.style;

    style.width = style.height = "auto";
    style.width = `${this.element.scrollWidth}px`;
    style.height = `${this.element.scrollHeight}px`;
  }
}
