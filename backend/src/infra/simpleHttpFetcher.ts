import { fetch as undiciFetch } from "undici";

export interface HttpFetchResult {
  status: number;
  ok: boolean;
  text: string;
}

/**
 * シンプルな HTTP GET フェッチャー。
 * - Node18/20 の fetch 互換 API として undici を使用
 * - ステータスコードを返しつつ本文を text で受け取る
 */
export async function simpleHttpGet(url: string): Promise<HttpFetchResult> {
  const res = await undiciFetch(url, {
    method: "GET",
    headers: {
      "User-Agent": "PressWatchCrawler/0.1",
    },
  });

  const text = await res.text();
  return {
    status: res.status,
    ok: res.ok,
    text,
  };
}
