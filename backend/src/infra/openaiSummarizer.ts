import OpenAI from "openai";
import type {
  Summarizer,
  SummarizeInput,
  SummarizeResult,
  GlossaryItem,
} from "../domain/summarizer.js";

const DEFAULT_MODEL = process.env.OPENAI_SUMMARIZE_MODEL ?? "gpt-4.1";

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

  async summarize(input: SummarizeInput): Promise<SummarizeResult> {
    const prompt = buildPrompt(input);

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: getSystemPrompt() },
        { role: "user", content: prompt },
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
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI から空のレスポンスが返されました。");
    }

    const parsed = JSON.parse(content);
    return {
      summaryText: parsed.summaryText as string,
      glossary: (parsed.glossary as any[]).map(
        (g): GlossaryItem => ({
          term: g.term,
          reading: g.reading ?? undefined,
          description: g.description,
        })
      ),
    };
  }
}

function buildPrompt(input: SummarizeInput): string {
  return [
    "以下は日本語の企業プレスリリース本文です。Web サービス「PressWatch」の読者向けに要約してください。",
    `会社名: ${input.companyName}`,
    `タイトル: ${input.title}`,
    input.publishedAt ? `公開日時: ${input.publishedAt}` : "",
    `URL: ${input.url}`,
    "",
    "本文:",
    input.body,
  ]
    .filter(Boolean)
    .join("\n");
}

function getSystemPrompt(): string {
  return [
    "あなたは日本語の企業プレスリリースを要約するアシスタントです。",
    "要約は事実ベースで、3〜6 行程度の日本語。",
    "必要があれば専門用語の用語集（term, reading, description）を付与。",
    "出力は JSON のみ。",
  ].join("\n");
}
