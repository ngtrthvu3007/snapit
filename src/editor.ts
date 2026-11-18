import { applyDrag, type Handle, hitHandle, isValidSelection, normalizeRect, type Rect } from "./geometry";

const CURSORS: Record<Handle, string> = {
  n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize",
  ne: "nesw-resize", sw: "nesw-resize", nw: "nwse-resize", se: "nwse-resize", move: "move",
};

type Drag = { handle: Handle | "new"; x0: number; y0: number; orig: Rect | null };

export class Editor {
  selection: Rect | null = null;
  /** physical image pixels per CSS pixel */
  readonly scale: number;
  onChange: () => void = () => {};
  protected readonly ctx: CanvasRenderingContext2D;
  protected drag: Drag | null = null;

  constructor(protected canvas: HTMLCanvasElement, protected img: HTMLImageElement) {
    const dpr = devicePixelRatio;
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.scale(dpr, dpr);
    this.scale = img.naturalWidth / innerWidth;
    canvas.addEventListener("pointerdown", (e) => this.down(e));
    canvas.addEventListener("pointermove", (e) => this.move(e));
    canvas.addEventListener("pointerup", () => this.up());
    this.render();
  }

  get bounds(): Rect {
    return { x: 0, y: 0, w: innerWidth, h: innerHeight };
  }

  /** Overridden once annotations exist: then clicks outside must not discard the selection. */
  protected canStartNewSelection(): boolean {
    return true;
  }

  protected down(e: PointerEvent) {
    const handle = this.selection && hitHandle(this.selection, e.clientX, e.clientY);
    if (handle) this.drag = { handle, x0: e.clientX, y0: e.clientY, orig: this.selection };
    else if (this.canStartNewSelection()) this.drag = { handle: "new", x0: e.clientX, y0: e.clientY, orig: null };
    else return;
    this.canvas.setPointerCapture(e.pointerId);
  }

  protected move(e: PointerEvent) {
    const d = this.drag;
    if (!d) {
      const h = this.selection && hitHandle(this.selection, e.clientX, e.clientY);
      this.canvas.style.cursor = h ? CURSORS[h] : "crosshair";
      return;
    }
    const b = this.bounds;
    const cx = Math.min(Math.max(e.clientX, b.x), b.w);
    const cy = Math.min(Math.max(e.clientY, b.y), b.h);
    this.selection =
      d.handle === "new" ? normalizeRect(d.x0, d.y0, cx, cy) : applyDrag(d.orig!, d.handle, cx - d.x0, cy - d.y0, b);
    this.render();
  }

  protected up() {
    if (!this.drag) return;
    this.drag = null;
    if (this.selection && !isValidSelection(this.selection)) this.selection = null;
    this.render();
    this.onChange();
  }

  render() {
    const { ctx, img } = this;
    const { w: W, h: H } = this.bounds;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(img, 0, 0, W, H);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, W, H);
    const s = this.selection;
    if (!s) return;
    const k = this.scale;
    ctx.drawImage(img, s.x * k, s.y * k, s.w * k, s.h * k, s.x, s.y, s.w, s.h);
    this.renderInsideSelection(s);
    this.renderFrame(s);
  }

  protected renderInsideSelection(_s: Rect) {}

  private renderFrame(s: Rect) {
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = "#fff";
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1);
    ctx.setLineDash([]);
    ctx.fillStyle = "#fff";
    for (const [hx, hy] of [[0, 0], [0.5, 0], [1, 0], [0, 0.5], [1, 0.5], [0, 1], [0.5, 1], [1, 1]]) {
      ctx.fillRect(s.x + s.w * hx - 3, s.y + s.h * hy - 3, 6, 6);
    }
    const label = `${Math.round(s.w * this.scale)} × ${Math.round(s.h * this.scale)}`;
    ctx.font = "12px system-ui, sans-serif";
    const tw = ctx.measureText(label).width + 10;
    const ly = s.y >= 22 ? s.y - 22 : s.y + 4;
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(s.x, ly, tw, 18);
    ctx.fillStyle = "#fff";
    ctx.fillText(label, s.x + 5, ly + 13);
    ctx.restore();
  }
}
