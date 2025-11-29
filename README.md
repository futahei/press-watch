# PressWatch

企業のプレスリリースを自動監視し、AI 要約・専門用語解説・通知まで行う Web サービスです。
RSS 非対応の企業サイトも対象にでき、複数企業を「グループ」としてまとめることで効率よく追跡できます。

## 📚 機能概要（現状）

- **記事一覧 / 記事詳細 API**（DynamoDB から取得）
- **要約 API `/summarize`**（保存なし）と **記事保存 API `/articles`**
- **簡易クロール → DynamoDB 保存 API**（`/crawl/{companyId}/save`）
- **企業グループ管理**（`/groups/{groupId}`）
- **ブラウザ Push 通知の購読登録 API**（配信は今後）
- フロントは **ライト / ダークテーマ**、NEW バッジ（公開 48h 以内）

## 🏗️ 技術スタック

### フロントエンド（Next.js 16 + React）

- Next.js App Router
- TypeScript
- Tailwind CSS
- Shadcn/UI
- Vitest + React Testing Library
- API 連携（フロント側で API Gateway を呼ぶ構成）

### バックエンド

- TypeScript（Node.js 20）
- AWS Lambda（NodejsFunction + esbuild）
- DynamoDB

### インフラ（AWS CDK v2）

- DynamoDB（PAY_PER_REQUEST）
- Lambda
- API Gateway HTTP API（CORS 対応）
- S3（フロントホスティング予定）
- CloudFront（CDN 配信予定）

## 📂 リポジトリ構成

```txt
press-watch/
├── frontend/         # Next.js フロントエンド
├── backend/          # Lambda ロジック（TS）
└── infra/
    └── cdk/          # AWS CDK (DynamoDB / Lambda / API Gateway)
```

## 🔧 セットアップ

### 1. 依存インストール

```bash
cd frontend && pnpm install
cd ../backend && pnpm install
cd ../infra/cdk && pnpm install
```

### 2. フロントローカル起動

```bash
cd frontend
pnpm dev
```

⚠️ `NEXT_PUBLIC_API_BASE_URL` が未設定の場合、
フロントは **モックデータ（ローカルのダミー記事）で動作**します。

## 🧪 テスト

### フロントテスト

```bash
cd frontend
pnpm test
```

### バックエンドテスト

```bash
cd backend
pnpm test
```

※ Node.js は Volta 管理の v20 を利用する前提。

## ☁️ インフラ構成（CDK）

### 1. DynamoDB

#### 📌 PressWatchArticles

| 属性名 | 型     | 備考                                     |
| ------ | ------ | ---------------------------------------- |
| pk     | string | `GROUP#<groupId>`                        |
| sk     | string | `PUBLISHED#<ISODate>#URL#<urlHash>`      |
| その他 | Map    | `title`, `companyName`, `summaryText` 等 |

用途：グループごとの記事一覧取得（Query）

#### 📌 PressWatchPushSubscriptions

| 属性名    | 型     | 備考                 |
| --------- | ------ | -------------------- |
| id        | string | `sub_xxxx` (UUID)    |
| endpoint  | string | Web Push endpoint    |
| keys.\*   | string | p256dh / auth        |
| groupIds  | list   | 購読しているグループ |
| userAgent | string | 任意                 |

用途：Web Push 通知

### 2. Lambda 関数

| Lambda 名                    | 説明                                                           |
| ---------------------------- | -------------------------------------------------------------- |
| GetGroupArticlesFunction     | 記事一覧取得 (GET /groups/{groupId}/articles)                 |
| GetArticleDetailFunction     | 記事詳細取得 (GET /groups/{groupId}/articles/{articleId})     |
| SaveArticleFunction          | 記事保存 (POST /articles)                                     |
| SummarizeArticleFunction     | 要約生成のみ (POST /summarize)                                |
| CrawlCompanyFunction         | 単体企業のクロール結果返却 (GET /crawl/{companyId})           |
| CrawlAndSaveFunction         | クロールして DynamoDB に保存 (POST /crawl/{companyId}/save)   |
| PushSubscribeFunction        | Push 購読登録 (POST /push/subscribe)                          |

### 3. API Gateway HTTP API

| メソッド     | パス                                      | Lambda                       |
| ------------ | ----------------------------------------- | ---------------------------- |
| GET          | `/groups/{groupId}/articles`              | GetGroupArticlesFunction     |
| GET          | `/groups/{groupId}/articles/{articleId}`  | GetArticleDetailFunction     |
| POST         | `/articles`                               | SaveArticleFunction          |
| POST         | `/summarize`                              | SummarizeArticleFunction     |
| GET          | `/crawl/{companyId}`                      | CrawlCompanyFunction         |
| POST / GET   | `/crawl/{companyId}/save`                 | CrawlAndSaveFunction         |
| POST         | `/push/subscribe`                         | PushSubscribeFunction        |

CORS 設定済み：Next.js のローカル/本番から利用可。

CDK 出力例：

```txt
Outputs:
  ApiEndpoint = https://xxxxxx.execute-api.ap-northeast-1.amazonaws.com
```

## 🔌 フロントと API の接続方法

フロント側の API は基本的に：

```env
NEXT_PUBLIC_API_BASE_URL/groups/{groupId}/articles
NEXT_PUBLIC_API_BASE_URL/push/subscribe
```

を呼びます。

### `.env.local` を作成

```bash
cd frontend
touch .env.local
```

内容：

```env
NEXT_PUBLIC_API_BASE_URL=
```

- 未設定の間は **フロントはモックデータで動作**します
- CDK デプロイ後に **ApiEndpoint** をここに入れると、自動で実 API に切り替わります

例：

```env
NEXT_PUBLIC_API_BASE_URL=https://abcd1234.execute-api.ap-northeast-1.amazonaws.com
```

## 🧪 開発フェーズでの動作（モックフォールバック）

フロント側 API クライアント (`src/lib/apiClient.ts`) の仕様：

- API URL 未設定 → **モックデータ返却**
- API 呼び出し失敗 → **モックデータにフォールバック**
- API 正常 → **リアル記事一覧を返却**

これにより、AWS へデプロイしなくても開発が進められます。

## 🔎 簡易クロール（検証用）

- 対象企業設定は `backend/src/infra/companyConfigs.ts`（例：`six-apart`）。
- API 例：`curl -X POST "https://<api-id>.execute-api.ap-northeast-1.amazonaws.com/crawl/six-apart/save?groupId=default"`
- 保存後、`/groups/{groupId}` で記事一覧・詳細を確認できます。

## 🚀 デプロイ

### バックエンド / インフラ（CDK）

```bash
cd infra/cdk
pnpm synth
pnpm cdk deploy
```

### フロント

（将来の S3+CloudFront 配信を想定。現状はローカル開発または別途ホスティング。）

## 🔮 今後のロードマップ

- Playwright 等による本格クロール
- 要約結果の自動保存＆一覧反映
- 通知送信バッチ（EventBridge + Lambda）
- 管理設定ページ（認証）
- Web Push 配信処理
