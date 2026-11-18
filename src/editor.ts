import { DEFAULT_COLOR } from "./constants";
import { applyDrag, clampPoint, type Handle, hitHandle, isValidSelection, normalizeRect, type Point, type Rect } from "./geometry";
import { renderScene } from "./renderer";
import { FREEHAND_TOOLS, newShape, newShapeStack, type Shape, textShape, type Tool } from "./shapes";
import { TextInput } from "./text-input";

const HANDLE_CURSOR: Record<Handle, string> = {
  n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize",
  ne: "nesw-resize", sw: "nesw-resize", nw: "nwse-resize", se: "nwse-resize", move: "move",
};
const DEFAULT_CURSOR = "crosshair";
const TEXT_CURSOR = "text";

/** Dragging the selection: creating a new one, or moving/resizing the existing one. */
type SelectionDrag = { handle: Handle | "new"; start: Point; orig: Rect | null };

/** Selection + annotations on top of one monitor's frozen screenshot. */
export class Editor {
  selection: Rect | null = null;
  readonly shapes = newShapeStack();
  tool: Tool | null = null;
  color = DEFAULT_COLOR;
  /** physical image pixels per CSS pixel */
  readonly scale: number;
  /** called after every render */
  onChange: () => void = () => {};

  private readonly ctx: CanvasRenderingContext2D;
  private drag: SelectionDrag | null = null;
  private drawing: Shape | null = null;
  private textInput: TextInput | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    readonly img: HTMLImageElement,
  ) {
    const dpr = devicePixelRatio;
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.scale(dpr, dpr);
    this.scale = img.naturalWidth / innerWidth;
    canvas.addEventListener("pointerdown", (e) => this.onPointerDown(e));
    canvas.addEventListener("pointermove", (e) => this.onPointerMove(e));
    canvas.addEventListener("pointerup", () => this.onPointerUp());
    this.render();
  }

  get bounds(): Rect {
    return { x: 0, y: 0, w: innerWidth, h: innerHeight };
  }

  /** true while the selection itself is being dragged (the toolbar hides) */
  get adjusting(): boolean {
    return this.drag !== null;
  }

  undo() {
    this.shapes.undo();
    this.render();
  }

  /** Turns the open text box into a shape (empty text adds nothing). */
  commitText() {
    const input = this.textInput;
    if (!input) return;
    this.textInput = null;
    input.remove();
    const shape = textShape(input.value, input.at, this.color);
    if (shape) this.shapes.push(shape);
    this.render();
  }

  cancelText() {
    this.textInput?.remove();
    this.textInput = null;
  }

  render() {
    renderScene(this.ctx, {
      img: this.img,
      view: this.bounds,
      scale: this.scale,
      selection: this.selection,
      shapes: this.drawing ? [...this.shapes.items, this.drawing] : this.shapes.items,
    });
    this.onChange();
  }

  // ── pointer handling ────────────────────────────────────────────────

  private onPointerDown(e: PointerEvent) {
    if (this.textInput) return this.commitText(); // clicking elsewhere confirms the text
    const p = { x: e.clientX, y: e.clientY };
    const handle = this.selection && hitHandle(this.selection, p.x, p.y);

    if (this.tool && handle === "move") this.startAnnotation(this.tool, p);
    else if (handle) this.drag = { handle, start: p, orig: this.selection };
    else if (this.canStartNewSelection()) this.drag = { handle: "new", start: p, orig: null };
    else return;
    this.canvas.setPointerCapture(e.pointerId);
  }

  private onPointerMove(e: PointerEvent) {
    const p = clampPoint({ x: e.clientX, y: e.clientY }, this.bounds);
    if (this.drawing) return this.extendAnnotation(p);
    if (this.drag) return this.dragSelection(this.drag, p);
    this.canvas.style.cursor = this.cursorAt(p);
  }

  private onPointerUp() {
    if (this.drawing) {
      if (this.drawing.points.length > 1) this.shapes.push(this.drawing);
      this.drawing = null;
    }
    this.drag = null;
    if (this.selection && !isValidSelection(this.selection)) this.selection = null;
    this.render();
  }

  /** Once something is drawn, clicking outside must not throw the work away. */
  private canStartNewSelection(): boolean {
    return this.shapes.items.length === 0;
  }

  private startAnnotation(tool: Tool, p: Point) {
    if (tool === "text") {
      this.textInput = new TextInput(p, this.color, () => this.commitText(), () => this.cancelText());
      return;
    }
    this.drawing = newShape(tool, this.color, p);
  }

  private extendAnnotation(p: Point) {
    const shape = this.drawing!;
    if (FREEHAND_TOOLS.has(shape.tool)) shape.points.push(p);
    else shape.points[1] = p;
    this.render();
  }

  private dragSelection(d: SelectionDrag, p: Point) {
    this.selection =
      d.handle === "new"
        ? normalizeRect(d.start.x, d.start.y, p.x, p.y)
        : applyDrag(d.orig!, d.handle, p.x - d.start.x, p.y - d.start.y, this.bounds);
    this.render();
  }

  private cursorAt(p: Point): string {
    const handle = this.selection && hitHandle(this.selection, p.x, p.y);
    if (!handle) return DEFAULT_CURSOR;
    if (handle === "move" && this.tool) return this.tool === "text" ? TEXT_CURSOR : DEFAULT_CURSOR;
    return HANDLE_CURSOR[handle];
  }
}
