import { getCurrentWindow } from "@tauri-apps/api/window";
import { SHORTCUT_CODES } from "./constants";
import { Editor } from "./editor";
import { composeExport } from "./export";
import { closeOverlays, copyPng, monitorFromLabel, savePng, shotUrl } from "./ipc";
import { mountToolbar } from "./toolbar";

const win = getCurrentWindow();

const img = new Image();
img.crossOrigin = "anonymous"; // keep the export canvas untainted
img.src = shotUrl(monitorFromLabel(win.label));
await img.decode();
const canvas = document.createElement("canvas");
document.body.append(canvas);
const editor = new Editor(canvas, img);

async function exportSelection(send: (png: Uint8Array) => Promise<unknown>) {
  if (!editor.selection) return;
  editor.commitText();
  const png = await composeExport(img, editor.selection, editor.shapes.items, editor.scale);
  await send(png).catch(console.error);
}
const copy = () => exportSelection(copyPng);
const save = () => exportSelection(savePng);

mountToolbar(editor, { copy, save, close: closeOverlays });
await win.show();
await win.setFocus();

const SHORTCUTS: Record<string, () => unknown> = {
  [SHORTCUT_CODES.copy]: copy,
  [SHORTCUT_CODES.save]: save,
  [SHORTCUT_CODES.undo]: () => editor.undo(),
};

addEventListener("keydown", (e) => {
  const action = e.key === "Escape" ? closeOverlays : (e.metaKey || e.ctrlKey) && SHORTCUTS[e.code];
  if (!action) return;
  e.preventDefault();
  action();
});
