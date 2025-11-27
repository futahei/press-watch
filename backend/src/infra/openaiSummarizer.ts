import OpenAI from "openai";
import type {
  Summarizer,
  SummarizeInput,
  SummarizeResult,
  GlossaryItem,
} from "../domain/summarizer.js";

/** デフォルトのモデル名（必要に応じて環境変数で上書き可） */
const DEFAULT_MODEL = process.env.OPENAI_SUMMARIZE_MODEL ?? "gpt-5-mini";

/** 要約時のオプション */
export interface SummarizeOptions {
  /** 出力の冗長さ。低め → 簡潔 / 高め → 詳細 */
  verbosity?: "low" | "medium" | "high";
  /** 推論の深さ・思考量の目安。軽め〜深めまで可 */
  reasoning_effort?: "minimal" | "low" | "medium" | "high";
}

export class OpenAiSummarizer implements Summarizer {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey?: string, modelName?: string) {
    const key = apiKey ?? process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error(
        "OPENAI_API_KEY が設定されていません。環境変数かコンストラクタ引数で API キーを渡してください。"
      );
    }
    this.client = new OpenAI({ apiKey: key });
    this.model = modelName ?? DEFAULT_MODEL;
  }

  async summarize(
    input: SummarizeInput,
    options?: SummarizeOptions
  ): Promise<SummarizeResult> {
    const { verbosity = "medium", reasoning_effort = "medium" } = options ?? {};

    const prompt = buildPrompt(input);

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: [
            "あなたは日本語の企業プレスリリースを要約するアシスタントです。",
            "Web サービス「PressWatch」で利用するため、次の要件で出力してください。",
            "",
            "1. 日本語で 3〜6 行程度の要約文（事実ベース）",
            "2. 技術的・業界的な専門用語があれば、用語集として整理",
            "",
            '出力は必ず次の JSON 形式 "のみ" を返してください。',
            '{"summaryText": "...", "glossary": [{"term": "...", "reading": "...", "description": "..."}]}',
          ].join("\n"),
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "PressWatchSummarizeResult",
          description:
            "プレスリリース要約および用語集の結果を表す JSON スキーマ",
          schema: {
            type: "object",
            properties: {
              summaryText: { type: "string" },
              glossary: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    term: { type: "string" },
                    reading: { type: ["string", "null"] },
                    description: { type: "string" },
                  },
                  required: ["term", "reading", "description"],
                  additionalProperties: false,
                },
              },
            },
            required: ["summaryText", "glossary"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
      verbosity,
      reasoning_effort,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI から空のレスポンスが返されました。");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
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
        term: typeof g?.term === "string" ? g.term : "",
        reading: typeof g?.reading === "string" ? g.reading : undefined,
        description: typeof g?.description === "string" ? g.description : "",
      }))
      .filter((g) => g.term && g.description);

    return {
      summaryText,
      glossary,
    };
  }
}

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
