# Basecamp ドキュメンテーション

個人用ホームページBasecamp（デジタル庁のベストプラクティスに基づくアクセシブルな設計）の開発および利用のための包括的なドキュメントです。

## ドキュメント一覧

### 基本ドキュメント
- [**プロジェクト概要**](README.md) - プロジェクトの概要、インストール方法、主要機能の説明
- [**API ドキュメント**](API.md) - APIエンドポイントの詳細と利用方法
- [**コンポーネント ドキュメント**](COMPONENTS.md) - Reactコンポーネントの構造と使用方法
- [**カスタマイズ ガイド**](CUSTOMIZATION.md) - プロジェクトのカスタマイズ方法
- [**要約機能ガイド**](SUMMARIES.md) - 記事要約機能の設定と使用方法

### 機能別ガイド
- [**マイクロブログ設定**](microblog-setup.md) - マイクロブログ機能のセットアップ
- [**マイクロブログ ベストプラクティス**](microblog-best-practices.md) - マイクロブログ機能の効果的な使い方
- [**OAuth設定ガイド**](oauth-setup.md) - 認証システムのセットアップ
- [**Supabaseユーザー設定**](supabase-user-setup.md) - Supabaseユーザー管理の設定
- [**天鳳統合ガイド**](tenhou-integration.md) - 天鳳統計機能の設定
- [**天鳳リアルタイム更新ガイド**](tenhou-realtime-guide.md) - リアルタイム更新機能
- [**天鳳自動化ガイド**](tenhou-automation.md) - 天鳳データ自動取得の実装方法

### トラブルシューティング
- [**マイクロブログのトラブルシューティング**](troubleshooting-microblog.md) - よくある問題の解決方法

## プロジェクト概要

Basecampは、Next.js 15を利用して構築された個人用ホームページです。複数のプラットフォーム（GitHub、Hatena Blog、Zenn、SoundCloud、Booklog、Tenhou、FF14）からのコンテンツを統合し、Supabaseを使用したマイクロブログ機能も搭載しています。

デジタル庁のベストプラクティスに基づき、アクセシビリティに配慮したデザインを採用しています。

## 主要機能

- **マルチプラットフォーム統合**: GitHub、Hatena Blog、Zenn、SoundCloud、Booklog、Tenhou、FF14からのコンテンツ表示
- **マイクロブログ**: Supabase認証を使用した個人ブログ機能（CRUD操作、タグ機能、RSS配信）
- **AI要約**: Gemini APIによる記事の自動要約生成と表示
- **リアルタイム更新**: 天鳳統計のリアルタイム更新機能
- **レスポンシブデザイン**: モバイルからデスクトップまで対応
- **ダークモード対応**: システム設定に応じたテーマ切り替え
- **アクセシビリティ対応**: セマンティックなHTML構造と適切なアクセシビリティ属性

## クイックスタート

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開いてアプリケーションを確認できます。

## 開発コマンド

```bash
npm run dev              # 開発サーバー起動
npm run build            # プロダクションビルド
npm run lint             # ESLintチェック
npm run generate-summaries  # AI要約生成
npm run create-admin     # 管理者ユーザー作成
npm run check-supabase   # Supabase接続チェック
npm run test-auth        # 認証テスト
```

## アーキテクチャ

### API Routes（キャッシュ対応）
- `/api/github`: GitHub リポジトリ情報（1時間キャッシュ）
- `/api/hatena`: はてなブログ記事
- `/api/zenn`: Zenn記事
- `/api/booklog`: 読書記録
- `/api/tenhou`: 天鳳統計
- `/api/ff14`: FF14キャラクター情報
- `/api/microblog`: マイクロブログCRUD操作（認証必須）
- `/api/summaries`: AI生成要約

### 設定管理
- **メイン設定**: `app/lib/config.ts` - サイトメタデータと全プラットフォーム設定
- **Next.js設定**: `next.config.ts` - ESLint、画像最適化、外部ドメイン設定

### 認証・データベース
- **Supabase**: マイクロブログ、ユーザー認証、リアルタイム機能
- **Row Level Security (RLS)**: セキュアなデータアクセス
- **OAuth認証**: Supabase Authによるプロバイダー対応

## カスタマイズ

基本設定は `app/lib/config.ts` で編集できます。詳細なカスタマイズについては、[カスタマイズ ガイド](CUSTOMIZATION.md)を参照してください。

## デプロイ

Vercelへのデプロイに最適化されています。詳細については、[カスタマイズ ガイド](CUSTOMIZATION.md#デプロイの設定)を参照してください。

## ライセンス

MIT License

## 貢献

バグ報告や機能要望は、GitHubのIssueまたはプルリクエストでお願いします。
