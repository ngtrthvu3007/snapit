export type Rect = { x: number; y: number; w: number; h: number };
export type Handle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw" | "move";

export function normalizeRect(x1: number, y1: number, x2: number, y2: number): Rect {
  return { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
}

export function isValidSelection(r: Rect): boolean {
  return r.w >= 3 && r.h >= 3;
}

/** Edges are grabbable along their whole length, corners where two edges meet. */
export function hitHandle(r: Rect, px: number, py: number, tol = 6): Handle | null {
  const inX = px >= r.x - tol && px <= r.x + r.w + tol;
  const inY = py >= r.y - tol && py <= r.y + r.h + tol;
  if (!inX || !inY) return null;
  const v = Math.abs(py - r.y) <= tol ? "n" : Math.abs(py - r.y - r.h) <= tol ? "s" : "";
  const h = Math.abs(px - r.x) <= tol ? "w" : Math.abs(px - r.x - r.w) <= tol ? "e" : "";
  return ((v + h) as Handle) || "move";
}

export function applyDrag(r: Rect, handle: Handle, dx: number, dy: number, b: Rect): Rect {
  if (handle === "move") {
    const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
    return { ...r, x: clamp(r.x + dx, b.x, b.x + b.w - r.w), y: clamp(r.y + dy, b.y, b.y + b.h - r.h) };
  }
  let [x1, y1, x2, y2] = [r.x, r.y, r.x + r.w, r.y + r.h];
  if (handle.includes("n")) y1 += dy;
  if (handle.includes("s")) y2 += dy;
  if (handle.includes("w")) x1 += dx;
  if (handle.includes("e")) x2 += dx;
  const n = normalizeRect(x1, y1, x2, y2);
  const left = Math.max(n.x, b.x);
  const top = Math.max(n.y, b.y);
  const right = Math.min(n.x + n.w, b.x + b.w);
  const bottom = Math.min(n.y + n.h, b.y + b.h);
  return { x: left, y: top, w: Math.max(0, right - left), h: Math.max(0, bottom - top) };
}
