# マイクロブログ機能セットアップガイド

## 概要
X（旧Twitter）のようなマイクロブログ機能をSupabaseを使って実装しました。Markdownとコードブロックに対応しています。

## セットアップ手順

### 1. Supabaseプロジェクトの作成
1. [Supabase](https://supabase.com)にアクセス
2. 新しいプロジェクトを作成
3. プロジェクトのURLとAnon Keyを取得

### 2. 環境変数の設定
`.env.local`ファイルを作成し、以下を追加：
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_ADMIN_EMAIL=your_email@example.com
```

### 3. データベースの設定
1. SupabaseダッシュボードのSQL Editorを開く
2. `/supabase/schema.sql`の内容を実行
3. 認証設定でユーザーを作成（管理者用）

### 4. 開発環境での起動
```bash
npm install
npm run dev
```

## 機能
- **投稿作成・編集・削除**: 管理者のみ可能
- **Markdownサポート**: 見出し、リスト、リンクなど
- **コードハイライト**: ```で囲むとシンタックスハイライト
- **ハッシュタグ**: #タグで自動抽出
- **リアルタイム更新**: 新規投稿が即座に反映
- **無限スクロール**: 自動で追加読み込み

## 使い方
1. `/microblog`にアクセス
2. ログインボタンから管理者認証
3. テキストエリアに投稿内容を入力
4. Cmd/Ctrl + Enterで投稿

## コードブロックの書き方
\`\`\`javascript
console.log('Hello, World!');
\`\`\`

## トラブルシューティング
- **投稿できない**: 環境変数とSupabaseの設定を確認
- **認証エラー**: NEXT_PUBLIC_ADMIN_EMAILが正しいか確認
- **データが表示されない**: RLSポリシーが適用されているか確認