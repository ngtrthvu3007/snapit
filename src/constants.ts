import type { Tool } from "./shapes";

// ── Vùng chọn ─────────────────────────────────────────────

/** Nhỏ hơn mức này (CSS px, một trong hai cạnh) thì coi là click, không phải vùng chọn. */
export const MIN_SELECTION_SIZE = 3;
/** Khoảng cách (CSS px) quanh cạnh vẫn tính là nắm trúng cạnh. */
export const EDGE_GRAB_TOLERANCE = 6;

export const MASK_COLOR = "rgba(0, 0, 0, 0.5)";

export const FRAME = {
  color: "#fff",
  dash: [4, 3],
  handleSize: 6,
  /** Dịch nửa pixel để nét 1px nằm gọn trên một hàng pixel, không bị nhoè. */
  hairlineOffset: 0.5,
  /** Vị trí 8 tay nắm, tính theo tỉ lệ chiều rộng/cao vùng chọn. */
  handleAnchors: [
    [0, 0],
    [0.5, 0],
    [1, 0],
    [0, 0.5],
    [1, 0.5],
    [0, 1],
    [0.5, 1],
    [1, 1],
  ],
} as const;

export const SIZE_LABEL = {
  font: "12px system-ui, sans-serif",
  background: "rgba(0, 0, 0, 0.75)",
  color: "#fff",
  height: 18,
  paddingX: 5,
  /** Vị trí baseline của chữ trong nhãn. */
  baseline: 13,
  /** Khoảng cách giữa nhãn và mép trên vùng chọn. */
  gap: 4,
  separator: " × ",
} as const;

export const TOOLBAR_GAP = 8;

// ── Công cụ vẽ ────────────────────────────────────────────

export const PALETTE = [
  "#ff3b30",
  "#ff9500",
  "#ffcc00",
  "#34c759",
  "#007aff",
  "#af52de",
  "#000000",
  "#ffffff",
];
export const DEFAULT_COLOR = PALETTE[0];

/** Độ dày nét theo công cụ; với text là cỡ chữ. */
export const TOOL_WIDTH: Record<Tool, number> = {
  pen: 3,
  line: 3,
  arrow: 3,
  rect: 3,
  marker: 16,
  text: 18,
};

export const MARKER_ALPHA = 0.4;

export const ARROW_HEAD = {
  /** Góc giữa thân và mỗi cánh mũi tên. */
  angle: Math.PI / 6,
  minSize: 12,
  sizePerStrokeWidth: 4,
} as const;

export const TEXT = {
  fontFamily: "system-ui, sans-serif",
  lineHeight: 1.25,
} as const;

export const TOOLS: { tool: Tool; icon: string; name: string }[] = [
  { tool: "pen", icon: "✎", name: "Pen" },
  { tool: "line", icon: "╱", name: "Line" },
  { tool: "arrow", icon: "➚", name: "Arrow" },
  { tool: "rect", icon: "▭", name: "Rectangle" },
  { tool: "marker", icon: "▮", name: "Marker" },
  { tool: "text", icon: "T", name: "Text" },
];

/** Biểu tượng các nút hành động trên toolbar. */
export const ACTION_ICON = { undo: "↶", copy: "⧉", save: "⤓", close: "✕" } as const;

// ── Phím tắt trong overlay ────────────────────────────────

/** So theo KeyboardEvent.code nên chạy với mọi bố cục bàn phím; dùng kèm ⌘ / Ctrl. */
export const SHORTCUT_CODES = { copy: "KeyC", save: "KeyS", undo: "KeyZ" } as const;

/** Thời gian hiện thông báo lỗi trong overlay. */
export const NOTICE_DURATION_MS = 4000;
