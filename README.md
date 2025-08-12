# Basecamp - Personal Homepage

個人用ホームページ/ポートフォリオサイトをNext.js 15 (App Router) とTypeScriptで構築したプロジェクトです。GitHub、Hatena Blog、Zenn、SoundCloudなど複数のプラットフォームからのコンテンツを統合して表示します。

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

必要な環境変数：
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase プロジェクトURL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase 匿名キー
- `SUPABASE_SERVICE_ROLE_KEY` - 管理者操作用
- `GEMINI_API_KEY` - AI要約生成用

## デプロイ

このプロジェクトはVercelへのデプロイに最適化されています。

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
