import { describe, it, expect } from "vitest";
import { registerPushSubscription } from "../../src/handlers/registerPushSubscription.js";
import type { PushSubscribeRequest } from "../../src/domain/models.js";

const baseReq: PushSubscribeRequest = {
  subscription: {
    endpoint: "https://example.com/endpoint/abc",
    keys: {
      p256dh: "p256dh-key",
      auth: "auth-key",
    },
  },
  groupIds: ["default"],
  userAgent: "Mozilla/5.0",
};

describe("registerPushSubscription", () => {
  it("新しい endpoint の購読を登録し、subscriptionId を返す", async () => {
    const res = await registerPushSubscription(baseReq);

    expect(res.subscriptionId).toMatch(/^sub_/);
    expect(res.groupIds).toEqual(["default"]);
  });

  it("同じ endpoint で再登録した場合は、上書きされ groupIds も更新される", async () => {
    const first = await registerPushSubscription(baseReq);

    const secondReq: PushSubscribeRequest = {
      ...baseReq,
      groupIds: ["manufacturing"],
    };

    const second = await registerPushSubscription(secondReq);

    // 同じ endpoint なので subscriptionId も同じはず
    expect(second.subscriptionId).toBe(first.subscriptionId);
    expect(second.groupIds).toEqual(["manufacturing"]);
  });
});
