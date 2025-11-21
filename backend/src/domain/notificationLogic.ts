import type { ArticleSummary } from "./models.js";

/**
 * 通知対象とすべき記事を選定する。
 *
 * 仕様:
 * - lastNotifiedAt が null の場合:
 *   - publishedAt が定義されている記事をすべて、新しい順に通知対象とする
 * - lastNotifiedAt がある場合:
 *   - publishedAt が lastNotifiedAt より後のものだけ通知対象とする
 * - 一度の実行で通知する件数には maxPerRun で上限をかける
 * - 通知候補が 1 件以上ある場合:
 *   - nextLastNotifiedAt は「通知候補に含まれる中で最も新しい publishedAt」
 * - 通知候補が 0 件の場合:
 *   - nextLastNotifiedAt は lastNotifiedAt をそのまま返す
 * - publishedAt が undefined の記事は通知対象から除外する
 */
export function decideArticlesToNotify(
  lastNotifiedAt: string | null,
  articles: ArticleSummary[],
  maxPerRun: number = 20
): {
  toNotify: ArticleSummary[];
  nextLastNotifiedAt: string | null;
} {
  // publishedAt のある記事だけを対象とする
  const candidates = articles.filter(
    (a) => typeof a.publishedAt === "string"
  ) as Array<ArticleSummary & { publishedAt: string }>;

  // 新しい順にソート
  candidates.sort((a, b) => {
    const da = new Date(a.publishedAt).getTime();
    const db = new Date(b.publishedAt).getTime();
    return db - da; // 新しいものを先頭に
  });

  let filtered: Array<ArticleSummary & { publishedAt: string }>;

  if (lastNotifiedAt === null) {
    filtered = candidates;
  } else {
    const lastTime = new Date(lastNotifiedAt).getTime();
    filtered = candidates.filter(
      (a) => new Date(a.publishedAt).getTime() > lastTime
    );
  }

  if (filtered.length === 0) {
    return {
      toNotify: [],
      nextLastNotifiedAt: lastNotifiedAt,
    };
  }

  const limited = filtered.slice(0, maxPerRun);

  const newest = limited[0].publishedAt;

  return {
    toNotify: limited,
    nextLastNotifiedAt: newest,
  };
}
