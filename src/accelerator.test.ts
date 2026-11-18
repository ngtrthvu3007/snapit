import { expect, test } from "vitest";
import { displayAccelerator, toAccelerator } from "./accelerator";

const key = (code: string, mods: Partial<Record<"metaKey" | "ctrlKey" | "altKey" | "shiftKey", boolean>> = {}) => ({
  code,
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  ...mods,
});

test("modifiers + key, in a fixed order, with platform names", () => {
  expect(toAccelerator(key("Digit2", { metaKey: true, shiftKey: true }), true)).toBe("Command+Shift+Digit2");
  expect(toAccelerator(key("KeyS", { ctrlKey: true, altKey: true }), false)).toBe("Control+Alt+KeyS");
  expect(toAccelerator(key("KeyS", { metaKey: true }), false)).toBe("Super+KeyS");
  expect(toAccelerator(key("KeyS", { altKey: true }), true)).toBe("Option+KeyS");
});

test("modifier-only presses are not a shortcut yet", () => {
  expect(toAccelerator(key("ShiftLeft", { shiftKey: true }), true)).toBeNull();
  expect(toAccelerator(key("MetaRight", { metaKey: true }), true)).toBeNull();
});

test("letters, digits and space need a modifier so typing isn't hijacked", () => {
  expect(toAccelerator(key("KeyA"), true)).toBeNull();
  expect(toAccelerator(key("Digit1"), false)).toBeNull();
  expect(toAccelerator(key("Space"), false)).toBeNull();
});

test("function keys and PrintScreen work alone", () => {
  expect(toAccelerator(key("F12"), true)).toBe("F12");
  expect(toAccelerator(key("PrintScreen"), false)).toBe("PrintScreen");
});

test("display form is readable", () => {
  expect(displayAccelerator("Command+Shift+Digit2")).toBe("Command + Shift + 2");
  expect(displayAccelerator("CommandOrControl+Shift+KeyS")).toBe("CommandOrControl + Shift + S");
  expect(displayAccelerator("PrintScreen")).toBe("PrintScreen");
});
