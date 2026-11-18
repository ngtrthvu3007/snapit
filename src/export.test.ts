import { expect, test } from "vitest";
import { exportSize } from "./export";

test("export size is in physical pixels (Retina 2×)", () => {
  expect(exportSize({ x: 10, y: 10, w: 100, h: 50 }, 2)).toEqual({ w: 200, h: 100 });
});

test("export size rounds fractional scales", () => {
  expect(exportSize({ x: 0, y: 0, w: 33.4, h: 10 }, 1.5)).toEqual({ w: 50, h: 15 });
});
