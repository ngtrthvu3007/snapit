/** Converts key presses to the accelerator strings Tauri's global-shortcut plugin parses ("Command+Shift+Digit2"). */

type KeyPress = Pick<KeyboardEvent, "code" | "metaKey" | "ctrlKey" | "altKey" | "shiftKey">;

const MODIFIER_CODE = /^(Shift|Control|Alt|Meta|OS)(Left|Right)?$/;
/** Keys that may be a shortcut on their own; everything else needs a modifier. */
const STANDALONE_KEY = /^(F\d{1,2}|PrintScreen|Pause|ScrollLock|Insert)$/;
/** KeyboardEvent.code prefixes dropped for display: "KeyS" → "S", "Digit2" → "2". */
const DISPLAY_PREFIX = /\b(Key|Digit)(?=\w)/g;
const SEPARATOR = "+";
const DISPLAY_SEPARATOR = " + ";

const MODIFIER_NAMES = {
  mac: { meta: "Command", ctrl: "Control", alt: "Option", shift: "Shift" },
  other: { meta: "Super", ctrl: "Control", alt: "Alt", shift: "Shift" },
} as const;

/** null while only modifiers are held, or for a key that would hijack normal typing. */
export function toAccelerator(e: KeyPress, isMac: boolean): string | null {
  if (MODIFIER_CODE.test(e.code)) return null;
  const names = isMac ? MODIFIER_NAMES.mac : MODIFIER_NAMES.other;
  const mods = [
    e.metaKey && names.meta,
    e.ctrlKey && names.ctrl,
    e.altKey && names.alt,
    e.shiftKey && names.shift,
  ].filter((m): m is (typeof names)[keyof typeof names] => Boolean(m));
  if (mods.length === 0 && !STANDALONE_KEY.test(e.code)) return null;
  return [...mods, e.code].join(SEPARATOR);
}

export function displayAccelerator(accelerator: string): string {
  return accelerator.replace(DISPLAY_PREFIX, "").split(SEPARATOR).join(DISPLAY_SEPARATOR);
}
