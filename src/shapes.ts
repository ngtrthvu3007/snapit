import { ARROW_HEAD, MARKER_ALPHA, TEXT, TOOL_WIDTH } from "./constants";
import type { Point } from "./geometry";

export type { Point };
export type Tool = "pen" | "line" | "arrow" | "rect" | "marker" | "text";
/** Coordinates in CSS px of the overlay window. For text, `width` is the font size. */
export type Shape = { tool: Tool; color: string; width: number; points: Point[]; text?: string };

/** Tools that record every pointer position; the others keep only start and end. */
export const FREEHAND_TOOLS: ReadonlySet<Tool> = new Set(["pen", "marker"]);

export function newShape(tool: Tool, color: string, at: Point): Shape {
  return { tool, color, width: TOOL_WIDTH[tool], points: [at] };
}

export function arrowHead(from: Point, to: Point, size: number): [Point, Point] {
  const a = Math.atan2(to.y - from.y, to.x - from.x);
  const wing = (d: number) => ({ x: to.x - size * Math.cos(a + d), y: to.y - size * Math.sin(a + d) });
  return [wing(ARROW_HEAD.angle), wing(-ARROW_HEAD.angle)];
}

export function newShapeStack() {
  return {
    items: [] as Shape[],
    push(s: Shape) {
      this.items.push(s);
    },
    undo() {
      this.items.pop();
    },
  };
}

export function textShape(text: string, at: Point, color: string): Shape | null {
  return text.trim() ? { tool: "text", color, width: TOOL_WIDTH.text, points: [at], text } : null;
}

type Draw = (ctx: CanvasRenderingContext2D, s: Shape, first: Point, last: Point) => void;

function strokePath(ctx: CanvasRenderingContext2D, points: Point[]) {
  ctx.beginPath();
  points.forEach((q, i) => (i === 0 ? ctx.moveTo(q.x, q.y) : ctx.lineTo(q.x, q.y)));
  ctx.stroke();
}

const DRAW: Record<Tool, Draw> = {
  pen: (ctx, s) => strokePath(ctx, s.points),
  marker: (ctx, s) => {
    ctx.globalAlpha = MARKER_ALPHA;
    ctx.lineCap = "butt";
    strokePath(ctx, s.points);
  },
  line: (ctx, _s, first, last) => strokePath(ctx, [first, last]),
  arrow: (ctx, s, first, last) => {
    strokePath(ctx, [first, last]);
    const [a, b] = arrowHead(first, last, Math.max(ARROW_HEAD.minSize, s.width * ARROW_HEAD.sizePerStrokeWidth));
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.closePath();
    ctx.fill();
  },
  rect: (ctx, _s, first, last) => {
    const r = { x: Math.min(first.x, last.x), y: Math.min(first.y, last.y) };
    ctx.strokeRect(r.x, r.y, Math.abs(last.x - first.x), Math.abs(last.y - first.y));
  },
  text: (ctx, s, first) => {
    ctx.font = `${s.width}px ${TEXT.fontFamily}`;
    ctx.textBaseline = "top";
    const lineHeight = s.width * TEXT.lineHeight;
    (s.text ?? "").split("\n").forEach((line, i) => ctx.fillText(line, first.x, first.y + i * lineHeight));
  },
};

/** Draws in the context's current coordinate space; callers scale the context for export. */
export function drawShape(ctx: CanvasRenderingContext2D, s: Shape) {
  ctx.save();
  ctx.strokeStyle = ctx.fillStyle = s.color;
  ctx.lineWidth = s.width;
  ctx.lineCap = ctx.lineJoin = "round";
  DRAW[s.tool](ctx, s, s.points[0], s.points[s.points.length - 1]);
  ctx.restore();
}
