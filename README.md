# Basecamp - Personal Homepage

個人用ホームページ/ポートフォリオサイトを Next.js 16 (App Router) と TypeScript で構築したプロジェクトです。GitHub、Hatena Blog、Zenn、SoundCloud など 19+ のプラットフォームからのコンテンツを統合して表示します。**Firebase App Hosting (Cloud Run, asia-east1)** で稼働し、フィード JSON は GCS bucket `basecamp-feeds` (asia-northeast1) を runtime fetch します。

> 詳細は [`CLAUDE.md`](./CLAUDE.md) を参照 (この README は要点のみ)。

## 主要機能

- **マルチプラットフォーム統合**: GitHub、Hatena Blog、Zenn、SoundCloud、Booklog、Tenhou、FF14、Microblogからのコンテンツ表示
- **AI要約機能**: Google Gemini APIを使用した記事要約の自動生成
- **リアルタイム更新**: WebSocketを使用したTenhou統計のリアルタイム更新
- **認証システム**: Supabaseを使用したマイクロブログ機能
- **アクセシビリティ対応**: デジタル庁のベストプラクティスに基づく設計

## 開発環境のセットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

[http://localhost:3000](http://localhost:3000)でアプリケーションを確認できます。

## 利用可能なコマンド

```bash
# 開発
npm run dev              # 開発サーバー起動
npm run build            # プロダクションビルド
npm run start            # プロダクションサーバー起動
npm run lint             # ESLintでのコードチェック

# AI要約生成（GEMINI_API_KEYが必要）
npm run generate-summaries

# データベース・認証スクリプト（.env.localが必要）
npm run create-admin     # 管理者ユーザー作成
npm run check-supabase   # Supabase接続確認
npm run test-auth        # 認証フロー確認
```

## ドキュメント

詳細なドキュメントは `/docs` ディレクトリにあります：

- [**プロジェクト概要**](docs/README.md) - 詳細な機能説明とアーキテクチャ
- [**API ドキュメント**](docs/API.md) - APIエンドポイントの詳細
- [**コンポーネント ドキュメント**](docs/COMPONENTS.md) - Reactコンポーネントの構造
- [**カスタマイズ ガイド**](docs/CUSTOMIZATION.md) - プロジェクトのカスタマイズ方法
- [**要約機能ガイド**](docs/SUMMARIES.md) - AI要約機能の設定方法

## 設定

メイン設定は `app/lib/config.ts` で管理されています。

必要な環境変数 (本番は Secret Manager + `apphosting.yaml` で管理、ローカルは `.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase クライアント
- `SUPABASE_SERVICE_ROLE_KEY` - 管理者操作用
- `NAITA_SECRET` - naita 投稿エンドポイントの認証
- `GCS_BUCKET=basecamp-feeds` - 本番のみ。未設定だとローカル `public/data/` へ fs フォールバック
- `GEMINI_API_KEY` - GitHub Actions のみ (bio / diary 生成、Cloud Run には不要)

## デプロイ

main への push で Firebase App Hosting (`basecamp-web` backend) が自動ビルド & ロールアウト (Cloud Run, asia-east1)。データ更新は GitHub Actions cron が GCS に直接書き込み、サイトは Next.js ISR (5 分窓) で取得します。

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
