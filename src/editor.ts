import { applyDrag, type Handle, hitHandle, isValidSelection, normalizeRect, type Rect } from "./geometry";
import { drawShape, newShapeStack, type Point, type Shape, TOOL_WIDTH, textShape, type Tool } from "./shapes";

const CURSORS: Record<Handle, string> = {
  n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize",
  ne: "nesw-resize", sw: "nesw-resize", nw: "nwse-resize", se: "nwse-resize", move: "move",
};

type Drag = { handle: Handle | "new"; x0: number; y0: number; orig: Rect | null };

export class Editor {
  selection: Rect | null = null;
  readonly shapes = newShapeStack();
  tool: Tool | null = null;
  color = "#ff3b30";
  /** physical image pixels per CSS pixel */
  readonly scale: number;
  /** called after every render */
  onChange: () => void = () => {};
  private readonly ctx: CanvasRenderingContext2D;
  private drag: Drag | null = null;
  private current: Shape | null = null;
  private textBox: { el: HTMLTextAreaElement; at: Point } | null = null;

  constructor(private canvas: HTMLCanvasElement, readonly img: HTMLImageElement) {
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

  /** true while the selection itself is being dragged (toolbar hides) */
  get adjusting(): boolean {
    return this.drag !== null;
  }

  undo() {
    this.shapes.undo();
    this.render();
  }

  commitText(text: string) {
    const tb = this.textBox;
    if (!tb) return;
    this.textBox = null;
    tb.el.remove();
    const s = textShape(text, tb.at, this.color);
    if (s) this.shapes.push(s);
    this.render();
  }

  cancelText() {
    this.textBox?.el.remove();
    this.textBox = null;
  }

  private down(e: PointerEvent) {
    if (this.textBox) return this.commitText(this.textBox.el.value);
    const pt = { x: e.clientX, y: e.clientY };
    const handle = this.selection && hitHandle(this.selection, pt.x, pt.y);
    if (this.tool && handle === "move") {
      if (this.tool === "text") return this.openText(pt);
      this.current = { tool: this.tool, color: this.color, width: TOOL_WIDTH[this.tool], points: [pt] };
    } else if (handle) {
      this.drag = { handle, x0: pt.x, y0: pt.y, orig: this.selection };
    } else if (this.shapes.items.length === 0) {
      // once something is drawn, clicking outside must not throw the work away
      this.drag = { handle: "new", x0: pt.x, y0: pt.y, orig: null };
    } else return;
    this.canvas.setPointerCapture(e.pointerId);
  }

  private move(e: PointerEvent) {
    const b = this.bounds;
    const cx = Math.min(Math.max(e.clientX, b.x), b.w);
    const cy = Math.min(Math.max(e.clientY, b.y), b.h);
    if (this.current) {
      const p = this.current.points;
      if (this.current.tool === "pen" || this.current.tool === "marker") p.push({ x: cx, y: cy });
      else p[1] = { x: cx, y: cy };
      return this.render();
    }
    const d = this.drag;
    if (!d) {
      const h = this.selection && hitHandle(this.selection, cx, cy);
      this.canvas.style.cursor = h === "move" && this.tool ? (this.tool === "text" ? "text" : "crosshair") : h ? CURSORS[h] : "crosshair";
      return;
    }
    this.selection =
      d.handle === "new" ? normalizeRect(d.x0, d.y0, cx, cy) : applyDrag(d.orig!, d.handle, cx - d.x0, cy - d.y0, b);
    this.render();
  }

  private up() {
    if (this.current) {
      if (this.current.points.length > 1) this.shapes.push(this.current);
      this.current = null;
    }
    this.drag = null;
    if (this.selection && !isValidSelection(this.selection)) this.selection = null;
    this.render();
  }

  private openText(at: Point) {
    const el = document.createElement("textarea");
    el.className = "text-input";
    Object.assign(el.style, { left: `${at.x}px`, top: `${at.y}px`, color: this.color, fontSize: `${TOOL_WIDTH.text}px` });
    el.addEventListener("keydown", (e) => {
      e.stopPropagation(); // Esc / shortcuts while typing affect only the text box
      if (e.key === "Escape") this.cancelText();
      else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.commitText(el.value);
      }
    });
    el.addEventListener("input", () => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    });
    document.body.append(el);
    this.textBox = { el, at };
    requestAnimationFrame(() => el.focus());
  }

  render() {
    const { ctx, img } = this;
    const { w: W, h: H } = this.bounds;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(img, 0, 0, W, H);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, W, H);
    const s = this.selection;
    if (s) {
      const k = this.scale;
      ctx.drawImage(img, s.x * k, s.y * k, s.w * k, s.h * k, s.x, s.y, s.w, s.h);
      ctx.save();
      ctx.beginPath();
      ctx.rect(s.x, s.y, s.w, s.h);
      ctx.clip();
      for (const sh of this.shapes.items) drawShape(ctx, sh);
      if (this.current) drawShape(ctx, this.current);
      ctx.restore();
      this.renderFrame(s);
    }
    this.onChange();
  }

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
