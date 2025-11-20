# PressWatch

**PressWatch** は、企業のプレスリリースを自動で監視し、
**AI による要約** と **専門用語の簡易解説** を提供する Web サービスです。

特に、**RSS 配信に対応していない企業サイト**を対象とし、
新しい記事が公開されるたびに自動検知して Web Push 通知を送ります。

## 🚀 特徴

### ✓ プレスリリースの自動監視

- 複数企業のプレスリリースページを定期チェック（最大 12 時間に 1 回）
- RSS 非対応サイトでも対応可能
- 新規記事のみを抽出して記録

### ✓ グループ機能

- 企業を任意のグループに分類  
  （例：製造業グループ、金融系グループ など）
- グループ別に新着記事を一覧表示

### ✓ AI による要約生成

- 長文のプレスリリースをコンパクトに要約
- ワンクリックで内容を把握できる

### ✓ 専門用語の自動抽出 & 解説

- 技術用語や業界用語を検出
- わかりやすい日本語で解説を表示

### ✓ ブラウザを閉じていても届く Web Push 通知

- Service Worker + VAPID による **本格 Web Push 対応**
- 新着記事をリアルタイムにお知らせ

### ✓ モダンで親しみやすい UI

- Next.js 製のシンプル・軽量な UI
- **ライト／ダークモード切替**（システム設定にも追従）

### ✓ 管理者限定の設定ページ

- サイト閲覧はログイン不要
- `/settings` や環境設定画面だけ管理者パスワード＋ Cookie で保護

## 🏗 アーキテクチャ概要

```txt
    +------------------------------+
    |        PressWatch UI         |
    |  Next.js / S3 / CloudFront   |
    +---------------+--------------+
                    |
                    v
    +------------------------------+
    |        API Gateway (REST)    |
    +---------------+--------------+
                    |
                    v
    +------------------------------+
    |        AWS Lambda (TS)       |
    |  - API Handlers              |
    |  - Crawler (Scheduled)       |
    |  - Web Push Sender           |
    +---------------+--------------+
                    |
                    v
    +------------------------------+
    |          DynamoDB            |
    |  - Articles                  |
    |  - Summaries                 |
    |  - TermExplanations          |
    |  - Groups / Companies        |
    |  - WebPushSubscriptions      |
    +------------------------------+

    +------------------------------+
    |        Service Worker        |
    |   (Web Push Subscription)    |
    +------------------------------+

```

## 🧰 技術スタック

### フロントエンド

- Next.js（App Router）
- TypeScript
- pnpm
- React
- Tailwind CSS（予定）
- Service Worker / Web Push API

### バックエンド

- AWS Lambda（TypeScript）
- API Gateway
- DynamoDB
- EventBridge（定期実行）
- pnpm
- Vitest（ユニットテスト）
- ESLint / Prettier

### CI/CD

- GitHub Actions
  - PR：lint / format / typecheck / unit test の実行（必須チェック）
  - main ブランチ push：自動デプロイ（S3/CF + Lambda）

## 📂 ディレクトリ構成（予定）

```txt
presswatch/
  frontend/ # Next.js フロント
    app/
      groups/[groupId]/page.tsx
      articles/[articleId]/page.tsx
    src/
      components/
      lib/
      tests/
    package.json

  backend/ # Lambda バックエンド（TS）
    src/
      domain/
        models.ts
        articleLogic.ts
      handlers/
        getGroup.ts
        getGroupArticles.ts
        getArticleDetail.ts
        adminLogin.ts
        pushSubscribe.ts
      crawler/
        crawlAllCompanies.ts
      tests/
        domain/
          articleLogic.test.ts
    package.json

  .github/
    workflows/
      ci.yml

  README.md
```

## 🛠 ローカル開発

### 1. リポジトリをクローン

```bash
git clone https://github.com/<YOUR-USER>/presswatch.git
cd presswatch
```

### 2. 依存関係インストール（pnpm）

フロント：

```bash
cd frontend
pnpm install
```

バックエンド：

```bash
cd backend
pnpm install
```

### 3. テスト実行

```bash
pnpm test
```

### Lint / フォーマットチェック

```bash
pnpm lint
pnpm format
```

## 🔮 開発ロードマップ

- [ ] Next.js フロントの初期実装
- [ ] ライト／ダークモード切替コンポーネント
- [ ] 管理者ログイン（パスワード＋ Cookie）
- [ ] グループ・企業の設定画面
- [ ] AI 要約機能の実装
- [ ] 用語抽出＆解説生成
- [ ] Web Push 購読登録 API
- [ ] クローラ（12h 間隔）
- [ ] AWS デプロイ設定（S3/CloudFront + Lambda）

## 📄 ライセンス

MIT License © 2024 PressWatch Developers

## 🙌 コントリビューション

PressWatch は 仕様駆動開発 に基づいて進めています。
Pull Request を行う場合は、事前に仕様変更・追加の意図が分かる形でお願いします。

PR は以下のチェックを通過する必要があります：

- lint
- format check
- typecheck
- unit tests

## 📬 お問い合わせ

改善点・アイデアなどあれば Issue を立ててください。
ようこそ PressWatch へ！
