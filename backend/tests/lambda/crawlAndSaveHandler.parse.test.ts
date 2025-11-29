import { describe, it, expect } from "vitest";
import { parsePublishedAtToIso } from "../../src/lambda/crawlAndSaveHandler.js";

describe("parsePublishedAtToIso", () => {
  it("和暦形式の日付をISOに変換できる", () => {
    const iso = parsePublishedAtToIso("2024年 12月 2日（月）");
    expect(iso).toBe("2024-12-01T15:00:00.000Z"); // JST→UTC
  });

  it("パースできない場合はundefined", () => {
    expect(parsePublishedAtToIso("not a date")).toBeUndefined();
    expect(parsePublishedAtToIso(undefined)).toBeUndefined();
  });
});
