import { expect, test } from "vitest";
import { arrowHead, newShapeStack, type Shape, textShape } from "../src/shapes";

const verticalLine = (x: number): Shape => ({ tool: "line", color: "#f00", width: 3, points: [{ x, y: 0 }, { x, y: 10 }] });

test("arrowHead wings sit behind the tip, mirrored", () => {
  const [upperWing, lowerWing] = arrowHead({ x: 0, y: 0 }, { x: 100, y: 0 }, 10);
  expect(upperWing.x).toBeCloseTo(100 - 10 * Math.cos(Math.PI / 6));
  expect(lowerWing.x).toBeCloseTo(upperWing.x);
  expect(upperWing.y).toBeCloseTo(-lowerWing.y);
  expect(Math.abs(upperWing.y)).toBeGreaterThan(0);
});

test("undo removes the last shape and is a no-op when empty", () => {
  const stack = newShapeStack();
  stack.push(verticalLine(1));
  stack.push(verticalLine(2));
  stack.undo();
  expect(stack.items).toEqual([verticalLine(1)]);
  stack.undo();
  stack.undo();
  expect(stack.items).toEqual([]);
});

test("textShape ignores empty / whitespace text", () => {
  expect(textShape("", { x: 1, y: 1 }, "#f00")).toBeNull();
  expect(textShape("  \n", { x: 1, y: 1 }, "#f00")).toBeNull();
  expect(textShape("hi", { x: 1, y: 1 }, "#f00")).toEqual({
    tool: "text", color: "#f00", width: 18, points: [{ x: 1, y: 1 }], text: "hi",
  });
});
