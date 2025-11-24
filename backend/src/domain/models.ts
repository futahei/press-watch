export interface ExistingArticleRecord {
  /** 既に保存済みの記事のURL（URLで一意とみなす） */
  url: string;
  // 今後 id や companyId などを追加予定
}

export interface CrawledArticleSnapshot {
  /** クロールで取得した記事URL */
  url: string;
  /** クロール時に取得したタイトル */
  title: string;
  /** 公開日時（取得できない場合もある） */
  publishedAt?: string; // ISO 8601 文字列を想定
}

/**
 * DBに保存する前の「新規記事候補」。
 * 基本的には CrawledArticleSnapshot と同じだが、
 * 拡張の余地を残す。
 */
export interface NewArticleCandidate {
  url: string;
  title: string;
  publishedAt?: string;
}

/**
 * フロントエンドに返す記事のサマリ情報。
 * ArticleCard コンポーネントがそのまま表示に使える形にする。
 */
export interface ArticleSummary {
  id: string;
  companyName: string;
  title: string;
  url: string;
  publishedAt?: string;
  summaryText?: string;
  isNew?: boolean;
}

/**
 * グループ単位で記事一覧を返すレスポンス。
 */
export interface GetGroupArticlesResponse {
  groupId: string;
  articles: ArticleSummary[];
}

// Web Push 購読情報（DynamoDB に保存する想定）
export interface WebPushSubscription {
  /**
   * DynamoDB のパーティションキーとして使う ID。
   * 例: ハッシュ(endpoint) など。
   */
  id: string;

  /**
   * ブラウザから送られてくる PushSubscription の endpoint。
   */
  endpoint: string;

  /**
   * Web Push 暗号化鍵 (p256dh)。
   */
  p256dhKey: string;

  /**
   * 認証キー (auth)。
   */
  authKey: string;

  /**
   * この購読が有効なグループIDのリスト。
   * - 全グループ共通にするなら ["*"] のような特別値もあり
   */
  groupIds: string[];

  /**
   * User-Agent やブラウザ/OS 種別などのメタ情報（あれば便利）。
   */
  userAgent?: string;

  /**
   * 初回登録日時 (ISO文字列, UTC)。
   */
  createdAt: string;

  /**
   * 最終更新日時 (ISO文字列, UTC)。
   */
  updatedAt: string;

  /**
   * 無効化フラグ（Push 送信で410 Goneなどが返ってきたときに true にする）。
   */
  disabled?: boolean;
}

export interface PushSubscribeRequest {
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  groupIds: string[];
  userAgent?: string;
}

export interface PushSubscribeResponse {
  subscriptionId: string;
  groupIds: string[];
}

export interface PushUnsubscribeRequest {
  subscriptionId: string;
}

export interface PushUnsubscribeResponse {
  success: boolean;
}
