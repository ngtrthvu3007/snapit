import { EDGE_GRAB_TOLERANCE, MIN_SELECTION_SIZE } from "./constants";

export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };
/** Physical image pixels per CSS pixel, per axis (they can differ if the window isn't exactly the monitor's shape). */
export type Scale = { x: number; y: number };
export type Edge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
/** What a pointer press on a selection grabs: one of its edges/corners, or the whole thing. */
export type Handle = Edge | "move";

export function normalizeRect(x1: number, y1: number, x2: number, y2: number): Rect {
  return { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
}

export function isValidSelection(r: Rect): boolean {
  return r.w >= MIN_SELECTION_SIZE && r.h >= MIN_SELECTION_SIZE;
}

/** The selection after a drag ends: a too-small result falls back (to nothing, or to the pre-resize rect). */
export function settleSelection(r: Rect, fallback: Rect | null): Rect | null {
  return isValidSelection(r) ? r : fallback;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}

export function clampPoint(p: Point, b: Rect): Point {
  return { x: clamp(p.x, b.x, b.x + b.w), y: clamp(p.y, b.y, b.y + b.h) };
}

/** Edges are grabbable along their whole length, corners where two edges meet. */
export function hitHandle(r: Rect, px: number, py: number, tol = EDGE_GRAB_TOLERANCE): Handle | null {
  const near = (a: number, b: number) => Math.abs(a - b) <= tol;
  const insideX = px >= r.x - tol && px <= r.x + r.w + tol;
  const insideY = py >= r.y - tol && py <= r.y + r.h + tol;
  if (!insideX || !insideY) return null;

  const top = near(py, r.y);
  const bottom = !top && near(py, r.y + r.h);
  const left = near(px, r.x);
  const right = !left && near(px, r.x + r.w);

  if (top && left) return "nw";
  if (top && right) return "ne";
  if (bottom && left) return "sw";
  if (bottom && right) return "se";
  if (top) return "n";
  if (bottom) return "s";
  if (left) return "w";
  if (right) return "e";
  return "move";
}

/** Moves the rect, keeping it fully inside the bounds. */
export function moveRect(r: Rect, dx: number, dy: number, b: Rect): Rect {
  return { ...r, x: clamp(r.x + dx, b.x, b.x + b.w - r.w), y: clamp(r.y + dy, b.y, b.y + b.h - r.h) };
}

/** Drags one edge/corner; dragging past the opposite edge flips the rect. Result is clipped to the bounds. */
export function resizeRect(r: Rect, edge: Edge, dx: number, dy: number, b: Rect): Rect {
  let [x1, y1, x2, y2] = [r.x, r.y, r.x + r.w, r.y + r.h];
  if (edge.includes("n")) y1 += dy;
  if (edge.includes("s")) y2 += dy;
  if (edge.includes("w")) x1 += dx;
  if (edge.includes("e")) x2 += dx;
  return intersect(normalizeRect(x1, y1, x2, y2), b);
}

export function applyDrag(r: Rect, handle: Handle, dx: number, dy: number, b: Rect): Rect {
  return handle === "move" ? moveRect(r, dx, dy, b) : resizeRect(r, handle, dx, dy, b);
}

function intersect(a: Rect, b: Rect): Rect {
  const left = Math.max(a.x, b.x);
  const top = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.w, b.x + b.w);
  const bottom = Math.min(a.y + a.h, b.y + b.h);
  return { x: left, y: top, w: Math.max(0, right - left), h: Math.max(0, bottom - top) };
}
