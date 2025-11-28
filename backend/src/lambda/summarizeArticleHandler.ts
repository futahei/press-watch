import type {
  Summarizer,
  SummarizeInput,
  SummarizeResult,
} from "../domain/summarizer.js";
import { OpenAiSummarizer } from "../infra/openaiSummarizer.js";

/**
 * Lambda 本番用の Summarizer ファクトリ。
 */
function createSummarizer(): Summarizer {
  return new OpenAiSummarizer();
}

interface SummarizeRequestBody {
  title: string;
  companyName: string;
  url: string;
  publishedAt?: string;
  body: string;
}

interface SummarizeResponseBody extends SummarizeResult {}

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

export async function handleSummarize(event: any, summarizer: Summarizer) {
  console.log("[summarizeArticleHandler] event received", {
    hasBody: !!event?.body,
  });

  if (!event?.body) {
    return jsonResponse(400, {
      message: "リクエストボディがありません。",
    });
  }

  let parsedBody: unknown;

  try {
    parsedBody =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  } catch (error) {
    console.error(
      "[summarizeArticleHandler] JSON parse error:",
      (error as Error).message
    );
    return jsonResponse(400, {
      message: "リクエストボディの JSON パースに失敗しました。",
    });
  }

  const validation = validateRequestBody(parsedBody);
  if (!validation.ok) {
    console.warn("[summarizeArticleHandler] validation failed:", validation);
    return jsonResponse(400, { message: validation.message });
  }

  try {
    console.log(
      "[summarizeArticleHandler] call summarizer with",
      JSON.stringify({
        title: validation.value.title,
        companyName: validation.value.companyName,
      })
    );

    const result: SummarizeResult = await summarizer.summarize(
      validation.value
    );

    console.log("[summarizeArticleHandler] summarizer succeeded");

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

export const handler = async (event: any) => {
  const summarizer = createSummarizer();
  return handleSummarize(event, summarizer);
};
