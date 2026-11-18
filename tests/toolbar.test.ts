import { expect, test } from "vitest";
import { TOOLBAR_GAP as G } from "../src/constants";
import { toolbarPosition } from "../src/toolbar";

const view = { width: 1000, height: 600 };
const bar = { width: 300, height: 36 };

test("toolbar sits below the selection, right-aligned", () => {
  expect(toolbarPosition({ x: 100, y: 100, width: 400, height: 200 }, bar, view)).toEqual({ left: 200, top: 300 + G });
});

test("toolbar goes above when there is no room below", () => {
  expect(toolbarPosition({ x: 100, y: 300, width: 400, height: 290 }, bar, view)).toEqual({ left: 200, top: 300 - bar.height - G });
});

test("toolbar goes inside the bottom when the selection fills the screen", () => {
  expect(toolbarPosition({ x: 0, y: 0, width: 1000, height: 600 }, bar, view)).toEqual({ left: 700, top: 600 - bar.height - G });
});

test("toolbar never leaves the screen horizontally", () => {
  expect(toolbarPosition({ x: 10, y: 10, width: 50, height: 50 }, bar, view).left).toBe(0);
});
