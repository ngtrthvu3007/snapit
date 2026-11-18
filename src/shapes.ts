import { ARROW_HEAD, MARKER_ALPHA, TEXT, TOOL_WIDTH } from "./constants";
import type { Point } from "./geometry";

export type Tool = "pen" | "line" | "arrow" | "rect" | "marker" | "text";
/** Toạ độ theo CSS px của cửa sổ overlay. Với text, `width` là cỡ chữ. */
export type Shape = {
  tool: Tool;
  color: string;
  width: number;
  points: Point[];
  text?: string;
};

/** Công cụ ghi mọi điểm con trỏ đi qua; các công cụ khác chỉ giữ điểm đầu và cuối. */
export const FREEHAND_TOOLS: ReadonlySet<Tool> = new Set(["pen", "marker"]);

export const newShape = (tool: Tool, color: string, start: Point): Shape => ({
  tool,
  color,
  width: TOOL_WIDTH[tool],
  points: [start],
});

/** Chữ rỗng (hoặc chỉ khoảng trắng) không tạo hình. */
export const textShape = (text: string, position: Point, color: string): Shape | null =>
  text.trim() ? { ...newShape("text", color, position), text } : null;

/** Hai đầu cánh của mũi tên tại `tip`. */
export function arrowHead(tail: Point, tip: Point, size: number): [Point, Point] {
  const shaftAngle = Math.atan2(tip.y - tail.y, tip.x - tail.x);
  const wing = (offset: number) => ({
    x: tip.x - size * Math.cos(shaftAngle + offset),
    y: tip.y - size * Math.sin(shaftAngle + offset),
  });

  return [wing(ARROW_HEAD.angle), wing(-ARROW_HEAD.angle)];
}

/** Danh sách hình đã vẽ, có undo. */
export function newShapeStack() {
  return {
    items: [] as Shape[],
    push(shape: Shape) {
      this.items.push(shape);
    },
    undo() {
      this.items.pop();
    },
  };
}

// ── Vẽ ────────────────────────────────────────────────────

type DrawFunction = (
  context: CanvasRenderingContext2D,
  shape: Shape,
  start: Point,
  end: Point,
) => void;

function tracePath(context: CanvasRenderingContext2D, points: Point[]) {
  const [first, ...rest] = points;

  context.beginPath();
  context.moveTo(first.x, first.y);
  for (const point of rest) {
    context.lineTo(point.x, point.y);
  }
}

function strokePath(context: CanvasRenderingContext2D, points: Point[]) {
  tracePath(context, points);
  context.stroke();
}

function fillPolygon(context: CanvasRenderingContext2D, points: Point[]) {
  tracePath(context, points);
  context.closePath();
  context.fill();
}

const DRAW: Record<Tool, DrawFunction> = {
  pen: (context, shape) => strokePath(context, shape.points),
  marker: (context, shape) => {
    context.globalAlpha = MARKER_ALPHA;
    context.lineCap = "butt";
    strokePath(context, shape.points);
  },
  line: (context, _shape, start, end) => strokePath(context, [start, end]),
  arrow: (context, shape, start, end) => {
    strokePath(context, [start, end]);
    const size = Math.max(
      ARROW_HEAD.minSize,
      shape.width * ARROW_HEAD.sizePerStrokeWidth,
    );
    fillPolygon(context, [end, ...arrowHead(start, end, size)]);
  },
  rect: (context, _shape, start, end) =>
    context.strokeRect(
      Math.min(start.x, end.x),
      Math.min(start.y, end.y),
      Math.abs(end.x - start.x),
      Math.abs(end.y - start.y),
    ),
  text: (context, shape, start) => {
    context.font = `${shape.width}px ${TEXT.fontFamily}`;
    context.textBaseline = "top";
    const lineHeight = shape.width * TEXT.lineHeight;
    const lines = (shape.text ?? "").split("\n");

    lines.forEach((line, index) => {
      context.fillText(line, start.x, start.y + index * lineHeight);
    });
  },
};

/** Vẽ trong hệ toạ độ hiện tại của context; khi xuất ảnh, caller scale context. */
export function drawShape(context: CanvasRenderingContext2D, shape: Shape) {
  const start = shape.points[0];
  const end = shape.points[shape.points.length - 1];

  context.save();
  context.strokeStyle = context.fillStyle = shape.color;
  context.lineWidth = shape.width;
  context.lineCap = context.lineJoin = "round";

  DRAW[shape.tool](context, shape, start, end);

  context.restore();
}
