import { DEFAULT_COLOR } from "./constants";
import {
  applyDrag,
  clampPoint,
  type Handle,
  hitHandle,
  type Point,
  type Rect,
  rectFromPoints,
  type Scale,
  settleSelection,
} from "./geometry";
import { renderScene } from "./renderer";
import {
  FREEHAND_TOOLS,
  newShape,
  newShapeStack,
  type Shape,
  textShape,
  type Tool,
} from "./shapes";
import { TextInput } from "./text-input";

const CURSOR = {
  default: "crosshair",
  text: "text",
  handle: {
    n: "ns-resize",
    s: "ns-resize",
    e: "ew-resize",
    w: "ew-resize",
    ne: "nesw-resize",
    sw: "nesw-resize",
    nw: "nwse-resize",
    se: "nwse-resize",
    move: "move",
  } satisfies Record<Handle, string>,
} as const;

/** Đang kéo vùng chọn: tạo mới, hoặc di chuyển/đổi kích thước vùng cũ. */
type SelectionDrag = {
  handle: Handle | "new";
  start: Point;
  original: Rect | null;
};

const pointOf = (event: PointerEvent): Point => ({
  x: event.clientX,
  y: event.clientY,
});

const delta = (from: Point, to: Point): Point => ({
  x: to.x - from.x,
  y: to.y - from.y,
});

/** Vùng chọn + hình vẽ trên ảnh đóng băng của một màn hình. */
export class Editor {
  selection: Rect | null = null;
  readonly shapes = newShapeStack();
  tool: Tool | null = null;
  color = DEFAULT_COLOR;

  /** Gọi sau mỗi lần vẽ lại. */
  onChange: () => void = () => {};

  private readonly context: CanvasRenderingContext2D;
  private drag: SelectionDrag | null = null;
  private drawing: Shape | null = null;
  private textInput: TextInput | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    readonly image: HTMLImageElement,
  ) {
    this.context = canvas.getContext("2d")!;

    // cửa sổ có thể đổi kích thước sau khi hiện (Linux bật fullscreen muộn)
    addEventListener("resize", () => this.fitCanvas());

    canvas.addEventListener("pointerdown", (event) => this.onPointerDown(event));
    canvas.addEventListener("pointermove", (event) => this.onPointerMove(event));
    canvas.addEventListener("pointerup", () => this.onPointerUp());

    this.fitCanvas();
  }

  /** Pixel ảnh thật / CSS pixel; đọc trực tiếp vì kích thước cửa sổ có thể đổi. */
  get scale(): Scale {
    return {
      x: this.image.naturalWidth / innerWidth,
      y: this.image.naturalHeight / innerHeight,
    };
  }

  get bounds(): Rect {
    return { x: 0, y: 0, width: innerWidth, height: innerHeight };
  }

  /** true khi đang kéo chính vùng chọn (toolbar ẩn đi). */
  get adjusting(): boolean {
    return this.drag !== null;
  }

  undo() {
    this.shapes.undo();
    this.render();
  }

  /** Chốt ô chữ đang mở thành hình (chữ rỗng thì bỏ). */
  commitText() {
    const input = this.textInput;
    if (!input) {
      return;
    }

    this.closeTextInput();

    const shape = textShape(input.value, input.position, this.color);
    if (shape) {
      this.shapes.push(shape);
    }

    this.render();
  }

  closeTextInput() {
    this.textInput?.remove();
    this.textInput = null;
  }

  render() {
    const shapes = this.drawing
      ? [...this.shapes.items, this.drawing]
      : this.shapes.items;

    renderScene(this.context, {
      image: this.image,
      viewport: this.bounds,
      scale: this.scale,
      selection: this.selection,
      shapes,
    });

    this.onChange();
  }

  /** Đặt bộ đệm canvas bằng cửa sổ ở độ phân giải thiết bị. */
  private fitCanvas() {
    const pixelRatio = devicePixelRatio;

    this.canvas.width = innerWidth * pixelRatio;
    this.canvas.height = innerHeight * pixelRatio;
    this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    this.render();
  }

  // ── Chuột ───────────────────────────────────────────────

  private onPointerDown(event: PointerEvent) {
    // bấm chỗ khác = chốt chữ đang gõ
    if (this.textInput) {
      return this.commitText();
    }

    const point = pointOf(event);
    const handle = this.handleAt(point);

    if (this.tool && handle === "move") {
      this.startAnnotation(this.tool, point);
    } else if (handle) {
      this.drag = { handle, start: point, original: this.selection };
    } else if (this.canStartNewSelection()) {
      this.drag = { handle: "new", start: point, original: null };
    } else {
      return;
    }

    this.canvas.setPointerCapture(event.pointerId);
  }

  private onPointerMove(event: PointerEvent) {
    const point = clampPoint(pointOf(event), this.bounds);

    if (this.drawing) {
      return this.extendAnnotation(point);
    }

    if (this.drag) {
      return this.dragSelection(this.drag, point);
    }

    this.canvas.style.cursor = this.cursorAt(point);
  }

  private onPointerUp() {
    if (this.drawing) {
      if (this.drawing.points.length > 1) {
        this.shapes.push(this.drawing);
      }
      this.drawing = null;
    }

    if (this.drag && this.selection) {
      this.selection = settleSelection(this.selection, this.drag.original);
    }
    this.drag = null;

    this.render();
  }

  private handleAt(point: Point): Handle | null {
    return this.selection && hitHandle(this.selection, point);
  }

  /** Đã vẽ gì đó thì click ra ngoài không được xoá mất công sức. */
  private canStartNewSelection(): boolean {
    return this.shapes.items.length === 0;
  }

  private startAnnotation(tool: Tool, point: Point) {
    if (tool !== "text") {
      this.drawing = newShape(tool, this.color, point);
      return;
    }

    this.textInput = new TextInput(
      point,
      this.color,
      () => this.commitText(),
      () => this.closeTextInput(),
    );
  }

  private extendAnnotation(point: Point) {
    const shape = this.drawing!;

    if (FREEHAND_TOOLS.has(shape.tool)) {
      shape.points.push(point);
    } else {
      shape.points[1] = point;
    }

    this.render();
  }

  private dragSelection(drag: SelectionDrag, point: Point) {
    if (drag.handle === "new") {
      this.selection = rectFromPoints(drag.start, point);
    } else {
      const movement = delta(drag.start, point);
      this.selection = applyDrag(drag.original!, drag.handle, movement, this.bounds);
    }

    this.render();
  }

  private cursorAt(point: Point): string {
    const handle = this.handleAt(point);

    if (!handle) {
      return CURSOR.default;
    }

    if (handle === "move" && this.tool) {
      return this.tool === "text" ? CURSOR.text : CURSOR.default;
    }

    return CURSOR.handle[handle];
  }
}
