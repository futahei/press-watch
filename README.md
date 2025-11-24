# PressWatch

企業のプレスリリースを自動監視し、AI 要約・専門用語解説・通知まで行う Web サービスです。
RSS 非対応の企業サイトも対象にでき、複数企業を「グループ」としてまとめることで効率よく追跡できます。

## 📚 機能概要

- **プレスリリース自動監視（最大 半日に 1 回）**
- **AI 要約表示**
- **専門用語の自動解説**
- **企業のグループ管理**
- **ブラウザ Push 通知（Web Push / VAPID 使用）**
- **ライト / ダークテーマ切り替え（デフォルト system）**
- 管理者のみアクセス可能な設定ページ（パスワード + Cookie）

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
├── frontend/   # Next.js フロントエンド
├── backend/    # Lambda ロジック（TS）
└── infra/
    └── cdk/    # AWS CDK (DynamoDB / Lambda / API Gateway)
```

## 🔧 セットアップ

### 1. 依存インストール

```bash
pnpm install
```

### 2. フロントローカル起動

```bash
cd frontend
pnpm dev
```

⚠️ `NEXT_PUBLIC_API_BASE_URL` が未設定の場合、
フロントは **モックデータ（ローカルのダミー記事）で動作**します。

## 🧪 テスト

#### フロント

```bash
cd frontend
pnpm test
```

#### バックエンド

```bash
cd backend
pnpm test
```

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

| Lambda 名                | 説明                                     |
| ------------------------ | ---------------------------------------- |
| GetGroupArticlesFunction | 記事一覧取得 (GET /groups/{id}/articles) |
| PushSubscribeFunction    | Push 購読登録 (POST /push/subscribe)     |

### 3. API Gateway HTTP API

| メソッド | パス                         | Lambda                   |
| -------- | ---------------------------- | ------------------------ |
| GET      | `/groups/{groupId}/articles` | GetGroupArticlesFunction |
| POST     | `/push/subscribe`            | PushSubscribeFunction    |

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

## 🚀 デプロイ

（今後実装予定）

- フロント：S3 + CloudFront
- バックエンド：API Gateway + Lambda
- CI/CD：GitHub Actions（lint・test・cdk deploy）

## 🔮 今後のロードマップ

- 本物のクローラ導入（Node.js + Playwright? / Cheerio?）
- AI 要約生成（OpenAI API）
- 専門用語解説（LLM）
- 通知送信バッチ（EventBridge + Lambda）
- 管理設定ページ（管理者パスワード + Cookie 認証）
- 記事詳細ページ
- サービスワーカーでの Web Push サポート
