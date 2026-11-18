import type { Rect, Scale } from "./geometry";
import { drawShape, type Shape } from "./shapes";

const PNG_MIME = "image/png";

export function exportSize(sel: Rect, k: Scale): { w: number; h: number } {
  return { w: Math.round(sel.w * k.x), h: Math.round(sel.h * k.y) };
}

/** The selection in source-image pixels, snapped to whole pixels so the crop isn't resampled (blurry). */
export function exportSourceRect(sel: Rect, k: Scale): Rect {
  return { x: Math.round(sel.x * k.x), y: Math.round(sel.y * k.y), ...exportSize(sel, k) };
}

/** Crop of the frozen image plus annotations, at physical resolution, as PNG bytes. */
export async function composeExport(img: HTMLImageElement, sel: Rect, shapes: readonly Shape[], k: Scale): Promise<Uint8Array> {
  const src = exportSourceRect(sel, k);
  const canvas = document.createElement("canvas");
  canvas.width = src.w;
  canvas.height = src.h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false; // 1:1 copy of screen pixels
  ctx.drawImage(img, src.x, src.y, src.w, src.h, 0, 0, src.w, src.h);
  ctx.imageSmoothingEnabled = true; // annotations still get anti-aliasing
  // shapes are in CSS px relative to the screen; map them onto the crop
  ctx.setTransform(k.x, 0, 0, k.y, -src.x, -src.y);
  for (const s of shapes) drawShape(ctx, s);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, PNG_MIME));
  if (!blob) throw new Error("PNG encoding failed");
  return new Uint8Array(await blob.arrayBuffer());
}
