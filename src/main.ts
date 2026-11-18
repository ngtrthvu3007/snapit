import { getCurrentWindow } from "@tauri-apps/api/window";
import { SHORTCUT_CODES } from "./constants";
import { Editor } from "./editor";
import { composeExport } from "./export";
import { closeOverlays, copyPng, monitorFromLabel, savePng, shotUrl } from "./ipc";
import { showNotice } from "./notice";
import { mountToolbar } from "./toolbar";

const win = getCurrentWindow();

/** Loads the frozen screenshot and sets up the editor; the window stays hidden until this succeeds. */
async function boot(): Promise<Editor> {
  const img = new Image();
  img.crossOrigin = "anonymous"; // keep the export canvas untainted
  img.src = shotUrl(monitorFromLabel(win.label));
  await img.decode();
  const canvas = document.createElement("canvas");
  document.body.append(canvas);
  return new Editor(canvas, img);
}

let busy = false;
/** Copy/save are ignored while one is already running (double click, key repeat). */
async function exportSelection(send: (png: Uint8Array) => Promise<unknown>) {
  if (busy || !editor.selection) return;
  busy = true;
  try {
    editor.commitText();
    const png = await composeExport(editor.img, editor.selection, editor.shapes.items, editor.scale);
    await send(png);
  } catch (e) {
    showNotice(String(e));
  } finally {
    busy = false;
  }
}
const copy = () => exportSelection(copyPng);
const save = () => exportSelection(savePng);

let editor: Editor;
try {
  editor = await boot();
  mountToolbar(editor, { copy, save, close: closeOverlays });
  await win.show();
  await win.setFocus();
} catch (e) {
  // an invisible overlay would hold the capture forever; give up so the next hotkey works
  console.error("overlay failed to start", e);
  await closeOverlays();
  throw e;
}

const SHORTCUTS: Record<string, () => unknown> = {
  [SHORTCUT_CODES.copy]: copy,
  [SHORTCUT_CODES.save]: save,
  [SHORTCUT_CODES.undo]: () => editor.undo(),
};

addEventListener("keydown", (e) => {
  const action = e.key === "Escape" ? closeOverlays : (e.metaKey || e.ctrlKey) && SHORTCUTS[e.code];
  if (!action) return;
  e.preventDefault();
  if (!e.repeat) action();
});
