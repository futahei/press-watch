import { describe, it, expect } from "vitest";
import { handleSummarize } from "../../src/lambda/summarizeArticleHandler.js";
import type {
  Summarizer,
  SummarizeInput,
  SummarizeResult,
} from "../../src/domain/summarizer.js";

/**
 * OpenAI を叩かないテスト用フェイク Summarizer。
 */
class FakeSummarizer implements Summarizer {
  async summarize(input: SummarizeInput): Promise<SummarizeResult> {
    return {
      summaryText: `SUMMARY: ${input.title}`,
      glossary: [
        {
          term: "PressWatch",
          reading: "プレスウォッチ",
          description: "プレスリリース要約サービス。",
        },
      ],
    };
  }
}

describe("summarizeArticleHandler.handleSummarize", () => {
  it("should return 400 when body is missing", async () => {
    const res = await handleSummarize({}, new FakeSummarizer());

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.message).toContain("リクエストボディ");
  });

  it("should return 400 when required fields are missing", async () => {
    const event = {
      body: JSON.stringify({
        // title がない
        companyName: "Example Corp.",
        url: "https://example.com/press/a1",
        body: "本文です。",
      }),
    };

    const res = await handleSummarize(event, new FakeSummarizer());

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.message).toContain("title");
  });

  it("should return 200 with summary and glossary when input is valid", async () => {
    const event = {
      body: JSON.stringify({
        title: "新製品リリースのお知らせ",
        companyName: "Example Corp.",
        url: "https://example.com/press/a1",
        body: "これはテスト用のプレスリリース本文です。",
        publishedAt: "2025-11-27T00:00:00Z",
      }),
    };

    const res = await handleSummarize(event, new FakeSummarizer());

    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.summaryText).toBe("SUMMARY: 新製品リリースのお知らせ");
    expect(Array.isArray(body.glossary)).toBe(true);
    expect(body.glossary[0].term).toBe("PressWatch");
  });
});
