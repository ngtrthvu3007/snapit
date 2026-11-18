import { FRAME, MASK_COLOR, SIZE_LABEL } from "./constants";
import type { Rect, Scale } from "./geometry";
import { drawShape, type Shape } from "./shapes";

export type Scene = {
  img: HTMLImageElement;
  /** viewport size in CSS px */
  view: Rect;
  scale: Scale;
  selection: Rect | null;
  shapes: readonly Shape[];
};

/** Frozen screen, dimmed everywhere except the selection, with annotations and the selection frame. */
export function renderScene(ctx: CanvasRenderingContext2D, scene: Scene) {
  const { img, view, selection } = scene;
  ctx.clearRect(0, 0, view.w, view.h);
  ctx.drawImage(img, 0, 0, view.w, view.h);
  ctx.fillStyle = MASK_COLOR;
  ctx.fillRect(0, 0, view.w, view.h);
  if (!selection) return;
  renderSelection(ctx, scene, selection);
  renderFrame(ctx, selection);
  renderSizeLabel(ctx, selection, scene.scale);
}

function renderSelection(ctx: CanvasRenderingContext2D, { img, scale: k, shapes }: Scene, s: Rect) {
  ctx.drawImage(img, s.x * k.x, s.y * k.y, s.w * k.x, s.h * k.y, s.x, s.y, s.w, s.h);
  ctx.save();
  ctx.beginPath();
  ctx.rect(s.x, s.y, s.w, s.h);
  ctx.clip();
  for (const shape of shapes) drawShape(ctx, shape);
  ctx.restore();
}

function renderFrame(ctx: CanvasRenderingContext2D, s: Rect) {
  const half = FRAME.handleSize / 2;
  ctx.save();
  ctx.strokeStyle = ctx.fillStyle = FRAME.color;
  ctx.setLineDash([...FRAME.dash]);
  // +0.5 keeps the 1px line on a pixel instead of blurring across two
  ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1);
  for (const [ax, ay] of FRAME.handleAnchors) {
    ctx.fillRect(s.x + s.w * ax - half, s.y + s.h * ay - half, FRAME.handleSize, FRAME.handleSize);
  }
  ctx.restore();
}

/** "W × H" in physical pixels, above the selection (inside it when there's no room). */
function renderSizeLabel(ctx: CanvasRenderingContext2D, s: Rect, k: Scale) {
  const L = SIZE_LABEL;
  const text = `${Math.round(s.w * k.x)} × ${Math.round(s.h * k.y)}`;
  ctx.save();
  ctx.font = L.font;
  const width = ctx.measureText(text).width + 2 * L.paddingX;
  const above = s.y - L.height - L.gap;
  const top = above >= 0 ? above : s.y + L.gap;
  ctx.fillStyle = L.background;
  ctx.fillRect(s.x, top, width, L.height);
  ctx.fillStyle = L.color;
  ctx.fillText(text, s.x + L.paddingX, top + L.baseline);
  ctx.restore();
}
