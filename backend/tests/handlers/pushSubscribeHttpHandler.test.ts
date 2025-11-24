import { describe, it, expect } from "vitest";
import { handlePushSubscribeHttp } from "../../src/handlers/pushSubscribeHttpHandler.js";
import type { HttpRequest } from "../../src/handlers/httpTypes.js";

const baseRequest: HttpRequest = {
  method: "POST",
  path: "/push/subscribe",
  headers: {
    "content-type": "application/json",
  },
  body: JSON.stringify({
    subscription: {
      endpoint: "https://example.com/endpoint/abc",
      keys: {
        p256dh: "p256dh-key",
        auth: "auth-key",
      },
    },
    groupIds: ["default"],
    userAgent: "Mozilla/5.0",
  }),
};

describe("handlePushSubscribeHttp", () => {
  it("POST /push/subscribe に対して 200 と subscriptionId を返す", async () => {
    const res = await handlePushSubscribeHttp(baseRequest);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as {
      subscriptionId: string;
      groupIds: string[];
    };
    expect(body.subscriptionId).toMatch(/^sub_/);
    expect(body.groupIds).toEqual(["default"]);
  });

  it("POST 以外のメソッドは 405 を返す", async () => {
    const res = await handlePushSubscribeHttp({
      ...baseRequest,
      method: "GET",
    });

    expect(res.statusCode).toBe(405);
  });

  it("body が空の場合は 400 を返す", async () => {
    const res = await handlePushSubscribeHttp({
      ...baseRequest,
      body: null,
    });

    expect(res.statusCode).toBe(400);
  });

  it("不正な JSON の場合は 400 を返す", async () => {
    const res = await handlePushSubscribeHttp({
      ...baseRequest,
      body: "{ invalid json",
    });

    expect(res.statusCode).toBe(400);
  });
});
