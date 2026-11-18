import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Editor } from "./editor";
import { composeExport } from "./export";
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
/** Rust closes the overlays itself (copy: on success; save: before the dialog). Errors are shown by Rust. */
async function output(cmd: "copy_png" | "save_png") {
  if (!editor.selection) return;
  editor.commitText();
  const png = await composeExport(img, editor.selection, editor.shapes.items, editor.scale);
  await invoke(cmd, png).catch(console.error);
}

mountToolbar(editor, () => output("copy_png"), () => output("save_png"), close);
await win.show();
await win.setFocus();

addEventListener("keydown", (e) => {
  const cmd = e.metaKey || e.ctrlKey;
  const key = e.key.toLowerCase();
  if (e.key === "Escape") close();
  else if (cmd && key === "z") editor.undo();
  else if (cmd && key === "c") output("copy_png");
  else if (cmd && key === "s") output("save_png");
  else return;
  e.preventDefault();
});
