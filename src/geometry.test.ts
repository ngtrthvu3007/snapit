import { expect, test } from "vitest";
import { applyDrag, hitHandle, isValidSelection, normalizeRect, settleSelection } from "./geometry";

const bounds = { x: 0, y: 0, w: 500, h: 500 };
const r = { x: 10, y: 10, w: 100, h: 50 };

test("normalizeRect handles right-to-left / bottom-to-top drags", () => {
  expect(normalizeRect(100, 80, 20, 10)).toEqual({ x: 20, y: 10, w: 80, h: 70 });
});

test("isValidSelection rejects clicks and tiny drags", () => {
  expect(isValidSelection({ x: 5, y: 5, w: 2, h: 50 })).toBe(false);
  expect(isValidSelection({ x: 5, y: 5, w: 3, h: 3 })).toBe(true);
});

test("hitHandle finds corners, inside and misses", () => {
  expect(hitHandle(r, 10, 10)).toBe("nw");
  expect(hitHandle(r, 110, 60)).toBe("se");
  expect(hitHandle(r, 60, 10)).toBe("n");
  expect(hitHandle(r, 60, 35)).toBe("move");
  expect(hitHandle(r, 300, 300)).toBe(null);
});

test("applyDrag move is clamped to bounds", () => {
  expect(applyDrag(r, "move", -50, 0, bounds)).toEqual({ x: 0, y: 10, w: 100, h: 50 });
  expect(applyDrag(r, "move", 1000, 1000, bounds)).toEqual({ x: 400, y: 450, w: 100, h: 50 });
});

test("applyDrag resize past the opposite edge flips and clamps", () => {
  // e-handle: x2 110 → -40, normalized -40..10, clamped 0..10
  expect(applyDrag(r, "e", -150, 0, bounds)).toEqual({ x: 0, y: 10, w: 10, h: 50 });
  expect(applyDrag(r, "se", 10, 20, bounds)).toEqual({ x: 10, y: 10, w: 110, h: 70 });
});

test("settleSelection keeps a valid result", () => {
  const r = { x: 1, y: 1, w: 50, h: 50 };
  expect(settleSelection(r, null)).toEqual(r);
});

test("settleSelection drops a click-sized new selection", () => {
  expect(settleSelection({ x: 1, y: 1, w: 1, h: 1 }, null)).toBeNull();
});

test("settleSelection reverts a resize that collapsed the selection", () => {
  const orig = { x: 1, y: 1, w: 50, h: 50 };
  expect(settleSelection({ x: 0, y: 1, w: 0, h: 50 }, orig)).toEqual(orig);
});
