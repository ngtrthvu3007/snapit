import { NOTICE_DURATION_MS } from "./constants";

let timer: ReturnType<typeof setTimeout> | undefined;

/** Error message shown inside the overlay (native dialogs would sit behind it). */
export function showNotice(message: string) {
  let el = document.getElementById("notice");
  if (!el) {
    el = document.createElement("div");
    el.id = "notice";
    el.setAttribute("role", "alert");
    document.body.append(el);
  }
  el.textContent = message;
  el.hidden = false;
  clearTimeout(timer);
  timer = setTimeout(() => (el.hidden = true), NOTICE_DURATION_MS);
}
