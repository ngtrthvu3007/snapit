import { FRAME, MASK_COLOR, SIZE_LABEL } from "./constants";
import type { Rect, Scale } from "./geometry";
import { drawShape, type Shape } from "./shapes";

export type Scene = {
  image: HTMLImageElement;
  /** Kích thước cửa sổ, CSS px. */
  viewport: Rect;
  scale: Scale;
  selection: Rect | null;
  shapes: readonly Shape[];
};

/** Kích thước thật (pixel ảnh) của một vùng, làm tròn. */
export const physicalSize = (rect: Rect, scale: Scale) => ({
  width: Math.round(rect.width * scale.x),
  height: Math.round(rect.height * scale.y),
});

/** Màn hình đóng băng, phủ tối trừ vùng chọn, kèm hình vẽ và khung vùng chọn. */
export function renderScene(context: CanvasRenderingContext2D, scene: Scene) {
  const { image, viewport, selection } = scene;
  context.clearRect(0, 0, viewport.width, viewport.height);
  context.drawImage(image, 0, 0, viewport.width, viewport.height);
  context.fillStyle = MASK_COLOR;
  context.fillRect(0, 0, viewport.width, viewport.height);
  if (!selection) return;
  renderSelection(context, scene, selection);
  renderFrame(context, selection);
  renderSizeLabel(context, selection, scene.scale);
}

/** Vẽ lại phần ảnh gốc trong vùng chọn (không bị phủ tối) và các hình, cắt gọn trong vùng. */
function renderSelection(context: CanvasRenderingContext2D, { image, scale, shapes }: Scene, selection: Rect) {
  const { x, y, width, height } = selection;
  context.drawImage(image, x * scale.x, y * scale.y, width * scale.x, height * scale.y, x, y, width, height);
  context.save();
  context.beginPath();
  context.rect(x, y, width, height);
  context.clip();
  for (const shape of shapes) drawShape(context, shape);
  context.restore();
}

function renderFrame(context: CanvasRenderingContext2D, selection: Rect) {
  const { x, y, width, height } = selection;
  const { handleSize, hairlineOffset } = FRAME;
  context.save();
  context.strokeStyle = context.fillStyle = FRAME.color;
  context.setLineDash([...FRAME.dash]);
  context.strokeRect(x + hairlineOffset, y + hairlineOffset, width - 2 * hairlineOffset, height - 2 * hairlineOffset);
  for (const [anchorX, anchorY] of FRAME.handleAnchors) {
    context.fillRect(x + width * anchorX - handleSize / 2, y + height * anchorY - handleSize / 2, handleSize, handleSize);
  }
  context.restore();
}

/** "R × C" theo pixel thật, phía trên vùng chọn (nằm trong vùng nếu hết chỗ). */
function renderSizeLabel(context: CanvasRenderingContext2D, selection: Rect, scale: Scale) {
  const label = SIZE_LABEL;
  const size = physicalSize(selection, scale);
  const text = `${size.width}${label.separator}${size.height}`;
  context.save();
  context.font = label.font;
  const width = context.measureText(text).width + 2 * label.paddingX;
  const above = selection.y - label.height - label.gap;
  const top = above >= 0 ? above : selection.y + label.gap;
  context.fillStyle = label.background;
  context.fillRect(selection.x, top, width, label.height);
  context.fillStyle = label.color;
  context.fillText(text, selection.x + label.paddingX, top + label.baseline);
  context.restore();
}
