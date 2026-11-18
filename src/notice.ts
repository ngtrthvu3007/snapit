import { NOTICE_DURATION_MS } from "./constants";
import { ensureElement, ID } from "./dom";

let hideTimer: ReturnType<typeof setTimeout> | undefined;

/** Báo lỗi ngay trong overlay (hộp thoại hệ thống sẽ bị overlay che mất). */
export function showNotice(message: string) {
  const notice = ensureElement("div", ID.notice);
  notice.setAttribute("role", "alert");
  notice.textContent = message;
  notice.hidden = false;
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => (notice.hidden = true), NOTICE_DURATION_MS);
}
