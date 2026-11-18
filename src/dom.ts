// id / class dùng chung giữa TS và CSS, cùng vài helper tạo phần tử.

export const ID = {
  toolbar: "toolbar",
  notice: "notice",
  recorder: "recorder",
  status: "status",
  save: "save",
  cancel: "cancel",
  close: "close",
  recordSection: "record",
  waylandSection: "wayland",
} as const;

export const CLASS = {
  active: "active",
  swatch: "swatch",
  separator: "sep",
  textInput: "text-input",
  error: "error",
} as const;

export const byId = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

type ElementOptions = { id?: string; className?: string; text?: string; title?: string };

/** Tạo phần tử với id/class/nội dung/tooltip; tooltip cũng là aria-label. */
export function createElement<K extends keyof HTMLElementTagNameMap>(tag: K, options: ElementOptions = {}) {
  const element = document.createElement(tag);
  if (options.id) element.id = options.id;
  if (options.className) element.className = options.className;
  if (options.text) element.textContent = options.text;
  if (options.title) {
    element.title = options.title;
    element.setAttribute("aria-label", options.title);
  }
  return element;
}

/** Lấy phần tử theo id, tạo mới và gắn vào body nếu chưa có. */
export function ensureElement<K extends keyof HTMLElementTagNameMap>(tag: K, id: string): HTMLElementTagNameMap[K] {
  const existing = document.getElementById(id);
  if (existing) return existing as HTMLElementTagNameMap[K];
  const element = createElement(tag, { id });
  document.body.append(element);
  return element;
}
