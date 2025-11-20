import {
  CrawledArticleSnapshot,
  ExistingArticleRecord,
  NewArticleCandidate,
} from "./models.js";

/**
 * 既存記事リストとクロール結果の差分から「新規記事候補」を抽出する。
 *
 * 仕様:
 * - 既存記事と同じ URL の記事は新規として返さない
 * - クロール結果内で URL が重複している場合、最初に登場したものを採用する
 * - 並び順:
 *   - publishedAt がある記事: 日付の新しい順
 *   - 次に、publishedAt がない記事: クロール順（元の順序）を維持
 */
export function detectNewArticles(
  existingArticles: ExistingArticleRecord[],
  crawledArticles: CrawledArticleSnapshot[]
): NewArticleCandidate[] {
  const existingUrlSet = new Set(existingArticles.map((a) => a.url));

  // URL重複を排除しつつ、新規だけを抽出
  const seenUrls = new Set<string>();
  const newCandidates: NewArticleCandidate[] = [];

  for (const article of crawledArticles) {
    if (existingUrlSet.has(article.url)) continue; // すでにDBにある
    if (seenUrls.has(article.url)) continue; // クロール結果内の重複

    seenUrls.add(article.url);
    newCandidates.push({
      url: article.url,
      title: article.title,
      publishedAt: article.publishedAt,
    });
  }

  // 並び替え: publishedAt あり → 降順、それ以外 → 後ろ
  const withDate: NewArticleCandidate[] = [];
  const withoutDate: NewArticleCandidate[] = [];

  for (const candidate of newCandidates) {
    if (candidate.publishedAt) {
      withDate.push(candidate);
    } else {
      withoutDate.push(candidate);
    }
  }

  withDate.sort((a, b) => {
    // ISO 8601 を想定しているので string 比較ではなく Date にする
    const da = new Date(a.publishedAt!).getTime();
    const db = new Date(b.publishedAt!).getTime();
    return db - da; // 新しいものを先頭に
  });

  return [...withDate, ...withoutDate];
}
