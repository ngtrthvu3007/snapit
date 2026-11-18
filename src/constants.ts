import type { Tool } from "./shapes";

/** Selections smaller than this (CSS px, either side) count as a click, not a selection. */
export const MIN_SELECTION_SIZE = 3;
/** How far (CSS px) from an edge still grabs it. */
export const EDGE_GRAB_TOLERANCE = 6;

export const MASK_COLOR = "rgba(0, 0, 0, 0.5)";

export const FRAME = {
  color: "#fff",
  dash: [4, 3],
  handleSize: 6,
  /** handle anchors as fractions of the selection's width/height */
  handleAnchors: [
    [0, 0], [0.5, 0], [1, 0],
    [0, 0.5], [1, 0.5],
    [0, 1], [0.5, 1], [1, 1],
  ],
} as const;

export const SIZE_LABEL = {
  font: "12px system-ui, sans-serif",
  background: "rgba(0, 0, 0, 0.75)",
  color: "#fff",
  height: 18,
  paddingX: 5,
  /** baseline offset inside the label box */
  baseline: 13,
  /** gap between label and selection top */
  gap: 4,
} as const;

export const TOOLBAR_GAP = 8;

export const PALETTE = ["#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#007aff", "#af52de", "#000000", "#ffffff"];
export const DEFAULT_COLOR = PALETTE[0];

/** Stroke width per tool; for text it is the font size. */
export const TOOL_WIDTH: Record<Tool, number> = { pen: 3, line: 3, arrow: 3, rect: 3, marker: 16, text: 18 };

export const MARKER_ALPHA = 0.4;

export const ARROW_HEAD = {
  /** angle between the shaft and each wing */
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

/** Keyboard shortcuts (matched on KeyboardEvent.code, so they work on any layout), used with ⌘ / Ctrl. */
export const SHORTCUT_CODES = { copy: "KeyC", save: "KeyS", undo: "KeyZ" } as const;

/** How long an in-overlay error message stays visible. */
export const NOTICE_DURATION_MS = 4000;
