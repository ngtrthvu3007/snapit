// Tiện ích bàn phím dùng chung cho overlay, ô nhập chữ và cửa sổ cài đặt.

export const IS_MAC = navigator.platform.startsWith("Mac");

/** Giá trị KeyboardEvent.key dùng trong app. */
export const KEY = { escape: "Escape", enter: "Enter", tab: "Tab" } as const;

/** KeyboardEvent.code của các phím bổ trợ (Shift, Ctrl, Alt, ⌘/Super). */
const MODIFIER_CODE = /^(Shift|Control|Alt|Meta|OS)(Left|Right)?$/;

type ModifierState = Pick<KeyboardEvent, "metaKey" | "ctrlKey" | "altKey" | "shiftKey">;

export const isModifierCode = (code: string) => MODIFIER_CODE.test(code);

/** Có giữ phím bổ trợ nào không. */
export const hasModifier = (event: ModifierState) => event.metaKey || event.ctrlKey || event.altKey || event.shiftKey;

/** Phím "lệnh" của nền tảng: ⌘ trên Mac, Ctrl ở nơi khác (chấp nhận cả hai cho tiện). */
export const hasCommandKey = (event: ModifierState) => event.metaKey || event.ctrlKey;

/** Nhãn hiển thị cho phím lệnh, ví dụ "⌘Z" / "Ctrl+Z". */
export const COMMAND_KEY_LABEL = IS_MAC ? "⌘" : "Ctrl+";
