import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

const win = getCurrentWindow();
const monitor = win.label.split("-")[1];

const img = new Image();
img.crossOrigin = "anonymous"; // keep the export canvas untainted
img.src = `shot://localhost/${monitor}`;
await img.decode();
document.body.append(img);
await win.show();
await win.setFocus();

addEventListener("keydown", (e) => {
  if (e.key === "Escape") invoke("close_overlays");
});
