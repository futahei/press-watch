import type { ArticleRepository } from "../repository/articleRepository.js";
import type { SummarizeResult } from "../domain/summarizer.js";
import {
  generateArticleIdFromUrl,
  type ArticleDetail,
} from "../domain/articleStorage.js";

export interface SaveSummarizedArticleInput {
  groupId: string;
  companyId: string;
  companyName: string;
  title: string;
  url: string;
  publishedAt: string;
  summary: SummarizeResult;
}

export interface SaveSummarizedArticleOutput {
  articleId: string;
}

/**
 * クローラー/要約ジョブから呼ばれ、要約結果を DynamoDB に保存するユースケース。
 */
export async function saveSummarizedArticle(
  input: SaveSummarizedArticleInput,
  repository: ArticleRepository
): Promise<SaveSummarizedArticleOutput> {
  const articleId = generateArticleIdFromUrl(input.url);

  const article: ArticleDetail = {
    id: articleId,
    groupId: input.groupId,
    companyId: input.companyId,
    companyName: input.companyName,
    title: input.title,
    url: input.url,
    publishedAt: input.publishedAt,
    summaryText: input.summary.summaryText,
    glossary: input.summary.glossary.map((g) => ({
      term: g.term,
      description: g.description,
      reading: g.reading ?? undefined,
    })),
  };

  await repository.put(article);

  return { articleId };
}
