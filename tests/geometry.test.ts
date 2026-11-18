import { expect, test } from "vitest";
import {
  applyDrag,
  hitHandle,
  isValidSelection,
  rectFromPoints,
  settleSelection,
} from "../src/geometry";

const bounds = { x: 0, y: 0, width: 500, height: 500 };
const selection = { x: 10, y: 10, width: 100, height: 50 };
const point = (x: number, y: number) => ({ x, y });

test("rectFromPoints handles right-to-left / bottom-to-top drags", () => {
  expect(rectFromPoints(point(100, 80), point(20, 10))).toEqual({
    x: 20,
    y: 10,
    width: 80,
    height: 70,
  });
});

test("isValidSelection rejects clicks and tiny drags", () => {
  expect(isValidSelection({ x: 5, y: 5, width: 2, height: 50 })).toBe(false);
  expect(isValidSelection({ x: 5, y: 5, width: 3, height: 3 })).toBe(true);
});

test("hitHandle finds corners, edges, inside and misses", () => {
  expect(hitHandle(selection, point(10, 10))).toBe("nw");
  expect(hitHandle(selection, point(110, 60))).toBe("se");
  expect(hitHandle(selection, point(60, 10))).toBe("n");
  expect(hitHandle(selection, point(60, 35))).toBe("move");
  expect(hitHandle(selection, point(300, 300))).toBe(null);
});

test("applyDrag move is clamped to bounds", () => {
  expect(applyDrag(selection, "move", point(-50, 0), bounds)).toEqual({
    x: 0,
    y: 10,
    width: 100,
    height: 50,
  });
  expect(applyDrag(selection, "move", point(1000, 1000), bounds)).toEqual({
    x: 400,
    y: 450,
    width: 100,
    height: 50,
  });
});

test("applyDrag resize past the opposite edge flips and clamps", () => {
  // cạnh e: 110 → -40, lật thành -40..10, cắt còn 0..10
  expect(applyDrag(selection, "e", point(-150, 0), bounds)).toEqual({
    x: 0,
    y: 10,
    width: 10,
    height: 50,
  });
  expect(applyDrag(selection, "se", point(10, 20), bounds)).toEqual({
    x: 10,
    y: 10,
    width: 110,
    height: 70,
  });
});

test("settleSelection keeps a valid result", () => {
  const valid = { x: 1, y: 1, width: 50, height: 50 };
  expect(settleSelection(valid, null)).toEqual(valid);
});

test("settleSelection drops a click-sized new selection", () => {
  expect(settleSelection({ x: 1, y: 1, width: 1, height: 1 }, null)).toBeNull();
});

test("settleSelection reverts a resize that collapsed the selection", () => {
  const original = { x: 1, y: 1, width: 50, height: 50 };
  expect(settleSelection({ x: 0, y: 1, width: 0, height: 50 }, original)).toEqual(
    original,
  );
});
