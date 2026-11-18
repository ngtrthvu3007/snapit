export type Tool = "pen" | "line" | "arrow" | "rect" | "marker" | "text";
export type Point = { x: number; y: number };
/** Coordinates in CSS px of the overlay window. For text, `width` is the font size. */
export type Shape = { tool: Tool; color: string; width: number; points: Point[]; text?: string };

export const TOOL_WIDTH: Record<Tool, number> = { pen: 3, line: 3, arrow: 3, rect: 3, marker: 16, text: 18 };

export function arrowHead(from: Point, to: Point, size: number): [Point, Point] {
  const a = Math.atan2(to.y - from.y, to.x - from.x);
  const wing = (d: number) => ({ x: to.x - size * Math.cos(a + d), y: to.y - size * Math.sin(a + d) });
  return [wing(Math.PI / 6), wing(-Math.PI / 6)];
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

/** Draws in the context's current coordinate space; callers scale the context for export. */
export function drawShape(ctx: CanvasRenderingContext2D, s: Shape) {
  const p = s.points;
  const first = p[0];
  const last = p[p.length - 1];
  ctx.save();
  ctx.strokeStyle = ctx.fillStyle = s.color;
  ctx.lineWidth = s.width;
  ctx.lineCap = ctx.lineJoin = "round";
  switch (s.tool) {
    case "marker":
    case "pen":
      if (s.tool === "marker") {
        ctx.globalAlpha = 0.4;
        ctx.lineCap = "butt";
      }
      ctx.beginPath();
      p.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
      ctx.stroke();
      break;
    case "line":
    case "arrow": {
      ctx.beginPath();
      ctx.moveTo(first.x, first.y);
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
      if (s.tool === "arrow") {
        const [a, b] = arrowHead(first, last, Math.max(12, s.width * 4));
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case "rect":
      ctx.strokeRect(Math.min(first.x, last.x), Math.min(first.y, last.y), Math.abs(last.x - first.x), Math.abs(last.y - first.y));
      break;
    case "text":
      ctx.font = `${s.width}px system-ui, sans-serif`;
      ctx.textBaseline = "top";
      (s.text ?? "").split("\n").forEach((l, i) => ctx.fillText(l, first.x, first.y + i * s.width * 1.25));
      break;
  }
  ctx.restore();
}
