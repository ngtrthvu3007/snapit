// Chạy editor của overlay trong trình duyệt thường trên một ảnh chụp giả 2×, không cần Tauri.
// Mở http://localhost:1420/dev/preview.html khi `npm run dev` đang chạy.
// Thêm ?image=<đường dẫn ảnh> để dùng một ảnh thật làm "màn hình" (phủ kín, cắt giữa).
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

/** Canvas cỡ cửa sổ ở độ phân giải giả lập Retina. */
function screenCanvas() {
  const ratio = FAKE_SCREEN.pixelRatio;
  const canvas = document.createElement("canvas");
  canvas.width = innerWidth * ratio;
  canvas.height = innerHeight * ratio;
  return { canvas, context: canvas.getContext("2d")!, ratio };
}

/** Ảnh thật phủ kín màn hình giả, cắt phần thừa ở giữa (giống object-fit: cover). */
async function screenFromImage(source: string): Promise<string> {
  const picture = new Image();
  picture.src = source;
  await picture.decode();

  const { canvas, context } = screenCanvas();
  const cover = Math.max(
    canvas.width / picture.naturalWidth,
    canvas.height / picture.naturalHeight,
  );
  const width = picture.naturalWidth * cover;
  const height = picture.naturalHeight * cover;
  context.drawImage(
    picture,
    (canvas.width - width) / 2,
    (canvas.height - height) / 2,
    width,
    height,
  );

  return canvas.toDataURL();
}

function fakeScreenshot(): string {
  const { canvas, context, ratio } = screenCanvas();
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

const imageParameter = new URLSearchParams(location.search).get("image");

const image = new Image();
image.src = imageParameter ? await screenFromImage(imageParameter) : fakeScreenshot();
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
