import {
  PushSubscribeRequest,
  PushSubscribeResponse,
} from "../domain/models.js";
import { registerPushSubscription } from "./registerPushSubscription.js";
import type { HttpRequest, HttpResponse } from "./httpTypes.js";

export async function handlePushSubscribeHttp(
  req: HttpRequest
): Promise<HttpResponse> {
  if (req.method.toUpperCase() !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  if (!req.body) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Request body is required" }),
    };
  }

  let parsed: PushSubscribeRequest;
  try {
    parsed = JSON.parse(req.body) as PushSubscribeRequest;
  } catch {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Invalid JSON" }),
    };
  }

  // TODO: 必要になったら簡単なバリデーションを追加する
  const result: PushSubscribeResponse = await registerPushSubscription(parsed);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(result),
  };
}
