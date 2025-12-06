import { describe, it, expect, beforeEach } from "vitest";
import {
  fetchGroupArticles,
  fetchArticleDetail,
  fetchCompanies,
} from "@/lib/apiClient";

describe("apiClient mock fallback", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "";
  });

  it("fetchGroupArticles should return mock articles when API base is unset", async () => {
    const res = await fetchGroupArticles("default");
    expect(res.groupId).toBe("default");
    expect(res.articles.length).toBeGreaterThan(0);
  });

  it("fetchArticleDetail should return mock detail including glossary", async () => {
    const detail = await fetchArticleDetail("default", "a1");
    expect(detail).not.toBeNull();
    expect(detail?.id).toBe("a1");
    expect(detail?.glossary.length).toBeGreaterThan(0);
  });

  it("fetchCompanies should return empty array when API base is unset", async () => {
    const res = await fetchCompanies();
    expect(res).toEqual([]);
  });
});
