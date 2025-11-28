import type {
  Summarizer,
  SummarizeInput,
  SummarizeResult,
} from "../domain/summarizer.js";
import { OpenAiSummarizer } from "../infra/openaiSummarizer.js";

/**
 * Lambda 本番用の Summarizer ファクトリ。
 * - テストではこのファイルの下の handleSummarize を直接呼び出し、
 *   フェイク Summarizer を注入することで OpenAI への依存を避ける。
 */
function createSummarizer(): Summarizer {
  return new OpenAiSummarizer();
}

/**
 * API リクエストのボディ形（PressWatch 用）。
 * - SummarizeInput とほぼ同じだが、バリデーション用に別途定義。
 */
interface SummarizeRequestBody {
  title: string;
  companyName: string;
  url: string;
  publishedAt?: string;
  body: string;
}

/**
 * API レスポンスの形。
 * - そのまま SummarizeResult を返しても良いが、将来拡張に備えてラップしておく。
 */
interface SummarizeResponseBody extends SummarizeResult {}

/**
 * 共通のレスポンス生成ヘルパー。
 */
function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
}

/**
 * 入力バリデーション。
 * - 必須: title, companyName, url, body
 */
function validateRequestBody(
  raw: any
): { ok: true; value: SummarizeInput } | { ok: false; message: string } {
  if (!raw || typeof raw !== "object") {
    return {
      ok: false,
      message: "リクエストボディは JSON オブジェクトである必要があります。",
    };
  }

  const { title, companyName, url, body, publishedAt } =
    raw as SummarizeRequestBody;

  if (typeof title !== "string" || !title.trim()) {
    return { ok: false, message: "title は必須です。" };
  }

  if (typeof companyName !== "string" || !companyName.trim()) {
    return { ok: false, message: "companyName は必須です。" };
  }

  if (typeof url !== "string" || !url.trim()) {
    return { ok: false, message: "url は必須です。" };
  }

  if (typeof body !== "string" || !body.trim()) {
    return { ok: false, message: "body は必須です。" };
  }

  const input: SummarizeInput = {
    title: title.trim(),
    companyName: companyName.trim(),
    url: url.trim(),
    body: body.trim(),
    publishedAt:
      typeof publishedAt === "string" && publishedAt.trim()
        ? publishedAt.trim()
        : undefined,
  };

  return { ok: true, value: input };
}

/**
 * 実ロジック本体。
 * - Summarizer を引数で受け取ることでテスト時に差し替え可能にしている。
 */
export async function handleSummarize(event: any, summarizer: Summarizer) {
  if (!event?.body) {
    return jsonResponse(400, {
      message: "リクエストボディがありません。",
    });
  }

  let parsedBody: unknown;

  try {
    parsedBody =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  } catch {
    return jsonResponse(400, {
      message: "リクエストボディの JSON パースに失敗しました。",
    });
  }

  const validation = validateRequestBody(parsedBody);
  if (!validation.ok) {
    return jsonResponse(400, { message: validation.message });
  }

  try {
    const result: SummarizeResult = await summarizer.summarize(
      validation.value
    );

    const responseBody: SummarizeResponseBody = {
      summaryText: result.summaryText,
      glossary: result.glossary,
    };

    return jsonResponse(200, responseBody);
  } catch (error) {
    console.error("[summarizeArticleHandler] summarize failed:", error);
    return jsonResponse(500, {
      message: "要約の生成に失敗しました。",
    });
  }
}

/**
 * AWS Lambda 用のエクスポート。
 * - CDK からこの handler 名を指定して利用する。
 */
export const handler = async (event: any) => {
  const summarizer = createSummarizer();
  return handleSummarize(event, summarizer);
};
