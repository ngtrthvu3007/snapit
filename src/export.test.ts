import { expect, test } from "vitest";
import { exportSize, exportSourceRect } from "./export";

test("export size is in physical pixels (Retina 2×)", () => {
  expect(exportSize({ x: 10, y: 10, w: 100, h: 50 }, { x: 2, y: 2 })).toEqual({ w: 200, h: 100 });
});

test("export size rounds fractional scales", () => {
  expect(exportSize({ x: 0, y: 0, w: 33.4, h: 10 }, { x: 1.5, y: 1.5 })).toEqual({ w: 50, h: 15 });
});

test("export uses separate horizontal and vertical scale", () => {
  expect(exportSize({ x: 0, y: 0, w: 100, h: 100 }, { x: 2, y: 1.8 })).toEqual({ w: 200, h: 180 });
});

test("crop source starts on a whole pixel so fractional scales stay sharp", () => {
  expect(exportSourceRect({ x: 10.3, y: 5, w: 33.4, h: 10 }, { x: 1.5, y: 1.5 })).toEqual({ x: 15, y: 8, w: 50, h: 15 });
});
