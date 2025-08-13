# Basecamp - Personal Homepage

Next.js 15を使用した個人用ホームページです。複数のプラットフォーム（GitHub、Hatena Blog、Zenn、SoundCloud、Booklog、Tenhou、FF14）からのコンテンツを統合し、Supabaseを使用したマイクロブログ機能も搭載しています。

## クイックスタート

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアプリケーションを確認できます。

## 主要機能

- **マルチプラットフォーム統合**: GitHub、Hatena Blog、Zenn、SoundCloud、Booklog、Tenhou、FF14からのコンテンツ表示
- **マイクロブログ**: Supabase認証を使用した個人ブログ機能
- **AI要約**: Gemini APIによる記事の自動要約生成
- **リアルタイム更新**: 天鳳統計のリアルタイム更新機能
- **レスポンシブデザイン**: モバイル・デスクトップ対応

## ドキュメント

詳細なドキュメントは [docs/index.md](index.md) を参照してください。

## 主要コマンド

```bash
npm run dev              # 開発サーバー起動
npm run build            # プロダクションビルド
npm run lint             # ESLintチェック
npm run generate-summaries  # AI要約生成
npm run create-admin     # 管理者ユーザー作成
npm run check-supabase   # Supabase接続チェック
```

## 環境変数

主要な環境変数（詳細は[カスタマイズガイド](CUSTOMIZATION.md)参照）：

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI要約機能
GEMINI_API_KEY=your_gemini_api_key
```

## ライセンス

MIT License

## 貢献

バグ報告や機能要望は、GitHubのIssueまたはプルリクエストでお願いします。
