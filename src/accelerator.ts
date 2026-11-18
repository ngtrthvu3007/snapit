// Đổi phím bấm thành chuỗi phím tắt mà plugin global-shortcut của Tauri hiểu ("Command+Shift+Digit2").
import { hasModifier, isModifierCode } from "./keyboard";

type KeyPress = Pick<
  KeyboardEvent,
  "code" | "metaKey" | "ctrlKey" | "altKey" | "shiftKey"
>;

/** Phím được dùng một mình; phím khác phải kèm phím bổ trợ. */
const STANDALONE_KEY = /^(F\d{1,2}|PrintScreen|Pause|ScrollLock|Insert)$/;

/** Tiền tố KeyboardEvent.code bỏ đi khi hiển thị: "KeyS" → "S", "Digit2" → "2". */
const DISPLAY_PREFIX = /\b(Key|Digit)(?=\w)/g;

const SEPARATOR = "+";
const DISPLAY_SEPARATOR = " + ";

const MODIFIER_NAMES = {
  mac: { meta: "Command", ctrl: "Control", alt: "Option", shift: "Shift" },
  other: { meta: "Super", ctrl: "Control", alt: "Alt", shift: "Shift" },
} as const;

/** null khi mới giữ phím bổ trợ, hoặc phím đơn sẽ chiếm mất việc gõ chữ bình thường. */
export function toAccelerator(press: KeyPress, isMac: boolean): string | null {
  if (isModifierCode(press.code)) {
    return null;
  }

  if (!hasModifier(press) && !STANDALONE_KEY.test(press.code)) {
    return null;
  }

  const names = isMac ? MODIFIER_NAMES.mac : MODIFIER_NAMES.other;
  const held: [boolean, string][] = [
    [press.metaKey, names.meta],
    [press.ctrlKey, names.ctrl],
    [press.altKey, names.alt],
    [press.shiftKey, names.shift],
  ];
  const modifiers = held.filter(([isHeld]) => isHeld).map(([, name]) => name);

  return [...modifiers, press.code].join(SEPARATOR);
}

export const displayAccelerator = (accelerator: string) =>
  accelerator.replace(DISPLAY_PREFIX, "").split(SEPARATOR).join(DISPLAY_SEPARATOR);
