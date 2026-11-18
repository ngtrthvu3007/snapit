import { expect, test } from "vitest";
import { exportSize, exportSourceRect } from "../src/export";

test("export size is in physical pixels (Retina 2×)", () => {
  expect(exportSize({ x: 10, y: 10, width: 100, height: 50 }, { x: 2, y: 2 })).toEqual({
    width: 200,
    height: 100,
  });
});

test("export size rounds fractional scales", () => {
  expect(exportSize({ x: 0, y: 0, width: 33.4, height: 10 }, { x: 1.5, y: 1.5 })).toEqual(
    { width: 50, height: 15 },
  );
});

test("export uses separate horizontal and vertical scale", () => {
  expect(exportSize({ x: 0, y: 0, width: 100, height: 100 }, { x: 2, y: 1.8 })).toEqual({
    width: 200,
    height: 180,
  });
});

test("crop source starts on a whole pixel so fractional scales stay sharp", () => {
  expect(
    exportSourceRect({ x: 10.3, y: 5, width: 33.4, height: 10 }, { x: 1.5, y: 1.5 }),
  ).toEqual({ x: 15, y: 8, width: 50, height: 15 });
});
