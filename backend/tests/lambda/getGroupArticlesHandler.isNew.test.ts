import { describe, it, expect, vi } from "vitest";
import { isNewWithinHours } from "../../src/lambda/getGroupArticlesHandler.js";

describe("getGroupArticlesHandler.isNewWithinHours", () => {
  it("returns true when within threshold", () => {
    const now = Date.now();
    const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();
    expect(isNewWithinHours(twoHoursAgo, 48)).toBe(true);
  });

  it("returns false when older than threshold", () => {
    const now = Date.now();
    const threeDaysAgo = new Date(now - 72 * 60 * 60 * 1000).toISOString();
    expect(isNewWithinHours(threeDaysAgo, 48)).toBe(false);
  });

  it("returns false for invalid or future dates", () => {
    expect(isNewWithinHours(undefined, 48)).toBe(false);
    expect(isNewWithinHours("invalid-date", 48)).toBe(false);
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    expect(isNewWithinHours(future, 48)).toBe(false);
  });
});
