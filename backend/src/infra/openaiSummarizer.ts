import OpenAI from "openai";
import type {
  Summarizer,
  SummarizeInput,
  SummarizeResult,
  GlossaryItem,
} from "../domain/summarizer.js";

/**
 * デフォルトで利用するモデル。
 * 環境変数 OPENAI_SUMMARIZE_MODEL があればそちらを優先。
 */
const DEFAULT_MODEL = process.env.OPENAI_SUMMARIZE_MODEL ?? "gpt-5-mini";

/**
 * OpenAI API を用いた要約サービス実装。
 *
 * - 日本語のプレスリリースを 3〜6 行程度に要約
 * - 専門用語を抽出して用語集を生成
 * - 出力は JSON フォーマットを厳密に指定し、それをパースする
 */
export class OpenAiSummarizer implements Summarizer {
  private readonly client: OpenAI;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error(
        "OPENAI_API_KEY が設定されていません。環境変数かコンストラクタ引数で API キーを渡してください。"
      );
    }

    this.client = new OpenAI({
      apiKey: key,
    });
  }

  async summarize(input: SummarizeInput): Promise<SummarizeResult> {
    const prompt = buildPrompt(input);

    const response = await this.client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: [
            "あなたは日本語の企業プレスリリースを要約するアシスタントです。",
            "Web サービス「PressWatch」で利用するため、次の要件で出力してください。",
            "",
            "1. 日本語で 3〜6 行程度の要約文（マーケ寄りになりすぎず、事実ベースで）",
            "2. 技術的・業界的な専門用語があれば用語集として整理",
            "",
            '出力は必ず次の JSON 形式 "のみ" を返してください。',
            "コードブロックや説明文は一切書かないでください。",
            "",
            '{"summaryText": "...", "glossary": [{"term": "...", "reading": "...", "description": "..."}]}',
          ].join("\n"),
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 600,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI から空のレスポンスが返されました。");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      // 将来、ここでフォールバックの簡易パーサを入れてもよい
      throw new Error(
        `OpenAI レスポンスの JSON パースに失敗しました: ${(error as Error).message}`
      );
    }

    const summaryText =
      typeof parsed.summaryText === "string" ? parsed.summaryText : "";

    const glossaryRaw: any[] = Array.isArray(parsed.glossary)
      ? parsed.glossary
      : [];

    const glossary: GlossaryItem[] = glossaryRaw
      .map((g) => ({
        term: g?.term ? String(g.term) : "",
        reading: g?.reading ? String(g.reading) : undefined,
        description: g?.description ? String(g.description) : "",
      }))
      .filter((g) => g.term && g.description);

    return {
      summaryText,
      glossary,
    };
  }
}

/**
 * ユーザーに渡すプロンプト本文を組み立てる関数。
 * （将来テストしやすいように分離）
 */
function buildPrompt(input: SummarizeInput): string {
  return [
    "以下は日本語の企業プレスリリース本文です。",
    "Web サービス「PressWatch」の読者向けに、分かりやすく要約してください。",
    "",
    `会社名: ${input.companyName}`,
    `タイトル: ${input.title}`,
    `公開日時: ${input.publishedAt ?? "不明"}`,
    `URL: ${input.url}`,
    "",
    "### 本文",
    input.body,
  ].join("\n");
}
