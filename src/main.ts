import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Editor } from "./editor";
import { mountToolbar } from "./toolbar";

const win = getCurrentWindow();
const monitor = win.label.split("-")[1];

const img = new Image();
img.crossOrigin = "anonymous"; // keep the export canvas untainted
img.src = `shot://localhost/${monitor}`;
await img.decode();
const canvas = document.createElement("canvas");
document.body.append(canvas);
const editor = new Editor(canvas, img);
const close = () => invoke("close_overlays");
mountToolbar(editor, () => {}, () => {}, close);
await win.show();
await win.setFocus();

addEventListener("keydown", (e) => {
  const cmd = e.metaKey || e.ctrlKey;
  if (e.key === "Escape") close();
  else if (cmd && e.key.toLowerCase() === "z") editor.undo();
});
