# Basecamp - Personal Homepage

## プロジェクト概要

Basecampは、Next.js 15を利用して構築された個人用ホームページです。このアプリケーションは、GitHub、Hatena Blog、Zenn、SoundCloudなど、複数のプラットフォームからのコンテンツを統合し、パーソナルな活動やコンテンツをシームレスに表示します。

デジタル庁のベストプラクティスに基づき、アクセシビリティに配慮したデザインを採用しています。

## インストールと開発環境のセットアップ

### 前提条件

- Node.js (v18 以上)
- npm、yarn、pnpm、または bun

### インストール手順

```bash
# リポジトリをクローン
git clone <repository-url>
cd basecamp

# 依存関係のインストール
npm install
# または
yarn install
# または
pnpm install
# または
bun install
```

### 開発サーバーの起動

```bash
npm run dev
# または
yarn dev
# または
pnpm dev
# または
bun dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開くとアプリケーションが表示されます。

## プロジェクト構造

```
basecamp/
├── app/                    # Next.js 13+ のApp Routerによるアプリケーションコード
│   ├── api/                # API Routes（GitHub, Hatena, Zenn等のデータ取得）
│   ├── components/         # Reactコンポーネント
│   │   ├── icons/          # アイコンコンポーネント
│   │   └── widgets/        # ウィジェットコンポーネント
│   ├── github/             # GitHubページ
│   ├── hatena/             # はてなブログページ
│   ├── lib/                # ユーティリティ関数、設定、型定義等
│   ├── soundcloud/         # SoundCloudページ
│   ├── zenn/               # Zennページ
│   ├── globals.css         # グローバルCSS
│   ├── layout.tsx          # ルートレイアウト
│   └── page.tsx            # トップページ
├── public/                 # 静的ファイル
│   ├── data/               # 静的データファイル
│   └── images/             # 画像ファイル
├── scripts/                # ビルドスクリプト等
├── next.config.mjs         # Next.js設定
├── tailwind.config.ts      # Tailwind CSS設定
└── tsconfig.json           # TypeScript設定
```

## 主要機能

1. **マルチプラットフォーム統合**：
   - GitHub リポジトリの表示
   - はてなブログの記事一覧
   - Zenn の記事一覧
   - SoundCloud の音楽プレイヤー

2. **レスポンシブデザイン**：
   - Tailwind CSS を利用した、モバイルからデスクトップまで対応したレイアウト
   - ダークモード対応

3. **パフォーマンス最適化**：
   - 動的インポート（Dynamic Import）による遅延ロード
   - Next.js の最適化機能を活用したパフォーマンス向上

4. **アクセシビリティ**：
   - 日本語フォント（Noto Sans JP）の使用
   - セマンティックなHTML構造
   - アクセシビリティ属性の適切な設定

## コンポーネント詳細

### ページコンポーネント

- **Home (app/page.tsx)**: メインページ、各プラットフォームのコンテンツを表示
- **GitHub (app/github/page.tsx)**: GitHub リポジトリの詳細ページ
- **Hatena (app/hatena/page.tsx)**: はてなブログ記事の詳細ページ
- **Zenn (app/zenn/page.tsx)**: Zenn 記事の詳細ページ
- **SoundCloud (app/soundcloud/page.tsx)**: SoundCloud の音楽プレイヤーページ

### 機能コンポーネント

- **Header (app/components/Header.tsx)**: ヘッダーナビゲーション
- **Footer (app/components/Footer.tsx)**: フッター情報
- **Sidebar (app/components/Sidebar.tsx)**: サイドバーウィジェット
- **GithubWidget (app/components/GithubWidget.tsx)**: GitHub情報を表示するウィジェット
- **HatenaBlogWidget (app/components/HatenaBlogWidget.tsx)**: はてなブログ情報を表示するウィジェット
- **SoundCloudWidget (app/components/SoundCloudWidget.tsx)**: SoundCloud情報を表示するウィジェット
- **XWidget (app/components/XWidget.tsx)**: Twitter/X情報を表示するウィジェット

### 基底コンポーネント

- **BaseWidget (app/components/widgets/BaseWidget.tsx)**: 基本的なウィジェットの構造を提供するコンポーネント
- **Layout (app/components/Layout.tsx)**: レイアウト共通コンポーネント

## API エンドポイント

BasecompはNext.jsのAPI Routesを利用して、以下の外部データを取得します：

1. **/api/github** (app/api/github/route.ts)
   - GitHub リポジトリ情報の取得
   - キャッシュ時間：1時間

2. **/api/hatena** (app/api/hatena/route.ts)
   - はてなブログの記事一覧の取得

3. **/api/zenn** (app/api/zenn/route.ts)
   - Zenn の記事一覧の取得

4. **/api/summaries** (app/api/summaries/route.ts)
   - 記事のサマリー情報の取得

## 設定オプション

設定は `app/lib/config.ts` で管理されています。主な設定項目：

- **siteTitle**: サイトのタイトル
- **siteDescription**: サイトの説明
- **profiles**: 各プラットフォームのユーザー名とURL
  - GitHub
  - Twitter
  - はてなブログ
  - SoundCloud
  - Zenn
- **apiEndpoints**: 内部APIエンドポイントの設定

## ビルドと本番環境へのデプロイ

### ビルド

```bash
npm run build
# または
yarn build
# または
pnpm build
# または
bun build
```

### 本番サーバー起動

```bash
npm run start
# または
yarn start
# または
pnpm start
# または
bun start
```

### Vercelへのデプロイ

このプロジェクトはVercelへのデプロイに最適化されています：

1. GitHubリポジトリをVercelにインポート
2. 環境変数を設定（必要に応じて）
3. デプロイボタンをクリック

または、Vercel CLIを使用：

```bash
npm install -g vercel
vercel
```

## カスタマイズ方法

### プロフィール情報の変更

`app/lib/config.ts` ファイルを編集し、各プラットフォームのユーザー名とURLを変更してください。

### スタイルのカスタマイズ

- グローバルスタイル: `app/globals.css`
- Tailwind設定: `tailwind.config.ts`

### 新しいコンテンツソースの追加

1. APIエンドポイントを `app/api/` ディレクトリに作成
2. 必要なコンポーネントを `app/components/` に追加
3. 該当するページコンポーネントを `app/` ディレクトリに作成
4. `app/lib/config.ts` に新しいサービス情報を追加

## ライセンス

このプロジェクトは [ライセンス名] のもとで公開されています。

## 貢献

バグ報告や機能要望は、GitHubのIssueまたはプルリクエストでお願いします。
