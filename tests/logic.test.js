import { describe, it, expect } from "vitest";
import { clamp, computeBrickRows, progressPercentage } from "../src/logic.js";

describe("logic helpers", () => {
  it("clamps values within bounds", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-2, 0, 10)).toBe(0);
    expect(clamp(12, 0, 10)).toBe(10);
    expect(clamp(7, 8, 2)).toBe(7); // invalid range stays untouched
  });

  it("computes brick rows with level caps", () => {
    expect(computeBrickRows(1, 5, 3)).toBe(5);
    expect(computeBrickRows(2, 5, 3)).toBe(6);
    expect(computeBrickRows(5, 5, 3)).toBe(8);
    expect(computeBrickRows(10, 5, 3)).toBe(8);
  });

  it("returns progress percent within 0-100 bounds", () => {
    expect(progressPercentage(100, 100)).toBe(0);
    expect(progressPercentage(100, 80)).toBe(20);
    expect(progressPercentage(100, 0)).toBe(100);
    expect(progressPercentage(0, 0)).toBe(0);
  });
});
