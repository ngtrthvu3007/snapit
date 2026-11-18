import { EDGE_GRAB_TOLERANCE, MIN_SELECTION_SIZE } from "./constants";

export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; width: number; height: number };
/** Số pixel ảnh thật trên mỗi CSS pixel, tách theo từng trục. */
export type Scale = { x: number; y: number };
export type Edge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
/** Thứ được nắm khi bấm lên vùng chọn: một cạnh/góc, hoặc cả vùng. */
export type Handle = Edge | "move";

type Edges = { left: number; top: number; right: number; bottom: number };

const toEdges = (rect: Rect): Edges => ({ left: rect.x, top: rect.y, right: rect.x + rect.width, bottom: rect.y + rect.height });

/** Dựng rect từ 4 cạnh bất kỳ thứ tự (kéo ngược vẫn ra rect dương). */
const fromEdges = ({ left, top, right, bottom }: Edges): Rect => ({
  x: Math.min(left, right),
  y: Math.min(top, bottom),
  width: Math.abs(right - left),
  height: Math.abs(bottom - top),
});

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const rectFromPoints = (start: Point, end: Point): Rect =>
  fromEdges({ left: start.x, top: start.y, right: end.x, bottom: end.y });

export const isValidSelection = (rect: Rect) => rect.width >= MIN_SELECTION_SIZE && rect.height >= MIN_SELECTION_SIZE;

/** Vùng chọn sau khi kéo xong: quá nhỏ thì quay về `fallback` (không có, hoặc rect trước khi resize). */
export const settleSelection = (rect: Rect, fallback: Rect | null) => (isValidSelection(rect) ? rect : fallback);

export const clampPoint = (point: Point, bounds: Rect): Point => ({
  x: clamp(point.x, bounds.x, bounds.x + bounds.width),
  y: clamp(point.y, bounds.y, bounds.y + bounds.height),
});

/** Cạnh nắm được trên toàn bộ chiều dài, góc là nơi hai cạnh gặp nhau. */
export function hitHandle(rect: Rect, point: Point, tolerance = EDGE_GRAB_TOLERANCE): Handle | null {
  const edges = toEdges(rect);
  const near = (value: number, edge: number) => Math.abs(value - edge) <= tolerance;
  const insideX = point.x >= edges.left - tolerance && point.x <= edges.right + tolerance;
  const insideY = point.y >= edges.top - tolerance && point.y <= edges.bottom + tolerance;
  if (!insideX || !insideY) return null;

  const vertical = near(point.y, edges.top) ? "n" : near(point.y, edges.bottom) ? "s" : "";
  const horizontal = near(point.x, edges.left) ? "w" : near(point.x, edges.right) ? "e" : "";
  const edge = `${vertical}${horizontal}`;
  return edge ? (edge as Edge) : "move";
}

/** Di chuyển rect, luôn giữ trọn trong bounds. */
export const moveRect = (rect: Rect, delta: Point, bounds: Rect): Rect => ({
  ...rect,
  x: clamp(rect.x + delta.x, bounds.x, bounds.x + bounds.width - rect.width),
  y: clamp(rect.y + delta.y, bounds.y, bounds.y + bounds.height - rect.height),
});

/** Kéo một cạnh/góc; kéo qua cạnh đối diện thì rect lật lại. Kết quả bị cắt trong bounds. */
export function resizeRect(rect: Rect, edge: Edge, delta: Point, bounds: Rect): Rect {
  const edges = toEdges(rect);
  if (edge.includes("n")) edges.top += delta.y;
  if (edge.includes("s")) edges.bottom += delta.y;
  if (edge.includes("w")) edges.left += delta.x;
  if (edge.includes("e")) edges.right += delta.x;
  return intersect(fromEdges(edges), bounds);
}

export const applyDrag = (rect: Rect, handle: Handle, delta: Point, bounds: Rect) =>
  handle === "move" ? moveRect(rect, delta, bounds) : resizeRect(rect, handle, delta, bounds);

function intersect(a: Rect, b: Rect): Rect {
  const [first, second] = [toEdges(a), toEdges(b)];
  const left = Math.max(first.left, second.left);
  const top = Math.max(first.top, second.top);
  const right = Math.max(left, Math.min(first.right, second.right));
  const bottom = Math.max(top, Math.min(first.bottom, second.bottom));
  return fromEdges({ left, top, right, bottom });
}
