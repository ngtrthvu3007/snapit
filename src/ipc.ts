import { invoke } from "@tauri-apps/api/core";

/** Tên các command Rust (`generate_handler!` trong src-tauri/src/lib.rs). */
const COMMAND = {
  closeOverlays: "close_overlays",
  copyPng: "copy_png",
  savePng: "save_png",
  hotkeyInfo: "hotkey_info",
  setHotkey: "set_hotkey",
} as const;

const SHOT_URL_PREFIX = "shot://localhost/";
const LABEL_SEPARATOR = "-";

/** URL ảnh đóng băng của một màn hình, do scheme `shot://` bên Rust phục vụ. */
export const shotUrl = (monitor: string) => `${SHOT_URL_PREFIX}${monitor}`;

/** Nhãn cửa sổ overlay có dạng `overlay-<lần chụp>-<số màn hình>`. */
export const monitorFromLabel = (label: string) =>
  label.slice(label.lastIndexOf(LABEL_SEPARATOR) + 1);

export const closeOverlays = () => invoke<void>(COMMAND.closeOverlays);
/** Rust đóng overlay khi ảnh đã vào clipboard. PNG gửi dạng raw body. */
export const copyPng = (png: Uint8Array) => invoke<void>(COMMAND.copyPng, png);
/** Rust ẩn overlay, hỏi nơi lưu, đóng overlay nếu lưu xong. Trả về false khi huỷ. */
export const savePng = (png: Uint8Array) => invoke<boolean>(COMMAND.savePng, png);

/** Phím chụp hiện tại; `global` = false trên Wayland (desktop giữ quyền phím tắt toàn cục). */
export type HotkeyInfo = { hotkey: string; global: boolean };
export const hotkeyInfo = () => invoke<HotkeyInfo>(COMMAND.hotkeyInfo);
/** Đăng ký và lưu phím chụp mới; reject kèm thông báo dễ hiểu nếu phím đã bị chiếm. */
export const setHotkey = (hotkey: string) => invoke<void>(COMMAND.setHotkey, { hotkey });
