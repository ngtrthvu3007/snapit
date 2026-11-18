// Browser-only harness: runs the overlay editor on a fake 2× screenshot, no Tauri needed.
// Open http://localhost:1420/dev/preview.html while `npm run dev` runs.
import { Editor } from "../src/editor";

const k = 2;
const fake = document.createElement("canvas");
fake.width = innerWidth * k;
fake.height = innerHeight * k;
const c = fake.getContext("2d")!;
const g = c.createLinearGradient(0, 0, fake.width, fake.height);
g.addColorStop(0, "#4a90d9");
g.addColorStop(1, "#d94a8c");
c.fillStyle = g;
c.fillRect(0, 0, fake.width, fake.height);
c.fillStyle = "#fff";
c.font = `${48 * k}px sans-serif`;
c.fillText("Fake desktop", 80 * k, 120 * k);

const img = new Image();
img.src = fake.toDataURL();
await img.decode();
const canvas = document.createElement("canvas");
document.body.append(canvas);
(window as any).editor = new Editor(canvas, img);
