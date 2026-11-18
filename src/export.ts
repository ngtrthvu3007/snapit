import type { Rect, Scale } from "./geometry";
import { physicalSize } from "./renderer";
import { drawShape, type Shape } from "./shapes";

const PNG_MIME = "image/png";

export const exportSize = physicalSize;

/** Vùng chọn tính theo pixel ảnh gốc, làm tròn để không phải nội suy (ảnh mờ). */
export const exportSourceRect = (selection: Rect, scale: Scale): Rect => ({
  x: Math.round(selection.x * scale.x),
  y: Math.round(selection.y * scale.y),
  ...physicalSize(selection, scale),
});

/** Phần ảnh trong vùng chọn kèm hình vẽ, ở độ phân giải thật, dạng PNG. */
export async function composeExport(
  image: HTMLImageElement,
  selection: Rect,
  shapes: readonly Shape[],
  scale: Scale,
): Promise<Uint8Array> {
  const source = exportSourceRect(selection, scale);
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext("2d")!;
  context.imageSmoothingEnabled = false; // chép nguyên pixel màn hình
  context.drawImage(image, source.x, source.y, source.width, source.height, 0, 0, source.width, source.height);
  context.imageSmoothingEnabled = true; // hình vẽ vẫn được khử răng cưa
  // hình vẽ dùng CSS px theo màn hình → đưa về khung ảnh cắt
  context.setTransform(scale.x, 0, 0, scale.y, -source.x, -source.y);
  for (const shape of shapes) drawShape(context, shape);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, PNG_MIME));
  if (!blob) throw new Error("PNG encoding failed");
  return new Uint8Array(await blob.arrayBuffer());
}
