/**
 * 開発用スクリプト: /summarize → /articles に流して DynamoDB に記事を投入する。
 *
 * 必要な環境変数:
 * - API_BASE_URL: API Gateway のベース URL（例: https://xxxx.execute-api.ap-northeast-1.amazonaws.com）
 * - OPENAI_API_KEY: summarize で使用する OpenAI API キー
 *
 * 使い方:
 *   pnpm tsx scripts/seedArticleFromSummarize.ts
 */
import { OpenAiSummarizer } from "../src/infra/openaiSummarizer.js";

const API_BASE_URL = process.env.API_BASE_URL;

async function main() {
  if (!API_BASE_URL) {
    throw new Error("API_BASE_URL が未設定です。環境変数に設定してください。");
  }

  const summarizer = new OpenAiSummarizer();

  // ここを好きなデータに差し替えて使う
  const articleInput = {
    groupId: "default",
    companyId: "company-1",
    companyName: "Example Corp.",
    title: "開発用テスト記事: PressWatch AI のお知らせ",
    url: "https://example.com/press/dev-seed",
    publishedAt: new Date().toISOString(),
    body: "これは開発用に DynamoDB に投入するためのダミー記事本文です。PressWatch の動作確認用です。これはテストデータなので、実際の記事内容とは関係ありません。",
  };

  console.log("[seed] calling /summarize with:", {
    title: articleInput.title,
    companyName: articleInput.companyName,
  });

  const summary = await summarizer.summarize({
    title: articleInput.title,
    companyName: articleInput.companyName,
    url: articleInput.url,
    publishedAt: articleInput.publishedAt,
    body: articleInput.body,
  });

  console.log(
    "[seed] summary generated. summaryText length:",
    summary.summaryText.length
  );

  const savePayload = {
    groupId: articleInput.groupId,
    companyId: articleInput.companyId,
    companyName: articleInput.companyName,
    title: articleInput.title,
    url: articleInput.url,
    publishedAt: articleInput.publishedAt,
    summaryText: summary.summaryText,
    glossary: summary.glossary,
  };

  const saveUrl = new URL("/articles", API_BASE_URL);
  console.log("[seed] POST /articles", saveUrl.toString());

  const res = await fetch(saveUrl.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(savePayload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `failed to save article: ${res.status} ${res.statusText} ${text}`
    );
  }

  const saved = await res.json();
  console.log("[seed] saved article:", saved);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
