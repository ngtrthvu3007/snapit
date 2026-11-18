// Trang overlay: một cửa sổ cho mỗi màn hình, hiện ảnh đóng băng để chọn vùng và vẽ.
import { getCurrentWindow } from "@tauri-apps/api/window";
import { SHORTCUT_CODES } from "./constants";
import { Editor } from "./editor";
import { composeExport } from "./export";
import { closeOverlays, copyPng, monitorFromLabel, savePng, shotUrl } from "./ipc";
import { hasCommandKey, KEY } from "./keyboard";
import { showNotice } from "./notice";
import { mountToolbar } from "./toolbar";

const overlayWindow = getCurrentWindow();

/** Tải ảnh đóng băng và dựng editor; cửa sổ vẫn ẩn cho tới khi xong. */
async function createEditor(): Promise<Editor> {
  const image = new Image();
  image.crossOrigin = "anonymous"; // để canvas xuất ảnh không bị "tainted"
  image.src = shotUrl(monitorFromLabel(overlayWindow.label));
  await image.decode();
  const canvas = document.createElement("canvas");
  document.body.append(canvas);
  return new Editor(canvas, image);
}

let busy = false;
/** Bỏ qua copy/save khi đang có một lệnh chạy (bấm đúp, giữ phím). */
async function exportSelection(send: (png: Uint8Array) => Promise<unknown>) {
  if (busy || !editor.selection) return;
  busy = true;
  try {
    editor.commitText();
    await send(await composeExport(editor.image, editor.selection, editor.shapes.items, editor.scale));
  } catch (error) {
    showNotice(String(error));
  } finally {
    busy = false;
  }
}
const copy = () => exportSelection(copyPng);
const save = () => exportSelection(savePng);

let editor: Editor;
try {
  editor = await createEditor();
  mountToolbar(editor, { copy, save, close: closeOverlays });
  await overlayWindow.show();
  await overlayWindow.setFocus();
} catch (error) {
  // overlay vô hình sẽ giữ lần chụp mãi mãi → bỏ cuộc để phím tắt dùng lại được
  console.error("overlay failed to start", error);
  await closeOverlays();
  throw error;
}

/** Phím tắt dùng kèm ⌘ / Ctrl. */
const COMMAND_SHORTCUTS: Record<string, () => unknown> = {
  [SHORTCUT_CODES.copy]: copy,
  [SHORTCUT_CODES.save]: save,
  [SHORTCUT_CODES.undo]: () => editor.undo(),
};

addEventListener("keydown", (event) => {
  const action = event.key === KEY.escape ? closeOverlays : hasCommandKey(event) && COMMAND_SHORTCUTS[event.code];
  if (!action) return;
  event.preventDefault();
  if (!event.repeat) action();
});
