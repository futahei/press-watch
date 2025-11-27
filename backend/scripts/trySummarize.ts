import { OpenAiSummarizer } from "../src/infra/openaiSummarizer.js";

async function main() {
  const summarizer = new OpenAiSummarizer();

  const result = await summarizer.summarize({
    title: "テスト用プレスリリース",
    companyName: "Example Corp.",
    url: "https://example.com/press/test",
    publishedAt: "2025-11-27T00:00:00Z",
    body: "ここにテスト用の本文を入れる。これはダミーのテキストです。",
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
