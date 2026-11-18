import { expect, test } from "vitest";
import { TOOLBAR_GAP as G } from "./constants";
import { toolbarPosition } from "./toolbar";

const view = { w: 1000, h: 600 };
const bar = { w: 300, h: 36 };

test("toolbar sits below the selection, right-aligned", () => {
  expect(toolbarPosition({ x: 100, y: 100, w: 400, h: 200 }, bar, view)).toEqual({ left: 200, top: 300 + G });
});

test("toolbar goes above when there is no room below", () => {
  expect(toolbarPosition({ x: 100, y: 300, w: 400, h: 290 }, bar, view)).toEqual({ left: 200, top: 300 - bar.h - G });
});

test("toolbar goes inside the bottom when the selection fills the screen", () => {
  expect(toolbarPosition({ x: 0, y: 0, w: 1000, h: 600 }, bar, view)).toEqual({ left: 700, top: 600 - bar.h - G });
});

test("toolbar never leaves the screen horizontally", () => {
  expect(toolbarPosition({ x: 10, y: 10, w: 50, h: 50 }, bar, view).left).toBe(0);
});
