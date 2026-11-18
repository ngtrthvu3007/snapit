import type { Rect } from "./geometry";
import { drawShape, type Shape } from "./shapes";

export function exportSize(sel: Rect, scale: number): { w: number; h: number } {
  return { w: Math.round(sel.w * scale), h: Math.round(sel.h * scale) };
}

/** Crop of the frozen image plus annotations, at physical resolution, as PNG bytes. */
export async function composeExport(img: HTMLImageElement, sel: Rect, shapes: Shape[], scale: number): Promise<Uint8Array> {
  const { w, h } = exportSize(sel, scale);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, sel.x * scale, sel.y * scale, w, h, 0, 0, w, h);
  ctx.scale(scale, scale);
  ctx.translate(-sel.x, -sel.y);
  for (const s of shapes) drawShape(ctx, s);
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
  if (!blob) throw new Error("PNG encoding failed");
  return new Uint8Array(await blob.arrayBuffer());
}
