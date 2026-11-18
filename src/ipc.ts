import { invoke } from "@tauri-apps/api/core";

/** Rust commands (src-tauri/src/lib.rs `generate_handler!`). */
const COMMAND = { closeOverlays: "close_overlays", copyPng: "copy_png", savePng: "save_png" } as const;

/** URL of a monitor's frozen screenshot, served by Rust's `shot://` scheme. */
export const shotUrl = (monitor: string) => `shot://localhost/${monitor}`;

/** Overlay windows are labelled `overlay-<capture>-<monitor index>`. */
export const monitorFromLabel = (label: string) => label.slice(label.lastIndexOf("-") + 1);

export const closeOverlays = () => invoke<void>(COMMAND.closeOverlays);
/** Rust closes the overlays once the image is on the clipboard. PNG goes as a raw body. */
export const copyPng = (png: Uint8Array) => invoke<void>(COMMAND.copyPng, png);
/** Rust hides the overlays, asks where to save, and closes them on success. Resolves false on cancel. */
export const savePng = (png: Uint8Array) => invoke<boolean>(COMMAND.savePng, png);
