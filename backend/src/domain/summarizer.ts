export interface SummarizeInput {
  /** 記事タイトル */
  title: string;
  /** 会社名 */
  companyName: string;
  /** 公開日時（ISO 文字列が望ましいが、厳密なフォーマットまでは強制しない） */
  publishedAt?: string;
  /** 記事の URL */
  url: string;
  /** 要約対象となる本文（HTML から抽出したプレーンテキスト想定） */
  body: string;
}

/**
 * 用語集の 1 項目。
 */
export interface GlossaryItem {
  term: string;
  /** 読み（任意） */
  reading?: string;
  /** 説明文 */
  description: string;
}

/**
 * 要約結果。
 */
export interface SummarizeResult {
  summaryText: string;
  glossary: GlossaryItem[];
}

/**
 * 要約サービスのインターフェース。
 * - 実装は OpenAI 版以外にも差し替えできるようにするための抽象。
 */
export interface Summarizer {
  summarize(input: SummarizeInput): Promise<SummarizeResult>;
}
