// Chạy editor của overlay trong trình duyệt thường trên một ảnh chụp giả 2×, không cần Tauri.
// Mở http://localhost:1420/dev/preview.html khi `npm run dev` đang chạy.
import { SHORTCUT_CODES } from "../src/constants";
import { Editor } from "../src/editor";
import { hasCommandKey } from "../src/keyboard";
import { mountToolbar } from "../src/toolbar";

const FAKE_SCREEN = {
  /** Giả lập màn hình Retina. */
  pixelRatio: 2,
  gradient: ["#4a90d9", "#d94a8c"],
  label: "Fake desktop",
  labelColor: "#fff",
  labelFontSize: 48,
  labelPosition: { x: 80, y: 120 },
} as const;

function fakeScreenshot(): string {
  const ratio = FAKE_SCREEN.pixelRatio;
  const canvas = document.createElement("canvas");
  canvas.width = innerWidth * ratio;
  canvas.height = innerHeight * ratio;
  const context = canvas.getContext("2d")!;
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  FAKE_SCREEN.gradient.forEach((color, index) => gradient.addColorStop(index, color));
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = FAKE_SCREEN.labelColor;
  context.font = `${FAKE_SCREEN.labelFontSize * ratio}px sans-serif`;
  context.fillText(
    FAKE_SCREEN.label,
    FAKE_SCREEN.labelPosition.x * ratio,
    FAKE_SCREEN.labelPosition.y * ratio,
  );
  return canvas.toDataURL();
}

const image = new Image();
image.src = fakeScreenshot();
await image.decode();
const canvas = document.createElement("canvas");
document.body.append(canvas);
const editor = new Editor(canvas, image);
(window as unknown as { editor: Editor }).editor = editor;

const log = (action: string) => () => console.log(action);
mountToolbar(editor, { copy: log("copy"), save: log("save"), close: log("close") });
addEventListener("keydown", (event) => {
  if (hasCommandKey(event) && event.code === SHORTCUT_CODES.undo) editor.undo();
});
