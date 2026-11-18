import { expect, test } from "vitest";
import { arrowHead, newShapeStack, type Shape, textShape } from "./shapes";

const line = (x: number): Shape => ({ tool: "line", color: "#f00", width: 3, points: [{ x, y: 0 }, { x, y: 10 }] });

test("arrowHead wings sit behind the tip, mirrored", () => {
  const [a, b] = arrowHead({ x: 0, y: 0 }, { x: 100, y: 0 }, 10);
  expect(a.x).toBeCloseTo(100 - 10 * Math.cos(Math.PI / 6));
  expect(b.x).toBeCloseTo(a.x);
  expect(a.y).toBeCloseTo(-b.y);
  expect(Math.abs(a.y)).toBeGreaterThan(0);
});

test("undo removes the last shape and is a no-op when empty", () => {
  const st = newShapeStack();
  st.push(line(1));
  st.push(line(2));
  st.undo();
  expect(st.items).toEqual([line(1)]);
  st.undo();
  st.undo();
  expect(st.items).toEqual([]);
});

test("textShape ignores empty / whitespace text", () => {
  expect(textShape("", { x: 1, y: 1 }, "#f00")).toBeNull();
  expect(textShape("  \n", { x: 1, y: 1 }, "#f00")).toBeNull();
  expect(textShape("hi", { x: 1, y: 1 }, "#f00")).toEqual({
    tool: "text", color: "#f00", width: 18, points: [{ x: 1, y: 1 }], text: "hi",
  });
});
