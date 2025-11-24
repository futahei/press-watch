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

// 識別子（ID）の型
export type CompanyId = string;
export type GroupId = string;

/**
 * 企業ごとのプレスリリース監視設定。
 * - pressReleaseUrl: 監視対象の一覧ページ
 * - crawlConfig: HTML からリリース一覧を抽出するための設定
 */
export interface CompanyConfig {
  id: CompanyId;
  name: string;
  /**
   * 企業公式サイト or コーポレートサイトのURL（任意）。
   */
  homepageUrl?: string;
  /**
   * プレスリリース一覧ページのURL。
   */
  pressReleaseUrl: string;

  /**
   * HTML のどの部分から情報を取るかの設定。
   * 将来的に複数の type（simpleList / rssProxy / api など）を増やせるように union にしておく。
   */
  crawlConfig: SimpleListCrawlConfig;
}

/**
 * シンプルな「一覧ページから CSS セレクタで抜く」タイプのクローリング設定。
 */
export interface SimpleListCrawlConfig {
  type: "simpleList";
  /**
   * 1件のリリースを表す要素の CSS セレクタ。
   * 例: "ul.press-list > li"
   */
  itemSelector: string;

  /**
   * タイトルを抜き出すための CSS セレクタ（item 要素からの相対パス）。
   * 例: "a.title"
   */
  titleSelector: string;

  /**
   * 詳細ページURLを抜き出すための CSS セレクタ（通常は <a>）。
   * 例: "a.title"
   */
  urlSelector: string;

  /**
   * 公開日を抜き出すための CSS セレクタ（任意）。
   * 例: "time" / ".date" / "span.pubdate"
   */
  dateSelector?: string;

  /**
   * 日付文字列のパースフォーマット（任意）。
   * 例: "YYYY/MM/DD" / "YYYY-MM-DD" など。
   * パースライブラリは後で決める。
   */
  dateFormatHint?: string;

  /**
   * タイムゾーン（IANA 文字列）。例: "Asia/Tokyo"
   * 未指定なら "UTC" 扱い。
   */
  timezone?: string;

  /**
   * 一覧ページから最大何件まで取得するか。デフォルトは 50 件程度を想定。
   */
  maxItems?: number;
}

/**
 * グループ設定。
 * - groupId ごとに「どの企業IDを束ねるか」を管理する。
 */
export interface GroupConfig {
  id: GroupId;
  name: string;
  description?: string;
  companyIds: CompanyId[];
}

/**
 * あるグループの全企業をクロールした結果の集約。
 */
export interface GroupCrawlSnapshot {
  group: GroupConfig;
  /**
   * companyId ごとのスナップショット。
   */
  companySnapshots: Array<{
    company: CompanyConfig;
    articles: CrawledArticleSnapshot[];
  }>;
}
